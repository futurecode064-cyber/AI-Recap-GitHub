#!/usr/bin/env python3
"""Repair 2026-10-27 crest downloads: copy actual supplier PNGs onto the SAME origin.
This only changes export logo mappings and verified PNG assets; no editorial text or odds.
"""
import concurrent.futures
import hashlib
import io
import json
import pathlib
import re
import time
import urllib.parse
import urllib.request
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[1]
REPORT = json.loads((ROOT / "data/today.json").read_text(encoding="utf-8"))
assert REPORT["reportDate"] == "2026-10-27", "STOP: Daily report changed"
assert len(REPORT["matches"]) == 25, "STOP: Fixture set changed"
MAIN = ROOT / "main-export-logos.js"
BRAND = ROOT / "brand-export-data.js"
ASSETS = ROOT / "assets/brand-export-teams"
ASSETS.mkdir(parents=True, exist_ok=True)
orig_main = MAIN.read_text(encoding="utf-8")
orig_brand = BRAND.read_text(encoding="utf-8")

def js_object(source, key):
    match = re.search(r"const " + re.escape(key) + r"=(\{.*?\});", source, re.S)
    if not match:
        raise ValueError("Missing JS object: " + key)
    return json.loads(match.group(1))

main_map = js_object(orig_main, "teams")
brand_map = js_object(orig_brand, "teamFiles")
# Preserve identity: the same image URL can be used by multiple fixtures,
# and only already-published fixture field URLs are admissible.
source_url_team = {}
for match in REPORT["matches"]:
    for side in ("home", "away"):
        url = match.get(side + "CrestUrl", "")
        if not url:
            raise ValueError("Empty " + side + " crest for " + match["fixtureId"])
        source_url_team.setdefault(url, set()).add(match[side])

approved_hosts = {"cdn.footballnation.eu", "media.api-sports.io", "a.espncdn.com",
                  "images.fotmob.com", "cdn.jsdelivr.net", "assets.footylogos.com"}

def verified_png(raw, url):
    with Image.open(io.BytesIO(raw)) as image:
        image.load()
        if not (32 <= image.width <= 2400 and 32 <= image.height <= 2400):
            raise ValueError("Unexpected logo dimensions: " + url)
        picture = image.convert("RGBA")
        if not picture.getbbox():
            raise ValueError("Transparent/empty club crest: " + url)
        buf = io.BytesIO()
        picture.save(buf, "PNG", optimize=True)
        png = buf.getvalue()
        if not png.startswith(b"\x89PNG\r\n\x1a\n") or len(png) <= 120:
            raise ValueError("Not a valid PNG: " + url)
        return png

def valid_local(path):
    try:
        with Image.open(path) as image:
            image.verify()
        return True
    except (FileNotFoundError, OSError):
        return False

# Reuse a previously verified SAME-ORIGIN file when the current supplier URL
# is unchanged and already pinned. Re-download genuine new images otherwise.
def retrieve(item):
    url, names = item
    uri = urllib.parse.urlparse(url)
    if uri.scheme != "https" or uri.hostname not in approved_hosts:
        raise RuntimeError("Unapproved origin for team crest " + ",".join(names))
    filename = hashlib.sha256(url.encode("utf-8")).hexdigest()[:16] + ".png"
    dest = ASSETS / filename
    if valid_local(dest):
        return url, filename, "reused"
    last_error = None
    for attempt in range(3):
        try:
            headers = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
                       "Accept": "image/avif,image/webp,image/apng,image/png,image/*;q=0.8,*/*;q=0.5",
                       "Referer": "https://footballnation.eu/" if uri.hostname == "cdn.footballnation.eu" else "https://www.google.com/"}
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=16) as response:
                raw = response.read(2_500_000)
            dest.write_bytes(verified_png(raw, url))
            return url, filename, "downloaded"
        except Exception as e:
            last_error = e
            time.sleep(attempt + 1)
    # An existing cached crest for the SAME club (from a historical daily report)
    # is allowed; do not substitute a similarly-named or unrelated team.
    for old_date in ("2026-10-26", "2026-10-22", "2026-10-21", "2026-10-20",
                     "2026-10-19", "2026-10-18", "2026-10-17", "2026-10-16",
                     "2026-10-15", "2026-10-14", "2026-10-13", "2026-10-12", "2026-10-11"):
        archive = ROOT / "data/archive" / (old_date + ".json")
        if not archive.is_file():
            continue
        prior = json.loads(archive.read_text(encoding="utf-8"))
        for fixture in prior.get("matches", []):
            for side in ("home", "away"):
                if fixture.get(side) not in names:
                    continue
                prior_url = fixture.get(side + "CrestUrl")
                prior_file = main_map.get(prior_url)
                if prior_file and valid_local(ROOT / prior_file):
                    dest.write_bytes((ROOT / prior_file).read_bytes())
                    return url, filename, "same-club-archived-cache:" + fixture.get(side)
    raise RuntimeError("NO VALID AUTHENTIC CREST for " + ",".join(names) +
                       " source=" + url + " error=" + str(last_error))

items = [(url, names) for url, names in source_url_team.items()]
completed = []
failures = []
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
    futures = {pool.submit(retrieve, item): item for item in items}
    for future in concurrent.futures.as_completed(futures):
        try:
            entry = future.result()
            completed.append(entry)
            print("OK", entry[2], entry[0], flush=True)
        except Exception as exc:
            failures.append(str(exc))
            print("FAILED", str(exc), flush=True)

# Don't discard successfully obtained assets if a supplier is temporarily down.
for url, filename, _ in completed:
    main_map[url] = "assets/brand-export-teams/" + filename
    brand_map[url] = filename

def rewrite(path, original, field, mapping):
    pattern = r"(const " + re.escape(field) + r"=)\{.*?\};"
    updated, found = re.subn(pattern,
                             lambda m: m.group(1) + json.dumps(mapping, ensure_ascii=False, separators=(",", ":")) + ";",
                             original, count=1, flags=re.S)
    assert found == 1
    path.write_text(updated, encoding="utf-8")

rewrite(MAIN, orig_main, "teams", main_map)
rewrite(BRAND, orig_brand, "teamFiles", brand_map)
for url, filename, _ in completed:
    assert valid_local(ASSETS / filename)
    assert main_map[url].endswith(filename) and brand_map[url] == filename
summary = {"date": REPORT["reportDate"], "allOriginalSourceUrls": len(items),
           "cachedGenuineCrests": len(completed), "failed": len(failures),
           "failedDetails": failures}
(ROOT / "data" / "2026-10-27-logo-repair-receipt.json").write_text(
    json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("LOGO REPAIR RECEIPT", json.dumps(summary, ensure_ascii=False), flush=True)
if failures:
    raise SystemExit("Remaining uncacheable genuine club crests; do not claim complete.")

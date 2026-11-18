#!/usr/bin/env python3
"""Safely mirror Floot CDN APKs to this GitHub Pages origin.

CDN response filenames can lose their .apk extension on Windows. This script
downloads only verified release entries, then switches the store and update
manifest to local, explicitly named .apk files. It never modifies APK bytes.
Run during the portal deployment, before the Pages artifact is uploaded.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import sys
import tempfile
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STORE = ROOT / "portal/apps"
HTML_FILE = STORE / "index.html"
MANIFEST_FILE = STORE / "latest.json"
PAGES_APPS = "https://futurecode064-cyber.github.io/AI-Recap-GitHub/apps/"
CDN_HOST = "futurecodeaistudio.floot.app"
MAX_SIZE = 35 * 1024 * 1024

# Download button key -> stable release-manifest ID.
KEY_TO_ID = {
    "video-cutter": "auto-video-cutter",
    "daily-money": "daily-money",
    "medicine-reminder": "medicine-reminder",
    "ai-astrology": "ai-astrology",
    "kids-learning": "kids-learning",
    "safety-guide": "safety-guide",
    "el-nino": "el-nino",
}
ANCHOR_RE = re.compile(
    r'(?P<prefix><a\b[^>]*class="download"[^>]*data-app-key="(?P<key>[^"]+)"[^>]*href=")'
    r'(?P<url>[^"]+)(?P<suffix>")',
    re.DOTALL,
)
UUID_PREFIX = re.compile(
    r"^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}-",
    re.IGNORECASE,
)


def cdn_apk(url: str) -> bool:
    parts = urllib.parse.urlsplit(url)
    return (
        parts.scheme == "https"
        and parts.hostname == CDN_HOST
        and parts.port is None
        and parts.path.startswith("/_cdn/static/")
        and parts.path.endswith(".apk")
        and not parts.query
        and not parts.fragment
    )


def validate_apk(path: Path, expected_sha: str, expected_size: int) -> None:
    if path.stat().st_size != expected_size:
        raise ValueError(f"{path.name}: expected {expected_size} bytes, got {path.stat().st_size}")
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for piece in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(piece)
    if digest.hexdigest().lower() != expected_sha.lower():
        raise ValueError(f"{path.name}: SHA-256 mismatch")
    if not zipfile.is_zipfile(path):
        raise ValueError(f"{path.name}: downloaded data is not an APK/ZIP archive")
    with zipfile.ZipFile(path) as archive:
        members = set(archive.namelist())
        if "AndroidManifest.xml" not in members or not any(n.endswith(".dex") for n in members):
            raise ValueError(f"{path.name}: missing AndroidManifest.xml or DEX")


def get_apk(url: str, output: Path, expected_size: int) -> None:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "FutureCode-APK-Release-Verification/1.0", "Accept": "application/octet-stream,*/*"},
    )
    with urllib.request.urlopen(req, timeout=60) as response, output.open("wb") as target:
        if getattr(response, "status", 200) != 200:
            raise ValueError(f"HTTP {response.status} for {url}")
        total = 0
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            total += len(chunk)
            if total > MAX_SIZE or total > expected_size:
                raise ValueError(f"Exceeded APK size limit for {url}")
            target.write(chunk)


def main() -> None:
    html = HTML_FILE.read_text(encoding="utf-8")
    manifest_source = MANIFEST_FILE.read_text(encoding="utf-8")
    manifest = json.loads(manifest_source)
    apps = {app["id"]: app for app in manifest["apps"]}
    mirrors = {}
    seen = set()

    for match in ANCHOR_RE.finditer(html):
        key, source_url = match.group("key"), match.group("url")
        if key not in KEY_TO_ID or not cdn_apk(source_url):
            continue
        if key in seen:
            raise ValueError(f"Duplicate CDN download button: {key}")
        seen.add(key)
        app = apps[KEY_TO_ID[key]]
        if app.get("file") != source_url:
            raise ValueError(f"Store URL differs from release manifest for {key}")
        filename = UUID_PREFIX.sub("", Path(urllib.parse.urlsplit(source_url).path).name)
        if not filename.endswith(".apk") or not re.fullmatch(r"[A-Za-z0-9._-]+", filename):
            raise ValueError(f"Invalid APK filename: {filename}")
        expected_sha = app.get("sha256", "")
        expected_size = app.get("sizeBytes")
        if not re.fullmatch(r"[a-fA-F0-9]{64}", expected_sha) or not isinstance(expected_size, int):
            raise ValueError(f"No trusted release checksum and byte count for {key}")
        if expected_size < 20000 or expected_size > MAX_SIZE:
            raise ValueError(f"Unreasonable APK size for {key}: {expected_size}")
        mirrors[key] = dict(source=source_url, filename=filename, sha=expected_sha, size=expected_size)

    if not mirrors:
        print("APK mirror: no unmigrated Floot CDN download links.")
        return

    # All-or-nothing: verify every mirror before changing any user-visible link.
    with tempfile.TemporaryDirectory(prefix="apk-mirror-") as tmpdir:
        verified = {}
        for key, target in sorted(mirrors.items()):
            filename = target["filename"]
            local = STORE / filename
            if local.exists():
                validate_apk(local, target["sha"], target["size"])
                print(f"VERIFIED existing {filename}")
                continue
            tmp = Path(tmpdir) / filename
            print(f"Mirroring {key}: {filename}", flush=True)
            get_apk(target["source"], tmp, target["size"])
            validate_apk(tmp, target["sha"], target["size"])
            verified[filename] = tmp
            print(f"VERIFIED {filename} ({target['size']} bytes, SHA-256)", flush=True)

        rewritten = set()

        def rewrite_download(match: re.Match) -> str:
            key, source = match.group("key"), match.group("url")
            if key not in mirrors or source != mirrors[key]["source"]:
                return match.group(0)
            if key in rewritten:
                raise ValueError(f"Duplicate store entry for {key}")
            rewritten.add(key)
            filename = mirrors[key]["filename"]
            return match.group("prefix") + filename + '" download="' + filename + '"'

        updated_html = ANCHOR_RE.sub(rewrite_download, html)
        if rewritten != set(mirrors):
            raise ValueError("Missing expected store button during rewrite")

        updated_json = manifest_source
        for target in mirrors.values():
            source = target["source"]
            if source not in updated_json:
                raise ValueError("Expected CDN URL not found in latest.json")
            updated_json = updated_json.replace(source, PAGES_APPS + target["filename"])
        json.loads(updated_json)  # Preserve exact original formatting, prove valid JSON.

        for filename, temporary in verified.items():
            os.replace(temporary, STORE / filename)

        HTML_FILE.write_text(updated_html, encoding="utf-8")
        MANIFEST_FILE.write_text(updated_json, encoding="utf-8")
        print(f"SUCCESS: {len(mirrors)} APKs have same-origin .apk names and SHA-256 verification.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"APK MIRROR BLOCKED (no store links changed): {exc}", file=sys.stderr)
        raise

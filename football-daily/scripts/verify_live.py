#!/usr/bin/env python3
"""Verify the public deployment against a saved source snapshot, without credentials.

This measures publication and route behavior, not visitor totals or account usage.
"""
import argparse
import concurrent.futures
import hashlib
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

WORKER_MARKER = "selective-routes-v1"


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def digest(data):
    return hashlib.sha256(data).hexdigest()


def probes(root):
    routes = json.loads((root / "_routes.json").read_text())
    import re

    def worker(path):
        def matches(rule):
            return re.fullmatch(".*".join(map(re.escape, rule.split("*"))), path)
        return any(map(matches, routes["include"])) and not any(map(matches, routes["exclude"]))

    paths = {"app.js", "odds.js", "styles.css", "news-section.js", "data/today.json"}
    report = json.loads((root / "data/today.json").read_text())
    day = report["reportDate"]
    for path in [f"data/archive/{day}.json", f"data/odds/{day}.json",
                 f"data/odds/evening/{day}.json", "data/news/latest.json"]:
        if (root / path).is_file():
            paths.add(path)
    # Every shared-data brand is checked, including future brand directories.
    for index in root.glob("*/index.html"):
        if "data-football-brand-name=" not in index.read_text():
            continue
        folder = index.parent.relative_to(root).as_posix()
        for name in ["index.html", "odds.html", "brand.css", "brand.js"]:
            if (root / folder / name).is_file():
                paths.add(folder + "/" + name)
    checks = []
    for relative in sorted(paths):
        url_path = "/" + relative
        # Pages redirects *.html to its canonical URL; fetch the canonical path.
        if relative.endswith("/index.html"):
            url_path = url_path[:-10]
        elif relative.endswith(".html"):
            url_path = url_path[:-5]
        checks.append({"path": url_path, "status": 200,
                       "sha256": digest((root / relative).read_bytes()), "worker": worker(url_path)})
    for path in ["/", "/index", "/index/", "/odds", "/editor/", "/editor/news.html",
                 "/future-code-journal/android/stats"]:
        checks.append({"path": path, "status": 302, "login": True, "worker": True})
    for path in ["/api/editor/state", "/api/editor/news", "/future-code-journal/android/api/stats"]:
        checks.append({"path": path, "status": 401, "worker": True})
    return checks


def check(base, spec):
    url = base.rstrip("/") + spec["path"] + "?fc-live-check=" + str(time.time_ns())
    request = urllib.request.Request(url, headers={"Cache-Control": "no-cache", "User-Agent": "FutureCodePublicationVerifierBot/1.0"})
    started = time.monotonic()
    try:
        try:
            response = urllib.request.build_opener(NoRedirect).open(request, timeout=20)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            status, headers, body = response.code, response.headers, response.read()
        seen_worker = headers.get("X-Football-Worker") == WORKER_MARKER
        errors = []
        if status != spec["status"]:
            errors.append(f"HTTP {status}, expected {spec['status']}")
        if seen_worker != spec["worker"]:
            errors.append("Worker route mismatch")
        if "sha256" in spec and digest(body) != spec["sha256"]:
            errors.append("live content differs from saved source")
        if spec.get("login") and not headers.get("Location", "").startswith("/login?"):
            errors.append("owner login redirect missing")
        return {"path": spec["path"], "ok": not errors, "status": status,
                "worker": seen_worker, "ms": round((time.monotonic() - started) * 1000), "errors": errors}
    except (OSError, ValueError) as error:
        return {"path": spec["path"], "ok": False, "errors": [type(error).__name__]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--base", default="https://future-code-football-daily.pages.dev")
    parser.add_argument("--attempts", type=int, default=1)
    parser.add_argument("--interval", type=float, default=15)
    parser.add_argument("--source-commit", default="local-snapshot")
    parser.add_argument("--summary", type=Path)
    args = parser.parse_args()
    specs = probes(args.root)
    for attempt in range(max(1, args.attempts)):
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            results = list(executor.map(lambda spec: check(args.base, spec), specs))
        passed = all(result["ok"] for result in results)
        print(json.dumps({"sourceCommit": args.source_commit, "liveVerified": passed,
                          "attempt": attempt + 1, "checks": results}, ensure_ascii=False), flush=True)
        if passed:
            break
        if attempt + 1 < args.attempts:
            time.sleep(max(0, args.interval))
    if args.summary:
        with args.summary.open("a") as out:
            out.write(f"\n### Football publication\n\nSaved source: `{args.source_commit}`\n\n")
            out.write(f"Live verified: **{'PASS' if passed else 'FAIL — source save is not live publication'}**\n\n")
            out.write("| Path | HTTP | Worker | Source / access check |\n|---|---:|---|---|\n")
            for result in results:
                out.write(f"| `{result['path']}` | {result.get('status', 'error')} | {result.get('worker', '?')} | {'PASS' if result['ok'] else '; '.join(result['errors'])} |\n")
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())

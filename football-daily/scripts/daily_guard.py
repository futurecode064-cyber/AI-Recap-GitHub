#!/usr/bin/env python3
"""Future Code Football: safe daily rollover and freshness audit.

No fabricated fixtures, odds or picks. Runs in standard-library Python only.
The professional report is created by the scheduled ChatGPT/GitHub publisher.
"""
import argparse
import datetime as dt
import json
import sys
from pathlib import Path
from zoneinfo import ZoneInfo

REPORT = Path(__file__).resolve().parents[1] / "data" / "today.json"
LEAGUES = {"Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1", "Championship"}
today = dt.datetime.now(ZoneInfo("Asia/Yangon")).date().isoformat()


def read_report():
    try:
        report = json.loads(REPORT.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"Invalid or missing report: {exc}", file=sys.stderr)
        sys.exit(2)
    if not isinstance(report, dict):
        print("Invalid report: must be a JSON object", file=sys.stderr)
        sys.exit(2)
    return report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["rollover", "audit"])
    args = parser.parse_args()
    report = read_report()

    if args.mode == "rollover":
        if report.get("reportDate") == today:
            print(f"Already set for {today}; preserving current report.")
            return
        new_report = {
            "reportDate": today,
            "published": False,
            "matches": [],
            "noFixturesLeagues": []
        }
        REPORT.write_text(json.dumps(new_report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Rolled stale report to unpublished placeholder for {today}.")
        return

    errors = []
    if report.get("reportDate") != today:
        errors.append(f"reportDate={report.get('reportDate')!r}, expected {today!r}")
    if report.get("published") is not True:
        errors.append("published is not true")
    matches = report.get("matches")
    if not isinstance(matches, list):
        errors.append("matches is not an array")
    no_fixtures = report.get("noFixturesLeagues")
    if not isinstance(no_fixtures, list):
        errors.append("noFixturesLeagues is not an array")
    if isinstance(matches, list) and isinstance(no_fixtures, list):
        if len(matches) == 0 and not LEAGUES.issubset(set(str(x) for x in no_fixtures)):
            errors.append("No previews and all six leagues are not explicitly confirmed to have no fixtures")
        if matches:
            missing = [
                idx for idx, m in enumerate(matches, start=1)
                if not isinstance(m, dict) or not m.get("home") or not m.get("away")
                or not (m.get("analysisParagraphs") or m.get("analysis"))
            ]
            if missing:
                errors.append(f"Matches missing teams or editorial analysis at index: {missing}")
    if errors:
        print("DAILY REPORT CHECK FAILED:")
        for err in errors:
            print(f" - {err}")
        sys.exit(1)
    print(f"OK: {today}, {len(matches)} previews, published=True")


if __name__ == "__main__":
    main()

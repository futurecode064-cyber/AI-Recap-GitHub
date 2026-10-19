#!/usr/bin/env python3
"""Future Code Football: safe daily rollover and freshness audit.

No fabricated fixtures, odds or picks. Runs in standard-library Python only.
The professional report is created by the scheduled ChatGPT/GitHub publisher.
"""
import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path
from zoneinfo import ZoneInfo

REPORT = Path(__file__).resolve().parents[1] / "data" / "today.json"
LEAGUES = {
    "Premier League", "Championship", "League One", "La Liga", "La Liga 2",
    "Serie A", "Serie B", "Bundesliga", "2. Bundesliga", "Ligue 1", "Ligue 2",
    "FA Cup", "EFL Cup", "Coppa Italia", "Copa del Rey", "DFB-Pokal",
    "Coupe de France", "UEFA Champions League", "UEFA Europa League",
    "UEFA Conference League", "UEFA Nations League", "FIFA World Cup",
    "FIFA World Cup Qualifying", "UEFA Euro", "UEFA Euro Qualifying"
}
LEAGUE_STANDINGS = {
    "Premier League": 20, "Championship": 24, "League One": 24,
    "La Liga": 20, "La Liga 2": 22, "Serie A": 20, "Serie B": 20,
    "Bundesliga": 18, "2. Bundesliga": 18, "Ligue 1": 18, "Ligue 2": 18
}
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
        previous_date = report.get("reportDate", "")
        try:
            valid_date = dt.date.fromisoformat(previous_date).isoformat() == previous_date
        except (ValueError, TypeError):
            valid_date = False
        if valid_date and previous_date < today and report.get("published") is True:
            archive = REPORT.parent / "archive" / f"{previous_date}.json"
            archive.parent.mkdir(parents=True, exist_ok=True)
            if not archive.exists():
                archive.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
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
            # Guard the requested regular prose format and BOTH teams' actual league records.
            # This only checks the data schema, not the accuracy of the cited sports sources.
            require_structured_standings = today >= "2026-10-12"
            missing = []
            invalid_standings = []
            wrong_format = []
            wrong_special_endings = []
            unsupported_odds = []
            for idx, match in enumerate(matches, start=1):
                if not isinstance(match, dict) or not match.get("home") or not match.get("away"):
                    missing.append(idx)
                    continue
                preview = match.get("dailyPreviewText")
                if not isinstance(preview, str) or len(preview.strip()) < 150:
                    missing.append(idx)
                elif today == "2026-10-15" and match.get("league") == "UEFA Conference League":
                    # User-provided 18 Conference articles are verbatim, including
                    # their independently bold predicted score pairs and closing text.
                    if ("\n" in preview or preview.count("**") != 4 or
                        not re.search(r"ခန့်မှန်းရလဒ်ကတော့\s*\*\*[^*]+\*\* ဖြစ်ပါတယ်။$", preview)):
                        wrong_format.append(idx)
                elif (match.get("userPreviewVerbatim") or {}).get("exactCopy") is True:
                    # User-authorized journal copy takes precedence over older single-bold templates.
                    # Keep formatting/content intact while guarding against missing or cut articles.
                    if ("\n" in preview or not preview.endswith("။**") or
                        len(preview.strip()) < 300 or
                        re.search(r"ခန့်မှန်း\\s*ဂိုးရလဒ်", preview)):
                        wrong_format.append(idx)
                elif today >= "2026-10-17" and (match.get("previewJournalist") or {}).get("status") == "owner_approved_published":
                    if ("\n" in preview or len(preview.strip()) < 300 or
                        not preview.endswith("။**") or
                        re.search(r"ခန့်မှန်း\\s*ဂိုးရလဒ်", preview)):
                        wrong_format.append(idx)
                elif ("\n\n" in preview or preview.count("**") != 2 or
                      not re.search(r"\\*\\*[^*]+\\s*ကို ရွေးချယ်ပါတယ်။\\*\\*$", preview) or
                      re.search(r"ဖြစ်နိုင်တဲ့\\s*ဂိုးရလဒ်|ခန့်မှန်း\\s*ဂိုးရလဒ်", preview)):
                    wrong_format.append(idx)
                    wrong_format.append(idx)
                if match.get("specialChoice") is True:
                    paragraphs = match.get("specialAnalysisParagraphs")
                    if (not isinstance(paragraphs, list) or not paragraphs or
                        not isinstance(paragraphs[-1], str) or
                        not re.search(r"\*\*[^*]+\s*ကို ရွေးချယ်ပါတယ်။\*\*$", paragraphs[-1])):
                        wrong_special_endings.append(idx)
                if require_structured_standings and match.get("league") in LEAGUE_STANDINGS:
                    for side in ("home", "away"):
                        record = match.get(f"{side}Standing")
                        if not isinstance(record, dict) or not all(
                            isinstance(record.get(k), int) and not isinstance(record.get(k), bool)
                            for k in ("played", "wins", "draws", "losses", "points", "position")
                        ):
                            invalid_standings.append(f"{idx}:{side}")
                        elif (
                            record["played"] != record["wins"] + record["draws"] + record["losses"]
                            or record["points"] < 0 or record["position"] < 1
                            or record["position"] > LEAGUE_STANDINGS[match["league"]]
                        ):
                            invalid_standings.append(f"{idx}:{side}")
                    if not match.get("standingsSourceUrl"):
                        invalid_standings.append(f"{idx}:source")
                # Warn, but don't manufacture missing odds. Confirm triplet and source together.
                odds = [match.get("homeOdds"), match.get("drawOdds"), match.get("awayOdds")]
                if any(v is not None for v in odds) and (
                    not all(v is not None for v in odds) or
                    not match.get("oddsProvider") or not match.get("oddsSourceUrl")
                ):
                    unsupported_odds.append(idx)
            if missing:
                errors.append(f"Matches lacking teams or full Burmese daily preview text: {missing}")
            if wrong_format:
                errors.append(f"Preview format incorrect: preserve user-uploaded 15 Oct Conference prose; elsewhere use a single bold pick: {wrong_format}")
            if wrong_special_endings:
                errors.append(f"Special Choice articles must end on the direct pick, with no trailing notes: {wrong_special_endings}")
            if invalid_standings:
                errors.append(f"Missing/invalid verified standings for BOTH sides (played, W-D-L, pts, pos, source): {invalid_standings}")
            if unsupported_odds:
                errors.append(f"1X2 odds require all three prices and a bookmaker source: {unsupported_odds}")
    if errors:
        print("DAILY REPORT CHECK FAILED:")
        for err in errors:
            print(f" - {err}")
        sys.exit(1)
    print(f"OK: {today}, {len(matches)} previews, published=True")


if __name__ == "__main__":
    main()

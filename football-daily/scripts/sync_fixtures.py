#!/usr/bin/env python3
"""Key-free verified football fixture snapshots for the static website.

Uses the same public ESPN scoreboards already employed by sync_scores.py.
This is fixtures/results ONLY; it never writes editorial articles or odds.
Failure is fail-closed: incomplete source responses do not overwrite snapshots.
"""
from __future__ import annotations
import datetime as dt
import json
import sys
from pathlib import Path
from sync_scores import LEAGUES, API, TZ, request, players, when, name, score, done, state

ROOT = Path(__file__).resolve().parents[1] / "data"
VALID = {"scheduled", "live", "finished"}


def event_to_match(event, league):
    sides = players(event)
    home = sides.get("home")
    away = sides.get("away")
    kick = when(event.get("date"))
    if not (home and away and kick and name(home) and name(away) and event.get("id")):
        return None
    kick = kick.astimezone(TZ)
    venue = (event.get("competitions") or [{}])[0].get("venue") or {}
    typ = state(event)
    match = {
        "league": league,
        "home": name(home),
        "away": name(away),
        "kickoffYangon": kick.strftime("%H:%M · %d %b"),
        "kickoffUtc": kick.astimezone(dt.timezone.utc).isoformat().replace("+00:00", "Z"),
        "venue": venue.get("fullName") or "",
        "homeCrestUrl": home.get("team", {}).get("logo", ""),
        "awayCrestUrl": away.get("team", {}).get("logo", ""),
        "espnEventId": str(event["id"]),
        "matchSourceUrl": f'https://www.espn.com/soccer/match/_/gameId/{event["id"]}',
        "fixtureOnly": True,
        "specialChoice": False
    }
    hg, ag = score(home), score(away)
    if done(event) and hg is not None and ag is not None:
        match.update(status="finished", finalScore=f"{hg}-{ag}")
    elif typ.get("state") == "in" and hg is not None and ag is not None:
        match.update(status="live", liveScore=f"{hg}-{ag}")
    else:
        match["status"] = "scheduled"
    return match, kick.date()


def main():
    today = dt.datetime.now(TZ).date()
    dates = [today - dt.timedelta(days=1), today, today + dt.timedelta(days=1)]
    days_utc = sorted({day + dt.timedelta(days=n) for day in dates for n in (-1, 0, 1)})
    snapshots = {day: {} for day in dates}
    failures = []
    for league, slug in LEAGUES.items():
        for utc_day in days_utc:
            url = f"{API}/{slug}/scoreboard?dates={utc_day:%Y%m%d}"
            response = request(url)
            if not isinstance(response.get("events"), list):
                failures.append(f"{slug}:{utc_day}")
                continue
            for event in response["events"]:
                converted = event_to_match(event, league)
                if not converted:
                    continue
                match, local_day = converted
                if local_day in snapshots:
                    snapshots[local_day][f"{league}:{match['espnEventId']}"] = match
    if failures:
        raise SystemExit("Incomplete ESPN responses; no fixture files changed: " + ", ".join(failures))

    directory = ROOT / "fixtures"
    directory.mkdir(parents=True, exist_ok=True)
    for day in dates:
        matches = sorted(snapshots[day].values(), key=lambda m: (m["kickoffUtc"], m["league"], m["home"]))
        fixture = {
            "reportDate": day.isoformat(),
            "fixtureSnapshot": True,
            "matches": matches,
            "noFixturesLeagues": [
                league for league in LEAGUES if not any(m["league"] == league for m in matches)
            ]
        }
        path = directory / f"{day.isoformat()}.json"
        serialized = json.dumps(fixture, ensure_ascii=False, indent=2) + "\n"
        if not path.exists() or path.read_text(encoding="utf-8") != serialized:
            path.write_text(serialized, encoding="utf-8")
        print(f"{day}: {len(matches)} verified fixtures/results")


if __name__ == "__main__":
    main()

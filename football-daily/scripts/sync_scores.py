#!/usr/bin/env python3
"""Verify and enrich existing football previews using ESPN's public score API.

Only confirmed completed games enter last-five/H2H and final-score fields.
Never fabricate fixtures, odds, picks or Burmese editorial content.
"""
from __future__ import annotations
import concurrent.futures as futures
import datetime as dt
import json
import re
import sys
import time
import unicodedata
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

DATA = Path(__file__).resolve().parents[1] / "data"
TZ = ZoneInfo("Asia/Yangon")
API = "https://site.api.espn.com/apis/site/v2/sports/soccer"
# Supported public ESPN competition identifiers. Coverage varies by event and season.
# Other sources (AiScore/LiveScore/official results) remain valid at editorial review.
LEAGUES = {
    "Premier League":"eng.1", "Championship":"eng.2", "League One":"eng.3",
    "La Liga":"esp.1", "La Liga 2":"esp.2",
    "Serie A":"ita.1", "Serie B":"ita.2",
    "Bundesliga":"ger.1", "2. Bundesliga":"ger.2",
    "Ligue 1":"fra.1", "Ligue 2":"fra.2",
    "FA Cup":"eng.fa", "EFL Cup":"eng.league_cup",
    "Coppa Italia":"ita.coppa_italia", "Copa del Rey":"esp.copa_del_rey",
    "DFB-Pokal":"ger.dfb_pokal", "Coupe de France":"fra.coupe_de_france",
    "UEFA Champions League":"uefa.champions",
    "UEFA Europa League":"uefa.europa",
    "UEFA Conference League":"uefa.europa.conf",
    "UEFA Nations League":"uefa.nations", "FIFA World Cup":"fifa.world",
    "FIFA World Cup Qualifying":"fifa.worldq",
    "UEFA Euro":"uefa.euro", "UEFA Euro Qualifying":"uefa.euroq"
}
ALIASES = {"roma":"as roma","rennes":"stade rennais","auxerre":"aj auxerre",
           "deportivo la coruna":"deportivo","koln":"fc cologne"}
CACHE = {}

def norm(value):
    value = unicodedata.normalize("NFKD",str(value or "")).casefold()
    value = "".join(c for c in value if not unicodedata.combining(c))
    value = " ".join(re.sub(r"[^a-z0-9 ]+"," ",value).split())
    return ALIASES.get(value,value)

def request(url):
    if url in CACHE:return CACHE[url]
    req=urllib.request.Request(url,headers={"Accept":"application/json",
      "User-Agent":"FutureCodeFootballDaily/1.0"})
    for attempt in range(2):
        try:
            with urllib.request.urlopen(req,timeout=13) as response:
                value=json.load(response)
            if not isinstance(value,dict):raise ValueError("Invalid JSON")
            CACHE[url]=value
            return value
        except Exception as error:
            if attempt:
                print("Source unavailable:",url,str(error),file=sys.stderr)
                CACHE[url]={}
                return {}
            time.sleep(0.6)
    return {}

def when(value):
    try:return dt.datetime.fromisoformat(str(value).replace("Z","+00:00"))
    except (ValueError,TypeError):return None

def competition(event):
    games=event.get("competitions") or []
    return games[0] if games else {}

def players(event):
    return {p.get("homeAway"):p for p in competition(event).get("competitors",[])
            if p.get("homeAway") in ("home","away")}

def name(player):return (player or {}).get("team",{}).get("displayName","")
def score(player):
    value=(player or {}).get("score")
    if isinstance(value,dict):value=value.get("value",value.get("displayValue"))
    return int(str(value)) if re.fullmatch(r"\d+",str(value)) else None

def state(event):
    return (competition(event).get("status") or event.get("status") or {}).get("type") or {}

def done(event):return state(event).get("completed") is True

def single_result(event,team_id):
    if not done(event):return None
    sides=players(event);h=sides.get("home");a=sides.get("away")
    hg,ag=score(h),score(a);d=when(event.get("date"))
    if not (h and a and d and hg is not None and ag is not None):return None
    if str(h.get("id"))==str(team_id):
        return {"opponent":name(a),"teamGoals":hg,"opponentGoals":ag,"venueSide":"home",
                "date":d.astimezone(TZ).date().isoformat(),
                "sourceUrl":f'https://www.espn.com/soccer/match/_/gameId/{event["id"]}'}
    if str(a.get("id"))==str(team_id):
        return {"opponent":name(h),"teamGoals":ag,"opponentGoals":hg,"venueSide":"away",
                "date":d.astimezone(TZ).date().isoformat(),
                "sourceUrl":f'https://www.espn.com/soccer/match/_/gameId/{event["id"]}'}
    return None

def team_schedule(league,team_id,season):
    return request(f"{API}/{league}/teams/{team_id}/schedule?season={season}&limit=200").get("events") or []

def verified_history(event,league):
    sides=players(event);h=sides.get("home");a=sides.get("away")
    cutoff=when(event.get("date"))
    if not h or not a or not cutoff:return [],[],[]
    hid,aid=str(h.get("id")),str(a.get("id"))
    season=cutoff.year if cutoff.month>=7 else cutoff.year-1
    def earlier(items):
        return [e for e in items if when(e.get("date")) and when(e["date"])<cutoff and done(e)]
    with futures.ThreadPoolExecutor(max_workers=2) as pool:
        x=pool.submit(team_schedule,league,hid,season)
        y=pool.submit(team_schedule,league,aid,season)
        home=earlier(x.result());away=earlier(y.result())
    home_prev=None
    if len(home)<5:
        home_prev=earlier(team_schedule(league,hid,season-1));home+=home_prev
    if len(away)<5:away+=earlier(team_schedule(league,aid,season-1))
    h5=[r for e in sorted(home,key=lambda e:e["date"],reverse=True) if (r:=single_result(e,hid))][:5]
    a5=[r for e in sorted(away,key=lambda e:e["date"],reverse=True) if (r:=single_result(e,aid))][:5]
    history=list(home)
    for yr in range(season-1,max(season-19,2005),-1):
        matches=[e for e in history if
          {str((players(e).get("home") or {}).get("id")),str((players(e).get("away") or {}).get("id"))}=={hid,aid}]
        if len(matches)>=5:break
        if yr==season-1 and home_prev is not None:continue
        history+=earlier(team_schedule(league,hid,yr))
    h2h=[]
    for e in sorted(history,key=lambda e:e["date"],reverse=True):
        s=players(e);hh=s.get("home");aa=s.get("away")
        if not hh or not aa or {str(hh.get("id")),str(aa.get("id"))}!={hid,aid}:continue
        hg,ag=score(hh),score(aa)
        if hg is None or ag is None:continue
        h2h.append({"date":when(e["date"]).astimezone(TZ).date().isoformat(),
                    "home":name(hh),"away":name(aa),
                    "homeGoals":hg,"awayGoals":ag,
                    "sourceUrl":f'https://www.espn.com/soccer/match/_/gameId/{e["id"]}'})
        if len(h2h)>=5:break
    return h5,a5,h2h

def fetch_games(day, selected_leagues):
    # Allow the report's late-night Myanmar kickoffs on the following local day.
    dates=[day+dt.timedelta(days=n) for n in (-1,0,1)]
    tasks=[(league,f"{API}/{LEAGUES[league]}/scoreboard?dates={d:%Y%m%d}")
           for league in selected_leagues if league in LEAGUES for d in dates]
    result={k:{} for k in selected_leagues if k in LEAGUES}
    with futures.ThreadPoolExecutor(max_workers=6) as pool:
        jobs={pool.submit(request,url):league for league,url in tasks}
        for job in futures.as_completed(jobs):
            league=jobs[job]
            for e in job.result().get("events",[]):
                if e.get("id") and players(e):result[league][str(e["id"])]=e
    return {league:list(records.values()) for league,records in result.items()}

def match_event(match,games,day):
    candidates=[]
    for e in games:
        p=players(e);date=when(e.get("date"))
        if not p or not date:continue
        if norm(name(p.get("home")))!=norm(match.get("home")):continue
        if norm(name(p.get("away")))!=norm(match.get("away")):continue
        local=date.astimezone(TZ).date()
        if day<=local<=day+dt.timedelta(days=1):candidates.append(e)
    return candidates[0] if len(candidates)==1 else None

def enrich(match,e,slug):
    sides=players(e)
    match["espnEventId"]=str(e["id"])
    match["matchSourceUrl"]=f'https://www.espn.com/soccer/match/_/gameId/{e["id"]}'
    hg,ag=score(sides.get("home")),score(sides.get("away"))
    if done(e) and hg is not None and ag is not None:
        match["status"]="finished"
        match["finalScore"]=f"{hg}-{ag}"
        match.pop("liveScore",None)
    elif state(e).get("state")=="in" and hg is not None and ag is not None:
        match["status"]="live"
        match["liveScore"]=f"{hg}-{ag}"
    # Keep the publisher's Burmese commentary, predictions and odds untouched.
    check_day=dt.datetime.now(TZ).date().isoformat()
    if match.get("historyCheckedOn")!=check_day and not all(isinstance(match.get(k),list) and len(match[k])>=5 for k in
               ("homeLastFive","awayLastFive","headToHead")):
        home,away,h2h=verified_history(e,slug)
        match["historyCheckedOn"]=check_day
        if home:match["homeLastFive"]=home
        if away:match["awayLastFive"]=away
        if h2h:match["headToHead"]=h2h
        if home or away or h2h:
            match["historySourceUrl"]=f"https://www.espn.com/soccer/league/_/name/{slug}"

def update(path,games):
    if not path.exists():return 0
    original=path.read_text(encoding="utf-8")
    payload=json.loads(original)
    if payload.get("published") is not True or not isinstance(payload.get("matches"),list):return 0
    date=dt.date.fromisoformat(payload["reportDate"])
    count=0
    for m in payload["matches"]:
        if not isinstance(m,dict) or m.get("league") not in LEAGUES:continue
        event=match_event(m,games.get(m["league"],[]),date)
        if not event:
            print("Unmatched:",m.get("league"),m.get("home"),m.get("away"),file=sys.stderr)
            continue
        before=json.dumps(m,ensure_ascii=False,sort_keys=True)
        enrich(m,event,LEAGUES[m["league"]])
        count+=before!=json.dumps(m,ensure_ascii=False,sort_keys=True)
    rendered=json.dumps(payload,indent=2,ensure_ascii=False)+"\n"
    if original!=rendered:path.write_text(rendered,encoding="utf-8")
    return count

def published_leagues(path):
    """Never query source providers for competitions absent from published reports."""
    if not path.exists():return set()
    try:
        payload=json.loads(path.read_text(encoding="utf-8"))
    except (OSError,ValueError):return set()
    if payload.get("published") is not True:return set()
    return {m.get("league") for m in payload.get("matches",[])
            if isinstance(m,dict) and m.get("league") in LEAGUES}

def main():
    import argparse
    parser=argparse.ArgumentParser()
    parser.add_argument("--date",help="Myanmar date YYYY-MM-DD, defaults to current date")
    args=parser.parse_args()
    today=dt.date.fromisoformat(args.date) if args.date else dt.datetime.now(TZ).date()
    current=DATA/"today.json"
    if not current.exists():raise SystemExit("today.json missing")
    payload=json.loads(current.read_text(encoding="utf-8"))
    if payload.get("reportDate")!=today.isoformat():
        print("Report date is stale; leaving it unchanged.");return
    archive_today=DATA/"archive"/f"{today.isoformat()}.json"
    yesterday=today-dt.timedelta(days=1)
    archive_yesterday=DATA/"archive"/f"{yesterday.isoformat()}.json"
    current_competitions=published_leagues(current)|published_leagues(archive_today)
    previous_competitions=published_leagues(archive_yesterday)
    # Avoid 25-competition polling every 15 minutes; fetch only published fixtures.
    changed=0
    if current_competitions:
        boards=fetch_games(today,current_competitions)
        if any(boards.values()):
            changed+=update(current,boards)
            if archive_today.exists():changed+=update(archive_today,boards)
        else:print("No verified current-day scoreboards; preserving data.")
    if previous_competitions:
        older=fetch_games(yesterday,previous_competitions)
        if any(older.values()):changed+=update(archive_yesterday,older)
        else:print("No verified previous-day scoreboards; preserving data.")
    if not current_competitions and not previous_competitions:
        print("No published fixtures to sync; waiting for the user-approved report.")
    print(f"Verified and enriched {changed} football match records.")

if __name__=="__main__":main()

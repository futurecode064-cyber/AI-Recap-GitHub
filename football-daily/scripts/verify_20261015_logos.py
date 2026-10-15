#!/usr/bin/env python3
"""One-time public roster crest discovery; preserve match identity, never guess logos."""
import requests, json, re, unicodedata
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
today=json.loads((ROOT/"data/today.json").read_text("utf-8"))
HEADERS={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/125.0 Safari/537.36"}
def norm(s):
 s=unicodedata.normalize("NFKD",s.lower())
 return re.sub(r"[^a-z0-9]","",re.sub(r"^(fc |fk |sk |sc |rc |ac |tsg |gnk |cs )","",s))
def similarity(a,b):
 a,b=norm(a),norm(b)
 if a==b:return 1
 # prefix/containment only for long distinct names, not unreliable initials
 if len(a)>6 and len(b)>6 and (a in b or b in a) and min(len(a),len(b))/max(len(a),len(b))>.65:return .85
 prev=list(range(len(b)+1))
 for i,c in enumerate(a):
  cur=[i+1]
  for j,d in enumerate(b):cur.append(min(cur[-1]+1,prev[j+1]+1,prev[j]+(c!=d)))
  prev=cur
 return 1-prev[-1]/max(1,len(a),len(b))

teams={}
for league in ["uefa.europa","uefa.europa.conf","uefa.europa.conference"]:
 url=f"https://site.api.espn.com/apis/site/v2/sports/soccer/{league}/scoreboard?dates=20261015&limit=500"
 try:
  r=requests.get(url,headers=HEADERS,timeout=25)
  print("ESPN",league,r.status_code,len(r.content),flush=True)
  if r.status_code!=200:continue
  data=r.json()
  for event in data.get("events",[]):
   for c in event.get("competitions",[{}])[0].get("competitors",[]):
    t=c.get("team",{})
    name=t.get("displayName","")
    logo=t.get("logo") or ((t.get("logos") or [{}])[0]).get("href")
    if name and logo:teams[name]={"logo":logo,"source":url,"id":t.get("id")}
  print("ESPN_EVENT_COUNT",league,len(data.get("events",[])),flush=True)
 except Exception as e:print("ESPN_ERROR",league,str(e),flush=True)

# Independently inspect actual team img tags from bookmaker event pages.
scan=json.loads((ROOT/"data/research/2026-10-15-market-form-scan.json").read_text("utf-8"))
candidate=[]
for x in scan[:3]:
 try:
  soup=BeautifulSoup(requests.get(x["url"],headers=HEADERS,timeout=25).text,"html.parser")
  images=[{"alt":e.get("alt"),"src":e.get("src"),"data_src":e.get("data-src")} for e in soup.find_all("img") if e.get("src") or e.get("data-src")]
  print("BOOKIE_IMG",x["label"],json.dumps(images[:25],ensure_ascii=False),flush=True)
 except Exception as e:print("BOOKIE_IMG_ERROR",str(e),flush=True)
ALIASES={
  "Aarhus": "AGF",
  "Ajax": "Ajax Amsterdam",
  "Brighton": "Brighton & Hove Albion",
  "Celje": "NK Celje",
  "Copenhagen": "F.C. København",
  "Crvena Zvezda": "Red Star Belgrade",
  "Gent": "KAA Gent",
  "Hearts": "Heart of Midlothian",
  "Iberia Tbilisi": "Iberia 1999",
  "Jagiellonia": "Jagiellonia Bialystok",
  "Omonia": "Omonia Nicosia",
  "Rennes": "Stade Rennais",
  "Riga": "Riga FC",
  "Universitatea Craiova": "CSU Craiova"
}
print("AVAILABLE_ESPN_TEAMS", json.dumps(sorted(teams.keys()),ensure_ascii=False),flush=True)
needed=sorted(set(k for m in today["matches"] for k in (m["home"],m["away"])))
for name in needed:
 choices=sorted(((1.0 if ALIASES.get(name)==seen else similarity(name,seen),seen,obj) for seen,obj in teams.items()),key=lambda z:z[0],reverse=True)
 if choices and choices[0][0]>=.75:
  score,source,obj=choices[0]
  candidate.append({"name":name,"matchName":source,"confidence":round(score,3),**obj})
 else: print("NO_ESPN_LOGO",name,"best",choices[0][:2] if choices else None,flush=True)
dest=ROOT/"data/research/2026-10-15-verified-logos.json"
dest.write_text(json.dumps(candidate,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("SUMMARY",len(candidate),"of",len(needed),"team logo links",flush=True)

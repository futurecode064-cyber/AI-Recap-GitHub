#!/usr/bin/env python3
"""Read live, dated OddsRun fixture tables only; never synthesize missing odds/form."""
import json, re, sys, unicodedata
from datetime import date
from pathlib import Path
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]
HUBS=[
 "https://oddsrun.com/matches/football/eu/1067/uefa-europa-league/",
 "https://oddsrun.com/matches/football/eu/34541/uefa-conference-league/",
]
HEADERS={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/125.0 Safari/537.36"}
def get(url):
    r=requests.get(url,headers=HEADERS,timeout=30)
    r.raise_for_status()
    return BeautifulSoup(r.text,"html.parser")
def txt(s):return " ".join(s.get_text(" ",strip=True).split()) if s else ""
def slug(s):
    s=unicodedata.normalize("NFKD",s.lower())
    return re.sub(r"[^a-z0-9]+","",s)
def parse_odds(soup):
    out=[]
    for table in soup.select("table"):
        rows=table.select("tr")
        for row in rows:
            cols=[txt(c) for c in row.find_all(["td","th"])]
            if len(cols)>=4 and re.fullmatch(r"(?:\d+\.\d{1,3})",cols[1]) and re.fullmatch(r"(?:\d+\.\d{1,3})",cols[2]) and re.fullmatch(r"(?:\d+\.\d{1,3})",cols[3]):
                values=list(map(float,cols[1:4]))
                if min(values)>1 and max(values)<250:
                    out.append({"bookmaker":cols[0],"homeOdds":cols[1],"drawOdds":cols[2],"awayOdds":cols[3]})
    return out
def parse_form(soup):
    out={}
    for heading in soup.find_all(["h3","h4"]):
        t=txt(heading)
        if not t.lower().startswith("recent matches"):continue
        side=t.split("—",1)[-1].strip() if "—" in t else t
        rows=[]
        n=heading.find_next_sibling()
        while n and n.name not in ("h2","h3","h4"):
            for li in n.find_all("li"):
                line=txt(li)
                m=re.search(r"(\d{1,2})\s+([A-Za-z]{3,9})\s+(2026)\s*[·|:]\s*(.*?)\s*[—–]\s*(\d+)\s*[-:]\s*(\d+)\s*[—–]\s*(.+)$",line)
                if not m:continue
                rows.append({"date":f"{m.group(1)} {m.group(2)} {m.group(3)}","left":m.group(4),"leftGoals":int(m.group(5)),"rightGoals":int(m.group(6)),"right":m.group(7)})
            n=n.find_next_sibling()
        out[side]=rows[:10]
    return out

def main():
    all_links={}
    for hub in HUBS:
        doc=get(hub)
        entries=[]
        for a in doc.select("a[href*='/match/football/']"):
            name=txt(a)
            href=urljoin(hub,a.get("href",""))
            if " vs " in name.lower() and name not in [n for n,_ in entries]:
                entries.append((name,href))
        all_links[hub]=entries
    print("HUBS",json.dumps({h:v for h,v in all_links.items()},ensure_ascii=False),flush=True)
    report=[]
    for hub, entries in all_links.items():
        for label,url in entries:
            if len(entries)<18: print("WARNING hub insufficient",hub,len(entries),flush=True)
            try:
                soup=get(url)
                quoted=txt(soup.select_one("h1"))
                rows=parse_odds(soup)
                form=parse_form(soup)
                report.append({"hub":hub,"label":label,"url":url,"title":quoted,"odds":rows[:8],"forms":form})
                print("MATCH",label,len(rows),list((key,len(val)) for key,val in form.items()),flush=True)
            except Exception as exc:
                print("FETCH_ERROR",url,str(exc),flush=True)
    output=ROOT/"data/research/2026-10-15-market-form-scan.json"
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("FINAL_ROWS",len(report),flush=True)
if __name__=="__main__":main()

#!/usr/bin/env python3
"""Conservative external link checker; checks a bounded rotating batch each day.

No tool is auto-removed because of a flaky network response.
A GitHub API 404 is marked missing, 401/403/429 as unknown, and network errors as unknown.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone, date
from pathlib import Path
import json, os, urllib.request, urllib.error, urllib.parse, math
SITE=Path(__file__).resolve().parents[1]/"portal"/"ai-tools"
CATALOG=SITE/"tools.json"
HEALTH=SITE/"link-health.json"
BATCH=max(1,min(150,int(os.environ.get("AI_LINK_CHECK_BATCH","125"))))
def load(path,default):
 try:return json.loads(path.read_text(encoding="utf-8"))
 except (FileNotFoundError,ValueError):return default
def check(item):
 url=item["url"]
 token=os.environ.get("GITHUB_TOKEN","")
 headers={"User-Agent":"FutureCodeAITools-LinkMonitor/1.0","Accept":"application/vnd.github+json"}
 source="external-https"
 if item.get("repo"):
  url="https://api.github.com/repos/"+item["repo"]
  source="github-api"
  if token:headers["Authorization"]="Bearer "+token
 try:
  req=urllib.request.Request(url,headers=headers,method="GET" if source=="github-api" else "HEAD")
  try:
   with urllib.request.urlopen(req,timeout=11) as resp:
    code=resp.status
  except urllib.error.HTTPError as err:
   code=err.code
  if code in (404,410):state="broken"
  elif 200<=code<400:state="ok"
  else:state="unknown"
  return item["id"],{"status":state,"http":int(code),"checkedAt":datetime.now(timezone.utc).isoformat(timespec="seconds"),"source":source}
 except (TimeoutError,ValueError,urllib.error.URLError,OSError):
  return item["id"],{"status":"unknown","http":None,"checkedAt":datetime.now(timezone.utc).isoformat(timespec="seconds"),"source":source}
def main():
 cat=load(CATALOG,{})
 tools=cat.get("tools",[])
 if len(tools)<1000:raise SystemExit("Link checker refuses truncated catalog")
 old=load(HEALTH,{"schemaVersion":1,"results":{}})
 if not isinstance(old.get("results"),dict):old={"results":{}}
 count=len(tools)
 offset=(date.today().toordinal()*BATCH)%count
 subset=[tools[(offset+j)%count] for j in range(BATCH)]
 new={}
 with ThreadPoolExecutor(max_workers=6) as pool:
  for f in as_completed([pool.submit(check,t) for t in subset]):
   try:
    name,status=f.result()
    new[name]=status
   except Exception as e:
    print("Checker error; retaining existing status:",str(e)[:100])
 old["results"].update(new)
 # Remove results for entries no longer in catalog; never automatically remove catalog entries.
 valid={t["id"] for t in tools}
 old["results"]={k:v for k,v in old["results"].items() if k in valid}
 old["schemaVersion"]=1
 old["batchSize"]=len(subset)
 old["checkedAt"]=datetime.now(timezone.utc).isoformat(timespec="seconds")
 old["summary"]={s:sum(1 for x in old["results"].values() if x.get("status")==s) for s in ("ok","broken","unknown")}
 old["remainingUnverified"]=count-len(old["results"])
 HEALTH.write_text(json.dumps(old,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
 print("Link check batch:",len(subset),"total checks in registry:",len(old["results"]),"summary:",old["summary"])
 print("Incomplete/unknown checks are NOT proof a site is offline in Myanmar.")
if __name__=="__main__":main()

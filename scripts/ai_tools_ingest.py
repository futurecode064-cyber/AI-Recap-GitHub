#!/usr/bin/env python3
"""Licensed AI-directory import; no executable data from third-party YAML."""
from __future__ import annotations
import argparse, datetime as dt, hashlib, json, re, urllib.request, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/"portal"/"ai-tools"
SOURCE_URL="https://raw.githubusercontent.com/archestack/best-of-ai/main/data/entries.yaml"
CREDIT_URL="https://github.com/archestack/best-of-ai"
LICENSE_URL="https://creativecommons.org/licenses/by/4.0/"
CORE=SITE/"core-tools.json"
OUTPUT=SITE/"tools.json"
CATEGORIES=[
 ("chat","AI Chat","AI Chat","💬"),("research","Research","သုတေသန","🔎"),
 ("writing","Writing","စာရေး","✍️"),("translation","Translation","ဘာသာပြန်","🌐"),
 ("education","Education","ပညာရေး","🎓"),("documents","Documents & OCR","PDF / Document","📄"),
 ("coding","Coding","Coding","💻"),("websites","Website & App Builders","Website / App","🧩"),
 ("agents","AI Agents","AI Agents","🤖"),("automation","Automation","Automation","⚡"),
 ("models","AI Models","AI Models","🧠"),("local","Local AI","Offline / Local AI","🖥️"),
 ("serving","Model Serving","Model Server","☁️"),("ml","Machine Learning","Machine Learning","📐"),
 ("training","Model Training","AI Training","🏋️"),("memory","Agent Memory","AI မှတ်ဉာဏ်","🧠"),
 ("rag","RAG & Knowledge","RAG / Knowledge","📚"),("vector","Vector Databases","Vector Database","🔢"),
 ("gateways","API Gateways","AI API","🔗"),("mcp","MCP Tools","MCP / Tools","🛠️"),
 ("evaluation","Testing & Evaluation","AI စမ်းသပ်စစ်ဆေး","🧪"),("security","AI Security","AI Security","🛡️"),
 ("sandboxes","Sandboxes","Code Sandbox","📦"),("image","AI Image","AI ပုံ","🎨"),
 ("video","AI Video","AI ဗီဒီယို","🎬"),("design","Graphic Design","ဒီဇိုင်း","🖌️"),
 ("voice","Voice & Music","အသံ / Music","🎧"),("business","Business","လုပ်ငန်းသုံး","📊"),
 ("presentation","Presentation","Slides","📈"),("desktop","Desktop AI","Desktop App","🖱️")
]
SOURCE_CATEGORY={
 "assistants":["chat"],"chat-ui":["chat"],"agent-platforms":["agents"],"agent-frameworks":["agents","coding"],
 "automation":["automation"],"models":["models"],"model-serving":["serving","local"],
 "ml-frameworks":["ml","coding"],"training":["training","ml"],"memory":["memory","agents"],
 "rag-knowledge":["rag","research"],"data-tools":["documents"],"vector-db":["vector","rag"],
 "gateways":["gateways"],"mcp-servers":["mcp"],"sandboxes":["sandboxes","coding"],
 "security":["security"],"desktop-apps":["desktop","local"],"image-video":["image","video"],
 "voice":["voice"],"learning":["education"]
}
WORD_MAP={
 "research":["search","research","paper","browser","citations"],
 "writing":["writing","writer","document editing"],
 "translation":["translat","multilingual","localization"],
 "websites":["website","webapp","web-app","site builder","app builder"],
 "evaluation":["eval","observability","trace","benchmark","test llm","llm testing","monitoring"],
 "video":["video","animation","camera"],
 "image":["image","vision","visual","diffusion"],
 "design":["design","diagram","graphic"],
 "business":["business","productivity","customer","sales"],
 "presentation":["slides","presentation","powerpoint"],
 "documents":["pdf","ocr","documents","parsing"],
 "local":["offline","local-first","run locally"],
}
ALLOWED=set(t[0] for t in CATEGORIES)
PATTERN=re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")
def jread(path, default=None):
 try:return json.loads(path.read_text(encoding="utf-8"))
 except (FileNotFoundError,json.JSONDecodeError):return default
def valid_url(u):
 return isinstance(u,str) and len(u)<2000 and re.match(r"^https://[A-Za-z0-9][A-Za-z0-9._:-]+(?:/|$)",u) and "@" not in u.split("/")[2]
def normalize_tool(tool):
 if not isinstance(tool,dict):return None
 name=str(tool.get("name") or "").strip()[:120]
 url=str(tool.get("url") or "").strip()
 if not name or not valid_url(url):return None
 cats=[c for c in (tool.get("categories") or []) if c in ALLOWED]
 if not cats:return None
 out=dict(tool)
 out["name"]=name;out["url"]=url;out["categories"]=list(dict.fromkeys(cats))
 out["plan"]=tool.get("plan") or "unknown"
 out["description"]=str(tool.get("description") or "AI Tool")[:450]
 out["id"]=re.sub(r"[^a-z0-9-]","-",str(tool.get("id") or name).lower())[:110]
 out.setdefault("source","future-code-curated")
 out.setdefault("kind","web-service")
 out.setdefault("verification","curated-directory")
 return out
def import_source(count=1200):
 import yaml
 req=urllib.request.Request(SOURCE_URL,headers={"User-Agent":"FutureCodeAIStudio-Directory/2.0"})
 with urllib.request.urlopen(req,timeout=35) as resp:
  data=yaml.safe_load(resp.read(5_000_000))
 if not isinstance(data,dict) or not isinstance(data.get("entries"),list):
  raise RuntimeError("Invalid third-party catalog structure")
 source_date=str(data.get("updated_at") or "")
 result=[]
 for ent in data["entries"]:
  if not isinstance(ent,dict) or ent.get("status")!="listed":continue
  repo=ent.get("repo")
  if not isinstance(repo,str) or not PATTERN.fullmatch(repo):continue
  src_cats=ent.get("categories") or []
  if not isinstance(src_cats,list):continue
  tags=[]
  for c in src_cats:tags+=SOURCE_CATEGORY.get(c,[])
  word=(" "+str(ent.get("name") or "")+" "+str(ent.get("tagline") or "")+" "+" ".join(src_cats)).lower()
  for cat,tokens in WORD_MAP.items():
   if any(t in word for t in tokens):tags.append(cat)
  tags=list(dict.fromkeys(t for t in tags if t in ALLOWED))
  if not tags:tags=["coding"]
  raw=ent.get("tagline") or ent.get("summary") or ""
  name=str(ent.get("name") or repo.split("/")[-1]).strip()[:120]
  score=ent.get("score")
  facts=ent.get("facts") if isinstance(ent.get("facts"),dict) else {}
  item={
   "id":"oss-"+repo.lower().replace("/","-").replace(".","-"),
   "name":name,
   "url":"https://github.com/"+repo,
   "categories":tags,
   "plan":"open-source",
   "description":str(raw).strip()[:400],
   "descriptionMy":"",
   "kind":"open-source",
   "source":"archestack",
   "sourceUrl":CREDIT_URL,
   "sourceLicense":"CC BY 4.0",
   "sourceReviewedAt":source_date,
   "verification":"source-reviewed-not-individually-rechecked",
   "score":int(score) if isinstance(score,(int,float)) else 0,
   "stars":facts.get("stars") if isinstance(facts.get("stars"),int) else None,
   "repo":repo,
   "license":str(facts.get("license") or "")[:80],
   "strengths":[str(x)[:220] for x in (ent.get("strengths") or [])[:3]],
   "weaknesses":[str(x)[:220] for x in (ent.get("weaknesses") or [])[:2]],
  }
  result.append(item)
 result.sort(key=lambda x:(-x.get("score",0),-(x.get("stars") or 0),x["name"].lower()))
 return result,source_date
def main():
 ap=argparse.ArgumentParser()
 ap.add_argument("--count",type=int,default=1200)
 args=ap.parse_args()
 core=jread(CORE)
 if not isinstance(core,dict) or len(core.get("tools") or [])<50:
  raise SystemExit("Core catalog not found: refusing to overwrite")
 manual=[normalize_tool(x) for x in core["tools"]]
 manual=[x for x in manual if x]
 if len(manual)<50:raise SystemExit("Valid core too short")
 try:
  source,source_date=import_source()
 except Exception as e:
  print("External source fetch failed; existing published dataset remains intact:",type(e).__name__,str(e)[:140])
  existing=jread(OUTPUT,{"tools":[]})
  if len(existing.get("tools",[]))>=args.count:sys.exit(0)
  raise
 result=[];names=set();urls=set();ids=set()
 for item in manual+source:
  if item["id"] in ids:continue
  normalized_name=re.sub(r"[^a-z0-9]","",item["name"].lower())
  canonical=item["url"].rstrip("/").lower()
  if canonical in urls or (normalized_name and normalized_name in names):continue
  ids.add(item["id"]);names.add(normalized_name);urls.add(canonical)
  result.append(item)
  if len(result)>=args.count:break
 if len(result)<args.count:raise SystemExit(f"Not enough quality entries: {len(result)} / {args.count}")
 if len({x["id"] for x in result})!=len(result):raise SystemExit("Duplicate ids")
 payload={ "schemaVersion":2,
   "version":"2.0.0" if len(result)>=1000 else ("1.2.0" if len(result)>=500 else "1.0.0"),
   "updatedAt":dt.date.today().isoformat(),
   "revision":hashlib.sha256(json.dumps([(x["id"],x["url"],x.get("description",""),x["categories"]) for x in result],ensure_ascii=False,sort_keys=True).encode()).hexdigest()[:16],
   "categories":[{"id":"all","en":"All Tools","my":"အားလုံး","icon":"✦"}]+[{"id":i,"en":en,"my":my,"icon":icon} for i,en,my,icon in CATEGORIES],
   "tools":result,
   "dataSource":{"name":"Archestack Best of AI","url":CREDIT_URL,"license":"CC BY 4.0","licenseUrl":LICENSE_URL,"sourceReviewedAt":source_date,"note":"Third-party source-reviewed links are not all independently live-checked; see Link Health for recent checks."},
   "stages":{"v1.0":{"categories":30,"minimumTools":200},"v1.1":{"favorites":True,"compare":True,"submissions":True},"v1.2":{"minimumTools":500,"linkMonitoring":True},"v2.0":{"minimumTools":1000,"userCollections":True}}
 }
 previous=jread(OUTPUT,{})
 if previous.get("revision")!=payload["revision"]:
  OUTPUT.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
  update={"schemaVersion":2,"version":payload["version"],"revision":payload["revision"],
       "date":dt.date.today().isoformat(),"title":"Future Code AI Tools "+payload["version"],
       "message":f"AI Tools စာရင်း {len(result)} ခု ရရှိပြီးပါပြီ။ Search, Favorites, Comparison, Collections နှင့် Link Health စနစ် အသုံးပြုနိုင်ပါပြီ။",
       "type":"catalog-update","important":True}
  (SITE/"updates.json").write_text(json.dumps(update,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
  print("Catalog revision updated:",payload["revision"])
 else:print("Catalog unchanged; preserving previous revision/date")
 print("Category Count:",len(CATEGORIES),"Total Tools:",len(result),
       "Hand-curated:",len(manual),"Source records:",sum(x.get("source")=="archestack" for x in result))
 for count in (200,350,500,1000):
  assert len(result)>=count, f"stage minimum {count} missing"
 print("V1.0 V1.1 V1.2 V2.0 data milestones: PASS")
if __name__=="__main__":main()

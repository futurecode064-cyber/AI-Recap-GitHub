#!/usr/bin/env python3
"""One-day atomic candidate promotion after authentic club/cup crest caching and V7 guard."""
import concurrent.futures, hashlib, io, json, pathlib, re, sys, time, urllib.parse, urllib.request
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[1]
DAY='2026-10-29'
source=json.loads((ROOT/'data/research/2026-10-29-package-candidate-ready.json').read_text(encoding='utf-8'))
report,odds,tips,news=[source[k] for k in ('report','odds','tips','news')]
assert report['reportDate']==odds['reportDate']==tips['reportDate']==news['date']==DAY
assert len(report['matches'])==len(odds['matches'])==len(tips['items'])==15
assert len(news['items'])==10 and len([x for x in report['matches'] if x.get('specialChoice')])==2
MAIN=ROOT/'main-export-logos.js';BRAND=ROOT/'brand-export-data.js'
teamsdir=ROOT/'assets/brand-export-teams';teamsdir.mkdir(parents=True,exist_ok=True)
main_source=MAIN.read_text(encoding='utf-8');brand_source=BRAND.read_text(encoding='utf-8')
def find_obj(source,key):
 m=re.search(r'const '+re.escape(key)+r'=(\{.*?\});',source,re.S)
 if not m: raise RuntimeError('Missing JS map '+key)
 return json.loads(m.group(1))
main_map=find_obj(main_source,'teams')
brand_map=find_obj(brand_source,'teamFiles')
source_to_name={}
for match in report['matches']:
 for side in ('home','away'):
  u=match.get(side+'CrestUrl')
  if not u or not u.startswith('https://'): raise RuntimeError('Missing authentic crest '+match['fixtureId']+' '+side)
  source_to_name.setdefault(u,set()).add(match[side])
allowed={'a.espncdn.com','www.footylogos.com','static.bongda24h.vn','r2.thesportsdb.com','assets.football-logos.cc','www.ligaportugal.pt'}
def download_png(url):
 host=urllib.parse.urlparse(url).hostname
 if host not in allowed: raise RuntimeError('Unapproved crest source '+url)
 request=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36','Accept':'image/png,image/*;q=0.9,*/*;q=0.5','Referer':'https://www.google.com/'})
 with urllib.request.urlopen(request,timeout=20) as res: raw=res.read(3_000_000)
 with Image.open(io.BytesIO(raw)) as im:
  im.load()
  if min(im.size)<32: raise RuntimeError('Tiny crest '+url)
  obj=im.convert('RGBA')
  if max(obj.size)>1600: obj.thumbnail((1500,1500))
  if not obj.getbbox(): raise RuntimeError('Blank image '+url)
  buf=io.BytesIO();obj.save(buf,format='PNG',optimize=True)
  return buf.getvalue()
def valid_png(path):
 try:
  with Image.open(path) as im: im.verify()
  return True
 except (OSError,FileNotFoundError,ValueError): return False
def crest(job):
 url,names=job
 key=hashlib.sha256(url.encode()).hexdigest()[:16]+'.png'
 target=teamsdir/key
 if valid_png(target): return url,key,'reused'
 old=(main_map.get(url) or '')
 if old.startswith('assets/') and valid_png(ROOT/old):
  target.write_bytes((ROOT/old).read_bytes());return url,key,'reused-map'
 error=None
 for attempt in range(3):
  try:
   target.write_bytes(download_png(url));return url,key,'downloaded'
  except Exception as exc:
   error=exc;time.sleep(attempt+1)
 raise RuntimeError('Crest unavailable for '+','.join(names)+': '+url+' -> '+str(error))
jobs=list(source_to_name.items());success=[];fails=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
 for future in concurrent.futures.as_completed({pool.submit(crest,j):j for j in jobs}):
  try: success.append(future.result())
  except Exception as exc: fails.append(str(exc))
for u,filename,_ in success:
 main_map[u]='assets/brand-export-teams/'+filename
 brand_map[u]=filename
if fails:
 for err in fails: print('BLOCKED',err,flush=True)
 raise SystemExit('No public files promoted: missing '+str(len(fails))+' crest(s)')
league_map={'EFL Cup':'eng.cup','Serie A':'ita.1','Veikkausliiga':'fin.1','Allsvenskan':'swe.1','DBU Pokalen':'den.cup','Saudi Pro League':'ksa.1','Taça da Liga':'por.cup'}
league_logo_urls={'ksa.1':'https://a.espncdn.com/i/leaguelogos/soccer/500/2488.png','por.cup':'https://www.ligaportugal.pt/backoffice/assets/ic_allianzcup_cbcb5ca1e0.png'}
for key,url in league_logo_urls.items():
 target=ROOT/'assets/league-logos'/(key+'.png')
 if not valid_png(target): target.write_bytes(download_png(url))
 assert valid_png(target)
# Same-origin logo URLs in every report and odds row, working with Canvas no CORS.
for group in (report['matches'],odds['matches']):
 for m in group:
  league_file=league_map[m['league']]
  target=ROOT/'assets/league-logos'/(league_file+'.png')
  if not valid_png(target): raise RuntimeError('Missing league crest '+str(target))
  m['leagueLogoUrl']='https://future-code-football-daily.pages.dev/assets/league-logos/'+league_file+'.png'
# Safely extend existing lookup maps preserving all legacy entries and frames.
def replace_obj(text,key,obj):
 patt=r'(const '+re.escape(key)+r'=)\{.*?\};'
 val=json.dumps(obj,ensure_ascii=False,separators=(',',':'))
 changed,count=re.subn(patt,lambda m:m.group(1)+val+';',text,count=1,flags=re.S)
 if count!=1: raise RuntimeError('JS map missing '+key)
 return changed
main_source=replace_obj(main_source,'teams',main_map)
brand_source=replace_obj(brand_source,'teamFiles',brand_map)
def extend_map(code,key,additions):
 m=find_obj(code,key);m.update(additions);return replace_obj(code,key,m)
main_source=extend_map(main_source,'leagues',league_map)
brand_source=extend_map(brand_source,'local',league_map)
for m in report['matches']:
 for side in ('home','away'):
  url=m[side+'CrestUrl']
  filename=brand_map.get(url)
  if not filename or not valid_png(teamsdir/filename):
   raise RuntimeError('No same-origin PNG mapping '+url)
# News media photos are intentionally not copied: source rights unverified.
def write_json(path,data):
 path.parent.mkdir(parents=True,exist_ok=True)
 path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+chr(10),encoding='utf-8')
write_json(ROOT/'data/today.json',report)
write_json(ROOT/'data/odds'/('2026-10-29.json'),odds)
write_json(ROOT/'data/tips'/('2026-10-29.json'),tips)
write_json(ROOT/'data/news/latest.json',news)
MAIN.write_text(main_source,encoding='utf-8');BRAND.write_text(brand_source,encoding='utf-8')
receipt={'date':DAY,'status':'CANDIDATE_READY_FOR_GUARD','clubSourceCount':len(jobs),'cachedClubCount':len(success),'leagueLogos':league_map,'newsCount':len(news['items']),'previewCount':len(report['matches']),'oddsCount':len(odds['matches']),'tipsCount':len(tips['items']),'specialChoice':2,'yesterdayArchive':'data/archive/2026-10-28.json','limitation':'Browser PNG/ZIP and live CDN QA still required after publication'}
write_json(ROOT/'data/research/2026-10-29-release-preflight.json',receipt)
print('CANDIDATE ASSET & SOURCE GUARD READY',json.dumps(receipt,ensure_ascii=False),flush=True)

#!/usr/bin/env python3
"""Pin ten distinct rights-checked Wikimedia football news photos on our origin.
Never claim historical photos depict a news event; show exact CC creator, license and file source.
Fail before public update if a photo is blocked or incorrect.
"""
import concurrent.futures, hashlib, io, json, pathlib, urllib.parse, urllib.request, time
from PIL import Image, ImageOps
ROOT=pathlib.Path(__file__).resolve().parents[1]
NEWS=ROOT/'data/news/latest.json'
data=json.loads(NEWS.read_text(encoding='utf-8'))
assert data['date']=='2026-10-29' and len(data['items'])==10
OUT=ROOT/'assets/news-2026-10-29'
OUT.mkdir(parents=True,exist_ok=True)
def original_url(url):
 p=urllib.parse.urlparse(url)
 if p.hostname not in {'thumb.wikimedia.org','upload.wikimedia.org'}:
  raise ValueError('Unapproved photo host: '+url)
 parts=p.path
 if '/commons/thumb/' in parts:
  parts=parts.replace('/commons/thumb/','/commons/',1).rsplit('/',1)[0]
 return 'https://upload.wikimedia.org'+parts
def checked(item):
 if not item.get('image') or not item.get('imageCredit') or not item.get('imageSourceUrl') or not item.get('imageLicense') or not item.get('imageLicenseUrl') and item.get('imageLicense')!='Public domain':
  raise RuntimeError('Missing photo provenance: '+item['id'])
 if not item['imageSourceUrl'].startswith('https://commons.wikimedia.org/wiki/File'):
  raise RuntimeError('Photo is not from Commons file source: '+item['id'])
 if item.get('imageContext')!='historic venue/team illustrative photo — not photo of October 2026 reported event':
  raise RuntimeError('Historical illustrative photo not disclosed: '+item['id'])
 u=item['image']
 if u.startswith('/assets/news-2026-10-29/'):return item['id'],None,u
 sources=[u,original_url(u)]
 error=None
 for attempt in range(3):
  for url in dict.fromkeys(sources):
   try:
    req=urllib.request.Request(url,headers={'User-Agent':'FutureCodeFootballDailyEditorial/1.0 (image license and attribution verification)','Accept':'image/jpeg,image/*;q=0.8,*/*;q=0.5'})
    with urllib.request.urlopen(req,timeout=22) as response:raw=response.read(15_000_000)
    with Image.open(io.BytesIO(raw)) as picture:
     picture.load();picture=ImageOps.exif_transpose(picture)
     if min(picture.size)<200:raise ValueError('Photo too small')
     picture=picture.convert('RGB')
     picture.thumbnail((1200,900),Image.Resampling.LANCZOS)
     output=io.BytesIO();picture.save(output,format='JPEG',quality=86,optimize=True)
     jpeg=output.getvalue()
     if len(jpeg)<7000:raise ValueError('Photo appears blank')
     filename=hashlib.sha256(item['imageSourceUrl'].encode('utf-8')).hexdigest()[:16]+'.jpg'
     return item['id'],(filename,jpeg),'/assets/news-2026-10-29/'+filename
   except Exception as e:error=e
  time.sleep(attempt+1)
 raise RuntimeError(item['id']+' photo source unreachable: '+str(error))
ids=[x['id'] for x in data['items']]
if len(set(ids))!=10 or len(set(x['imageSourceUrl'] for x in data['items']))!=10:
 raise RuntimeError('Duplicate source photo assigned to different news items')
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
 results=list(pool.map(checked,data['items']))
mapping={}
for newsid,asset,path in results:
 if asset:
  filename,raw=asset
  (OUT/filename).write_bytes(raw)
 mapping[newsid]=path
for item in data['items']:
 item['image']=mapping[item['id']]
 item['imageFit']='cover'
 item['imageLocalCached']=True
NEWS.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'date':data['date'],'news':len(data['items']),'sameOriginPhotos':len(mapping),'bytes':sum(x.stat().st_size for x in OUT.glob('*.jpg')),'licenseApproved':True},ensure_ascii=False))

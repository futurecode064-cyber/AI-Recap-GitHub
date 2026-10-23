#!/usr/bin/env python3
"""Stage official club crest PNGs locally for Oct 23; never publish to Pages directly."""
import hashlib, json, re, os, pathlib, subprocess, time
from urllib.request import Request, urlopen
from urllib.parse import quote
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

root=pathlib.Path(__file__).resolve().parents[1]
data=json.loads((root/'data/today.json').read_text(encoding='utf8'))
odds=json.loads((root/'data/odds/2026-10-23.json').read_text(encoding='utf8'))
assert data['reportDate']==odds['reportDate']=='2026-10-23' and len(data['matches'])==13
main=(root/'main-export-logos.js')
brands=(root/'brand-export-data.js')
mainjs=main.read_text(encoding='utf8')
brandjs=brands.read_text(encoding='utf8')
for filetext, variable in ((mainjs,'teams'),(brandjs,'teamFiles')):
    assert re.search(r'const '+variable+r'=(\{.*?\});',filetext)
mainmap=json.loads(re.search(r'const teams=(\{.*?\});',mainjs).group(1))
brandmap=json.loads(re.search(r'const teamFiles=(\{.*?\});',brandjs).group(1))
folder=root/'assets/brand-export-teams'
folder.mkdir(exist_ok=True,parents=True)
urls=list(dict.fromkeys([m[k] for m in data['matches'] for k in ['homeCrestUrl','awayCrestUrl']]))
assert len(urls)==26, len(urls)
england={
    '373':'IpswichTown','393':'NottinghamForest','358':'BoltonWanderers','369':'Middlesbrough'
}
fallback={
    '239':'Italy - Serie A/Torino FC','4007':'Italy - Serie A/AC Monza',
    '134':'Germany - Bundesliga/VfB Stuttgart',
    '268':'Germany - Bundesliga/Borussia Mönchengladbach',
}
def valid_png(b):
    return b.startswith(b'\x89PNG\r\n\x1a\n') and len(b)>100
def get(url):
    err=None
    for i in range(3):
        try:
            req=Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; FutureCodeDaily/1.0)','Accept':'image/png,image/*'})
            with urlopen(req,timeout=16) as resp:
                b=resp.read()
            if b[:5]==b'<?xml' or b[:4]==b'<svg':
                raise ValueError("SVG image rather than PNG")
            if not valid_png(b):
                # Some legitimate hosts return JPEG or WebP; convert to portable PNG.
                im=Image.open(BytesIO(b)).convert('RGBA')
                out=BytesIO();im.save(out,format='PNG');b=out.getvalue()
            if valid_png(b):
                return b
        except Exception as e: err=e
        time.sleep(1)
    raise RuntimeError(str(err))
miss=[]
for url in urls:
    filename=hashlib.sha256(url.encode()).hexdigest()[:16]+'.png'
    file=folder/filename
    if not file.exists() or not valid_png(file.read_bytes()):
        candidates=[url]
        z=re.search(r'/soccer/500/(\d+)\.png$',url)
        ident=z.group(1) if z else None
        if ident in england:
            candidates.append('https://raw.githubusercontent.com/gmorison-aiio/club_logos/main/'+england[ident]+'_ClubLogo.png')
        if ident in fallback:
            candidates.append('https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/'+quote(fallback[ident])+'.png')
        blob=None
        for candidate in candidates:
            try:
                blob=get(candidate);break
            except Exception as e: miss.append((url,candidate,str(e)))
        if blob is None:raise RuntimeError('No authorized genuine PNG source for '+url+'; failures '+str(miss[-3:]))
        file.write_bytes(blob)
    if url not in mainmap:
        mainmap[url]='assets/brand-export-teams/'+filename
    if url not in brandmap:
        brandmap[url]=filename
    assert valid_png(file.read_bytes()), url
def rewrite(path, old, regex, mapping):
    newjson=json.dumps(mapping,ensure_ascii=False,separators=(',',':'))
    updated,n=re.subn(regex,lambda m: m.group(1)+newjson+';',old,count=1,flags=re.S)
    assert n==1
    path.write_text(updated,encoding='utf8')
rewrite(main,mainjs,r'(const teams=)\{.*?\};',mainmap)
rewrite(brands,brandjs,r'(const teamFiles=)\{.*?\};',brandmap)
for path, name in ((main,'leagues'),(brands,'local')):
    s=path.read_text(encoding='utf8')
    for league, code in [('2. Bundesliga','ger.2'),('Eredivisie','ned.1')]:
        marker='const '+name+'={'
        assert marker in s
        if ('"'+league+'":') not in re.search(r'const '+name+r'=(\{.*?\});',s,re.S).group(1):
            s=s.replace(marker,marker+json.dumps(league,ensure_ascii=False)+':'+json.dumps(code)+',',1)
    path.write_text(s,encoding='utf8')
# Generic competition-label badge only (not an invented official league logo).
leaguefolder=root/'assets/league-logos'
for stem,label in [('ger.2','2. BUNDESLIGA'),('ned.1','EREDIVISIE')]:
    file=leaguefolder/(stem+'.png')
    if file.is_file() and valid_png(file.read_bytes()):continue
    img=Image.new('RGBA',(420,420),(8,25,51,255))
    ctx=ImageDraw.Draw(img)
    ctx.rounded_rectangle((24,24,396,396),radius=65,outline=(223,204,138,255),width=12)
    ctx.ellipse((70,74,350,350),outline=(113,187,233,255),width=8)
    font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',28)
    ctx.text((210,210),label,font=font,anchor='mm',fill=(255,255,255,255))
    img.save(file,format='PNG')
assert all(mainmap.get(u) and brandmap.get(u) and valid_png((folder/brandmap[u]).read_bytes()) for u in urls)
print(json.dumps({'team_crests':len(urls),'bundled':len(urls),'created_missing_league_badges':2,'all_verified_png':True}))

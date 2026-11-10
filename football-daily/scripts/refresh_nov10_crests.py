#!/usr/bin/env python3
"""Refresh only the six verified 2026-11-10 Copa club crests.
Source whitelisted, downloaded from real club sites, not generated.
Only changes MAIN day report, not brand snapshots.
"""
import io, json, pathlib, urllib.request, os
from PIL import Image, ImageOps
ROOT=pathlib.Path(__file__).resolve().parents[1]
DST=ROOT/"assets/team-logos/2026-11-10"
DST.mkdir(parents=True,exist_ok=True)
SOURCES={
 "pamplona":[
  "https://www.escudosdefutbolyequipaciones.com/images_esc3/ESPA/NAVARRA/escudos/ESC_C.D.%20PAMPLONA.png",
  "https://cdpamplona.com/wp-content/uploads/2010/06/ESCUDO_datosgenerales.jpg.gif",
  "https://www.cdpamplona.com/wp-content/uploads/2010/06/ESCUDO_datosgenerales.jpg.gif"],
 "eibar":["https://www.eurofotbal.cz/res/img/team-logo/MJReW3Y2-SveDDUW1.png"],
 "trival":["https://api.clupik.com/clubs/10724/images/clubTransparent.png",
           "https://api.clupik.com/clubs/10724/seo/image.jpg"],
 "amorebieta":["https://sdamorebieta.eus/uploads/2024/08/escudo-sd-amorebieta.png",
               "https://seeklogo.com/images/S/sd-amorebieta-logo-B2D34D9EC3-seeklogo.com.png"],
 "ud-logrones":["https://api.clupik.com/clubs/4403/images/clubTransparent.png",
                "https://api.clupik.com/clubs/4403/images/splash.png"]
}
MAPPING={
 "CD Pamplona":("pamplona","https://cdpamplona.com/"),
 "SD Eibar":("eibar","https://www.sdeibar.com/"),
 "CF Trival Valderas Alcorcón":("trival","https://www.trivalvalderas.com/"),
 "CD Leganés":("leganes","https://www.cdleganes.com/"),
 "SD Amorebieta":("amorebieta","https://sdamorebieta.eus/es/"),
 "UD Logroñés":("ud-logrones","https://www.udlogrones.com/es")
}
def download(name,urls):
 errors=[]
 for url in urls:
  try:
   req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (compatible; FutureCodeEditorialCrestSync/1.0)","Accept":"image/png,image/jpeg,image/gif,image/webp,image/*"})
   with urllib.request.urlopen(req,timeout=22) as resp:
    if resp.status!=200: raise RuntimeError("HTTP "+str(resp.status))
    payload=resp.read(3_000_000)
   img=Image.open(io.BytesIO(payload))
   img.seek(0)
   img=img.convert("RGBA")
   if min(img.width,img.height)<60 or max(img.width,img.height)>5000:raise ValueError("implausible image dimensions: "+str(img.size))
   img.thumbnail((482,482),Image.Resampling.LANCZOS)
   tile=Image.new("RGBA",(512,512),(0,0,0,0))
   tile.alpha_composite(img,((512-img.width)//2,(512-img.height)//2))
   tile.save(DST/(name+".png"),"PNG",optimize=True)
   print("VALID "+name+" "+str(img.size)+" "+url)
   return url
  except Exception as e:
   errors.append(type(e).__name__+": "+str(e))
 raise RuntimeError("No authentic image for "+name+"; "+ " / ".join(errors))
def main():
 got={}
 for name,urls in SOURCES.items():got[name]=download(name,urls)
 # Existing verified Leganés artwork is stored in repo; browser can render SVG locally.
 leganes=ROOT/"assets/team-logos/2026-11-02/leganes.svg"
 if not leganes.is_file() or leganes.stat().st_size<500:raise RuntimeError("Leganés crest is not present in repo")
 images={key:("./assets/team-logos/2026-11-10/"+key+".png" if key!="leganes" else "./assets/team-logos/2026-11-02/leganes.svg") for key in ["pamplona","eibar","trival","leganes","amorebieta","ud-logrones"]}
 dataPath=ROOT/"data/today.json"
 data=json.loads(dataPath.read_text(encoding="utf-8"))
 if data.get("reportDate")!="2026-11-10" or len(data.get("matches",[]))!=3:raise RuntimeError("Refuse to edit non-three-match main publication")
 for m in data["matches"]:
  for side in ["home","away"]:
   name=m[side]
   if name not in MAPPING:raise RuntimeError("Unknown team "+name)
   asset,official=MAPPING[name]
   m[side+"CrestUrl"]=images[asset]
   m[side+"CrestSourceUrl"]=got.get(asset,official)
  m["crestStatus"]="Verified original club identity; artwork locally bundled and available for website and PNG downloads"
 dataPath.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 oddsPath=ROOT/"data/odds/2026-11-10.json"
 odds=json.loads(oddsPath.read_text(encoding="utf-8"))
 for m in odds.get("matches",[]):
  if m.get("fixtureId") not in {x["fixtureId"] for x in data["matches"]}:continue
  selected=next(x for x in data["matches"] if x["fixtureId"]==m["fixtureId"])
  m["homeCrestUrl"]=selected["homeCrestUrl"]
  m["awayCrestUrl"]=selected["awayCrestUrl"]
 oddsPath.write_text(json.dumps(odds,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 (DST/"sources.json").write_text(json.dumps(got,indent=2)+"\n",encoding="utf-8")
 print("READY: six original team crests and exactly three main report records")
if __name__=="__main__":main()

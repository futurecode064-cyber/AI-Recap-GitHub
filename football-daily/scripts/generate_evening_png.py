#!/usr/bin/env python3
"""Generate permanent, directly downloadable PNGs from approved evening odds."""
import argparse
import json
import re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
BRANDS = {
    "future-code": ("FUTURE CODE FOOTBALL DAILY", "#215c55", "#163e3b", "#ffcb92"),
    "ykz-family": ("YKZ FAMILY GROUP", "#aa111b", "#650409", "#ffd36b"),
    "bw-sport": ("BW SPORT ဘောလုံးဂျာနယ်", "#0856c4", "#072d77", "#d9eefe"),
    "ko-thet-family": ("Ko Thet Family ဘောလုံးဂျာနယ်", "#830b15", "#45060c", "#ffdc78")
}
LEAGUES = {"UEFA Champions League":"ချန်ပီယံလိဂ်","Championship":"အင်္ဂလန် ချန်ပီယံရှစ်","UEFA Europa League":"ယူရိုပါလိဂ်","UEFA Conference League":"ယူရိုပါကွန်ဖရန့်လိဂ်"}
COLS = [150,310,180,125,125,195,125,125,195]
HEADERS = ["ပွဲချိန်","ယှဉ်ပြိုင်မည့်အသင်း","ကြေးပေးအသင်း","ဘော်ဒီ မူလ","ဘော်ဒီ ယခု","ဘော်ဒီ ကွာ","ဂိုး မူလ","ဂိုး ယခု","ဂိုး ကွာ"]
MARGIN, ROW_HEIGHT, LEAGUE_HEIGHT, HEAD_HEIGHT = 25,80,60,53
WIDTH = 2*MARGIN+sum(COLS)
FONT_REG = "/usr/share/fonts/truetype/noto/NotoSansMyanmar-Regular.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/noto/NotoSansMyanmar-Bold.ttf"

def font(size,bold=True):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG,int(size),layout_engine=ImageFont.Layout.RAQM)

def fit(draw,value,left,top,width,height,size=18,minimum=10,color="#152332"):
    value=str(value or "")
    for scale in range(size,minimum-1,-1):
        chosen=font(scale)
        if draw.textbbox((0,0),value,font=chosen)[2]<=width-12: break
    else: chosen=font(minimum)
    draw.text((left+width/2,top+height/2),value,font=chosen,fill=color,anchor="mm")

def movement(old,new):
    if old==new:return "မပြောင်း"
    pat=re.compile(r"^(\d*)([+-])(\d+)$")
    a,b=pat.fullmatch(old),pat.fullmatch(new)
    if old.endswith("="):al,av=old[:-1],0
    elif a:al,av=a[1],int(a[3])*(-1 if a[2]=="-" else 1)
    else:return f"{old} → {new}"
    if new.endswith("="):bl,bv=new[:-1],0
    elif b:bl,bv=b[1],int(b[3])*(-1 if b[2]=="-" else 1)
    else:return f"{old} → {new}"
    if al!=bl:return f"လိုင်း {al or '—'} → {bl or '—'}"
    d=bv-av
    return (("+" if d>0 else "")+str(d)+" မှတ်") if d else "မပြောင်း"

def render(date,rows,brand_id,league_filter,outdir):
    name,header,deep,accent=BRANDS[brand_id]
    leagues=list(dict.fromkeys(m["league"] for m in rows))
    groups=[(league,[m for m in rows if m["league"]==league]) for league in leagues]
    if league_filter:groups=[(league,matches) for league,matches in groups if league==league_filter]
    if not groups:raise ValueError("No approved matches for export")
    h=224+sum(LEAGUE_HEIGHT+HEAD_HEIGHT+len(items)*ROW_HEIGHT+12 for _,items in groups)+45
    image=Image.new("RGB",(WIDTH,h),"#ffffff")
    draw=ImageDraw.Draw(image)
    draw.rectangle((0,0,WIDTH,205),fill=deep)
    draw.rectangle((0,0,WIDTH,12),fill=accent)
    fit(draw,name,30,24,WIDTH-60,56,28,20,accent)
    fit(draw,"ညနေခင်းကြေးပြောင်း",30,88,WIDTH-60,67,46,38,"#ffffff")
    fit(draw,f"{date} · {sum(len(items) for _,items in groups)} ပွဲ",30,158,WIDTH-60,35,19,14,"#ffffff")
    xs=[MARGIN]
    for col in COLS:xs.append(xs[-1]+col)
    y=224
    for league,items in groups:
        draw.rectangle((MARGIN,y,WIDTH-MARGIN,y+LEAGUE_HEIGHT),fill=header)
        fit(draw,LEAGUES.get(league,league),MARGIN+12,y,WIDTH-2*MARGIN-24,LEAGUE_HEIGHT,27,19,"#ffffff")
        y+=LEAGUE_HEIGHT
        draw.rectangle((MARGIN,y,WIDTH-MARGIN,y+HEAD_HEIGHT),fill=deep)
        for i,title in enumerate(HEADERS):
            fit(draw,title,xs[i],y,COLS[i],HEAD_HEIGHT,17,10,"#ffffff")
        y+=HEAD_HEIGHT
        for n,m in enumerate(items):
            bottom=y+ROW_HEIGHT
            draw.rectangle((MARGIN,y,WIDTH-MARGIN,bottom),fill="#ffffff" if n%2==0 else "#f1f4f6")
            draw.rectangle((xs[2],y,xs[3],bottom),fill="#e4e8eb")
            for xx in xs:draw.line(((xx,y),(xx,bottom)),fill="#c7cdd3",width=1)
            draw.line(((MARGIN,bottom),(WIDTH-MARGIN,bottom)),fill="#c7cdd3",width=1)
            values=[m["kickoffDisplay"],m["home"]+" VS "+m["away"],m["upperTeam"],
                    m["morningBodyOdds"],m["eveningBodyOdds"],movement(m["morningBodyOdds"],m["eveningBodyOdds"]),
                    m["morningGoalTotalOdds"],m["eveningGoalTotalOdds"],movement(m["morningGoalTotalOdds"],m["eveningGoalTotalOdds"])]
            for i,value in enumerate(values):
                fit(draw,value,xs[i],y,COLS[i],ROW_HEIGHT,17 if i<=2 else 20,10)
            y=bottom
        y+=12
    slug="all" if not league_filter else re.sub(r"[^a-z0-9]+","-",league_filter.lower()).strip("-")
    path=outdir/date/f"{brand_id}-{slug}.png"
    path.parent.mkdir(parents=True,exist_ok=True)
    image.save(path,format="PNG",optimize=True)
    return path

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("date")
    args=parser.parse_args()
    date=args.date
    evening=json.loads((ROOT/"data/odds/evening"/(date+".json")).read_text("utf-8"))
    morning=json.loads((ROOT/"data/odds"/(date+".json")).read_text("utf-8"))
    rows=evening["matches"]
    if not rows or evening["reportDate"]!=date:raise ValueError("Missing approved evening rows")
    for match in rows:
        reference=morning["matches"][match["row"]-1]
        for field,original in [("home","home"),("away","away"),("morningBodyOdds","bodyOdds"),
                               ("morningGoalTotalOdds","goalTotalOdds")]:
            if match[field]!=reference[original]:raise ValueError(f"Morning quote differs at row {match['row']}: {field}")
    outdir=ROOT/"data/odds/evening/png"
    for brand in BRANDS:
        print(render(date,rows,brand,None,outdir))
        for league in dict.fromkeys(match["league"] for match in rows):
            print(render(date,rows,brand,league,outdir))

if __name__=="__main__":main()

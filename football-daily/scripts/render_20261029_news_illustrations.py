#!/usr/bin/env python3
"""Render 10 distinct, original, news-specific 1200x675 RGB PNGs.
A Wikimedia Commons image request was HTTP 429; these are honest original
editorial illustrations, not alleged photographs of Oct-28 matches.
"""
import json, pathlib, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
ROOT=pathlib.Path(__file__).resolve().parents[1]
FILE=ROOT/'data/news/latest.json'
news=json.loads(FILE.read_text(encoding='utf-8'))
assert news['date']=='2026-10-29' and len(news['items'])==10
OUT=ROOT/'assets/news-2026-10-29'
OUT.mkdir(parents=True,exist_ok=True)
SCENES=[
 ('LIVERPOOL','CHELSEA','#ca2937','#2569c1',"ENGLISH CUP · KNOCKOUT"),
 ('MAN CITY','BRIGHTON','#62bbdf','#1f4292',"ENGLISH CUP · KNOCKOUT"),
 ('BOURNEMOUTH','ASTON VILLA','#cc333c','#773450',"ENGLISH CUP · KNOCKOUT"),
 ('SUNDERLAND','BRENTFORD','#ef4742','#a64c49',"ENGLISH CUP · KNOCKOUT"),
 ('FLEETWOOD','ARSENAL','#d3383a','#c49a3b',"ENGLISH CUP · CUP SHOCK"),
 ('ARSENAL WOMEN','BENFICA','#c93647','#6d2342',"WOMEN'S CHAMPIONS LEAGUE"),
 ('INTER MILAN','VENEZIA','#0b50ab','#b58532',"ITALIAN SERIE A"),
 ('BOLOGNA','AC MILAN','#9b3147','#c53635',"ITALIAN SERIE A"),
 ('BURNLEY','HEAD COACH','#822f54','#bb944f',"CLUB MANAGEMENT NEWS"),
 ('MAN UNITED','TEAM CAPTAIN','#ba263a','#67263d',"CLUB CAPTAIN AND COACH"),
]
def rgb(color):
 return tuple(int(color[i:i+2],16) for i in (1,3,5))
def blend(a,b,t):
 return tuple(max(0,min(255,round(a[k]*(1-t)+b[k]*t))) for k in range(3))
def font(n,bold=False):
 loc='/usr/share/fonts/truetype/dejavu/DejaVuSans-' + ('Bold' if bold else '') + '.ttf'
 if not bold:loc='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
 return ImageFont.truetype(loc,n)
W,H=1200,675
for i,(a,b,ca,cb,category) in enumerate(SCENES):
 pic=Image.new('RGB',(W,H),'#06152d')
 d=ImageDraw.Draw(pic)
 A,B=rgb(ca),rgb(cb)
 for y in range(H):
  mix=(.15+.6*y/400) if y<410 else .2
  base=blend((5,18,42),blend(A,B,.5),min(.6,mix))
  d.line((0,y,W,y),fill=base,width=1)
 # Perspective stadium, seating and field.
 d.polygon([(0,250),(350,175),(850,175),(1200,250),(1200,465),(0,465)],fill='#0a172c')
 for y in range(255,415,15):
  d.line([(0,y+15),(600,max(186,y-58)),(1200,y+15)],fill='#32475e',width=3)
 for k in range(1000):
  x=(k*97+i*43)%1200;y=265+(k*43)%150
  if x<80 or x>1120:continue
  d.ellipse((x,y,x+2,y+2),fill=('#ecf1e4' if k%5==0 else '#a8acbf'))
 d.polygon([(0,415),(1200,415),(1200,H),(0,H)],fill='#154d3b')
 for y in range(430,H,70):d.rectangle((0,y,W,y+30),fill='#1b5b40')
 d.line([(0,620),(370,430),(830,430),(1200,620)],fill='#d9ebd4',width=4)
 d.ellipse((390,525,810,660),outline='#d9ebd4',width=4)
 d.line((600,430,600,675),fill='#c9ddd0',width=3)
 # Stadium floodlights with soft glow.
 gl=Image.new('RGBA',(W,H),(0,0,0,0));g=ImageDraw.Draw(gl)
 g.ellipse((10,70,260,310),fill=(245,238,191,80))
 g.ellipse((940,70,1190,310),fill=(245,238,191,80))
 gl=gl.filter(ImageFilter.GaussianBlur(55));pic=Image.alpha_composite(pic.convert('RGBA'),gl)
 d=ImageDraw.Draw(pic)
 for x in (112,1088):
  d.rectangle((x-9,35,x+9,365),fill='#becad0')
  d.rounded_rectangle((x-60,35,x+60,67),radius=7,fill='#e9f2dc')
 # Two iconic shirts with full shape and shadows.
 def shirt(cx,color):
  pts=[(cx-90,370),(cx-46,315),(cx-22,315),(cx,345),(cx+22,315),(cx+46,315),(cx+90,370),(cx+55,404),(cx+43,390),(cx+43,540),(cx-43,540),(cx-43,390),(cx-55,404)]
  d.polygon([(x+6,y+7) for x,y in pts],fill='#07121e')
  d.polygon(pts,fill=color)
  d.line(pts+[pts[0]],fill='#eaf0ef',width=5,joint='curve')
  d.line((cx-30,325,cx,355,cx+30,325),fill='#f6f4ee',width=6,joint='curve')
 shirt(235,ca);shirt(965,cb)
 # Central ball.
 d.ellipse((537,460,663,586),fill='#ffffff',outline='#07192d',width=8)
 d.polygon([(600,480),(629,500),(618,535),(582,535),(571,500)],fill='#173c56')
 for x,y in [(556,494),(644,494),(560,553),(640,553)]:
  d.line([(600,516),(x,y)],fill='#152f43',width=7)
 # Dark editorial glass header (independent of team colors).
 d.rounded_rectangle((32,28,1168,230),radius=23,fill=(7,18,37,246),outline='#8198ab',width=2)
 d.text((80,48),category,font=font(22,True),fill='#e1d4a6')
 d.text((80,107),a,font=font(38 if len(a)>12 else 51,True),fill='white')
 bbox=d.textbbox((0,0),b,font=font(38 if len(b)>11 else 51,True))
 d.text((1118-(bbox[2]-bbox[0]),107),b,font=font(38 if len(b)>11 else 51,True),fill='white')
 d.text((575,115),' / ' if i>=8 else 'VS',font=font(27,True),fill='#e6c775')
 d.line((80,174,1120,174),fill='#66778c',width=2)
 d.text((80,188),'FUTURE CODE FOOTBALL DAILY  |  EDITORIAL VISUAL',font=font(20,True),fill='#dfd8b8')
 d.rounded_rectangle((22,622,1178,657),radius=9,fill='#061428')
 label='ORIGINAL ILLUSTRATION  -  NOT A PHOTOGRAPH OF THE REPORTED EVENT'
 box=d.textbbox((0,0),label,font=font(16))
 d.text(((W-(box[2]-box[0]))//2,630),label,font=font(16),fill='#e5eced')
 fn=OUT/('editorial-'+str(i+1).zfill(2)+'.png')
 pic.convert('RGB').save(fn,optimize=True)
 assert fn.stat().st_size>35000,(fn,fn.stat().st_size)
 item=news['items'][i]
 item['image']='/assets/news-2026-10-29/'+fn.name
 item['imageFit']='contain'
 item['imageSourceUrl']='https://future-code-football-daily.pages.dev'+item['image']
 item['imageCredit']='Future Code AI Studio'
 item['imageLicense']='Original editorial illustration'
 item['imageLicenseUrl']=None
 item['imageLocalCached']=True
 print('DRAW',fn.name,fn.stat().st_size,flush=True)
FILE.write_text(json.dumps(news,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('TEN DISTINCT NEWS PNG ILLUSTRATIONS & CREDITS READY')

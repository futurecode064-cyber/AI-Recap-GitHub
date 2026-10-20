"use strict";
/* Main frame studio only: native Canvas layout matching the publication's card. */
(function(){
 const leagues={'Premier League':'ပရီးမီးယားလိဂ်','Serie A':'စီးရီးအေ','La Liga':'လာလီဂါ','Bundesliga':'ဘွန်ဒက်စ်လီဂါ','Ligue 1':'လီဂူးဝမ်း'};
 const safe=v=>v===undefined||v===null||String(v).trim()===''?'—':String(v);
 function result(g){if(!g)return '–';if(Number.isInteger(g.teamGoals)&&Number.isInteger(g.opponentGoals))return g.teamGoals>g.opponentGoals?'W':g.teamGoals<g.opponentGoals?'L':'D';return /^[WDL]$/.test(g.result||'')?g.result:'–';}
 function wrap(ctx,value,width,size){
  const words=typeof Intl.Segmenter==='function'?new Intl.Segmenter('my',{granularity:'word'}):null;
  const graphemes=typeof Intl.Segmenter==='function'?new Intl.Segmenter('my',{granularity:'grapheme'}):null;
  const rows=[[]];let used=0;
  for(const chunk of String(value||'').split(/(\*\*[^*\n]+\*\*)/g)){
   const bold=chunk.startsWith('**')&&chunk.endsWith('**'),str=bold?chunk.slice(2,-2):chunk;
   const tokens=words?[...words.segment(str)].map(s=>s.segment):str.split(/(\s+)/u);
   ctx.font=(bold?'800 ':'500 ')+size+'px "Noto Sans Myanmar",sans-serif';
   const push=token=>{if(token.includes('\n')){const parts=token.split('\n');for(let i=0;i<parts.length;i++){if(i){rows.push([]);used=0;}if(parts[i])push(parts[i]);}return;}const w=ctx.measureText(token).width;if(used+w>width&&used){rows.push([]);used=0;}const row=rows[rows.length-1];if(row.length&&row[row.length-1].bold===bold)row[row.length-1].str+=token;else row.push({str:token,bold});used+=w;};
   for(const token of tokens){if(ctx.measureText(token).width>width){for(const g of graphemes?[...graphemes.segment(token)].map(x=>x.segment):Array.from(token))push(g);}else push(token);}
  }return rows;
 }
 async function render(m,theme){
  const k=window.FutureCodeCanvasKit;if(!k)throw Error('Canvas module မရသေးပါ');await k.fonts();const leagueLogo=window.FutureCodeMainLogoAssets?.leagueCrest(m.league);await k.preloadImages([m.homeCrestUrl,m.awayCrestUrl,leagueLogo].filter(Boolean));
  const W=1200,M=24,px=25,gap=43,anaY=746;const measure=k.create(W,10).ctx;
  const article=String(m.dailyPreviewText||'ပွဲကြိုသုံးသပ်ချက် မရသေးပါ').replace(/\s*(?:ဖြစ်နိုင်တဲ့|ဖြစ်နိုင်သည့်|ခန့်မှန်း)\s*ဂိုးရလဒ်[^။\n]*[။]?/gu,'').trim();
  const rows=wrap(measure,article,W-2*M-48,px),H=anaY+104+Math.max(130,rows.length*gap)+32;
  const {canvas,ctx}=k.create(W,H);const t={...theme};
  const text=(s,x,y,size=22,color='#f5f8fa',bold=false,align='left',max)=>k.text(ctx,s,x,y,size,color,bold,align,max);
  const fill=(x,y,w,h,c,r=0)=>k.fill(ctx,x,y,w,h,c,r);
  const box=(x,y,w,h,c,r=10)=>{fill(x,y,w,h,c,r);ctx.strokeStyle=t.accent+'88';ctx.lineWidth=1.2;ctx.beginPath();ctx.roundRect(x+.6,y+.6,w-1.2,h-1.2,r);ctx.stroke();};
  const gradient=(x,y,w,h,a,b)=>{const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,a);g.addColorStop(1,b);fill(x,y,w,h,g);};
  fill(0,0,W,H,t.bg);fill(0,0,W,46,t.bg);if(leagueLogo)k.crest(ctx,leagueLogo,M,7,32,'',true);text(leagues[m.league]||m.league||'FOOTBALL',M+(leagueLogo?42:0),25,19,t.accent,true);
  gradient(0,46,455,300,t.head,t.bg);gradient(455,46,290,300,t.bg,t.panel);gradient(745,46,455,300,t.alt,t.bg);
  ctx.save();ctx.strokeStyle='#ffffff09';ctx.lineWidth=1;for(let y=65;y<350;y+=47){ctx.beginPath();ctx.moveTo(0,y+70);ctx.lineTo(W,y-150);ctx.stroke();}ctx.restore();
  k.crest(ctx,m.homeCrestUrl,128,103,186,m.homeDisplay||m.home,true);k.crest(ctx,m.awayCrestUrl,886,103,186,m.awayDisplay||m.away,true);
  text(leagues[m.league]||m.league||'',600,133,22,t.accent,true,'center',250);text('VS',600,235,88,'#fff',true,'center');
  fill(0,346,W,70,t.bg);fill(330,346,540,70,t.head);const fixture=(m.homeDisplay||m.home)+' နှင့် '+(m.awayDisplay||m.away);text(fixture,600,383,k.fit(ctx,fixture,510,30,17),t.accent,true,'center',510);
  fill(0,416,W,62,t.panel);const odds=m.myanmarOdds||{};text('မြန်မာကြေး',290,448,22,t.accent,true);text('ဘော်ဒီကြေး = '+safe(odds.upperTeam)+' '+safe(odds.bodyOdds),478,448,20,t.accent,true,'left',390);text('ဂိုးပေါင်းကြေး = '+safe(odds.goalTotalOdds),890,448,20,t.accent,true,'left',285);
  const Y=490,h=170,w=374,xs=[M,413,802];for(const x of xs)box(x,Y,w,h,t.panel);
  const form=(x,label,logo,games)=>{k.crest(ctx,logo,x+68,Y+16,30,label,true);text(label+' နောက်ဆုံး ၅ ပွဲ',x+110,Y+32,18,t.accent,true,'left',245);for(let i=0;i<5;i++){const letter=result(games?.[i]),cx=x+82+i*53,cy=Y+100;const c=letter==='W'?'#1f9c5d':letter==='D'?'#2588d3':letter==='L'?'#d94950':'#536363';const shine=ctx.createLinearGradient(cx-18,cy-18,cx+18,cy+18);shine.addColorStop(0,c);shine.addColorStop(1,c+'bb');fill(cx-18,cy-18,36,36,shine,18);text(letter,cx,cy+1,17,'#fff',true,'center');}};
  form(xs[0],m.homeDisplay||m.home,m.homeCrestUrl,m.homeLastFive);form(xs[2],m.awayDisplay||m.away,m.awayCrestUrl,m.awayLastFive);
  text('ပွဲပြီး 1X2 ကြေး',600,Y+32,22,t.accent,true,'center');box(xs[1]+12,Y+60,w-24,94,t.bg,5);
  const markets=[['အိမ်ရှင် (1)',m.homeOdds],['သရေ (X)',m.drawOdds],['ဧည့်သည် (2)',m.awayOdds]];for(let i=0;i<3;i++){const x=xs[1]+12+(w-24)*(i+.5)/3; if(i){ctx.strokeStyle=t.accent+'55';ctx.beginPath();ctx.moveTo(xs[1]+12+(w-24)*i/3,Y+66);ctx.lineTo(xs[1]+12+(w-24)*i/3,Y+147);ctx.stroke();}text(markets[i][0],x,Y+86,17,t.accent,true,'center',110);text(safe(markets[i][1]),x,Y+126,23,'#fff',true,'center',110);}
  fill(0,676,W,56,t.panel);text('ပွဲကြိုသုံးသပ်ချက်',M,704,24,t.accent,true);
  fill(0,732,W,H-732,t.bg);let y=anaY+40;for(const row of rows){let x=M;for(const run of row){text(run.str,x,y,px,run.bold?t.accent:'#f2f5f7',run.bold);ctx.font=(run.bold?'800 ':'500 ')+px+'px "Noto Sans Myanmar",sans-serif';x+=ctx.measureText(run.str).width;}y+=gap;}
  return canvas;
 }
 window.FutureCodeFramePreview={render,result,wrap};
})();

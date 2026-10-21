"use strict";
(function(){
 const SIZES={square:[1080,1080,"facebook-1x1"],feed:[1080,1350,"social-4x5"],story:[1080,1920,"story-9x16"]};
 const C={bg:"#142327",paper:"#1d3032",line:"#577066",gold:"#ffc08f",white:"#fbf5e9",muted:"#bed2c8"};
 const font=(s,b=false)=>(b?800:500)+" "+s+'px "Noto Sans Myanmar",sans-serif';
 function text(ctx,t,x,y,size,color=C.white,bold=false,align="left"){
  ctx.save();ctx.font=font(size,bold);ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline="top";ctx.fillText(String(t||""),x,y);ctx.restore();
 }
 function round(ctx,x,y,w,h,r,color,stroke){
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}
 }
 function load(url){
  return new Promise(resolve=>{
   if(!/^https:\/\//.test(String(url||""))){resolve(null);return}
   const img=new Image();let settled=false;const id=setTimeout(()=>end(null),6500);
   function end(v){if(settled)return;settled=true;clearTimeout(id);resolve(v)}
   img.crossOrigin="anonymous";img.onload=()=>end(img);img.onerror=()=>end(null);img.src=url;
  });
 }
 function fit(ctx,img,x,y,w,h){
  if(!img?.naturalWidth||!img?.naturalHeight)return false;
  const sc=Math.min(w/img.naturalWidth,h/img.naturalHeight),nw=img.naturalWidth*sc,nh=img.naturalHeight*sc;
  ctx.drawImage(img,x+(w-nw)/2,y+(h-nh)/2,nw,nh);return true;
 }
 function tokens(s){
  const value=String(s||"").replace(/\*\*/g,"").replace(/\s+/gu," ").trim();
  return typeof Intl.Segmenter==="function"
   ?[...new Intl.Segmenter("my",{granularity:"word"}).segment(value)].map(x=>x.segment)
   :value.split(/(\s+)/u).filter(Boolean);
 }
 function wrap(ctx,s,maxWidth,size){
  ctx.font=font(size);const out=[];let line="";
  for(const part of tokens(s)){
   if(ctx.measureText(line+part).width<=maxWidth){line+=part;continue}
   if(line.trim()){out.push(line.trim());line=""}
   if(ctx.measureText(part).width<=maxWidth){line=part.trimStart();continue}
   const segments=typeof Intl.Segmenter==="function"
    ?[...new Intl.Segmenter("my",{granularity:"grapheme"}).segment(part)].map(x=>x.segment):Array.from(part);
   for(const ch of segments){
    if(line&&ctx.measureText(line+ch).width>maxWidth){out.push(line.trim());line=""}
    line+=ch;
   }
  }
  if(line.trim())out.push(line.trim());return out;
 }
 function paragraph(ctx,content,x,y,width,size,lineHeight,maxLines){
  const rows=wrap(ctx,content,width,size);
  for(let i=0;i<Math.min(rows.length,maxLines);i++){
   let str=rows[i];
   if(i===maxLines-1&&rows.length>maxLines){
    ctx.font=font(size);while(str&&ctx.measureText(str+"…").width>width)str=str.slice(0,-1);
    str+="…";
   }
   text(ctx,str,x,y+i*lineHeight,size);
  }
 }
 function brand(ctx,opts,img){

  // Brand-owned social exports retain their fixed 1:1, 4:5 and 9:16 sizes.
  const mirrorTitles={
   "bw-sport":{main:"BW SPORT",sub:"ဘောလုံးဂျာနယ်",dark:"#08284d",accent:"#58cfff"},
   "ykz-family":{main:"YKZ FAMILY GROUP",sub:"အတူရှေ့ဆက် YKZ",dark:"#650a13",accent:"#ffd56a"},
   "ko-thet-family":{main:"KO THET FAMILY",sub:"ဘောလုံးဂျာနယ်",dark:"#59111d",accent:"#fbd274"}
  };
  const journal=mirrorTitles[window.FutureCodeBrandConfig?.id];
  if(journal){
   round(ctx,35,29,1010,113,15,journal.dark,journal.accent);
   round(ctx,54,42,80,80,14,journal.accent);
   if(!fit(ctx,img,61,49,66,66))text(ctx,journal.main.slice(0,3),94,67,27,journal.dark,true,"center");
   text(ctx,journal.main,151,37,55,"#ffffff",true);
   text(ctx,journal.sub,153,100,27,journal.accent,true);
   ctx.fillStyle=journal.accent;ctx.fillRect(54,145,972,3);
   return;
  }

  round(ctx,54,42,80,80,14,"#f6b07b");
  const name=String(opts.brandName||"FUTURE CODE FOOTBALL");
  if(!fit(ctx,img,61,49,66,66)){
   const letters=name==="FUTURE CODE FOOTBALL"?"FC+":name.split(/\s+/).map(s=>s[0]).slice(0,3).join("").toUpperCase();
   text(ctx,letters,94,70,28,C.bg,true,"center");
  }
  text(ctx,name,151,61,30,C.white,true);
  text(ctx,"DAILY FOOTBALL ANALYSIS · MYANMAR",151,104,16,C.muted);
  ctx.fillStyle=C.line;ctx.fillRect(54,143,972,2);
 }
 function crest(ctx,img,name,cx,y,size){
  if(fit(ctx,img,cx-size/2,y,size,size))return;
  round(ctx,cx-size/2,y,size,size,size/2,"#486358",C.muted);
  text(ctx,String(name||"").split(/\s+/).map(s=>s[0]).slice(0,3).join("").toUpperCase(),cx,y+size*.33,37,C.white,true,"center");
 }
 function teamName(ctx,t,x,y){
  let size=29;while(size>16){ctx.font=font(size,true);if(ctx.measureText(t).width<390)break;size--}
  text(ctx,t,x,y,size,C.white,true,"center");
 }
 const valid=x=>x!==null&&x!==undefined&&String(x).trim()!=="";
 function mm(m){
  const o=m.myanmarOdds||{},h=o.handicap||{},g=o.goals||{};
  return [
   valid(o.bodyOdds)?o.bodyOdds:[valid(h.line)?"အကျော "+h.line:"",valid(h.home)?m.home+" "+h.home:"",valid(h.away)?m.away+" "+h.away:""].filter(Boolean).join(" · ")||"—",
   valid(o.goalTotalOdds)?o.goalTotalOdds:[valid(g.line)?"ဂိုးပေါင်း "+g.line:"",valid(g.over)?"Over "+g.over:"",valid(g.under)?"Under "+g.under:""].filter(Boolean).join(" · ")||"—"
  ];
 }
 function draw(ctx,m,o,imgs,w,h){
  const square=h===1080,feed=h===1350,story=h===1920;
  const grad=ctx.createLinearGradient(0,0,w,h);
  grad.addColorStop(0,"#142125");grad.addColorStop(.55,"#2d4d3d");grad.addColorStop(1,"#162629");
  ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  round(ctx,16,16,w-32,h-32,28,C.paper,C.line);
  brand(ctx,o,imgs[2]);
  text(ctx,"◈ "+(o.leagueLabel||m.league||""),59,163,21,C.gold,true);
  text(ctx,m.kickoffYangon||"",1023,163,19,C.muted,false,"right");
  const faceY=story?241:217,faceH=story?455:feed?345:295;
  round(ctx,58,faceY,964,faceH,22,"#2b443e",C.line);
  const size=story?215:feed?175:145,y=faceY+(story?54:feed?48:38);
  crest(ctx,imgs[0],m.home,285,y,size);crest(ctx,imgs[1],m.away,795,y,size);
  const vsY=y+size/2;round(ctx,481,vsY-50,118,100,48,"#16292c",C.gold);
  ctx.save();ctx.font=font(43,true);ctx.textBaseline="middle";ctx.fillStyle=C.gold;ctx.textAlign="center";ctx.fillText("VS",540,vsY);ctx.restore();
  teamName(ctx,m.home,285,y+size+16);teamName(ctx,m.away,795,y+size+16);
  const oddsY=faceY+faceH+24;
  round(ctx,58,oddsY,964,114,14,"#31443b",C.line);
  const oddsW=964/3;
  [[m.home+" နိုင် (1)",m.homeOdds],["သရေ (X)",m.drawOdds],[m.away+" နိုင် (2)",m.awayOdds]].forEach(([label,val],i)=>{
   const cx=58+oddsW*(i+.5);
   text(ctx,label,cx,oddsY+12,18,C.muted,false,"center");
   text(ctx,valid(val)?val:"—",cx,oddsY+54,31,C.white,true,"center");
   if(i<2){ctx.fillStyle=C.line;ctx.fillRect(58+(i+1)*oddsW,oddsY+12,1,90)}
  });
  const marketY=oddsY+132;
  round(ctx,58,marketY,964,143,13,"#2b4135","#808960");
  text(ctx,"မြန်မာကြေး",77,marketY+8,20,C.gold,true);
  const [body,goals]=mm(m);
  text(ctx,"ဘော်ဒီကြေး = "+body,77,marketY+50,21);
  text(ctx,"ဂိုးပေါင်းကြေး = "+goals,77,marketY+95,21);
  const previewY=marketY+158,footerY=h-91;
  text(ctx,"ပွဲကြိုသုံးသပ်ချက်အကျဉ်း",59,previewY,24,C.gold,true);
  const source=String(m.dailyPreviewText||m.analysis||"");
  const quotes=[...source.matchAll(/\*\*([^*]+)\*\*/g)].map(x=>x[1]);
  const verdict=quotes[0]||m.verdict||"",scores=quotes[1]||m.predictedScore||"";
  // Fixed social aspect ratios cannot hold an entire long Burmese article legibly.
  // Retain the full article in the existing variable-height PNG export.
  const verdictY=story?h-276:feed?h-240:null;
  const textY=previewY+49;
  const maxRows=square?Math.max(1,Math.floor((footerY-textY-18)/39)):Math.max(2,Math.floor((verdictY-textY-18)/42));
  paragraph(ctx,source,61,textY,955,22,story?42:39,maxRows);
  if(verdictY!==null&&verdict){
   round(ctx,58,verdictY,964,story?163:139,14,"#354c3b",C.line);
   text(ctx,"ရွေးချယ်ချက်",77,verdictY+8,19,C.gold,true);
   paragraph(ctx,verdict,77,verdictY+41,925,21,36,story?2:1);
   if(scores)text(ctx,"ခန့်မှန်းရလဒ် · "+scores,77,verdictY+(story?123:100),18,C.muted,true);
  }
  ctx.fillStyle=C.line;ctx.fillRect(58,footerY,964,2);
  text(ctx,o.brandName||"FUTURE CODE FOOTBALL",58,footerY+14,20,C.gold,true);
  text(ctx,"FULL ANALYSIS ON WEBSITE",1022,footerY+18,16,C.muted,false,"right");
 }
 async function save(match,opts={}){
  const s=SIZES[opts.format];if(!s)throw Error("Invalid image format");
  if(!match?.home||!match?.away)throw Error("Invalid match");
  if(document.fonts?.load)await Promise.allSettled([document.fonts.load(font(25)),document.fonts.load(font(25,true))]);
  const canvas=document.createElement("canvas");canvas.width=s[0];canvas.height=s[1];
  const ctx=canvas.getContext("2d");if(!ctx)throw Error("PNG Canvas unavailable");
  const imgs=await Promise.all([load(match.homeCrestUrl),load(match.awayCrestUrl),load(opts.brandLogoUrl)]);
  draw(ctx,match,opts,imgs,s[0],s[1]);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(v=>v?resolve(v):reject(Error("PNG encoding failed")),"image/png"));
  const url=URL.createObjectURL(blob),link=document.createElement("a");
  const slug=t=>String(t||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
  link.href=url;link.download=[slug(opts.brandName||"football"),slug(match.home),slug(match.away),s[2]].join("-")+".png";
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
 }
 window.FutureCodeSocialExport={save};
})();

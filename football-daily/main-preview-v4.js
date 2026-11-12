"use strict";
/* Preview V4: main website only, odds-free stadium card using existing approved V2 editorial. */
(function(){
 if(!["/","/index.html"].includes(location.pathname))return;
 const root=document.getElementById("fcPreviewV4");if(!root)return;
 const el=id=>document.getElementById(id);
 const node=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
 const clean=s=>String(s??"").normalize("NFC").replace(/\*\*|&nbsp;/g,"").replace(/\s+/gu," ").trim();
 const selection=m=>m.previewV2Selection||window.FutureCodePreviewV2?.choice(m)||"—";
 const editorial=m=>clean(m.previewV2Summary);
 const eligible=m=>!!(m?.fixtureId&&editorial(m)&&[m.homeDisplay,m.awayDisplay].includes(selection(m))&&m.dailyPreviewText);
 const clock=m=>m.kickoffDisplay||window.FutureCodeTime?.clock?.(m)||m.kickoff||"—";
 const resultForm=(m,side)=>{const arr=m[side+"LastFive"];return Array.isArray(arr)?arr.slice(0,5).map(x=>["W","D","L"].includes(x?.result)?x.result:"—"):[];};
 const formColor={W:"#08b783",D:"#337eaa",L:"#d63859","—":"#526679"};
 let matches=[],date="",picked=new Set(),busy=false,renderGeneration=0;
 const urls=[],logos=new Map();
 const graphemes=s=>typeof Intl.Segmenter==="function"?Array.from(new Intl.Segmenter("my",{granularity:"grapheme"}).segment(s),x=>x.segment):Array.from(s);
 const tokens=s=>typeof Intl.Segmenter==="function"?Array.from(new Intl.Segmenter("my",{granularity:"word"}).segment(s),x=>x.segment):graphemes(s);
 function wrap(ctx,value,width){
  const lines=[];let line="";
  for(const word of tokens(value)){
   const next=line+word;
   if(line&&ctx.measureText(next).width>width){lines.push(line.trimEnd());line=word.trimStart();}
   else line=next;
   if(ctx.measureText(line).width>width){
    let part="";for(const ch of graphemes(line)){if(part&&ctx.measureText(part+ch).width>width){lines.push(part);part="";}part+=ch;}line=part;
   }
  }
  if(line.trim())lines.push(line.trimEnd());
  return lines;
 }
 async function image(src){
  if(!src)return null;
  let url;try{
   const mapped=window.FutureCodeMainLogoAssets?.imageUrl?.(src)||src;
   url=new URL(mapped,document.baseURI);
   if(url.protocol!=="https:"&&url.origin!==location.origin)return null;
  }catch{return null;}
  if(logos.has(url.href))return logos.get(url.href);
  const promise=new Promise(resolve=>{
   const img=new Image();let done=false;
   const finish=value=>{if(done)return;done=true;clearTimeout(timer);resolve(value);};
   const timer=setTimeout(()=>finish(null),6500);
   if(url.origin!==location.origin)img.crossOrigin="anonymous";
   img.onload=()=>finish(img);img.onerror=()=>finish(null);img.src=url.href;
  });
  logos.set(url.href,promise);return promise;
 }
 function panel(ctx,x,y,w,h,r,fill,stroke="#e9bd60",line=3){
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=line;ctx.strokeStyle=stroke;ctx.stroke();}
 }
 function label(ctx,text,x,y,max,font=28,color="#fff",weight=800){
  ctx.fillStyle=color;ctx.font=weight+" "+font+'px "FCMyanmar",sans-serif';ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(String(text||"—"),x,y,max);
 }
 function crest(ctx,img,x,y,sz,name){
  if(img){const scale=Math.min(sz/img.naturalWidth,sz/img.naturalHeight),w=img.naturalWidth*scale,h=img.naturalHeight*scale;
   ctx.drawImage(img,x+(sz-w)/2,y+(sz-h)/2,w,h);}
  else{panel(ctx,x,y,sz,sz,12,"#173b58","#b18a47",2);label(ctx,"လိုဂို မရသေး",x+sz/2,y+sz/2,sz-9,16);}
 }
 function formBox(ctx,arr,x,y){
  panel(ctx,x,y,510,112,14,"#06182b","#e7b95c",2);
  label(ctx,"နောက်ဆုံး ၅ ပွဲရလဒ်",x+255,y+26,420,24,"#fff",800);
  for(let i=0;i<5;i++){
   const s=arr[i]||"—",cx=x+86+i*85;
   ctx.beginPath();ctx.arc(cx,y+78,25,0,Math.PI*2);ctx.fillStyle=formColor[s];ctx.fill();
   label(ctx,s,cx,y+78,50,25,"#fff",900);
  }
 }
 async function render(m,options={}){
  if(!eligible(m))throw Error("Version 2 အတည်ပြုသုံးသပ်ချက် / ရွေးချယ်မှု မပြည့်စုံပါ");
  await window.FutureCodeCanvasKit?.fonts?.();
  await document.fonts?.load('700 28px "FCMyanmar"');
  await document.fonts?.ready;
  const W=1080,H=1920,pick=selection(m),prose=editorial(m),homeName=m.homeDisplay||m.home,awayName=m.awayDisplay||m.away;
  const canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;
  const c=canvas.getContext("2d");if(!c)throw Error("Poster Canvas မရပါ");
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
  const [homeLogo,awayLogo,stadium,leagueLogo]=await Promise.all([
   image(m.homeCrestUrl),image(m.awayCrestUrl),image("./assets/preview-stadium-night.jpg"),image(m.leagueLogoUrl)
  ]);
  const chosenSide=pick===homeName?"home":"away",chosenLogo=chosenSide==="home"?homeLogo:awayLogo;
  const chosenForm=resultForm(m,chosenSide);
  const chosenStanding=m[chosenSide+"Standing"];
  const RED="#a90d23",DARK="#070b12",GOLD="#f5c55f",PALE="#ffe2a0",WHITE="#fff7eb";
  const stripe=(x,y,w,h,left,right)=>{
   const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,left);g.addColorStop(1,right);c.fillStyle=g;c.fillRect(x,y,w,h);
  };
  const heading=(value,x,y,width,size,color=WHITE,weight=900)=>{
   label(c,value,x,y,width,size,color,weight);
  };
  function roundedGradient(x,y,w,h,r,top,bottom,stroke=GOLD,border=3){
   const grad=c.createLinearGradient(x,y,x,y+h);grad.addColorStop(0,top);grad.addColorStop(1,bottom);
   panel(c,x,y,w,h,r,grad,stroke,border);
  }
  function goldRule(x1,y,x2,weight=3){
   c.beginPath();c.moveTo(x1,y);c.lineTo(x2,y);c.strokeStyle=GOLD;c.lineWidth=weight;c.stroke();
  }
  function badge(x,y,size,txt,background="#142c39"){
   panel(c,x,y,size,size,12,background,GOLD,2);
   heading(txt,x+size/2,y+size/2,size-8,22,"#fff",900);
  }
  function formDots(values,x,y,step=61){
   for(let i=0;i<5;i++){
    const s=values[i]||"—",cx=x+i*step;
    c.beginPath();c.arc(cx,y,23,0,2*Math.PI);c.fillStyle=formColor[s];c.fill();
    c.strokeStyle="#ffffffa0";c.lineWidth=1;c.stroke();
    heading(s,cx,y,40,23,"#fff",900);
   }
  }
  function fitEditorial(){
   const metric=document.createElement("canvas").getContext("2d");
   for(let font=31;font>=20;font--){
    metric.font='600 '+font+'px "FCMyanmar",sans-serif';
    const lines=wrap(metric,prose,935),leading=Math.ceil(font*1.62);
    if(lines.length*leading<=326)return {lines,font,leading};
   }
   throw Error("V4 အတွက် သုံးသပ်ချက်စာသား ရှည်လွန်းပါသည် — ဖြတ်တောက်မထားပါ");
  }
  const paragraph=fitEditorial();
  // Stadium and red-and-black stage are decorative. Source-dependent graphics
  // are always loaded from the actual published fixture, never a baked-in sample.
  c.fillStyle=DARK;c.fillRect(0,0,W,H);
  const background=c.createLinearGradient(0,0,W,H);
  background.addColorStop(0,"#3e0713");background.addColorStop(.28,"#060b17");
  background.addColorStop(.62,"#151018");background.addColorStop(1,"#03040a");
  c.fillStyle=background;c.fillRect(0,0,W,H);
  if(stadium){
   const sw=stadium.naturalWidth,sh=stadium.naturalHeight;
   // Fill panoramic hero while keeping the pitch visible around the club cards.
   const scale=Math.max(W/sw,640/sh),dw=sw*scale,dh=sh*scale;
   c.save();c.globalAlpha=.72;c.drawImage(stadium,(W-dw)/2,220,dw,dh);c.restore();
   stripe(0,220,W,690,"#09091111","#05080ce9");
  }
  // Red lights, gold framing, diagonal metallic accents.
  for(const [cx,cy,rad] of [[72,42,450],[1053,22,440],[505,865,550]]){
   const glow=c.createRadialGradient(cx,cy,6,cx,cy,rad);
   glow.addColorStop(0,"#ef244b83");glow.addColorStop(.38,"#9a102e39");glow.addColorStop(1,"#00000000");
   c.fillStyle=glow;c.fillRect(cx-rad,cy-rad,rad*2,rad*2);
  }
  for(let i=0;i<8;i++){
   c.beginPath();c.moveTo(i*52-135,0);c.lineTo(i*62+68,320);
   c.strokeStyle=i%2?"#ffcc661b":"#eb18352c";c.lineWidth=i%2?3:6;c.stroke();
   c.beginPath();c.moveTo(W-i*52+135,0);c.lineTo(W-i*62-68,320);c.stroke();
  }
  c.strokeStyle="#db9c3e";c.lineWidth=4;c.strokeRect(11,11,W-22,H-22);
  c.strokeStyle="#f8cc735e";c.lineWidth=2;c.strokeRect(20,20,W-40,H-40);
  heading("FUTURE CODE",W/2,64,870,57,GOLD,900);
  heading("FOOTBALL • MATCH PREVIEW",W/2,110,850,22,"#fff",800);
  goldRule(165,139,915,3);
  roundedGradient(128,151,824,98,16,"#b9152c","#44050d",GOLD,4);
  heading("ပွဲကြိုသုံးသပ်ချက်",W/2,201,770,55,"#fff",900);
  roundedGradient(415,253,250,48,8,"#1b0a0d","#12060b",GOLD,2);
  heading("VERSION 4",W/2,278,220,26,GOLD,900);
  // League and actual fixture date/time.
  roundedGradient(188,323,704,61,12,"#0c192a","#070d17",GOLD,2);
  if(leagueLogo)crest(c,leagueLogo,215,332,42,m.leagueDisplay);
  heading(m.leagueDisplay||m.league,570,354,610,27,WHITE,800);
  const localDate=String(m.kickoffCalendarDate||date||"").slice(0,10)||date;
  roundedGradient(111,396,404,50,24,"#090e1b","#07101c",GOLD,2);
  roundedGradient(565,396,404,50,24,"#090e1b","#07101c",GOLD,2);
  heading(localDate,313,421,354,26,WHITE,850);
  heading(clock(m)+"  MMT",767,421,350,27,WHITE,850);
  // Large opposing club crests; no fabricated player photos.
  roundedGradient(62,465,449,175,24,"#240b14","#090f1a",GOLD,4);
  roundedGradient(569,465,449,175,24,"#240b14","#090f1a",GOLD,4);
  crest(c,homeLogo,74,478,145,homeName);
  crest(c,awayLogo,861,478,145,awayName);
  heading(homeName,356,550,258,34,WHITE,900);
  heading(awayName,722,550,263,34,WHITE,900);
  c.shadowColor="#ffe58d";c.shadowBlur=24;
  heading("VS",W/2,551,100,67,GOLD,900);
  c.shadowBlur=0;
  // Form strips mirror the reference's five circular results.
  roundedGradient(55,668,472,126,16,"#091424","#090c15",GOLD,3);
  roundedGradient(553,668,472,126,16,"#091424","#090c15",GOLD,3);
  heading("နောက်ဆုံး ၅ ပွဲရလဒ်",291,696,421,25,WHITE,850);
  heading("နောက်ဆုံး ၅ ပွဲရလဒ်",789,696,421,25,WHITE,850);
  formDots(resultForm(m,"home"),165,748,61);
  formDots(resultForm(m,"away"),664,748,61);
  // Oversized editorial choice, the dominant graphic element.
  c.shadowColor="#ffb849";c.shadowBlur=16;
  roundedGradient(188,824,704,79,19,"#ab0c26","#52040d",GOLD,5);
  c.shadowBlur=0;
  heading("အယ်ဒီတာ ရွေးချယ်မှု",W/2,864,664,45,GOLD,900);
  c.shadowColor="#ffb83c";c.shadowBlur=23;
  roundedGradient(39,914,1002,226,21,"#c21930","#660409","#fff0a8",7);
  c.shadowBlur=0;
  crest(c,chosenLogo,77,951,147,pick);
  heading(pick,672,1009,683,76,WHITE,900);
  heading("လက်ရှိခြေစွမ်းအပေါ် အခြေခံသော အယ်ဒီတာအမြင်",656,1094,684,24,PALE,700);
  // Complete, source-approved V2 editorial: no invented analysis and no clipping.
  roundedGradient(38,1172,1004,456,17,"#07121d","#040710",GOLD,4);
  roundedGradient(63,1148,410,60,12,"#ffe091","#dba33d",null,0);
  heading("ပွဲကြို သုံးသပ်ချက်",264,1179,380,34,"#1c1010",900);
  c.fillStyle=WHITE;c.font='600 '+paragraph.font+'px "FCMyanmar",sans-serif';
  c.textAlign="left";c.textBaseline="top";
  let ty=1238;
  for(const line of paragraph.lines){c.fillText(line,77,ty,935);ty+=paragraph.leading;}
  if(ty>1614)throw Error("သုံးသပ်ချက်စာသား မဆံ့ပါ — PNG မဖြတ်ပါ");
  // Three compact, factual reasons based on actual five-match form and standings.
  roundedGradient(300,1649,480,53,10,"#ab0c26","#570511",GOLD,3);
  heading("ရွေးချယ်မှု အခြေခံအချက်များ",540,1677,441,29,WHITE,850);
  const stats=chosenForm.reduce((o,s)=>(o[s]=(o[s]||0)+1,o),{W:0,D:0,L:0});
  const formText=stats.W+"W / "+stats.D+"D / "+stats.L+"L";
  const standingText=Number.isInteger(chosenStanding?.position)&&Number.isFinite(chosenStanding?.points)
   ?"အဆင့် "+chosenStanding.position+" · "+chosenStanding.points+" မှတ်"
   :"အတည်ပြုဒေတာ မရှိသေး";
  const chipData=[
   ["နောက်ဆုံး ၅ ပွဲ",formText],
   ["လိဂ်ရပ်တည်မှု",standingText],
   ["သုံးသပ်ချက်အရ","အယ်ဒီတာ၏ အမြင်"]
  ];
  for(let i=0;i<3;i++){
   const x=36+i*342,w=324;
   roundedGradient(x,1720,w,111,12,"#152032","#050911",GOLD,2);
   heading(chipData[i][0],x+w/2,1751,w-28,22,GOLD,850);
   heading(chipData[i][1],x+w/2,1792,w-27,23,WHITE,900);
  }
  goldRule(37,1858,1043,3);
  heading("FUTURE CODE • FOOTBALL",298,1882,540,27,GOLD,900);
  heading("အားကစားဆိုင်ရာ သုံးသပ်ချက်သာ ဖြစ်သည်",796,1882,468,22,WHITE,650);
  return canvas;
 }
 const blob=canvas=>new Promise((resolve,reject)=>canvas.toBlob(b=>b?.size?resolve(b):reject(Error("PNG မထွက်ပါ")),"image/png"));
 function save(b,name){
  const url=URL.createObjectURL(b),a=node("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 }
 function shown(){
  const k=el("fcV4League").value;
  return matches.filter(m=>k==="all"||m.league===k);
 }
 function chosen(){
  const checked=shown().filter(m=>picked.has(m.fixtureId));
  return checked.length?checked:shown();
 }
 function setStatus(msg){el("fcV4Status").textContent=msg;}
 async function framed(m,frameId){
  const f=frameId!=="none"?window.FutureCodeProfessionalFrames?.getFrame?.(frameId):null;
  const base=await render(m,{color:f?.color});
  return frameId!=="none"&&window.FutureCodeProfessionalFrames?.wrap?window.FutureCodeProfessionalFrames.wrap(base,"previewsV4","pro:"+frameId):base;
 }
 async function combine(rows,frameId){
  const canvases=[];for(const m of rows)canvases.push(await render(m));
  const W=1080,height=canvases.reduce((n,x)=>n+x.height,0)+(canvases.length-1)*4;
  if(height>32767||height*W>108000000)throw Error("PNG အမြင့်များလွန်းပါသည်");
  const out=document.createElement("canvas");out.width=W;out.height=height;
  const c=out.getContext("2d");let y=0;for(const item of canvases){c.drawImage(item,0,y);y+=item.height+4;}
  return frameId!=="none"&&window.FutureCodeProfessionalFrames?.wrap?window.FutureCodeProfessionalFrames.wrap(out,"previewsV4","pro:"+frameId):out;
 }
 async function exportMatches(mode){
  if(busy)return;busy=true;
  try{
   const rows=chosen();if(!rows.length)throw Error("ပွဲမရှိပါ");
   const frame=el("fcV4Frame").value;
   setStatus("Version 4 PNG ဖန်တီးနေပါသည်…");
   if(mode==="zip"){
    const Archive=window.FutureCodeFrameZip?.Archive;if(!Archive)throw Error("ZIP engine မရရှိပါ");
    const zip=new Archive();
    for(let i=0;i<rows.length;i++){
     const b=await blob(await framed(rows[i],frame));
     await zip.add("ပွဲကြိုသုံးသပ်ချက် Version 4/V4-"+String(i+1).padStart(2,"0")+"-"+rows[i].fixtureId+".png",b);
     setStatus("PNG "+(i+1)+"/"+rows.length+" ဖန်တီးပြီး");
    }
    save(zip.finish(),"Preview-V4-"+date+"-"+rows.length+"-matches.zip");
   }else{
    const amount=mode==="pair"?2:1;
    save(await blob(await combine(rows.slice(0,amount),frame)),"Preview-V4-"+date+"-"+rows.slice(0,amount).map(x=>x.fixtureId).join("_")+".png");
   }
   setStatus("Version 4 Download အဆင်သင့်ဖြစ်ပါပြီ");
  }catch(error){setStatus("Download မရပါ — "+error.message);}finally{busy=false;}
 }
 async function show(){
  if(new URLSearchParams(location.search).has("frame-engine"))return;
  const gen=++renderGeneration,host=el("fcV4Cards");host.replaceChildren();
  const rows=shown();el("fcV4Count").textContent=rows.length+" ပွဲ";
  if(!rows.length){host.append(node("p","fc-v4-note","ရွေးထားသော လိဂ်တွင် ပွဲမရှိပါ"));return;}
  for(const match of rows){
   if(gen!==renderGeneration)return;
   const article=node("article","fc-v4-card"),picture=node("img","fc-v4-picture");
   picture.alt=(match.homeDisplay||match.home)+" VS "+(match.awayDisplay||match.away)+" — ပွဲကြိုသုံးသပ်ချက် Version 4";
   picture.loading="lazy";
   const bar=node("div","fc-v4-card-actions"),check=node("label","fc-v4-select"),input=node("input");
   input.type="checkbox";input.checked=picked.has(match.fixtureId);
   input.onchange=()=>{if(input.checked)picked.add(match.fixtureId);else picked.delete(match.fixtureId);el("fcV4Selected").textContent=picked.size+" ပွဲရွေးထားသည်";};
   check.append(input,node("span",null,"Download အတွက် ရွေးရန်"));
   const button=node("button",null,"⬇ ဒီပွဲ PNG");button.type="button";
   button.onclick=async()=>{if(busy)return;busy=true;try{setStatus("PNG ပြင်ဆင်နေပါသည်…");save(await blob(await framed(match,el("fcV4Frame").value)),"Preview-V4-"+date+"-"+match.fixtureId+".png");setStatus("PNG Download အဆင်သင့်");}catch(e){setStatus("Download မရပါ — "+e.message);}finally{busy=false;}};
   bar.append(check,button);article.append(picture,bar);host.append(article);
   try{
    const canvas=await render(match);
    if(gen!==renderGeneration)return;
    const b=await blob(canvas),url=URL.createObjectURL(b);
    urls.push(url);picture.src=url;
   }catch(e){picture.replaceWith(node("p","fc-v4-note",match.homeDisplay+" — "+e.message));}
  }
 }
 async function load(){
  const f=window.FootballData?.fetch||fetch,res=await f(new URL("./data/today.json",document.baseURI),{cache:"no-store"});
  if(!res.ok)throw Error("ပွဲစဉ်ဒေတာ မရရှိပါ");
  const report=await res.json();if(!report.published||!Array.isArray(report.matches))throw Error("ထုတ်ဝေထားသော ပွဲများ မရှိသေးပါ");
  matches=report.matches.filter(eligible);date=report.reportDate;
  const select=el("fcV4League"),old=select.value;
  select.replaceChildren(new Option("လိဂ်အားလုံး","all"));
  for(const league of [...new Set(matches.map(m=>m.league))]){
   select.add(new Option(matches.find(m=>m.league===league).leagueDisplay||league,league));
  }
  if([...select.options].some(x=>x.value===old))select.value=old;
  el("fcV4Date").textContent=date;
  setStatus(matches.length+" ပွဲ · V2 သုံးသပ်ချက်နှင့် ရွေးချယ်မှုကို အသုံးပြုထားပါသည်");
  await show();
 }
 async function initFrames(){
  const api=window.FutureCodeProfessionalFrames;if(!api)return;await api.ready;
  const select=el("fcV4Frame");select.replaceChildren(new Option("မူရင်း Red & Gold V4","none"));
  for(const frame of await api.list("previewsV4"))select.add(new Option(frame.name,frame.id));
  const choice=await api.getSelected("previewsV4");if([...select.options].some(o=>o.value===choice))select.value=choice;
 }
 window.FutureCodePreviewV4=Object.freeze({render,eligible,editorial,selection,load});
 el("fcV4League").onchange=show;
 el("fcV4One").onclick=()=>exportMatches("one");
 el("fcV4Pair").onclick=()=>exportMatches("pair");
 el("fcV4Zip").onclick=()=>exportMatches("zip");
 el("fcV4Reload").onclick=()=>load().catch(e=>setStatus(e.message));
 const start=()=>{initFrames().catch(console.warn);load().catch(e=>setStatus(e.message));};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();

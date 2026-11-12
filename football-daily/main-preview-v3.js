"use strict";
/* Preview V3: main website only, odds-free stadium card using existing approved V2 editorial. */
(function(){
 if(!["/","/index.html"].includes(location.pathname))return;
 const root=document.getElementById("fcPreviewV3");if(!root)return;
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
  if(!eligible(m))throw Error("Version 2 သုံးသပ်ချက်နှင့် ရွေးချယ်မှု အတည်ပြုချက် မပြည့်စုံပါ");
  await window.FutureCodeCanvasKit?.fonts?.();await document.fonts?.load('600 27px "FCMyanmar"');
  const prose=editorial(m),W=1200;
  const metric=document.createElement("canvas").getContext("2d");
  metric.font='600 27px "FCMyanmar",sans-serif';
  const lines=wrap(metric,prose,1060);
  if(!lines.length)throw Error("သုံးသပ်ချက်စာသား မရှိပါ");
  const descTop=502,leading=47,descH=Math.max(258,115+lines.length*leading);
  const pickTop=descTop+descH+15,H=pickTop+190;
  if(H>10000)throw Error("သုံးသပ်ချက် အလွန်ရှည်နေပါသည်");
  const canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;const c=canvas.getContext("2d");
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
  const gold="#f1bf5f",cream="#ffe0a0",navy="#061a2d";
  const bg=c.createLinearGradient(0,0,W,H);bg.addColorStop(0,"#041427");bg.addColorStop(.48,"#0b3451");bg.addColorStop(1,"#071726");
  c.fillStyle=bg;c.fillRect(0,0,W,H);
  const [home,away,stadium]=await Promise.all([image(m.homeCrestUrl),image(m.awayCrestUrl),image("./assets/preview-stadium-night.jpg")]);
  if(stadium){
   c.save();c.globalAlpha=.42;c.drawImage(stadium,0,0,W,464);c.restore();
   const fade=c.createLinearGradient(0,0,0,475);fade.addColorStop(0,"#03162c18");fade.addColorStop(.67,"#071d31b0");fade.addColorStop(1,navy);
   c.fillStyle=fade;c.fillRect(0,0,W,475);
  }
  c.strokeStyle="#2e81b6";c.lineWidth=6;c.strokeRect(8,8,W-16,H-16);
  c.strokeStyle=gold;c.lineWidth=2;c.strokeRect(17,17,W-34,H-34);
  panel(c,440,22,320,89,12,"#ebf0ed",gold,3);
  panel(c,493,28,214,27,8,"#c32139",null);
  label(c,"MATCH PREVIEW",600,42,194,17,"#fff",900);
  label(c,"ပွဲကြိုသုံးသပ်ချက်",600,80,302,25,"#0b2f4e",900);
  panel(c,440,125,320,77,13,"#07233b",gold,3);
  label(c,clock(m),600,156,300,35,"#fff",900);
  label(c,"မြန်မာစံတော်ချိန် (MMT)",600,185,295,15,"#d8e9ee");
  crest(c,home,118,33,178,m.homeDisplay||m.home);
  crest(c,away,904,33,178,m.awayDisplay||m.away);
  panel(c,31,225,483,77,11,"#092c4b",gold,3);
  panel(c,686,225,483,77,11,"#092c4b",gold,3);
  label(c,m.homeDisplay||m.home,271,262,452,39,"#fff",900);
  label(c,m.awayDisplay||m.away,929,262,452,39,"#fff",900);
  c.shadowColor="#ffce67";c.shadowBlur=16;
  label(c,"VS",600,264,135,72,gold,900);c.shadowBlur=0;
  formBox(c,resultForm(m,"home"),36,325);
  formBox(c,resultForm(m,"away"),654,325);
  panel(c,31,descTop,1138,descH,15,"#061626",gold,3);
  panel(c,43,descTop-22,319,56,11,"#f2c76d","#fff0c4",2);
  label(c,"ပွဲကြိုသုံးသပ်ချက်",203,descTop+6,295,29,"#082a46",900);
  c.fillStyle="#fff";c.font='600 27px "FCMyanmar",sans-serif';c.textAlign="left";c.textBaseline="top";
  let ty=descTop+67;
  for(const line of lines){c.fillText(line,70,ty,1060);ty+=leading;}
  if(ty>descTop+descH-8)throw Error("သုံးသပ်ချက်စာသား မဆံ့ပါ");
  panel(c,31,pickTop,1138,159,18,"#082943",gold,7);
  c.shadowColor=gold;c.shadowBlur=8;label(c,"ရွေးချယ်မှု",600,pickTop+45,1000,36,cream,900);c.shadowBlur=0;
  label(c,selection(m),600,pickTop+109,1040,61,gold,900);
  return canvas;
 }
 const blob=canvas=>new Promise((resolve,reject)=>canvas.toBlob(b=>b?.size?resolve(b):reject(Error("PNG မထွက်ပါ")),"image/png"));
 function save(b,name){
  const url=URL.createObjectURL(b),a=node("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 }
 function shown(){
  const k=el("fcV3League").value;
  return matches.filter(m=>k==="all"||m.league===k);
 }
 function chosen(){
  const checked=shown().filter(m=>picked.has(m.fixtureId));
  return checked.length?checked:shown();
 }
 function setStatus(msg){el("fcV3Status").textContent=msg;}
 async function framed(m,frameId){
  const f=frameId!=="none"?window.FutureCodeProfessionalFrames?.getFrame?.(frameId):null;
  const base=await render(m,{color:f?.color});
  return frameId!=="none"&&window.FutureCodeProfessionalFrames?.wrap?window.FutureCodeProfessionalFrames.wrap(base,"previewsV3","pro:"+frameId):base;
 }
 async function combine(rows,frameId){
  const canvases=[];for(const m of rows)canvases.push(await render(m));
  const W=1200,height=canvases.reduce((n,x)=>n+x.height,0)+(canvases.length-1)*4;
  if(height>32767||height*W>108000000)throw Error("PNG အမြင့်များလွန်းပါသည်");
  const out=document.createElement("canvas");out.width=W;out.height=height;
  const c=out.getContext("2d");let y=0;for(const item of canvases){c.drawImage(item,0,y);y+=item.height+4;}
  return frameId!=="none"&&window.FutureCodeProfessionalFrames?.wrap?window.FutureCodeProfessionalFrames.wrap(out,"previewsV3","pro:"+frameId):out;
 }
 async function exportMatches(mode){
  if(busy)return;busy=true;
  try{
   const rows=chosen();if(!rows.length)throw Error("ပွဲမရှိပါ");
   const frame=el("fcV3Frame").value;
   setStatus("Version 3 PNG ဖန်တီးနေပါသည်…");
   if(mode==="zip"){
    const Archive=window.FutureCodeFrameZip?.Archive;if(!Archive)throw Error("ZIP engine မရရှိပါ");
    const zip=new Archive();
    for(let i=0;i<rows.length;i++){
     const b=await blob(await framed(rows[i],frame));
     await zip.add("ပွဲကြိုသုံးသပ်ချက် Version 3/V3-"+String(i+1).padStart(2,"0")+"-"+rows[i].fixtureId+".png",b);
     setStatus("PNG "+(i+1)+"/"+rows.length+" ဖန်တီးပြီး");
    }
    save(zip.finish(),"Preview-V3-"+date+"-"+rows.length+"-matches.zip");
   }else{
    const amount=mode==="pair"?2:1;
    save(await blob(await combine(rows.slice(0,amount),frame)),"Preview-V3-"+date+"-"+rows.slice(0,amount).map(x=>x.fixtureId).join("_")+".png");
   }
   setStatus("Version 3 Download အဆင်သင့်ဖြစ်ပါပြီ");
  }catch(error){setStatus("Download မရပါ — "+error.message);}finally{busy=false;}
 }
 async function show(){
  const gen=++renderGeneration,host=el("fcV3Cards");host.replaceChildren();
  const rows=shown();el("fcV3Count").textContent=rows.length+" ပွဲ";
  if(!rows.length){host.append(node("p","fc-v3-note","ရွေးထားသော လိဂ်တွင် ပွဲမရှိပါ"));return;}
  for(const match of rows){
   if(gen!==renderGeneration)return;
   const article=node("article","fc-v3-card"),picture=node("img","fc-v3-picture");
   picture.alt=(match.homeDisplay||match.home)+" VS "+(match.awayDisplay||match.away)+" — ပွဲကြိုသုံးသပ်ချက် Version 3";
   picture.loading="lazy";
   const bar=node("div","fc-v3-card-actions"),check=node("label","fc-v3-select"),input=node("input");
   input.type="checkbox";input.checked=picked.has(match.fixtureId);
   input.onchange=()=>{if(input.checked)picked.add(match.fixtureId);else picked.delete(match.fixtureId);el("fcV3Selected").textContent=picked.size+" ပွဲရွေးထားသည်";};
   check.append(input,node("span",null,"Download အတွက် ရွေးရန်"));
   const button=node("button",null,"⬇ ဒီပွဲ PNG");button.type="button";
   button.onclick=async()=>{if(busy)return;busy=true;try{setStatus("PNG ပြင်ဆင်နေပါသည်…");save(await blob(await framed(match,el("fcV3Frame").value)),"Preview-V3-"+date+"-"+match.fixtureId+".png");setStatus("PNG Download အဆင်သင့်");}catch(e){setStatus("Download မရပါ — "+e.message);}finally{busy=false;}};
   bar.append(check,button);article.append(picture,bar);host.append(article);
   try{
    const canvas=await render(match);
    if(gen!==renderGeneration)return;
    const b=await blob(canvas),url=URL.createObjectURL(b);
    urls.push(url);picture.src=url;
   }catch(e){picture.replaceWith(node("p","fc-v3-note",match.homeDisplay+" — "+e.message));}
  }
 }
 async function load(){
  const f=window.FootballData?.fetch||fetch,res=await f(new URL("./data/today.json",document.baseURI),{cache:"no-store"});
  if(!res.ok)throw Error("ပွဲစဉ်ဒေတာ မရရှိပါ");
  const report=await res.json();if(!report.published||!Array.isArray(report.matches))throw Error("ထုတ်ဝေထားသော ပွဲများ မရှိသေးပါ");
  matches=report.matches.filter(eligible);date=report.reportDate;
  const select=el("fcV3League"),old=select.value;
  select.replaceChildren(new Option("လိဂ်အားလုံး","all"));
  for(const league of [...new Set(matches.map(m=>m.league))]){
   select.add(new Option(matches.find(m=>m.league===league).leagueDisplay||league,league));
  }
  if([...select.options].some(x=>x.value===old))select.value=old;
  el("fcV3Date").textContent=date;
  setStatus(matches.length+" ပွဲ · V2 သုံးသပ်ချက်နှင့် ရွေးချယ်မှုကို အသုံးပြုထားပါသည်");
  await show();
 }
 async function initFrames(){
  const api=window.FutureCodeProfessionalFrames;if(!api)return;await api.ready;
  const select=el("fcV3Frame");select.replaceChildren(new Option("မူရင်း Navy & Gold V3","none"));
  for(const frame of await api.list("previewsV3"))select.add(new Option(frame.name,frame.id));
  const choice=await api.getSelected("previewsV3");if([...select.options].some(o=>o.value===choice))select.value=choice;
 }
 window.FutureCodePreviewV3=Object.freeze({render,eligible,editorial,selection,load});
 el("fcV3League").onchange=show;
 el("fcV3One").onclick=()=>exportMatches("one");
 el("fcV3Pair").onclick=()=>exportMatches("pair");
 el("fcV3Zip").onclick=()=>exportMatches("zip");
 el("fcV3Reload").onclick=()=>load().catch(e=>setStatus(e.message));
 const start=()=>{initFrames().catch(console.warn);load().catch(e=>setStatus(e.message));};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();

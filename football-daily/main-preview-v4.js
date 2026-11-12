"use strict";
/* Preview V4: main website only, odds-free stadium card using existing approved V2 editorial. */
(function(){
 if(!["/","/index.html"].includes(location.pathname))return;
 const root=document.getElementById("fcPreviewV4");if(!root)return;
 const el=id=>document.getElementById(id);
 const node=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
 const clean=s=>String(s??"").normalize("NFC").replace(/\*\*|&nbsp;/g,"").replace(/\s+/gu," ").trim();
 const selection=m=>m.previewV2Selection||window.FutureCodePreviewV2?.choice(m)||"—";
 const editorial=m=>clean(window.FutureCodePreviewV2?.summary(m)||m.previewV2Summary);
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
  await window.FutureCodeCanvasKit?.fonts?.();
  await document.fonts?.load('600 24px "FCMyanmar"');
  await document.fonts?.ready;
  const W=1080,H=1080,prose=editorial(m),pick=selection(m);
  const homeName=m.homeDisplay||m.home,awayName=m.awayDisplay||m.away;
  const currentColor=/^#[0-9a-f]{6}$/i.test(options.color||"")?options.color:"#b3192c";
  const tint=(hex,factor)=>"#"+hex.slice(1).match(/../g).map(v=>Math.max(0,Math.min(255,Math.round(parseInt(v,16)*factor))).toString(16).padStart(2,"0")).join("");
  const GOLD="#f2c66e",WHITE="#fff9ed",INK="#080b14";
  const [homeLogo,awayLogo,leagueLogo,stadium]=await Promise.all([
   image(m.homeCrestUrl),image(m.awayCrestUrl),image(m.leagueLogoUrl),image("./assets/preview-stadium-night.jpg")
  ]);
  const canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;
  const c=canvas.getContext("2d");if(!c)throw Error("PNG Canvas မရပါ");
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
  const fillBox=(x,y,w,h,r,first,second,stroke=GOLD,weight=3)=>{
   const gradient=c.createLinearGradient(x,y,x,y+h);
   gradient.addColorStop(0,first);gradient.addColorStop(1,second);
   panel(c,x,y,w,h,r,gradient,stroke,weight);
  };
  const txt=(s,x,y,w,px,col=WHITE,weight=900)=>label(c,s,x,y,w,px,col,weight);
  const line=(x,y,w)=>{c.beginPath();c.moveTo(x,y);c.lineTo(x+w,y);c.lineWidth=2;c.strokeStyle=GOLD;c.stroke();};
  const form=(arr,x,y)=>{
   fillBox(x,y,499,97,14,"#111b2a","#070b14",GOLD,2);
   txt("နောက်ဆုံး ၅ ပွဲရလဒ်",x+249,y+23,470,21,WHITE,850);
   for(let i=0;i<5;i++){
    const s=arr[i]||"—",cx=x+105+i*72;
    c.beginPath();c.arc(cx,y+66,21,0,Math.PI*2);
    c.fillStyle=formColor[s]||formColor["—"];c.fill();
    txt(s,cx,y+66,40,21,"#fff",900);
   }
  };
  // Fixed editorial layout: the identical approved V2 paragraph, never truncated.
  const metric=document.createElement("canvas").getContext("2d");
  let body=null;
  for(let font=30;font>=19;font--){
   metric.font='600 '+font+'px "FCMyanmar",sans-serif';
   const lines=wrap(metric,prose,932),leading=Math.ceil(font*1.62);
   if(lines.length*leading<=414){body={font,lines,leading};break;}
  }
  if(!body?.lines.length)throw Error("V2 သုံးသပ်ချက်စာသား အပြည့်အစုံ မဆံ့ပါ");
  const bg=c.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,tint(currentColor,.32));bg.addColorStop(.55,INK);bg.addColorStop(1,tint(currentColor,.18));
  c.fillStyle=bg;c.fillRect(0,0,W,H);
  if(stadium){c.save();c.globalAlpha=.13;const scale=Math.max(W/stadium.naturalWidth,390/stadium.naturalHeight);c.drawImage(stadium,0,0,stadium.naturalWidth*scale,stadium.naturalHeight*scale);c.restore();}
  // One quiet perimeter, generous spacing, no repeated boxed headings.
  panel(c,18,18,1044,1044,32,"#080d1688",GOLD+"66",1.5);
  c.fillStyle=currentColor;c.fillRect(64,48,6,36);
  if(leagueLogo)crest(c,leagueLogo,86,44,44,m.leagueDisplay);
  c.textAlign="left";c.textBaseline="middle";c.font='800 25px "FCMyanmar",sans-serif';c.fillStyle=GOLD;
  c.fillText(m.leagueDisplay||m.league,148,67,850);
  txt(String(m.kickoffCalendarDate||date||"").slice(0,10)+"   •   "+clock(m)+" MMT",540,115,920,22,"#c4ccd8",600);
  crest(c,homeLogo,203,155,116,homeName);crest(c,awayLogo,761,155,116,awayName);
  txt(homeName,262,310,402,34);txt(awayName,818,310,402,34);
  txt("VS",540,225,100,38,GOLD,800);
  const formRow=(arr,center)=>{for(let i=0;i<5;i++){const v=arr[i]||"—",x=center-96+i*48;panel(c,x-18,351,36,34,11,formColor[v]||formColor["—"],null);txt(v,x,369,32,19,"#fff",800);}};
  formRow(resultForm(m,"home"),262);formRow(resultForm(m,"away"),818);
  c.globalAlpha=.35;line(66,414,948);c.globalAlpha=1;
  panel(c,48,442,984,456,24,"#ffffff08",null);
  c.fillStyle=WHITE;c.font='600 '+body.font+'px "FCMyanmar",sans-serif';c.textAlign="left";c.textBaseline="top";
  let ty=465+Math.max(0,(410-body.lines.length*body.leading)/2);for(const str of body.lines){c.fillText(str,74,ty);ty+=body.leading;}
  const pickY=930;
  fillBox(48,pickY,984,110,24,tint(currentColor,.86),tint(currentColor,.42),GOLD+"88",1.5);
  crest(c,pick===homeName?homeLogo:awayLogo,76,pickY+23,64,pick);
  c.textAlign="left";c.textBaseline="middle";c.fillStyle=GOLD;c.font='800 22px "FCMyanmar",sans-serif';c.fillText("အထူး ရွေးချယ်မှု",166,pickY+30,800);
  c.fillStyle=WHITE;c.font='900 36px "FCMyanmar",sans-serif';c.fillText(pick,166,pickY+76,824);
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
  const canvases=[];for(const m of rows)canvases.push(await render(m,{color:window.FutureCodeProfessionalFrames?.getFrame?.(frameId)?.color}));
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
    const selectedFrame=el("fcV4Frame").value;
    const frameColor=selectedFrame!=="none"?window.FutureCodeProfessionalFrames?.getFrame?.(selectedFrame)?.color:null;
    const canvas=await render(match,{color:frameColor});
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
 el("fcV4Frame").onchange=show;
 el("fcV4One").onclick=()=>exportMatches("one");
 el("fcV4Pair").onclick=()=>exportMatches("pair");
 el("fcV4Zip").onclick=()=>exportMatches("zip");
 el("fcV4Reload").onclick=()=>load().catch(e=>setStatus(e.message));
 const start=()=>{initFrames().catch(console.warn);load().catch(e=>setStatus(e.message));};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();

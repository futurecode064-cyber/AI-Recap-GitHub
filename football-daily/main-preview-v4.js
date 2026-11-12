"use strict";
/* Preview V4: main website only, odds-free stadium card using existing approved V2 editorial. */
(function(){
 const isGoal=/^\/future-code-journal(?:\/|$)/.test(location.pathname);
 if(!isGoal&&!["/","/index.html"].includes(location.pathname))return;
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
  if(options.result&&!(m?.status==="finished"&&/^\d+\s*[-:]\s*\d+$/.test(clean(m.finalScore))))throw Error("အတည်ပြု ပွဲပြီးရလဒ် မရှိသေးပါ");
  if(!eligible(m))throw Error("Version 2 သုံးသပ်ချက်နှင့် ရွေးချယ်မှု အတည်ပြုချက် မပြည့်စုံပါ");
  await window.FutureCodeCanvasKit?.fonts?.();
  await document.fonts?.load('600 24px "FCMyanmar"');
  await document.fonts?.ready;
  const W=1080,prose=editorial(m),pick=selection(m),isResult=options.result===true;
  const homeName=m.homeDisplay||m.home,awayName=m.awayDisplay||m.away;
  const currentColor=/^#[0-9a-f]{6}$/i.test(options.color||"")?options.color:(isGoal?"#b69a52":"#236886");
  const mix=(a,b,t)=>"#"+a.slice(1).match(/../g).map((v,i)=>Math.round(parseInt(v,16)*(1-t)+parseInt(b.slice(1+i*2,3+i*2),16)*t).toString(16).padStart(2,"0")).join("");
  const WHITE=isGoal?"#fff8e8":"#f4f6fa",MUTED=isGoal?"#c1b28f":"#a6b4c5",ACCENT=mix(currentColor,"#ffffff",.48);
  const metric=document.createElement("canvas").getContext("2d");
  const font=30,leading=49;
  metric.font='600 '+font+'px "FCMyanmar",sans-serif';
  const lines=wrap(metric,prose,932);
  if(!lines.length)throw Error("V2 သုံးသပ်ချက်စာသား မရှိပါ");
  // Content drives the height; there is no square spacer or vertically centred article.
  const articleY=isResult?(m.resultPeriod==="AET"?370:334):350;
  const articleH=lines.length*leading+48,pickY=articleY+articleH+18,pickH=isResult?156:118,H=pickY+pickH+28;
  if(H>32767||H*W>108000000)throw Error("စာသားအရွယ်အစား များလွန်းပါသည်");
  const [homeLogo,awayLogo,leagueLogo,stadium]=await Promise.all([
   image(m.homeCrestUrl),image(m.awayCrestUrl),image(m.leagueLogoUrl),image(isGoal?"../assets/preview-stadium-night.jpg":"./assets/preview-stadium-night.jpg")
  ]);
  const canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;
  const c=canvas.getContext("2d");if(!c)throw Error("PNG Canvas မရပါ");
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
  const txt=(s,x,y,w,px,col=WHITE,weight=800)=>label(c,s,x,y,w,px,col,weight);
  const bg=c.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,mix(isGoal?"#0e0d0b":"#0c1420",currentColor,.09));bg.addColorStop(1,isGoal?"#090907":"#0b111b");c.fillStyle=bg;c.fillRect(0,0,W,H);
  if(stadium){c.save();c.globalAlpha=.075;const scale=Math.max(W/stadium.naturalWidth,300/stadium.naturalHeight);c.drawImage(stadium,0,0,stadium.naturalWidth*scale,stadium.naturalHeight*scale);c.restore();}
  panel(c,16,16,1048,H-32,24,isGoal?"#17140b44":"#0b142044",isGoal?"#d3b36955":"#ffffff18",1.5);
  c.fillStyle=currentColor;c.fillRect(48,38,5,32);
  if(leagueLogo)crest(c,leagueLogo,70,32,44,m.leagueDisplay);
  c.textAlign="left";c.textBaseline="middle";c.font='800 24px "FCMyanmar",sans-serif';c.fillStyle=WHITE;c.fillText(m.leagueDisplay||m.league,132,55,880);
  txt(String(m.kickoffCalendarDate||date||"").slice(0,10)+"   •   "+clock(m)+" MMT",540,94,920,21,MUTED,600);
  crest(c,homeLogo,210,126,104,homeName);crest(c,awayLogo,766,126,104,awayName);
  txt(homeName,262,259,402,33);txt(awayName,818,259,402,33);
  const circle=(x,y,rx,ry)=>{c.save();c.strokeStyle="#ff514b";c.lineWidth=9;c.lineCap="round";for(let i=0;i<2;i++){c.beginPath();c.ellipse(x,y,rx+i*6,ry+i*4,-.012,0,Math.PI*2);c.stroke();}c.restore();};
  if(isResult){
   txt(clean(m.finalScore).replace(/\s*[-:]\s*/," - "),540,200,252,94,WHITE,900);
   circle(540,200,150,76);
   txt(m.resultPeriod==="AET"?"AET":"FULL TIME",540,304,190,16,MUTED,800);
   if(m.resultPeriod==="AET"&&m.regulationScore)txt("90′ "+m.regulationScore,540,336,190,18,MUTED,700);
  }else{
   txt("VS",540,178,100,35,ACCENT,800);
   for(const [side,center]of [["home",262],["away",818]]){
    const arr=resultForm(m,side);for(let i=0;i<5;i++){const v=arr[i]||"—",x=center-96+i*48;panel(c,x-18,290,36,32,10,formColor[v]||formColor["—"],null);txt(v,x,307,32,18,"#fff",800);}
   }
  }
  // One paragraph panel, with equal padding above and below its actual lines.
  panel(c,48,articleY,984,articleH,20,"#ffffff06",null);
  c.fillStyle=WHITE;c.font='600 '+font+'px "FCMyanmar",sans-serif';c.textAlign="left";c.textBaseline="top";
  let ty=articleY+24;for(const str of lines){c.fillText(str,74,ty);ty+=leading;}
  panel(c,48,pickY,984,pickH,20,mix(isGoal?"#17140f":"#111c2b",currentColor,.12),mix("#263344",currentColor,.3),1.5);
  c.fillStyle=currentColor;c.fillRect(69,pickY+24,4,pickH-48);
  crest(c,pick===homeName?homeLogo:awayLogo,92,pickY+(pickH-76)/2,76,pick);
  const pickCenter=610;
  txt("အထူး ရွေးချယ်မှု",pickCenter,pickY+29,730,22,ACCENT,800);
  const nameY=pickY+(isResult?99:79);
  txt(pick,pickCenter,nameY,730,isResult?44:38,WHITE,900);
  if(isResult){c.font='900 44px "FCMyanmar",sans-serif';const textWidth=Math.min(620,c.measureText(pick).width);circle(pickCenter,nameY,Math.max(210,textWidth/2+60),43);}
  return options.includeBrandBanner===false?canvas:brandCanvas(canvas);
 }
 async function brandCanvas(canvas){
  if(!isGoal||canvas.__fcGoalZoneBanner)return canvas;
  const [banner,brandLogo]=await Promise.all([
   image("./assets/goal-zone-download-banner.webp"),
   image("./assets/logo.webp")
  ]);
  if(!banner)throw Error("ဂိုးဇုံ Banner ပုံ ဖတ်မရပါ");
  const w=canvas.width,h=Math.round(w*banner.naturalHeight/banner.naturalWidth);
  const out=document.createElement("canvas");out.width=w;out.height=canvas.height+h;
  const c=out.getContext("2d");if(!c)throw Error("ဂိုးဇုံ Banner Canvas မရပါ");
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
  c.drawImage(banner,0,0,w,h);
  // Cover the logo baked into the original center, retaining the stadium and
  // players at either edge. The separate official logo moves to the left.
  const veil=c.createLinearGradient(w*.16,0,w*.98,0);
  veil.addColorStop(0,"rgba(4,3,2,0)");
  veil.addColorStop(.23,"rgba(4,3,2,.96)");
  veil.addColorStop(.70,"rgba(4,3,2,.97)");
  veil.addColorStop(1,"rgba(4,3,2,.52)");
  c.fillStyle=veil;c.fillRect(w*.16,0,w*.84,h);
  if(brandLogo){
   const size=Math.min(w*.285,h*.94);
   const s=Math.min(size/brandLogo.naturalWidth,size/brandLogo.naturalHeight);
   const lw=brandLogo.naturalWidth*s,lh=brandLogo.naturalHeight*s;
   c.save();c.globalCompositeOperation="screen";
   c.shadowColor="#e5b34d";c.shadowBlur=h*.035;
   c.drawImage(brandLogo,w*.255-lw/2,h*.50-lh/2,lw,lh);
   c.restore();
  }else{
   // Asset fallback still displays a recognizable Goal Zone brand.
   c.font='900 '+Math.round(h*.27)+'px "FCMyanmar",sans-serif';
   c.fillStyle="#f4d47b";c.textAlign="center";c.textBaseline="middle";
   c.fillText("ဂိုးဇုံ",w*.255,h*.5,w*.26);
  }
  const ruleX=w*.426;
  const rule=c.createLinearGradient(0,h*.14,0,h*.88);
  rule.addColorStop(0,"rgba(250,218,130,0)");
  rule.addColorStop(.45,"#f4cb68");
  rule.addColorStop(1,"rgba(250,218,130,0)");
  c.fillStyle=rule;c.fillRect(ruleX,h*.14,Math.max(2,w*.0025),h*.74);
  await document.fonts?.load('800 66px "FCMyanmar"').catch(()=>{});
  const words=["ပွဲကြိုအထူး","သုံးသပ်ချက်"];
  const centerX=w*.71,available=w*.53;
  let fontSize=Math.round(h*.25);
  do{
   c.font='900 '+fontSize+'px "FCMyanmar","Noto Sans Myanmar",sans-serif';
   if(words.every(word=>c.measureText(word).width<=available)||fontSize<=40)break;
   fontSize-=2;
  }while(true);
  const gold=c.createLinearGradient(0,h*.28,0,h*.75);
  gold.addColorStop(0,"#fff3b7");gold.addColorStop(.32,"#f6d177");
  gold.addColorStop(.72,"#bd862c");gold.addColorStop(1,"#ffe49b");
  c.textAlign="center";c.textBaseline="middle";c.lineJoin="round";
  c.fillStyle=gold;c.strokeStyle="#180e02";c.lineWidth=Math.max(3,h*.012);
  c.shadowColor="#000";c.shadowBlur=h*.035;c.shadowOffsetY=h*.012;
  for(let i=0;i<words.length;i++){
   const y=h*(i===0?.355:.672);
   c.strokeText(words[i],centerX,y,available);
   c.fillText(words[i],centerX,y,available);
  }
  c.shadowColor="transparent";c.shadowBlur=0;c.shadowOffsetY=0;
  c.fillStyle="#d9af53";c.fillRect(w*.55,h*.855,w*.32,Math.max(2,h*.008));
  c.drawImage(canvas,0,h);
  out.__fcGoalZoneBanner=true;
  return out;
 }
 const blob=canvas=>new Promise((resolve,reject)=>canvas.toBlob(b=>b?.size?resolve(b):reject(Error("PNG မထွက်ပါ")),"image/png"));
 async function save(b,name){
  if(b.type.startsWith("image/")&&window.FutureCodeImageSave)return window.FutureCodeImageSave.saveBlob(b,name);
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
  const canvases=[];for(const m of rows)canvases.push(await render(m,{color:window.FutureCodeProfessionalFrames?.getFrame?.(frameId)?.color,includeBrandBanner:false}));
  const W=1080,height=canvases.reduce((n,x)=>n+x.height,0)+(canvases.length-1)*4;
  if(height>32767||height*W>108000000)throw Error("PNG အမြင့်များလွန်းပါသည်");
  const out=document.createElement("canvas");out.width=W;out.height=height;
  const c=out.getContext("2d");let y=0;for(const item of canvases){c.drawImage(item,0,y);y+=item.height+4;}
  if(isGoal)return brandCanvas(out);
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
    await save(zip.finish(),"Preview-V4-"+date+"-"+rows.length+"-matches.zip");
   }else{
    const amount=mode==="pair"?2:1;
    await save(await blob(await combine(rows.slice(0,amount),frame)),"Preview-V4-"+date+"-"+rows.slice(0,amount).map(x=>x.fixtureId).join("_")+".png");
   }
   setStatus("Version 4 Download အဆင်သင့်ဖြစ်ပါပြီ");
  }catch(error){setStatus("Download မရပါ — "+error.message);}finally{busy=false;}
 }
 async function show(){
  if(new URLSearchParams(location.search).has("frame-engine"))return;
  if(isGoal&&document.documentElement.dataset.gzSection!=="previewV4")return;
  const gen=++renderGeneration,host=el("fcV4Cards");host.replaceChildren();
  for(const url of urls.splice(0))URL.revokeObjectURL(url);
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
   button.onclick=async()=>{if(busy)return;busy=true;try{setStatus("PNG ပြင်ဆင်နေပါသည်…");await save(await blob(await framed(match,el("fcV4Frame").value)),"Preview-V4-"+date+"-"+match.fixtureId+".png");setStatus("PNG Download အဆင်သင့်");}catch(e){setStatus("Download မရပါ — "+e.message);}finally{busy=false;}};
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
  const f=window.FootballData?.fetch||fetch,res=await f(new URL(isGoal?"../data/today.json":"./data/today.json",document.baseURI),{cache:"no-store"});
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
 if(isGoal)window.addEventListener?.("goalzone:sectionchange",()=>{
  if(document.documentElement.dataset.gzSection==="previewV4")show();
  else{++renderGeneration;el("fcV4Cards").replaceChildren();for(const url of urls.splice(0))URL.revokeObjectURL(url);}
 });
 window.FutureCodePreviewV4=Object.freeze({render,eligible,editorial,selection,load,brandCanvas});
 el("fcV4League").onchange=show;
 el("fcV4Frame").onchange=show;
 el("fcV4One").onclick=()=>exportMatches("one");
 el("fcV4Pair").onclick=()=>exportMatches("pair");
 el("fcV4Zip").onclick=()=>exportMatches("zip");
 el("fcV4Reload").onclick=()=>load().catch(e=>setStatus(e.message));
 const start=()=>{initFrames().catch(console.warn);load().catch(e=>setStatus(e.message));};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();

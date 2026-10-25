"use strict";
(function(){
 const branded=document.documentElement?.dataset?.footballBrandName==="YKZ FAMILY GROUP";
 const kmmBranded=document.documentElement?.dataset?.footballBrandName==="KMM Sport Hub";
 const bwBranded=document.documentElement?.dataset?.footballBrandName==="BW SPORT ဘောလုံးဂျာနယ်";
 const fcjBranded=document.documentElement?.dataset?.footballBrandName==="ဂိုးဇုံ အားကစား ဂျာနယ်";
 const ktfBranded=document.documentElement?.dataset?.footballBrandName==="Ko Thet Family ဘောလုံးဂျာနယ်";
 const C=kmmBranded?{bg:"#100705",head:"#980000",panel:"#1e0b07",panelAlt:"#35170d",divider:"#997238",orange:"#f3c65a",pale:"#fff1cb",muted:"#e8d19e",white:"#fffaf0"}:
 branded?
  {bg:"#111111",head:"#960000",panel:"#242424",panelAlt:"#353030",divider:"#812f2f",orange:"#ffcf58",pale:"#fff8e9",muted:"#e0cbc0",white:"#fff9ee"}:
 bwBranded?
  {bg:"#061122",head:"#103869",panel:"#0e2a4c",panelAlt:"#16395d",divider:"#326ea5",orange:"#59c3ff",pale:"#e3f5ff",muted:"#b6d8f7",white:"#f3f9ff"}:
 ktfBranded?
  {bg:"#15090d",head:"#671019",panel:"#34181d",panelAlt:"#45242a",divider:"#9d7133",orange:"#ffd269",pale:"#fff0d4",muted:"#e1c4a6",white:"#fff5e6"}:
 fcjBranded?{bg:"#090909",head:"#322714",panel:"#191713",panelAlt:"#282217",divider:"#7d6032",orange:"#edc66b",pale:"#fff4d9",muted:"#c9bda3",white:"#fff8e8"}:
  {bg:"#101b20",head:"#1d3135",panel:"#203436",panelAlt:"#263d3d",divider:"#425855",orange:"#ffac75",pale:"#f7f5eb",muted:"#bcd0c9",white:"#f5f7f3"};
 const FONT='"Noto Sans Myanmar",sans-serif';
 const imageCache=new Map();
 function sleep(ms){return new Promise(done=>setTimeout(done,ms))}
 async function fonts(){
  if(!document.fonts?.ready)return;
  const brandedExport=Boolean(document.documentElement?.dataset?.footballBrandName||window.FutureCodeMainLogoAssets);
  const ready=brandedExport&&document.fonts.load
   ?Promise.all([document.fonts.ready,document.fonts.load('800 24px "Noto Sans Myanmar"','မြန်မာ'),document.fonts.load('500 24px "Noto Sans Myanmar"','မြန်မာ')]).catch(()=>{})
   :document.fonts.ready.catch(()=>{});
  await Promise.race([ready,sleep(brandedExport?6500:900)]);
 }
 function create(width,height){
  const canvas=document.createElement("canvas");canvas.width=width;canvas.height=Math.ceil(height);
  const ctx=canvas.getContext("2d");if(!ctx)throw Error("Canvas 2D is not supported");
  return {canvas,ctx};
 }
 function fill(ctx,x,y,w,h,color,r=0){
  ctx.fillStyle=color;
  if(r&&typeof ctx.roundRect==="function"){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
  else ctx.fillRect(x,y,w,h);
 }
 function line(ctx,x,y,w,color=C.divider){fill(ctx,x,y,w,1,color)}
 function font(px,bold){return (bold?800:500)+" "+px+"px "+FONT}
 function text(ctx,str,x,y,px=21,color=C.pale,bold=false,align="left",max){
  ctx.font=font(px,bold);ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline="middle";
  const value=String(str??"");
  if(max)ctx.fillText(value,x,y,max);else ctx.fillText(value,x,y);
 }
 function fit(ctx,str,maxWidth,base=21,min=13){
  for(let n=base;n>=min;n--){ctx.font=font(n,true);if(ctx.measureText(String(str??"")).width<=maxWidth)return n}return min;
 }
 function wrap(ctx,str,maxWidth,px=21){
  ctx.font=font(px,false);
  const words=String(str||"").replace(/\*\*/g,"").split(/(\s+)/);
  const lines=[];let current="";
  for(const word of words){
   const candidate=current+word;
   if(ctx.measureText(candidate).width<=maxWidth||!current){current=candidate;continue}
   lines.push(current.trim());current=word.trimStart();
  }
  if(current.trim())lines.push(current.trim());
  return lines.length?lines:[""];
 }
 function loadImage(src){
  if(typeof src!=="string"||!/^https:\/\//i.test(src))return Promise.resolve(null);
  if(imageCache.has(src))return imageCache.get(src);
  const task=new Promise(resolve=>{
   const img=new Image();let done=false;
   const finish=v=>{if(done)return;done=true;clearTimeout(timer);if(!v)imageCache.delete(src);resolve(v)};
   const brandedExport=Boolean(document.documentElement?.dataset?.footballBrandName||window.FutureCodeMainLogoAssets);
   const timer=setTimeout(()=>finish(null),brandedExport?6500:950);
   img.crossOrigin="anonymous";img.onload=()=>finish(img);img.onerror=()=>finish(null);img.src=window.FutureCodeMainLogoAssets?.imageUrl(src)||window.FutureCodeBrandExportData?.imageUrl(src)||src;
  });
  imageCache.set(src,task);return task;
 }
 async function preload(urls){
  await Promise.all([...new Set(urls.filter(Boolean))].map(loadImage));
 }
 function crest(ctx,url,x,y,size,label="",noBackground=false){
  // Transparent standalone match PNGs keep crests without white logo tiles.
  if(!noBackground)fill(ctx,x,y,size,size,"#eef2f0",size/2);
  const img=imageCache.get(url);
  if(img){ // data is loaded asynchronously. drawLogo() receives resolved images via resolved cache
   const found=resolved.get(url);
   if(found&&found.naturalWidth&&found.naturalHeight){
    const k=Math.min((size-8)/found.naturalWidth,(size-8)/found.naturalHeight);
    const w=found.naturalWidth*k,h=found.naturalHeight*k;
    try{ctx.drawImage(found,x+(size-w)/2,y+(size-h)/2,w,h);return}catch(_){}
   }
  }
  text(ctx,String(label||"?").slice(0,2),x+size/2,y+size/2,Math.max(10,Math.floor(size*.27)),noBackground?"#ffffff":"#263e3f",true,"center",size-6);
 }
 const resolved=new Map();
 async function preloadImages(urls){
  const brandUrl=document.documentElement?.dataset?.footballBrandLogoUrl;
  const artworkUrl=fcjBranded?document.documentElement?.dataset?.footballBrandArtworkUrl:null;
  await Promise.all([...new Set([...urls,brandUrl,artworkUrl].filter(Boolean))].map(async url=>{const im=await loadImage(url);resolved.set(url,im)}));
 }

 // Optional sourced photos are cropped to the visual hero area. Returns false when unavailable.
 function photoCover(ctx,url,x,y,w,h){
  const img=resolved.get(url);
  if(!img||!img.naturalWidth||!img.naturalHeight)return false;
  const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight);
  const cropW=w/scale,cropH=h/scale;
  const sx=(img.naturalWidth-cropW)/2,sy=Math.max(0,(img.naturalHeight-cropH)*.20);
  ctx.save();
  ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  try{ctx.drawImage(img,sx,sy,cropW,cropH,x,y,w,h)}catch(_){ctx.restore();return false}
  ctx.restore();return true;
 }
 function brandArtwork(ctx,x,y,w,h,opacity=.5){
  if(!fcjBranded)return false;
  const url=document.documentElement?.dataset?.footballBrandArtworkUrl;
  ctx.save();ctx.globalAlpha=opacity;
  const drawn=photoCover(ctx,url,x,y,w,h);ctx.restore();return drawn;
 }
 async function download(canvas,filename){
  if(typeof canvas.toBlob!=="function")throw Error("Browser cannot create PNG");
  const blob=await Promise.race([
   new Promise((resolve,reject)=>{try{canvas.toBlob(v=>v&&v.size?resolve(v):reject(Error("PNG encoding failed")),"image/png")}catch(e){reject(e)}}),
   sleep(12000).then(()=>{throw Error("PNG encoding timed out")})
  ]);
  const url=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
 }
 function day(v){return /^\d{4}-\d{2}-\d{2}$/.test(v||"")?v:"unknown"}
 function top(ctx,W,title,date,detail){
  fill(ctx,0,0,W,13,C.orange);fill(ctx,0,13,W,195,C.head);
  text(ctx,kmmBranded?"KMM Sport Hub":branded?"YKZ FAMILY GROUP":bwBranded?"BW SPORT ဘောလုံးဂျာနယ်":ktfBranded?"KO THET FAMILY ဘောလုံးဂျာနယ်":fcjBranded?"ဂိုးဇုံ အားကစား ဂျာနယ်":"FUTURE CODE FOOTBALL DAILY",28,48,22,C.orange,true);
  if(kmmBranded){crest(ctx,document.documentElement?.dataset?.footballBrandLogoUrl,W-113,22,78,"KMM");}else if(branded){
   text(ctx,"အတူရှေ့ဆက် YKZ",Math.min(W-260,340),48,19,C.pale,true);
   crest(ctx,document.documentElement?.dataset?.footballBrandLogoUrl,W-113,22,78,"YKZ");
  }else if(bwBranded){
   crest(ctx,document.documentElement?.dataset?.footballBrandLogoUrl,W-113,22,78,"BW");
  }else if(ktfBranded){
   crest(ctx,document.documentElement?.dataset?.footballBrandLogoUrl,W-113,22,78,"KTF");
  }
  if(fcjBranded)crest(ctx,document.documentElement?.dataset?.footballBrandLogoUrl,W-113,22,78,"FC");
  if(fcjBranded)brandArtwork(ctx,W-430,64,420,135,.55);
  text(ctx,title,28,110,38,C.white,true);
  text(ctx,"မြန်မာစံတော်ချိန်  ·  "+day(date),28,164,18,C.muted);
  text(ctx,detail,W-28,164,19,C.orange,true,"right");
 }
 window.FutureCodeCanvasKit={C,create,fill,line,text,fit,wrap,fonts,preloadImages,crest,photoCover,brandArtwork,download,day,top};
})();

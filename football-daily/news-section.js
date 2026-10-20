"use strict";
(function(){
 const section=document.getElementById("fcNewsSection");
 if(!section)return;
 const grid=document.getElementById("fcNewsGrid");
 const filters=document.getElementById("fcNewsFilters");
 const windowNode=document.getElementById("fcNewsWindow");
 const countNode=document.getElementById("fcNewsCount");
 const categories=[
  {id:"all",label:"သတင်းအားလုံး"},
  {id:"international",label:"နိုင်ငံတကာ ဘောလုံးသတင်း"},
  {id:"team-player",label:"အသင်းနှင့် ကစားသမားသတင်း"},
  {id:"transfer",label:"အပြောင်းအရွှေ့ သတင်း"},
  {id:"match",label:"ဘောလုံးပွဲ သတင်းနှင့် ရလဒ်"},
  {id:"other",label:"အခြား ဘောလုံးသတင်း"}
 ];
 let stories=[],active="all";
 const node=(tag,text,cls)=>{
  const e=document.createElement(tag);
  if(text!==undefined)e.textContent=text;
  if(cls)e.className=cls;
  return e;
 };
 const isGoalZone=location.pathname.startsWith("/future-code-journal/");
 const exportBrand=isGoalZone?"GOAL ZONE":"FUTURE CODE";
 const exportAccent=isGoalZone?"#c5a257":"#ddaa7e";
 let newsFont;
 const exportCache=new Map();
 async function loadNewsFont(){
  if(!newsFont)newsFont=(async()=>{
   const face=new FontFace("FCNewsMyanmar",'url("/assets/fonts/NotoSansMyanmar-Variable.ttf")',{weight:"100 900"});
   document.fonts.add(await face.load());
   await document.fonts.load('800 48px "FCNewsMyanmar"');
  })();
  return newsFont;
 }
 function headlineLines(ctx,text,width){
  const segments=typeof Intl.Segmenter==="function"?Array.from(new Intl.Segmenter("my",{granularity:"word"}).segment(text),s=>s.segment):Array.from(text);
  const lines=[];let line="";
  for(const part of segments){
   if(ctx.measureText(line+part).width<=width){line+=part;continue;}
   if(line.trim())lines.push(line.trim());line="";
   if(ctx.measureText(part).width<=width){line=part;continue;}
   const clusters=typeof Intl.Segmenter==="function"?Array.from(new Intl.Segmenter("my",{granularity:"grapheme"}).segment(part),s=>s.segment):Array.from(part);
   for(const cluster of clusters){
    if(line&&ctx.measureText(line+cluster).width>width){lines.push(line.trim());line="";}
    line+=cluster;
   }
  }
  if(line.trim())lines.push(line.trim());
  return lines;
 }
 function loadNewsPhoto(src){
  return new Promise((resolve,reject)=>{
   const img=new Image();img.crossOrigin="anonymous";
   const timer=setTimeout(()=>reject(new Error("Photo timeout")),25000);
   img.onload=()=>{clearTimeout(timer);resolve(img);};
   img.onerror=()=>{clearTimeout(timer);reject(new Error("Photo unavailable"));};img.src=new URL(src,location.href).href;
  });
 }
 async function createNewsPoster(s){
  await loadNewsFont();
  const photo=await loadNewsPhoto(s.image);
  const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");
  canvas.width=1080;
  ctx.font='800 48px "FCNewsMyanmar"';
  const lines=headlineLines(ctx,s.title,944),lineHeight=82;
  ctx.font='400 25px "FCNewsMyanmar"';
  const paragraphs=(Array.isArray(s.paragraphs)?s.paragraphs:[]).map(text=>headlineLines(ctx,text,944));
  const bodyLineHeight=48,paragraphGap=25;
  const bodyStart=958+lines.length*lineHeight+25;
  const bodyHeight=paragraphs.reduce((total,paragraph)=>total+paragraph.length*bodyLineHeight+paragraphGap,0);
  canvas.height=Math.max(1350,bodyStart+bodyHeight+155);
  const h=canvas.height;
  ctx.fillStyle="#101b1c";ctx.fillRect(0,0,1080,h);
  ctx.fillStyle=exportAccent;ctx.fillRect(0,0,1080,12);
  ctx.textBaseline="alphabetic";
  ctx.fillStyle=exportAccent;ctx.font="800 52px Arial, sans-serif";ctx.fillText(exportBrand,68,90);
  ctx.fillStyle="#f5f0e5";ctx.font="600 17px Arial, sans-serif";ctx.fillText("FOOTBALL JOURNAL  /  DAILY EDITION",70,124);
  ctx.textAlign="right";ctx.font="700 20px Arial, sans-serif";
  const date=(s.sourceDateLabel||"").split(" · ")[0]||s.sourceDateISO||"";
  ctx.font='600 19px "FCNewsMyanmar"';ctx.fillText(date,1012,92);ctx.textAlign="left";
  ctx.strokeStyle=exportAccent;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(68,150);ctx.lineTo(1012,150);ctx.stroke();
  const px=40,py=183,pw=1000,ph=625;
  const scale=Math.max(pw/photo.naturalWidth,ph/photo.naturalHeight);
  const sw=pw/scale,sh=ph/scale;
  ctx.save();ctx.beginPath();ctx.rect(px,py,pw,ph);ctx.clip();
  ctx.drawImage(photo,(photo.naturalWidth-sw)/2,Math.max(0,(photo.naturalHeight-sh)*0.3),sw,sh,px,py,pw,ph);ctx.restore();
  ctx.fillStyle=exportAccent;ctx.fillRect(40,808,1000,8);
  ctx.fillStyle="#f5f1e8";ctx.fillRect(40,816,1000,h-856);
  ctx.fillStyle=isGoalZone?"#8a651f":"#745039";ctx.font='700 21px "FCNewsMyanmar"';ctx.fillText(s.categoryLabel||"ဘောလုံးသတင်း",68,872);
  ctx.fillStyle="#142120";ctx.font='800 48px "FCNewsMyanmar"';
  lines.forEach((line,i)=>ctx.fillText(line,68,958+i*lineHeight));
  ctx.fillStyle="#26332f";ctx.font='400 25px "FCNewsMyanmar"';
  let bodyY=bodyStart;
  for(const paragraph of paragraphs){
   for(const line of paragraph){ctx.fillText(line,68,bodyY);bodyY+=bodyLineHeight;}
   bodyY+=paragraphGap;
  }
  ctx.strokeStyle="#d1c5b3";ctx.beginPath();ctx.moveTo(68,h-124);ctx.lineTo(1012,h-124);ctx.stroke();
  ctx.fillStyle="#695f53";ctx.font="700 17px Arial, sans-serif";ctx.fillText(exportBrand+"  •  FOOTBALL NEWS",68,h-82);

  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("PNG unavailable")),"image/png"));
  return {blob,width:canvas.width,height:canvas.height,filename:(isGoalZone?"Goal-Zone":"Future-Code")+"-News-"+s.id.replace(/[^a-z0-9_-]/gi,"-")+".png"};
 }
 function posterFor(s){
  const key=JSON.stringify([s.id,s.title,s.image,s.categoryLabel,s.sourceDateLabel]);
  if(!exportCache.has(key))exportCache.set(key,createNewsPoster(s).catch(e=>{exportCache.delete(key);throw e;}));
  return exportCache.get(key);
 }
 function downloadPoster(poster){
  const url=URL.createObjectURL(poster.blob),a=node("a");
  a.href=url;a.download=poster.filename;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
 }
 function previewPoster(poster,title){
  const dialog=node("dialog",undefined,"fc-news-preview");
  const header=node("div",undefined,"fc-news-preview-toolbar");
  const heading=node("strong","ဂျာနယ်ပုံ နမူနာ");const close=node("button","ပိတ်မည်","fc-news-export-secondary");close.type="button";
  header.append(heading,close);
  const url=URL.createObjectURL(poster.blob),img=node("img");img.src=url;img.alt=title;
  const save=node("a","↓ PNG Download","fc-news-export-button");save.href=url;save.download=poster.filename;
  dialog.append(header,img,save);document.body.append(dialog);
  close.addEventListener("click",()=>dialog.close());
  dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});
  dialog.addEventListener("close",()=>{URL.revokeObjectURL(url);dialog.remove();},{once:true});dialog.showModal();
 }
 function exportControls(s){
  const box=node("div",undefined,"fc-news-export");
  box.append(node("strong","သတင်းခေါင်းစဉ် + ဓာတ်ပုံ","fc-news-export-label"));
  const actions=node("div",undefined,"fc-news-export-actions"),status=node("span","","fc-news-export-status");status.setAttribute("role","status");
  const preview=node("button","နမူနာကြည့်ရန်","fc-news-export-secondary"),download=node("button","↓ ဂျာနယ်ပုံ PNG Download","fc-news-export-button");
  for(const [button,mode] of [[preview,"preview"],[download,"download"]]){
   button.type="button";button.setAttribute("aria-label",s.title+" — "+(mode==="preview"?"နမူနာကြည့်ရန်":"PNG Download"));
   button.addEventListener("click",async()=>{
    preview.disabled=download.disabled=true;status.textContent="ဂျာနယ်ပုံ ပြင်ဆင်နေပါသည်…";
    try{const poster=await posterFor(s);if(mode==="preview")previewPoster(poster,s.title);else downloadPoster(poster);status.textContent=poster.width+" × "+poster.height+" PNG";}
    catch{status.textContent="ပုံကို ပြင်ဆင်မရပါ။ အင်တာနက်စစ်ပြီး ထပ်နှိပ်ပေးပါ။";}
    finally{preview.disabled=download.disabled=false;}
   });
  }
  actions.append(preview,download);box.append(actions,status);return box;
 }

 function renderFilters(){
  filters.replaceChildren();
  for(const category of categories){
   const button=node("button",category.label,"fc-news-filter");
   button.type="button";button.dataset.newsCategory=category.id;
   button.setAttribute("aria-pressed",String(active===category.id));
   button.addEventListener("click",()=>{active=category.id;renderFilters();renderStories();});
   filters.append(button);
  }
 }
 function renderStories(){
  const visible=active==="all"?stories:stories.filter(s=>s.category===active);
  countNode.textContent=visible.length+" ပုဒ်";
  grid.replaceChildren();
  if(!visible.length){grid.append(node("p","ဒီအမျိုးအစားအတွက် သတင်းမရှိသေးပါ။","fc-news-empty"));return;}
  const fragment=document.createDocumentFragment();
  for(const s of visible){
   const card=node("article",undefined,"fc-news-card");
   if(s.image){
    const wrap=node("div",undefined,"fc-news-image-wrap");
    const img=node("img",undefined,"fc-news-image");
    img.src=s.image;img.alt=s.imageAlt||s.title;img.loading="lazy";img.decoding="async";
    img.onerror=()=>wrap.remove();
    wrap.append(img);card.append(wrap);
    if(s.imageCaption)card.append(node("div",s.imageCaption,"fc-news-image-caption"));
   }
   const body=node("div",undefined,"fc-news-card-body");
   const meta=node("div",undefined,"fc-news-meta");
   meta.append(node("span",s.categoryLabel||"ဘောလုံးသတင်း","fc-news-category"));
   const time=node("time",s.sourceDateLabel||s.sourceDateISO||"","fc-news-date");
   if(s.sourceDateISO)time.dateTime=s.sourceDateISO;
   meta.append(time);body.append(meta);
   body.append(node("h3",s.title));
   if(s.image)body.append(exportControls(s));
   for(const text of Array.isArray(s.paragraphs)?s.paragraphs:[]){
    body.append(node("p",text,"fc-news-copy"));
   }
   if(s.sourceUrl && /^https:\/\//i.test(s.sourceUrl)){
    const link=node("a",(s.sourceName||"သတင်းရင်းမြစ်")+" ↗","fc-news-source");
    link.href=s.sourceUrl;link.target="_blank";link.rel="noopener noreferrer";body.append(link);
   }else if(s.sourceName){
    body.append(node("span",s.sourceName,"fc-news-source"));
   }
   card.append(body);fragment.append(card);
  }
  grid.append(fragment);
 }
 async function load(){
  try{
   const response=await fetch(section.dataset.newsUrl,{cache:"no-store"});
   if(!response.ok)throw new Error("News feed unavailable");
   const data=await response.json();
   stories=Array.isArray(data.items)?data.items:[];
   windowNode.textContent=data.windowLabel||"နောက်ဆုံး ဘောလုံးသတင်းများ";
   renderFilters();renderStories();
  }catch{
   grid.replaceChildren(node("p","သတင်းများကို ယာယီဖွင့်မရပါ။ နောက်မှ ပြန်ကြည့်ပါ။","fc-news-status"));
   windowNode.textContent="သတင်းအချက်အလက် ရယူရန် မအောင်မြင်ပါ။";
  }
 }
 load();
})();

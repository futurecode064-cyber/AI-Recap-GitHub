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
  const original=new URL(src,location.href).href;
  const u=new URL(original);
  const fromCommons=(u.hostname==="upload.wikimedia.org"||u.hostname==="thumb.wikimedia.org");
  const preferred=fromCommons?"/api/news-image?src="+encodeURIComponent(original):original;
  function attempt(href){
   return new Promise((resolve,reject)=>{
    const img=new Image();img.crossOrigin="anonymous";
    const timer=setTimeout(()=>{img.src="";reject(new Error("Photo timeout"));},15000);
    img.onload=()=>{clearTimeout(timer);resolve(img);};
    img.onerror=()=>{clearTimeout(timer);reject(new Error("Photo unavailable"));};
    img.src=href;
   });
  }
  return attempt(preferred).catch(error=>preferred===original?Promise.reject(error):attempt(original));
 }
 async function createNewsPoster(s,explicitFrameId){
  await loadNewsFont();
  if(!s.image)throw new Error("News article has no verified photograph");
  const photo=await loadNewsPhoto(s.image);
  if(!photo.naturalWidth||!photo.naturalHeight)throw new Error("News photograph has no dimensions");
  const select=document.getElementById("fcNewsCustomFrame");
  const frameId=explicitFrameId===undefined?(select?.value||""):explicitFrameId;
  const chosen=select&&[...select.options].find(o=>o.value===frameId);
  const proFrame=frameId?.startsWith("pro:")?window.FutureCodeProfessionalFrames?.getFrame?.(frameId):null;
  const customFrame=frameId&&!proFrame&&window.FutureCodeCustomFrames?
    (await window.FutureCodeCustomFrames.list()).find(f=>f.id===frameId):null;
  const selectedName=(proFrame?.name||customFrame?.name||chosen?.textContent||"")
    .replace(/\s*·\s*Professional\s*$/i,"").trim();
  const masthead=frameId&&frameId!=="none"&&selectedName&&!/^(မူရင်းပုံစံ|မူရင်းပုံ)$/.test(selectedName)?selectedName:exportBrand;
  const accent=/^#[0-9a-f]{6}$/i.test(proFrame?.color||customFrame?.color||"")?
    (proFrame?.color||customFrame?.color):(isGoalZone?"#bb8e38":"#b84229");
  const W=1200,pad=56,space=25,contentW=W-pad*2,colW=(contentW-space*2)/3;
  const photoBox={x:pad,y:254,w:510,h:620};
  const heroBottom=925,bodyTop=1022;
  const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");
  if(!ctx)throw new Error("Canvas unavailable");
  const titleMaxW=W-pad-photoBox.x-photoBox.w-36;
  let titleFont=49,titleLines=[];
  do{
   ctx.font='800 '+titleFont+'px "FCNewsMyanmar"';
   titleLines=headlineLines(ctx,s.title,titleMaxW);
   if(titleLines.length<=6||titleFont<=35)break;
   titleFont-=2;
  }while(true);
  ctx.font='400 22px "FCNewsMyanmar"';
  const paragraphs=Array.isArray(s.paragraphs)?s.paragraphs.filter(p=>typeof p==="string"&&p.trim()):[];
  const entries=[];
  paragraphs.forEach((p,i)=>{
   headlineLines(ctx,p,colW-14).forEach(line=>entries.push({line}));
   if(i!==paragraphs.length-1)entries.push({gap:true});
  });
  const unitCount=entries.reduce((n,e)=>n+(e.gap?.45:1),0);
  const linesPerColumn=Math.max(1,Math.ceil(unitCount/3)+1);
  const lineHeight=39,bodyHeight=Math.max(175,Math.ceil(linesPerColumn*lineHeight)+34);
  ctx.font='400 16px Arial,sans-serif';
  const attribution=[
    s.imageCredit&&"Photo: "+s.imageCredit,
    s.imageLicense,s.imageLicenseUrl,s.imageSourceUrl
  ].filter(Boolean).join(" · ");
  const creditLines=attribution?headlineLines(ctx,attribution,contentW):[];
  const footerHeight=Math.max(164,112+creditLines.length*24);
  const H=Math.min(30000,Math.max(1680,bodyTop+bodyHeight+footerHeight));
  if(bodyTop+bodyHeight+footerHeight>30000)throw new Error("Article is too long for PNG");
  canvas.width=W;canvas.height=H;
  ctx.textBaseline="alphabetic";ctx.textAlign="left";
  ctx.fillStyle="#faf8f3";ctx.fillRect(0,0,W,H);
  ctx.fillStyle="#162d35";ctx.fillRect(0,0,W,202);
  ctx.fillStyle=accent;ctx.fillRect(0,0,W,14);ctx.fillRect(pad,205,contentW,7);
  ctx.fillStyle="#ffffff";
  let mastSize=82;
  do{
   ctx.font='900 '+mastSize+'px "FCNewsMyanmar",Arial,sans-serif';
   if(ctx.measureText(masthead).width<=contentW||mastSize<=42)break;
   mastSize-=3;
  }while(true);
  ctx.fillText(masthead,pad,110,contentW);
  ctx.font='700 20px Arial,sans-serif';
  ctx.fillStyle="#f0dcc2";ctx.fillText("FOOTBALL NEWS  |  COLOUR JOURNAL EDITION",pad,157);
  ctx.textAlign="right";ctx.fillStyle="#e6e6e1";ctx.font='600 22px "FCNewsMyanmar"';
  ctx.fillText((s.sourceDateLabel||s.sourceDateISO||"").split(" · ")[0],W-pad,188,560);
  ctx.textAlign="left";
  // Printed-photo panel: retain a whole portrait with a softened background, never stretch it.
  const {x,y,w,h}=photoBox;
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  ctx.fillStyle="#24343c";ctx.fillRect(x,y,w,h);
  const iw=photo.naturalWidth,ih=photo.naturalHeight;
  const cover=Math.max(w/iw,h/ih),cropW=w/cover,cropH=h/cover;
  const cropX=Math.max(0,(iw-cropW)/2),cropY=Math.max(0,(ih-cropH)*.32);
  if(s.imageFit==="contain"){
   ctx.save();ctx.filter="blur(25px) brightness(0.65)";
   ctx.drawImage(photo,cropX,cropY,cropW,cropH,x-22,y-22,w+44,h+44);
   ctx.restore();
   const fit=Math.min((w-24)/iw,(h-24)/ih);
   const fw=iw*fit,fh=ih*fit;
   ctx.drawImage(photo,x+(w-fw)/2,y+(h-fh)/2,fw,fh);
  }else ctx.drawImage(photo,cropX,cropY,cropW,cropH,x,y,w,h);
  ctx.restore();
  ctx.fillStyle=accent;ctx.fillRect(x,y+h-7,w,7);
  ctx.fillStyle="#687078";ctx.font='500 16px "FCNewsMyanmar"';
  const caption=s.imageCaption||s.imageAlt||"";
  if(caption){
   ctx.font='500 16px "FCNewsMyanmar"';
   const capLines=headlineLines(ctx,caption,w);
   capLines.slice(0,2).forEach((t,i)=>ctx.fillText(t,x,894+i*24,w));
  }
  const tx=x+w+32;
  ctx.fillStyle=accent;ctx.fillRect(tx,254,12,35);
  ctx.font='800 22px "FCNewsMyanmar"';ctx.fillStyle="#42443e";
  ctx.fillText(s.categoryLabel||"ဘောလုံးသတင်း",tx+22,279,titleMaxW-20);
  ctx.fillStyle="#152d35";ctx.font='800 '+titleFont+'px "FCNewsMyanmar"';
  let titleY=350;
  titleLines.forEach(line=>{ctx.fillText(line,tx,titleY,titleMaxW);titleY+=Math.round(titleFont*1.45);});
  const leadMaxY=865;
  if(paragraphs.length&&titleY+62<leadMaxY){
   ctx.fillStyle=accent;ctx.fillRect(tx,titleY+6,Math.min(titleMaxW,90),5);
   ctx.fillStyle="#34444a";ctx.font='500 22px "FCNewsMyanmar"';
   const lead=headlineLines(ctx,paragraphs[0],titleMaxW);
   const max=Math.floor((leadMaxY-titleY-35)/39);
   lead.slice(0,max).forEach((line,i)=>ctx.fillText(line,tx,titleY+65+i*39,titleMaxW));
   if(lead.length>max&&max>0)ctx.fillText("…",tx,titleY+65+max*39);
  }
  ctx.fillStyle=accent;ctx.fillRect(pad,965,contentW,5);
  ctx.fillStyle="#162d35";ctx.font='800 25px "FCNewsMyanmar"';
  ctx.fillText("သတင်းအပြည့်အစုံ",pad,1005);
  ctx.strokeStyle="#d1cfc7";ctx.lineWidth=2;
  for(let c=1;c<3;c++){
   const xLine=pad+c*colW+(c-.5)*space;
   ctx.beginPath();ctx.moveTo(xLine,bodyTop);ctx.lineTo(xLine,bodyTop+bodyHeight-14);ctx.stroke();
  }
  ctx.fillStyle="#253037";ctx.font='400 22px "FCNewsMyanmar"';
  let col=0,row=0;
  for(const entry of entries){
   const advance=entry.gap?.45:1;
   if(col<2&&row+advance>linesPerColumn){col++;row=0;}
   if(entry.gap){row+=advance;continue;}
   const xx=pad+col*(colW+space),yy=bodyTop+27+row*lineHeight;
   ctx.fillText(entry.line,xx,yy,colW-10);
   row+=advance;
  }
  const footerY=H-footerHeight+16;
  ctx.fillStyle="#162d35";ctx.fillRect(0,footerY,W,Math.max(0,H-footerY));
  ctx.fillStyle=accent;ctx.fillRect(0,footerY,W,6);
  ctx.fillStyle="#f3eee5";ctx.font='700 18px Arial,sans-serif';
  ctx.fillText(masthead+"  /  FOOTBALL NEWS",pad,footerY+38,contentW);
  ctx.fillStyle="#d0d9d8";ctx.font='400 16px Arial,sans-serif';
  creditLines.forEach((line,i)=>ctx.fillText(line,pad,footerY+65+i*24,contentW));
  ctx.fillStyle="#e9caa1";ctx.font='700 18px Arial,sans-serif';
  ctx.textAlign="right";ctx.fillText("PAGE 01",W-pad,H-25);ctx.textAlign="left";
  let output=canvas;
  if(customFrame)output=await window.FutureCodeCustomFrames.wrap(output,customFrame);
  if(window.FutureCodeProfessionalFrames){
   output=await window.FutureCodeProfessionalFrames.wrap(output,"news",frameId?.startsWith("pro:")?frameId:"none");
  }
  const blob=await new Promise((resolve,reject)=>output.toBlob(b=>b?resolve(b):reject(new Error("PNG unavailable")),"image/png"));
  const prefix=masthead.replace(/[^a-z0-9\u1000-\u109f_-]/gi,"-").slice(0,45)||exportBrand.replace(/\s+/g,"-");
  return {blob,width:output.width,height:output.height,filename:prefix+"-News-"+s.id.replace(/[^a-z0-9_-]/gi,"-")+".png"};
 }
 window.FutureCodeNewsFrameExport=Object.freeze({list:()=>stories.slice(),render:(story,frameId)=>createNewsPoster(story,frameId)});
 function posterFor(s){
  // Selected frames and their edited artwork can change without a new story ID.
  // Always build a fresh PNG to prevent exporting a stale masthead or banner.
  return createNewsPoster(s);
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
    if(s.imageFit==='contain'){img.style.objectFit='contain';img.style.background='#101b1c';}
    img.onerror=()=>wrap.remove();
    wrap.append(img);card.append(wrap);
    if(s.imageCaption)card.append(node("div",s.imageCaption,"fc-news-image-caption"));
    if(s.imageCredit){
     const credit=node('div',undefined,'fc-news-image-caption');
     const source=node('a',s.imageCredit);source.href=s.imageSourceUrl;source.target='_blank';source.rel='noopener noreferrer';credit.append(source);
     if(s.imageLicense&&s.imageLicenseUrl){const license=node('a',s.imageLicense);license.href=s.imageLicenseUrl;license.target='_blank';license.rel='license noopener noreferrer';credit.append(document.createTextNode(' · '),license);}
     card.append(credit);
    }
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
   const response=await (window.FootballData?window.FootballData.fetch:fetch)(section.dataset.newsUrl,{cache:"no-store"});
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


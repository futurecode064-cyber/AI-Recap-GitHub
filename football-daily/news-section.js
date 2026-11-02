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
 section.dataset.newsBrand=isGoalZone?"goal-zone":"future-code";
 let newsFont;
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
  await document.fonts.ready;
  await window.FutureCodeProfessionalFrames?.ready;
  if(!s.image)throw new Error("News article has no verified photograph");
  const photo=await loadNewsPhoto(s.image);
  if(!photo.naturalWidth||!photo.naturalHeight)throw new Error("News photograph has no dimensions");
  const select=document.getElementById("fcNewsCustomFrame");
  const frameId=explicitFrameId===undefined?(select?.value||await window.FutureCodeProfessionalFrames?.getSelected?.("news")||""):explicitFrameId;
  const chosen=select&&[...select.options].find(o=>o.value===frameId);
  const proFrame=frameId?.startsWith("pro:")?window.FutureCodeProfessionalFrames?.getFrame?.(frameId):null;
  const customFrame=frameId&&!proFrame&&window.FutureCodeCustomFrames?
    (await window.FutureCodeCustomFrames.list()).find(f=>f.id===frameId):null;
  const selectedName=(proFrame?.name||customFrame?.name||chosen?.textContent||"")
    .replace(/\s*·\s*Professional\s*$/i,"").trim();
  const masthead=frameId&&frameId!=="none"&&selectedName&&!/^(မူရင်းပုံစံ|မူရင်းပုံ)$/.test(selectedName)?selectedName:exportBrand;
  const accent=/^#[0-9a-f]{6}$/i.test(proFrame?.color||customFrame?.color||"")?
    (proFrame?.color||customFrame?.color):(isGoalZone?"#bb8e38":"#b84229");
  // A measured two-column newspaper, rendered at 2x for crisp Myanmar type.
  const W=1200,pad=64,space=48,contentW=W-pad*2,colW=(contentW-space)/2;
  const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");
  if(!ctx)throw new Error("Canvas unavailable");
  const mix=(hex,toward,amount)=>"#"+[0,2,4].map(i=>Math.round(parseInt(hex.slice(i+1,i+3),16)*(1-amount)+toward*amount).toString(16).padStart(2,"0")).join("");
  const ink=mix(accent,0,.73),muted=mix(accent,0,.48),paper=mix(accent,255,.97),rule=mix(accent,255,.72);
  const paragraphs=Array.isArray(s.paragraphs)?s.paragraphs.filter(p=>typeof p==="string"&&p.trim()):[];
  const titleFont=46,titleLH=76;
  ctx.font='800 '+titleFont+'px "FCNewsMyanmar"';
  const titleLines=headlineLines(ctx,s.title,contentW);
  const titleTop=312,titleBottom=titleTop+(titleLines.length-1)*titleLH;
  const photoBox={x:pad,y:titleBottom+52,w:contentW,h:560};
  const bodyTop=photoBox.y+photoBox.h+106;
  const bodyFont=28,lineHeight=53;
  ctx.font='400 '+bodyFont+'px "FCNewsMyanmar"';
  const entries=[];
  paragraphs.forEach((p,i)=>{
   headlineLines(ctx,p,colW).forEach(line=>entries.push({line}));
   if(i!==paragraphs.length-1)entries.push({gap:true});
  });
  const unitCount=entries.reduce((n,e)=>n+(e.gap?.65:1),0);
  const linesPerColumn=Math.max(5,Math.ceil(unitCount/2)+1);
  const columns=[[],[]];let col=0,row=0;
  for(const entry of entries){
   const advance=entry.gap?.65:1;
   if(col===0&&row+advance>linesPerColumn){col=1;row=0;}
   columns[col].push({...entry,row});row+=advance;
  }
  const bodyRows=Math.max(...columns.map(c=>c.length?c[c.length-1].row+1:0));
  const footerHeight=180;
  const H=Math.ceil(bodyTop+bodyRows*lineHeight+72+footerHeight);
  // Bound memory before allocating; never truncate the story to fit.
  if(H>15000||W*H*4>100000000)throw new Error("Article is too long for a single high-resolution PNG");
  canvas.width=W*2;canvas.height=H*2;
  ctx.scale(2,2);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
  ctx.fillStyle=paper;ctx.fillRect(0,0,W,H);
  ctx.fillStyle=ink;ctx.fillRect(0,0,W,198);
  ctx.fillStyle=accent;ctx.fillRect(0,0,W,12);
  ctx.fillStyle="#ffffff";
  let mastSize=76;
  do{ctx.font='900 '+mastSize+'px "FCNewsMyanmar",Arial,sans-serif';if(ctx.measureText(masthead).width<=contentW||mastSize<=30)break;mastSize-=2;}while(true);
  ctx.fillText(masthead,pad,111);
  ctx.font='700 17px Arial,sans-serif';ctx.fillStyle=mix(accent,255,.68);
  ctx.fillText("T H E   F O O T B A L L   J O U R N A L",pad,158);
  ctx.textAlign="right";ctx.font='500 18px "FCNewsMyanmar"';ctx.fillStyle="#ffffff";
  ctx.fillText((s.sourceDateLabel||s.sourceDateISO||"").split(" · ")[0],W-pad,158,340);ctx.textAlign="left";
  ctx.fillStyle=accent;ctx.fillRect(pad,226,7,29);
  ctx.font='800 20px "FCNewsMyanmar"';ctx.fillText(s.categoryLabel||"ဘောလုံးသတင်း",pad+22,249,contentW-230);
  ctx.textAlign="right";ctx.fillStyle=muted;ctx.font='700 14px Arial';ctx.fillText("NEWS / FOOTBALL",W-pad,248);ctx.textAlign="left";
  ctx.font='800 '+titleFont+'px "FCNewsMyanmar"';ctx.fillStyle=ink;
  titleLines.forEach((line,i)=>ctx.fillText(line,pad,titleTop+i*titleLH));
  const {x,y,w,h}=photoBox,iw=photo.naturalWidth,ih=photo.naturalHeight;
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.fillStyle=ink;ctx.fillRect(x,y,w,h);
  if(s.imageFit==="contain"){
   const fit=Math.min((w-24)/iw,(h-24)/ih),fw=iw*fit,fh=ih*fit;
   ctx.drawImage(photo,x+(w-fw)/2,y+(h-fh)/2,fw,fh);
  }else{
   const scale=Math.max(w/iw,h/ih),sw=w/scale,sh=h/scale;
   ctx.drawImage(photo,(iw-sw)/2,Math.max(0,(ih-sh)*.28),sw,sh,x,y,w,h);
  }
  ctx.restore();ctx.fillStyle=accent;ctx.fillRect(x,y+h-6,w,6);
  // No photo caption: credits stay in the final colophon.
  ctx.fillStyle=ink;ctx.font='800 23px "FCNewsMyanmar"';ctx.fillText("သတင်းအပြည့်အစုံ",pad,bodyTop-36);
  ctx.fillStyle=rule;ctx.fillRect(pad,bodyTop-16,contentW,1);
  ctx.fillStyle=accent;ctx.fillRect(pad,bodyTop-18,100,4);
  ctx.fillStyle=rule;ctx.fillRect(W/2,bodyTop+8,1,bodyRows*lineHeight);
  ctx.font='400 '+bodyFont+'px "FCNewsMyanmar"';ctx.fillStyle=ink;
  columns.forEach((list,i)=>list.forEach(e=>{if(!e.gap)ctx.fillText(e.line,pad+i*(colW+space),bodyTop+39+e.row*lineHeight);}));
  const footerY=H-footerHeight;
  ctx.fillStyle=ink;ctx.fillRect(0,footerY,W,footerHeight);ctx.fillStyle=accent;ctx.fillRect(0,footerY,W,6);
  ctx.fillStyle="#ffffff";ctx.font='800 21px "FCNewsMyanmar"';ctx.fillText(masthead,pad,footerY+45,contentW-200);
  ctx.textAlign="right";ctx.font='700 15px Arial';ctx.fillText("FOOTBALL JOURNAL",W-pad,footerY+45);ctx.textAlign="left";
  ctx.font='400 16px "FCNewsMyanmar"';ctx.fillStyle=mix(accent,255,.8);
  const credits=[s.sourceName?"SOURCE: "+s.sourceName:"",[s.imageCredit,s.imageLicense].filter(Boolean).join(" · "),s.imageLicenseUrl||""].filter(Boolean);
  credits.forEach((line,i)=>ctx.fillText(line,pad,footerY+82+i*29,contentW));
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
  box.append(node("strong","ဂျာနယ် စာမျက်နှာ · အရည်အသွေးမြင့် PNG","fc-news-export-label"));
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
  for(const [index,s] of visible.entries()){
   const card=node("article",undefined,"fc-news-card");
   if(index===0)card.classList.add("fc-news-lead");
   card.dataset.edition=String(index+1).padStart(2,"0");
   if(s.image){
    const wrap=node("div",undefined,"fc-news-image-wrap");
    const img=node("img",undefined,"fc-news-image");
    img.src=s.image;img.alt=s.imageAlt||s.title;img.loading="lazy";img.decoding="async";
    if(s.imageFit==='contain'){img.style.objectFit='contain';img.style.background='#101b1c';}
    img.onerror=()=>wrap.remove();
    wrap.append(img);card.append(wrap);
   }
   const body=node("div",undefined,"fc-news-card-body");
   const meta=node("div",undefined,"fc-news-meta");
   meta.append(node("span",s.categoryLabel||"ဘောလုံးသတင်း","fc-news-category"));
   const time=node("time",s.sourceDateLabel||s.sourceDateISO||"","fc-news-date");
   if(s.sourceDateISO)time.dateTime=s.sourceDateISO;
   meta.append(time);body.append(meta);
   body.append(node("h3",s.title));

   for(const text of Array.isArray(s.paragraphs)?s.paragraphs:[]){
    body.append(node("p",text,"fc-news-copy"));
   }
   if(s.sourceUrl && /^https:\/\//i.test(s.sourceUrl)){
    const link=node("a",(s.sourceName||"သတင်းရင်းမြစ်")+" ↗","fc-news-source");
    link.href=s.sourceUrl;link.target="_blank";link.rel="noopener noreferrer";body.append(link);
   }else if(s.sourceName){
    body.append(node("span",s.sourceName,"fc-news-source"));
   }
   // Credit links belong with article sources, not underneath the photograph.
   if(s.imageCredit){
    const credit=node("div",undefined,"fc-news-attribution");
    const source=s.imageSourceUrl&&/^https:\/\//i.test(s.imageSourceUrl)?node("a",s.imageCredit):node("span",s.imageCredit);
    if(source.tagName==="A"){source.href=s.imageSourceUrl;source.target="_blank";source.rel="noopener noreferrer";}
    credit.append(document.createTextNode("Photo: "),source);
    if(s.imageLicense){
     if(s.imageLicenseUrl&&/^https:\/\//i.test(s.imageLicenseUrl)){
      const licence=node("a",s.imageLicense);licence.href=s.imageLicenseUrl;licence.target="_blank";licence.rel="license noopener noreferrer";credit.append(document.createTextNode(" · "),licence);
     }else credit.append(document.createTextNode(" · "+s.imageLicense));
    }
    body.append(credit);
   }
   if(s.image)body.append(exportControls(s));
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


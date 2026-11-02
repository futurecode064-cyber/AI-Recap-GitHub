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
 async function newsPngMetadata(blob,items){
  const bytes=new Uint8Array(await blob.arrayBuffer()),enc=new TextEncoder();
  const attribution=items.map(s=>({title:s.title,author:s.imageCredit||"",imageSource:s.imageSourceUrl||s.image||"",license:s.imageLicense||"",licenseUrl:s.imageLicenseUrl||"",articleSource:s.sourceUrl||"",changes:"Photograph composed into a sports journal layout; cropped or resized where applicable."}));
  const data=enc.encode("Attribution\0\0\0\0\0"+JSON.stringify(attribution));
  const type=enc.encode("iTXt"),chunk=new Uint8Array(data.length+12),view=new DataView(chunk.buffer);
  view.setUint32(0,data.length);chunk.set(type,4);chunk.set(data,8);
  let crc=0xffffffff;
  for(const b of chunk.subarray(4,8+data.length)){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
  view.setUint32(8+data.length,(crc^0xffffffff)>>>0);
  return new Blob([bytes.subarray(0,bytes.length-12),chunk,bytes.subarray(bytes.length-12)],{type:"image/png"});
 }
 async function createNewsPoster(s,explicitFrameId,draftFrame){
  await loadNewsFont();
  await document.fonts.ready;
  await window.FutureCodeProfessionalFrames?.ready;
  if(!s.image)throw new Error("News article has no verified photograph");
  const photo=await loadNewsPhoto(s.image);
  if(!photo.naturalWidth||!photo.naturalHeight)throw new Error("News photograph has no dimensions");
  const select=document.getElementById("fcNewsCustomFrame");
  const frameId=explicitFrameId===undefined?(select?.value||await window.FutureCodeProfessionalFrames?.getSelected?.("news")||""):explicitFrameId;
  const chosen=select&&[...select.options].find(o=>o.value===frameId);
  const proFrame=draftFrame||(frameId?.startsWith("pro:")?window.FutureCodeProfessionalFrames?.getFrame?.(frameId):null);
  const customFrame=frameId&&!proFrame&&window.FutureCodeCustomFrames?
    (await window.FutureCodeCustomFrames.list()).find(f=>f.id===frameId):null;
  const selectedName=(proFrame?.name||customFrame?.name||chosen?.textContent||"")
    .replace(/\s*·\s*Professional\s*$/i,"").trim();
  const masthead=(draftFrame||frameId&&frameId!=="none")&&selectedName&&!/^(မူရင်းပုံစံ|မူရင်းပုံ)$/.test(selectedName)?selectedName:exportBrand;
  const accent=/^#[0-9a-f]{6}$/i.test(proFrame?.color||customFrame?.color||"")?
    (proFrame?.color||customFrame?.color):(isGoalZone?"#bb8e38":"#b84229");
  // Sports-cover composition: metallic masthead, floodlights, angled photo and layered type.
  const W=1200,pad=66,contentW=W-pad*2,space=46,colW=(contentW-space)/2;
  const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");
  if(!ctx)throw new Error("Canvas unavailable");
  const mix=(hex,toward,amount)=>"#"+[0,2,4].map(i=>Math.round(parseInt(hex.slice(i+1,i+3),16)*(1-amount)+toward*amount).toString(16).padStart(2,"0")).join("");
  const palette=window.FutureCodeNewsPalette.resolve(proFrame||customFrame||{color:accent});
  const ink=palette.headline,deep=palette.deep,light=palette.glow,trim=palette.border,shine=palette.border;
  const paragraphs=Array.isArray(s.paragraphs)?s.paragraphs.filter(p=>typeof p==="string"&&p.trim()):[];
  const titleWidth=590,titleTop=356;
  let titleFont=58,titleLines=[];
  do{
   ctx.font='800 '+titleFont+'px "FCNewsMyanmar"';
   titleLines=headlineLines(ctx,s.title,titleWidth);
   if(titleLines.length<2||ctx.measureText(titleLines[titleLines.length-1]).width>=titleWidth*.35||titleFont<=48)break;
   titleFont-=2;
  }while(true);
  const titleLH=Math.ceil(titleFont*1.64);
  const titleEnd=titleTop+(titleLines.length-1)*titleLH;
  // The opening paragraph sits beside the photo; all remaining prose continues below.
  const bodyFont=27,lineHeight=51,leadWidth=535;
  ctx.font='500 '+bodyFont+'px "FCNewsMyanmar"';
  const leadLines=headlineLines(ctx,paragraphs[0]||"",leadWidth);
  const leadTop=titleEnd+90;
  const heroEnd=Math.max(1120,leadTop+leadLines.length*lineHeight+60);
  const photoBox={x:610,y:250,w:546,h:heroEnd-260};
  const bodyTop=heroEnd+68;
  ctx.font='400 '+bodyFont+'px "FCNewsMyanmar"';
  const entries=[];
  paragraphs.slice(1).forEach((p,i)=>{
   headlineLines(ctx,p,colW).forEach(line=>entries.push({line}));
   if(i!==paragraphs.length-2)entries.push({gap:true});
  });
  const unitCount=entries.reduce((n,e)=>n+(e.gap?.65:1),0);
  const linesPerColumn=Math.max(1,Math.ceil(unitCount/2)+1);
  const columns=[[],[]];let col=0,row=0;
  for(const entry of entries){
   const advance=entry.gap?.65:1;
   if(col===0&&row+advance>linesPerColumn){col=1;row=0;}
   columns[col].push({...entry,row});row+=advance;
  }
  const bodyRows=Math.max(...columns.map(c=>c.length?c[c.length-1].row+1:0));
  const H=Math.ceil(bodyTop+bodyRows*lineHeight+100);
  if(H>15000||W*H*4>100000000)throw new Error("Article is too long for a single high-resolution PNG");
  canvas.width=W*2;canvas.height=H*2;
  ctx.scale(2,2);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
  const polygon=(points,fill)=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();};
  const bg=ctx.createLinearGradient(0,0,W,heroEnd);bg.addColorStop(0,deep);bg.addColorStop(.48,palette.background);bg.addColorStop(1,ink);ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  // Fine vertical print texture and stadium-light rays, rather than a flat solid card.
  ctx.save();ctx.globalAlpha=.12;ctx.strokeStyle=palette.texture;ctx.lineWidth=1;
  for(let x=25;x<W;x+=9){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  ctx.restore();
  polygon([[0,230],[580,0],[1000,0],[0,760]],palette.texture+"12");
  polygon([[W,190],[W,680],[440,heroEnd],[120,heroEnd]],palette.texture+"0a");
  const halo=ctx.createRadialGradient(180,670,10,180,670,850);halo.addColorStop(0,palette.glow);halo.addColorStop(.5,light);halo.addColorStop(1,"#ffffff00");ctx.fillStyle=halo;ctx.fillRect(0,230,760,heroEnd-230);
  // Metallic corner rails and angled yellow accents echo the supplied sports cover.
  polygon([[16,18],[W-16,18],[W-16,70],[W-36,51],[36,51],[16,70]],trim);
  polygon([[16,18],[62,18],[16,64]],shine);
  ctx.strokeStyle=palette.outerBorder;ctx.lineWidth=18;ctx.strokeRect(17,17,W-34,H-34);
  ctx.strokeStyle=trim;ctx.lineWidth=4;ctx.strokeRect(29,29,W-58,H-58);
  // Large dimensional brand masthead, fitted by measurement without distortion.
  let mastSize=120;
  do{ctx.font='900 '+mastSize+'px "FCNewsMyanmar",Arial,sans-serif';if(ctx.measureText(masthead).width<=contentW||mastSize<=30)break;mastSize-=2;}while(true);
  ctx.save();ctx.shadowColor=palette.mastheadShadow;ctx.shadowBlur=7;ctx.shadowOffsetY=6;ctx.lineJoin="round";ctx.strokeStyle=palette.mastheadOutline;ctx.lineWidth=7;ctx.strokeText(masthead,pad,186);ctx.fillStyle=palette.masthead;ctx.fillText(masthead,pad,186);ctx.restore();
  polygon([[pad,214],[W-pad,214],[W-pad-35,228],[pad+35,228]],trim);
  // Full-height hero panel. Preserve the entire portrait when the feed requests contain.
  const {x,y,w,h}=photoBox,iw=photo.naturalWidth,ih=photo.naturalHeight;
  ctx.save();ctx.beginPath();ctx.moveTo(x+54,y);ctx.lineTo(x+w,y);ctx.lineTo(x+w,y+h);ctx.lineTo(x-40,y+h);ctx.lineTo(x-8,y+180);ctx.closePath();ctx.clip();
  const cover=Math.max(w/iw,h/ih),sw=w/cover,sh=h/cover;
  ctx.drawImage(photo,(iw-sw)/2,Math.max(0,(ih-sh)*.26),sw,sh,x,y,w,h);
  if(s.imageFit==="contain"){
   ctx.fillStyle=palette.photoMat+"b8";ctx.fillRect(x,y,w,h);
   const fit=Math.min(w/iw,h/ih),fw=iw*fit,fh=ih*fit;
   ctx.drawImage(photo,x+(w-fw)/2,y+(h-fh)/2,fw,fh);
  }
  const shade=ctx.createLinearGradient(x,y,x,y+h);shade.addColorStop(0,"#00000000");shade.addColorStop(.7,"#00000000");shade.addColorStop(1,ink);ctx.fillStyle=shade;ctx.fillRect(x-50,y,w+50,h);
  ctx.restore();
  ctx.strokeStyle=trim;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x+54,y);ctx.lineTo(x-8,y+180);ctx.lineTo(x-40,y+h);ctx.stroke();
  // Headline layers: safe white keyline, dark extrusion, alternating ink and accent.
  ctx.font='800 '+titleFont+'px "FCNewsMyanmar"';ctx.lineJoin="round";
  titleLines.forEach((line,i)=>{
   const yy=titleTop+i*titleLH;
   ctx.save();ctx.shadowColor=palette.headlineShadow+"66";ctx.shadowBlur=4;ctx.shadowOffsetY=5;ctx.strokeStyle=palette.headlineOutline;ctx.lineWidth=12;ctx.strokeText(line,pad,yy);ctx.fillStyle=i%2?palette.headlineAccent:palette.headline;ctx.fillText(line,pad,yy);ctx.restore();
  });
  polygon([[pad,leadTop-50],[pad+150,leadTop-50],[pad+133,leadTop-40],[pad,leadTop-40]],deep);
  // The left article panel is translucent paper, keeping the cover texture underneath.
  ctx.fillStyle=palette.leadPanel;ctx.fillRect(pad-14,leadTop-24,leadWidth+28,leadLines.length*lineHeight+42);
  ctx.fillStyle=palette.bodyText;ctx.font='500 '+bodyFont+'px "FCNewsMyanmar"';
  leadLines.forEach((line,i)=>ctx.fillText(line,pad,leadTop+22+i*lineHeight));
  polygon([[42,heroEnd],[W-42,heroEnd-46],[W-42,H-48],[42,H-48]],palette.articlePanel);
  polygon([[42,heroEnd],[W-42,heroEnd-46],[W-42,heroEnd-35],[42,heroEnd+11]],trim);
  ctx.fillStyle=palette.bodyText;ctx.font='400 '+bodyFont+'px "FCNewsMyanmar"';
  columns.forEach((list,i)=>list.forEach(e=>{if(!e.gap)ctx.fillText(e.line,pad+i*(colW+space),bodyTop+30+e.row*lineHeight);}));
  if(bodyRows){ctx.fillStyle=palette.divider;ctx.fillRect(W/2,bodyTop,1,bodyRows*lineHeight);}
  // Decorative bottom rail only. No source, caption, credit or extra footer copy is painted.
  polygon([[42,H-48],[W-42,H-48],[W-74,H-30],[74,H-30]],trim);
  let output=canvas;
  if(draftFrame)return window.FutureCodeProfessionalFrames.renderSample(draftFrame,canvas);
  if(customFrame)output=await window.FutureCodeCustomFrames.wrap(output,customFrame);
  if(window.FutureCodeProfessionalFrames){
   output=await window.FutureCodeProfessionalFrames.wrap(output,"news",frameId?.startsWith("pro:")?frameId:"none");
  }
  const rawBlob=await new Promise((resolve,reject)=>output.toBlob(b=>b?resolve(b):reject(new Error("PNG unavailable")),"image/png"));
  const blob=await newsPngMetadata(rawBlob,[s]);
  const prefix=masthead.replace(/[^a-z0-9\u1000-\u109f_-]/gi,"-").slice(0,45)||exportBrand.replace(/\s+/g,"-");
  return {blob,width:output.width,height:output.height,filename:prefix+"-News-"+s.id.replace(/[^a-z0-9_-]/gi,"-")+".png"};
 }
 window.FutureCodeNewsFrameExport=Object.freeze({list:()=>stories.slice(),render:(story,frameId)=>createNewsPoster(story,frameId),metadata:newsPngMetadata,renderDraft:(story,frame)=>createNewsPoster(story,"none",frame)});
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
    img.src=s.image;img.alt=s.imageAlt||s.title;img.title=[s.imageCredit,s.imageLicense,s.imageSourceUrl].filter(Boolean).join(" · ");img.loading="lazy";img.decoding="async";
    if(s.imageFit==='contain'){img.style.objectFit='contain';img.style.background='#101b1c';}
    img.onerror=()=>{img.hidden=true;wrap.classList.add("fc-news-photo-unavailable");};
    wrap.append(img,node("h3",s.title,"fc-news-cover-title"));card.append(wrap);
   }
   const body=node("div",undefined,"fc-news-card-body");
   const meta=node("div",undefined,"fc-news-meta");
   meta.append(node("span",s.categoryLabel||"ဘောလုံးသတင်း","fc-news-category"));
   const time=node("time",s.sourceDateLabel||s.sourceDateISO||"","fc-news-date");
   if(s.sourceDateISO)time.dateTime=s.sourceDateISO;
   meta.append(time);body.append(meta);
   if(!s.image)body.append(node("h3",s.title));

   for(const text of Array.isArray(s.paragraphs)?s.paragraphs:[]){
    body.append(node("p",text,"fc-news-copy"));
   }
   // Provenance stays in the feed and downloadable PNG metadata, not footer copy.
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


"use strict";
/* BCF-only image save guard. Adds the ORIGINAL user banners to each PNG/JPG image download,
   including exports that bypass the shared CanvasKit and create their own Blob URLs. */
(function(){
 if(!document.documentElement.classList.contains("bcf-theme")||window.__bcfOriginalBannerGuard)return;
 window.__bcfOriginalBannerGuard=true;
 const CDN={
  top:"https://cdn.openart.ai/openart-uploads/production/attachment-transfers/817caf2a086180a639a52fdcbd9ab3de857e25a1484cf054d1487cad564f9b7c.jpg",
  bottom:"https://cdn.openart.ai/openart-uploads/production/attachment-transfers/5f61c4806dc0db2f71d605d6dc8c14150bcdb112041915ddfd8e54a493fa1191.jpg"
 };
 const banner={
  top:["./assets/banner-top.jpg",CDN.top],
  bottom:["./assets/banner-bottom.jpg",CDN.bottom]
 };
 const nativeClick=HTMLAnchorElement.prototype.click;
 const loadImage=(src)=>new Promise((resolve,reject)=>{
  const img=new Image();img.crossOrigin="anonymous";
  img.onload=()=>resolve(img);img.onerror=()=>reject(new Error("Banner not available"));
  img.src=src;
 });
 async function localFirst(kind){
  for(const src of banner[kind])try{return await loadImage(src)}catch(_){}
  throw new Error("BCF "+kind+" banner could not load");
 }
 async function fromBlob(blob){
  const url=URL.createObjectURL(blob);
  try{return await loadImage(url)}finally{setTimeout(()=>URL.revokeObjectURL(url),1000)}
 }
 function pngBlob(canvas){
  return new Promise((resolve,reject)=>canvas.toBlob(v=>v?resolve(v):reject(Error("BCF PNG encoding failed")),"image/png"));
 }
 async function compose(original){
  const [top,bottom]=await Promise.all([localFirst("top"),localFirst("bottom")]);
  const width=original.naturalWidth||original.width;
  const height=original.naturalHeight||original.height;
  const topHeight=Math.round(width*382/2048);
  const bottomHeight=Math.round(width*291/2048);
  const canvas=document.createElement("canvas");
  canvas.width=width;canvas.height=topHeight+height+bottomHeight;
  const ctx=canvas.getContext("2d");
  if(!ctx)throw Error("PNG Canvas unsupported");
  ctx.drawImage(top,0,0,width,topHeight);
  ctx.drawImage(original,0,topHeight,width,height);
  ctx.drawImage(bottom,0,topHeight+height,width,bottomHeight);
  return canvas;
 }
 let sequence=0;
 HTMLAnchorElement.prototype.click=function(){
  const href=this.href||"",filename=this.download||"";
  if(!/\.(?:png|jpe?g|webp)$/i.test(filename)|| !/^(?:blob:|data:image\/)/i.test(href))
    return nativeClick.call(this);
  const outputName=filename.replace(/\.[^.]+$/,"")+".png";
  const ticket=++sequence;
  const bannerStatus=document.getElementById("bcfDownloadStatus");
  if(bannerStatus)bannerStatus.textContent="BCF Banner ဖြင့် PNG ပြင်ဆင်နေသည်…";
  (async()=>{
   const response=await fetch(href);
   if(!response.ok)throw Error("Original PNG read failed");
   const original=await fromBlob(await response.blob());
   const canvas=await compose(original);
   const blob=await pngBlob(canvas);
   const url=URL.createObjectURL(blob);
   try{
    const link=document.createElement("a");
    link.href=url;link.download=outputName;
    document.body.appendChild(link);
    nativeClick.call(link);
    link.remove();
    if(bannerStatus)bannerStatus.textContent="✓ BCF ပထမ/ဒုတိယ Banner ပါသော PNG သိမ်းဆည်းပြီးပါပြီ";
   }finally{setTimeout(()=>URL.revokeObjectURL(url),30000)}
  })().catch(error=>{
   console.error("BCF required banner export failed",ticket,error);
   if(bannerStatus)bannerStatus.textContent="Banner မရရှိ၍ PNG မသိမ်းနိုင်ပါ။ ပြန်ကြိုးစားပါ။";
   else alert("BCF Banner နှစ်ခု မဖွင့်နိုင်သေးပါ။ PNG Download ကို ပြန်ကြိုးစားပါ။");
  });
 };
})();
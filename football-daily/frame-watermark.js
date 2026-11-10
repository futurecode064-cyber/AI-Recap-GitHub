"use strict";
/* Frame Editor: saved, per-frame translucent logo watermark for previews and exported PNG/ZIP. */
(function(){
 const positions=["top-left","top-center","top-right","middle-left","center","middle-right","bottom-left","bottom-center","bottom-right","custom"];
 const clamp=(n,min,max,fallback)=>Number.isFinite(Number(n))?Math.min(max,Math.max(min,Number(n))):fallback;
 function settings(frame){
  const w=frame?.watermark||{};
  const image=typeof w.image==="string"&&w.image.length<12000000&&/^(data:image\/(?:png|jpeg|webp);base64,|blob:)/i.test(w.image)?w.image:"";
  return {enabled:w.enabled===true,image,position:positions.includes(w.position)?w.position:"center",
   x:clamp(w.x,0,100,50),y:clamp(w.y,0,100,50),size:clamp(w.size,5,80,34),
   opacity:clamp(w.opacity,0,100,12),blur:clamp(w.blur,0,12,1)};
 }
 function coordinates(position,x,y){
  if(position==="custom")return [x/100,y/100];
  const col=position.endsWith("-left")?0:position.endsWith("-right")?1:.5;
  const row=position.startsWith("top-")?0:position.startsWith("bottom-")?1:.5;
  return [col,row];
 }
 async function load(src){
  return new Promise((resolve,reject)=>{
   const image=new Image();
   image.onload=()=>resolve(image);
   image.onerror=()=>reject(Error("Watermark Logo ပုံဖတ်မရပါ။ PNG/JPG/WebP အသစ်ပြန်တင်ပါ။"));
   image.src=src;
  });
 }
 async function draw(canvas,frame){
  const w=settings(frame);
  if(!w.enabled||!w.image||w.opacity<=0)return canvas;
  const img=await load(w.image);
  const width=canvas.width,height=canvas.height;
  const naturalWidth=img.naturalWidth,naturalHeight=img.naturalHeight;
  if(!naturalWidth||!naturalHeight)throw Error("Watermark Logo ပုံ မမှန်ပါ။");
  const scale=Math.min(width*w.size/100/naturalWidth,height*.70/naturalHeight);
  const drawWidth=naturalWidth*scale,drawHeight=naturalHeight*scale;
  const [fx,fy]=coordinates(w.position,w.x,w.y);
  const margin=Math.max(3,Math.min(width,height)*.025);
  const cx=Math.max(drawWidth/2+margin,Math.min(width-drawWidth/2-margin,width*fx));
  const cy=Math.max(drawHeight/2+margin,Math.min(height-drawHeight/2-margin,height*fy));
  const ctx=canvas.getContext("2d");
  if(!ctx)throw Error("Watermark Canvas မရရှိပါ။");
  ctx.save();
  try{
   ctx.globalAlpha=w.opacity/100;
   if(w.blur>0&&"filter" in ctx)ctx.filter="blur("+w.blur+"px)";
   ctx.drawImage(img,cx-drawWidth/2,cy-drawHeight/2,drawWidth,drawHeight);
  }finally{ctx.restore();}
  return canvas;
 }
 async function applyBlob(blob,frame){
  const w=settings(frame);
  if(!w.enabled||!w.image||w.opacity<=0)return blob;
  const bitmap=await createImageBitmap(blob);
  try{
   const canvas=document.createElement("canvas");
   canvas.width=bitmap.width;canvas.height=bitmap.height;
   const ctx=canvas.getContext("2d");
   if(!ctx)throw Error("Watermark PNG Canvas မရရှိပါ။");
   ctx.drawImage(bitmap,0,0);
   await draw(canvas,{watermark:w});
   return await new Promise((ok,bad)=>canvas.toBlob(b=>b&&b.size?ok(b):bad(Error("Watermark PNG မထွက်ပါ")),"image/png"));
  }finally{bitmap.close?.();}
 }
 window.FCWatermark=Object.freeze({settings,draw,applyBlob,positions});
})();
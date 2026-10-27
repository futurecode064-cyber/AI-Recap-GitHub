"use strict";
/* Custom frames are local to this browser, shared across main-site pages. */
(function(){
 if(document.documentElement.dataset.footballBrandName)return;
 const key='future-code-main-frame-studio-v1';
 function list(){return new Promise((resolve,reject)=>{const req=indexedDB.open(key,1);req.onupgradeneeded=()=>req.result.createObjectStore('frames');req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result,t=db.transaction('frames'),r=t.objectStore('frames').get('settings');r.onsuccess=()=>resolve((r.result?.custom||[]).filter(x=>!r.result.hidden?.includes(x.id)));r.onerror=()=>reject(r.error);t.oncomplete=()=>db.close();};});}
 function load(src){return new Promise((ok,bad)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>bad(Error('Banner ပုံ ဖတ်မရပါ။'));i.src=src;});}
 async function wrap(canvas,frame){
  if(!frame)return canvas;
  const image=frame.image?await load(frame.image):null;
  const top=frame.topImage?await load(frame.topImage):null,bottom=frame.bottomImage?await load(frame.bottomImage):null;
  const separate=!!(top||bottom),w=canvas.width;
  const topPart=!separate&&image?Math.max(0,Math.min(.4,Number(frame.top||0)/100)):0;
  const bottomPart=!separate&&image?Math.max(0,Math.min(.4,Number(frame.bottom||0)/100)):0;
  const th=Math.round(top?top.height*w/top.width:image?image.height*topPart*w/image.width:0);
  const bh=Math.round(bottom?bottom.height*w/bottom.width:image?image.height*bottomPart*w/image.width:0);
  const out=document.createElement('canvas');out.width=w;out.height=th+canvas.height+bh;const c=out.getContext('2d');
  c.fillStyle=/^#[0-9a-f]{6}$/i.test(frame.color)?frame.color:'#173453';c.fillRect(0,0,w,out.height);
  if(top)c.drawImage(top,0,0,w,th);else if(topPart)c.drawImage(image,0,0,image.width,image.height*topPart,0,0,w,th);
  c.drawImage(canvas,0,th);
  if(bottom)c.drawImage(bottom,0,th+canvas.height,w,bh);else if(bottomPart)c.drawImage(image,0,image.height*(1-bottomPart),image.width,image.height*bottomPart,0,th+canvas.height,w,bh);
  return out;
 }
 window.FutureCodeCustomFrames={list,wrap};
 document.addEventListener("DOMContentLoaded",()=>{const sel=document.getElementById("fcAiFrameStyle");if(sel)list().then(items=>items.forEach(f=>sel.add(new Option(f.name,f.id)))).catch(console.error);},{once:true});
})();

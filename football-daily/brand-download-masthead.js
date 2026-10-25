"use strict";
/* Dedicated PNG masthead for the three independent journal websites only.
   Preserve every pixel of each original preview, odds and results export. */
(function(){
 const kit=window.FutureCodeCanvasKit;
 const cfg=window.FutureCodeBrandConfig||{};
 const themes={
  "kmm-sport-hub":{main:"KMM SPORT HUB",sub:"FOOTBALL · MATCHDAY · INSIGHTS",bg:"#160706",second:"#b90000",accent:"#f3c65a",white:"#fff8e6",symbol:"KMM"},
  "bw-sport":{main:"BW SPORT",sub:"ဘောလုံးဂျာနယ်",bg:"#06152c",second:"#155087",accent:"#58cfff",white:"#f1f9ff",symbol:"BW"},
  "ykz-family":{main:"YKZ FAMILY GROUP",sub:"အတူရှေ့ဆက် YKZ",bg:"#1c0609",second:"#930d17",accent:"#ffcf58",white:"#fff9ee",symbol:"YKZ"},
  "ko-thet-family":{main:"KO THET FAMILY",sub:"ဘောလုံးဂျာနယ်",bg:"#1c090f",second:"#6c1727",accent:"#ffd36e",white:"#fff5e6",symbol:"KTF"}
 };
 const theme=themes[cfg.id];
 if(!kit||!theme)return;
 const nativeDownload=kit.download;
 async function prepare(source){
  if(!source||!source.width||!source.height)return source;
  await kit.fonts();
  const logo=cfg.logoUrl||document.documentElement?.dataset?.footballBrandLogoUrl;
  let image=null;
  if(logo){
   image=await new Promise(resolve=>{
    const img=new Image();let settled=false;
    const timeout=setTimeout(()=>done(null),4000);
    function done(value){if(settled)return;settled=true;clearTimeout(timeout);resolve(value);}
    img.crossOrigin="anonymous";
    img.onload=()=>done(img);img.onerror=()=>done(null);img.src=logo;
   });
  }
  const scale=source.width/1200,header=Math.ceil(190*scale);
  const {canvas,ctx}=kit.create(source.width,source.height+header);
  ctx.drawImage(source,0,header);
  ctx.save();ctx.scale(scale,scale);
  const gradient=ctx.createLinearGradient(0,0,1200,190);
  gradient.addColorStop(0,theme.bg);gradient.addColorStop(.6,theme.second);gradient.addColorStop(1,theme.bg);
  ctx.fillStyle=gradient;ctx.fillRect(0,0,1200,190);
  ctx.fillStyle=theme.accent;ctx.fillRect(0,0,1200,8);ctx.fillRect(0,183,1200,7);
  ctx.save();ctx.globalAlpha=.11;ctx.strokeStyle=theme.white;ctx.lineWidth=24;
  for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(1010+i*67,0);ctx.lineTo(884+i*67,180);ctx.stroke()}
  ctx.restore();
  // Logo tile and high-contrast two-line newspaper masthead.
  ctx.fillStyle=theme.accent;ctx.fillRect(35,23,130,139);
  ctx.fillStyle=theme.bg;ctx.fillRect(42,30,116,125);
  if(image?.naturalWidth&&image?.naturalHeight){
   const s=Math.min(106/image.naturalWidth,115/image.naturalHeight);
   const w=image.naturalWidth*s,h=image.naturalHeight*s;
   ctx.drawImage(image,100-w/2,92.5-h/2,w,h);
  }else{
   ctx.font='900 34px "Barlow Condensed",sans-serif';
   ctx.fillStyle=theme.accent;ctx.textAlign="center";ctx.textBaseline="middle";
   ctx.fillText(theme.symbol,100,94,106);
  }
  ctx.textAlign="left";ctx.textBaseline="middle";ctx.fillStyle=theme.white;
  let size=76;
  do {ctx.font='900 '+size+'px "Barlow Condensed","Noto Sans Myanmar",sans-serif';
   if(ctx.measureText(theme.main).width<=950)break;size-=2;
  }while(size>44);
  ctx.fillText(theme.main,189,76,950);
  ctx.font='800 42px "Noto Sans Myanmar",sans-serif';
  ctx.fillStyle=theme.accent;ctx.fillText(theme.sub,191,139,920);
  ctx.restore();
  return canvas;
 }
 kit.prepareBrandDownload=prepare;
 kit.download=async function(canvas,filename){
  return nativeDownload(await prepare(canvas),filename);
 };
})();

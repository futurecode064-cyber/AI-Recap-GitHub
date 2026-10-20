"use strict";
/* Main-site-only, browser-native individual PNG pages. No ZIP/API/backend.
   Exactly the published fixtures and same prediction model as the visible grid. */
(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.FutureCodeAiBulkExport=api;
})(typeof window!=="undefined"?window:null,function(){
 const MAX_ROWS=18,WIDTH=1280,HEADER=118,LEAGUE_H=85,ROW_H=78,FOOTER=62;
 function planPages(fixtures,selectedLeagues=null){
  if(!Array.isArray(fixtures))return [];
  const allow=selectedLeagues===null?null:new Set(selectedLeagues);
  const groupMap=new Map();
  fixtures.forEach(match=>{
   if(!match||typeof match.home!=="string"||typeof match.away!=="string")return;
   const league=match.league||"Other";
   if(allow&&!allow.has(league))return;
   if(!groupMap.has(league))groupMap.set(league,[]);
   groupMap.get(league).push(match);
  });
  const ordered=[...groupMap].flatMap(([league,items])=>items.map(match=>({league,match})));
  if(!ordered.length)return [];
  const n=ordered.length;
  const pageCount=n<=10?1:Math.max(2,Math.ceil(n/MAX_ROWS));
  const size=Math.floor(n/pageCount),extras=n%pageCount;
  let position=0;
  return Array.from({length:pageCount},(_,i)=>{
   const length=size+(i<extras?1:0);
   const groupRows=ordered.slice(position,position+length);
   position+=length;
   const pageGroups=[];
   for(const {league,match} of groupRows){
    let previous=pageGroups[pageGroups.length-1];
    if(!previous||previous.league!==league){
     previous={league,matches:[]};pageGroups.push(previous);
    }
    previous.matches.push(match);
   }
   return {groups:pageGroups,matchCount:length};
  });
 }
 function dim(page){
  if(!page||!Array.isArray(page.groups)||!page.groups.length)throw Error("No selected fixtures");
  return {width:WIDTH,height:HEADER+FOOTER+page.groups.length*LEAGUE_H+page.matchCount*ROW_H};
 }
 function safeHttps(url){
  try{const a=new URL(url);return a.protocol==="https:"?a.href:null;}catch{return null;}
 }
 function loadImage(url,cache){
  const src=safeHttps(window.FutureCodeMainLogoAssets?.imageUrl(url)||url);
  if(!src)return Promise.resolve(null);
  if(cache.has(src))return cache.get(src);
  const request=new Promise(resolve=>{
   const img=new Image();let done=false;
   const finish=r=>{if(done)return;done=true;clearTimeout(timeout);resolve(r);};
   const timeout=setTimeout(()=>finish(null),3200);
   img.crossOrigin="anonymous";
   img.onload=()=>finish(img);img.onerror=()=>finish(null);img.src=src;
  });
  cache.set(src,request);
  return request;
 }
 function font(ctx,size,weight=800){ctx.font=weight+" "+size+"px 'Noto Sans Myanmar',sans-serif";}
 function fit(ctx,value,width,px=26,min=14){
  const text=String(value||"");
  while(px>min){font(ctx,px);if(ctx.measureText(text).width<=width)return px;px-=1;}
  return min;
 }
 function text(ctx,value,x,y,max,px=24,align="center",fill="#fff"){
  const label=String(value??"");
  ctx.save();ctx.textAlign=align;ctx.fillStyle=fill;
  font(ctx,fit(ctx,label,max,px,15));
  // Ellipsis instead of overlapping score columns for very long Myanmar team names.
  let visible=label;
  while(ctx.measureText(visible).width>max&&visible.length>2)visible=visible.slice(0,-2)+"…";
  ctx.fillText(visible,x,y);ctx.restore();
 }
 function rect(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
 function outline(ctx,x,y,w,h,color){ctx.strokeStyle=color;ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);}
 function imageOrFallback(ctx,img,x,y,w,h,fallback="⚽"){
  if(img){ctx.drawImage(img,x,y,w,h);return;}
  rect(ctx,x,y,w,h,"#fff");text(ctx,fallback,x+w/2,y+h*.68,w-5,24,"center","#1937a9");
 }
 function slug(s){return String(s||"all").normalize("NFKD").replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"").slice(0,35)||"all";}
 async function savePage(page,opts={}){
  if(!page?.matchCount)throw Error("No matches to export");
  const {date,part=1,total=1,scope="all",predict,leagueLabel,leagueLogo,teamName,teamLogo,displayTime}=opts;
  if(typeof predict!=="function")throw Error("Prediction model unavailable");
  const canvas=document.createElement("canvas"),size=dim(page);
  canvas.width=size.width;canvas.height=size.height;
  const ctx=canvas.getContext("2d");if(!ctx)throw Error("Canvas unavailable");
  if(document.fonts?.load)await Promise.race([document.fonts.load('800 23px "Noto Sans Myanmar"').catch(()=>{}),new Promise(resolve=>setTimeout(resolve,2200))]);
  const cache=new Map(),images=[];
  for(const group of page.groups){
   images.push(loadImage(leagueLogo?.(group.league),cache));
   for(const m of group.matches){
    images.push(loadImage(teamLogo?.(m,"home"),cache));
    images.push(loadImage(teamLogo?.(m,"away"),cache));
   }
  }
  await Promise.all(images);
  const pic=url=>cache.get(safeHttps(url));
  const loaded=async url=>pic(url)?await pic(url):null;
  rect(ctx,0,0,WIDTH,size.height,"#06114d");
  rect(ctx,0,0,WIDTH,HEADER,"#081a6d");
  text(ctx,"FUTURE CODE FOOTBALL  ·  AI ခန့်မှန်းချက်များ",20,51,900,34,"left");
  text(ctx,date||"",WIDTH-22,46,215,23,"right","#f8d692");
  text(ctx,"ပွဲ "+page.matchCount+" ပွဲ    ·    PNG "+part+"/"+total,WIDTH-22,93,360,23,"right","#d9e4ff");
  let y=HEADER;
  const borders="#c7d1e4",scoreX=[782,948,1114],scoreW=166;
  for(const group of page.groups){
   const grad=ctx.createLinearGradient(0,y,WIDTH,y);
   grad.addColorStop(0,"#030784");grad.addColorStop(.45,"#183bfa");grad.addColorStop(1,"#090979");
   rect(ctx,0,y,WIDTH,LEAGUE_H,grad);
   rect(ctx,10,y+9,67,66,"#fff");
   imageOrFallback(ctx,await loaded(leagueLogo?.(group.league)),17,y+16,52,52);
   text(ctx,leagueLabel?.(group.league)||group.league,92,y+54,665,26,"left");
   ["AI ခန့်မှန်း ၁","AI ခန့်မှန်း ၂","AI ခန့်မှန်း ၃"].forEach((title,i)=>{
    rect(ctx,scoreX[i]+4,y+11,scoreW-8,62,i===0?"#e7ebf5":"#f8e7a4");
    outline(ctx,scoreX[i]+4,y+11,scoreW-8,62,"#b6b7cb");
    text(ctx,title,scoreX[i]+scoreW/2,y+49,scoreW-17,19,"center","#111a42");
   });
   y+=LEAGUE_H;
   for(const m of group.matches){
    const scores=predict(m);
    if(!Array.isArray(scores)||scores.length!==3||scores.some(s=>!/^\d+-\d+$/.test(s)))throw Error("Invalid AI scoreline");
    rect(ctx,0,y,WIDTH,ROW_H,"#f7f8fc");
    rect(ctx,0,y,112,ROW_H,"#f0f2f8");
    text(ctx,displayTime?.(m)||"—",56,y+47,106,20,"center","#152457");
    text(ctx,teamName?.(m,"home")||m.home,352,y+46,219,21,"right","#141b36");
    imageOrFallback(ctx,await loaded(teamLogo?.(m,"home")),366,y+16,43,43);
    text(ctx,"နှင့်",458,y+46,69,15,"center","#65708c");
    imageOrFallback(ctx,await loaded(teamLogo?.(m,"away")),502,y+16,43,43);
    text(ctx,teamName?.(m,"away")||m.away,558,y+46,208,21,"left","#141b36");
    for(let i=0;i<3;i++){
     rect(ctx,scoreX[i],y,scoreW,ROW_H,i===0?"#e9edf7":"#fff1b4");
     font(ctx,31,900);ctx.fillStyle="#151d36";ctx.textAlign="center";
     ctx.fillText(scores[i],scoreX[i]+scoreW/2,y+50);
    }
    ctx.strokeStyle=borders;ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(0,y+ROW_H-.5);ctx.lineTo(WIDTH,y+ROW_H-.5);ctx.stroke();
    y+=ROW_H;
   }
  }
  rect(ctx,0,size.height-FOOTER,WIDTH,FOOTER,"#09166c");
  text(ctx,"FUTURE CODE  •  MYANMAR FOOTBALL DAILY",20,size.height-23,670,19,"left","#e1ebff");
  text(ctx,scope==="all"?"ALL LEAGUES":String(scope),WIDTH-20,size.height-23,460,19,"right","#eedca6");
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
  if(!blob)throw Error("PNG generation failed");
  const url=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=url;link.download="future-code-ai-"+(date||"today")+"-"+slug(scope)+"-"+part+"-of-"+total+".png";
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
  return link.download;
 }
 return Object.freeze({MAX_ROWS,planPages,dim,savePage});
});

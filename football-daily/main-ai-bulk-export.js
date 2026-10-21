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
 // No pagination: every selected league and every published match stays on ONE PNG.
 function planSinglePage(fixtures,selectedLeagues=null){
  if(!Array.isArray(fixtures))return null;
  const allow=selectedLeagues===null?null:new Set(selectedLeagues);
  const groups=new Map();
  for(const match of fixtures){
   if(!match||typeof match.home!=="string"||typeof match.away!=="string")continue;
   const league=match.league||"Other";
   if(allow&&!allow.has(league))continue;
   if(!groups.has(league))groups.set(league,[]);
   groups.get(league).push(match);
  }
  if(!groups.size)return null;
  return {groups:[...groups].map(([league,matches])=>({league,matches})),
          matchCount:[...groups.values()].reduce((n,matches)=>n+matches.length,0)};
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
 // EXACT user-uploaded originals verified against SHA-256 at import time.
 // NEVER substitute other odds frame assets for these three AI poster frames.
 const AI_FRAMES=Object.freeze({
  best:{asset:"best-your-choice-upload.png",top:220,bottom:240,stretchY:1480,
        left:28,right:28,contentTop:238,contentBottom:185,panel:"#0b1871"},
  final:{asset:"final-goal-upload.png",top:248,bottom:105,stretchY:710,
         left:35,right:35,contentTop:262,contentBottom:105,panel:"#704703"},
  special:{asset:"special-one-upload.png",top:217,bottom:195,stretchY:1040,
           left:140,right:215,contentTop:237,contentBottom:214,panel:"#074970"}
 });
 function drawOriginalArtwork(ctx,img,height,frame){
  const w=1200,originalHeight=img.naturalHeight||img.height;
  if(height<=originalHeight){
   ctx.drawImage(img,0,0,w,originalHeight);
   return;
  }
  // Lengthen ONLY a quiet middle strip when many fixtures need more space.
  // The user's own header, watermark/logo and footer stay at original scale.
  const y=frame.stretchY,extra=height-originalHeight;
  ctx.drawImage(img,0,0,img.width,y,0,0,w,y);
  ctx.drawImage(img,0,y,img.width,1,0,y,w,extra);
  ctx.drawImage(img,0,y,img.width,originalHeight-y,0,y+extra,w,originalHeight-y);
 }
 async function brandCanvas(source,id,opts={}){
  const frame=AI_FRAMES[id];
  if(!frame)return source; // no frame means ordinary original table
  const url=new URL("./assets/ai-frames/"+frame.asset,document.baseURI).href;
  const original=await loadImage(url,new Map());
  if(!original)throw Error("မူရင်း Frame ပုံမရပါ — "+frame.asset);
  const targetW=1200,insideW=targetW-frame.left-frame.right;
  // Brand header/footer in the uploaded poster replace our generic header/footer.
  const tableTop=HEADER,tableSourceH=source.height-HEADER-FOOTER;
  const tableH=Math.ceil(tableSourceH*insideW/WIDTH),stripH=62;
  const panelH=tableH+stripH;
  const height=Math.max(original.naturalHeight||original.height,
                        frame.contentTop+panelH+frame.contentBottom);
  const out=document.createElement("canvas");
  out.width=targetW;out.height=height;
  const ctx=out.getContext("2d");if(!ctx)throw Error("Frame canvas unavailable");
  drawOriginalArtwork(ctx,original,height,frame);
  const x=frame.left,y=frame.contentTop;
  ctx.save();
  ctx.fillStyle=frame.panel;ctx.globalAlpha=.92;
  ctx.fillRect(x-5,y-5,insideW+10,panelH+10);
  ctx.restore();
  ctx.fillStyle=frame.panel;ctx.fillRect(x,y,insideW,stripH);
  ctx.textAlign="left";ctx.fillStyle="#ffffff";
  font(ctx,23,800);
  ctx.fillText("AI ခန့်မှန်းချက်များ · "+(opts.matchCount||"")+" ပွဲ",x+14,y+42);
  ctx.textAlign="right";font(ctx,19,700);
  ctx.fillText(String(opts.date||""),x+insideW-14,y+42);
  ctx.drawImage(source,0,tableTop,WIDTH,tableSourceH,
                x,y+stripH,insideW,tableH);
  return out;
 }
  const AI_COLOURS={
    standard:{base:"#06114d",header:"#081a6d",league:["#030784","#183bfa","#090979"],footer:"#09166c"},
    best:{base:"#051597",header:"#0815b0",league:["#0715b5","#1f45ff","#0715b5"],footer:"#0615a5"},
    final:{base:"#503000",header:"#755007",league:["#533200","#b88a17","#5e3600"],footer:"#644000"},
    special:{base:"#083955",header:"#0b567c",league:["#084766","#2b9aca","#074c73"],footer:"#0d5379"}
  };
  const AI_BRAND={best:"BEST YOUR CHOICE",final:"FINAL GOAL",special:"SPECIAL ONE GROUP"};
  const FRAME_IDS=Object.freeze(["standard","best","final","special"]);
  async function renderBlob(page,opts={}){
  if(!page?.matchCount)throw Error("No matches to export");
  const {date,part=1,total=1,scope="all",predict,leagueLabel,leagueLogo,teamName,teamLogo,displayTime}=opts;
   const theme=AI_COLOURS[opts.frame]||AI_COLOURS.standard;
  if(typeof predict!=="function")throw Error("Prediction model unavailable");
  let canvas=document.createElement("canvas");const size=dim(page);
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
  const pic=url=>cache.get(safeHttps(window.FutureCodeMainLogoAssets?.imageUrl(url)||url));
  const loaded=async url=>pic(url)?await pic(url):null;
  rect(ctx,0,0,WIDTH,size.height,theme.base);
  rect(ctx,0,0,WIDTH,HEADER,theme.header);
  text(ctx,(AI_BRAND[opts.frame]||"FUTURE CODE FOOTBALL")+"  ·  AI ခန့်မှန်းချက်များ",20,51,900,34,"left");
  text(ctx,date||"",WIDTH-22,46,215,23,"right","#f8d692");
  text(ctx,"ပွဲ "+page.matchCount+" ပွဲ    ·    PNG "+part+"/"+total,WIDTH-22,93,360,23,"right","#d9e4ff");
  let y=HEADER;
  const borders="#c7d1e4",scoreX=[782,948,1114],scoreW=166;
  for(const group of page.groups){
   const grad=ctx.createLinearGradient(0,y,WIDTH,y);
   grad.addColorStop(0,theme.league[0]);grad.addColorStop(.45,theme.league[1]);grad.addColorStop(1,theme.league[2]);
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
  rect(ctx,0,size.height-FOOTER,WIDTH,FOOTER,theme.footer);
  text(ctx,AI_BRAND[opts.frame]||"FUTURE CODE  •  MYANMAR FOOTBALL DAILY",20,size.height-23,670,19,"left","#e1ebff");
  text(ctx,scope==="all"?"ALL LEAGUES":String(scope),WIDTH-20,size.height-23,460,19,"right","#eedca6");
  canvas=await brandCanvas(canvas,opts.frame,{date,matchCount:page.matchCount});
   // Keep the complete long poster as one image. Never silently drop fixtures.
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
   if(!blob)throw Error("PNG generation failed");
   return blob;
  }
  function downloadBlob(blob,filename){
    const url=URL.createObjectURL(blob),link=document.createElement("a");
    link.href=url;link.download=filename;
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
    return filename;
  }
  async function savePage(page,opts={}){
    const blob=await renderBlob(page,opts);
    const {date="today",scope="all",part=1,total=1,frame="standard"}=opts;
    const suffix=frame!=="standard"?slug(frame)+"-":"";
    return downloadBlob(blob,"future-code-ai-"+date+"-"+slug(scope)+"-"+suffix+part+"-of-"+total+".png");
  }
  return Object.freeze({MAX_ROWS,FRAME_IDS,planPages,planSinglePage,dim,renderBlob,downloadBlob,savePage});
});

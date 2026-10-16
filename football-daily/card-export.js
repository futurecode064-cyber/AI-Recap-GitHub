"use strict";
(function(){
 function stripScorePrediction(value){return String(value||"").replace(/\s*(?:ဖြစ်နိုင်တဲ့|ဖြစ်နိုင်သည့်|ခန့်မှန်း)\s*ဂိုးရလဒ်[^။\n]*[။]?/gu,"").trim();}
 // A complete, responsive-height Canvas PNG that mirrors the user-approved on-screen
 // hero → Myanmar prices → Home WDL | 1X2 | Away WDL → full Burmese preview.
 const MM={"Premier League":"အင်္ဂလန် ပရီးမီးယားလိဂ်","Championship":"ချန်ပီယံရှစ်","La Liga":"လာလီဂါ","La Liga 2":"စပိန် လာလီဂါ ၂","Serie A":"အီတလီ စီးရီးအေ","Serie B":"အီတလီ စီးရီးဘီ","Bundesliga":"ဘွန်ဒက်စ်လီဂါ","Ligue 1":"လီဂူးဝမ်း","Ligue 2":"ပြင်သစ် လိဂ် ၂","UEFA Champions League":"ချန်ပီယံလိဂ်"};
 function present(v){return v!==undefined&&v!==null&&String(v).trim()?String(v):"—";}
 function filePart(v){return String(v||"football").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,60)||"football";}
 function wdl(g){if(!g||!Number.isInteger(g.teamGoals)||!Number.isInteger(g.opponentGoals))return "–";return g.teamGoals>g.opponentGoals?"W":g.teamGoals<g.opponentGoals?"L":"D";}
 function paragraphLines(ctx,paragraph,maxWidth,size){
  const chunks=String(paragraph||"ပွဲကြိုသုံးသပ်ချက်များ မရသေးပါ").split(/(\*\*[^*\n]+\*\*)/g);
  const lines=[[]];let width=0;
  for(const chunk of chunks){
   const bold=chunk.startsWith("**")&&chunk.endsWith("**");
   const words=(bold?chunk.slice(2,-2):chunk).split(/(\s+)/);
   for(const word of words){
    if(!word)continue;
    if(word.includes("\n")){
     const bits=word.split("\n");
     for(let i=0;i<bits.length;i++){
      if(i){lines.push([]);width=0}
      if(bits[i]){ctx.font=(bold?800:500)+" "+size+'px "Noto Sans Myanmar",sans-serif';const w=ctx.measureText(bits[i]).width;lines[lines.length-1].push({str:bits[i],bold});width+=w}
     }
     continue;
    }
    ctx.font=(bold?800:500)+" "+size+'px "Noto Sans Myanmar",sans-serif';
    const w=ctx.measureText(word).width;
    if(width+w>maxWidth&&width>0&&word.trim()){lines.push([]);width=0}
    if(width===0&&!word.trim())continue;
    const line=lines[lines.length-1];
    const previous=line[line.length-1];
    if(previous&&previous.bold===bold)previous.str+=word;
    else line.push({str:word,bold});
    width+=w;
   }
  }
  return lines;
 }
 function drawParagraph(ctx,k,lines,x,y,px,lineGap){
  for(const row of lines){
   let cursor=x;
   for(const run of row){
    const val=run.str;
    k.text(ctx,val,cursor,y,px,run.bold?k.C.orange:k.C.white,run.bold);
    ctx.font=(run.bold?800:500)+" "+px+'px "Noto Sans Myanmar",sans-serif';
    cursor+=ctx.measureText(val).width;
   }
   y+=lineGap;
  }
  return y;
 }
 function centerBadge(ctx,k,x,y,letter,size=38){
  const color=letter==="W"?"#1f9c5d":letter==="D"?"#2588d3":letter==="L"?"#d94950":"#536363";
  k.fill(ctx,x,y,size,size,color,size/2);
  k.text(ctx,letter,x+size/2,y+size/2,16,"#ffffff",true,"center");
 }
 async function save(match,opts={}){
  if(!match||!match.home||!match.away)throw Error("Missing team identities");
  const k=window.FutureCodeCanvasKit;
  if(!k)throw Error("Canvas exporter is unavailable");
  const {C,create,fill:paintFill,line:paintLine,text:paintText,fit,fonts,preloadImages,crest:paintCrest,download}=k;
  // Main-page single-match PNG: ALL card/page backdrops are transparent.
  // The original branded-site and batch Canvas rendering is unchanged.
  const transparent=opts.mainScreenshot===true;
  const fill=transparent?()=>{}:paintFill;
  const line=transparent?()=>{}:paintLine;
  const crest=transparent
    ?(ctx,url,x,y,size,label)=>paintCrest(ctx,url,x,y,size,label,true)
    :paintCrest;
  const text=transparent
    ?(ctx,value,x,y,px=21,color=C.pale,bold=false,align="left",max)=>{
      // A glyph outline (not a rectangular panel) keeps text visible on
      // both light and dark photos behind a transparent PNG.
      if(typeof ctx.strokeText==="function"){
        ctx.save();
        ctx.font=(bold?800:500)+" "+px+'px "Noto Sans Myanmar",sans-serif';
        ctx.textAlign=align;ctx.textBaseline="middle";
        ctx.strokeStyle="rgba(0,0,0,0.95)";
        ctx.lineWidth=Math.max(2.3,px*.14);
        ctx.lineJoin="round";
        if(max)ctx.strokeText(String(value??""),x,y,max);
        else ctx.strokeText(String(value??""),x,y);
        ctx.restore();
      }
      return paintText(ctx,value,x,y,px,color,bold,align,max);
    }
    :paintText;
  const textKit=transparent?{...k,text}:k;
  await fonts();
  const W=1200,M=24,fullWidth=W-2*M;
  const home=String(match.home||""),away=String(match.away||"");
  // Special Choice exports contain ONLY specialAnalysisParagraphs; no duplicate normal preview.
  const specialOnly=opts.special===true;
  const preview=stripScorePrediction(match.dailyPreviewText||"ပွဲကြိုသုံးသပ်ချက်များ မရသေးပါ");
  const extra=specialOnly&&Array.isArray(match.specialAnalysisParagraphs)
   ?match.specialAnalysisParagraphs.filter(p=>typeof p==="string"&&p.trim()).map(stripScorePrediction):[];
  const measure=create(1200,120).ctx;
  const lines=specialOnly?[]:paragraphLines(measure,preview,fullWidth-54,25);
  const extraBlocks=specialOnly
   ?(extra.length?extra:["ပွဲကြိုသုံးသပ်ချက်များ မရသေးပါ"]).map(p=>paragraphLines(measure,p,fullWidth-54,23))
   :[];
  const anaY=925;
  const paragraphHeight=specialOnly
   ?extraBlocks.reduce((n,block)=>n+block.length*43+18,0)
   :lines.length*49;
  const H=Math.ceil(anaY+Math.max(210,paragraphHeight+116)+80);
  const {canvas,ctx}=create(W,H);
  const isYKZ=document.documentElement?.dataset?.footballBrandName==="YKZ FAMILY GROUP";
  const isBW=document.documentElement?.dataset?.footballBrandName==="BW SPORT ဘောလုံးဂျာနယ်";
  const isKTF=document.documentElement?.dataset?.footballBrandName==="Ko Thet Family ဘောလုံးဂျာနယ်";
  const my=match.myanmarOdds||{};
  await preloadImages([match.homeCrestUrl,match.awayCrestUrl,opts.brandLogoUrl].filter(Boolean));
  // A blank Canvas is transparent by default; omit ALL card/background fills.
  if(!transparent)fill(ctx,0,0,W,H,C.bg);
  fill(ctx,M,14,fullWidth,H-34,C.head,12);
  fill(ctx,M,14,fullWidth,66,C.bg,10);
  if(!opts.hideLeagueLabel)text(ctx,opts.leagueLabel||MM[match.league]||match.league||"FOOTBALL",M+16,46,22,C.orange,true);
  if(isYKZ){
   text(ctx,"YKZ FAMILY GROUP · အတူရှေ့ဆက် YKZ",W/2,44,17,C.orange,true,"center");
   crest(ctx,opts.brandLogoUrl||document.documentElement?.dataset?.footballBrandLogoUrl,W-107,20,48,"YKZ");
  }else if(isBW){
   text(ctx,"BW SPORT ဘောလုံးဂျာနယ်",W/2,44,18,C.orange,true,"center");
   crest(ctx,opts.brandLogoUrl||document.documentElement?.dataset?.footballBrandLogoUrl,W-107,20,48,"BW");
  }else if(isKTF){
   text(ctx,"KO THET FAMILY",W/2,44,19,C.orange,true,"center");
   crest(ctx,opts.brandLogoUrl||document.documentElement?.dataset?.footballBrandLogoUrl,W-107,20,48,"KTF");
  }
  const heroY=86,heroH=387,sideW=450,middleW=252;
  const lx=M,rx=W-M-sideW;
  // Only genuine football club logos, centered in each team's half.
  fill(ctx,lx,heroY,sideW,heroH,isYKZ?"#321317":isBW?"#12386d":isKTF?"#4e121b":"#26343b");
  fill(ctx,rx,heroY,sideW,heroH,isYKZ?"#2b2118":isBW?"#082744":isKTF?"#422125":"#193c37");
  const light=ctx.createLinearGradient(W/2-145,heroY,W/2+145,heroY+heroH);
  light.addColorStop(0,isYKZ?"#21080c":isBW?"#062041":isKTF?"#270609":"#092333");
  light.addColorStop(.5,isYKZ?"#401616":isBW?"#146ab3":isKTF?"#89212a":"#1b344f");
  light.addColorStop(1,isYKZ?"#1a0b0b":isBW?"#09172f":isKTF?"#240a0e":"#051521");
  fill(ctx,lx+sideW,heroY,middleW,heroH,light);
  const badgeSize=178;
  const crestY=heroY+(heroH-badgeSize)/2;
  crest(ctx,match.homeCrestUrl,lx+(sideW-badgeSize)/2,crestY,badgeSize,home);
  crest(ctx,match.awayCrestUrl,rx+(sideW-badgeSize)/2,crestY,badgeSize,away);
  text(ctx,"◈",W/2,heroY+75,62,C.white,true,"center");
  if(!opts.hideLeagueLabel)text(ctx,opts.leagueLabel||MM[match.league]||"FOOTBALL",W/2,heroY+148,fit(ctx,opts.leagueLabel||MM[match.league]||"FOOTBALL",220,23,14),C.pale,true,"center",220);
  text(ctx,"VS",W/2,heroY+244,90,C.white,true,"center");
  const infoY=473,infoH=83,infoMiddle=460,outer=(fullWidth-infoMiddle)/2;
  fill(ctx,M,infoY,outer,infoH,isYKZ?"#250707":isBW?"#082347":isKTF?"#3b1017":"#14090d");
  fill(ctx,M+outer,infoY,infoMiddle,infoH,isYKZ?"#8f0000":isBW?"#096ed5":isKTF?"#900b18":"#83141b");
  fill(ctx,M+outer+infoMiddle,infoY,outer,infoH,isYKZ?"#250707":isBW?"#082347":"#14090d");
  // Only the full fixture is printed: no duplicate standalone club names or time.
  text(ctx,home+" နှင့် "+away,W/2,infoY+39,fit(ctx,home+" နှင့် "+away,infoMiddle-24,27,15),C.white,true,"center",infoMiddle-24);
  const marketY=570;
  fill(ctx,M,marketY,fullWidth,90,C.panel);
  text(ctx,"မြန်မာကြေး",M+18,marketY+28,22,C.orange,true);
  const upper=present(my.upperTeam);
  const body=present(my.bodyOdds);
  text(ctx,"အပေါ်အသင်း: "+upper,M+198,marketY+28,20,C.white,true,"left",470);
  text(ctx,"ဘော်ဒီကြေး: "+body,M+18,marketY+64,20,C.white,true,"left",500);
  text(ctx,"ဂိုးပေါင်းကြေး: "+present(my.goalTotalOdds),M+600,marketY+64,20,C.white,true,"left",450);
  const rowY=676,rowH=225,side=(fullWidth-15)/3;
  const x1=M,x2=x1+side+7.5,x3=x2+side+7.5;
  for(const x of [x1,x2,x3])fill(ctx,x,rowY,side,rowH,C.panelAlt,11);
  const five=(x,sideName,club,logo,items)=>{
   crest(ctx,logo,x+18,rowY+12,50,club);
   text(ctx,sideName,x+78,rowY+31,18,C.orange,true);
   text(ctx,club,x+16,rowY+94,fit(ctx,club,side-30,21,14),C.white,true,"left",side-30);
   const games=Array.isArray(items)?items.slice(0,5):[];
   for(let i=0;i<5;i++){
    const letter=games[i]?wdl(games[i]):"–";
    centerBadge(ctx,k,x+14+i*70,rowY+130,letter,45);
   }
   text(ctx,"W = နိုင်  •  D = သရေ  •  L = ရှုံး",x+14,rowY+205,14,C.muted,false,"left",side-24);
  };
  five(x1,"အိမ်ရှင် နောက်ဆုံး ၅ ပွဲ",home,match.homeCrestUrl,match.homeLastFive);
  five(x3,"ဧည့်သည် နောက်ဆုံး ၅ ပွဲ",away,match.awayCrestUrl,match.awayLastFive);
  text(ctx,"ပွဲပြီး 1X2 ကြေး",x2+side/2,rowY+39,21,C.orange,true,"center");
  const odds=[["အိမ်ရှင် (1)",match.homeOdds],["သရေ (X)",match.drawOdds],["ဧည့်သည် (2)",match.awayOdds]];
  for(let i=0;i<3;i++){
   const x=x2+i*side/3;
   fill(ctx,x+3,rowY+86,side/3-6,101,C.panel,6);
   text(ctx,odds[i][0],x+side/6,rowY+119,15,C.muted,true,"center",side/3-8);
   text(ctx,present(odds[i][1]),x+side/6,rowY+166,24,C.white,true,"center",side/3-8);
  }
  // Reserve full height from the article actually visible in its selected tab.
  fill(ctx,M,anaY,fullWidth,H-anaY-64,C.panel,10);
  text(ctx,specialOnly?"★ SPECIAL CHOICE — အထူးပွဲကြိုသုံးသပ်ချက်":"ပွဲကြိုသုံးသပ်ချက်",M+23,anaY+45,26,C.orange,true);
  let y=anaY+99;
  if(specialOnly){
   // Do not print the standard dailyPreviewText or a second article heading.
   for(const block of extraBlocks){
    y=drawParagraph(ctx,textKit,block,M+25,y,23,43);
    y+=18;
   }
  }else{
   y=drawParagraph(ctx,textKit,lines,M+25,y,25,49);
  }
  if(!opts.hideFooterBrand){
   line(ctx,M,H-55,fullWidth);
   text(ctx,opts.brandName||"FUTURE CODE FOOTBALL",M+10,H-31,20,C.orange,true);
  }
  const filename=opts.mainScreenshot===true&&typeof opts.downloadFilename==="string"
   ?opts.downloadFilename
   :filePart(opts.brandName||"future-code")+"-"+filePart(home)+"-vs-"+filePart(away)+".png";
  if(opts.asBlob===true){
   if(typeof canvas.toBlob!=="function")throw Error("Browser cannot create PNG");
   const blob=await Promise.race([
    new Promise((resolve,reject)=>{try{canvas.toBlob(b=>b&&b.size?resolve(b):reject(Error("PNG encoding failed")),"image/png")}catch(e){reject(e)}}),
    new Promise((_,reject)=>setTimeout(()=>reject(Error("PNG encoding timed out")),12000))
   ]);
   return {filename,blob};
  }
  await download(canvas,filename);
 }
 // Standards-compliant store-only ZIP: one browser download contains ALL full PNGs.
 // No multi-download permission prompts, CDN, external dependency, or PNG resizing.
 function crc32(bytes){
  let c=0xffffffff;
  for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}
  return (c^0xffffffff)>>>0;
 }
 async function bundleZip(files){
  if(!files.length||files.length>65535)throw Error("Invalid PNG count");
  const encoder=new TextEncoder(),parts=[],directory=[];
  let offset=0;
  const w16=(view,at,n)=>view.setUint16(at,n,true);
  const w32=(view,at,n)=>view.setUint32(at,n>>>0,true);
  for(const file of files){
   const name=encoder.encode(file.filename),bytes=new Uint8Array(await file.blob.arrayBuffer());
   if(!name.length||name.length>65535||bytes.length>0xffffffff)throw Error("ZIP entry too large");
   const crc=crc32(bytes),local=new Uint8Array(30),v=new DataView(local.buffer);
   w32(v,0,0x04034b50);w16(v,4,20);w16(v,6,0x0800);w16(v,8,0);
   w16(v,10,0);w16(v,12,0x0021);w32(v,14,crc);w32(v,18,bytes.length);
   w32(v,22,bytes.length);w16(v,26,name.length);w16(v,28,0);
   parts.push(local,name,bytes);
   const central=new Uint8Array(46),cv=new DataView(central.buffer);
   w32(cv,0,0x02014b50);w16(cv,4,20);w16(cv,6,20);w16(cv,8,0x0800);
   w16(cv,10,0);w16(cv,12,0);w16(cv,14,0x0021);
   w32(cv,16,crc);w32(cv,20,bytes.length);w32(cv,24,bytes.length);
   w16(cv,28,name.length);w16(cv,30,0);w16(cv,32,0);w16(cv,34,0);
   w16(cv,36,0);w32(cv,38,0);w32(cv,42,offset);
   directory.push(central,name);
   offset+=local.length+name.length+bytes.length;
   if(offset>0xffffffff)throw Error("ZIP exceeds browser limit");
  }
  const centralSize=directory.reduce((n,p)=>n+p.length,0);
  const end=new Uint8Array(22),ev=new DataView(end.buffer);
  w32(ev,0,0x06054b50);w16(ev,4,0);w16(ev,6,0);
  w16(ev,8,files.length);w16(ev,10,files.length);
  w32(ev,12,centralSize);w32(ev,16,offset);w16(ev,20,0);
  return new Blob([...parts,...directory,end],{type:"application/zip"});
 }
 // Pair two complete transparent cards without shortening text or scaling it.
 // Decode native PNG blobs locally; no CDN, JSZip or DOM screenshot dependency.
 async function decodePng(blob){
  if(typeof createImageBitmap==="function")return createImageBitmap(blob);
  const url=URL.createObjectURL(blob);
  try{
   return await new Promise((resolve,reject)=>{
    const img=new Image();let finished=false;
    const timer=setTimeout(()=>{if(!finished){finished=true;reject(Error("PNG decode timed out"))}},12000);
    img.onload=()=>{if(!finished){finished=true;clearTimeout(timer);resolve(img)}};
    img.onerror=()=>{if(!finished){finished=true;clearTimeout(timer);reject(Error("PNG decode failed"))}};
    img.src=url;
   });
  }finally{setTimeout(()=>URL.revokeObjectURL(url),2000)}
 }
 async function composePair(left,right){
  const images=await Promise.all([decodePng(left.blob),...(right?[decodePng(right.blob)]:[])]);
  try{
   const gap=right?36:0;
   const width=images.reduce((sum,img)=>sum+img.width,0)+gap;
   const height=Math.max(...images.map(img=>img.height));
   if(width>8000||height>30000)throw Error("Paired image dimensions exceed browser limits");
   const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;
   const ctx=canvas.getContext("2d");if(!ctx)throw Error("Canvas unavailable");
   // No background painting: preserve alpha in the gap and beside shorter card.
   ctx.drawImage(images[0],0,0);
   if(images[1])ctx.drawImage(images[1],images[0].width+gap,0);
   const blob=await Promise.race([
    new Promise((resolve,reject)=>canvas.toBlob(b=>b&&b.size?resolve(b):reject(Error("PNG encoding failed")),"image/png")),
    new Promise((_,reject)=>setTimeout(()=>reject(Error("Paired PNG encoding timed out")),15000))
   ]);
   return blob;
  }finally{for(const image of images)if(typeof image.close==="function")image.close()}
 }
 async function saveAll(matches,opts={},onProgress){
  if(!Array.isArray(matches)||!matches.length)throw Error("No previews to download");
  const files=[];
  if(opts.pairMode===true){
   for(let i=0;i<matches.length;i+=2){
    const first=matches[i],second=matches[i+1]||null;
    const render=match=>save({...match,home:match.homeDisplay||match.home,away:match.awayDisplay||match.away},{
     ...opts,special:false,asBlob:true,mainScreenshot:true,
     hideLeagueLabel:true,hideFooterBrand:true
    });
    const left=await render(first);
    const right=second?await render(second):null;
    const blob=await composePair(left,right);
    files.push({filename:"preview-pair-"+String(i/2+1).padStart(2,"0")+".png",blob});
    if(typeof onProgress==="function")onProgress(Math.min(i+2,matches.length),matches.length);
   }
  }else{
   for(const [index,match] of matches.entries()){
    const {blob}=await save({...match,home:match.homeDisplay||match.home,away:match.awayDisplay||match.away},{
     ...opts,special:false,asBlob:true,
     leagueLabel:typeof opts.leagueName==="function"?opts.leagueName(match.league):match.league
    });
    files.push({filename:String(index+1).padStart(2,"0")+"-"+filePart(match.home)+"-vs-"+filePart(match.away)+".png",blob});
    if(typeof onProgress==="function")onProgress(index+1,matches.length);
   }
  }
  const zip=await bundleZip(files),url=URL.createObjectURL(zip),link=document.createElement("a");
  link.href=url;link.download=filePart(opts.brandName||"future-code")+"-all-previews-"+String(opts.date||"today")+".zip";
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
  return files.length;
 }
 window.FutureCodeCardExport={save,saveAll};
})();

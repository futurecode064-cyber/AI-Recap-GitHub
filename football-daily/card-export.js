"use strict";
(function(){
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
  const {C,create,fill,line,text,fit,fonts,preloadImages,crest,download}=k;
  await fonts();
  const W=1200,M=24,fullWidth=W-2*M;
  const home=String(match.home||""),away=String(match.away||"");
  const preview=String(match.dailyPreviewText||"ပွဲကြိုသုံးသပ်ချက်များ မရသေးပါ");
  const extra=opts.special&&Array.isArray(match.specialAnalysisParagraphs)?match.specialAnalysisParagraphs.filter(Boolean):[];
  const measure=create(1200,120).ctx;
  const lines=paragraphLines(measure,preview,fullWidth-54,25);
  const extraLines=extra.flatMap(p=>paragraphLines(measure,p,fullWidth-54,23));
  const anaY=925,mainHeight=Math.max(210,lines.length*49+92);
  const extraHeight=extra.length?80+extraLines.length*43:0;
  const H=Math.ceil(anaY+mainHeight+extraHeight+80);
  const {canvas,ctx}=create(W,H);
  const isYKZ=document.documentElement?.dataset?.footballBrandName==="YKZ FAMILY GROUP";
  const my=match.myanmarOdds||{};
  await preloadImages([match.homeCrestUrl,match.awayCrestUrl,opts.brandLogoUrl].filter(Boolean));
  fill(ctx,0,0,W,H,C.bg);
  fill(ctx,M,14,fullWidth,H-34,C.head,12);
  fill(ctx,M,14,fullWidth,66,C.bg,10);
  text(ctx,opts.leagueLabel||MM[match.league]||match.league||"FOOTBALL",M+16,46,22,C.orange,true);
  if(isYKZ){
   text(ctx,"YKZ FAMILY GROUP · အတူရှေ့ဆက် YKZ",W/2,44,17,C.orange,true,"center");
   crest(ctx,opts.brandLogoUrl||document.documentElement?.dataset?.footballBrandLogoUrl,W-107,20,48,"YKZ");
  }
  const heroY=86,heroH=387,sideW=450,middleW=252;
  const lx=M,rx=W-M-sideW;
  // Only genuine football club logos, centered in each team's half.
  fill(ctx,lx,heroY,sideW,heroH,isYKZ?"#321317":"#26343b");
  fill(ctx,rx,heroY,sideW,heroH,isYKZ?"#2b2118":"#193c37");
  const light=ctx.createLinearGradient(W/2-145,heroY,W/2+145,heroY+heroH);
  light.addColorStop(0,isYKZ?"#21080c":"#092333");
  light.addColorStop(.5,isYKZ?"#401616":"#1b344f");
  light.addColorStop(1,isYKZ?"#1a0b0b":"#051521");
  fill(ctx,lx+sideW,heroY,middleW,heroH,light);
  const badgeSize=178;
  const crestY=heroY+(heroH-badgeSize)/2;
  crest(ctx,match.homeCrestUrl,lx+(sideW-badgeSize)/2,crestY,badgeSize,home);
  crest(ctx,match.awayCrestUrl,rx+(sideW-badgeSize)/2,crestY,badgeSize,away);
  text(ctx,"◈",W/2,heroY+75,62,C.white,true,"center");
  text(ctx,opts.leagueLabel||MM[match.league]||"FOOTBALL",W/2,heroY+148,fit(ctx,opts.leagueLabel||MM[match.league]||"FOOTBALL",220,23,14),C.pale,true,"center",220);
  text(ctx,"VS",W/2,heroY+244,90,C.white,true,"center");
  const infoY=473,infoH=83,outer=(fullWidth-middleW)/2;
  fill(ctx,M,infoY,outer,infoH,isYKZ?"#250707":"#14090d");
  fill(ctx,M+outer,infoY,middleW,infoH,isYKZ?"#8f0000":"#83141b");
  fill(ctx,M+outer+middleW,infoY,outer,infoH,isYKZ?"#250707":"#14090d");
  text(ctx,home,M+outer/2,infoY+39,fit(ctx,home,outer-24,25,16),C.orange,true,"center",outer-24);
  text(ctx,home+" နှင့် "+away,W/2,infoY+39,fit(ctx,home+" နှင့် "+away,middleW-12,20,12),C.white,true,"center",middleW-12);
  text(ctx,away,M+outer+middleW+outer/2,infoY+39,fit(ctx,away,outer-24,25,16),C.orange,true,"center",outer-24);
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
  // Complete, never-clipped commentary: reserve height from measured wrapped lines.
  fill(ctx,M,anaY,fullWidth,H-anaY-64,C.panel,10);
  text(ctx,"ပွဲကြိုသုံးသပ်ချက်",M+23,anaY+45,26,C.orange,true);
  let y=anaY+99;
  y=drawParagraph(ctx,k,lines,M+25,y,25,49);
  if(extra.length){
   y+=22;text(ctx,"★ SPECIAL CHOICE — အသေးစိတ်သုံးသပ်ချက်",M+23,y,23,C.orange,true);
   y+=43;drawParagraph(ctx,k,extraLines,M+25,y,23,43);
  }
  line(ctx,M,H-55,fullWidth);
  text(ctx,opts.brandName||"FUTURE CODE FOOTBALL",M+10,H-31,20,C.orange,true);
  await download(canvas,filePart(opts.brandName||"future-code")+"-"+filePart(home)+"-vs-"+filePart(away)+".png");
 }
 window.FutureCodeCardExport={save};
})();

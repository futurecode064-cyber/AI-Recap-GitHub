"use strict";
(function(){
 const MM={"Premier League":"အင်္ဂလန် ပရီးမီးယားလိဂ်","La Liga":"စပိန် လာလီဂါ","La Liga 2":"စပိန် လာလီဂါ ၂","Serie A":"အီတလီ စီးရီးအေ","Serie B":"အီတလီ စီးရီးဘီ","Bundesliga":"ဂျာမနီ ဘွန်ဒက်စ်လီဂါ","Ligue 2":"ပြင်သစ် လိဂ် ၂"};
 const mmNames={"Real Oviedo":"အိုဗီဒို","Eibar":"အီဘာ","Burgos CF":"ဘာဂို့စ်","Granada":"ဂရန်နာဒါ","Atalanta":"အတ္တလန်တာ","Venezia":"ဗင်နီဇီယာ","Coventry City":"ကိုဗင်ထရီ","Newcastle United":"နယူးကာဆယ်"};
 function sourceOdds(v){return v!==undefined&&v!==null&&String(v).trim()?String(v):"ကြေးမရရှိသေး"}
 function result(g){return Number.isInteger(g.teamGoals)&&Number.isInteger(g.opponentGoals)?g.teamGoals+" – "+g.opponentGoals:"—"}
 function safeName(v){return String(v||"match").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,70)||"match"}
 async function save(match,opts={}){
  if(!match||!match.home||!match.away)throw Error("Invalid match");
  const k=window.FutureCodeCanvasKit;if(!k)throw Error("Canvas export module not ready");
  const {C,create,fill,line,text,fit,wrap,fonts,preloadImages,crest,download}=k;
  await fonts();
  const W=1200,M=24;
  const previewText=match.dailyPreviewText||"";
  const extra=opts.special&&Array.isArray(match.specialAnalysisParagraphs)?match.specialAnalysisParagraphs:[];
  // Use the same 3 side-by-side panels as the match card on desktop.
  const measure=create(30,30).ctx;
  const previewLines=wrap(measure,previewText,1090,24);
  const moreLines=extra.flatMap(p=>[...wrap(measure,p,1090,22),""]);
  const mainH=Math.max(215,previewLines.length*43+85);
  const extraH=extra.length?80+moreLines.length*39:0;
  const H=1057+mainH+extraH+95;
  const {canvas,ctx}=create(W,H);
  const games=[...(match.homeLastFive||[]),...(match.awayLastFive||[]),...(match.headToHead||[])];
  const urls=[match.homeCrestUrl,match.awayCrestUrl,...games.flatMap(g=>[g.opponentCrestUrl,g.homeCrestUrl,g.awayCrestUrl])].filter(Boolean);
  await preloadImages(urls);
  fill(ctx,0,0,W,H,C.bg);fill(ctx,M,20,W-2*M,H-40,C.head,16);
  // Actual website's competition/time headline
  fill(ctx,M,20,W-2*M,66,C.bg,13);
  text(ctx,"◈ "+(opts.leagueLabel||MM[match.league]||match.league),M+18,53,22,C.orange,true);
  const isYKZ=document.documentElement?.dataset?.footballBrandName==="YKZ FAMILY GROUP";
  if(isYKZ){
    text(ctx,"YKZ FAMILY GROUP · အတူရှေ့ဆက် YKZ",W/2,52,18,C.orange,true,"center");
    crest(ctx,opts.brandLogoUrl||document.documentElement?.dataset?.footballBrandLogoUrl,W-100,26,51,"YKZ");
  }
  text(ctx,match.kickoffYangon||"",isYKZ?W-113:W-M-18,53,18,C.muted,true,"right",isYKZ?190:260);
  // VS banner with home/away logos and matching teal background
  fill(ctx,M,87,W-2*M,238,isYKZ?"#990000":"#29453f");
  fill(ctx,M,87,376,238,isYKZ?"#400000":"#263639");
  fill(ctx,W-M-376,87,376,238,isYKZ?"#400000":"#263639");
  const homeName=String(match.home||""),awayName=String(match.away||"");
  crest(ctx,match.homeCrestUrl,190,110,118,homeName);
  crest(ctx,match.awayCrestUrl,W-310,110,118,awayName);
  text(ctx,homeName,250,278,fit(ctx,homeName,330,24,17),C.white,true,"center",330);
  text(ctx,awayName,950,278,fit(ctx,awayName,330,24,17),C.white,true,"center",330);
  fill(ctx,W/2-53,157,106,100,C.bg,53);
  text(ctx,"VS",W/2,207,43,C.orange,true,"center");
  // Centered title and stadium (same elements as the website)
  text(ctx,homeName+"  VS  "+awayName,W/2,362,fit(ctx,homeName+" VS "+awayName,1060,32,22),C.white,true,"center",1060);
  text(ctx,match.venue||"",W/2,404,16,C.muted,false,"center",1000);
  // Full-time 1X2 price row, no invented prices
  const oddsY=434,cellW=(W-2*M)/3;
  fill(ctx,M,oddsY,W-M*2,112,C.panelAlt,12);
  for(const [i,pair] of [[homeName+" နိုင် (1)",match.homeOdds],["သရေ (X)",match.drawOdds],[awayName+" နိုင် (2)",match.awayOdds]].entries()){
   const x=M+cellW*(i+.5);
   text(ctx,pair[0],x,oddsY+30,18,C.muted,true,"center",cellW-20);
   text(ctx,sourceOdds(pair[1]),x,oddsY+76,24,C.white,true,"center",cellW-15);
   if(i<2)fill(ctx,M+cellW*(i+1),oddsY,1,112,C.divider);
  }
  // Myanmar Asian market snapshots beneath 1X2
  const my=match.myanmarOdds||{};
  const myY=566;
  fill(ctx,M,myY,W-M*2,117,C.panel,10);
  text(ctx,"မြန်မာကြေး",M+19,myY+28,21,C.orange,true);
  const body=my.bodyOdds!=null?(my.upperTeam?my.upperTeam+"  ":"")+my.bodyOdds:"—";
  text(ctx,"ဘော်ဒီကြေး · "+body,M+20,myY+77,21,C.white,true,"left",500);
  text(ctx,"ဂိုးပေါင်းကြေး · "+(my.goalTotalOdds??"—"),M+590,myY+77,21,C.white,true,"left",510);
  // Historical results in exactly THREE SIDE-BY-SIDE cards (Home | H2H | Away).
  const historyY=707,panelW=(W-2*M-20)/3;
  const homeX=M,headX=M+panelW+10,awayX=M+2*(panelW+10);
  for(const x of [homeX,headX,awayX])fill(ctx,x,historyY,panelW,340,C.panelAlt,10);
  const fmtDate=v=>String(v||"").slice(5,10);
  const homeFive=(match.homeLastFive||[]).slice(0,5);
  const awayFive=(match.awayLastFive||[]).slice(0,5);
  const head=(match.headToHead||[]).slice(0,5);
  function five(x,label,arr,club){
   text(ctx,label,x+13,historyY+24,18,C.orange,true,"left",panelW-26);
   text(ctx,club,x+13,historyY+57,20,C.white,true,"left",panelW-26);
   if(!arr.length)text(ctx,"ရလဒ်မရရှိသေးပါ",x+14,historyY+114,15,C.muted);
   arr.forEach((g,i)=>{
    const row=historyY+96+i*47;line(ctx,x+13,row-13,panelW-26);
    const clubName=mmNames[g.opponent]||g.opponent||"";
    crest(ctx,g.opponentCrestUrl,x+12,row-5,24,clubName);
    const score=result(g),state=g.teamGoals>g.opponentGoals?"W":g.teamGoals<g.opponentGoals?"L":"D";
    text(ctx,state,x+46,row+7,15,state==="W"?"#7fd4aa":state==="L"?"#ff9797":C.muted,true);
    text(ctx,clubName,x+70,row+7,fit(ctx,clubName,panelW-178,15,12),C.white,false,"left",panelW-178);
    text(ctx,score,x+panelW-10,row+7,16,C.white,true,"right",65);
   });
  }
  five(homeX,"အိမ်ရှင် နောက်ဆုံး ၅ ပွဲ",homeFive,homeName);
  five(awayX,"ဧည့်သည် နောက်ဆုံး ၅ ပွဲ",awayFive,awayName);
  text(ctx,"ထိပ်တိုက်တွေ့ဆုံမှု H2H",headX+13,historyY+24,18,C.orange,true,"left",panelW-26);
  if(!head.length)text(ctx,"H2H မရရှိသေးပါ",headX+13,historyY+114,16,C.muted);
  head.forEach((g,i)=>{
   const row=historyY+67+i*51;line(ctx,headX+13,row-12,panelW-26);
   text(ctx,fmtDate(g.date),headX+13,row+1,14,C.muted);
   const s=Number.isInteger(g.homeGoals)&&Number.isInteger(g.awayGoals)?g.homeGoals+" – "+g.awayGoals:"—";
   text(ctx,s,headX+panelW-13,row+1,15,C.orange,true,"right");
   const pair=(mmNames[g.home]||g.home||"")+" – "+(mmNames[g.away]||g.away||"");
   text(ctx,pair,headX+13,row+24,13,C.white,false,"left",panelW-26);
  });
  // Complete editorial copy, never truncate the preview to an arbitrary screenshot crop.
  const anaY=1070;
  fill(ctx,M,anaY,W-2*M,H-anaY-62,C.panel,11);
  text(ctx,"ပွဲကြိုသုံးသပ်ချက်",M+19,anaY+39,24,C.orange,true);
  let y=anaY+94;
  for(const l of previewLines){text(ctx,l,M+23,y,24,C.white,false,"left",W-M*2-46);y+=43;}
  if(extra.length){
   y+=18;text(ctx,"★ SPECIAL CHOICE — အသေးစိတ်သုံးသပ်ချက်",M+19,y,23,C.orange,true);y+=43;
   for(const l of moreLines){if(l)text(ctx,l,M+23,y,22,C.white,false,"left",W-M*2-46);y+=39;}
  }
  line(ctx,M,H-53,W-2*M);
  text(ctx,opts.brandName||"FUTURE CODE FOOTBALL",M+8,H-30,19,C.orange,true);
  const filename=safeName(opts.brandName||"future-code")+"-"+safeName(match.home)+"-vs-"+safeName(match.away)+".png";
  await download(canvas,filename);
 }
 window.FutureCodeCardExport={save};
})();

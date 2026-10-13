"use strict";
(function(){
 const K=()=>window.FutureCodeCanvasKit;
 function grouped(matches){const g=new Map();for(const m of matches){const name=m.league||"အခြားပြိုင်ပွဲ";if(!g.has(name))g.set(name,[]);g.get(name).push(m)}return [...g.entries()]}
 const leagues={"UEFA Champions League":"ချန်ပီယံလိဂ်","Championship":"အင်္ဂလန် ချန်ပီယံရှစ်","Swedish Superettan":"ဆွီဒင် စူပါတန် လိဂ်","German 3. Liga":"ဂျာမန် ဘွန်ဒစ်လီဂါ ၃","Premier League":"အင်္ဂလန် ပရီးမီးယားလိဂ်","Serie A":"အီတလီ စီးရီးအေ","La Liga":"စပိန် လာလီဂါ","La Liga 2":"စပိန် လာလီဂါ ၂","Ligue 2":"ပြင်သစ် လိဂ် ၂","Veikkausliiga":"ဖင်လန် လိဂ်","Eliteserien":"နော်ဝေး လိဂ်","Allsvenskan":"ဆွီဒင် လိဂ်","Danish Superliga":"ဒိန်းမတ် စူပါလိဂ်","Primeira Liga":"ပေါ်တူဂီ ပရီးမီးယားလိဂ်","Turkish Super Lig":"တူရကီ စူပါလိဂ်"};
 const crests={"Premier League":"https://crests.football-data.org/PL.png","Serie A":"https://crests.football-data.org/SA.png","La Liga":"https://crests.football-data.org/PD.png","La Liga 2":"https://crests.football-data.org/SD.png"};
 function verified(m){return m&&m.status==="finished"&&/^\d+\s*[-:]\s*\d+$/.test(String(m.finalScore||""))}
 async function saveOdds(data){
  if(!data||!Array.isArray(data.matches)||!data.matches.length)throw Error("No odds ready to export");
  const kit=K();if(!kit)throw Error("Canvas export module missing");
  const {C,create,fill,line,text,fit,fonts,preloadImages,crest,download,top}=kit;
  const groups=grouped(data.matches);
  const W=1360,M=24,H=222+groups.reduce((n,g)=>n+131+g[1].length*73,0)+80;
  const {canvas,ctx}=create(W,H);
  await Promise.all([fonts(),preloadImages(data.matches.flatMap(m=>[m.homeCrestUrl,m.awayCrestUrl]).concat(groups.map(g=>crests[g[0]])))]);
  fill(ctx,0,0,W,H,C.bg);top(ctx,W,"ယနေ့ ပေါက်ကြေးများ",data.reportDate,data.matches.length+" ပွဲ");
  const widths=[155,402,195,166,164,230], xs=[M];for(const w of widths)xs.push(xs[xs.length-1]+w);
  let y=222;
  for(const [league,matches] of groups){
   fill(ctx,M,y,W-M*2,62,C.head,12);kit.crest(ctx,crests[league],M+14,y+9,44,"⚽");
   text(ctx,leagues[league]||league,M+72,y+33,26,C.orange,true);
   y+=69;
   fill(ctx,M,y,W-M*2,44,C.panelAlt);
   for(const [i,h] of ["ပွဲချိန်","ယှဉ်ပြိုင်မည့်အသင်း","အပေါ်အသင်း","ဘော်ဒီကြေး","ဂိုးပေါင်းကြေး","အင်တာနက်ခန့်မှန်းချက်"].entries())
    text(ctx,h,xs[i]+widths[i]/2,y+23,15,C.muted,true,"center",widths[i]-12);
   y+=44;
   for(const m of matches){
    fill(ctx,M,y,W-M*2,73,C.panel);line(ctx,M,y+72,W-2*M,C.divider);
    const isNext=Boolean(m.kickoffDate&&m.kickoffDate!==data.reportDate);
    const clock=m.kickoffDisplay||((isNext?Number(m.kickoffDate.slice(-2))+" ရက် · ":"")+(m.kickoff||""));
    text(ctx,clock,xs[0]+widths[0]/2,y+37,fit(ctx,clock,widths[0]-12,17,11),C.orange,true,"center",widths[0]-12);
    const mid=xs[1]+widths[1]/2;
    crest(ctx,m.homeCrestUrl,mid-72,y+19,35,m.home);
    crest(ctx,m.awayCrestUrl,mid+37,y+19,35,m.away);
    const h=String(m.home||""),a=String(m.away||"");
    text(ctx,h,mid-82,y+37,fit(ctx,h,111,18,12),C.white,true,"right",111);
    text(ctx,"VS",mid,y+37,14,C.orange,true,"center");
    text(ctx,a,mid+82,y+37,fit(ctx,a,109,18,12),C.white,true,"left",109);
    text(ctx,m.upperTeam||"—",xs[2]+widths[2]/2,y+37,18,C.orange,true,"center",widths[2]-12);
    text(ctx,m.bodyOdds??"—",xs[3]+widths[3]/2,y+37,20,C.pale,true,"center");
    text(ctx,m.goalTotalOdds??"—",xs[4]+widths[4]/2,y+37,20,C.pale,true,"center");
    text(ctx,m.pdfLastColumn??"—",xs[5]+widths[5]/2,y+37,20,C.orange,true,"center");
    y+=73;
   }
   y+=18;
  }
  text(ctx,"အာရှ စျေးကွက် မြန်မာကြေး မနက်ပိုင်း ဖွင့်လှစ်မှုများ",W/2,H-37,21,C.muted,false,"center");
  const brand=window.FutureCodeBrandConfig?.id||"future-code";
  await download(canvas,brand+"-odds-"+kit.day(data.reportDate)+".png");
 }
 async function saveResults({matches,date}){
  const finals=Array.isArray(matches)?matches.filter(verified):[];
  if(!finals.length)throw Error("ပွဲပြီးအတည်ပြုထားသော ရလဒ်များ မရှိသေးပါ");
  const kit=K(),{C,create,fill,line,text,fit,fonts,preloadImages,crest,download,top}=kit;
  const groups=grouped(finals),W=1200,M=30,H=218+groups.reduce((n,g)=>n+67+g[1].length*215+18,0)+70;
  const {canvas,ctx}=create(W,H);
  await Promise.all([fonts(),preloadImages(finals.flatMap(m=>[m.homeCrestUrl,m.awayCrestUrl]))]);
  fill(ctx,0,0,W,H,C.bg);top(ctx,W,"ဂိုးရလဒ်များ",date,finals.length+" ပွဲပြီး");
  let y=223;
  for(const [league,items] of groups){
   fill(ctx,M,y,W-M*2,54,C.head,10);text(ctx,leagues[league]||league,M+19,y+27,23,C.orange,true);y+=66;
   for(const m of items){
    fill(ctx,M,y,W-M*2,200,C.panel,12);
    fill(ctx,M,y,W-M*2,44,C.head,10);
    text(ctx,"◈ "+(leagues[league]||league),M+18,y+23,17,C.orange,true);
    text(ctx,m.kickoffYangon||"",W-M-19,y+23,15,C.muted,false,"right");
    crest(ctx,m.homeCrestUrl,M+62,y+59,78,m.homeDisplay||m.home);
    crest(ctx,m.awayCrestUrl,W-M-140,y+59,78,m.awayDisplay||m.away);
    const hn=m.homeDisplay||m.home||"",an=m.awayDisplay||m.away||"";
    text(ctx,hn,300,y+104,fit(ctx,hn,190,25,17),C.white,true,"center",190);
    text(ctx,an,W-300,y+104,fit(ctx,an,190,25,17),C.white,true,"center",190);
    fill(ctx,W/2-89,y+65,178,82,C.panelAlt,14);
    text(ctx,String(m.finalScore).replace(":", "-"),W/2,y+106,47,C.orange,true,"center");
    text(ctx,"ပွဲပြီး",W/2,y+173,17,C.muted,true,"center");
    y+=215;
   }
   y+=18;
  }
  text(ctx,"ပွဲပြီးအတည်ပြုထားသော ဂိုးရလဒ်များ",W/2,H-32,20,C.muted,false,"center");
  const brand=window.FutureCodeBrandConfig?.id;
  await download(canvas,(brand?brand+"-":"football-")+"goal-results-"+kit.day(date)+".png");
 }
 window.FutureCodeDailyExport={saveOdds,saveResults};
})();

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
  const {create,fill,line,text,fit,fonts,preloadImages,crest,download}=kit;
  const groups=grouped(data.matches);
  // Preserve full single-image capture: every league, original Myanmar label and row.
  // Height formula covers every 62px league bar, 44px header and 73px body row.
  const W=1360,M=24,H=222+groups.reduce((n,g)=>n+131+g[1].length*73,0)+80;
  const {canvas,ctx}=create(W,H);
  await Promise.all([fonts(),preloadImages(data.matches.flatMap(m=>[m.homeCrestUrl,m.awayCrestUrl]).concat(groups.map(g=>crests[g[0]])))]);
  const brandName=document.documentElement?.dataset?.footballBrandName||"FUTURE CODE FOOTBALL DAILY";
  const brandConfig=window.FutureCodeBrandConfig||{};
  const brand=brandConfig.id||"future-code";
  const palette=brand==="ykz-family"||brandName==="YKZ FAMILY GROUP"?
   {header:"#aa111b",deep:"#650409",accent:"#ffd36b",bodyText:"#131720"}:
   brand==="bw-sport"||brandName==="BW SPORT ဘောလုံးဂျာနယ်"?
   {header:"#0856c4",deep:"#072d77",accent:"#d9eefe",bodyText:"#131720"}:
   brand==="ko-thet-family"||brandName==="Ko Thet Family ဘောလုံးဂျာနယ်"?
   {header:"#830b15",deep:"#45060c",accent:"#ffdc78",bodyText:"#131720"}:
   {header:"#215c55",deep:"#163e3b",accent:"#ffcb92",bodyText:"#131720"};
  const white="#ffffff",light="#f7f8fa",rule="#cbd2da",upper="#e7e9ed",upperAlt="#dfe2e7";
  const widths=[155,402,195,166,164,230],xs=[M];
  for(const w of widths)xs.push(xs[xs.length-1]+w);

  // Header color is the brand's own theme. Everything underneath the heading
  // uses white/light-gray backgrounds, dark lettering and visible grid lines.
  fill(ctx,0,0,W,H,white);
  fill(ctx,0,0,W,13,palette.accent);
  fill(ctx,0,13,W,193,palette.deep);
  fill(ctx,18,31,W-36,153,palette.header,12);
  const logoUrl=document.documentElement?.dataset?.footballBrandLogoUrl;
  if(logoUrl)crest(ctx,logoUrl,W-122,50,78,"⚽");
  text(ctx,brandName,40,64,24,palette.accent,true,"left",W-230);
  text(ctx,"ယနေ့ ပေါက်ကြေးများ",40,119,36,white,true);
  text(ctx,"မြန်မာစံတော်ချိန် · "+String(data.reportDate||""),40,168,17,white,false);
  text(ctx,data.matches.length+" ပွဲ",W-(logoUrl?150:44),165,19,palette.accent,true,"right");
  fill(ctx,0,206,W,5,palette.accent);

  let y=222;
  for(const [league,matches] of groups){
   // League banner and column titles are the ONLY colored table areas.
   fill(ctx,M,y,W-M*2,62,palette.header,10);
   crest(ctx,crests[league],M+13,y+9,44,"⚽");
   text(ctx,leagues[league]||league,M+73,y+33,26,white,true,"left",W-M*2-95);
   y+=69;
   fill(ctx,M,y,W-M*2,44,palette.deep);
   const titles=["ပွဲချိန်","ယှဉ်ပြိုင်မည့်အသင်း","အပေါ်အသင်း","ဘော်ဒီကြေး","ဂိုးပေါင်းကြေး","အင်တာနက်ခန့်မှန်းချက်"];
   for(let i=0;i<titles.length;i++){
    text(ctx,titles[i],xs[i]+widths[i]/2,y+23,fit(ctx,titles[i],widths[i]-12,17,12),white,true,"center",widths[i]-12);
   }
   y+=44;
   for(const [index,m] of matches.entries()){
    fill(ctx,M,y,W-M*2,73,index%2===0?white:light);
    fill(ctx,xs[2],y,widths[2],73,index%2===0?upper:upperAlt);
    // Spreadsheet-style vertical and horizontal rules stay in the exported PNG.
    for(let i=0;i<xs.length;i++)fill(ctx,xs[i],y,1,73,rule);
    line(ctx,M,y+72,W-M*2,rule);
    const clock=String(m.kickoffDisplay||m.kickoff||"");
    text(ctx,clock,xs[0]+widths[0]/2,y+37,fit(ctx,clock,widths[0]-14,16,10),palette.bodyText,true,"center",widths[0]-14);
    const mid=xs[1]+widths[1]/2;
    crest(ctx,m.homeCrestUrl,mid-74,y+19,35,m.home);
    crest(ctx,m.awayCrestUrl,mid+38,y+19,35,m.away);
    const home=String(m.home||""),away=String(m.away||"");
    text(ctx,home,mid-84,y+37,fit(ctx,home,112,18,11),palette.bodyText,true,"right",112);
    text(ctx,"VS",mid,y+37,14,"#9d2636",true,"center");
    text(ctx,away,mid+83,y+37,fit(ctx,away,115,18,11),palette.bodyText,true,"left",115);
    text(ctx,m.upperTeam||"—",xs[2]+widths[2]/2,y+37,fit(ctx,m.upperTeam||"—",widths[2]-16,19,12),palette.bodyText,true,"center",widths[2]-16);
    text(ctx,m.bodyOdds??"—",xs[3]+widths[3]/2,y+37,20,palette.bodyText,true,"center",widths[3]-12);
    text(ctx,m.goalTotalOdds??"—",xs[4]+widths[4]/2,y+37,20,palette.bodyText,true,"center",widths[4]-12);
    text(ctx,m.pdfLastColumn??"—",xs[5]+widths[5]/2,y+37,20,palette.bodyText,true,"center",widths[5]-12);
    y+=73;
   }
   y+=18;
  }
  text(ctx,"ပေါက်ကြေးများသည် အိုင်ဘတ် ခွန်ရှစ်ကိုး ဆိုဒ်မှာ မနက်ပိုင်း ဖွင့် ထားသော မြန်မာကြေး များဖြစ်ပါသည်။",W/2,H-37,18,palette.bodyText,false,"center",W-75);
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

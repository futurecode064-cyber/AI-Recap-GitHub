"use strict";
(function(){
 const K=()=>window.FutureCodeCanvasKit;
 function grouped(matches){const g=new Map();for(const m of matches){const name=m.league||"အခြားပြိုင်ပွဲ";if(!g.has(name))g.set(name,[]);g.get(name).push(m)}return [...g.entries()]}
 const leagues={"UEFA Champions League":"ချန်ပီယံလိဂ်","Championship":"အင်္ဂလန် ချန်ပီယံရှစ်","Swedish Superettan":"ဆွီဒင် စူပါတန် လိဂ်","German 3. Liga":"ဂျာမန် ဘွန်ဒစ်လီဂါ ၃","Premier League":"အင်္ဂလန် ပရီးမီးယားလိဂ်","Serie A":"အီတလီ စီးရီးအေ","La Liga":"စပိန် လာလီဂါ","La Liga 2":"စပိန် လာလီဂါ ၂","Ligue 2":"ပြင်သစ် လိဂ် ၂","Veikkausliiga":"ဖင်လန် လိဂ်","Eliteserien":"နော်ဝေး လိဂ်","Allsvenskan":"ဆွီဒင် လိဂ်","Danish Superliga":"ဒိန်းမတ် စူပါလိဂ်","Primeira Liga":"ပေါ်တူဂီ ပရီးမီးယားလိဂ်","Turkish Super Lig":"တူရကီ စူပါလိဂ်"};
 const crests={"Premier League":"https://crests.football-data.org/PL.png","Serie A":"https://crests.football-data.org/SA.png","La Liga":"https://crests.football-data.org/PD.png","La Liga 2":"https://crests.football-data.org/SD.png","Bundesliga":"https://crests.football-data.org/BL1.png","Ligue 1":"https://crests.football-data.org/FL1.png","Championship":"https://crests.football-data.org/ELC.png"};

 async function encodePng(canvas){
  return new Promise((resolve,reject)=>{
   let done=false;
   const timer=setTimeout(()=>{if(!done){done=true;reject(Error("PNG export timed out"));}},30000);
   try{canvas.toBlob(blob=>{
    if(done)return;
    done=true;clearTimeout(timer);
    if(blob&&blob.size)resolve(blob);else reject(Error("PNG export failed"));
   },"image/png");}
   catch(err){if(!done){done=true;clearTimeout(timer);reject(err);}}
  });
 }

 // One or two readable Burmese lines. Prefer line wrapping over squeezing
 // a long team name into an illegibly thin one-line PNG.
 function drawTeamName(ctx,name,x,cy,maxWidth,align,color,text,fit){
  const value=String(name||"");
  if(!value)return;
  const oneLineSize=fit(ctx,value,maxWidth,18,15);
  ctx.font="800 "+oneLineSize+'px "Noto Sans Myanmar",sans-serif';
  if(ctx.measureText(value).width<=maxWidth){
   text(ctx,value,x,cy,oneLineSize,color,true,align,maxWidth);
   return;
  }
  const units=typeof Intl!=="undefined"&&typeof Intl.Segmenter==="function"?
   Array.from(new Intl.Segmenter("my",{granularity:"grapheme"}).segment(value),item=>item.segment):
   Array.from(value);
  if(units.length<2){text(ctx,value,x,cy,15,color,true,align,maxWidth);return;}
  ctx.font='800 17px "Noto Sans Myanmar",sans-serif';
  let cut=1,best=Infinity;
  for(let i=1;i<units.length;i++){
   const left=units.slice(0,i).join(""),right=units.slice(i).join("");
   const measure=Math.max(ctx.measureText(left).width,ctx.measureText(right).width);
   if(measure<best){best=measure;cut=i;}
  }
  const lines=[units.slice(0,cut).join(""),units.slice(cut).join("")];
  lines.forEach((line,i)=>text(ctx,line,x,cy+(i===0?-12:12),fit(ctx,line,maxWidth,17,14),color,true,align,maxWidth));
 }
 function verified(m){return m&&m.status==="finished"&&/^\d+\s*[-:]\s*\d+$/.test(String(m.finalScore||""))}
 // Balanced contiguous PNG sections across every public brand, no ZIP files.
 // 1-10 matches stay one image; 11-36 are two evenly-sized images.
 // More than 36 use the fewest balanced pages capped at 18 rows (mobile-safe).
 function partition(matches,{threshold=10,maxPerPage=18}={}){
  if(!Array.isArray(matches)||matches.length===0)return [];
  const n=matches.length;
  const pages=n<=threshold?1:Math.max(2,Math.ceil(n/maxPerPage));
  const size=Math.floor(n/pages),extras=n%pages;
  let start=0;
  return Array.from({length:pages},(_,i)=>{
   const count=size+(i<extras?1:0);
   const part=matches.slice(start,start+count);
   start+=count;
   return {matches:part,count,index:i+1,total:pages};
  });
 }

 async function saveOdds(data,options={}){
  if(!data||!Array.isArray(data.matches)||!data.matches.length)throw Error("No odds ready to export");
  const kit=K();if(!kit)throw Error("Canvas export module missing");
  const {create,fill,line,text,fit,fonts,preloadImages,crest,download}=kit;
  const groups=grouped(data.matches);
  // Preserve full single-image capture: every league, original Myanmar label and row.
  // Compact 1200px branded sheet; keep all Myanmar names and price columns.
  // Each group consumes 58px league bar, 56px headings, 68px per row and 12px gap.
  const W=1200,M=24,H=222+groups.reduce((n,g)=>n+126+g[1].length*68,0)+80;
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
  const widths=[110,396,166,152,152,176],xs=[M];
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
   fill(ctx,M,y,W-M*2,52,palette.header,9);
   crest(ctx,crests[league],M+12,y+9,34,"⚽");
   text(ctx,leagues[league]||league,M+58,y+27,23,white,true,"left",W-M*2-72);
   y+=58;
   fill(ctx,M,y,W-M*2,56,palette.deep);
   const titles=["ပွဲချိန်","ယှဉ်ပြိုင်မည့်အသင်း","အပေါ်အသင်း","ဘော်ဒီကြေး","ဂိုးပေါင်းကြေး","အင်တာနက်ခန့်မှန်းချက်"];
   for(let i=0;i<titles.length;i++){
    const x=xs[i],w=widths[i];
    const split=i===3||i===4;
    text(ctx,titles[i],x+w/2,y+(split?16:29),fit(ctx,titles[i],w-10,17,13),white,true,"center",w-10);
    if(split){
     fill(ctx,x+2,y+27,w/2-4,25,palette.header,5);
     fill(ctx,x+w/2+2,y+27,w/2-4,25,"#f0f5f3",5);
     text(ctx,"မူလ",x+w/4,y+40,15,white,true,"center",w/2-10);
     text(ctx,"ယခု",x+3*w/4,y+40,15,palette.bodyText,true,"center",w/2-10);
     fill(ctx,x+w/2,y+27,1,25,"#ffffffa0");
    }
   }
   y+=56;
   for(const [index,m] of matches.entries()){
    fill(ctx,M,y,W-M*2,68,index%2===0?white:light);
    fill(ctx,xs[2],y,widths[2],68,index%2===0?upper:upperAlt);
    // Latest quotes are pale-green cells, left empty until the update arrives.
    for(const i of [3,4]){
     fill(ctx,xs[i]+widths[i]/2,y,widths[i]/2,68,index%2===0?"#eef7f2":"#e3f0e9");
     fill(ctx,xs[i]+widths[i]/2,y,1,68,rule);
    }
    // Spreadsheet-style vertical and horizontal rules stay in the exported PNG.
    for(let i=0;i<xs.length;i++)fill(ctx,xs[i],y,1,68,rule);
    line(ctx,M,y+67,W-M*2,rule);
    const clock=String(m.kickoffDisplay||m.kickoff||"").replace(/^.*? ည /,"ည ");
    text(ctx,clock,xs[0]+widths[0]/2,y+34,fit(ctx,clock,widths[0]-10,16,14),palette.bodyText,true,"center",widths[0]-10);
    const mid=xs[1]+widths[1]/2;
    crest(ctx,m.homeCrestUrl,mid-50,y+20,29,m.home);
    crest(ctx,m.awayCrestUrl,mid+21,y+20,29,m.away);
    drawTeamName(ctx,m.home,mid-59,y+34,136,"right",palette.bodyText,text,fit);
    text(ctx,"VS",mid,y+34,14,"#9d2636",true,"center");
    drawTeamName(ctx,m.away,mid+59,y+34,136,"left",palette.bodyText,text,fit);
    const up=String(m.upperTeam||"—");
    text(ctx,up,xs[2]+widths[2]/2,y+34,fit(ctx,up,widths[2]-10,18,14),palette.bodyText,true,"center",widths[2]-10);
    for(const [i,oldValue,latestValue] of [
     [3,m.bodyOdds,m.currentBodyOdds],
     [4,m.goalTotalOdds,m.currentGoalTotalOdds]
    ]){
     const x=xs[i],w=widths[i],half=w/2;
     const original=String(oldValue??"");
     text(ctx,original,x+half/2,y+34,fit(ctx,original,half-8,19,15),palette.bodyText,true,"center",half-8);
     if(latestValue!==null&&latestValue!==undefined&&String(latestValue).trim()!==""){
      const updated=String(latestValue);
      text(ctx,updated,x+half*1.5,y+34,fit(ctx,updated,half-8,19,15),"#164c3d",true,"center",half-8);
     }
    }
    text(ctx,m.pdfLastColumn??"—",xs[5]+widths[5]/2,y+34,19,palette.bodyText,true,"center",widths[5]-10);
    y+=68;
   }
   y+=12;
  }
  text(ctx,"ပေါက်ကြေးများသည် အိုင်ဘတ် ခွန်ရှစ်ကိုး ဆိုဒ်မှာ မနက်ပိုင်း ဖွင့် ထားသော မြန်မာကြေး များဖြစ်ပါသည်။",W/2,H-37,18,palette.bodyText,false,"center",W-75);
  const leagueSuffix=options.league?"-"+String(options.league).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60):"";
  const partSuffix=options.total>1?"-"+Number(options.part||1)+"-of-"+Number(options.total):"";
  const filename=brand+"-odds-"+kit.day(data.reportDate)+leagueSuffix+partSuffix+".png";
  if(options.asBlob===true)return {filename,blob:await encodePng(canvas)};
  await download(canvas,filename);
  return {filename,fileCount:1,matchCount:data.matches.length,format:"png"};
 }

 async function saveResults({matches,date,part=1,total=1}){
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
  const partSuffix=total>1?"-"+part+"-of-"+total:"";
  await download(canvas,(brand?brand+"-":"football-")+"goal-results-"+kit.day(date)+partSuffix+".png");
 }
 window.FutureCodeDailyExport={saveOdds,saveResults,partition};
})();

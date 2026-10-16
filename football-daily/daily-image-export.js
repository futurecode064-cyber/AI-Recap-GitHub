"use strict";
(function(){
 const K=()=>window.FutureCodeCanvasKit;
 function grouped(matches){const g=new Map();for(const m of matches){const name=m.league||"အခြားပြိုင်ပွဲ";if(!g.has(name))g.set(name,[]);g.get(name).push(m)}return [...g.entries()]}
 const leagues={"UEFA Champions League":"ချန်ပီယံလိဂ်","Championship":"အင်္ဂလန် ချန်ပီယံရှစ်","Swedish Superettan":"ဆွီဒင် စူပါတန် လိဂ်","German 3. Liga":"ဂျာမန် ဘွန်ဒစ်လီဂါ ၃","Premier League":"အင်္ဂလန် ပရီးမီးယားလိဂ်","Serie A":"အီတလီ စီးရီးအေ","La Liga":"စပိန် လာလီဂါ","La Liga 2":"စပိန် လာလီဂါ ၂","Ligue 2":"ပြင်သစ် လိဂ် ၂","Veikkausliiga":"ဖင်လန် လိဂ်","Eliteserien":"နော်ဝေး လိဂ်","Allsvenskan":"ဆွီဒင် လိဂ်","Danish Superliga":"ဒိန်းမတ် စူပါလိဂ်","Primeira Liga":"ပေါ်တူဂီ ပရီးမီးယားလိဂ်","Turkish Super Lig":"တူရကီ စူပါလိဂ်"};
 const crests={"Premier League":"https://crests.football-data.org/PL.png","Serie A":"https://crests.football-data.org/SA.png","La Liga":"https://crests.football-data.org/PD.png","La Liga 2":"https://crests.football-data.org/SD.png"};

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
 function verified(m){return m&&m.status==="finished"&&/^\d+\s*[-:]\s*\d+$/.test(String(m.finalScore||""))}
 async function saveOdds(data,options={}){
  if(!data||!Array.isArray(data.matches)||!data.matches.length)throw Error("No odds ready to export");
  const kit=K();if(!kit)throw Error("Canvas export module missing");
  const {create,fill,line,text,fit,fonts,preloadImages,crest,download}=kit;
  const groups=grouped(data.matches);
  // Preserve full single-image capture: every league, original Myanmar label and row.
  // Height includes each 62px league bar, 62px original/current header and every 73px fixture row.
  const W=1360,M=24,H=222+groups.reduce((n,g)=>n+149+g[1].length*73,0)+80;
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
   fill(ctx,M,y,W-M*2,62,palette.deep);
   const titles=["ပွဲချိန်","ယှဉ်ပြိုင်မည့်အသင်း","အပေါ်အသင်း","ဘော်ဒီကြေး","ဂိုးပေါင်းကြေး","အင်တာနက်ခန့်မှန်းချက်"];
   for(let i=0;i<titles.length;i++){
    const x=xs[i],w=widths[i];
    const split=i===3||i===4;
    text(ctx,titles[i],x+w/2,y+(split?19:32),fit(ctx,titles[i],w-12,17,12),white,true,"center",w-12);
    if(split){
     fill(ctx,x+2,y+30,w/2-4,27,palette.header,5);
     fill(ctx,x+w/2+2,y+30,w/2-4,27,"#f0f5f3",5);
     text(ctx,"မူလ",x+w/4,y+44,15,white,true,"center",w/2-10);
     text(ctx,"ယခု",x+3*w/4,y+44,15,palette.bodyText,true,"center",w/2-10);
     fill(ctx,x+w/2,y+30,1,27,"#ffffffa0");
    }
   }
   y+=62;
   for(const [index,m] of matches.entries()){
    fill(ctx,M,y,W-M*2,73,index%2===0?white:light);
    fill(ctx,xs[2],y,widths[2],73,index%2===0?upper:upperAlt);
    // Latest quotes are pale-green cells, left empty until the update arrives.
    for(const i of [3,4]){
     fill(ctx,xs[i]+widths[i]/2,y,widths[i]/2,73,index%2===0?"#eef7f2":"#e3f0e9");
     fill(ctx,xs[i]+widths[i]/2,y,1,73,rule);
    }
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
    for(const [i,oldValue,latestValue] of [
     [3,m.bodyOdds,m.currentBodyOdds],
     [4,m.goalTotalOdds,m.currentGoalTotalOdds]
    ]){
     const x=xs[i],w=widths[i],half=w/2;
     const original=String(oldValue??"");
     text(ctx,original,x+half/2,y+37,fit(ctx,original,half-10,20,12),palette.bodyText,true,"center",half-10);
     if(latestValue!==null&&latestValue!==undefined&&String(latestValue).trim()!==""){
      const updated=String(latestValue);
      text(ctx,updated,x+half*1.5,y+37,fit(ctx,updated,half-10,20,12),"#164c3d",true,"center",half-10);
     }
    }
    text(ctx,m.pdfLastColumn??"—",xs[5]+widths[5]/2,y+37,20,palette.bodyText,true,"center",widths[5]-12);
    y+=73;
   }
   y+=18;
  }
  text(ctx,"ပေါက်ကြေးများသည် အိုင်ဘတ် ခွန်ရှစ်ကိုး ဆိုဒ်မှာ မနက်ပိုင်း ဖွင့် ထားသော မြန်မာကြေး များဖြစ်ပါသည်။",W/2,H-37,18,palette.bodyText,false,"center",W-75);
  const leagueSuffix=options.league?"-"+String(options.league).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60):"";
  const filename=brand+"-odds-"+kit.day(data.reportDate)+leagueSuffix+".png";
  if(options.asBlob===true)return {filename,blob:await encodePng(canvas)};
  await download(canvas,filename);
  return {filename,fileCount:1,matchCount:data.matches.length,format:"png"};
 }

 // Store-only ZIP with CRC-32: exactly two separate PNG pages in one download.
 // Entire original league rows remain present, in the original order.
 function crc32(bytes){
  let n=0xffffffff;
  for(const b of bytes){n^=b;for(let k=0;k<8;k++)n=(n>>>1)^((n&1)?0xedb88320:0);}
  return (n^0xffffffff)>>>0;
 }
 async function zipPngs(files){
  if(files.length!==2)throw Error("Expected two PNG pages");
  const encoder=new TextEncoder(),chunks=[],directory=[];
  const w16=(v,p,n)=>v.setUint16(p,n,true),w32=(v,p,n)=>v.setUint32(p,n>>>0,true);
  let offset=0;
  for(const file of files){
   const name=encoder.encode(file.filename),bytes=new Uint8Array(await file.blob.arrayBuffer());
   if(!name.length||name.length>65535||bytes.length>0xffffffff)throw Error("ZIP entry size invalid");
   const crc=crc32(bytes),local=new Uint8Array(30),lv=new DataView(local.buffer);
   w32(lv,0,0x04034b50);w16(lv,4,20);w16(lv,6,0x0800);w16(lv,8,0);
   w16(lv,10,0);w16(lv,12,0x0021);w32(lv,14,crc);w32(lv,18,bytes.length);
   w32(lv,22,bytes.length);w16(lv,26,name.length);w16(lv,28,0);
   chunks.push(local,name,bytes);
   const central=new Uint8Array(46),cv=new DataView(central.buffer);
   w32(cv,0,0x02014b50);w16(cv,4,20);w16(cv,6,20);w16(cv,8,0x0800);
   w16(cv,10,0);w16(cv,12,0);w16(cv,14,0x0021);w32(cv,16,crc);
   w32(cv,20,bytes.length);w32(cv,24,bytes.length);w16(cv,28,name.length);
   w16(cv,30,0);w16(cv,32,0);w16(cv,34,0);w16(cv,36,0);
   w32(cv,38,0);w32(cv,42,offset);
   directory.push(central,name);
   offset+=local.length+name.length+bytes.length;
   if(offset>0xffffffff)throw Error("ZIP exceeds size limit");
  }
  const centralSize=directory.reduce((n,b)=>n+b.length,0),end=new Uint8Array(22);
  const ev=new DataView(end.buffer);
  w32(ev,0,0x06054b50);w16(ev,4,0);w16(ev,6,0);
  w16(ev,8,2);w16(ev,10,2);w32(ev,12,centralSize);w32(ev,16,offset);w16(ev,20,0);
  return new Blob([...chunks,...directory,end],{type:"application/zip"});
 }
 function downloadZip(blob,filename){
  const url=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=url;link.download=filename;
  document.body.appendChild(link);link.click();link.remove();
  const revokeTimer=setTimeout(()=>URL.revokeObjectURL(url),60000);
  if(typeof revokeTimer?.unref==="function")revokeTimer.unref();
 }
 async function saveOddsSmart(data,options={}){
  if(!data||!Array.isArray(data.matches)||!data.matches.length)throw Error("No selected matches");
  if(data.matches.length<=20)return saveOdds(data,options);
  const midpoint=Math.ceil(data.matches.length/2);
  const brand=window.FutureCodeBrandConfig?.id||"future-code";
  const date=K().day(data.reportDate);
  const parts=[data.matches.slice(0,midpoint),data.matches.slice(midpoint)];
  const files=[];
  for(let i=0;i<2;i++){
   const png=await saveOdds({...data,matches:parts[i]},{...options,asBlob:true});
   files.push({filename:brand+"-odds-"+date+"-part-"+String(i+1).padStart(2,"0")+".png",blob:png.blob});
  }
  const zip=await zipPngs(files);
  downloadZip(zip,brand+"-odds-"+date+"-two-pages.zip");
  return {filename:brand+"-odds-"+date+"-two-pages.zip",fileCount:2,matchCount:data.matches.length,format:"zip"};
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
 window.FutureCodeDailyExport={saveOdds,saveOddsSmart,saveResults};
})();

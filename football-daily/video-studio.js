"use strict";
/* Future Code main-site-only video studio. Uses only approved published JSON.
 * Real canvas animation + MediaRecorder; no AI API, paid backend, or fake results.
 * Output: MP4 if browser supports it, otherwise WebM. Silent slideshow.
 */
(function(){
 const MODES={results:"ဂိုးရလဒ်များ",previews:"ပွဲကြိုသုံးသပ်ချက်များ",odds:"ပေါက်ကြေးများ"};
 const LEAGUES={
  "Premier League":"အင်္ဂလန် ပရီးမီးယားလိဂ်","Championship":"အင်္ဂလန် ချန်ပီယံရှစ်",
  "Serie A":"အီတလီ စီးရီးအေ","Serie B":"အီတလီ စီးရီးဘီ",
  "La Liga":"စပိန် လာလီဂါ","La Liga 2":"စပိန် လာလီဂါ ၂",
  "Bundesliga":"ဂျာမန် ဘွန်ဒက်စ်လီဂါ","Ligue 1":"ပြင်သစ် လီဂူးဝမ်း",
  "Ligue 2":"ပြင်သစ် လိဂ် ၂","UEFA Champions League":"ချန်ပီယံလိဂ်"
 };
 const FINAL=/^\d+\s*[-:]\s*\d+$/;
 const W=1080,H=1920,BASE_FONT='"Noto Sans Myanmar",sans-serif';
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const fmt=x=>x===undefined||x===null||String(x).trim()===""?"—":String(x);
 const labelTeam=(m,part)=>fmt(m[part+"Display"]||m[part]);
 const leagueName=x=>LEAGUES[x]||x||"Football";
 const dateKey=(offset=0)=>{
  const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Yangon",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const named=Object.fromEntries(parts.filter(p=>p.type!=="literal").map(p=>[p.type,p.value]));
  const date=new Date(named.year+"-"+named.month+"-"+named.day+"T12:00:00Z");
  date.setUTCDate(date.getUTCDate()+offset);
  return date.toISOString().slice(0,10);
 };
 const validFinal=m=>m&&m.status==="finished"&&FINAL.test(String(m.finalScore||""));
 function chooseMime(){
  if(typeof MediaRecorder==="undefined")return null;
  const types=[
   'video/mp4;codecs="avc1.42E01E"','video/mp4',
   'video/webm;codecs="vp9"','video/webm;codecs="vp8"','video/webm'
  ];
  if(typeof MediaRecorder.isTypeSupported!=="function")return "";
  return types.find(type=>MediaRecorder.isTypeSupported(type))||null;
 }
 function font(ctx,size,bold=false){ctx.font=(bold?"800 ":"600 ")+size+"px "+BASE_FONT;}
 function graphemes(token){
  if(typeof Intl.Segmenter==="function")return [...new Intl.Segmenter("my",{granularity:"grapheme"}).segment(token)].map(x=>x.segment);
  return Array.from(token);
 }
 // Lossless Burmese wrapping. No analysis substring or ellipsis is discarded.
 function wrapLines(ctx,value,maxWidth,size){
  font(ctx,size);const lines=[];
  for(const paragraph of String(value||"").replace(/\r/g,"").replace(/\*\*/g,"").split("\n")){
   let line="";
   for(const token of paragraph.split(/(\s+)/u)){
    if(!token)continue;
    if(ctx.measureText(line+token).width<=maxWidth){line+=token;continue;}
    if(line.trim()){lines.push(line.trimEnd());line="";}
    if(ctx.measureText(token).width<=maxWidth){line=token.trimStart();continue;}
    for(const g of graphemes(token)){
     if(ctx.measureText(line+g).width>maxWidth&&line){lines.push(line);line="";}
     line+=g;
    }
   }
   lines.push(line.trimEnd());
  }
  return lines.length?lines:[""];
 }
 function scene(id,kind,match,seconds,other={}){
  return {id,kind,match,seconds,...other};
 }
 const TRANSITIONS={fade:"Crossfade",left:"Slide Left",right:"Slide Right",up:"Slide Up",down:"Slide Down",zoom:"Zoom Through",wipe:"Wipe",iris:"Spotlight",diagonal:"Diagonal Reveal",split:"Split Reveal"};
 const matchKey=m=>JSON.stringify([m.league||"Other",m.home||m.homeDisplay,m.away||m.awayDisplay,m.kickoffUtc||m.kickoff||""]);
 function selectMatches(matches,{league="all",leagues=null,excluded=[]}={}){
  const removed=new Set(excluded);
  return matches.filter(m=>(league==="all"||m.league===league)&&(!leagues||leagues.includes(String(m.league||"Other")))&&!removed.has(matchKey(m)));
 }
 function fitPreview(ctx,value){
  // Keep the complete article on one static match page; never paginate or scroll it.
  let size=34,lines;
  do{lines=wrapLines(ctx,value,900,size);if(lines.length*size*1.72<=928)break;size-=.5;}while(size>1);
  return {lines,fontSize:size,lineHeight:size*1.72};
 }
 function buildScenes(mode,matches,ctx,options={}){
  const {pace="normal"}=options;
  const factor=pace==="slow"?1.5:pace==="fast"?.75:1;
  const scenes=[];let next=0;
  const filtered=selectMatches(matches,options);
  if(mode==="results"){
   for(const m of filtered.filter(validFinal))scenes.push(scene(++next,"result",m,5.2*factor));
  }else if(mode==="previews"){
   for(const m of filtered.filter(m=>String(m.dailyPreviewText||"").trim())){
    const fitted=fitPreview(ctx,m.dailyPreviewText);
    // Reading time grows with the complete article, including Burmese without spaces.
    const reading=Math.max(16,graphemes(m.dailyPreviewText).length/18);
    scenes.push(scene(++next,"preview",m,reading*factor,fitted));
   }
  }else if(mode==="odds"){
   const groups=new Map();
   for(const m of filtered){
    const key=String(m.league||"Other");
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(m);
   }
   for(const [,list] of groups){
    for(const m of list)scenes.push(scene(++next,"odds",m,5.7*factor));
   }
  }
  return scenes;
 }
 function panel(ctx,x,y,w,h,fill,r=24){
  ctx.fillStyle=fill;ctx.beginPath();
  if(typeof ctx.roundRect==="function")ctx.roundRect(x,y,w,h,r);
  else ctx.rect(x,y,w,h);
  ctx.fill();
 }
 function text(ctx,str,x,y,size=35,color="#f5f7f0",align="left",bold=false,maxWidth){
  font(ctx,size,bold);ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline="middle";
  if(maxWidth)ctx.fillText(fmt(str),x,y,maxWidth);
  else ctx.fillText(fmt(str),x,y);
 }
 function line(ctx,x,y,w,color="#44605b"){ctx.fillStyle=color;ctx.fillRect(x,y,w,2);}
 function cropName(ctx,name,maxWidth,size){
  font(ctx,size,true);return String(name||"—"); // Text drawing uses fillText(maxWidth), not truncation.
 }
 function wdl(m){
  const a=Array.isArray(m)?m.slice(0,5):[];
  return Array.from({length:5},(_,i)=>{
   const g=a[i];if(!g||!Number.isInteger(g.teamGoals)||!Number.isInteger(g.opponentGoals))return "–";
   return g.teamGoals>g.opponentGoals?"W":g.teamGoals<g.opponentGoals?"L":"D";
  });
 }
 function form(ctx,arr,x,y){
  for(let i=0;i<arr.length;i++){
   const v=arr[i],color=v==="W"?"#26996b":v==="D"?"#297cc1":v==="L"?"#c95057":"#64716b";
   panel(ctx,x+i*80,y,65,65,color,20);
   text(ctx,v,x+i*80+32,y+34,27,"#ffffff","center",true);
  }
 }
 const crestCache=new Map();
 function safeImg(url){
  try{const u=new URL(url);return u.protocol==="https:"?u.href:null}catch{return null}
 }
 async function preloadImages(scenes){
  const urls=new Set();
  for(const s of scenes){
   if(s.match){for(const key of ["homeCrestUrl","awayCrestUrl"]){
    const url=safeImg(s.match[key]);if(url)urls.add(url);
   }}
  }
  const load=url=>new Promise(resolve=>{
   const img=new Image();let done=false;
   const timer=setTimeout(()=>{if(!done){done=true;resolve(null)}},3500);
   img.crossOrigin="anonymous";
   img.onload=()=>{if(!done){done=true;clearTimeout(timer);resolve(img)}};
   img.onerror=()=>{if(!done){done=true;clearTimeout(timer);resolve(null)}};
   img.src=url;
  });
  await Promise.all([...urls].map(async u=>crestCache.set(u,await load(u))));
 }
 function crest(ctx,url,name,x,y,size=190){
  const found=crestCache.get(safeImg(url));
  if(found&&found.naturalWidth&&found.naturalHeight){
   const k=Math.min(size/found.naturalWidth,size/found.naturalHeight);
   const w=found.naturalWidth*k,h=found.naturalHeight*k;
   try{ctx.drawImage(found,x+(size-w)/2,y+(size-h)/2,w,h);return}catch(_){}
  }
  panel(ctx,x+20,y+20,size-40,size-40,"#385753",40);
  text(ctx,String(name||"FC").slice(0,2),x+size/2,y+size/2,45,"#fff7dd","center",true);
 }
 function background(ctx,t){
  const g=ctx.createLinearGradient(0,0,W,H);
  g.addColorStop(0,"#09171b");g.addColorStop(.52,"#193332");g.addColorStop(1,"#071117");
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.save();ctx.strokeStyle="rgba(255,201,135,.08)";ctx.lineWidth=2;
  const shift=(t*32)%105;
  for(let x=-H;x<W+H;x+=105){
   ctx.beginPath();ctx.moveTo(x+shift,0);ctx.lineTo(x+H*.35+shift,H);ctx.stroke();
  }
  ctx.restore();
  const bloom=ctx.createRadialGradient(W*.8,H*.13,15,W*.8,H*.13,570);
  bloom.addColorStop(0,"rgba(255,169,86,.16)");
  bloom.addColorStop(1,"rgba(255,169,86,0)");
  ctx.fillStyle=bloom;ctx.fillRect(0,0,W,H);
  ctx.save();ctx.strokeStyle="rgba(160,220,200,.07)";ctx.lineWidth=3;
  ctx.strokeRect(42,290,996,1460);ctx.beginPath();ctx.moveTo(42,1020);ctx.lineTo(1038,1020);ctx.stroke();
  ctx.beginPath();ctx.arc(540,1020,145,0,Math.PI*2);ctx.stroke();ctx.restore();
  ctx.fillStyle="#ffb06e";ctx.fillRect(0,0,W,13);
 }
 function titleHeader(ctx,kind,date,frame,total){
  text(ctx,"FUTURE CODE",65,86,32,"#ffc38e","left",true);
  text(ctx,"FOOTBALL DAILY",65,137,22,"#c8d7d0");
  text(ctx,date,1015,112,25,"#ccd6d0","right");
  line(ctx,65,176,950,"#4c6660");
  text(ctx,kind,65,241,39,"#ffbd76","left",true,820);
  text(ctx,String(frame)+"/"+String(total),1015,241,25,"#c9ddd3","right");
 }
 function teamHeader(ctx,m){
  const home=labelTeam(m,"home"),away=labelTeam(m,"away");
  crest(ctx,m.homeCrestUrl,home,95,350,215);
  crest(ctx,m.awayCrestUrl,away,770,350,215);
  text(ctx,"VS",540,449,100,"#ffffff","center",true);
  text(ctx,home,240,608,33,"#fff3d8","center",true,360);
  text(ctx,away,840,608,33,"#fff3d8","center",true,360);
 }
 function baseFooter(ctx,t,idx,total){
  line(ctx,62,1800,956,"#5a7068");
  text(ctx,"FUTURE CODE FOOTBALL",65,1842,20,"#b4cbc0");
  text(ctx,"FC",1010,1841,24,"#ffba78","right",true);
  const width=950,totalWidth=Math.max(1,total);
  ctx.fillStyle="#47605e";ctx.fillRect(65,1874,width,7);
  ctx.fillStyle="#ffae70";ctx.fillRect(65,1874,width*Math.min(1,(idx+t)/totalWidth),7);
 }
 function renderScene(ctx,s,t,idx,total,date){
  background(ctx,t+idx);
  const heading=s.kind==="result"?"ဂိုးရလဒ်များ":s.kind==="odds"?"ပေါက်ကြေးများ":
   s.kind==="league"?"လိဂ်အလိုက် ပေါက်ကြေးများ":"ပွဲကြိုသုံးသပ်ချက်များ";
  titleHeader(ctx,heading,date,idx+1,total);
  if(s.kind==="league"){
   panel(ctx,66,350,948,1120,"rgba(17,39,40,.9)");
   text(ctx,"◈",540,690,140,"#ffbf84","center",true);
   const parts=wrapLines(ctx,leagueName(s.league),850,60);
   for(let i=0;i<Math.min(parts.length,4);i++)text(ctx,parts[i],540,900+i*105,58,"#ffffff","center",true,875);
   text(ctx,s.count+" ပွဲ",540,1310,45,"#ffd1a1","center",true);
  }else if(s.match){
   const m=s.match;
   if(s.kind!=="preview")teamHeader(ctx,m);
   if(s.kind==="result"){
    panel(ctx,128,760,824,510,"rgba(13,32,33,.9)");
    text(ctx,"FULL TIME • အတည်ပြုပြီး",540,846,36,"#ffc088","center",true);
    text(ctx,m.finalScore,540,1065,175,"#ffffff","center",true);
    text(ctx,leagueName(m.league),540,1370,30,"#d8dfd5","center",false,895);
    text(ctx,m.kickoffYangon||"",540,1450,30,"#afc7be","center",false,895);
   }else if(s.kind==="odds"){
    panel(ctx,78,750,924,855,"rgba(13,32,33,.92)");
    text(ctx,leagueName(m.league),540,832,35,"#ffcf92","center",true,840);
    text(ctx,m.kickoffDisplay||m.kickoffYangon||m.kickoff||"",540,912,31,"#dae8df","center");
    const fields=[
     ["အပေါ်အသင်း",m.upperTeam],
     ["ဘော်ဒီကြေး",m.bodyOdds],
     ["ဂိုးပေါင်းကြေး",m.goalTotalOdds],
     ["အင်တာနက်ခန့်မှန်း",m.pdfLastColumn]
    ];
    for(let i=0;i<fields.length;i++){
     const x=115+(i%2)*430,y=1033+Math.floor(i/2)*220;
     panel(ctx,x,y,410,190,"#213e3d",18);
     text(ctx,fields[i][0],x+23,y+54,27,"#f2b47a","left",true,370);
     text(ctx,fmt(fields[i][1]),x+23,y+126,38,"#ffffff","left",true,370);
    }
   }else if(s.kind==="preview"){
    // Compact broadcast scoreboard leaves the full lower panel for the entire article.
    panel(ctx,54,300,972,280,"rgba(13,32,33,.94)");
    crest(ctx,m.homeCrestUrl,labelTeam(m,"home"),88,325,138);
    crest(ctx,m.awayCrestUrl,labelTeam(m,"away"),854,325,138);
    text(ctx,leagueName(m.league),540,349,25,"#ffd09b","center",true,600);
    text(ctx,"VS",540,413,62,"#ffffff","center",true);
    text(ctx,labelTeam(m,"home"),297,520,29,"#ffffff","center",true,430);
    text(ctx,labelTeam(m,"away"),783,520,29,"#ffffff","center",true,430);
    panel(ctx,54,596,972,120,"#193c3c");
    ctx.save();ctx.translate(78,625);ctx.scale(.48,.48);form(ctx,wdl(m.homeLastFive),0,0);ctx.restore();
    ctx.save();ctx.translate(808,625);ctx.scale(.48,.48);form(ctx,wdl(m.awayLastFive),0,0);ctx.restore();
    text(ctx,"1   "+fmt(m.homeOdds)+"     X   "+fmt(m.drawOdds)+"     2   "+fmt(m.awayOdds),540,650,25,"#fff2d9","center",true,510);
    const odds=m.myanmarOdds||{};
    text(ctx,"အပေါ်အသင်း: "+fmt(odds.upperTeam)+"    ဘော်ဒီ: "+fmt(odds.bodyOdds)+"    ဂိုးပေါင်း: "+fmt(odds.goalTotalOdds),540,695,20,"#ffd09b","center",false,910);
    panel(ctx,54,734,972,1040,"rgba(9,29,30,.96)");
    text(ctx,"ပွဲကြိုသုံးသပ်ချက်",90,784,30,"#ffbf83","left",true);
    let y=838+s.lineHeight/2;
    for(const row of s.lines){
     if(row)text(ctx,row,90,y,s.fontSize,"#f3f6ee","left",false);
     y+=s.lineHeight;
    }
   }
  }
  baseFooter(ctx,t,idx,total);
 }
 function locate(scenes,seconds){
  let elapsed=0;
  for(let i=0;i<scenes.length;i++){
   if(seconds<elapsed+scenes[i].seconds||i===scenes.length-1)
    return {index:i,local:Math.max(0,seconds-elapsed),start:elapsed};
   elapsed+=scenes[i].seconds;
  }
  return {index:0,local:0,start:0};
 }
 const ease=x=>1-Math.pow(1-x,3);
 function frame(ctx,scenes,seconds,date,effect="fade"){
  const p=locate(scenes,seconds),s=scenes[p.index],transition=.85;
  const progress=Math.max(0,Math.min(1,p.local/s.seconds));
  const slide=Math.min(1,Math.max(0,(p.local-(s.seconds-transition))/transition));
  ctx.clearRect(0,0,W,H);
  const draw=(which,amount)=>renderScene(ctx,scenes[which],amount,which,scenes.length,date);
  if(slide>0&&p.index+1<scenes.length){
   const a=ease(slide),next=p.index+1;
   if(["left","right","up","down"].includes(effect)){
    const dx=effect==="left"?-W:effect==="right"?W:0;
    const dy=effect==="up"?-H:effect==="down"?H:0;
    ctx.save();ctx.translate(dx*a,dy*a);draw(p.index,progress);ctx.restore();
    ctx.save();ctx.translate(-dx*(1-a),-dy*(1-a));draw(next,0);ctx.restore();
   }else{
    draw(p.index,progress);ctx.save();
    if(effect==="wipe"){
     ctx.beginPath();ctx.rect(0,0,W*a,H);ctx.clip();
    }else if(effect==="iris"){
     ctx.beginPath();ctx.arc(W/2,H/2,Math.hypot(W,H)*a/2,0,Math.PI*2);ctx.clip();
    }else if(effect==="diagonal"){
     const d=(W+H)*a;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(d,0);ctx.lineTo(0,d);ctx.closePath();ctx.clip();
    }else if(effect==="split"){
     ctx.beginPath();ctx.rect(W/2-W*a/2,0,W*a,H);ctx.clip();
    }else if(effect==="zoom"){
     ctx.globalAlpha=a;const scale=1.18-.18*a;
     ctx.translate(W/2,H/2);ctx.scale(scale,scale);ctx.translate(-W/2,-H/2);
    }else ctx.globalAlpha=a;
    draw(next,0);ctx.restore();
   }
  }else draw(p.index,progress);
  return p.index;
 }
 async function fetchJson(url){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{
   const response=await fetch(new URL(url,document.baseURI),{cache:"no-store",signal:controller.signal});
   if(!response.ok)throw Error("Data HTTP "+response.status);
   return await response.json();
  }finally{clearTimeout(timer)}
 }
 async function readData(mode){
  const key=dateKey();
  if(mode==="results"){
   const yesterday=dateKey(-1),r=await fetchJson("./data/archive/"+yesterday+".json");
   if(r.reportDate!==yesterday||!Array.isArray(r.matches))throw Error("မနေ့က Result ဒေတာ မရသေးပါ");
   return {date:yesterday,matches:r.matches.filter(validFinal)};
  }
  if(mode==="previews"){
   const r=await fetchJson("./data/today.json");
   if(r.reportDate!==key||r.published!==true||r.fixtureSnapshot||!Array.isArray(r.matches))
    throw Error("ဒီနေ့ Approved Preview ဒေတာ မတင်ရသေးပါ");
   return {date:key,matches:r.matches.filter(m=>String(m.dailyPreviewText||"").trim())};
  }
  const r=await fetchJson("./data/odds/"+key+".json");
  if(r.reportDate!==key||!Array.isArray(r.matches))throw Error("ဒီနေ့ ပေါက်ကြေးဒေတာ မရသေးပါ");
  return {date:key,matches:r.matches};
 }
 async function init(){
  const root=document.getElementById("fcVideoStudio");
  if(!root||document.documentElement.hasAttribute("data-football-brand-name"))return;
  const get=id=>document.getElementById(id);
  const canvas=get("fcVideoCanvas"),ctx=canvas.getContext("2d");
  const mode=get("fcVideoMode"),leagueWrap=get("fcVideoLeagueWrap");
  const leagueList=get("fcVideoLeague"),matchList=get("fcVideoMatches"),effect=get("fcVideoTransition");
  const quality=get("fcVideoQuality"),pace=get("fcVideoPace");
  const previewBtn=get("fcVideoPreview"),downloadBtn=get("fcVideoDownload"),stopBtn=get("fcVideoStop");
  const status=get("fcVideoStatus"),info=get("fcVideoInfo");
  let active=false,cancel=false,lastScene=null,lastData=null,stopCurrent=null,previewRaf=0,loadVersion=0;
  let selectedLeagues=new Set(),excludedMatches=new Set(),loadedMode=null;
  const message=value=>{status.textContent=value};
  const setBusy=busy=>{
   active=busy;previewBtn.disabled=busy;downloadBtn.disabled=busy;
   [mode,quality,pace,effect,...root.querySelectorAll(".fc-video-selection input,.fc-video-selection button")].forEach(el=>el.disabled=busy);
   stopBtn.hidden=!busy;
  };
  function applySize(){
   const factor=quality.value==="hd"?1:2/3;
   canvas.width=Math.round(W*factor);canvas.height=Math.round(H*factor);
   ctx.setTransform(factor,0,0,factor,0,0);
  }
  const stopPreview=()=>{if(previewRaf)cancelAnimationFrame(previewRaf);previewRaf=0;};
  function showMatches(){
   matchList.replaceChildren();
   for(const m of (lastData?.matches||[]).filter(m=>selectedLeagues.has(String(m.league||"Other")))){
    const label=document.createElement("label"),input=document.createElement("input");
    input.type="checkbox";input.checked=!excludedMatches.has(matchKey(m));
    input.addEventListener("change",()=>{stopPreview();if(input.checked)excludedMatches.delete(matchKey(m));else excludedMatches.add(matchKey(m));});
    label.append(input,document.createTextNode(labelTeam(m,"home")+" — "+labelTeam(m,"away")));matchList.append(label);
   }
  }
  function fillLeague(matches){
   leagueList.replaceChildren();
   for(const name of [...new Set(matches.map(m=>String(m.league||"Other")))]){
    const label=document.createElement("label"),input=document.createElement("input");
    input.type="checkbox";input.checked=selectedLeagues.has(name);
    input.addEventListener("change",()=>{stopPreview();if(input.checked)selectedLeagues.add(name);else selectedLeagues.delete(name);showMatches();});
    label.append(input,document.createTextNode(leagueName(name)));leagueList.append(label);
   }
   showMatches();
  }
  async function updateMode(){
   stopPreview();const version=++loadVersion;loadedMode=null;lastData=null;
   leagueWrap.hidden=false;leagueList.textContent="ဒေတာ ရယူနေပါတယ်…";matchList.replaceChildren();
   previewBtn.disabled=true;downloadBtn.disabled=true;
   try{
    const chosenMode=mode.value,data=await readData(chosenMode);
    if(version!==loadVersion)return;
    lastData=data;loadedMode=chosenMode;selectedLeagues=new Set(data.matches.map(m=>String(m.league||"Other")));excludedMatches.clear();
    fillLeague(data.matches);message(data.matches.length+" ပွဲ ရရှိပါပြီ။ လိဂ်နှင့် ပွဲများကို ရွေးနိုင်ပါပြီ။");
   }catch(e){if(version===loadVersion){leagueList.textContent="";message(e.message||"ဒေတာ မရသေးပါ");}}
   finally{if(version===loadVersion){previewBtn.disabled=false;downloadBtn.disabled=false;}}
  }
  mode.addEventListener("change",updateMode);
  [quality,pace,effect].forEach(el=>el.addEventListener("change",()=>{stopPreview();if(lastScene){applySize();frame(ctx,lastScene.scenes,0,lastScene.date,effect.value);}}));
  get("fcVideoSelectAll").addEventListener("click",()=>{stopPreview();selectedLeagues=new Set((lastData?.matches||[]).map(m=>String(m.league||"Other")));excludedMatches.clear();fillLeague(lastData?.matches||[]);});
  get("fcVideoSelectNone").addEventListener("click",()=>{stopPreview();selectedLeagues.clear();fillLeague(lastData?.matches||[]);});
  async function prepare(){
   applySize();message("Published data ကို ရယူနေပါတယ်…");
   stopPreview();
   if(loadedMode!==mode.value||!lastData)throw Error("ဒေတာပြည့်စုံအောင် စောင့်ပြီး ပြန်ရွေးပါ");
   const data=lastData;
   await Promise.race([document.fonts?.ready||Promise.resolve(),sleep(2000)]);
   const scenes=buildScenes(mode.value,data.matches,ctx,{leagues:[...selectedLeagues],excluded:[...excludedMatches],pace:pace.value});
   if(!scenes.length)throw Error("ရွေးထားတဲ့ အမျိုးအစားအတွက် အတည်ပြုဒေတာ မရှိသေးပါ");
   message("အသင်းလိုဂိုများကို ပြင်ဆင်နေပါတယ်…");
   await preloadImages(scenes);
   lastScene={scenes,date:data.date};lastData=data;
   frame(ctx,scenes,0,data.date,effect.value);
   const duration=scenes.reduce((sum,s)=>sum+s.seconds,0);
   info.textContent=scenes.length+" ပွဲ · "+scenes.length+" Slide · "+Math.ceil(duration)+" စက္ကန့် · "+
    (quality.value==="hd"?"1080×1920":"720×1280")+" · အသံမပါ";
   return lastScene;
  }
  previewBtn.addEventListener("click",async()=>{
   if(active)return;setBusy(true);
   try{
    const data=await prepare(),demo=data.scenes.map(s=>({...s,seconds:5})),duration=demo.length*5;let start=null;
    const play=time=>{if(start===null)start=time;frame(ctx,demo,((time-start)/1000)%duration,data.date,effect.value);previewRaf=requestAnimationFrame(play);};
    previewRaf=requestAnimationFrame(play);message("Video နမူနာ ပြနေပါတယ်။ Video Download ကို နှိပ်နိုင်ပါပြီ။");
   }
   catch(e){console.error("Video preview error",e);message(e.message||"ဒေတာရယူမှု မအောင်မြင်ပါ");}
   finally{setBusy(false)}
  });
  stopBtn.addEventListener("click",()=>{
   cancel=true;stopBtn.disabled=true;message("Recording ရပ်နေပါတယ်…");
   if(stopCurrent)stopCurrent();
  });
  downloadBtn.addEventListener("click",async()=>{
   if(active)return;
   setBusy(true);stopBtn.disabled=false;cancel=false;let stream=null,recordingRaf=0,ended=false;
   try{
    const mime=chooseMime();
    if(mime===null||typeof canvas.captureStream!=="function")
     throw Error("ဒီ Browser မှာ Video Recording မပံ့ပိုးပါ။ Desktop Chrome/Edge နဲ့ ပြန်ဖွင့်ပါ။");
    const data=await prepare();
    if(cancel){message("Video ဖန်တီးမှု ရပ်ပြီးပါပြီ။");return}
    stream=canvas.captureStream(30);
    const options={videoBitsPerSecond:quality.value==="hd"?10000000:5000000};
    if(mime)options.mimeType=mime;
    const recorder=new MediaRecorder(stream,options),chunks=[];
    const recording=new Promise((resolve,reject)=>{
     recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
     recorder.onerror=e=>reject(e.error||Error("Video recorder failed"));
     recorder.onstop=()=>resolve(new Blob(chunks,{type:recorder.mimeType||mime||"video/webm"}));
    });
    stopCurrent=()=>{if(recorder.state!=="inactive")recorder.stop()};
    recorder.start(1000);
    const total=data.scenes.reduce((sum,s)=>sum+s.seconds,0);
    let started=null,lastSecond=-1;
    const animate=time=>{
     if(ended)return;
     if(started===null)started=time;
     const elapsed=Math.min(total,(time-started)/1000);
     const i=frame(ctx,data.scenes,elapsed,data.date,effect.value);
     if(Math.floor(elapsed)!==lastSecond){lastSecond=Math.floor(elapsed);message("Video ဖန်တီးနေပါတယ် — Slide "+(i+1)+"/"+data.scenes.length+" · "+lastSecond+"/"+Math.ceil(total)+" sec");}
     if(cancel||elapsed>=total){
      ended=true;
      // Allow the last frame to be included before stopping.
      setTimeout(()=>stopCurrent?.(),180);
     }else recordingRaf=requestAnimationFrame(animate);
    };
    recordingRaf=requestAnimationFrame(animate);
    const blob=await recording;
    ended=true;
    if(cancel){message("Recording ရပ်ပြီးပါပြီ။ Download မလုပ်ထားပါ။");return}
    if(!blob.size)throw Error("Video ဖိုင် ဗလာဖြစ်နေပါတယ်");
    const recordedType=recorder.mimeType||mime||"";
    const extension=recordedType.includes("mp4")?"mp4":"webm";
    const filename="future-code-"+mode.value+"-"+data.date+"."+extension;
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    message("✓ "+filename+" Download စတင်ပြီးပါပြီ");
   }catch(e){console.error("Football video export",e);message("Video မအောင်မြင်ပါ — "+(e.message||String(e)));}
   finally{
    ended=true;if(recordingRaf)cancelAnimationFrame(recordingRaf);
    if(stream)stream.getTracks().forEach(t=>t.stop());
    stopCurrent=null;setBusy(false);
   }
  });
  applySize();renderScene(ctx,{kind:"league",league:"Future Code",count:3},0,0,1,dateKey());
  updateMode();
 }
 window.FutureCodeVideoStudio={dateKey,validFinal,wrapLines,buildScenes,chooseMime,frame,readData,matchKey,selectMatches,fitPreview,TRANSITIONS};
 if(typeof document!=="undefined"&&document.getElementById("fcVideoStudio"))init();
})();

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
 function buildScenes(mode,matches,ctx,{league="all",pace="normal"}={}){
  const factor=pace==="slow"?1.5:pace==="fast"?.75:1;
  const scenes=[];let next=0;
  if(mode==="results"){
   for(const m of matches.filter(validFinal))scenes.push(scene(++next,"result",m,5.2*factor));
  }else if(mode==="previews"){
   for(const m of matches.filter(m=>String(m.dailyPreviewText||"").trim())){
    scenes.push(scene(++next,"previewOverview",m,5.8*factor));
    const paragraphs=wrapLines(ctx,m.dailyPreviewText,880,34);
    const perPage=12;
    for(let i=0;i<paragraphs.length;i+=perPage){
     scenes.push(scene(++next,"previewText",m,9*factor,{
      lines:paragraphs.slice(i,i+perPage),
      page:Math.floor(i/perPage)+1,pages:Math.ceil(paragraphs.length/perPage)
     }));
    }
   }
  }else if(mode==="odds"){
   const filtered=league==="all"?matches:matches.filter(m=>m.league===league);
   const groups=new Map();
   for(const m of filtered){
    const key=String(m.league||"Other");
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(m);
   }
   for(const [name,list] of groups){
    scenes.push(scene(++next,"league",null,2.8*factor,{league:name,count:list.length}));
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
  ctx.fillStyle="#ffb06e";ctx.fillRect(0,0,W,13);
 }
 function titleHeader(ctx,kind,date,frame,total){
  text(ctx,"FUTURE CODE",65,86,32,"#ffc38e","left",true);
  text(ctx,"FOOTBALL VIDEO STUDIO",65,137,22,"#c8d7d0");
  text(ctx,date,1015,112,25,"#ccd6d0","right");
  line(ctx,65,176,950,"#4c6660");
  text(ctx,kind,65,241,39,"#ffbd76","left",true,940);
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
  text(ctx,"မြန်မာစံတော်ချိန်  •  Published Data",65,1842,20,"#b4cbc0");
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
   teamHeader(ctx,m);
   if(s.kind==="result"){
    panel(ctx,128,760,824,510,"rgba(13,32,33,.9)");
    text(ctx,"FULL TIME • အတည်ပြုပြီး",540,846,36,"#ffc088","center",true);
    text(ctx,m.finalScore,540,1065,175,"#ffffff","center",true);
    text(ctx,leagueName(m.league),540,1370,30,"#d8dfd5","center",false,895);
    text(ctx,m.kickoffYangon||"",540,1450,30,"#afc7be","center",false,895);
   }else if(s.kind==="odds"){
    panel(ctx,78,750,924,855,"rgba(13,32,33,.92)");
    text(ctx,leagueName(m.league),540,832,35,"#ffcf92","center",true,840);
    text(ctx,m.kickoffDisplay||m.kickoff||"",540,912,31,"#dae8df","center");
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
    text(ctx,"ခန့်မှန်းချက်သည် ပွဲပြီးရလဒ် မဟုတ်ပါ",540,1554,23,"#b5c6c1","center");
   }else if(s.kind==="previewOverview"){
    panel(ctx,72,710,936,990,"rgba(13,32,33,.94)");
    text(ctx,leagueName(m.league),540,785,29,"#ffca91","center",true,870);
    text(ctx,m.kickoffYangon||"",540,848,26,"#d6e8dd","center");
    text(ctx,"နောက်ဆုံး ၅ ပွဲ",540,970,32,"#ffc18c","center",true);
    form(ctx,wdl(m.homeLastFive),137,1035);
    form(ctx,wdl(m.awayLastFive),545,1035);
    text(ctx,"ပွဲပြီး 1X2 ကြေး",540,1205,32,"#ffbe88","center",true);
    const prices=[["အိမ်ရှင် (1)",m.homeOdds],["သရေ (X)",m.drawOdds],["ဧည့်သည် (2)",m.awayOdds]];
    for(let i=0;i<3;i++){
     const x=105+i*294;
     panel(ctx,x,1260,278,170,"#254240",16);
     text(ctx,prices[i][0],x+139,1310,24,"#d6e7d9","center");
     text(ctx,fmt(prices[i][1]),x+139,1373,34,"#ffffff","center",true);
    }
    const odds=m.myanmarOdds||{};
    text(ctx,"မြန်မာကြေး",115,1505,28,"#ffca90","left",true);
    text(ctx,"ဘော်ဒီ: "+fmt(odds.bodyOdds)+"   ဂိုးပေါင်း: "+fmt(odds.goalTotalOdds),115,1567,25,"#e2ece4","left",true,845);
    text(ctx,"အပေါ်အသင်း: "+fmt(odds.upperTeam),115,1620,25,"#d2e2d7","left",false,845);
   }else if(s.kind==="previewText"){
    panel(ctx,66,715,948,1015,"rgba(9,29,30,.96)");
    text(ctx,"ပွဲကြိုသုံးသပ်ချက်",110,787,36,"#ffbf83","left",true);
    text(ctx,"စာမျက်နှာ "+s.page+" / "+s.pages,972,791,23,"#c7d7ce","right");
    // Lines are prewrapped with text metrics. They are never cut or ellipsized.
    let y=870;
    for(const row of s.lines){
     if(row)text(ctx,row,110,y,34,"#f3f6ee","left",false,855);
     y+=65;
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
 function frame(ctx,scenes,seconds,date){
  const p=locate(scenes,seconds),s=scenes[p.index],transition=0.75;
  const progress=Math.max(0,Math.min(1,p.local/s.seconds));
  const slide=Math.min(1,Math.max(0,(p.local-(s.seconds-transition))/transition));
  ctx.clearRect(0,0,W,H);
  if(slide>0&&p.index+1<scenes.length){
   const a=ease(slide);
   ctx.save();ctx.translate(-W*a,0);renderScene(ctx,s,progress,p.index,scenes.length,date);ctx.restore();
   ctx.save();ctx.translate(W*(1-a),0);renderScene(ctx,scenes[p.index+1],0,p.index+1,scenes.length,date);ctx.restore();
  }else renderScene(ctx,s,progress,p.index,scenes.length,date);
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
  const mode=get("fcVideoMode"),league=get("fcVideoLeague"),leagueWrap=get("fcVideoLeagueWrap");
  const quality=get("fcVideoQuality"),pace=get("fcVideoPace");
  const previewBtn=get("fcVideoPreview"),downloadBtn=get("fcVideoDownload"),stopBtn=get("fcVideoStop");
  const status=get("fcVideoStatus"),info=get("fcVideoInfo");
  let active=false,cancel=false,lastScene=null,lastData=null,stopCurrent=null;
  const message=value=>{status.textContent=value};
  const setBusy=busy=>{
   active=busy;previewBtn.disabled=busy;downloadBtn.disabled=busy;
   [mode,league,quality,pace].forEach(el=>el.disabled=busy);
   stopBtn.hidden=!busy;
  };
  function applySize(){
   const factor=quality.value==="hd"?1:2/3;
   canvas.width=Math.round(W*factor);canvas.height=Math.round(H*factor);
   ctx.setTransform(factor,0,0,factor,0,0);
  }
  function updateMode(){
   leagueWrap.hidden=mode.value!=="odds";
   info.textContent="Browser ထဲမှာ Offline Video Render လုပ်ပါတယ်။ Audio မပါပါ။ Recording အချိန်ဟာ Video ကြာချိန်နီးပါး လိုအပ်ပြီး Tab ကို ဖွင့်ထားရပါမယ်။";
  }
  mode.addEventListener("change",updateMode);
  quality.addEventListener("change",()=>{applySize();if(lastScene)frame(ctx,lastScene.scenes,0,lastScene.date)});
  function fillLeague(matches){
   const selected=league.value;
   league.replaceChildren();
   const all=document.createElement("option");all.value="all";all.textContent="လိဂ်အားလုံး";league.appendChild(all);
   for(const name of [...new Set(matches.map(m=>String(m.league||"Other")))]){
    const option=document.createElement("option");option.value=name;option.textContent=leagueName(name);league.appendChild(option);
   }
   if([...league.options].some(o=>o.value===selected))league.value=selected;
  }
  async function prepare(){
   applySize();message("Published data ကို ရယူနေပါတယ်…");
   const data=await readData(mode.value);
   if(mode.value==="odds")fillLeague(data.matches);
   const scenes=buildScenes(mode.value,data.matches,ctx,{league:league.value,pace:pace.value});
   if(!scenes.length)throw Error("ရွေးထားတဲ့ အမျိုးအစားအတွက် အတည်ပြုဒေတာ မရှိသေးပါ");
   await Promise.race([document.fonts?.ready||Promise.resolve(),sleep(2000)]);
   message("အသင်းလိုဂိုများကို ပြင်ဆင်နေပါတယ်…");
   await preloadImages(scenes);
   lastScene={scenes,date:data.date};lastData=data;
   frame(ctx,scenes,0,data.date);
   const duration=scenes.reduce((sum,s)=>sum+s.seconds,0);
   info.textContent=data.matches.length+" ပွဲ · "+scenes.length+" Slide · "+Math.ceil(duration)+" စက္ကန့် · "+
    (quality.value==="hd"?"1080×1920":"720×1280")+" · အသံမပါ";
   return lastScene;
  }
  previewBtn.addEventListener("click",async()=>{
   if(active)return;setBusy(true);
   try{await prepare();message("နမူနာ Slide ပြထားပါတယ်။ Video Download ကို နှိပ်နိုင်ပါပြီ။");}
   catch(e){console.error("Video preview error",e);message(e.message||"ဒေတာရယူမှု မအောင်မြင်ပါ");}
   finally{setBusy(false)}
  });
  stopBtn.addEventListener("click",()=>{
   cancel=true;stopBtn.disabled=true;message("Recording ရပ်နေပါတယ်…");
   if(stopCurrent)stopCurrent();
  });
  downloadBtn.addEventListener("click",async()=>{
   if(active)return;
   setBusy(true);stopBtn.disabled=false;cancel=false;let stream=null;
   try{
    const mime=chooseMime();
    if(mime===null||typeof canvas.captureStream!=="function")
     throw Error("ဒီ Browser မှာ Video Recording မပံ့ပိုးပါ။ Desktop Chrome/Edge နဲ့ ပြန်ဖွင့်ပါ။");
    const data=await prepare();
    stream=canvas.captureStream(24);
    const options={videoBitsPerSecond:quality.value==="hd"?7500000:3800000};
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
    let started=null,ended=false;
    const animate=time=>{
     if(ended)return;
     if(started===null)started=time;
     const elapsed=Math.min(total,(time-started)/1000);
     const i=frame(ctx,data.scenes,elapsed,data.date);
     message("Video ဖန်တီးနေပါတယ် — Slide "+(i+1)+"/"+data.scenes.length+" · "+Math.floor(elapsed)+"/"+Math.ceil(total)+" sec");
     if(cancel||elapsed>=total){
      ended=true;
      // Allow the last frame to be included before stopping.
      setTimeout(()=>stopCurrent?.(),180);
     }else requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    const blob=await recording;
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
    if(stream)stream.getTracks().forEach(t=>t.stop());
    stopCurrent=null;setBusy(false);
   }
  });
  updateMode();applySize();renderScene(ctx,{kind:"league",league:"Future Code",count:3},0,0,1,dateKey());
  message("Video အမျိုးအစားရွေးပြီး နမူနာကြည့်ရန် သို့မဟုတ် Download ကိုနှိပ်ပါ။");
 }
 window.FutureCodeVideoStudio={dateKey,validFinal,wrapLines,buildScenes,chooseMime,frame,readData};
 if(typeof document!=="undefined"&&document.getElementById("fcVideoStudio"))init();
})();

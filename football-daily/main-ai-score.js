"use strict";
/* Future Code MAIN homepage only. No mirror template imports this feature. */
(function(){
 if(!["/","/index.html"].includes(location.pathname))return;
 const section=document.getElementById("fcAiScoreSection");
 const model=window.FutureCodeAiScoreModel;
 if(!section||!model)return;
 const groups=document.getElementById("fcAiScoreGroups");
 const filter=document.getElementById("fcAiScoreLeague");
 const status=document.getElementById("fcAiScoreStatus");
 const count=document.getElementById("fcAiScoreCount");
 const leagueNames={
  "Premier League":"အင်္ဂလန် ပရီးမီးယားလိဂ်","Championship":"အင်္ဂလန် ချန်ပီယံရှစ်",
  "League One":"အင်္ဂလန် လိဂ်ဝမ်း","La Liga":"စပိန် လာလီဂါ","La Liga 2":"စပိန် လာလီဂါ ၂",
  "Serie A":"အီတလီ စီးရီးအေ","Serie B":"အီတလီ စီးရီးဘီ","Bundesliga":"ဂျာမနီ ဘွန်ဒက်စ်လီဂါ",
  "2. Bundesliga":"ဂျာမနီ ဘွန်ဒက်စ်လီဂါ ၂","Ligue 1":"ပြင်သစ် လီဂူးဝမ်း",
  "Ligue 2":"ပြင်သစ် လီဂူး ၂","FA Cup":"FA ဖလား","EFL Cup":"အင်္ဂလန် လိဂ်ဖလား",
  "Coppa Italia":"အီတလီ ဖလား","Copa del Rey":"စပိန် ဘုရင့်ဖလား",
  "DFB-Pokal":"ဂျာမနီ ဖလား","Coupe de France":"ပြင်သစ် ဖလား",
  "UEFA Champions League":"UEFA ချန်ပီယံလိဂ်","UEFA Europa League":"UEFA ယူရိုပါလိဂ်",
  "UEFA Conference League":"UEFA ကွန်ဖရင့်လိဂ်","UEFA Nations League":"UEFA နေးရှင်းလိဂ်",
  "FIFA World Cup":"ကမ္ဘာ့ဖလား","FIFA World Cup Qualifying":"ကမ္ဘာ့ဖလား ခြေစစ်ပွဲ",
  "UEFA Euro":"ယူရိုဖလား","UEFA Euro Qualifying":"ယူရိုခြေစစ်ပွဲ"
 };
 const leagueIcons={
  "Premier League":"https://crests.football-data.org/PL.png",
  "Championship":"https://crests.football-data.org/ELC.png",
  "La Liga":"https://crests.football-data.org/PD.png",
  "Serie A":"https://crests.football-data.org/SA.png",
  "Bundesliga":"https://crests.football-data.org/BL1.png",
  "Ligue 1":"https://crests.football-data.org/FL1.png",
  "UEFA Champions League":"https://crests.football-data.org/CL.png"
 };
 let report=null,loading=false;
 const labelLeague=s=>leagueNames[s]||s||"အခြားလိဂ်";
 const team=(m,s)=>String(m[s+"Display"]||m[s]||"").trim();
 const make=(tag,cls,txt)=>{
  const n=document.createElement(tag);
  if(cls)n.className=cls;
  if(txt!==undefined)n.textContent=String(txt);
  return n;
 };
 const safeUrl=url=>{
  try{const u=new URL(url);return u.protocol==="https:"?u.href:null;}catch{return null;}
 };
 const addImage=(box,url,alt,cls)=>{
  const good=safeUrl(url);
  if(!good)return;
  const img=make("img",cls);
  img.src=good;img.alt=alt;img.loading="lazy";img.decoding="async";
  img.onerror=()=>img.remove();
  box.appendChild(img);
 };
 const todayKey=()=>{
  const bits=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Yangon",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const v=k=>bits.find(x=>x.type===k)?.value||"";
  return v("year")+"-"+v("month")+"-"+v("day");
 };
 const displayTime=m=>{
  const text=String(m.kickoffYangon||"").trim();
  const match=text.match(/(?:ည|မနက်)\s*\d{1,2}:\d{2}/);
  if(match)return match[0];
  return text||"—";
 };
 function scoreCell(score,i){
  const cell=make("span","fc-ai-score fc-ai-score-"+(i+1),score);
  cell.setAttribute("data-label","AI ခန့်မှန်း "+["၁","၂","၃"][i]);
  return cell;
 }
 function render(){
  groups.replaceChildren();
  if(!report)return;
  const fixtures=report.matches.filter(m=>m&&typeof m.home==="string"&&typeof m.away==="string");
  const choose=filter.value;
  const selected=choose==="all"?fixtures:fixtures.filter(m=>m.league===choose);
  count.textContent=selected.length+" ပွဲ";
  if(!selected.length){groups.appendChild(make("p","fc-ai-empty","ရွေးထားသော လိဂ်တွင် ပွဲမရှိပါ"));return;}
  const leagues=[...new Set(selected.map(m=>m.league||"Other"))];
  for(const league of leagues){
   const matches=selected.filter(m=>(m.league||"Other")===league);
   const wrap=make("section","fc-ai-league");
   wrap.setAttribute("aria-label",labelLeague(league));
   const table=make("div","fc-ai-table");
   const head=make("div","fc-ai-league-head");
   const iconBox=make("span","fc-ai-league-icon-frame");
   const fallback=make("span","fc-ai-league-icon-fallback","⚽");
   iconBox.appendChild(fallback);
   const logo=safeUrl(leagueIcons[league]);
   if(logo){
    const image=make("img","fc-ai-league-icon");
    image.src=logo;image.alt=labelLeague(league)+" လိဂ်လိုဂို";
    image.loading="lazy";image.decoding="async";
    image.onload=()=>{fallback.hidden=true};
    image.onerror=()=>{image.remove();fallback.hidden=false};
    iconBox.appendChild(image);
   }
   head.appendChild(iconBox);
   head.appendChild(make("strong","fc-ai-league-title",labelLeague(league)));
   ["AI ခန့်မှန်း ၁","AI ခန့်မှန်း ၂","AI ခန့်မှန်း ၃"].forEach((label,i)=>{
    head.appendChild(make("span","fc-ai-head-pred fc-ai-head-pred-"+(i+1),label));
   });
   const downloadHead=make("span","fc-ai-head-download","PNG");
   downloadHead.title="တစ်ပွဲချင်း PNG Download";
   head.appendChild(downloadHead);
   table.appendChild(head);
   for(const match of matches){
    const row=make("div","fc-ai-match");
    row.appendChild(make("span","fc-ai-time",displayTime(match)));
    const teams=make("div","fc-ai-teams");
    const home=make("span","fc-ai-team fc-ai-team-home");
    home.appendChild(make("span","fc-ai-team-name",team(match,"home")));
    addImage(home,match.homeCrestUrl,team(match,"home"),"fc-ai-crest");
    const away=make("span","fc-ai-team fc-ai-team-away");
    addImage(away,match.awayCrestUrl,team(match,"away"),"fc-ai-crest");
    away.appendChild(make("span","fc-ai-team-name",team(match,"away")));
    teams.appendChild(home);
    teams.appendChild(make("span","fc-ai-versus","နှင့်"));
    teams.appendChild(away);
    row.appendChild(teams);
    const scores=model.predict(match);
    const nums=make("div","fc-ai-score-list");
    scores.forEach((score,i)=>nums.appendChild(scoreCell(score,i)));
    row.appendChild(nums);
    const btn=make("button","fc-ai-download","⬇");
    btn.type="button";
    btn.title="တစ်ပွဲချင်း PNG Download";
    btn.setAttribute("aria-label",team(match,"home")+" နှင့် "+team(match,"away")+" AI ခန့်မှန်းချက် PNG Download");
    btn.addEventListener("click",async()=>{
     if(btn.disabled)return;
     btn.disabled=true;const orig=btn.textContent;btn.textContent="…";
     try{await saveMatch(match,scores,report.reportDate);btn.textContent="✓";}
     catch(err){console.error("AI score PNG export",err);btn.textContent="↻";}
     finally{setTimeout(()=>{btn.disabled=false;btn.textContent=orig;},1200);}
    });
    row.appendChild(btn);
    table.appendChild(row);
   }
   wrap.appendChild(table);
   groups.appendChild(wrap);
  }
 }
 function options(fixtures){
  const last=filter.value;
  filter.replaceChildren(new Option("လိဂ်အားလုံး","all"));
  for(const league of [...new Set(fixtures.map(m=>m.league).filter(Boolean))]){
   filter.add(new Option(labelLeague(league),league));
  }
  filter.value=[...filter.options].some(x=>x.value===last)?last:"all";
 }
 async function load(){
  if(loading)return;
  loading=true;status.textContent="ပွဲစဉ်စာရင်း ရယူနေသည်…";
  try{
   const response=await fetch("./data/today.json?fc-ai="+Date.now(),{cache:"no-store"});
   if(!response.ok)throw new Error("Match report unavailable");
   const data=await response.json();
   if(data.reportDate!==todayKey()||data.published!==true||!Array.isArray(data.matches))throw new Error("Daily report not yet published");
   report=data;
   options(data.matches);
   status.textContent="";render();
  }catch(err){
   report=null;count.textContent="0 ပွဲ";
   groups.replaceChildren(make("p","fc-ai-empty","ယနေ့ ပွဲစဉ်စာရင်း မရသေးပါ"));
   status.textContent="";
  }finally{loading=false;}
 }
 function rounded(ctx,x,y,w,h,r,fill){
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 }
 function fit(ctx,value,maxWidth,start=33,min=22){
  let px=start;
  do {ctx.font="700 "+px+"px 'Noto Sans Myanmar',sans-serif";if(ctx.measureText(value).width<=maxWidth)break;px-=2;} while(px>min);
  return px;
 }
 async function picture(url){
  const uri=safeUrl(url);if(!uri)return null;
  return new Promise(resolve=>{
   const img=new Image();let finished=false;
   const finish=v=>{if(finished)return;finished=true;clearTimeout(timer);resolve(v);};
   const timer=setTimeout(()=>finish(null),3500);
   img.crossOrigin="anonymous";img.onload=()=>finish(img);img.onerror=()=>finish(null);img.src=uri;
  });
 }
 function iconOrLabel(ctx,img,x,y,size,text){
  if(img){ctx.drawImage(img,x,y,size,size);return;}
  rounded(ctx,x,y,size,size,14,"#233a80");
  ctx.fillStyle="#ffffff";ctx.font="700 24px 'Noto Sans Myanmar',sans-serif";
  ctx.textAlign="center";ctx.fillText((text||"FC").slice(0,2),x+size/2,y+size/2+9);
 }
 async function saveMatch(match,scores,date){
  if(document.fonts?.load){
   await Promise.race([document.fonts.load('700 32px "Noto Sans Myanmar"').catch(()=>{}),new Promise(r=>setTimeout(r,2600))]);
  }
  const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=650;
  const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Canvas not supported");
  const bg=ctx.createLinearGradient(0,0,1080,650);bg.addColorStop(0,"#08146b");bg.addColorStop(.55,"#061ecd");bg.addColorStop(1,"#091053");
  ctx.fillStyle=bg;ctx.fillRect(0,0,1080,650);
  rounded(ctx,28,30,1024,97,18,"#111f95");
  ctx.fillStyle="#fff";ctx.textAlign="left";
  ctx.font="800 38px 'Noto Sans Myanmar',sans-serif";
  ctx.fillText("FUTURE CODE  |  AI ခန့်မှန်းချက်များ",55,93);
  rounded(ctx,28,145,1024,76,16,"#1329ac");
  ctx.fillStyle="#fff";ctx.textAlign="left";fit(ctx,labelLeague(match.league),790,30,20);
  ctx.fillText(labelLeague(match.league),57,195);
  ctx.fillStyle="#efe6c6";ctx.textAlign="right";ctx.font="700 25px 'Noto Sans Myanmar',sans-serif";
  ctx.fillText(displayTime(match),1023,194);
  const [homeImg,awayImg]=await Promise.all([picture(match.homeCrestUrl),picture(match.awayCrestUrl)]);
  iconOrLabel(ctx,homeImg,135,240,95,team(match,"home"));
  iconOrLabel(ctx,awayImg,850,240,95,team(match,"away"));
  ctx.textAlign="center";ctx.fillStyle="#ffd665";
  ctx.font="800 48px 'Barlow Condensed',sans-serif";ctx.fillText("VS",540,304);
  ctx.fillStyle="#fff";
  const home=team(match,"home"),away=team(match,"away");
  fit(ctx,home,410,34,23);ctx.fillText(home,286,398);
  fit(ctx,away,410,34,23);ctx.fillText(away,792,398);
  for(let i=0;i<3;i++){
   const x=45+i*341,w=308;
   rounded(ctx,x,438,w,166,18,i===0?"#f1f4fb":"#eee1ba");
   ctx.textAlign="center";ctx.fillStyle="#222968";
   ctx.font="700 27px 'Noto Sans Myanmar',sans-serif";
   ctx.fillText("AI ခန့်မှန်း "+["၁","၂","၃"][i],x+w/2,489);
   ctx.fillStyle="#101b44";ctx.font="900 72px 'Barlow Condensed',sans-serif";
   ctx.fillText(scores[i],x+w/2,575);
  }
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
  if(!blob)throw new Error("PNG encode failed");
  const slug=s=>String(s||"fixture").normalize("NFKD").replace(/[^a-zA-Z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,35);
  const href=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=href;link.download="future-code-ai-"+date+"-"+slug(match.home)+"-"+slug(match.away)+".png";
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(href),5000);
 }
 filter.addEventListener("change",render);
 document.getElementById("reloadBtn")?.addEventListener("click",()=>load());
 document.addEventListener("DOMContentLoaded",()=>load());
})();

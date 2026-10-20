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
 let exportLeagues=new Set();
 const exportPanel=document.getElementById("fcAiExportPanel");
 const allPages=document.getElementById("fcAiAllPngPages");
 const chosenPages=document.getElementById("fcAiSelectedPngPages");
 const exportChoices=document.getElementById("fcAiExportLeagueChoices");
 const exportStatus=document.getElementById("fcAiExportStatus");
 const exportAllBtn=document.getElementById("fcAiSelectAll");
 const exportNoneBtn=document.getElementById("fcAiSelectNone");
 const labelLeague=s=>leagueNames[s]||s||"အခြားလိဂ်";
 const team=(m,s)=>String(m[s+"Display"]||m[s]||"").trim();
 const crestFallbackIds={
  "Lincoln City":314,
  "Charlton Athletic":372,
  "Birmingham City":392,
  "Queens Park Rangers":334,
  "Bristol City":333,
  "Norwich City":381,
  "Bolton Wanderers":358,
  "Swansea City":318
 };
 const teamCrest=(match,side)=>{
  const provided=match[side+"CrestUrl"];
  if(safeUrl(provided))return provided;
  const id=crestFallbackIds[match[side]];
  return id?"https://a.espncdn.com/i/teamlogos/soccer/500/"+id+".png":null;
 };

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

 const publishedFixtures=()=>report?.matches?.filter(m=>m&&typeof m.home==="string"&&typeof m.away==="string")||[];
 function pageButtons(container,fixtures,selected,scope){
  if(!container)return 0;
  container.replaceChildren();
  const exporter=window.FutureCodeAiBulkExport;
  if(!exporter){container.appendChild(make("span","fc-ai-export-empty","PNG Download မရသေးပါ"));return 0;}
  const pages=exporter.planPages(fixtures,selected);
  if(!pages.length){
   container.appendChild(make("span","fc-ai-export-empty","PNG Download လုပ်ရန် လိဂ်ရွေးပါ"));
   return 0;
  }
  for(const [i,page] of pages.entries()){
   const btn=make("button","fc-ai-bulk-btn","⬇ PNG "+(i+1)+"/"+pages.length+" · "+page.matchCount+" ပွဲ");
   btn.type="button";
   btn.setAttribute("aria-label",scope+" AI ခန့်မှန်းချက် ပုံ "+(i+1)+"/"+pages.length+"၊ "+page.matchCount+" ပွဲ Download");
   btn.addEventListener("click",async()=>{
    if(btn.disabled||!report)return;
    // Each PNG gets its own explicit click, so mobile browsers don't block a batch of downloads.
    const original=btn.textContent;btn.disabled=true;btn.textContent="PNG ပြင်ဆင်နေသည်…";
    try{
     await exporter.savePage(page,{
      date:report.reportDate,part:i+1,total:pages.length,scope,
      predict:model.predict,leagueLabel:labelLeague,
      leagueLogo:l=>window.FutureCodeMainLogoAssets?.leagueCrest(l)||leagueIcons[l],
      teamName:team,teamLogo:teamCrest,displayTime
     });
     btn.textContent="✓ PNG Download စတင်ပြီး";
     exportStatus.textContent="PNG "+(i+1)+"/"+pages.length+" Download စတင်ပြီးပါပြီ။";
    }catch(err){
     console.error("AI bulk PNG export",err);
     btn.textContent="Download မအောင်မြင် — ပြန်နှိပ်ပါ";
     exportStatus.textContent="PNG ထုတ်မရသေးပါ။ ထပ်မံနှိပ်ကြည့်ပါ။";
    }finally{
     setTimeout(()=>{if(btn.isConnected){btn.disabled=false;btn.textContent=original;}},1800);
    }
   });
   container.appendChild(btn);
  }
  return pages.length;
 }
 function redrawDownloadChoices(){
  const fixtures=publishedFixtures();
  if(!fixtures.length){
   allPages?.replaceChildren();chosenPages?.replaceChildren();
   if(exportStatus)exportStatus.textContent="ယနေ့ပွဲစဉ်စာရင်း မရသေးပါ";
   return;
  }
  const allCount=pageButtons(allPages,fixtures,null,"all");
  const selected=[...exportLeagues];
  const included=fixtures.filter(m=>exportLeagues.has(m.league||"Other"));
  const scope=selected.length===1?selected[0]:"selected-"+selected.length+"-leagues";
  const selectedCount=pageButtons(chosenPages,fixtures,selected,scope);
  exportStatus.textContent="ပွဲအားလုံး "+fixtures.length+" ပွဲ / PNG "+allCount+" ပုံ · "+
   "လိဂ်ရွေးထားသည် "+selected.length+" ခု / "+included.length+" ပွဲ / PNG "+selectedCount+" ပုံ။";
  if(exportAllBtn)exportAllBtn.disabled=selected.length===new Set(fixtures.map(m=>m.league||"Other")).size;
  if(exportNoneBtn)exportNoneBtn.disabled=selected.length===0;
 }
 function createDownloadLeagueChoices(fixtures){
  if(!exportChoices)return;
  exportChoices.replaceChildren();
  const leagues=[...new Set(fixtures.map(m=>m.league||"Other"))];
  exportLeagues=new Set(leagues);
  for(const league of leagues){
   const item=make("label","fc-ai-export-choice");
   const input=make("input");
   input.type="checkbox";input.value=league;input.checked=true;
   input.addEventListener("change",()=>{
    if(input.checked)exportLeagues.add(league);else exportLeagues.delete(league);
    redrawDownloadChoices();
   });
   item.appendChild(input);
   item.appendChild(make("span","",labelLeague(league)));
   exportChoices.appendChild(item);
  }
  redrawDownloadChoices();
 }
 exportAllBtn?.addEventListener("click",()=>{
  for(const input of exportChoices.querySelectorAll('input[type="checkbox"]'))input.checked=true;
  exportLeagues=new Set([...exportChoices.querySelectorAll('input[type="checkbox"]')].map(x=>x.value));
  redrawDownloadChoices();
 });
 exportNoneBtn?.addEventListener("click",()=>{
  for(const input of exportChoices.querySelectorAll('input[type="checkbox"]'))input.checked=false;
  exportLeagues.clear();redrawDownloadChoices();
 });

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
   const logo=safeUrl(window.FutureCodeMainLogoAssets?.leagueCrest(league)||leagueIcons[league]);
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
    addImage(home,teamCrest(match,"home"),team(match,"home"),"fc-ai-crest");
    const away=make("span","fc-ai-team fc-ai-team-away");
    addImage(away,teamCrest(match,"away"),team(match,"away"),"fc-ai-crest");
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
     try{await saveMatch({...match,homeCrestUrl:teamCrest(match,"home"),awayCrestUrl:teamCrest(match,"away")},scores,report.reportDate);btn.textContent="✓";}
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
   createDownloadLeagueChoices(publishedFixtures());
   status.textContent="";render();
  }catch(err){
   report=null;count.textContent="0 ပွဲ";
   exportLeagues.clear();
   exportChoices?.replaceChildren();
   redrawDownloadChoices();
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
  const uri=safeUrl(window.FutureCodeMainLogoAssets?.imageUrl(url)||url);if(!uri)return null;
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
  // PNG uses the same aligned league-banner / three-score-column format as the site.
  const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=430;
  const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Canvas not supported");
  ctx.fillStyle="#070f4a";ctx.fillRect(0,0,1080,430);
  ctx.fillStyle="#fff";ctx.textAlign="left";ctx.font="800 25px 'Barlow Condensed',sans-serif";
  ctx.fillText("FUTURE CODE  •  AI ခန့်မှန်းချက်များ",22,43);
  const blue=ctx.createLinearGradient(0,60,1080,215);
  blue.addColorStop(0,"#020a8c");blue.addColorStop(.52,"#1d44f7");blue.addColorStop(1,"#07077d");
  ctx.fillStyle=blue;ctx.fillRect(0,60,1080,152);
  rounded(ctx,10,69,116,132,10,"#ffffff");
  const [leagueImg,homeImg,awayImg]=await Promise.all([
   picture(window.FutureCodeMainLogoAssets?.leagueCrest(match.league)||leagueIcons[match.league]),picture(match.homeCrestUrl),picture(match.awayCrestUrl)
  ]);
  if(leagueImg)ctx.drawImage(leagueImg,20,81,96,108);
  else{ctx.fillStyle="#1325a7";ctx.font="900 60px sans-serif";ctx.textAlign="center";ctx.fillText("⚽",68,152);}
  ctx.textAlign="center";ctx.fillStyle="#fff";
  const leagueText=labelLeague(match.league);
  fit(ctx,leagueText,445,35,20);ctx.fillText(leagueText,356,151);
  const columns=[596,758,920];
  for(let i=0;i<3;i++){
   const x=columns[i];
   rounded(ctx,x+4,74,154,124,10,i===0?"#e6edf9":"#f8e89a");
   ctx.fillStyle="#14204b";ctx.textAlign="center";
   const heading="AI ခန့်မှန်း "+["၁","၂","၃"][i];
   fit(ctx,heading,145,22,15);ctx.fillText(heading,x+81,146);
  }
  ctx.fillStyle="#ffffff";ctx.fillRect(0,220,596,190);
  ctx.fillStyle="#f1f4f9";ctx.fillRect(0,220,145,190);
  ctx.strokeStyle="#cdd6e8";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(145,220);ctx.lineTo(145,410);ctx.stroke();
  ctx.fillStyle="#172752";ctx.textAlign="center";
  const kickoff=displayTime(match);
  fit(ctx,kickoff,136,22,14);ctx.fillText(kickoff,72,321);
  iconOrLabel(ctx,homeImg,228,235,69,team(match,"home"));
  iconOrLabel(ctx,awayImg,446,235,69,team(match,"away"));
  ctx.fillStyle="#243aa4";ctx.font="900 33px 'Barlow Condensed',sans-serif";
  ctx.fillText("VS",371,291);
  ctx.fillStyle="#10224f";
  const homeName=team(match,"home"),awayName=team(match,"away");
  fit(ctx,homeName,182,22,14);ctx.fillText(homeName,261,358);
  fit(ctx,awayName,182,22,14);ctx.fillText(awayName,479,358);
  for(let i=0;i<3;i++){
   const x=columns[i];
   ctx.fillStyle=i===0?"#f1f3f8":"#fff3b9";
   ctx.fillRect(x,220,162,190);
   ctx.strokeStyle="#d9dfee";ctx.strokeRect(x,220,162,190);
   ctx.fillStyle="#0d1834";ctx.font="900 58px 'Barlow Condensed',sans-serif";
   ctx.textAlign="center";ctx.fillText(scores[i],x+81,332);
  }
  ctx.fillStyle="#132fdf";ctx.fillRect(0,412,1080,6);
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

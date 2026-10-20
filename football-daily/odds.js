"use strict";
const tz="Asia/Yangon";
function dateKey(){
 const p=new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
 const x=Object.fromEntries(p.map(v=>[v.type,v.value]));return x.year+"-"+x.month+"-"+x.day;
}
function element(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e;}
function append(parent,...items){items.forEach(n=>parent.appendChild(n));return parent;}
function safeLogo(src){if(typeof src!=="string")return "";try{const u=new URL(src,document.baseURI);return u.protocol==="https:"?u.href:"";}catch{return "";}}
function badge(name,url,cls="team-badge"){
 const frame=element("span",cls);frame.title=name;
 const src=safeLogo(isMainOdds?window.FutureCodeBrandExportData?.imageUrl(url)||url:url);
 if(src){
  const img=element("img","team-logo");img.src=src;img.alt=name+" အသင်းလိုဂို";img.loading="lazy";img.decoding="async";
  img.onerror=()=>{img.remove();frame.appendChild(element("span","logo-fallback",name.slice(0,2)));};
  frame.appendChild(img);
 }else frame.appendChild(element("span","logo-fallback",name.slice(0,2)));
 return frame;
}
const groups={"UEFA Champions League":"ချန်ပီယံလိဂ်","Championship":"အင်္ဂလန် ချန်ပီယံရှစ်","Swedish Superettan":"ဆွီဒင် စူပါတန် လိဂ်","German 3. Liga":"ဂျာမန် ဘွန်ဒစ်လီဂါ ၃","Premier League":"အင်္ဂလန် ပရီးမီးယားလိဂ်","Serie A":"အီတလီ စီးရီးအေ","La Liga":"စပိန် လာလီဂါ","Veikkausliiga":"ဖင်လန် လိဂ်","Eliteserien":"နော်ဝေး လိဂ်","Allsvenskan":"ဆွီဒင် လိဂ်","Danish Superliga":"ဒိန်းမတ် စူပါလိဂ်","Primeira Liga":"ပေါ်တူဂီ ပရီးမီးယားလိဂ်","La Liga 2":"စပိန် လာလီဂါ ၂","Ligue 2":"ပြင်သစ် လိဂ် ၂","Turkish Super Lig":"တူရကီ စူပါလိဂ်","Italian Serie C":"အီတလီ စီးရီးစီ"};
const leagueLogos={"Premier League":"https://crests.football-data.org/PL.png","Serie A":"https://crests.football-data.org/SA.png","La Liga":"https://crests.football-data.org/PD.png","La Liga 2":"https://commons.wikimedia.org/wiki/Special:FilePath/LaLiga%20Hypermotion%202023%20Vertical%20Logo.svg","Primeira Liga":"https://crests.football-data.org/PPL.png","Bundesliga":"https://crests.football-data.org/BL1.png","Ligue 1":"https://crests.football-data.org/FL1.png","Championship":"https://crests.football-data.org/ELC.png","Allsvenskan":"https://commons.wikimedia.org/wiki/Special:FilePath/Allsvenskan%20logo.svg","Danish Superliga":"https://commons.wikimedia.org/wiki/Special:FilePath/3F%20Superliga%20Logo%202024.png","Ligue 2":"https://commons.wikimedia.org/wiki/Special:FilePath/Logo%20Ligue%202%20BKT%202024.svg","Turkish Super Lig":"https://commons.wikimedia.org/wiki/Special:FilePath/Trendyol%20S%C3%BCper%20Lig%20logo%20dikey.svg","Swedish Superettan":"https://commons.wikimedia.org/wiki/Special:FilePath/Superettan%20logo%20%282024%29.webp"};
function matchCell(m){
 const div=element("div","odds-matchup");
 append(div,element("span","club-label",m.home),badge(m.home,m.homeCrestUrl),element("span","mini-vs","VS"),badge(m.away,m.awayCrestUrl),element("span","club-label",m.away));
 return div;
}
const mainLeagueFiles={"Premier League":"eng.1","Serie A":"ita.1","La Liga":"esp.1","Allsvenskan":"swe.1","Danish Superliga":"den.1","Primeira Liga":"por.1","La Liga 2":"esp.2","Ligue 2":"fra.2","Turkish Super Lig":"tur.1","Swedish Superettan":"swe.2"};
const isMainOdds=!document.documentElement.dataset.footballBrandName&&/^\/odds(?:\.html)?\/?$/.test(location.pathname);
if(isMainOdds){
 Object.assign(leagueLogos,{"UEFA Champions League":"https://commons.wikimedia.org/wiki/Special:FilePath/UEFA%20Champions%20League%20logo%20no%20text.svg","League One":"https://commons.wikimedia.org/wiki/Special:FilePath/EFL%20League%20One%20Wordmark.svg"});
 Object.assign(groups,{"League One":"အင်္ဂလန် လိဂ်ဝမ်း","UEFA Champions League":"ချန်ပီယံလိဂ်"});
 Object.assign(groups,{"Premier League":"အင်္ဂလန် ပရီးမီးယားလိဂ်","Serie A":"အီတလီ စီးရီးအေ","La Liga":"စပိန် လာလီဂါ","Allsvenskan":"ဆွီဒင် လိဂ်","Danish Superliga":"ဒိန်းမတ် စူပါလိဂ်","Primeira Liga":"ပေါ်တူဂီ ပရီးမီးယားလိဂ်","La Liga 2":"စပိန် လာလီဂါ ၂","Ligue 2":"ပြင်သစ် လိဂ် ၂","Turkish Super Lig":"တူရကီ စူပါလိဂ်","Swedish Superettan":"ဆွီဒင် စူပါအက်တန်လိဂ်"});
 for(const [league,file] of Object.entries(mainLeagueFiles))leagueLogos[league]="./assets/league-logos/"+file+".png";
}
function leagueHeading(league){
 const heading=element("h2","odds-league-heading");
 const logo=safeLogo(window.FutureCodeBrandExportData?.leagueCrest(league)||leagueLogos[league]);
 if(logo){
  const icon=element("img","league-crest");icon.src=logo;icon.alt=groups[league]||league;icon.loading="eager";icon.decoding="sync";
  icon.onerror=()=>{icon.replaceWith(element("span","league-mark","⚽"));};
  heading.appendChild(icon);
 }else heading.appendChild(element("span","league-mark","⚽"));
 heading.appendChild(element("span","",groups[league]||league));
 return heading;
}

/* Shared branded odds PNG buttons: one separate user click per balanced PNG part. */
function makeOddsPngButtons(host,data,matches,scope){
 host.replaceChildren();
 const kit=window.FutureCodeDailyExport;
 if(!kit?.partition||!kit?.saveOdds||!matches.length)return 0;
 const pages=kit.partition(matches,isMainOdds?{threshold:3,maxPerPage:3}:{});
 for(const page of pages){
  const button=element("button","odds-part-download","⬇ PNG "+page.index+"/"+page.total+" · "+page.count+" ပွဲ");
  button.type="button";
  button.setAttribute("aria-label",scope+" ပေါက်ကြေး PNG "+page.index+"/"+page.total+"၊ "+page.count+" ပွဲ");
  button.addEventListener("click",async()=>{
   if(button.disabled)return;
   button.disabled=true;
   const original=button.textContent;
   button.textContent="PNG ပြင်ဆင်နေသည်…";
   try{
    const options={part:page.index,total:page.total};
    if(scope!=="all")options.league=scope;
    await kit.saveOdds({...data,matches:page.matches},options);
    button.textContent="✓ PNG Download စတင်ပြီး";
    const status=document.getElementById("oddsExportStatus");
    if(status)status.textContent="PNG "+page.index+"/"+page.total+" · "+page.count+" ပွဲ Download စတင်ပြီးပါပြီ။";
   }catch(err){
    console.error("Odds PNG part export failed",err);
    button.textContent="PNG မအောင်မြင် — ပြန်နှိပ်ပါ";
   }finally{
    setTimeout(()=>{if(button.isConnected){button.disabled=false;button.textContent=original;}},1800);
   }
  });
  host.appendChild(button);
 }
 return pages.length;
}
function renderSelectedOddsButtons(){
 const host=document.getElementById("oddsPngPages"),status=document.getElementById("oddsExportStatus");
 if(!host||!loadedSheet)return;
 const matches=loadedSheet.matches.filter(m=>selectedLeagues.has(m.league||"အခြားပြိုင်ပွဲ"));
 const all=matches.length===loadedSheet.matches.length;
 const parts=makeOddsPngButtons(host,loadedSheet,matches,all?"all":"selected");
 if(status)status.textContent=matches.length
  ?matches.length+" ပွဲ · "+selectedLeagues.size+" လိဂ် · PNG "+parts+" ပုံကို တစ်ပုံချင်း Download လုပ်နိုင်ပါသည်။"
  :"Download လုပ်ရန် အနည်းဆုံး လိဂ်တစ်ခု ရွေးပါ။";
}

function render(data){
 const root=document.getElementById("oddsList");root.replaceChildren();
 document.getElementById("oddsCount").textContent=String(data.matches.length);
 document.getElementById("oddsDate").textContent=data.reportDate.split("-").reverse().join("/")+" · မူလ (မနက်) / ယခု (နေ့ခင်း၊ ညနေ)";
 const grouped=new Map();
 for(const match of data.matches){if(!grouped.has(match.league))grouped.set(match.league,[]);grouped.get(match.league).push(match);}
 for(const [league,matches] of grouped){
  const section=element("section","odds-group"),header=element("div","odds-league-header");
  if(!isMainOdds)header.appendChild(leagueHeading(league));
  const leagueButtons=element("div","odds-league-png-parts");
  makeOddsPngButtons(leagueButtons,data,matches,league);
  header.appendChild(leagueButtons);section.appendChild(header);
  const wrap=element("div","odds-table-wrap"),table=element("table","odds-table");
  const columns=element("colgroup");
  for(const width of ["9%","34%","14%","8%","8%","8%","8%","11%"]){
   const col=element("col");col.style.width=width;columns.appendChild(col);
  }
  table.appendChild(columns);
  const thead=element("thead"),tr=element("tr","odds-heading-row"),sub=element("tr","odds-subheading-row");
  if(isMainOdds){
   section.classList.add("main-compact-odds");
   const logoCell=element("th","main-league-logo");logoCell.rowSpan=2;
   const heading=leagueHeading(league);
   logoCell.appendChild(heading.firstElementChild);
   const nameCell=element("th","main-league-name",groups[league]||league);nameCell.rowSpan=2;
   const upperCell=element("th","odds-heading-fixed","ကြေးပေးအသင်း");upperCell.rowSpan=2;
   append(tr,logoCell,nameCell,upperCell);
  }else{
   for(const name of ["ပွဲချိန်","ယှဉ်ပြိုင်မည့်အသင်း","အပေါ်အသင်း"]){
    const th=element("th","odds-heading-fixed",name);th.rowSpan=2;tr.appendChild(th);
   }
  }
  for(const name of ["ဘော်ဒီကြေး","ဂိုးပေါင်းကြေး"]){
   const th=element("th","odds-heading-pair",name);th.colSpan=2;tr.appendChild(th);
   sub.appendChild(element("th","odds-sub-original","မူလ"));
   sub.appendChild(element("th","odds-sub-current","ယခု"));
  }
  const last=element("th","odds-heading-fixed","အင်တာနက်ခန့်မှန်းချက်");last.rowSpan=2;tr.appendChild(last);
  thead.appendChild(tr);thead.appendChild(sub);table.appendChild(thead);const tbody=element("tbody");
  for(const m of matches){
   const row=element("tr");
   const time=String(m.kickoffDisplay||m.kickoff||"");
   // The full editorial date remains available on hover; short evening
   // notation lets team names and original/latest prices stay readable.
   const shortTime=time.replace(/^.*? ည /,"ည ");
   const t=element("td","time",shortTime),pair=element("td","team-pair");
   t.title=time;
   pair.appendChild(matchCell(m));
   const bodyLatest=element("td","price odds-current",m.currentBodyOdds??"");
   const goalLatest=element("td","price odds-current",m.currentGoalTotalOdds??"");
   if(!m.currentBodyOdds)bodyLatest.setAttribute("aria-label","ယခု ဘော်ဒီကြေး မတင်ရသေးပါ");
   if(!m.currentGoalTotalOdds)goalLatest.setAttribute("aria-label","ယခု ဂိုးပေါင်းကြေး မတင်ရသေးပါ");
   append(row,t,pair,element("td","upper",m.upperTeam),
    element("td","price odds-original",m.bodyOdds??""),bodyLatest,
    element("td","price odds-original",m.goalTotalOdds??""),goalLatest,
    element("td","prediction",m.pdfLastColumn));
   tbody.appendChild(row);
  }
  table.appendChild(tbody);wrap.appendChild(table);section.appendChild(wrap);root.appendChild(section);
 }
}

/* Keep source morning prices immutable; only add verified afternoon quotes
 * from the same-day supplemental report to precisely corresponding PDF rows.
 * Unknown, outdated or mismatched rows remain blank rather than guessed. */
function mergeLatestOdds(morning,update){
 if(!morning||!Array.isArray(morning.matches))throw Error("Missing original odds");
 const blank=morning.matches.map(m=>({...m,currentBodyOdds:"",currentGoalTotalOdds:""}));
 if(!update||update.reportDate!==morning.reportDate||!Array.isArray(update.matches))
  return {...morning,matches:blank};
 const byRow=new Map();
 for(const item of update.matches){
  const row=Number(item.row);
  if(!Number.isSafeInteger(row)||row<1||byRow.has(row))continue;
  byRow.set(row,item);
 }
 const merged=blank.map((m,index)=>{
  const row=Number(m.pdfRow||m.number||index+1),x=byRow.get(row);
  if(!x)return m;
  if(["league","home","away","upperTeam","kickoffDisplay"].some(k=>String(x[k]??"")!==String(m[k]??"")))return m;
  if(String(x.morningBodyOdds)!==String(m.bodyOdds)||String(x.morningGoalTotalOdds)!==String(m.goalTotalOdds))return m;
  const currentBodyOdds=typeof x.eveningBodyOdds==="string"?x.eveningBodyOdds.trim():"";
  const currentGoalTotalOdds=typeof x.eveningGoalTotalOdds==="string"?x.eveningGoalTotalOdds.trim():"";
  return {...m,
   currentBodyOdds:/^(?:-\d+|\d+[+-]\d+|\d+=)$/.test(currentBodyOdds)?currentBodyOdds:"",
   currentGoalTotalOdds:/^(?:-\d+|\d+[+-]\d+|\d+=)$/.test(currentGoalTotalOdds)?currentGoalTotalOdds:""
  };
 });
 return {...morning,matches:merged};
}

let loadedSheet=null;

let selectedLeagues=new Set();
function setupLeagueFilter(data){
 const previous=document.getElementById("oddsLeagueFilter");
 if(previous)previous.remove();
 const actions=document.querySelector(".odds-export-actions");
 if(!actions)return;
 const panel=element("section","odds-league-filter");
 panel.id="oddsLeagueFilter";
 const title=element("h2","odds-filter-title","ဘယ်လိဂ်တွေ ပါစေချင်လဲ ဆိုတာ ရွေးနိုင်ပါသည်");
 const description=element("p","odds-filter-description","Download ပုံထဲ ပါဝင်စေချင်သည့် လိဂ်များကို အမှန်ခြစ် ရွေးပါ။ Website ပေါ်က ပွဲစာရင်းကို မပြောင်းပါ။");
 const controls=element("div","odds-filter-controls");
 const all=element("button","odds-filter-control","အားလုံးရွေး");
 const none=element("button","odds-filter-control","အားလုံးဖြုတ်");
 all.type="button";none.type="button";
 const choices=element("div","odds-league-choices");
 const unique=[...new Set(data.matches.map(m=>m.league||"အခြားပြိုင်ပွဲ"))];
 selectedLeagues=new Set(unique);
 const checkboxes=[];
 function update(){renderSelectedOddsButtons();}
 for(const league of unique){
  const label=element("label","odds-league-choice");
  const input=element("input");input.type="checkbox";input.checked=true;input.value=league;
  input.addEventListener("change",()=>{if(input.checked)selectedLeagues.add(league);else selectedLeagues.delete(league);update();});
  label.appendChild(input);
  label.appendChild(element("span","",groups[league]||league));
  choices.appendChild(label);checkboxes.push({league,input});
 }
 all.addEventListener("click",()=>{selectedLeagues=new Set(unique);for(const c of checkboxes)c.input.checked=true;update();});
 none.addEventListener("click",()=>{selectedLeagues.clear();for(const c of checkboxes)c.input.checked=false;update();});
 controls.appendChild(all);controls.appendChild(none);
 panel.appendChild(title);panel.appendChild(description);panel.appendChild(controls);panel.appendChild(choices);
 actions.parentNode.insertBefore(panel,actions);
 const legacy=document.getElementById("oddsPngBtn");
 if(legacy)legacy.style.display="none";
 let pages=document.getElementById("oddsPngPages");
 if(!pages){
  pages=element("div","odds-png-parts");pages.id="oddsPngPages";
  const heading=element("strong","odds-parts-heading","ပေါက်ကြေး PNG Download");
  actions.insertBefore(heading,actions.firstChild);
  actions.insertBefore(pages,heading.nextSibling);
 }
 update();
}

async function load(){
 const query=new URLSearchParams(location.search).get("date");
 const day=/^\d{4}-\d{2}-\d{2}$/.test(query||"")?query:dateKey();
 try{
  const base=new URL(document.documentElement.dataset.footballOddsDataUrl||"./data/odds/",document.baseURI);
  const source=new URL(day+".json",base);
  const response=await fetch(source.href,{cache:"no-store"});
  if(!response.ok)throw Error("HTTP "+response.status);
  const data=await response.json();
  if(data.reportDate!==day||!Array.isArray(data.matches))throw Error("invalid sheet");
  loadedSheet=mergeLatestOdds(data,null);render(loadedSheet);
  setupLeagueFilter(loadedSheet);
  // Supplemental afternoon sheet is optional; it NEVER creates a new section.
  // The same dataset powers every branded site and its single PNG export.
  try{
   const latestUrl=new URL("evening/"+day+".json",base);
   const updated=await fetch(latestUrl.href,{cache:"no-store"});
   if(updated.ok){
    const supplement=await updated.json();
    if(loadedSheet?.reportDate===day){
     loadedSheet=mergeLatestOdds(data,supplement);
     render(loadedSheet);
     renderSelectedOddsButtons();
    }
   }
  }catch(err){console.info("ယခုကြေး မရသေးပါ — မူလကြေးကိုသာ ပြသထားသည်",err);}
 }catch(err){
  console.error("Daily odds loading error",err);
  loadedSheet=null;
  selectedLeagues.clear();
  const oldFilter=document.getElementById("oddsLeagueFilter");if(oldFilter)oldFilter.remove();
  document.getElementById("oddsPngPages")?.replaceChildren();
  document.getElementById("oddsExportStatus").textContent="ကြေးဒေတာမရှိသေးပါ။";
  document.getElementById("oddsCount").textContent="0";
  document.getElementById("oddsList").replaceChildren(element("div","odds-status","ဒီနေ့အတွက် ပေါက်ကြေးစာရင်း မတင်ရသေးပါ။"));
 }
}
document.addEventListener("DOMContentLoaded",()=>{
 load();
});


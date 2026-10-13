"use strict";
const tz="Asia/Yangon";
function dateKey(){
 const p=new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
 const x=Object.fromEntries(p.map(v=>[v.type,v.value]));return x.year+"-"+x.month+"-"+x.day;
}
function element(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e;}
function append(parent,...items){items.forEach(n=>parent.appendChild(n));return parent;}
function safeLogo(src){if(typeof src!=="string")return "";try{const u=new URL(src);return u.protocol==="https:"?u.href:"";}catch{return "";}}
function badge(name,url,cls="team-badge"){
 const frame=element("span",cls);frame.title=name;
 const src=safeLogo(url);
 if(src){
  const img=element("img","team-logo");img.src=src;img.alt=name+" အသင်းလိုဂို";img.loading="lazy";img.decoding="async";
  img.onerror=()=>{img.remove();frame.appendChild(element("span","logo-fallback",name.slice(0,2)));};
  frame.appendChild(img);
 }else frame.appendChild(element("span","logo-fallback",name.slice(0,2)));
 return frame;
}
const groups={"UEFA Champions League":"ချန်ပီယံလိဂ်","Championship":"အင်္ဂလန် ချန်ပီယံရှစ်","Swedish Superettan":"ဆွီဒင် စူပါတန် လိဂ်","German 3. Liga":"ဂျာမန် ဘွန်ဒစ်လီဂါ ၃","Premier League":"အင်္ဂလန် ပရီးမီးယားလိဂ်","Serie A":"အီတလီ စီးရီးအေ","La Liga":"စပိန် လာလီဂါ","Veikkausliiga":"ဖင်လန် လိဂ်","Eliteserien":"နော်ဝေး လိဂ်","Allsvenskan":"ဆွီဒင် လိဂ်","Danish Superliga":"ဒိန်းမတ် စူပါလိဂ်","Primeira Liga":"ပေါ်တူဂီ ပရီးမီးယားလိဂ်","La Liga 2":"စပိန် လာလီဂါ ၂","Ligue 2":"ပြင်သစ် လိဂ် ၂","Turkish Super Lig":"တူရကီ စူပါလိဂ်"};
const leagueLogos={"Premier League":"https://crests.football-data.org/PL.png","Serie A":"https://crests.football-data.org/SA.png","La Liga":"https://crests.football-data.org/PD.png","La Liga 2":"https://crests.football-data.org/SD.png","Primeira Liga":"https://crests.football-data.org/PPL.png"};
function matchCell(m){
 const div=element("div","odds-matchup");
 append(div,element("span","club-label",m.home),badge(m.home,m.homeCrestUrl),element("span","mini-vs","VS"),badge(m.away,m.awayCrestUrl),element("span","club-label",m.away));
 return div;
}
function leagueHeading(league){
 const heading=element("h2","odds-league-heading");
 const logo=safeLogo(leagueLogos[league]);
 if(logo){
  const icon=element("img","league-crest");icon.src=logo;icon.alt="";icon.loading="lazy";
  icon.onerror=()=>{icon.replaceWith(element("span","league-mark","⚽"));};
  heading.appendChild(icon);
 }else heading.appendChild(element("span","league-mark","⚽"));
 heading.appendChild(element("span","",groups[league]||league));
 return heading;
}
function render(data){
 const root=document.getElementById("oddsList");root.replaceChildren();
 document.getElementById("oddsCount").textContent=String(data.matches.length);
 document.getElementById("oddsDate").textContent=data.reportDate.split("-").reverse().join("/")+" · အာရှစျေးကွက် မနက်ပိုင်းကြေး";
 const grouped=new Map();
 for(const match of data.matches){if(!grouped.has(match.league))grouped.set(match.league,[]);grouped.get(match.league).push(match);}
 for(const [league,matches] of grouped){
  const section=element("section","odds-group");section.appendChild(leagueHeading(league));
  const wrap=element("div","odds-table-wrap"),table=element("table","odds-table");
  const thead=element("thead"),tr=element("tr");
  for(const name of ["ပွဲချိန်","ယှဉ်ပြိုင်မည့်အသင်း","အပေါ်အသင်း","ဘော်ဒီကြေး","ဂိုးပေါင်းကြေး","အင်တာနက်ခန့်မှန်းချက်"])
   tr.appendChild(element("th","",name));
  thead.appendChild(tr);table.appendChild(thead);const tbody=element("tbody");
  for(const m of matches){
   const row=element("tr");
   const time=m.kickoffDisplay||m.kickoff||"";
   const t=element("td","time",time),pair=element("td","team-pair");
   pair.appendChild(matchCell(m));
   append(row,t,pair,element("td","upper",m.upperTeam),element("td","price",m.bodyOdds),element("td","price",m.goalTotalOdds),element("td","prediction",m.pdfLastColumn));
   tbody.appendChild(row);
  }
  table.appendChild(tbody);wrap.appendChild(table);section.appendChild(wrap);root.appendChild(section);
 }
}
let loadedSheet=null;
async function downloadOdds(){
 const button=document.getElementById("oddsPngBtn"),status=document.getElementById("oddsExportStatus");
 if(!loadedSheet||!window.FutureCodeDailyExport?.saveOdds)return;
 button.disabled=true;status.textContent="ပွဲအားလုံးပါ PNG ပုံထုတ်နေပါတယ်…";
 try{await window.FutureCodeDailyExport.saveOdds(loadedSheet);status.textContent="ပွဲအားလုံးပါ PNG ဖိုင်ထုတ်ပြီးပါပြီ။";}
 catch(err){console.error(err);status.textContent="PNG ထုတ်မရသေးပါ — ပြန်စမ်းပါ။";}
 finally{button.disabled=false;}
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
  loadedSheet=data;render(data);
  document.getElementById("oddsPngBtn").disabled=!data.matches.length;
  document.getElementById("oddsExportStatus").textContent=data.matches.length+" ပွဲလုံးကို ပုံတစ်ပုံတည်း Download လုပ်နိုင်ပါပြီ။";
 }catch(err){
  console.error("Daily odds loading error",err);
  loadedSheet=null;
  document.getElementById("oddsPngBtn").disabled=true;
  document.getElementById("oddsExportStatus").textContent="ကြေးဒေတာမရှိသေးပါ။";
  document.getElementById("oddsCount").textContent="0";
  document.getElementById("oddsList").replaceChildren(element("div","odds-status","ဒီနေ့အတွက် ပေါက်ကြေးစာရင်း မတင်ရသေးပါ။"));
 }
}
document.addEventListener("DOMContentLoaded",()=>{
 document.getElementById("oddsPngBtn").addEventListener("click",downloadOdds);
 load();
});

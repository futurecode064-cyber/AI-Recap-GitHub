"use strict";
const tz="Asia/Yangon";
function dateKey(){const p=new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());const x=Object.fromEntries(p.map(v=>[v.type,v.value]));return x.year+"-"+x.month+"-"+x.day;}
function element(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e;}
function append(parent,...items){items.forEach(n=>parent.appendChild(n));return parent;}
const groups={"Premier League":"အင်္ဂလန် ပရီးမီးယားလိဂ်","Serie A":"အီတလီ စီးရီးအေ","La Liga":"စပိန် လာလီဂါ","Veikkausliiga":"ဖင်လန် လိဂ်","Eliteserien":"နော်ဝေး လိဂ်","Allsvenskan":"ဆွီဒင် လိဂ်","Danish Superliga":"ဒိန်းမတ် စူပါလိဂ်","Primeira Liga":"ပေါ်တူဂီ ပရီးမီးယားလိဂ်","La Liga 2":"စပိန် လာလီဂါ ၂","Ligue 2":"ပြင်သစ် လိဂ် ၂","Turkish Super Lig":"တူရကီ စူပါလိဂ်"};
function render(data){const root=document.getElementById("oddsList");root.replaceChildren();document.getElementById("oddsCount").textContent=String(data.matches.length);document.getElementById("oddsDate").textContent=data.reportDate.split("-").reverse().join("/")+" · PDF ပေါက်ကြေးစာရင်း";
 const grouped=new Map();for(const match of data.matches){if(!grouped.has(match.league))grouped.set(match.league,[]);grouped.get(match.league).push(match);}
 for(const [league,matches] of grouped){
  const section=element("section","odds-group");section.appendChild(element("h2","",groups[league]||league));
  const wrap=element("div","odds-table-wrap"),table=element("table","odds-table");
  const thead=element("thead"),tr=element("tr");
  for(const name of ["ပွဲချိန်","ယှဉ်ပြိုင်မည့်အသင်း","အပေါ်အသင်း","ဘော်ဒီကြေး","ဂိုးပေါင်းကြေး","PDF နောက်ဆုံးကော်လံ"])tr.appendChild(element("th","",name));
  thead.appendChild(tr);table.appendChild(thead);const tbody=element("tbody");
  for(const m of matches){const row=element("tr");const time=(m.kickoffDate===data.reportDate?"":"၁၃ ရက် မနက် · ")+m.kickoff;
   for(const [i,value] of [time,m.home+"  နှင့်  "+m.away,m.upperTeam,m.bodyOdds,m.goalTotalOdds,m.pdfLastColumn].entries())row.appendChild(element("td",i===0?"time":i===1?"team-pair":i===2?"upper":i>=3?"price":"",value));
   tbody.appendChild(row);}
  table.appendChild(tbody);wrap.appendChild(table);section.appendChild(wrap);root.appendChild(section);
 }
}
async function load(){const query=new URLSearchParams(location.search).get("date");const day=/^\d{4}-\d{2}-\d{2}$/.test(query||"")?query:dateKey();
 try{const response=await fetch("./data/odds/"+day+".json",{cache:"no-store"});if(!response.ok)throw Error("HTTP "+response.status);const data=await response.json();if(data.reportDate!==day||!Array.isArray(data.matches))throw Error("invalid sheet");render(data);}
 catch(err){document.getElementById("oddsCount").textContent="0";document.getElementById("oddsList").replaceChildren(element("div","odds-status","ဒီနေ့အတွက် ပေါက်ကြေးစာရင်း မတင်ရသေးပါ။"));}
}
document.addEventListener("DOMContentLoaded",load);

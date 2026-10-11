"use strict";
const LEAGUE_NAMES={
 "Premier League":"ပရီးမီးယားလိဂ်","La Liga":"လာလီဂါ","Serie A":"စီးရီးအေ",
 "Bundesliga":"ဘွန်ဒက်စ်လီဂါ","Ligue 1":"လီဂူးဝမ်း","Championship":"ချန်ပီယံရှစ်"
};
const TZ="Asia/Yangon";
let report={matches:[],published:false},selectedLeague="all",demo=false;
const $=id=>document.getElementById(id);
function dateParts(){
 const pieces=new Intl.DateTimeFormat("en-GB",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
 const p=Object.fromEntries(pieces.filter(x=>x.type!=="literal").map(x=>[x.type,x.value]));
 return {key:`${p.year}-${p.month}-${p.day}`,day:`${p.day}/${p.month}/${p.year}`};
}
function node(tag,classes="",txt){
 const el=document.createElement(tag);
 if(classes) el.className=classes;
 if(txt!==undefined && txt!==null)el.textContent=String(txt);
 return el;
}
function append(parent,...items){items.forEach(n=>{if(n)parent.appendChild(n)});return parent}
function goodUrl(url){try{let u=new URL(url);return u.protocol==="https:"||u.protocol==="http:"}catch{return false}}
function textOrEmpty(value){return typeof value==="string"&&value.trim()?value.trim():""}
function splitAnalysis(m){
 if(Array.isArray(m.analysisParagraphs))return m.analysisParagraphs.filter(x=>typeof x==="string"&&x.trim());
 return String(m.analysis||"").split(/\n\s*\n/g).map(x=>x.trim()).filter(Boolean);
}
function playerSide(match,prefix){
 const side=node("div","side");
 const wrap=node("div","player-wrap");
 const name=textOrEmpty(match[prefix+"PlayerName"]);
 const image=textOrEmpty(match[prefix+"PlayerImage"]);
 if(image&&goodUrl(image)){
   const picture=node("img","player-photo");picture.src=image;picture.alt=name?name+" ပုံ":prefix+" အသင်းကစားသမား";picture.loading="lazy";picture.referrerPolicy="no-referrer";
   picture.onerror=()=>{picture.remove();wrap.prepend(node("div","player-fallback",(name||match[prefix]).trim().slice(0,1)))};
   wrap.appendChild(picture);
 }else wrap.appendChild(node("div","player-fallback",(name||match[prefix]).trim().slice(0,1)));
 wrap.appendChild(node("div","player-name",name||match[prefix]));
 return append(side,wrap);
}
function oddBox(title,value){
 const box=node("div","odd");
 append(box,node("small","",title),node("strong",value?"":"missing",value||"ဈေးမရရှိသေး"));
 return box;
}
function renderMatch(match,i){
 const card=node("article","match-card"+(match.specialChoice?" is-special":""));
 const headline=node("div","match-topline");
 const league=node("span","league-name","◈ "+(LEAGUE_NAMES[match.league]||match.league||"ပွဲကြိုသုံးသပ်ချက်"));
 if(match.specialChoice)league.appendChild(node("span","special-mark","★ SPECIAL CHOICE"));
 append(headline,league,node("span","match-time",textOrEmpty(match.kickoffYangon)||"ကန်ချိန် မအတည်ပြုရသေး"));
 card.appendChild(headline);
 const banner=node("div","vs-banner");
 append(banner,playerSide(match,"home"),node("div","vs-circle","VS"),playerSide(match,"away"));
 card.appendChild(banner);
 const title=node("div","fixture-title");
 const h=node("h3");
 append(h,document.createTextNode(match.home||"Home"),node("span","versus","VS"),document.createTextNode(match.away||"Away"));
 append(title,h,node("p","",match.venue||"မြန်မာစံတော်ချိန်အတိုင်း ပွဲကြိုသုံးသပ်ချက်"));
 card.appendChild(title);
 const markets=node("div","odds-grid");
 append(markets,oddBox((match.home||"အိမ်ရှင်")+" ပေါက်ကြေး",match.homeOdds),
 oddBox("ဂိုးပေါင်း / O-U",match.goalLine),
 oddBox((match.away||"ဧည့်သည်")+" ပေါက်ကြေး",match.awayOdds));
 card.appendChild(markets);
 const expand=node("button","analysis-toggle","▾ သုံးသပ်ချက်ကို ဖတ်မည် / ခေါက်မည်");expand.type="button";expand.setAttribute("aria-expanded","true");
 const body=node("div","analysis-body");
 body.appendChild(node("h4","","ပွဲကြိုသုံးသပ်ချက်"));
 const paras=splitAnalysis(match);
 if(paras.length)paras.forEach(p=>body.appendChild(node("p","",p)));
 else body.appendChild(node("p","","အသင်းအင်အားနှင့် နောက်ဆုံးအချက်အလက်ကို စစ်ဆေးပြီးမှ သုံးသပ်ချက်ကို ထည့်သွင်းပါမည်။"));
 if(match.verdict || match.predictedScore || match.asianHandicap){
  const verdict=node("div","verdict-panel");verdict.appendChild(node("h4","","အဆုံးသတ် သုံးသပ်အမြင်"));
  if(match.verdict)verdict.appendChild(node("p","",match.verdict));
  const bottom=node("div","verdict-bottom");
  for(const [label,value] of [["ခန့်မှန်းရလဒ်",match.predictedScore],["Asian Handicap",match.asianHandicap],["ရွေးချယ်မှုအဆင့်",match.selectionConfidence]]){
   if(value){const item=node("span","",label+" — ");item.appendChild(node("b","",value));bottom.appendChild(item)}
  }
  verdict.appendChild(bottom);body.appendChild(verdict);
 }
 if(match.marketUpdatedAt&&match.homeOdds){body.appendChild(node("div","match-meta","Myanmar market စစ်ဆေးချိန် — "+match.marketUpdatedAt))}
 expand.addEventListener("click",()=>{let visible=!body.hidden;body.hidden=visible;expand.setAttribute("aria-expanded",String(!visible))});
 append(card,expand,body);
 return card;
}
function render(){
 const list=$("matchList");list.replaceChildren();
 const all=Array.isArray(report.matches)?report.matches:[];
 const picks=all.filter(m=>m.specialChoice===true);
 const selected=all.filter(m=>selectedLeague==="all"||selectedLeague==="special"&&m.specialChoice===true||m.league===selectedLeague);
 $("matchCount").textContent=String(all.length);$("specialCount").textContent=String(picks.length);
 $("statusText").textContent=demo?"DEMO PREVIEW":report.published?"ထုတ်ဝေပြီး":"မထုတ်ဝေရသေး";
 $("demoNotice").hidden=!demo;
 $("sectionNote").textContent=selectedLeague==="special"
 ?"လက်ရှိသတင်း၊ အသင်းအင်အားနဲ့ ဈေးကွက်အခြေအနေများကို အစုံစစ်ဆေးပြီး သီးသန့်ရွေးထားသည့် ပွဲများသာ ပါဝင်ပါမည်။"
 :`${selected.length} ပွဲကို ပြသနေသည် · မြန်မာစံတော်ချိန် ${dateParts().day}`;
 if(selected.length)selected.forEach((m,i)=>list.appendChild(renderMatch(m,i)));
 else{
  const card=node("div","empty-card");
  append(card,node("div","empty-icon",selectedLeague==="special"?"★":"○"),
   node("h3","",selectedLeague==="special"?"ဒီနေ့ Special Choice မရွေးရသေးပါ":report.published?"ဒီ Filter အတွက် ပွဲမရှိပါ":"ဒီနေ့ သုံးသပ်ချက် မထုတ်ဝေရသေးပါ"),
   node("p","",selectedLeague==="special"?"စစ်ဆေးမှုမပြည့်စုံသေးလျှင် ရွေးချယ်မှုကို အတင်းမဖော်ပြပါ။":
     "ဒီနေ့အတွက် အချက်အလက်အသစ်မရသေးပါ။ မနေ့ကပွဲတွေကို ဒီနေရာမှာ ပြန်မပြပါ။"));
  list.appendChild(card);
 }
 if(Array.isArray(report.noFixturesLeagues)&&report.noFixturesLeagues.length){
  list.appendChild(node("p","no-fixtures","ပွဲမရှိသည့် လိဂ်များ — "+report.noFixturesLeagues.map(x=>LEAGUE_NAMES[x]||x).join("၊ ")));
 }
}
async function load(){
 $("statusText").textContent="ရယူနေသည်";
 try{
  const url=new URLSearchParams(location.search);
  demo=url.get("demo")==="1";
  const path=demo?"./data/demo.json":"./data/today.json";
  const response=await fetch(path+"?t="+Date.now(),{cache:"no-store"});
  if(!response.ok)throw new Error("HTTP "+response.status);
  const json=await response.json();
  if(!demo&&json.reportDate!==dateParts().key){report={matches:[],published:false};}
  else report=json;
  render();
 }catch(e){
  $("statusText").textContent="ချိတ်ဆက်မှု မအောင်မြင်";
  $("matchList").replaceChildren();
  const card=node("div","empty-card");
  append(card,node("div","empty-icon","!"),node("h3","","အချက်အလက် ယူမရသေးပါ"),node("p","","Internet ချိတ်ဆက်မှု စစ်ပြီး Refresh လုပ်ပါ။"));
  $("matchList").appendChild(card);
 }
}
function init(){
 $("heroDate").textContent="MYANMAR · "+dateParts().day;
 $("filters").querySelectorAll("button").forEach(button=>button.addEventListener("click",()=>{
  selectedLeague=button.dataset.league||"all";
  $("filters").querySelectorAll("button").forEach(b=>b.classList.toggle("selected",b===button));
  render();
 }));
 $("reloadBtn").addEventListener("click",load);
 load();
}
document.addEventListener("DOMContentLoaded",init);

"use strict";
const LEAGUE_NAMES={
 "Premier League":"ပရီးမီးယားလိဂ်","La Liga":"လာလီဂါ","Serie A":"စီးရီးအေ",
 "Bundesliga":"ဘွန်ဒက်စ်လီဂါ","Ligue 1":"လီဂူးဝမ်း","Championship":"ချန်ပီယံရှစ်"
};
const TZ="Asia/Yangon";
let report={matches:[],published:false},selectedLeague="all",selectedDay=0;
const $=id=>document.getElementById(id);
function dateParts(){
 const pieces=new Intl.DateTimeFormat("en-GB",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
 const p=Object.fromEntries(pieces.filter(x=>x.type!=="literal").map(x=>[x.type,x.value]));
 return {key:`${p.year}-${p.month}-${p.day}`,day:`${p.day}/${p.month}/${p.year}`};
}
function selectedDateKey(offset=selectedDay){
 const today=dateParts().key;
 const d=new Date(today+"T12:00:00Z");
 d.setUTCDate(d.getUTCDate()+Number(offset));
 return d.toISOString().slice(0,10);
}
function displayDate(key){const [y,m,d]=key.split("-");return d+"/"+m+"/"+y}
function validFinal(m){return m?.status==="finished"&&/^\d+\s*[-:]\s*\d+$/.test(String(m.finalScore||""))}
function node(tag,classes="",txt){
 const el=document.createElement(tag);
 if(classes) el.className=classes;
 if(txt!==undefined && txt!==null)el.textContent=String(txt);
 return el;
}
function append(parent,...items){items.forEach(n=>{if(n)parent.appendChild(n)});return parent}
function appendBoldText(parent,plainText){
 // Trusted editorial formatting only: **text** becomes bold, never parsed as HTML.
 // Every other character remains literal text, preserving the author's wording.
 const chunks=String(plainText).split(/(\*\*[^*\n]+\*\*)/g);
 for(const part of chunks){
   if(!part)continue;
   if(part.startsWith("**")&&part.endsWith("**")&&part.length>4){
     parent.appendChild(node("strong","editorial-highlight",part.slice(2,-2)));
   }else parent.appendChild(document.createTextNode(part));
 }
 return parent;
}
function goodUrl(url){try{let u=new URL(url);return u.protocol==="https:"||u.protocol==="http:"}catch{return false}}
function textOrEmpty(value){return typeof value==="string"&&value.trim()?value.trim():""}
function splitAnalysis(m){
 if(Array.isArray(m.analysisParagraphs))return m.analysisParagraphs.filter(x=>typeof x==="string"&&x.trim());
 return String(m.analysis||"").split(/\n\s*\n/g).map(x=>x.trim()).filter(Boolean);
}
function teamSide(match,prefix){
 const side=node("div","side");
 const wrap=node("div","player-wrap");
 const name=textOrEmpty(match[prefix]);
 const crest=textOrEmpty(match[prefix+"CrestUrl"]);
 if(crest&&goodUrl(crest)){
   const img=node("img","team-crest");img.src=crest;img.alt=name+" အသင်းလိုဂို";img.loading="lazy";img.decoding="async";
   img.onerror=()=>{img.remove();wrap.prepend(node("div","team-crest-fallback",name.slice(0,2).toUpperCase()));};
   wrap.appendChild(img);
 }else wrap.appendChild(node("div","team-crest-fallback",name.slice(0,2).toUpperCase()));
 wrap.appendChild(node("div","player-name",name||"Team"));
 return append(side,wrap);
}
function oddBox(title,value){
 const box=node("div","odd");
 append(box,node("small","",title),node("strong",value?"":"missing",value||"ဈေးမရရှိသေး"));
 return box;
}
function renderMyanmarOdds(match){
 const source=match.myanmarOdds||{};
 const has=x=>x!==null&&x!==undefined&&String(x).trim()!=="";
 // Keep provider's raw Myanmar odds notation. No conversion to 1X2.
 const formatBody=()=>{
   if(has(source.bodyOdds))return String(source.bodyOdds);
   const hd=source.handicap||{};
   if(![hd.line,hd.home,hd.away].some(has))return "—";
   return [(has(hd.line)?"အကျော "+hd.line:""),
           (has(hd.home)?match.home+" "+hd.home:""),
           (has(hd.away)?match.away+" "+hd.away:"")].filter(Boolean).join(" · ");
 };
 const formatGoals=()=>{
   if(has(source.goalTotalOdds))return String(source.goalTotalOdds);
   const gl=source.goals||{};
   if(![gl.line,gl.over,gl.under].some(has))return "—";
   return [(has(gl.line)?"ဂိုးပေါင်း "+gl.line:""),
           (has(gl.over)?"Over "+gl.over:""),
           (has(gl.under)?"Under "+gl.under:"")].filter(Boolean).join(" · ");
 };
 const section=node("section","myanmar-market");
 section.appendChild(node("h4","myanmar-market-title","မြန်မာကြေး"));
 const content=node("div","myanmar-market-pairs");
 for(const [label,value] of [["ဘော်ဒီကြေး =",formatBody()],["ဂိုးပေါင်းကြေး =",formatGoals()]]){
   const row=node("div","myanmar-market-pair");
   row.appendChild(node("strong","",label));
   row.appendChild(node("span","",value));
   content.appendChild(row);
 }
 section.appendChild(content);

 return section;
}

function recentGames(match,side){
 const items=Array.isArray(match[side+"LastFive"])?match[side+"LastFive"].slice(0,5):[];
 const wrap=node("div","form-team");
 const head=node("div","form-team-head");
 const img=node("img","form-crest");
 img.src=match[side+"CrestUrl"]||"";img.alt="";img.loading="lazy";
 img.onerror=()=>img.remove();
 head.appendChild(img);head.appendChild(node("strong","",match[side]||"Team"));
 wrap.appendChild(head);
 if(!items.length){wrap.appendChild(node("p","form-empty","နောက်ဆုံး ၅ ပွဲ အတည်ပြုစာရင်း မတင်ရသေးပါ"));return wrap}
 for(const item of items){
   if(!item||typeof item!=="object")continue;
   const row=node("div","form-result-row");
   const score=Number.isInteger(item.teamGoals)&&Number.isInteger(item.opponentGoals)
     ?item.teamGoals+" – "+item.opponentGoals:"—";
   let result="";
   if(Number.isInteger(item.teamGoals)&&Number.isInteger(item.opponentGoals)){
     result=item.teamGoals>item.opponentGoals?"W":item.teamGoals<item.opponentGoals?"L":"D";
   }
   row.appendChild(node("span","form-result "+(result?"form-"+result.toLowerCase():""),result||"·"));
   const descr=node("span","form-opponent",(item.venueSide==="home"?"အိမ်ကွင်း · ":item.venueSide==="away"?"အဝေးကွင်း · ":"")+(item.opponent||""));
   row.appendChild(descr);row.appendChild(node("b","",score));
   wrap.appendChild(row);
 }
 return wrap;
}
function renderFormAndH2H(match){
 const section=node("section","form-h2h");
 section.appendChild(node("h4","form-title","ထိပ်တိုက်တွေ့ဆုံမှု (H2H) နှင့် နောက်ဆုံး ၅ ပွဲ"));
 const split=node("div","form-lastfive");
 split.appendChild(recentGames(match,"home"));split.appendChild(recentGames(match,"away"));
 section.appendChild(split);
 const h2h=node("div","h2h-records");
 h2h.appendChild(node("h5","","Head-to-Head · နောက်ဆုံး ၅ ကြိမ်"));
 const games=Array.isArray(match.headToHead)?match.headToHead.slice(0,5):[];
 if(!games.length) h2h.appendChild(node("p","form-empty","အတည်ပြုထားသော H2H ရလဒ် မတင်ရသေးပါ"));
 else for(const g of games){
   if(!g||typeof g!=="object")continue;
   const row=node("div","h2h-row");
   row.appendChild(node("span","h2h-date",g.date||""));
   row.appendChild(node("span","h2h-teams",(g.home||"")+" – "+(g.away||"")));
   row.appendChild(node("b","h2h-score",Number.isInteger(g.homeGoals)&&Number.isInteger(g.awayGoals)?g.homeGoals+" – "+g.awayGoals:"—"));
   h2h.appendChild(row);
 }
 section.appendChild(h2h);
 return section;
}
function renderFinished(match){
 const card=node("article","match-card result-card");
 card.appendChild(node("div","match-topline","◈ "+(LEAGUE_NAMES[match.league]||match.league||"")));
 const banner=node("div","vs-banner");
 const centre=node("div","result-score",match.finalScore);
 append(banner,teamSide(match,"home"),centre,teamSide(match,"away"));
 card.appendChild(banner);
 card.appendChild(node("div","result-meta",(match.home||"")+"  ·  "+(match.away||"")+"  |  ပွဲပြီး · "+(match.kickoffYangon||"")));
 return card;
}
function renderMatch(match,i){
 const card=node("article","match-card"+(match.specialChoice?" is-special":""));
 const headline=node("div","match-topline");
 const league=node("span","league-name","◈ "+(LEAGUE_NAMES[match.league]||match.league||"ပွဲကြိုသုံးသပ်ချက်"));
 if(match.specialChoice)league.appendChild(node("span","special-mark","★ SPECIAL CHOICE"));
 append(headline,league,node("span","match-time",textOrEmpty(match.kickoffYangon)||"ကန်ချိန် မအတည်ပြုရသေး"));
 card.appendChild(headline);
 const banner=node("div","vs-banner");
 append(banner,teamSide(match,"home"),node("div","vs-circle","VS"),teamSide(match,"away"));
 card.appendChild(banner);
 const title=node("div","fixture-title");
 const h=node("h3");
 append(h,document.createTextNode(match.home||"Home"),node("span","versus","VS"),document.createTextNode(match.away||"Away"));
 append(title,h,node("p","",match.venue||"မြန်မာစံတော်ချိန်အတိုင်း ပွဲကြိုသုံးသပ်ချက်"));
 card.appendChild(title);
 const markets=node("div","odds-grid");
 append(markets,oddBox((match.home||"အိမ်ရှင်")+" နိုင် (1)",match.homeOdds),
 oddBox("သရေ (X)",match.drawOdds),
 oddBox((match.away||"ဧည့်သည်")+" နိုင် (2)",match.awayOdds));
 card.appendChild(markets);

 card.appendChild(renderMyanmarOdds(match));
 card.appendChild(renderFormAndH2H(match));
 const expand=node("button","analysis-toggle","▾ သုံးသပ်ချက်ကို ဖတ်မည် / ခေါက်မည်");expand.type="button";expand.setAttribute("aria-expanded","true");
 const body=node("div","analysis-body");
 body.appendChild(node("h4","","ပွဲကြိုသုံးသပ်ချက်"));
 // Today's freshly researched normal analysis: one flowing Burmese commentary.
 const original=textOrEmpty(match.dailyPreviewText);
 if(original){
   body.appendChild(appendBoldText(node("p","daily-preview-verbatim"),original));
 }else{
   const paras=splitAnalysis(match);
   if(paras.length)paras.forEach(p=>body.appendChild(node("p","",p)));
   else body.appendChild(node("p","","ပွဲကြိုသုံးသပ်ချက်ကို မကြာမီဖော်ပြပါမည်။"));
 }
 // Only Special Choice receives a separate, researched editorial assessment.
 if(selectedLeague==="special"&&match.specialChoice&&Array.isArray(match.specialAnalysisParagraphs)&&match.specialAnalysisParagraphs.length){
   const special=node("section","special-analysis");
   special.appendChild(node("h4","","★ Special Choice — အချက်အလက်အပြည့်အစုံ သုံးသပ်ချက်"));
   match.specialAnalysisParagraphs.filter(p=>typeof p==="string"&&p.trim()).forEach(p=>special.appendChild(node("p","",p)));
   body.appendChild(special);
 }
 if(!original&&(match.verdict || match.predictedScore || match.asianHandicap)){
  const verdict=node("div","verdict-panel");verdict.appendChild(node("h4","","အဆုံးသတ် သုံးသပ်အမြင်"));
  if(match.verdict)verdict.appendChild(node("p","",match.verdict));
  const bottom=node("div","verdict-bottom");
  for(const [label,value] of [["ခန့်မှန်းရလဒ်",match.predictedScore],["Asian Handicap",match.asianHandicap]]){
   if(value){const item=node("span","",label+" — ");item.appendChild(node("b","",value));bottom.appendChild(item)}
  }
  verdict.appendChild(bottom);body.appendChild(verdict);
 }

 expand.addEventListener("click",()=>{let visible=!body.hidden;body.hidden=visible;expand.setAttribute("aria-expanded",String(!visible))});
 append(card,expand,body);
 const actions=node("div","match-actions");
 const select=node("select","poster-size");select.setAttribute("aria-label","PNG ပုံအရွယ်အစား ရွေးရန်");
 for(const [value,label] of [["full","သုံးသပ်ချက်အပြည့် PNG"],["square","Facebook 1:1 · 1080×1080"],["feed","Facebook 4:5 · 1080×1350"],["story","Story 9:16 · 1080×1920"]]){
   const option=node("option","",label);option.value=value;select.appendChild(option);
 }
 const button=node("button","match-download","↓ PNG ပုံ Download မယ်");
 button.type="button";
 button.setAttribute("aria-label",match.home+" နှင့် "+match.away+" ပွဲပုံကို PNG အဖြစ် သိမ်းရန်");
 button.addEventListener("click",async()=>{
   if(button.disabled)return;
   const old=button.textContent;
   button.disabled=true;button.textContent="PNG ပုံ ပြင်ဆင်နေသည်…";
   try{
     const opts={leagueLabel:LEAGUE_NAMES[match.league]||match.league,
       brandName:document.documentElement.dataset.footballBrandName||"FUTURE CODE FOOTBALL",
       brandLogoUrl:document.documentElement.dataset.footballBrandLogoUrl||"",
       special:selectedLeague==="special"};
     if(select.value==="full"){
       if(!window.FutureCodeCardExport)throw Error("Full export module missing");
       await window.FutureCodeCardExport.save(match,opts);
     }else{
       if(!window.FutureCodeSocialExport)throw Error("Social export module missing");
       await window.FutureCodeSocialExport.save(match,{...opts,format:select.value});
     }
     button.textContent="✓ PNG Download စတင်ပြီး";
   }catch(err){
     console.error("Match PNG download error",err);
     button.textContent="Download မအောင်မြင်ပါ — ပြန်နှိပ်ရန်";
   }finally{
     button.disabled=false;
     setTimeout(()=>{if(button.isConnected)button.textContent=old},2500);
   }
 });
 actions.appendChild(select);actions.appendChild(button);
 card.appendChild(actions);
 return card;
}
function render(){
 const list=$("matchList");list.replaceChildren();
 const all=Array.isArray(report.matches)?report.matches:[];
 const picks=all.filter(m=>m.specialChoice===true);
 const selected=all.filter(m=>(selectedLeague==="all"||selectedLeague==="special"&&m.specialChoice===true||m.league===selectedLeague)&&(selectedDay!==-1||validFinal(m)));
 $("matchCount").textContent=String(selectedDay===-1?all.filter(validFinal).length:all.length);$("specialCount").textContent=String(selectedDay===-1?picks.filter(validFinal).length:picks.length);
 $("statusText").textContent=selectedDay===-1?(all.some(validFinal)?"ရလဒ်အတည်ပြုပြီး":"ရလဒ်မရရှိသေး"):(report.published?"ထုတ်ဝေပြီး":"Data မရရှိသေး");
 const labels={"-1":["မနေ့က ပွဲရလဒ်များ","● YESTERDAY"],"0":["ဒီနေ့ ပွဲကြိုသုံးသပ်ချက်များ","● TODAY"],"1":["မနက်ဖြန် ပွဲကြိုသုံးသပ်ချက်များ","● TOMORROW"]};
 $("reportHeading").textContent=labels[selectedDay][0];
 $("reportPill").textContent=labels[selectedDay][1];
 $("sectionNote").textContent=selectedLeague==="special"
 ?"လက်ရှိသတင်း၊ အသင်းအင်အားနဲ့ ဈေးကွက်အခြေအနေများကို အစုံစစ်ဆေးပြီး သီးသန့်ရွေးထားသည့် ပွဲများသာ ပါဝင်ပါမည်။"
 :`${selected.length} ပွဲကို ပြသနေသည် · မြန်မာစံတော်ချိန် ${displayDate(selectedDateKey())}`;
 if(selected.length)selected.forEach((m,i)=>list.appendChild(selectedDay===-1?renderFinished(m):renderMatch(m,i)));
 else{
  const card=node("div","empty-card");
  append(card,node("div","empty-icon",selectedLeague==="special"?"★":"○"),
   node("h3","",selectedDay===-1?"မနေ့က အတည်ပြုရလဒ် မတင်ရသေးပါ":selectedDay===1&&!report.published?"မနက်ဖြန် ပွဲစဉ်များ မတင်ရသေးပါ":selectedLeague==="special"?"Special Choice မရွေးရသေးပါ":report.published?"ဒီ Filter အတွက် ပွဲမရှိပါ":"ဒီနေ့ သုံးသပ်ချက် မထုတ်ဝေရသေးပါ"),
   node("p","",selectedLeague==="special"?"စစ်ဆေးမှုမပြည့်စုံသေးလျှင် ရွေးချယ်မှုကို အတင်းမဖော်ပြပါ။":
     selectedDay===-1?"ပွဲပြီးရလဒ်ကို အတည်ပြုပြီးမှသာ ဤနေရာတွင် ဖော်ပြပါမည်။":selectedDay===1?"မနက်ဖြန်ပွဲစဉ် အတည်ပြုချက်ရရှိလျှင် ဖော်ပြပါမည်။":"ဒီနေ့အတွက် အချက်အလက်အသစ်မရသေးပါ။"));
  list.appendChild(card);
 }
 if(Array.isArray(report.noFixturesLeagues)&&report.noFixturesLeagues.length){
  list.appendChild(node("p","no-fixtures","ပွဲမရှိသည့် လိဂ်များ — "+report.noFixturesLeagues.map(x=>LEAGUE_NAMES[x]||x).join("၊ ")));
 }
}
async function load(){
 $("statusText").textContent="ရယူနေသည်";
 try{
  const offset=selectedDay;
  const target=selectedDateKey(offset);
  const path=offset===0?(document.documentElement.dataset.footballDataUrl||"./data/today.json"):
    offset===-1?"./data/archive/"+target+".json":"./data/upcoming/"+target+".json";
  const url=new URL(path,document.baseURI);url.searchParams.set("t",Date.now());
  const response=await fetch(url.toString(),{cache:"no-store"});
  if(offset!==selectedDay)return;
  if(response.status===404){report={reportDate:target,matches:[],published:false};render();return}
  if(!response.ok)throw new Error("HTTP "+response.status);
  const json=await response.json();
  if(offset!==selectedDay)return;
  report=json.reportDate===target?json:{reportDate:target,matches:[],published:false};
  render();
 }catch(e){
  if(typeof offset!=="undefined"&&offset!==selectedDay)return;
  $("statusText").textContent="ချိတ်ဆက်မှု မအောင်မြင်";
  $("matchList").replaceChildren();
  const card=node("div","empty-card");
  append(card,node("div","empty-icon","!"),node("h3","","အချက်အလက် ယူမရသေးပါ"),node("p","","Internet ချိတ်ဆက်မှု စစ်ပြီး Refresh လုပ်ပါ။"));
  $("matchList").appendChild(card);
 }
}
function init(){
 $("heroDate").textContent="MYANMAR · "+dateParts().day;
 for(const button of $("dateTabs").querySelectorAll("button")){
   const offset=Number(button.dataset.day);
   const small=$("date"+(offset===-1?"Yesterday":offset===0?"Today":"Tomorrow"));
   small.textContent=displayDate(selectedDateKey(offset));
   button.addEventListener("click",()=>{
     selectedDay=offset;
     $("dateTabs").querySelectorAll("button").forEach(b=>{b.classList.toggle("active",b===button);b.setAttribute("aria-current",String(b===button))});
     report={matches:[],published:false};load();
   });
 }
 $("filters").querySelectorAll("button").forEach(button=>button.addEventListener("click",()=>{
  selectedLeague=button.dataset.league||"all";
  $("filters").querySelectorAll("button").forEach(b=>b.classList.toggle("selected",b===button));
  render();
 }));
 $("reloadBtn").addEventListener("click",load);
 load();
}
document.addEventListener("DOMContentLoaded",init);

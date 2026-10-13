"use strict";
const LEAGUE_NAMES={
 "Premier League":"ပရီးမီးယားလိဂ်","Championship":"ချန်ပီယံရှစ်",
 "League One":"အင်္ဂလန် လိဂ်ဝမ်း","La Liga":"လာလီဂါ","La Liga 2":"စပိန် လာလီဂါ ၂",
 "Serie A":"စီးရီးအေ","Serie B":"အီတလီ စီးရီးဘီ",
 "Bundesliga":"ဘွန်ဒက်စ်လီဂါ","2. Bundesliga":"ဂျာမနီ ဘွန်ဒက်စ်လီဂါ ၂",
 "Ligue 1":"လီဂူးဝမ်း","Ligue 2":"ပြင်သစ် လီဂူး ၂",
 "FA Cup":"အင်္ဂလန် FA ဖလား","EFL Cup":"အင်္ဂလန် လိဂ်ဖလား",
 "Coppa Italia":"အီတလီဖလား","Copa del Rey":"စပိန် ဘုရင့်ဖလား",
 "DFB-Pokal":"ဂျာမနီဖလား","Coupe de France":"ပြင်သစ်ဖလား",
 "UEFA Champions League":"ချန်ပီယံလိဂ်","UEFA Europa League":"ယူရိုပါလိဂ်",
 "UEFA Conference League":"ယူရိုပါ ကွန်ဖရင့်လိဂ်",
 "UEFA Nations League":"နိုင်ငံအသင်း နေးရှင်းလိဂ်",
 "FIFA World Cup":"ကမ္ဘာ့ဖလား","FIFA World Cup Qualifying":"ကမ္ဘာ့ဖလား ခြေစစ်ပွဲ",
 "UEFA Euro":"ဥရောပနိုင်ငံများဖလား","UEFA Euro Qualifying":"ယူရို ခြေစစ်ပွဲ"
};
const LEAGUE_ALIASES={
 "England League 1":"League One","EFL League One":"League One",
 "League 1":"League One","English League One":"League One",
 "Italy Serie B":"Serie B","Italian Serie B":"Serie B",
 "Spain LaLiga 2":"La Liga 2","Spanish LALIGA 2":"La Liga 2",
 "Segunda Division":"La Liga 2","LaLiga 2":"La Liga 2",
 "Germany Bundesliga 2":"2. Bundesliga","German 2. Bundesliga":"2. Bundesliga",
 "France Ligue 2":"Ligue 2","French Ligue 2":"Ligue 2",
 "English FA Cup":"FA Cup","English Carabao Cup":"EFL Cup","Carabao Cup":"EFL Cup","League Cup":"EFL Cup",
 "Italy Cup":"Coppa Italia","Spain Cup":"Copa del Rey",
 "Germany Cup":"DFB-Pokal","France Cup":"Coupe de France",
 "Champions League":"UEFA Champions League","Europa League":"UEFA Europa League",
 "Europa Conference League":"UEFA Conference League","UEFA Europa Conference League":"UEFA Conference League",
 "National League":"UEFA Nations League","Nations League":"UEFA Nations League",
 "World Cup":"FIFA World Cup","World Cup Qualifiers":"FIFA World Cup Qualifying",
 "EURO":"UEFA Euro","European Championship":"UEFA Euro","Euro Qualifiers":"UEFA Euro Qualifying"
};
function canonicalLeague(value){return LEAGUE_ALIASES[value]||value;}
function leagueName(value){const key=canonicalLeague(value);return LEAGUE_NAMES[key]||value||"ပွဲကြိုသုံးသပ်ချက်";}
const TEAM_NAMES_MM={
 "Coventry City":"ကိုဗင်ထရီ","Newcastle United":"နယူးကာဆယ်","Atalanta":"အတ္တလန်တာ","Venezia":"ဗင်နီဇီယာ",
 "Torino":"တိုရီနို","Udinese":"အူဒီးနီးစ်","Levante":"လီဗန်တေး","Sevilla":"ဆီဗီလာ",
 "Real Valladolid":"ဗယ်လာဒိုလစ်","Albacete":"အယ်လ်ဘာစီတီ","Burgos CF":"ဘာဂို့စ်","Granada":"ဂရန်နာဒါ",
 "Real Oviedo":"အိုဗီဒို","Eibar":"အီဘာ","Tenerife":"တီနီရီဖီ","Girona":"ဂီရိုနာ","Dijon":"ဒီဂျွန်","Metz":"မက်ဇ်",
 "Arsenal":"အာဆင်နယ်","Hull City":"ဟားလ်စီးတီး","Manchester City":"မန်ချက်စတာစီးတီး",
 "Brighton":"ဘရိုက်တန်","Nottingham Forest":"နော်တင်ဟမ်ဖောရက်စ်","Liverpool":"လီဗာပူး",
 "Tottenham Hotspur":"တော့တင်ဟမ်","Bournemouth":"ဘုန်းမောက်","Leeds United":"လိဒ်စ်ယူနိုက်တက်",
 "Milan":"အေစီမီလန်","Sassuolo":"ဆာဆူအိုလို","Fiorentina":"ဖီအိုရင်တီးနား","Roma":"ရိုးမား",
 "Bologna":"ဘိုလော့ညာ","Cagliari":"ကာဂလီယာရီ","Como":"ကိုမို",
 "Lazio":"လာဇီယို","Hapoel Tel Aviv":"ဟာပိုရယ် တဲလ်အဗစ်","Juventus":"ဂျူဗင်တပ်စ်",
 "Las Palmas":"လာ့စ်ပါလ်မက်စ်","Córdoba":"ကော်ဒိုဘာ","AD Ceuta":"ဆီယူတာ",
 "FC Andorra":"အန်ဒိုရာ","Eldense":"အယ်လ်ဒန်ဆီ","Leganés":"လီဂါနက်စ်","Sporting Gijón":"စပို့တင်းဂီဟွန်",
 "Sabadell":"ဆာဘာဒဲလ်","Almería":"အယ်လ်မေရီယာ","Real Sociedad II":"ဆိုစီဒက် ဘီ",
 "Mallorca":"မယ်ယောကာ","Annecy":"အန်နက်စီ","Laval":"လာဗယ်","Boulogne-sur-Mer":"ဘူလိုနီ",
 "Saint-Étienne":"စိန့်အက်တီယန်","Clermont":"ကလယ်မွန့်","Red Star":"ရက်ဒ်စတား",
 "Rodez":"ရိုဒက်ဇ်","Celtа Fortuna":"ဆယ်လ်တာ ဖော်ကျူနာ"
};
function localizedTeam(value){return TEAM_NAMES_MM[value]||value||"";}
const TZ="Asia/Yangon";
let report={matches:[],published:false},selectedLeague="all",selectedDay=0;
const NO_PREVIEW_TEXT="ပွဲကြိုသုံးသပ်ချက်များ မရသေးပါ";
let loadSequence=0,loading=false;
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
function teamLabel(match,side){return textOrEmpty(match[side+"Display"])||textOrEmpty(match[side])||"Team"}
function textOrEmpty(value){return typeof value==="string"&&value.trim()?value.trim():""}
function splitAnalysis(m){
 if(Array.isArray(m.analysisParagraphs))return m.analysisParagraphs.filter(x=>typeof x==="string"&&x.trim());
 return String(m.analysis||"").split(/\n\s*\n/g).map(x=>x.trim()).filter(Boolean);
}
function teamSide(match,prefix){
 const side=node("div","side");
 const wrap=node("div","player-wrap");
 const name=teamLabel(match,prefix);
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
   if(has(source.bodyOdds))return (has(source.upperTeam)?String(source.upperTeam)+"  ":"")+String(source.bodyOdds);
   const hd=source.handicap||{};
   if(![hd.line,hd.home,hd.away].some(has))return "—";
   return [(has(hd.line)?"အကျော "+hd.line:""),
           (has(hd.home)?teamLabel(match,"home")+" "+hd.home:""),
           (has(hd.away)?teamLabel(match,"away")+" "+hd.away:"")].filter(Boolean).join(" · ");
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

function inlineClubLogo(url,name,classes="mini-club-logo"){
 const src=textOrEmpty(url);
 const frame=node("span",classes);
 frame.title=name;
 if(src&&goodUrl(src)){
  const img=node("img");img.src=src;img.alt=name+" အသင်းလိုဂို";img.loading="lazy";img.decoding="async";
  img.onerror=()=>{img.remove();frame.appendChild(node("span","mini-logo-fallback",name.slice(0,2)));};
  frame.appendChild(img);
 }else frame.appendChild(node("span","mini-logo-fallback",name.slice(0,2)));
 return frame;
}
function recentGames(match,side){
 const items=Array.isArray(match[side+"LastFive"])?match[side+"LastFive"].slice(0,5):[];
 const wrap=node("div","form-team");
 const head=node("div","form-team-head");
 const img=node("img","form-crest");
 img.src=match[side+"CrestUrl"]||"";img.alt="";img.loading="lazy";
 img.onerror=()=>img.remove();
 head.appendChild(img);head.appendChild(node("strong","",teamLabel(match,side)));
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
   const descr=node("span","form-opponent");
   append(descr,inlineClubLogo(item.opponentCrestUrl,localizedTeam(item.opponent)),
      node("span","",(item.venueSide==="home"?"အိမ်ကွင်း · ":item.venueSide==="away"?"အဝေးကွင်း · ":"")+localizedTeam(item.opponent)));
   row.appendChild(descr);row.appendChild(node("b","",score));
   wrap.appendChild(row);
 }
 return wrap;
}
function renderFormAndH2H(match){
 const section=node("section","form-h2h");
 section.appendChild(node("h4","form-title","ထိပ်တိုက်တွေ့ဆုံမှု (H2H) နှင့် နောက်ဆုံး ၅ ပွဲ"));
 const split=node("div","form-three-grid");
 const homeForm=recentGames(match,"home");
 const awayForm=recentGames(match,"away");
 homeForm.classList.add("form-home");
 awayForm.classList.add("form-away");
 const h2h=node("div","h2h-records");
 h2h.appendChild(node("h5","","Head-to-Head · နောက်ဆုံး ၅ ကြိမ်"));
 const games=Array.isArray(match.headToHead)?match.headToHead.slice(0,5):[];
 if(!games.length) h2h.appendChild(node("p","form-empty","အတည်ပြုထားသော H2H ရလဒ် မတင်ရသေးပါ"));
 else for(const g of games){
   if(!g||typeof g!=="object")continue;
   const row=node("div","h2h-row");
   row.appendChild(node("span","h2h-date",g.date||""));
   const matchup=node("span","h2h-teams");
   append(matchup,inlineClubLogo(g.homeCrestUrl|| (g.home===match.home?match.homeCrestUrl:""),localizedTeam(g.home)),
     node("span","",localizedTeam(g.home)),
     node("span","h2h-dash","–"),
     inlineClubLogo(g.awayCrestUrl|| (g.away===match.away?match.awayCrestUrl:""),localizedTeam(g.away)),
     node("span","",localizedTeam(g.away)));
   row.appendChild(matchup);
   row.appendChild(node("b","h2h-score",Number.isInteger(g.homeGoals)&&Number.isInteger(g.awayGoals)?g.homeGoals+" – "+g.awayGoals:"—"));
   h2h.appendChild(row);
 }
 h2h.classList.add("form-middle");
 append(split,homeForm,h2h,awayForm);
 section.appendChild(split);
 return section;
}
function renderFinished(match){
 const card=node("article","match-card result-card");
 card.appendChild(node("div","match-topline","◈ "+leagueName(match.league)));
 const banner=node("div","vs-banner");
 const centre=node("div","result-score",match.finalScore);
 append(banner,teamSide(match,"home"),centre,teamSide(match,"away"));
 card.appendChild(banner);
 card.appendChild(node("div","result-meta",teamLabel(match,"home")+"  ·  "+teamLabel(match,"away")+"  |  ပွဲပြီး · "+(match.kickoffYangon||"")));
 return card;
}
function renderFixtureOnly(match){
 const card=node("article","match-card fixture-only");
 const headline=node("div","match-topline");
 append(headline,
  node("span","league-name","◈ "+leagueName(match.league)),
  node("span","match-time",(match.status==="live"?"🔴 LIVE "+(match.liveScore||"")+" · ":"")+(match.kickoffYangon||"")));
 card.appendChild(headline);
 const banner=node("div","vs-banner");
 append(banner,teamSide(match,"home"),node("div","vs-circle","VS"),teamSide(match,"away"));
 card.appendChild(banner);
 const title=node("div","fixture-title");
 const heading=node("h3");
 append(heading,document.createTextNode(teamLabel(match,"home")),node("span","versus","VS"),document.createTextNode(teamLabel(match,"away")));
 append(title,heading,node("p","",match.venue||"အတည်ပြုပွဲစဉ် · မြန်မာစံတော်ချိန်"));
 card.appendChild(title);
 card.appendChild(node("p","section-note",NO_PREVIEW_TEXT));
 return card;
}
function renderMatch(match,i){
 const card=node("article","match-card"+(match.specialChoice?" is-special":""));
 const headline=node("div","match-topline");
 const league=node("span","league-name","◈ "+leagueName(match.league));
 if(match.specialChoice)league.appendChild(node("span","special-mark","★ SPECIAL CHOICE"));
 const liveLabel=match.status==="live"&&/^\d+\s*[-:]\s*\d+$/.test(String(match.liveScore||""))?"🔴 LIVE "+match.liveScore+" · ":"";
 append(headline,league,node("span","match-time",liveLabel+(textOrEmpty(match.kickoffYangon)||"ကန်ချိန် မအတည်ပြုရသေး")));
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
 append(markets,oddBox(teamLabel(match,"home")+" နိုင် (1)",match.homeOdds),
 oddBox("သရေ (X)",match.drawOdds),
 oddBox(teamLabel(match,"away")+" နိုင် (2)",match.awayOdds));
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
   else body.appendChild(node("p","",NO_PREVIEW_TEXT));
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
 // One action, one complete PNG: no format dropdown or truncated social poster.
 const button=node("button","match-download","↓ အချက်အလက်အပြည့်အစုံ PNG သိမ်းမယ်");
 button.type="button";
 button.setAttribute("aria-label",teamLabel(match,"home")+" နှင့် "+teamLabel(match,"away")+" ပွဲ၏ အချက်အလက်အပြည့်အစုံကို PNG သိမ်းရန်");
 button.addEventListener("click",async()=>{
  if(button.disabled)return;
  const old=button.textContent;
  button.disabled=true;button.textContent="PNG အပြည့်အစုံ ပြင်ဆင်နေသည်…";
  try{
   if(!window.FutureCodeCardExport)throw Error("Full export module missing");
   await window.FutureCodeCardExport.save({...match,home:teamLabel(match,"home"),away:teamLabel(match,"away")},{
    leagueLabel:leagueName(match.league),
    brandName:document.documentElement.dataset.footballBrandName||"FUTURE CODE FOOTBALL",
    brandLogoUrl:document.documentElement.dataset.footballBrandLogoUrl||"",
    special:match.specialChoice===true,
    cardNode:card
   });
   button.textContent="✓ PNG Download စတင်ပြီး";
  }catch(err){
   console.error("Match PNG download error",err);
   button.textContent="Download မအောင်မြင်ပါ — ပြန်နှိပ်ရန်";
  }finally{
   button.disabled=false;
   setTimeout(()=>{if(button.isConnected)button.textContent=old},2500);
  }
 });
 actions.appendChild(button);
 card.appendChild(actions);
 return card;
}
function renderLeagueFilters(all){
 const available=new Set(all.filter(m=>selectedDay!==-1||validFinal(m)).map(m=>canonicalLeague(m.league)));
 const ordered=Object.keys(LEAGUE_NAMES).filter(league=>available.has(league));
 // Preserve future competition data without exposing empty/no-fixture filters.
 for(const league of available)if(league&&!ordered.includes(league))ordered.push(league);
 const picks=all.some(m=>(selectedDay!==-1||validFinal(m))&&m.specialChoice===true);
 if(selectedLeague!=="all"&&(selectedLeague!=="special"||!picks)&&!ordered.includes(selectedLeague))selectedLeague="all";
 const filters=$("filters");filters.replaceChildren();
 const add=(value,label,special=false)=>{
  const button=node("button",special?"filter-special":"",label);
  button.type="button";button.dataset.league=value;
  button.classList.toggle("selected",selectedLeague===value);
  button.addEventListener("click",()=>{selectedLeague=value;render()});
  filters.appendChild(button);
 };
 add("all","ပွဲအားလုံး");
 for(const league of ordered)add(league,leagueName(league));
 if(picks)add("special","★ Special Choice",true);
}
function render(){
 const bar=$("resultsDownloadBar");
 if(bar)bar.hidden=selectedDay!==-1||loading||!Array.isArray(report.matches)||!report.matches.some(validFinal);
 const list=$("matchList");list.replaceChildren();
 if(loading){
  $("matchCount").textContent="—";$("specialCount").textContent="—";
  list.appendChild(node("div","empty-card","သုံးသပ်ချက်များ ရယူနေပါတယ်…"));return;
 }
 const all=Array.isArray(report.matches)?report.matches:[];
 renderLeagueFilters(all);
 const picks=all.filter(m=>m.specialChoice===true);
 const selected=all.filter(m=>(selectedLeague==="all"||selectedLeague==="special"&&m.specialChoice===true||canonicalLeague(m.league)===selectedLeague)&&(selectedDay!==-1||validFinal(m)));
 $("matchCount").textContent=String(selectedDay===-1?all.filter(validFinal).length:all.length);$("specialCount").textContent=String(selectedDay===-1?picks.filter(validFinal).length:picks.length);
 $("statusText").textContent=selectedDay===-1?(all.some(validFinal)?"ရလဒ်အတည်ပြုပြီး":"ရလဒ်မရရှိသေး"):(report.published?"ထုတ်ဝေပြီး":NO_PREVIEW_TEXT);
 const labels={"-1":["မနေ့က ပွဲရလဒ်များ","● YESTERDAY"],"0":["ဒီနေ့ ပွဲကြိုသုံးသပ်ချက်များ","● TODAY"]};
 $("reportHeading").textContent=labels[selectedDay][0];
 $("reportPill").textContent=labels[selectedDay][1];
 $("sectionNote").textContent=selectedDay!==-1&&!report.published?NO_PREVIEW_TEXT:selectedLeague==="special"
 ?"လက်ရှိသတင်း၊ အသင်းအင်အားနဲ့ ဈေးကွက်အခြေအနေများကို အစုံစစ်ဆေးပြီး သီးသန့်ရွေးထားသည့် ပွဲများသာ ပါဝင်ပါမည်။"
 :`${selected.length} ပွဲကို ပြသနေသည် · မြန်မာစံတော်ချိန် ${displayDate(selectedDateKey())}`;
 if(selected.length)selected.forEach((m,i)=>list.appendChild(selectedDay===-1?renderFinished(m):report.fixtureSnapshot?renderFixtureOnly(m):renderMatch(m,i)));
 else{
  const card=node("div","empty-card");
  const previewUnavailable=selectedDay!==-1&&!report.published;
  append(card,node("div","empty-icon",selectedLeague==="special"?"★":"○"),
   node("h3","",previewUnavailable?NO_PREVIEW_TEXT:selectedDay===-1?"မနေ့က အတည်ပြုရလဒ် မတင်ရသေးပါ":selectedLeague==="special"?"Special Choice မရွေးရသေးပါ":"ဒီ Filter အတွက် ပွဲမရှိပါ"));
  if(selectedDay===-1){
   card.appendChild(node("p","","ပွဲပြီးရလဒ်ကို အတည်ပြုပြီးမှသာ ဤနေရာတွင် ဖော်ပြပါမည်။"));
  }else if(!previewUnavailable&&selectedLeague==="special"){
   card.appendChild(node("p","","စစ်ဆေးမှုမပြည့်စုံသေးလျှင် ရွေးချယ်မှုကို အတင်းမဖော်ပြပါ။"));
  }
  list.appendChild(card);
 }
 // No-fixture leagues/cups are intentionally hidden from the public UI.
}
function refreshDateLabels(){
 $("heroDate").textContent="MYANMAR · "+dateParts().day;
 for(const [id,offset] of [["dateYesterday",-1],["dateToday",0]]){
  $(id).textContent=displayDate(selectedDateKey(offset));
 }
 const labels={"-1":["မနေ့က ပွဲရလဒ်များ","● YESTERDAY"],"0":["ဒီနေ့ ပွဲကြိုသုံးသပ်ချက်များ","● TODAY"]};
 $("reportHeading").textContent=labels[selectedDay][0];
 $("reportPill").textContent=labels[selectedDay][1];
}
async function load(){
 const sequence=++loadSequence;
 const offset=selectedDay,target=selectedDateKey(offset);
 const isCurrent=()=>sequence===loadSequence&&offset===selectedDay&&target===selectedDateKey(offset);
 loading=true;refreshDateLabels();render();
 $("statusText").textContent="ရယူနေသည်";
 $("sectionNote").textContent="မြန်မာစံတော်ချိန် "+displayDate(target);
 $("matchList").setAttribute("aria-busy","true");
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),15000);
 try{
  // Resolve every date relative to the configured data directory, including branded pages.
  const todayUrl=new URL(document.documentElement.dataset.footballDataUrl||"./data/today.json",document.baseURI);
  const url=offset===0?todayUrl:new URL("archive/"+target+".json",todayUrl);
  url.searchParams.set("t",Date.now());
  const response=await fetch(url.toString(),{cache:"no-store",signal:controller.signal});
  if(!isCurrent())return;
  if(response.status!==404&&!response.ok)throw new Error("HTTP "+response.status);
  const json=response.ok?await response.json():null;
  if(!isCurrent())return;
  if(json&&(!Array.isArray(json.matches)||json.matches.some(m=>!m||typeof m!=="object"||typeof m.home!=="string"||typeof m.away!=="string")))throw new Error("Invalid report data");
  if(json&&json.reportDate===target&&json.published===true){
    report=json;
  }else{
    // A separately verified public-data snapshot is displayed as fixtures ONLY.
    // Never describe it as an AI-published preview, invent odds or offer poster exports.
    let snapshot=null;
    try{
      const fixtureUrl=new URL("fixtures/"+target+".json",todayUrl);
      fixtureUrl.searchParams.set("t",Date.now());
      const fixtureResponse=await fetch(fixtureUrl.toString(),{cache:"no-store",signal:controller.signal});
      if(fixtureResponse.ok){
        const candidate=await fixtureResponse.json();
        if(candidate?.reportDate===target&&candidate.fixtureSnapshot===true&&Array.isArray(candidate.matches)
          &&candidate.matches.every(m=>m&&typeof m.home==="string"&&typeof m.away==="string"&&m.fixtureOnly===true)){
          snapshot=candidate;
        }
      }
    }catch(err){console.warn("Optional fixture-only snapshot unavailable",err);}
    if(!isCurrent())return;
    report=snapshot?{...snapshot,published:false}:{reportDate:target,matches:[],published:false};
  }
  loading=false;render();
 }catch(e){
  if(!isCurrent())return;
  loading=false;report={reportDate:target,matches:[],published:false};
  $("statusText").textContent="ချိတ်ဆက်မှု မအောင်မြင်";
  $("matchCount").textContent="—";$("specialCount").textContent="—";
  $("matchList").replaceChildren();
  const card=node("div","empty-card");
  append(card,node("div","empty-icon","!"),node("h3","","အချက်အလက် ယူမရသေးပါ"),node("p","","Internet ချိတ်ဆက်မှု စစ်ပြီး Refresh လုပ်ပါ။"));
  $("matchList").appendChild(card);
 }finally{
  clearTimeout(timeout);
  if(sequence===loadSequence){loading=false;$("matchList").setAttribute("aria-busy","false")}
 }
}
function init(){
 $("heroDate").textContent="MYANMAR · "+dateParts().day;
 for(const button of $("dateTabs").querySelectorAll("button")){
   const offset=Number(button.dataset.day);
   const small=$("date"+(offset===-1?"Yesterday":"Today"));
   small.textContent=displayDate(selectedDateKey(offset));
   button.addEventListener("click",()=>{
     selectedDay=offset;
     $("dateTabs").querySelectorAll("button").forEach(b=>{b.classList.toggle("active",b===button);b.setAttribute("aria-current",b===button?"date":"false")});
     report={matches:[],published:false};load();
   });
 }
 $("reloadBtn").addEventListener("click",load);
 $("resultsPngBtn").addEventListener("click",async()=>{
   const button=$("resultsPngBtn");
   const finals=(Array.isArray(report.matches)?report.matches:[]).filter(validFinal);
   if(selectedDay!==-1||!finals.length||!window.FutureCodeDailyExport?.saveResults)return;
   button.disabled=true;const previous=button.textContent;button.textContent="ဂိုးရလဒ်ပုံ ထုတ်နေပါတယ်…";
   try{
     await window.FutureCodeDailyExport.saveResults({
       date:selectedDateKey(),matches:finals,renderResult:renderFinished,
       brand:document.documentElement.dataset.footballBrandName||"Future Code Football"
     });
     button.textContent="✓ ဂိုးရလဒ်များ PNG ထုတ်ပြီး";
   }catch(err){
     console.error("Verified results PNG error",err);
     button.textContent="PNG မအောင်မြင်ပါ — ပြန်နှိပ်ပါ";
   }finally{
     button.disabled=false;
     setTimeout(()=>{if(button.isConnected)button.textContent=previous;},2500);
   }
 });
 load();
}
document.addEventListener("DOMContentLoaded",init);

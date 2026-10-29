"use strict";
/* Main Website only. Uses the pinned Worker/D1 publication; never polls or scrapes in browsers. */
(function(root){
 const finitePrice=x=>{const n=Number(x);return x!==null&&x!==undefined&&String(x).trim()!==""&&Number.isFinite(n)&&n>1.001&&n<1000?n:null;};
 function percentages(weights){
  const sum=weights.reduce((a,b)=>a+b,0);
  if(!sum||weights.some(v=>!Number.isFinite(v)||v<0))return null;
  const raw=weights.map(v=>100*v/sum),whole=raw.map(Math.floor);
  const order=raw.map((v,i)=>({i,part:v-whole[i]})).sort((a,b)=>b.part-a.part||a.i-b.i);
  let left=100-whole.reduce((a,b)=>a+b,0);
  for(let i=0;i<left;i++)whole[order[i].i]++;
  return whole;
 }
 function winChance(match,market,day){
  // Validate a complete, sourced 1X2 quote before comparing the two win sides.
  for(const m of [market,match]){
   if(!m||m.oddsVerifiedDate&&m.oddsVerifiedDate!==day)continue;
   const values=[finitePrice(m.homeOdds),finitePrice(m.drawOdds),finitePrice(m.awayOdds)];
   if(values.some(v=>v===null)||!m.oddsSourceUrl)continue;
   // Conditional two-way split: if there is a winner (not a draw), which side?
   // Unlike unconditional 1X2 win probability, the two displayed sides add to 100.
   const p=percentages([1/values[0],1/values[2]]);
   if(p)return {home:p[0],away:p[1],source:m.oddsSourceUrl,provider:m.oddsProvider||"1X2",basis:"သရေမပါသော နှစ်ဖက်အလေးသာမှု (1X2 ကြေးမှ)"};
  }
  return null;
 }
 const sample=items=>{
  if(!Array.isArray(items)||items.length<5)return null;
  const rows=items.slice(0,5);
  if(rows.some(r=>!r||typeof r.teamGoals!=="number"||typeof r.opponentGoals!=="number"||
   !Number.isFinite(r.teamGoals)||!Number.isFinite(r.opponentGoals)||r.teamGoals<0||r.opponentGoals<0||
   r.teamGoals>20||r.opponentGoals>20||!r.date||!r.sourceUrl))return null;
  return {scored:rows.reduce((s,r)=>s+r.teamGoals,0)/5,
   conceded:rows.reduce((s,r)=>s+r.opponentGoals,0)/5,
   source:rows[0].sourceUrl};
 };
 function goalChance(m,market,day){
  // Only two-sided verified decimal totals may be converted directly.
  for(const v of [market,m]){
   if(!v||v.oddsVerifiedDate&&v.oddsVerifiedDate!==day)continue;
   const a=finitePrice(v.overOdds),b=finitePrice(v.underOdds);
   const line=Number(v.totalGoalsLine??v.goalLine??NaN);
   if(a&&b&&Number.isFinite(line)&&line===2.5&&v.oddsSourceUrl){
    const p=percentages([1/a,1/b]);
    return {over:p[0],under:p[1],line:"2.5",method:"ဂိုးပေါ်/အောက် ကြေး",source:v.oddsSourceUrl};
   }
  }
  const h=sample(m.homeLastFive),a=sample(m.awayLastFive);
  if(!h||!a)return null;
  // Transparent small-sample Poisson model, NOT claimed as live market odds.
  const expectedHome=Math.max(.1,Math.min(5,(h.scored+a.conceded)/2));
  const expectedAway=Math.max(.1,Math.min(5,(a.scored+h.conceded)/2));
  const lambda=expectedHome+expectedAway;
  const under=Math.exp(-lambda)*(1+lambda+lambda*lambda/2);
  const p=percentages([1-under,under]);
  return {over:p[0],under:p[1],line:"2.5",method:"နောက်ဆုံး ၅ ပွဲ ဂိုးပျမ်းမျှ · Poisson",source:h.source};
 }
 function analyze(m,market,day){
  return {win:winChance(m,market,day),goals:goalChance(m,market,day)};
 }
 const model=Object.freeze({percentages,winChance,goalChance,analyze});
 if(typeof module==="object"&&module.exports)module.exports=model;
 if(!root||!root.document)return;
 const doc=root.document;
 if(!["/","/index.html"].includes(root.location.pathname))return;
 const $=id=>doc.getElementById(id);
 const safeUrl=url=>{try{const u=new URL(url);return u.protocol==="https:"?u.href:null;}catch{return null;}};
 const mk=(tag,cls,txt)=>{const e=doc.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e;};
 const leagueLogos={"Premier League":"https://crests.football-data.org/PL.png","Serie A":"https://crests.football-data.org/SA.png","La Liga":"https://crests.football-data.org/PD.png","Bundesliga":"https://crests.football-data.org/BL1.png","Championship":"https://crests.football-data.org/ELC.png","UEFA Champions League":"https://crests.football-data.org/CL.png","Ligue 1":"https://crests.football-data.org/FL1.png"};
 const addLogo=(el,url,alt,cls)=>{
  const src=safeUrl(url);if(!src)return;
  const img=mk("img",cls);img.src=src;img.alt=alt;img.loading="lazy";img.decoding="async";img.onerror=()=>img.remove();el.append(img);
 };
 function init(){
  const section=$("fcProbSection"),list=$("fcProbGroups"),filter=$("fcProbLeague"),status=$("fcProbStatus"),count=$("fcProbCount");
  if(!section||!list||!filter||!status||!count)return;
  let entries=[],day="";
  function render(){
   list.replaceChildren();
   const selected=filter.value;
   const visible=entries.filter(x=>selected==="all"||x.match.league===selected);
   count.textContent=visible.length+" ပွဲ";
   if(!visible.length){list.append(mk("p","fc-prob-empty","ရွေးချယ်ထားသော လိဂ်အတွက် ပွဲစဉ်မရှိပါ။"));return;}
   const groups=new Map();
   for(const e of visible){const k=e.match.league||"Other";if(!groups.has(k))groups.set(k,[]);groups.get(k).push(e);}
   for(const [league,rows] of groups){
    const box=mk("section","fc-prob-league");
    const head=mk("div","fc-prob-league-header"),badge=mk("span","fc-prob-league-logo");
    const first=rows[0].match;
    addLogo(badge,root.FutureCodeMainLogoAssets?.leagueCrest?.(league)||leagueLogos[league],league+" Logo","fc-prob-league-img");
    head.append(badge,mk("strong","fc-prob-league-name",first.leagueDisplay||league));
    const labels=mk("div","fc-prob-columns");
    for(const label of ["အိမ်ရှင်","ဧည့်သည်","ဂိုးပေါ်","ဂိုးအောက်"])labels.append(mk("span","",label));
    head.append(labels);box.append(head);
    for(const {match:m,prob:p} of rows){
     const row=mk("div","fc-prob-row");
     row.append(mk("time","fc-prob-time",m.kickoffYangon||m.kickoffDisplay||m.sourceKickoff||"—"));
     const teams=mk("div","fc-prob-teams"),one=mk("span","fc-prob-team"),two=mk("span","fc-prob-team");
     one.append(mk("span","",m.homeDisplay||m.home||"—"));
     addLogo(one,m.homeCrestUrl,(m.homeDisplay||m.home)+" Logo","fc-prob-crest");
     two.append(mk("span","",m.awayDisplay||m.away||"—"));
     addLogo(two,m.awayCrestUrl,(m.awayDisplay||m.away)+" Logo","fc-prob-crest");
     teams.append(one,mk("span","fc-prob-vs","နှင့်"),two);
     row.append(teams);
     for(const v of [p.win?.home,p.win?.away,p.goals?.over,p.goals?.under]){
      const cell=mk("strong","fc-prob-percent",Number.isInteger(v)?v+"%":"—");
      if(Number.isInteger(v)){cell.classList.add(v>=65?"fc-prob-high":v<35?"fc-prob-low":"fc-prob-mid");}
      row.append(cell);
     }
     box.append(row);
     const meta=mk("div","fc-prob-meta");
     meta.append(mk("span","",p.goals?"ဂိုးပေါ်/အောက် : "+p.goals.line+" ဂိုး · "+p.goals.method:"ဂိုးဒေတာ မပြည့်စုံသေးပါ"));
     if(p.win?.source){const link=mk("a","","1X2 ရင်းမြစ် ↗");link.href=p.win.source;link.target="_blank";link.rel="noopener noreferrer";meta.append(link);}
     if(p.goals?.source){const link=mk("a","","ဂိုးတွက်ချက်မှု ရင်းမြစ် ↗");link.href=p.goals.source;link.target="_blank";link.rel="noopener noreferrer";meta.append(link);}
     box.append(meta);
    }
    list.append(box);
   }
  }
  async function load(){
   status.textContent="ထုတ်ဝေထားသော ယနေ့ဒေတာကို ဖတ်ရှုနေသည်…";
   try{
    // Production uses checked-in JSON on Cloudflare Pages while FC_FOOTBALL_ENGINE.enabled is false.
    // Never block the published static site behind a disabled Worker/D1 manifest.
    const reader=root.FootballData?.fetch?.bind(root.FootballData)||root.fetch.bind(root);
    const response=await reader("./data/today.json?prob="+Date.now(),{cache:"no-store"});
    if(!response.ok)throw Error("Daily report HTTP "+response.status);
    const report=await response.json();
    if(!report?.published||!Array.isArray(report.matches)||!/\d{4}-\d{2}-\d{2}/.test(report.reportDate||""))throw Error("No published report");
    day=report.reportDate;
    const priceResponse=await reader("./data/odds/"+encodeURIComponent(day)+".json?prob="+Date.now(),{cache:"no-store"});
    if(!priceResponse.ok)throw Error("No price sheet for "+day);
    const odds=await priceResponse.json();
    if(odds.reportDate!==day||!Array.isArray(odds.matches)||!odds.matches.length)throw Error("Price date mismatch");
    const byId=new Map(odds.matches.filter(x=>x.fixtureId).map(x=>[x.fixtureId,x]));
    entries=report.matches.filter(m=>m&&m.home&&m.away&&m.status!=="cancelled").map(match=>({match,prob:analyze(match,byId.get(match.fixtureId),day)}));
    const leagues=new Map(entries.map(x=>[x.match.league||"Other",x.match.leagueDisplay||x.match.league||"အခြားလိဂ်"]));
    filter.replaceChildren();const all=mk("option","","လိဂ်အားလုံး");all.value="all";filter.append(all);
    for(const [key,value] of leagues){const opt=mk("option","",value);opt.value=key;filter.append(opt);}
    $("fcProbDate").textContent="ယနေ့ထုတ်ဝေမှု "+day;
    const complete=entries.filter(x=>x.prob.win&&x.prob.goals).length;
    status.textContent="အတည်ပြုထားသော 1X2 နှင့် ဂိုးဒေတာမှ တွက်ချက်ထားသည် · "+complete+"/"+entries.length+" ပွဲ";
    render();
   }catch(err){
    entries=[];list.replaceChildren(mk("p","fc-prob-empty","ယနေ့ဖြစ်နိုင်ခြေဒေတာကို မဖတ်နိုင်သေးပါ။"));
    status.textContent="ဖြစ်နိုင်ခြေဒေတာ မရရှိသေးပါ: "+(err?.message||"Unknown error");
    count.textContent="0 ပွဲ";
   }
  }
  filter.addEventListener("change",render);
  load();
 }
 if(doc.readyState==="loading")doc.addEventListener("DOMContentLoaded",init,{once:true});else init();
})(typeof window==="undefined"?null:window);

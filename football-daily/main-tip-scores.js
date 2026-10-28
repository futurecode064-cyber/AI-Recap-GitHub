"use strict";
/* Source-separated daily exact-score proposals. A VIP tip is never generated from model odds.
 * VIP requires a dated, fixture-matched external source URL; missing is an em dash.
 * Bookies is an inferred score from verified 1X2 and goals line, not a bookmaker's exact-score quote.
 * AI Tips is the top Poisson scoreline from current season/last-five data. */
(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.FutureCodeTipScores=api;
})(typeof window!=="undefined"?window:null,function(){
 let validDate="",tips=new Map(),sources=new Map();
 const good=x=>/^\d{1,2}-\d{1,2}$/.test(String(x||""));
 const readDate=x=>/^\d{4}-\d{2}-\d{2}$/.test(x||"")?x:"";
 const number=x=>{const n=Number(x);return Number.isFinite(n)&&n>1.01&&n<1000?n:null;};
 const clamp=(x,lo,hi)=>Math.min(hi,Math.max(lo,x));
 function poisson(lambda,n){let p=Math.exp(-lambda);for(let i=1;i<=n;i++)p*=lambda/i;return p;}
 function bookie(match){
  const h=number(match?.homeOdds),d=number(match?.drawOdds),a=number(match?.awayOdds);
  const totalSource=match?.myanmarOdds?.currentGoalTotalOdds||match?.myanmarOdds?.goalTotalOdds||"";
  const line=/^(\d+(?:\.\d+)?)/.exec(String(totalSource).trim());
  // Do not invent a "bookmaker" conclusion without both markets being available.
  if(!h||!d||!a||!line)return "—";
  const totalLine=Number(line[1]);if(!(totalLine>=1&&totalLine<=7))return "—";
  let oddsProbs=[1/h,1/d,1/a],sum=oddsProbs.reduce((x,y)=>x+y,0);
  oddsProbs=oddsProbs.map(x=>x/sum);
  const target=oddsProbs.indexOf(Math.max(...oddsProbs));
  const total=clamp(2.45+(totalLine-2.5)*.68,1.25,5.7);
  const upper=String(match?.myanmarOdds?.upperTeam||"").trim();
  const hc=String(match?.myanmarOdds?.currentBodyOdds||match?.myanmarOdds?.bodyOdds||"").match(/^(\d+)/);
  const handicapGoals=hc?clamp(Number(hc[1]),0,3):0;
  const homeNames=[match.homeDisplay,match.home].filter(Boolean).map(String);
  const awayNames=[match.awayDisplay,match.away].filter(Boolean).map(String);
  const upperHome=homeNames.includes(upper),upperAway=awayNames.includes(upper);
  // Body handicap strengthens the independently inferred favourite by a small
  // amount; it is not interpreted as the bookmaker's own exact-score forecast.
  const bodyEdge=handicapGoals*(upperHome?.09:upperAway?-.09:0);
  const edge=clamp(Math.log(oddsProbs[0]/oddsProbs[2])*.55+bodyEdge,-1.45,1.45);
  const lambdas=[clamp(total/2+edge/2,.2,4.8),clamp(total/2-edge/2,.2,4.8)];
  const outcomes=[];
  for(let x=0;x<=7;x++)for(let y=0;y<=7;y++){
   const kind=x>y?0:x===y?1:2;
   outcomes.push({score:x+"-"+y,p:poisson(lambdas[0],x)*poisson(lambdas[1],y),kind});
  }
  outcomes.sort((x,y)=>y.p-x.p);
  // The quoted 1X2 favourite defines the result, O/U guides the number of goals.
  return outcomes.find(x=>x.kind===target)?.score||outcomes[0].score;
 }
 const vipEntry=match=>{
  const fromMatch=match?.tipPredictions?.vipInternet||match?.vipInternetTip;
  if(fromMatch&&good(fromMatch.score)&&/^https:\/\//.test(fromMatch.sourceUrl||"")&&readDate(fromMatch.sourceDate))return fromMatch;
  const item=tips.get(match?.fixtureId);
  if(item&&item.home===match.home&&item.away===match.away)return item;
  return null;
 };
 function predict(match){
  const v=vipEntry(match);
  const ai=(typeof window!=="undefined"?window.FutureCodeAiScoreModel:null);
  const one=ai?.predict?.(match)?.[0]||"—";
  return [v?.score||"—",bookie(match),good(one)?one:"—"];
 }
 function details(match){
  const source=vipEntry(match);
  return {vipInternet:source?{score:source.score,sourceName:source.sourceName,sourceUrl:source.sourceUrl,sourceDate:source.sourceDate}:
    {score:"—",status:"unverified"},
   bookies:{score:bookie(match),method:"derived from published 1X2 implied probabilities and goal total; not an offered correct-score market"},
   aiTips:{score:predict(match)[2],method:"Poisson form model"}};
 }
 async function load(date,fetcher){
  validDate=readDate(date);tips=new Map();sources=new Map();
  if(!validDate)return 0;
  const base=typeof document!=="undefined"?document.baseURI:"https://example.org/";
  const url=new URL("./data/tips/"+validDate+".json",base);
  try{
   const res=await (fetcher||fetch)(url.href,{cache:"no-store"});
   if(!res.ok) return 0;
   const data=await res.json();
   if(data.reportDate!==validDate||!Array.isArray(data.items))return 0;
   for(const item of data.items){
    if(!/^fc-\d{8}-\d+/.test(item.fixtureId||"")||!good(item.score)||
      !/^https:\/\//.test(item.sourceUrl||"")||!readDate(item.sourceDate)||
      !item.home||!item.away||!item.sourceName)continue;
    tips.set(item.fixtureId,item);sources.set(item.fixtureId,item.sourceUrl);
   }
   return tips.size;
  }catch(error){console.warn("VIP Internet dated source unavailable",error);return 0;}
 }
 return Object.freeze({predict,bookie,details,load,sourceLink:match=>sources.get(match?.fixtureId)||"",scoreValid:good,labels:["VIP Internet","Bookies","AI Tips"]});
});

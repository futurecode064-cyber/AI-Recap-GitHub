"use strict";
/* Main-site-only, no external API or paid service. A conservative Poisson score model
 * trained on no private data: season and verified recent completed match goals.
 * Display output is only three distinct plausible scorelines; NOT betting odds. */
(function(root,factory){
 const api=factory();
 if(typeof module==="object" && module.exports)module.exports=api;
 if(root)root.FutureCodeAiScoreModel=api;
})(typeof window!=="undefined"?window:null,function(){
 const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
 const number=n=>Number.isFinite(Number(n))?Number(n):null;
 function recentRate(items,field){
  const xs=(Array.isArray(items)?items:[]).filter(v=>v&&Number.isFinite(Number(v[field]))&&v[field]!==null&&v[field]!==undefined);
  if(!xs.length)return null;
  return xs.reduce((a,b)=>a+Number(b[field]),0)/xs.length;
 }
 function seasonRate(standing,key){
  const played=number(standing?.played), goals=number(standing?.[key]);
  return played&&played>0&&goals!==null?goals/played:null;
 }
 function blended(season,recent,fallback){
  if(season===null&&recent===null)return fallback;
  if(season===null)return .70*recent+.30*fallback;
  if(recent===null)return .80*season+.20*fallback;
  return .58*season+.32*recent+.10*fallback;
 }
 function estimate(match){
  const hs=match?.homeStanding,as=match?.awayStanding;
  const homeRecent=match?.homeLastFive,awayRecent=match?.awayLastFive;
  const ha=blended(seasonRate(hs,"goalsFor"),recentRate(homeRecent,"teamGoals"),1.35);
  const hd=blended(seasonRate(hs,"goalsAgainst"),recentRate(homeRecent,"opponentGoals"),1.35);
  const aa=blended(seasonRate(as,"goalsFor"),recentRate(awayRecent,"teamGoals"),1.20);
  const ad=blended(seasonRate(as,"goalsAgainst"),recentRate(awayRecent,"opponentGoals"),1.35);
  const hp=number(hs?.points),ap=number(as?.points),hm=number(hs?.played),am=number(as?.played);
  const pointEdge=(hp!==null&&ap!==null&&hm>0&&am>0)?clamp((hp/hm-ap/am)*.14,-.22,.22):0;
  return {
   home:clamp(.18+.57*ha+.43*ad+pointEdge,.24,3.60),
   away:clamp(.53*aa+.47*hd-pointEdge,.20,3.50)
  };
 }
 function probabilities(lambda){
  const p=[Math.exp(-lambda)];
  for(let i=1;i<=7;i++)p.push(p[i-1]*lambda/i);
  return p;
 }
 function predict(match){
  const means=estimate(match), h=probabilities(means.home),a=probabilities(means.away),list=[];
  for(let i=0;i<=6;i++)for(let j=0;j<=6;j++){
   list.push({score:i+"-"+j,prob:h[i]*a[j],home:i,away:j});
  }
  list.sort((x,y)=>y.prob-x.prob || (x.home+x.away)-(y.home+y.away) || x.home-y.home);
  const best=list.slice(0,3).map(x=>x.score);
  if(new Set(best).size!==3)throw new Error("Score model emitted duplicate predictions");
  return best;
 }
 return Object.freeze({predict,estimate});
});

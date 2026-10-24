"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const model=require("../main-probability.js");
const source="https://example.com/odds";
const reportDate="2026-10-24";
test("1X2 removes margin, preserves draw and sums to 100",()=>{
 const p=model.winChance({homeOdds:"2.10",drawOdds:"3.40",awayOdds:"3.60",oddsSourceUrl:source,oddsVerifiedDate:reportDate},null,reportDate);
 assert.deepEqual([p.home,p.draw,p.away],[45,28,27]);
 assert.equal(p.home+p.draw+p.away,100);
});
test("unverified or stale 1X2 prices never become fabricated percentages",()=>{
 assert.equal(model.winChance({homeOdds:2,awayOdds:2,oddsSourceUrl:source},null,reportDate),null);
 assert.equal(model.winChance({homeOdds:2,drawOdds:3,awayOdds:3,oddsSourceUrl:source,oddsVerifiedDate:"2026-10-23"},null,reportDate),null);
 assert.equal(model.winChance({homeOdds:2,drawOdds:3,awayOdds:3},null,reportDate),null);
});
test("Poisson 2.5 goal forecast uses five sourced matches for each side",()=>{
 const rows=Array.from({length:5},(_,i)=>({date:"2026-10-"+(20-i),teamGoals:2,opponentGoals:1,sourceUrl:"https://example.com/match/"+i}));
 const p=model.goalChance({homeLastFive:rows,awayLastFive:rows},null,reportDate);
 assert.equal(p.over+p.under,100);
 assert.equal(p.line,"2.5");
 assert.match(p.method,/Poisson/);
 assert.equal(model.goalChance({homeLastFive:rows.slice(0,4),awayLastFive:rows},null,reportDate),null);
});
test("two-sided 2.5 goal market removes margin only when line is explicit",()=>{
 const m={overOdds:"1.87",underOdds:"1.96",totalGoalsLine:2.5,oddsSourceUrl:source,oddsVerifiedDate:reportDate};
 const p=model.goalChance({},m,reportDate);
 assert.equal(p.over+p.under,100);
 assert.equal(model.goalChance({}, {...m,totalGoalsLine:3.0},reportDate),null);
 assert.equal(model.goalChance({}, {...m,totalGoalsLine:undefined},reportDate),null);
});

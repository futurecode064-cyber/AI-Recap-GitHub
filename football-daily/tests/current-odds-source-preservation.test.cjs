"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const script=read("odds.js");
const begin=script.indexOf("function mergeLatestOdds(");
const end=script.indexOf("\nlet loadedSheet=",begin);
assert.ok(begin>=0&&end>begin,"current odds merge function must be present");
const sandbox={};
vm.runInNewContext(script.slice(begin,end)+"\nthis.merge=mergeLatestOdds;",sandbox);
const morning=JSON.parse(read("data/odds/2026-10-30.json"));
const evening=JSON.parse(read("data/odds/evening/2026-10-30.json"));
const sourceMatch=(actual,source)=>actual.matches.every((m,i)=>
 m.currentBodyOdds===source.matches[i].currentBodyOdds
 &&m.currentGoalTotalOdds===source.matches[i].currentGoalTotalOdds
 &&m.bodyOdds===source.matches[i].bodyOdds
 &&m.goalTotalOdds===source.matches[i].goalTotalOdds);
test("2026-10-30 source has 12 matched PDF rows and 24 current quotes",()=>{
 assert.equal(morning.reportDate,"2026-10-30");
 assert.equal(evening.reportDate,"2026-10-30");
 assert.equal(morning.matches.length,12);
 assert.equal(evening.matches.length,12);
 for(let i=0;i<12;i++){
  const m=morning.matches[i],e=evening.matches[i];
  assert.equal(m.fixtureId,e.fixtureId);
  assert.equal(m.bodyOdds,e.morningBodyOdds);
  assert.equal(m.goalTotalOdds,e.morningGoalTotalOdds);
  assert.equal(m.currentBodyOdds,e.eveningBodyOdds);
  assert.equal(m.currentGoalTotalOdds,e.eveningGoalTotalOdds);
 }
});
test("optional evening sheet missing: preserve source-verified current quotes",()=>{
 assert.ok(sourceMatch(sandbox.merge(morning,null),morning));
});
test("valid evening sheet merges without changing morning prices",()=>{
 assert.ok(sourceMatch(sandbox.merge(morning,evening),morning));
});
test("stale or mismatched optional supplement never erases source prices",()=>{
 assert.ok(sourceMatch(sandbox.merge(morning,{...evening,reportDate:"2026-10-29"}),morning));
 const invalid={...evening,matches:evening.matches.map((m,i)=>
  i===0?{...m,home:"WRONG TEAM"}:m)};
 assert.ok(sourceMatch(sandbox.merge(morning,invalid),morning));
});

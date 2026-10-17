"use strict";
const test=require("node:test"), assert=require("node:assert/strict");
const fs=require("node:fs"), path=require("node:path");
const root=path.resolve(__dirname,"..");
const model=require("../main-ai-score-model.js");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
const day=JSON.parse(read("data/today.json"));
test("AI predictions are isolated to the FUTURE CODE main homepage",()=>{
 const main=read("index.html"),script=read("main-ai-score.js"),style=read("main-ai-score.css");
 assert.match(main,/id="fcAiScoreSection"/);
 assert.match(main,/main-ai-score-model\.js/);
 assert.match(main,/main-ai-score\.js/);
 assert.match(main,/main-ai-score\.css/);
 assert.ok(script.includes('["/","/index.html"].includes(location.pathname)'),"main route must be guarded");
 assert.ok(script.includes('new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Yangon"'),"always use Myanmar local date");
 assert.ok(script.includes('report.matches.filter'),"each published fixture should be included");
 assert.ok(script.includes('const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"))'),"PNG export uses canvas");
 assert.match(style,/fc-ai-league/);
 for(const name of ["ykz-family","bw-sport","ko-thet-family"]){
  const content=read(name+"/index.html");
  assert.doesNotMatch(content,/main-ai-score|fcAiScoreSection/,name+" must remain unchanged");
 }
});
test("Every dated fixture gets three distinct score-only outputs",()=>{
 assert.ok(day.matches.length>0,"must have dated fixtures");
 for(const [idx,match] of day.matches.entries()){
  const scores=model.predict(match);
  assert.equal(scores.length,3,"match "+(idx+1));
  assert.equal(new Set(scores).size,3,"duplicate score "+(idx+1));
  scores.forEach(s=>assert.match(s,/^[0-6]-[0-6]$/,"score-only prediction "+(idx+1)));
  const nums=model.estimate(match);
  assert.ok(Number.isFinite(nums.home)&&Number.isFinite(nums.away),"finite goal estimates");
  assert.deepEqual(model.predict(match),scores,"deterministic within selected daily publish");
 }
});
test("Missing team data, extreme outliers and unverified fixture data cannot crash predictions",()=>{
 const fixtures=[
  {home:"A",away:"B"},
  {home:"A",away:"B",homeStanding:{played:0},awayStanding:{played:0}},
  {home:"A",away:"B",homeStanding:{played:1,goalsFor:999,goalsAgainst:999},awayStanding:{played:1,goalsFor:999,goalsAgainst:999}},
  {home:"A",away:"B",homeLastFive:[{teamGoals:0,opponentGoals:0}],awayLastFive:[]},
 ];
 fixtures.forEach(f=>assert.equal(new Set(model.predict(f)).size,3));
});

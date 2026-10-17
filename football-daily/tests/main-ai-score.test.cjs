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


test("MAIN homepage shows exactly five navigation tiles and section shortcuts",()=>{
 const main=read("index.html");
 const style=read("main-ai-score.css");
 const nav=main.match(/<nav class="date-tabs fc-main-five-nav"[^>]*>([\s\S]*?)<\/nav>/);
 assert.ok(nav,"main five-section menu must exist");
 const itemTags=[...nav[1].matchAll(/<(button|a)\b[^>]*>/g)].map(x=>x[0]);
 assert.equal(itemTags.length,5,"five visible main navigation tiles, no duplicates");
 assert.equal(itemTags.filter(x=>x.startsWith("<button")).length,2,"yesterday/today keep original button behavior");
 assert.equal(itemTags.filter(x=>x.startsWith("<a")).length,3,"odds, video, AI links");
 assert.match(nav[1],/href="\.\/odds\.html"/);
 assert.match(nav[1],/href="#fcVideoStudio"/);
 assert.match(nav[1],/href="#fcAiScoreSection"/);
 assert.ok(main.indexOf('id="fcVideoStudio"')>main.indexOf('id="dateTabs"'),"Video target exists");
 assert.ok(main.indexOf('id="fcAiScoreSection"')>main.indexOf('id="dateTabs"'),"AI target exists");
 assert.match(style,/\.date-tabs\.fc-main-five-nav\s*\{/,"main-only five column layout");
 assert.match(style,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/,"desktop five columns");
 for(const name of ["ykz-family","bw-sport","ko-thet-family"]){
  const brand=read(name+"/index.html");
  assert.doesNotMatch(brand,/fc-main-five-nav|fc-main-studio-tab|fc-main-ai-tab/,"brand mirror remains three tiles: "+name);
 }
});


test("Sample-style league heading and fixture cells stay in one six-column grid",()=>{
 const js=read("main-ai-score.js"),css=read("main-ai-score.css");
 assert.match(js,/const head=make\("div","fc-ai-league-head"\)/,"each league owns blue header");
 assert.match(js,/head\.appendChild\(iconBox\)/,"logo tile sits left");
 assert.match(js,/head\.appendChild\(make\("strong","fc-ai-league-title",labelLeague\(league\)\)\)/,"league name beside logo");
 assert.match(js,/\["AI ခန့်မှန်း ၁","AI ခန့်မှန်း ၂","AI ခန့်မှန်း ၃"\]/,"prediction 1/2/3 above their columns");
 assert.match(js,/head\.appendChild\(downloadHead\)/,"small PNG column remains");
 assert.match(js,/table\.appendChild\(head\)/,"header and fixtures use one grid table");
 assert.match(js,/const row=make\("div","fc-ai-match"\)/,"every match has a matching row");
 assert.match(js,/home\.appendChild\(make\("span","fc-ai-team-name",team\(match,"home"\)\)\)/,"home name first");
 assert.match(js,/addImage\(home,match\.homeCrestUrl,team\(match,"home"\),"fc-ai-crest"\)/,"home logo follows home name");
 assert.match(js,/addImage\(away,match\.awayCrestUrl,team\(match,"away"\),"fc-ai-crest"\)/,"away logo precedes away name");
 assert.match(js,/away\.appendChild\(make\("span","fc-ai-team-name",team\(match,"away"\)\)\)/,"away name last");
 assert.match(css,/\.fc-ai-league-head,\.fc-ai-match\s*\{[\s\S]*?grid-template-columns:68px minmax\(0,1fr\) repeat\(3,minmax\(86px,112px\)\) 48px/,"desktop header/rows same columns");
 assert.match(css,/\.fc-ai-score-list\{display:contents\}/,"three score cells occupy parent grid tracks");
 assert.match(css,/\.fc-ai-head-pred-2,\.fc-ai-head-pred-3/,"score heading gold on #2/#3");
 assert.doesNotMatch(js,/fc-ai-table-head/,"no conflicting second heading");
 assert.match(js,/await saveMatch\(match,scores,report\.reportDate\)/,"single-match PNG remains");
 assert.match(js,/const choose=filter\.value/,"league filter remains");
});

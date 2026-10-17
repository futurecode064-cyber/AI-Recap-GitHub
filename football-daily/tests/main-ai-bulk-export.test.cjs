"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
const exporter=require("../main-ai-bulk-export.js");
const report=JSON.parse(read("data/today.json"));
test("all published AI fixtures can be exported as PNG page(s), without omissions or duplicate matches",()=>{
 const fixtures=report.matches;
 const pages=exporter.planPages(fixtures);
 assert.ok(pages.length>=1);
 assert.deepEqual(pages.flatMap(p=>p.groups.flatMap(g=>g.matches)),fixtures);
 assert.equal(pages.reduce((n,p)=>n+p.matchCount,0),fixtures.length);
 for(const page of pages){
  assert.ok(page.matchCount<=18);
  assert.equal(page.groups.reduce((n,g)=>n+g.matches.length,0),page.matchCount);
  assert.equal(exporter.dim(page).width,1280);
  assert.ok(exporter.dim(page).height<=4096,"keep images within mobile canvas limits");
 }
});
test("32 fixtures yield two separate PNG buttons; user selects each picture, no zip",()=>{
 const mock=[...Array(32)].map((_,i)=>({home:"H"+i,away:"A"+i,league:i<20?"League 1":"League 2"}));
 const pages=exporter.planPages(mock);
 assert.deepEqual(pages.map(p=>p.matchCount),[16,16]);
 const data=report.matches;
 const realPages=exporter.planPages(data);
 if(report.reportDate==="2026-10-17"){
  assert.equal(data.length,32);
  assert.equal(realPages.length,2);
  assert.deepEqual(realPages.map(p=>p.matchCount),[16,16]);
 }
 const js=read("main-ai-score.js"),html=read("index.html");
 assert.match(html,/id="fcAiAllPngPages"/);
 assert.match(html,/id="fcAiSelectedPngPages"/);
 assert.match(html,/id="fcAiExportLeagueChoices"/);
 assert.match(html,/id="fcAiSelectAll"/);
 assert.match(html,/id="fcAiSelectNone"/);
 assert.match(js,/pageButtons\(allPages,fixtures,null,"all"\)/);
 assert.match(js,/pageButtons\(chosenPages,fixtures,selected,scope\)/);
 assert.match(js,/await exporter\.savePage\(page,\{/);
 assert.doesNotMatch(js,/application\/zip|JSZip|archive\.zip/i);
});
test("league selection filters only exact league matches, respects order, and permits none",()=>{
 const fixture=report.matches;
 const leagues=[...new Set(fixture.map(x=>x.league))];
 for(const league of leagues){
  const chosen=exporter.planPages(fixture,[league]);
  assert.ok(chosen.length>=1);
  const matches=chosen.flatMap(p=>p.groups.flatMap(g=>g.matches));
  assert.deepEqual(matches,fixture.filter(m=>m.league===league));
 }
 assert.deepEqual(exporter.planPages(fixture,[]),[]);
 assert.deepEqual(exporter.planPages(fixture,["Not a competition"]),[]);
 const multiple=leagues.slice(0,2);
 const selected=exporter.planPages(fixture,multiple).flatMap(p=>p.groups.flatMap(g=>g.matches));
 const wanted=fixture.filter(m=>multiple.includes(m.league));
 // grouping is by league and original league order, as on screen
 assert.deepEqual(selected,wanted);
});
test("large single leagues split correctly without breaking score-only model or huge canvases",()=>{
 const huge=Array.from({length:43},(_,i)=>({home:"H"+i,away:"A"+i,league:"ONE"}));
 const pages=exporter.planPages(huge);
 assert.deepEqual(pages.map(p=>p.matchCount),[15,14,14]);
 assert.deepEqual(pages.flatMap(p=>p.groups.flatMap(g=>g.matches)),huge);
 for(const page of pages)assert.ok(exporter.dim(page).height<4096);
});
test("bulk export retains league and both team logos, same three predicted scores, and independent PNG click",()=>{
 const js=read("main-ai-bulk-export.js"),main=read("main-ai-score.js");
 assert.match(js,/picture|loadImage\(leagueLogo\?\.\(group\.league\),cache\)/);
 assert.match(js,/loadImage\(teamLogo\?\.\(m,"home"\),cache\)/);
 assert.match(js,/loadImage\(teamLogo\?\.\(m,"away"\),cache\)/);
 assert.match(js,/const scores=predict\(m\)/);
 assert.match(js,/const blob=await new Promise\(resolve=>canvas\.toBlob\(resolve,"image\/png"\)\)/);
 assert.match(main,/teamLogo:teamCrest,displayTime/);
 assert.match(main,/leagueLogo:l=>leagueIcons\[l\]/);
 assert.match(main,/btn\.addEventListener\("click",async\(\)=>\{/);
 assert.match(read("index.html"),/main-ai-bulk-export\.js/);
 for(const site of ["ykz-family","bw-sport","ko-thet-family"]){
  const html=read(site+"/index.html");
  assert.doesNotMatch(html,/main-ai-bulk-export|fcAiExportPanel|fcAiAllPngPages/);
 }
});

test("AI PNG uses balanced halves for odd and even source counts",()=>{
 for(const [n,expected] of [[15,[8,7]],[16,[8,8]],[32,[16,16]],[37,[13,12,12]]]){
  const games=Array.from({length:n},(_,i)=>({home:"H"+i,away:"A"+i,league:"Testing"}));
  const split=exporter.planPages(games);
  assert.deepEqual(split.map(x=>x.matchCount),expected);
  assert.deepEqual(split.flatMap(x=>x.groups.flatMap(g=>g.matches)),games);
 }
});

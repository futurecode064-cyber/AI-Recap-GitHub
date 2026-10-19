"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const script=fs.readFileSync(path.join(root,"brand-odds-studio.js"),"utf8");
const sheet=JSON.parse(fs.readFileSync(path.join(root,"data/odds/2026-10-19.json"),"utf8"));
const leagueMap=script.match(/^ const leagueNames=(.+);$/m);
if(!leagueMap)throw Error("Burmese league names map missing from branded odds exporter");
const leagueNames=JSON.parse(leagueMap[1]);
test("All 19 October odds PNG league bands and filter labels have explicit Burmese names",()=>{
 assert.equal(sheet.matches.length,11);
 assert.ok(script.includes("write(ctx,(leagueNames[m.league]||m.league)"));
 assert.ok(script.includes("document.createTextNode(leagueNames[league]||league)"));
 for(const league of new Set(sheet.matches.map(m=>m.league))){
  assert.ok(leagueNames[league],league+": translation missing");
  assert.match(leagueNames[league],/[က-အ]/u,league+": expected Burmese display label");
 }
 assert.equal(leagueNames.Allsvenskan,"ဆွီဒင် လိဂ်");
 assert.equal(leagueNames["Danish Superliga"],"ဒိန်းမတ် စူပါလိဂ်");
 assert.equal(leagueNames["Primeira Liga"],"ပေါ်တူဂီ ပရီးမီးယားလိဂ်");
 assert.equal(leagueNames["Swedish Superettan"],"ဆွီဒင် စူပါတန် လိဂ်");
});
test("PNG shows Burmese body and total labels adjacent to corresponding numeric quotes",()=>{
 assert.ok(script.includes("kind==='body'?'ဘော်ဒီကြေး':'ဂိုးပေါင်းကြေး'"));
 assert.ok(script.includes("quote('goals',goals,468);quote('body',bodyOdds,732);"),"Away-priced team needs correct market order");
 assert.ok(script.includes("quote('body',bodyOdds,468);quote('goals',goals,732);"),"Home-priced team needs correct market order");
 assert.ok(script.includes("quote('body','—',468);quote('goals','—',732);"),"Missing upper team still needs both market labels");
 assert.ok(script.includes("write(ctx,value||'—',x,y+57"),"Market value must stay separately visible below its label");
 assert.ok(script.includes("top.jpg"));
 assert.ok(script.includes("bottom.jpg"));
});

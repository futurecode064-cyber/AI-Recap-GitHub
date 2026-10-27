"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,".."),src=fs.readFileSync(path.join(root,"odds.js"),"utf8");
const match=src.match(/function shortKickoffClock\(match\)\{[\s\S]*?\n\}/);assert.ok(match);
const short=vm.runInNewContext("("+match[0]+")");
test("No future or archived odds row displays a date instead of HH:mm",()=>{
 for(const [input,expected] of [
  [{kickoff:"02:15",kickoffDisplay:"2026-10-28 02:15 MMT"},"02:15"],
  [{kickoff:"23:30",kickoffDisplay:"2026-10-27 23:30 MMT"},"23:30"],
  [{kickoffDisplay:"2026-12-31 00:00 MMT"},"00:00"],
  [{kickoffDisplay:"2030-01-01 9:05 MMT"},"09:05"],
  [{sourceKickoff:"၁၆:၃၀"},"16:30"],
  [{kickoffDisplay:"unknown"},"—"]
 ]){assert.equal(short(input),expected);assert.ok(!/20\d\d|MMT/.test(short(input)));}
});
test("All seven odds sites share versioned clock, export and local Burmese fonts",()=>{
 for(const name of ["","bw-sport/","future-code-journal/","kmm-sport-hub/","ko-thet-family/","ykz-family/","bet-city-family/"]){
  const h=fs.readFileSync(path.join(root,name,"odds.html"),"utf8");
  assert.match(h,/odds\.js\?v=20261027-hhmm-all-sites-v2/);
  assert.match(h,/main-odds-dom-frame\.js\?v=20261027-clock-burmese-v2/);
  assert.match(h,/odds-sheet-theme\.css\?v=20261027-local-burmese-v2/);
 }
 const d=fs.readFileSync(path.join(root,"main-odds-dom-frame.js"),"utf8");
 assert.match(d,/window\.FutureCodeOddsClock\?\.short\(fixture\)/);
 assert.match(d,/repaintBcfLeagues/);
 assert.match(fs.readFileSync(path.join(root,"odds-sheet-theme.css"),"utf8"),/NotoSansMyanmar-Variable\.ttf/);
});
test("BCF photo really changed URL and new cache versions",()=>{
 for(const f of ["index.html","odds.html"])assert.match(fs.readFileSync(path.join(root,"bet-city-family",f),"utf8"),/20261027-electric-blue-v3/);
 for(const f of ["brand.css","brand.js"]){
  const c=fs.readFileSync(path.join(root,"bet-city-family",f),"utf8");
  assert.match(c,/football-electric-blue-v3\.webp/);
  assert.doesNotMatch(c,/football-gold-stadium\.webp/);
 }
 assert.ok(fs.statSync(path.join(root,"bet-city-family/assets/football-electric-blue-v3.webp")).size>100000);
});

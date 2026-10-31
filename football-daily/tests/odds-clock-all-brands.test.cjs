"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,".."),src=fs.readFileSync(path.join(root,"odds.js"),"utf8");
const time=require("../football-data-client.js").time;
test("Every brand displays Myanmar fixture time in 12-hour AM/PM, without losing the real match date",()=>{
 for(const [input,expected] of [
  [{kickoff:"02:15",kickoffDisplay:"2026-10-28 02:15 MMT"},"2:15 AM"],
  [{kickoff:"23:30",kickoffDisplay:"2026-10-27 23:30 MMT"},"11:30 PM"],
  [{kickoffDisplay:"2026-12-31 00:00 MMT"},"12:00 AM"],
  [{kickoffDisplay:"2030-01-01 9:05 MMT"},"9:05 AM"],
  [{sourceKickoff:"၁၆:၃၀"},"4:30 PM"],
  [{kickoffDisplay:"unknown"},"—"]
 ]){assert.equal(time.clock(input),expected);assert.ok(!/20\\d\\d|MMT/.test(time.clock(input)));}
 assert.equal(time.full({kickoffCalendarDate:"2026-11-01",kickoff:"01:30"}),"2026-11-01 1:30 AM MMT");
});
test("Seven odds websites reference the shared 12-hour clock, exports and local Burmese fonts",()=>{
 for(const name of ["","bw-sport/","future-code-journal/","kmm-sport-hub/","ko-thet-family/","ykz-family/","bet-city-family/"]){
  const h=fs.readFileSync(path.join(root,name,"odds.html"),"utf8");
  assert.match(h,/football-data-client\\.js\\?v=20261031-time-12h-v1/);
  assert.match(h,/odds\\.js\\?v=20261031-time-12h-v1/);
  assert.match(h,/main-odds-dom-frame\\.js\\?v=20261031-time-12h-v1/);
  assert.match(h,/odds-sheet-theme\\.css\\?v=20261027-local-burmese-v2/);
 }
 const d=fs.readFileSync(path.join(root,"main-odds-dom-frame.js"),"utf8");
 assert.match(d,/window\\.FutureCodeOddsClock\\?\\.short\\(fixture\\)/);
 assert.match(d,/repaintBcfLeagues/);
 assert.match(fs.readFileSync(path.join(root,"odds-sheet-theme.css"),"utf8"),/NotoSansMyanmar-Variable\\.ttf/);
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

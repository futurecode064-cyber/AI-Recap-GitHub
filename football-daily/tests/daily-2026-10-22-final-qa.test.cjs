"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const root=path.resolve(__dirname,"..");
const report=JSON.parse(fs.readFileSync(path.join(root,"data/archive/2026-10-22.json"),"utf8"));
const prices=JSON.parse(fs.readFileSync(path.join(root,"data/odds/2026-10-22.json"),"utf8"));
const oddsById=new Map(prices.matches.map(m=>[m.fixtureId,m]));
test("Oct 22 includes exactly 36 authorized rows (not stale Riga–Kairat)",()=>{
 assert.equal(report.reportDate,"2026-10-22");
 assert.equal(report.published,true);
 assert.equal(report.matches.length,36);
 assert.equal(prices.matches.length,36);
 assert.equal(new Set(report.matches.map(m=>m.fixtureId)).size,36);
 assert.equal(report.matches.some(m=>m.pdfRow===28),false);
 assert.equal(report.matches.find(m=>m.pdfRow===19).kickoffYangon,"၂၂ ရက်နေ့ ည 11:15");
 assert.equal(report.matches.find(m=>m.pdfRow===29).awayDisplay,"မစ်လိုသီရန်");
});
test("All original PDF morning prices remain paired with each match, and sourced 1X2 is complete",()=>{
 for(const m of report.matches){
  const o=oddsById.get(m.fixtureId);
  assert.ok(o,"odds row "+m.pdfRow);
  assert.equal(m.myanmarOdds.bodyOdds,o.bodyOdds);
  assert.equal(m.myanmarOdds.goalTotalOdds,o.goalTotalOdds);
  for(const value of [m.homeOdds,m.drawOdds,m.awayOdds])assert.ok(Number(value)>1,"missing 1X2 "+m.pdfRow);
  assert.ok(m.oddsProvider&&/^https:\/\//.test(m.oddsSourceUrl),"1X2 source "+m.pdfRow);
  assert.ok(typeof o.currentBodyOdds==="string" && o.currentBodyOdds.length>0,"verified 22 Oct evening body price "+m.pdfRow);
  assert.ok(typeof o.currentGoalTotalOdds==="string" && o.currentGoalTotalOdds.length>0,"verified 22 Oct evening goal price "+m.pdfRow);
 }
});
test("72 team form records contain five completed real-score rows",()=>{
 let count=0;
 for(const m of report.matches)for(const side of ["home","away"]){
  const list=m[side+"LastFive"];
  assert.equal(list.length,5,m.pdfRow+":"+side);
  let prev="9999-99-99";
  const dates=new Set();
  for(const g of list){
   count++;
   assert.ok(g.date<"2026-10-22","future match in recent form");
   assert.ok(g.date<=prev,"misordered form");
   assert.equal(dates.has(g.date),false,"duplicate team match date "+m.pdfRow+":"+side+" "+g.date);
   dates.add(g.date);
   prev=g.date;
   assert.ok(Number.isInteger(Number(g.teamGoals))&&Number.isInteger(Number(g.opponentGoals)));
   assert.ok(["W","D","L"].includes(g.result));
   assert.equal(g.status,"STATUS_FULL_TIME");
   assert.ok(g.sourceUrl);
  }
 }
 assert.equal(count,360);
 assert.equal(report.formVerification.distinctFiveRowLists,72);
 assert.equal(report.formVerification.distinctDatedResultRows,360);
});
test("36 unique single-paragraph Burmese previews follow owner prompt",()=>{
 const seen=new Set();
 for(const m of report.matches){
  const s=m.dailyPreviewText;
  assert.ok(typeof s==="string"&&s.length>=300,m.pdfRow+" length");
  assert.ok(s.includes(m.homeDisplay)&&s.includes(m.awayDisplay),"wrong teams "+m.pdfRow);
  assert.equal(/[\r\n]/.test(s),false,"must be one paragraph");
  assert.ok(s.endsWith("။**"),"must close with justified bold choice");
  assert.equal(/https?:\/\/|H2H|PDF/i.test(s),false,"source inside copy");
  assert.equal(/ခန့်မှန်းဂိုးရလဒ်|ခန့်မှန်း\s*ဂိုးရလဒ်/.test(s),false,"predicted score in analysis");
  assert.equal(seen.has(s),false,"duplicated article");
  seen.add(s);
 }
});
test("Special Choice remains two and ends exact requested line",()=>{
 const picks=report.matches.filter(m=>m.specialChoice);
 assert.equal(picks.length,2);
 for(const p of picks)assert.equal(p.specialAnalysisParagraphs.at(-1),"ဒီပွဲကို ရွေးချယ်ပါတယ်");
});
test("Keep all ten October 21 news items and original photos untouched",()=>{
 const raw=fs.readFileSync(path.join(root,"data/news/latest.json"));
 const blob=crypto.createHash("sha1").update(Buffer.concat([Buffer.from("blob "+raw.length),Buffer.from([0]),raw])).digest("hex");
 assert.equal(blob,"7dcd8ee04d98d3f541149c55830219f0c105eab9");
 const news=JSON.parse(raw);
 assert.equal(news.date,"2026-10-21");
 assert.equal(news.items.length,10);
 assert.ok(news.items.every(i=>i.image&&i.image.startsWith("/data/news/images/2026-10-21/")));
});

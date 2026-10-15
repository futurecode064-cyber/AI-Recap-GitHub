"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const odds=JSON.parse(fs.readFileSync(path.join(root,"data/odds/2026-10-15.json"),"utf8"));
const today=JSON.parse(fs.readFileSync(path.join(root,"data/today.json"),"utf8"));
const archive=JSON.parse(fs.readFileSync(path.join(root,"data/archive/2026-10-14.json"),"utf8"));
test("15 Oct all 36 PDF opening prices are unchanged while independent 1X2 data is fully sourced",()=>{
 assert.equal(odds.reportDate,"2026-10-15");
 assert.equal(odds.matches.length,36);
 assert.equal(odds.matches.filter(x=>x.league==="UEFA Europa League").length,18);
 assert.equal(odds.matches.filter(x=>x.league==="UEFA Conference League").length,18);
 const body=["2+90","1+5","-5","-40","-75","1-80","1-95","-15","2-15","2+40","-55","-95","1-60","1+90","-80","-40","2+10","-100","-65","1-10","1-10","1+20","1+20","1-30","-5","2+95","2+15","1+95","2+75","2-45","4+70","-20","-55","2+30","2+55","2="];
 const goals=["3-40","3-55","3+90","3+20","3+25","3+15","3-5","3+30","4+95","3-60","2-55","3+30","3+15","3+50","3+65","3+55","3-55","3-65","2-30","3+30","3+70","3-5","3+70","3+45","3+45","3+30","3-10","2-80","3-15","3-95","4-80","2-70","3-20","3-50","3-10","4+75"];
 const predicted=["3-0","1-2","1-1","2-1","1-2","1-3","2-0","2-1","3-0","3-0","0-1","2-1","3-0","2-1","2-1","1-1","3-0","2-1","0-1","1-2","0-2","1-2","2-1","0-2","2-1","3-0","3-0","1-0","2-0","3-1","4-0","1-0","1-2","3-0","3-0","4-1"];
 assert.deepEqual(odds.matches.map(x=>x.bodyOdds),body);
 assert.deepEqual(odds.matches.map(x=>x.goalTotalOdds),goals);
 assert.deepEqual(odds.matches.map(x=>x.pdfLastColumn),predicted);
 for(let i=0;i<36;i++){const a=odds.matches[i],m=today.matches[i];assert.equal(a.canonicalHome,m.home);assert.equal(a.canonicalAway,m.away);assert.equal(a.home,m.homeDisplay);assert.equal(a.away,m.awayDisplay);assert.equal(a.bodyOdds,m.myanmarOdds.bodyOdds);assert.equal(a.goalTotalOdds,m.myanmarOdds.goalTotalOdds);assert.ok([m.homeOdds,m.drawOdds,m.awayOdds].every(v=>Number(v)>1));
  assert.equal(m.oddsProvider,"Bet365");
  assert.ok(m.oddsSourceUrl?.includes("oddsrun.com/match/football/"));
  assert.equal(m.homeLastFive?.length,5);
  assert.equal(m.awayLastFive?.length,5);
  assert.ok(m.homeCrestUrl?.startsWith("https://")&&m.awayCrestUrl?.startsWith("https://"));
  assert.ok(a.homeCrestUrl?.startsWith("https://")&&a.awayCrestUrl?.startsWith("https://"));}
});
test("15 Oct shows 36 coherent one-paragraph previews and 5 separated Special Choices",()=>{
 assert.equal(today.reportDate,"2026-10-15");assert.equal(today.published,true);assert.equal(today.matches.length,36);
 assert.equal(today.matches.filter(m=>m.specialChoice===true).length,5);
 assert.deepEqual(today.matches.filter(m=>m.specialChoice).map(m=>m.specialChoiceRank),[1,2,3,4,5]);
 for(const m of today.matches){
  assert.ok(m.dailyPreviewText.length>=250,m.home);
  assert.equal([...m.dailyPreviewText.matchAll(/\*\*[^*]+\*\*/g)].length,1,m.home);
  assert.ok(m.kickoffUtc.startsWith("2026-10-15T"),m.home);
  assert.ok(!m.dailyPreviewText.includes("မရှုံးတဲ့ရွေးချယ်မှု"),m.home);
  assert.ok(!/ဖြစ်နိုင်တဲ့\s*ဂိုးရလဒ်|ခန့်မှန်း\s*ဂိုးရလဒ်/u.test(m.dailyPreviewText),m.home);
  assert.ok(!Object.hasOwn(m,"pdfLastColumn"),m.home);
  if(m.specialChoice){assert.equal(m.specialAnalysisParagraphs?.length,4);assert.ok(m.specialAnalysisParagraphs.every(p=>p.length>320));assert.match(m.specialAnalysisParagraphs.at(-1),/\*\*[^*]+?\s*ကို ရွေးချယ်ပါတယ်။\*\*$/u);assert.ok(!/ခန့်မှန်းဂိုးရလဒ်|ဖြစ်နိုင်တဲ့ ဂိုးရလဒ်/.test(m.specialAnalysisParagraphs.join(" ")));}
  for(const field of ["homeLastFive","awayLastFive"])for(const x of m[field]||[]){assert.match(x.sourceUrl,/^https:/);assert.match(x.date,/^2026-/);}
 }
});
test("14 Oct fully verified results are archive data, never guessed PDF forecasts",()=>{
 assert.equal(archive.reportDate,"2026-10-14");
 assert.equal(archive.matches.length,13);
 const results=["3-6","3-2","2-4","6-0","1-0","3-2","3-4","3-1","0-3","0-1","3-2","4-1","0-6"];
 assert.deepEqual(archive.matches.map(m=>m.finalScore),results);
 assert.ok(archive.matches.every(m=>m.status==="finished"&&m.finalScoreIsVerified===true&&/^https:/.test(m.finalScoreSourceUrl)));
});

"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const odds=JSON.parse(fs.readFileSync(path.join(root,"data/odds/2026-10-14.json"),"utf8"));
const report=JSON.parse(fs.readFileSync(path.join(root,"data/today.json"),"utf8"));
const form=JSON.parse(fs.readFileSync(path.join(root,"data/research/2026-10-14-team-forms.json"),"utf8"));
test("Oct 14 corrected PDF display preserves exactly fifteen opening odds rows",()=>{
 assert.equal(odds.reportDate,"2026-10-14");
 assert.ok(odds.matches.every(m=>!["Livorno","Pro Vercelli"].includes(m.canonicalHome)));
 assert.ok(!odds.matches.some(m=>m.canonicalAway==="Grosseto"||m.canonicalAway==="Lecco"));
 assert.deepEqual(odds.matches.map(m=>m.number),Array.from({length:15},(_,i)=>i+1));
 assert.equal(odds.matches.length,15);
 assert.deepEqual(odds.matches.map(m=>m.league).reduce((v,k)=>(v[k]=(v[k]||0)+1,v),{}),{"UEFA Champions League":9,Championship:5,"Italian Serie C":1});
 assert.equal(odds.matches.filter(m=>m.eligibleForPreview).length,13);
 assert.deepEqual(odds.matches.map(m=>m.bodyOdds),["2+60","-100","-50","1-10","-80","-85","-100","-5","2+50","-15","-50","1+30","1+30","-30","-70"]);
 assert.deepEqual(odds.matches.map(m=>m.goalTotalOdds),["3-100","3-10","3-50","3=","3-100","3+50","3-50","3+80","4+90","3-30","2-90","3+30","3+40","3+80","2-100"]);
 assert.deepEqual(odds.matches.map(m=>m.pdfLastColumn),["1-4","1-2","2-1","2-0","1-2","2-1","1-2","1-1","0-4","2-2","1-0","2-0","1-2","1-2","1-0"]);
 for(const m of odds.matches){
  assert.ok(m.home&&m.away&&m.upperTeam&&m.pdfOriginalLegacy?.home&&m.pdfOriginalLegacy?.away);
  assert.match(m.kickoffDisplay,/၁၄ ရက်နေ့ ည/);
  assert.match(m.pdfLastColumn,/^\d-\d$/);
 }
 const disputed=odds.matches.filter(m=>m.kickOffUntrustedFromPdf);
 assert.deepEqual(disputed.map(m=>m.number),[14]);
 assert.ok(disputed.every(m=>!m.eligibleForPreview&&m.kickoffDisplay.includes("⚠")));
});
test("Oct 14 13 original Burmese preview articles, authentic club crests and two ranked exclusive choices",()=>{
 assert.equal(report.reportDate,"2026-10-14");
 assert.equal(report.published,true);
 assert.equal(report.matches.length,13);
 assert.equal(report.matches.filter(m=>m.league==="UEFA Champions League").length,9);
 assert.equal(report.matches.filter(m=>m.league==="Championship").length,4);
 const picks=report.matches.filter(m=>m.specialChoice===true);
 assert.deepEqual(picks.map(m=>m.specialChoiceRank).sort(),[1,2]);
 assert.deepEqual(picks.map(m=>m.home).sort(),["Aston Villa","LASK"]);
 assert.equal(form.teams.length,26);
 for(const m of report.matches){
  const fromPdf=odds.matches.find(o=>o.canonicalHome===m.home&&o.canonicalAway===m.away);
  assert.ok(fromPdf&&fromPdf.eligibleForPreview,m.home);
  assert.equal(m.homeDisplay,fromPdf.home);
  assert.equal(m.awayDisplay,fromPdf.away);
  assert.equal(m.myanmarOdds.bodyOdds,fromPdf.bodyOdds);
  assert.equal(m.myanmarOdds.goalTotalOdds,fromPdf.goalTotalOdds);
  assert.equal(m.myanmarOdds.upperTeam,fromPdf.upperTeam);
  assert.equal(m.kickoffYangon,fromPdf.pdfKickoffDisplay);
  assert.ok(m.dailyPreviewText.length>=500&&m.dailyPreviewText.match(/\*\*/g)?.length===4);
  assert.ok(m.homeCrestUrl?.startsWith("https://")&&m.awayCrestUrl?.startsWith("https://"));
  assert.ok(m.researchSources.length>=2&&m.homeLastFive.length>=2&&m.awayLastFive.length>=5);
  assert.ok(!m.finalScore);
  for(const side of ["homeLastFive","awayLastFive"]){
   for(const item of m[side]){
    assert.ok(item.sourceUrl.startsWith("https://"));
    assert.ok(item.date<="2026-10-13"&&Number.isInteger(item.teamGoals)&&Number.isInteger(item.opponentGoals));
   }
  }
  if(m.specialChoice){
   assert.ok(m.specialAnalysisParagraphs.length>=4);
   assert.ok(m.specialAnalysisParagraphs.every(p=>p.length>=320));
   assert.equal(m.specialPreparedDate,"2026-10-14");
  }
 }
});

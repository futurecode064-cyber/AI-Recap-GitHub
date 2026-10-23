"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const ledger=JSON.parse(fs.readFileSync(path.join(root,"data/research/2026-10-22-pdf-source-ledger-audit.json"),"utf8"));
const report=JSON.parse(fs.readFileSync(path.join(root,"data/archive/2026-10-22.json"),"utf8"));
const odds=JSON.parse(fs.readFileSync(path.join(root,"data/odds/2026-10-22.json"),"utf8"));
test("22 Oct PDF ledger reconciles every source row to the published fixture and odds data",()=>{
 assert.equal(ledger.totalSourceRows,37);
 assert.equal(ledger.activePublishedRows,36);
 assert.deepEqual(ledger.excludedRows,[28]);
 assert.equal(ledger.rows.length,37);
 const published=new Map(report.matches.map(m=>[m.pdfRow,m]));
 const prices=new Map(odds.matches.map(m=>[m.pdfRow,m]));
 for(const row of ledger.rows){
  if(row.pdfRow===28){assert.equal(row.auditStatus,"OWNER_EXCLUDED");assert.equal(row.includeInPublished,false);continue;}
  const match=published.get(row.pdfRow),price=prices.get(row.pdfRow);
  assert.ok(match&&price,"missing row "+row.pdfRow);
  assert.equal(row.fixtureId,match.fixtureId);
  assert.equal(row.canonicalHome,match.home);
  assert.equal(row.canonicalAway,match.away);
  assert.equal(row.numericCellsMatchOddsJson,true);
  assert.equal(row.bodyOdds,price.bodyOdds);
  assert.equal(row.totalOdds,price.goalTotalOdds);
  assert.equal(row.internetPrediction,price.pdfLastColumn);
  assert.ok(row.pdfRawLineSha256);
 }
 assert.equal(ledger.rows.find(r=>r.pdfRow===19).ownerCorrectionApplied.value,"23:15");
 assert.equal(ledger.rows.find(r=>r.pdfRow===29).ownerCorrectionApplied.value,"မစ်လိုသီရန်");
 assert.match(ledger.translationLimitation,/glyphs themselves cannot be independently decoded/i);
});

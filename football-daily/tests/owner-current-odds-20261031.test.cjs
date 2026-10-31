"use strict";
const assert=require("node:assert/strict"),test=require("node:test"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const registry=read("data/pdf-name-aliases/2026-10-31.json");
const today=read("data/today.json"),prices=read("data/odds/2026-10-31.json"),evening=read("data/odds/evening/2026-10-31.json");
const priceValue=v=>/^(?:\d+[+-]\d+|\d+=|-\d+)$/.test(String(v||""));
test("Owner 31 current-PDF: 33 distinct fixtures and four sourced quotes per fixture",()=>{
 assert.equal(registry.fixtures.length,33);
 assert.equal(prices.reportDate,"2026-10-31");
 assert.equal(today.reportDate,"2026-10-31");
 assert.equal(evening.reportDate,"2026-10-31");
 assert.equal(evening.matchedRows,33);
 assert.equal(evening.heldRows,0);
 assert.equal(today.matches.length,33);
 assert.equal(prices.matches.length,33);
 assert.equal(evening.matches.length,33);
 assert.equal(new Set(registry.fixtures.map(x=>x.fixtureId)).size,33);
 assert.equal(new Set(registry.fixtures.map(x=>x.currentPdfRow)).size,33);
 const t=new Map(today.matches.map(m=>[m.fixtureId,m]));
 const o=new Map(prices.matches.map(m=>[m.fixtureId,m]));
 const e=new Map(evening.matches.map(m=>[m.fixtureId,m]));
 for(const f of registry.fixtures){
  const m=t.get(f.fixtureId),p=o.get(f.fixtureId),x=e.get(f.fixtureId);
  assert.ok(m&&p&&x,"Missing live fixture "+f.fixtureId);
  assert.equal(m.homeDisplay,f.home);
  assert.equal(m.awayDisplay,f.away);
  assert.equal(p.home,f.home);assert.equal(p.away,f.away);
  assert.equal(p.upperTeam,f.upperTeam);assert.equal(m.myanmarOdds.upperTeam,f.upperTeam);
  assert.equal(p.bodyOdds,f.originalBodyOdds);
  assert.equal(p.goalTotalOdds,f.originalGoalTotalOdds);
  assert.equal(p.currentBodyOdds,f.currentBodyOdds);
  assert.equal(p.currentGoalTotalOdds,f.currentGoalTotalOdds);
  assert.equal(m.myanmarOdds.bodyOdds,p.bodyOdds);
  assert.equal(m.myanmarOdds.goalTotalOdds,p.goalTotalOdds);
  assert.equal(m.myanmarOdds.currentBodyOdds,p.currentBodyOdds);
  assert.equal(m.myanmarOdds.currentGoalTotalOdds,p.currentGoalTotalOdds);
  assert.equal(x.row,f.originalPdfRow);
  assert.equal(x.currentPdfRow,f.currentPdfRow);
  assert.equal(x.morningBodyOdds,p.bodyOdds);assert.equal(x.morningGoalTotalOdds,p.goalTotalOdds);
  assert.equal(x.eveningBodyOdds,p.currentBodyOdds);assert.equal(x.eveningGoalTotalOdds,p.currentGoalTotalOdds);
  assert.ok([p.bodyOdds,p.goalTotalOdds,p.currentBodyOdds,p.currentGoalTotalOdds].every(priceValue));
 }
});
test("PDF reordered Championship source rows are joined by fixture, not by index",()=>{
 const fixtures=registry.fixtures;
 assert.deepEqual(fixtures.slice(26,32).map(v=>v.originalPdfRow),[28,27,31,32,30,29]);
 const byId=new Map(prices.matches.map(v=>[v.fixtureId,v]));
 assert.equal(byId.get("fc-20261031-28").currentBodyOdds,"-90");
 assert.equal(byId.get("fc-20261031-27").currentBodyOdds,"-30");
 assert.equal(byId.get("fc-20261031-31").currentBodyOdds,"2+35");
 assert.equal(byId.get("fc-20261031-32").currentBodyOdds,"1+35");
 assert.equal(byId.get("fc-20261031-30").currentBodyOdds,"1+55");
 assert.equal(byId.get("fc-20261031-29").currentBodyOdds,"1+45");
});
test("Old mismatched team spellings do not survive in current previews or Special Choice",()=>{
 const texts=today.matches.map(m=>[
  m.homeDisplay,m.awayDisplay,m.dailyPreviewText,m.specialChoiceSourceHeading,
  m.specialChoiceSourceSubtitle,...(m.specialAnalysisParagraphs||[])
 ].filter(Boolean).join("\n")).join("\n");
 for(const old of Object.keys(registry.oldToPDFTeamNames)){
  assert.ok(!texts.includes(old),"Old non-PDF spelling "+old);
 }
 assert.equal(today.matches.filter(m=>m.specialChoice).length,5);
});

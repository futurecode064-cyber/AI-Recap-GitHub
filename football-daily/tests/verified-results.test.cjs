"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const previous=JSON.parse(fs.readFileSync(path.join(root,"data/archive/2026-10-13.json"),"utf8"));
const legacy=JSON.parse(fs.readFileSync(path.join(root,"data/today.json"),"utf8"));
test("13 Oct results are 17 independently sourced genuine final scores, no projected scores",()=>{
 assert.equal(previous.reportDate,"2026-10-13");
 assert.equal(previous.published,true);
 assert.equal(previous.resultsOnly,true);
 assert.equal(previous.resultsVerified,true);
 assert.equal(previous.matches.length,17);
 assert.equal(previous.matches.filter(x=>x.league==="UEFA Champions League").length,9);
 assert.equal(previous.matches.filter(x=>x.league==="Championship").length,8);
 const dedup=new Set();
 for(const m of previous.matches){
  assert.equal(m.status,"finished");
  assert.equal(m.finalScoreIsVerified,true);
  assert.match(m.finalScore,/^\d+-\d+$/);
  assert.ok(m.homeDisplay&&m.awayDisplay);
  assert.ok(m.kickoffYangon);
  assert.ok(/^https:\/\//.test(m.finalScoreSourceUrl));
  assert.ok(/^https:\/\//.test(m.finalScoreCorroboratingUrl));
  assert.ok(!m.dailyPreviewText&&!m.specialChoice&&!m.specialAnalysisParagraphs);
  const pair=m.home+"|"+m.away;
  assert.ok(!dedup.has(pair),"No duplicate result: "+pair);
  dedup.add(pair);
 }
 const pairs=new Map([["Lens|Sporting CP","0-2"],["Sabah|Slavia Praha","2-0"],["Arsenal|Lille","3-0"],["Atlético de Madrid|Manchester United","2-0"],["Inter|Club Brugge","3-4"],["Galatasaray|Barcelona","1-4"],["Leipzig|PSV Eindhoven","1-0"],["Viking|Bayern München","3-3"],["Villarreal|Napoli","3-1"],["Bristol City|Blackburn Rovers","0-1"],["Burnley|Charlton Athletic","2-2"],["Cardiff City|Watford","5-1"],["Millwall|Swansea City","0-1"],["Wolverhampton Wanderers|Bolton Wanderers","1-3"],["Wrexham|West Bromwich Albion","1-2"],["Birmingham City|Preston North End","4-0"],["Stoke City|Middlesbrough","2-3"]]);
 for(const m of previous.matches)assert.equal(m.finalScore,pairs.get(m.home+"|"+m.away));
});
test("14 Oct match articles were not accidentally inserted into public data",()=>{
 assert.equal(legacy.reportDate,"2026-10-13");
 assert.ok(legacy.matches.every(m=>m.nightEditorialDate==="2026-10-13"));
 // The UI rejects a stale report for Oct 14; fresh previews are deliberately withheld.
 assert.ok(!legacy.matches.some(m=>m.nightEditorialDate==="2026-10-14"));
});

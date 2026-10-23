'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const report=JSON.parse(fs.readFileSync(path.join(root,'data/today.json'),'utf8'));
const odds=JSON.parse(fs.readFileSync(path.join(root,'data/odds/2026-10-23.json'),'utf8'));
const result=JSON.parse(fs.readFileSync(path.join(root,'data/archive/2026-10-22.json'),'utf8'));
const main=fs.readFileSync(path.join(root,'main-export-logos.js'),'utf8');
const brand=fs.readFileSync(path.join(root,'brand-export-data.js'),'utf8');
const asset=name=>path.join(root,'assets/brand-export-teams',name);
test('23 Oct: source, 13 fixtures, four brand shared data and prices match PDF',()=>{
 assert.equal(report.reportDate,'2026-10-23');assert.equal(report.published,true);
 assert.equal(odds.reportDate,'2026-10-23');assert.equal(report.matches.length,13);assert.equal(odds.matches.length,13);
 for(let i=0;i<13;i++){const m=report.matches[i],o=odds.matches[i];
  assert.equal(m.fixtureId,o.fixtureId);assert.equal(m.pdfRow,o.pdfRow);
  assert.equal(m.homeDisplay,o.home);assert.equal(m.awayDisplay,o.away);
  assert.equal(m.myanmarOdds.bodyOdds,o.bodyOdds);assert.equal(m.myanmarOdds.goalTotalOdds,o.goalTotalOdds);
  assert.ok(m.dailyPreviewText.length>=500 && !m.dailyPreviewText.includes('\n'));
  assert.equal(m.homeLastFive.length,5);assert.equal(m.awayLastFive.length,5);
  assert.ok([m.homeOdds,m.drawOdds,m.awayOdds].every(n=>Number(n)>1));
  assert.ok(m.oddsSourceUrl.startsWith('https://'));
 }
});
test('23 Oct: all 26 original crests have independently bundled PNGs for every brand',()=>{
 const urls=[...new Set(report.matches.flatMap(m=>[m.homeCrestUrl,m.awayCrestUrl]))];
 assert.equal(urls.length,26);
 for(const url of urls){
  const p=crypto.createHash('sha256').update(url).digest('hex').slice(0,16)+'.png';
  const data=fs.readFileSync(asset(p));
  assert.equal(data.subarray(1,4).toString(),'PNG');
  assert.ok(data.length>100);
  assert.ok(main.includes('"'+url+'"'),url+' main map');
  assert.ok(brand.includes('"'+url+'"'),url+' brand map');
 }
 assert.ok(fs.statSync(path.join(root,'assets/league-logos/ger.2.png')).size>100);
 assert.ok(fs.statSync(path.join(root,'assets/league-logos/ned.1.png')).size>100);
});
test('23 Oct: two full Special Choices and all previous-day results',()=>{
 const picks=report.matches.filter(x=>x.specialChoice===true);
 assert.equal(picks.length,2);
 for(const p of picks){
  assert.deepEqual(p.specialAnalysisParagraphs.length,5);
  assert.ok(p.specialAnalysisParagraphs.slice(0,4).every(s=>s.length>=320));
  assert.equal(p.specialAnalysisParagraphs.at(-1),'ဒီပွဲကို ရွေးချယ်ပါတယ်');
 }
 assert.equal(result.reportDate,'2026-10-22');
 assert.equal(result.matches.length,36);
 assert.ok(result.matches.every(m=>m.finalScoreIsVerified && /^\d+-\d+$/.test(m.finalScore)&&m.finalScoreSourceUrl.startsWith('https://')));
});

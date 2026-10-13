"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const data=JSON.parse(fs.readFileSync(path.join(root,"data/today.json"),"utf8"));
const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
const exporter=fs.readFileSync(path.join(root,"card-export.js"),"utf8");
test("every published day with preview fixtures includes one to three responsibly verified Special Choices",()=>{
 const matches=Array.isArray(data.matches)?data.matches:[];
 const picks=matches.filter(m=>m.specialChoice===true);
 if(data.published&&matches.length>0)assert.ok(picks.length>=1&&picks.length<=3,"Published preview days need 1–3 real researched Special Choices");
 else assert.ok(picks.length<=3);
 const ranks=picks.map(m=>m.specialChoiceRank).sort((a,b)=>a-b);
 assert.deepEqual(ranks,Array.from({length:picks.length},(_,i)=>i+1),"Each selected match must be ranked 1…N with no gap");
 for(const m of picks){
  const key=m.home+" vs "+m.away;
  assert.ok(m.homeDisplay&&m.awayDisplay,key+" must retain original Burmese team spellings");
  assert.ok(m.dailyPreviewText?.length>200,key+" normal daily analysis is not optional");
  assert.ok(m.homeLastFive?.length===5&&m.awayLastFive?.length===5,key+" requires both authentic recent forms");
  assert.ok([m.homeOdds,m.drawOdds,m.awayOdds].every(v=>Number(v)>1),key+" needs independent full-time 1X2");
  assert.ok(typeof m.specialRiskNote==="string"&&m.specialRiskNote.length>=20,key+" needs explicit risk");
  assert.ok(Array.isArray(m.specialResearchSources)&&m.specialResearchSources.length>=2,key+" needs independent primary/reliable source urls");
  assert.ok(m.specialResearchSources.every(u=>/^https:\/\//.test(u)),key+" has invalid source URL");
  assert.ok(Array.isArray(m.specialAnalysisParagraphs)&&m.specialAnalysisParagraphs.length>=4,key+" must have in-depth original Burmese review");
  assert.ok(m.specialAnalysisParagraphs.every(p=>typeof p==="string"&&p.length>=320),key+" analysis is too shallow");
  assert.ok(m.specialAnalysisParagraphs.join(" ").includes("သို့မဟုတ်"),key+" needs two scenario score predictions");
  assert.ok(m.specialPreparedDate===data.reportDate,key+" is a stale pick");
 }
});
test("Special Choice filter orders ranked picks and shows in-depth Burmese analysis + full PNG",()=>{
 assert.ok(app.includes('if(picks)add("special","★ Special Choice",true)'));
 assert.ok(app.includes('if(selectedLeague==="special")selected.sort'));
 assert.ok(app.includes('Number.isInteger(match.specialChoiceRank)'));
 assert.ok(app.includes('Array.isArray(match.specialAnalysisParagraphs)'));
 assert.ok(app.includes('const isSpecialView=selectedLeague==="special"&&match.specialChoice===true'));
 assert.ok(app.includes('if(isSpecialView){'));
 assert.ok(app.includes('}else{\n   // All matches and league views retain ONE normal commentator-style preview.'));
 assert.ok(app.includes('special:selectedLeague==="special"&&match.specialChoice===true'));
 assert.ok(exporter.includes('const specialOnly=opts.special===true'));
 assert.ok(exporter.includes('const lines=specialOnly?[]:paragraphLines('));
 assert.ok(exporter.includes('for(const block of extraBlocks)'));
 assert.ok(!exporter.includes('y=drawParagraph(ctx,k,lines,M+25,y,25,49);\n  if(extra.length)'));
 assert.ok(exporter.includes('text(ctx,specialOnly?"★ SPECIAL CHOICE'));
});

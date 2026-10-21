"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const data=JSON.parse(fs.readFileSync(path.join(root,"data/today.json"),"utf8"));
const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
const exporter=fs.readFileSync(path.join(root,"card-export.js"),"utf8");
test("every published day with preview fixtures includes up to five current user-approved Special Choices",()=>{
 const matches=Array.isArray(data.matches)?data.matches:[];
 const picks=matches.filter(m=>m.specialChoice===true);
 if(data.published&&matches.length>0)assert.ok(picks.length>=1&&picks.length<=5,"Published preview days need 1–5 justified Special Choices");
 else assert.ok(picks.length<=5);
 const ranks=picks.map(m=>m.specialChoiceRank).sort((a,b)=>a-b);
 assert.deepEqual(ranks,Array.from({length:picks.length},(_,i)=>i+1),"Each selected match must be ranked 1…N with no gap");
 for(const m of picks){
  const key=m.home+" vs "+m.away;
  assert.ok(m.homeDisplay&&m.awayDisplay,key+" must retain original Burmese team spellings");
  assert.ok(m.dailyPreviewText?.length>200,key+" normal daily analysis is not optional");
  assert.equal(m.homeLastFive.length,5,key+" must show five verified home-team games");
  assert.equal(m.awayLastFive.length,5,key+" must show five verified away-team games");
  assert.ok([m.homeOdds,m.drawOdds,m.awayOdds].every(v=>Number(v)>1),key+" needs a verified 1X2 triplet");
  assert.ok(typeof m.oddsProvider==="string"&&m.oddsProvider.trim(),key+" named bookmaker required");
  if(m.oddsMarket.includes("reference snapshot")){
   assert.equal(m.oddsIsLive,false);assert.equal(m.oddsVerifiedDate,data.reportDate);
  }
  assert.ok(/^https:/.test(m.oddsSourceUrl),key+" prices must have a credible URL");
  if(m.specialUserVerbatim?.exactCopy){
   assert.equal(m.specialUserVerbatim.rank,m.specialChoiceRank);
   assert.ok(m.specialUserVerbatim.source&&m.specialChoiceSourceHeading);
   assert.equal(m.specialPreparedDate,data.reportDate);
   const sourceFile=m.specialUserVerbatim.sourceFile||data.reportDate+"-owner-verbatim-special-choices.md";
   assert.ok(sourceFile.startsWith(data.reportDate+"-owner-verbatim-special-choice")&&!sourceFile.includes("/"));
   const original=fs.readFileSync(path.join(root,"data/editorial/"+sourceFile),"utf8");
   assert.ok(original.includes(m.specialChoiceSourceHeading));
   for(const paragraph of m.specialAnalysisParagraphs)assert.ok(original.includes(paragraph),"Original Special Choice paragraph must be preserved");
   assert.equal(m.specialAnalysisParagraphs.length,4);
   assert.ok(m.specialAnalysisParagraphs.every(p=>typeof p==="string"&&p.length>=320));
   assert.match(m.specialAnalysisParagraphs.at(-1),/ရွေးချယ်(?:ပါတယ်|ရမှာပါ)။\*\*$/u);
   assert.ok(!/ခန့်မှန်းဂိုးရလဒ်|သေချာပေါက်နိုင်/.test(m.specialAnalysisParagraphs.join(" ")));
   continue;
  }
  if(data.dailyMasterPromptVersion==="V3"){
   assert.equal(m.specialPreparedDate,data.reportDate);
   assert.equal(m.specialAnalysisParagraphs.length,5,"four full analytical paragraphs and one exact closing line");
   assert.ok(m.specialAnalysisParagraphs.slice(0,4).every(p=>p.length>=320));
   assert.equal(m.specialAnalysisParagraphs.at(-1),"ဒီပွဲကို ရွေးချယ်ပါတယ်");
   assert.ok(m.specialResearchSources.length>=2);
   assert.ok(!/ခန့်မှန်းဂိုးရလဒ်|သေချာပေါက်နိုင်/.test(m.specialAnalysisParagraphs.join(" ")));
   continue;
  }
  assert.ok(typeof m.specialRiskNote==="string"&&m.specialRiskNote.length>=20,key+" needs explicit risk");
  assert.ok(Array.isArray(m.specialResearchSources)&&m.specialResearchSources.length>=2,key+" needs independent primary/reliable source urls");
  assert.ok(m.specialResearchSources.every(u=>/^https:\/\//.test(u)),key+" has invalid source URL");
  assert.ok(Array.isArray(m.specialAnalysisParagraphs)&&m.specialAnalysisParagraphs.length>=1,key+" requires a distinct in-depth Burmese assessment");
  assert.ok(m.specialAnalysisParagraphs.every(p=>typeof p==="string"&&p.length>=320),key+" analysis is too shallow");
  // User's 14 Oct screenshot correction: journalistic special analysis contains
  // real football insight, never the already visible Myanmar-odds / 1X2 ledger,
  // bookmaker quotations, provenance, or explaining why those odds differ.
  const prose=m.specialAnalysisParagraphs.join(" ");
  const unwanted=/14\\.pdf|\\bPDF\\b|\\b1X2\\b|\\b1xBet\\b|\\bBet365\\b|full[- ]time|ဘော်ဒီ|ဂိုးပေါင်း|အကျောကြေး|အပေါ်အသင်း|ကြေးကွာခြား|ပေါက်ကြေး|မြန်မာကြေး|ဈေးကွက်/iu;
  assert.ok(!unwanted.test(prose),key+" has user-rejected odds/source boilerplate in Special Choice text");
  assert.equal(m.specialAnalysisParagraphs.length,4,key+" requires complete four-part independent analysis");
  assert.match(m.specialAnalysisParagraphs.at(-1),/\*\*[^*]+?\s*ကို ရွေးချယ်ပါတယ်။\*\*$/u,key+" must end exactly on a bold direct selection, with zero trailing caveats");

  assert.ok(!/ဖြစ်နိုင်တဲ့ ဂိုးရလဒ်|ခန့်မှန်းဂိုးရလဒ်|မရှုံးတဲ့ရွေးချယ်မှု|မရှုံး \(အသင်းဘက်\)/.test(prose),key+" must not include predicted scores or double-chance language");
  assert.ok(/ကို ရွေးချယ်ပါတယ်/.test(prose),key+" must end with a direct team or total selection");
  assert.ok(!/မရှုံး/.test(m.specialPickLabel||""),key+" must be a direct team/total selection");
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

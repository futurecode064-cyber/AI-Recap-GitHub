"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const txt=p=>fs.readFileSync(path.join(root,p),"utf8");
const today=JSON.parse(txt("data/today.json"));
const sheet=JSON.parse(txt("data/odds/2026-10-15.json"));
const archive=JSON.parse(txt("data/archive/2026-10-14.json"));
test("Europa follows selection-only rule while user-supplied Conference paragraphs remain verbatim",()=>{
 assert.equal(today.matches.length,36);
 for(const m of today.matches){
   assert.ok(!/ဖြစ်နိုင်တဲ့\s*ဂိုးရလဒ်|ခန့်မှန်း\s*ဂိုးရလဒ်/u.test(m.dailyPreviewText),m.home);
   const uploadedConference=m.league==="UEFA Conference League";
   assert.equal([...m.dailyPreviewText.matchAll(/\*\*[^*]+\*\*/g)].length,uploadedConference?2:1,m.home);
   if(uploadedConference)assert.match(m.dailyPreviewText,/ခန့်မှန်းရလဒ်ကတော့ \*\*[^*]+\*\* ဖြစ်ပါတယ်။$/u,m.home);
   else assert.match(m.dailyPreviewText,/\*\*[^*]+ကို ရွေးချယ်ပါတယ်။\*\*$/u,m.home);
   assert.ok(!Object.hasOwn(m,"pdfLastColumn"),m.home);
 }
});
test("five detailed special analyses end exactly at the selected team or over/under, with no extra warning after",()=>{
 const specials=today.matches.filter(x=>x.specialChoice===true);
 assert.equal(specials.length,5);
 for(const m of specials){
  assert.equal(m.specialAnalysisParagraphs.length,4,m.home);
  const ending=m.specialAnalysisParagraphs.at(-1);
  assert.match(ending,/\*\*[^*]+?\s*ကို ရွေးချယ်ပါတယ်။\*\*$/u,m.home);
  assert.equal(ending.slice(-2),"**",m.home);
  assert.ok(!/ဖြစ်နိုင်တဲ့\s*ဂိုးရလဒ်|ခန့်မှန်း\s*ဂိုးရလဒ်/u.test(m.specialAnalysisParagraphs.join(" ")),m.home);
 }
});
test("internet forecast column and PNG export remain intact for all 36 odds rows",()=>{
 assert.equal(sheet.matches.length,36);
 assert.equal(sheet.matches.filter(m=>/^\d+-\d+$/.test(m.pdfLastColumn)).length,36);
 const screen=txt("odds.js"),exporter=txt("daily-image-export.js");
 assert.ok(screen.includes('"အင်တာနက်ခန့်မှန်းချက်"'));
 assert.ok(screen.includes('element("td","prediction",m.pdfLastColumn)'));
 assert.ok(exporter.includes('"အင်တာနက်ခန့်မှန်းချက်"'));
 assert.ok(exporter.includes('m.pdfLastColumn??"—"'));
 for(const file of ["odds.html","ykz-family/odds.html","bw-sport/odds.html","ko-thet-family/odds.html"]){
  assert.ok(txt(file).includes("odds.js"),file);
 }
});
test("previously verified actual final scores remain untouched",()=>{
 assert.equal(archive.matches.length,13);
 assert.ok(archive.matches.every(m=>m.status==="finished"&&m.finalScoreIsVerified===true));
});
test("on-screen and PNG match commentary hide legacy forecast tail (not odds column)",()=>{
 assert.ok(txt("app.js").includes("stripScorePrediction"));
 assert.ok(txt("card-export.js").includes("stripScorePrediction"));
});

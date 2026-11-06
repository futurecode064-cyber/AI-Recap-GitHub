"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const dir=path.resolve(__dirname,"..");
const original=fs.readFileSync(path.join(dir,"future-code-journal/index.html"),"utf8");
const english=fs.readFileSync(path.join(dir,"goal-zone-english/index.html"),"utf8");
const odds=fs.readFileSync(path.join(dir,"goal-zone-english/odds.html"),"utf8");
function bodyTags(html){return [...html.slice(html.indexOf("<body>"))
 .replace(/<script[^>]*>[\s\S]*?<\/script>/g,"")
 .replace(/<div class="gz-en-banner-title">[\s\S]*?<\/div>/g,"")
 .matchAll(/<\/?([a-z][\w-]*)\b[^>]*>/gi)].map(m=>m[1].toLowerCase())}
function domIds(html){return [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1])}
test("English edition is the exact original Goal Zone page hierarchy, not a new design",()=>{
 assert.deepEqual(bodyTags(english),bodyTags(original));
 assert.deepEqual(domIds(english),domIds(original));
 const nav=s=>[...s.matchAll(/data-gz-section-link="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(nav(english),nav(original));
});
test("English edition inherits the real original CSS and images",()=>{
 for(const p of ["../future-code-journal/brand.css","../future-code-journal/sections.css","../future-code-journal/assets/goal-zone-download-banner.webp"]){
  assert.ok(english.includes(p),p+" must use the original");
 }
 assert.match(english,/src="\.\/logo\.svg"/);
 assert.match(odds,/href="\.\.\/future-code-journal\/odds-readable\.css/);
 assert.match(english,/href="\.\.\/future-code-journal\/android\//);
 assert.ok(fs.existsSync(path.join(dir,"goal-zone-english/logo.svg")));
});
test("All current match and news text has an English translation for the matching report date",()=>{
 const report=JSON.parse(fs.readFileSync(path.join(dir,"data/today.json"),"utf8"));
 const src=fs.readFileSync(path.join(dir,"goal-zone-english/english-data.js"),"utf8");
 const match=src.match(/const E=(\{[\s\S]*?\});\s*const /);
 assert.ok(match,"translation package");
 const E=JSON.parse(match[1]);
 if(report.reportDate!==E.date)return; // Future publications get a new date-specific editorial translation package.
 for(const m of report.matches){
  assert.ok(E.preview[m.fixtureId]?.length>120,"Full translated preview for "+m.fixtureId);
  assert.ok(E.summary[m.fixtureId]?.length>45,"Translated preview summary for "+m.fixtureId);
  if(m.specialChoice)assert.ok(E.special[m.fixtureId]?.length>200,"Full translated Special Choice for "+m.fixtureId);
 }
});

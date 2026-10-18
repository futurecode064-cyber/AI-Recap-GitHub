"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const brand="FUTURE CODE နေ့စဉ် ဘောလုံးဂျာနယ်";
test("Future Code Journal is a new original branded path with unchanged central source data",()=>{
 const home=read("future-code-journal/index.html");
 const odds=read("future-code-journal/odds.html");
 for(const page of [home,odds]){
  assert.ok(page.includes(brand));
  assert.ok(page.includes("./brand.css"));
  assert.ok(page.includes("./brand.js"));
  assert.ok(page.includes("./assets/logo.webp"));
  assert.ok(page.includes("../canvas-image-kit.js"));
  assert.ok(page.includes("../daily-image-export.js"));
  assert.ok(!page.includes("BW SPORT"));
 }
 assert.ok(home.includes('data-football-data-url="../data/today.json"'));
 assert.ok(odds.includes('data-football-odds-data-url="../data/odds/"'));
 assert.ok(home.includes('id="fcj-ai"')&&home.includes('id="fcjAiCards"'));
 assert.ok(home.includes("သင့်အတွက် နေ့စဉ် ဘောလုံးဂျာနယ်"));
 assert.ok(home.includes("../main-ai-score-model.js"));
 assert.ok(home.includes("./ai-predictions.js"));
 assert.ok(!fs.existsSync(path.join(root,"future-code-journal/data")));
});
test("Future Code Journal uses its own creative visual identity and owner-supplied logo",()=>{
 const css=read("future-code-journal/brand.css");
 const js=read("future-code-journal/brand.js");
 const svg=read("future-code-journal/assets/original-football-art.svg");
 const kit=read("canvas-image-kit.js");
 const card=read("card-export.js");
 const daily=read("daily-image-export.js");
 const logo=fs.readFileSync(path.join(root,"future-code-journal/assets/logo.webp"));
 assert.ok(logo.length>1000);
 assert.equal(logo.toString("ascii",0,4),"RIFF");
 assert.equal(logo.toString("ascii",8,12),"WEBP");
 assert.equal(logo.readUInt32LE(4)+8,logo.length);
 assert.ok(css.includes(".fcj-theme")&&css.includes("#9156b2"));
 assert.ok(svg.includes('<svg')&&svg.includes("</svg>"));
 assert.ok(!svg.includes("<image")&&!svg.includes('href="http'));
 assert.ok(js.includes('id:"future-code-journal"'));
 assert.ok(kit.includes("fcjBranded"));
 assert.ok(card.includes("isFCJ"));
 assert.ok(daily.includes('brand==="future-code-journal"'));
});

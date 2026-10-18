"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const brand="FUTURE CODE အားကစား ဂျာနယ်";
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
 assert.ok(home.includes("FUTURE CODE <span>အားကစား</span>"));
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
 assert.ok(css.includes("football-gold-stadium.webp"));
 assert.ok(css.includes(".fcj-theme")&&css.includes("#edc66b"));
 assert.ok(svg.includes('<svg')&&svg.includes("</svg>"));
 assert.ok(!svg.includes("<image")&&!svg.includes('href="http'));
 assert.ok(js.includes('id:"future-code-journal"'));
 assert.ok(kit.includes("fcjBranded"));
 assert.ok(card.includes("isFCJ"));
 assert.ok(daily.includes('brand==="future-code-journal"'));
});

test("Sports journal gold photography and export identity stay isolated to its brand",()=>{
 const css=read("future-code-journal/brand.css"),config=read("future-code-journal/brand.js");
 const photo=fs.readFileSync(path.join(root,"future-code-journal/assets/football-gold-stadium.webp"));
 assert.equal(photo.toString("ascii",0,4),"RIFF");assert.ok(photo.length>50000);
 assert.ok(config.includes("footballBrandArtworkUrl")&&config.includes("football-gold-stadium.webp"));
 assert.ok(css.includes("linear-gradient")&&css.includes("--ink:#090909"));
 for(const page of ["index.html","odds.html"]){
  const html=read("future-code-journal/"+page);
  assert.ok(!html.includes("နေ့စဉ် ဘောလုံးဂျာနယ်"));
  assert.ok(html.includes("sports-gold-20261018"));
 }
 assert.ok(read("card-export.js").includes("if(isFCJ&&!transparent)k.brandArtwork?.("));
 assert.ok(read("card-export.js").includes('isFCJ?"#785c28"'));
 assert.ok(read("card-export.js").includes("wdl(games[i],isFCJ||"));
 assert.ok(read("daily-image-export.js").includes('header:"#5d4822",deep:"#12110e",accent:"#edc66b"'));
 for(const name of ["ykz-family","bw-sport","ko-thet-family"]){
  assert.ok(!read(name+"/index.html").includes("sports-gold-20261018"));
 }
});

test("Journal current odds retain explicit dark text on gold across both row stripes",()=>{
 const html=read("future-code-journal/odds.html"),css=read("future-code-journal/odds-readable.css");
 assert.ok(html.indexOf("odds-readable.css")>html.indexOf("brand.css"));
 assert.ok(css.includes("tr:nth-child(even) td.odds-current"));
 assert.ok(css.includes("background:#ead49a!important;color:#17130b!important"));
 assert.ok(css.includes("td.upper")&&css.includes("color:#fff2cc!important"));
 assert.ok(read("daily-image-export.js").includes('isFCJ?"#ead49a"'));
});

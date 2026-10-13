"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
test("BW SPORT is a separate premium blue microsite sharing exactly the canonical football and odds data",()=>{
 const home=read("bw-sport/index.html"),odds=read("bw-sport/odds.html");
 for(const html of [home,odds]){
  assert.ok(html.includes("BW SPORT ဘောလုံးဂျာနယ်"));
  assert.ok(html.includes("MORE THAN A GAME"));
  assert.ok(html.includes("./assets/logo.webp"));
  assert.ok(html.includes("./brand.css"));
  assert.ok(html.includes("./brand.js"));
  assert.ok(html.includes("../canvas-image-kit.js"));
  assert.ok(html.includes("../daily-image-export.js"));
  assert.ok(!html.includes("YKZ FAMILY GROUP")&&!html.includes("အတူရှေ့ဆက် YKZ"));
 }
 assert.ok(home.includes('data-football-data-url="../data/today.json"'));
 assert.ok(odds.includes('data-football-odds-data-url="../data/odds/"'));
 assert.ok(home.includes("../app.js")&&home.includes("../card-export.js"));
 assert.ok(odds.includes("../odds.js"));
 assert.ok(!fs.existsSync(path.join(root,"bw-sport","data")),"Must not fork match data");
 assert.ok(home.includes('id="matchList"')&&home.includes('id="filters"')&&home.includes('id="resultsPngBtn"'));
 assert.ok(odds.includes('id="oddsList"')&&odds.includes('id="oddsPngBtn"'));
});
test("Uploaded BW SPORT artwork is a complete original-logo-derived WebP file",()=>{
 const img=fs.readFileSync(path.join(root,"bw-sport/assets/logo.webp"));
 assert.ok(img.length>2000,"Missing real uploaded logo asset");
 assert.equal(img.toString("ascii",0,4),"RIFF");
 assert.equal(img.toString("ascii",8,12),"WEBP");
 assert.equal(img.readUInt32LE(4)+8,img.length,"Incomplete WebP image");
});
test("BW SPORT uses isolated electric-blue and silver colors on pages and complete canvas images",()=>{
 const css=read("bw-sport/brand.css"),config=read("bw-sport/brand.js"),kit=read("canvas-image-kit.js"),exporter=read("card-export.js");
 assert.ok(css.includes(":root.bw-theme")&&css.includes("#0b74ef")&&css.includes("#3ec1ff"));
 assert.ok(css.includes(".bw-theme .match-card"));
 assert.ok(css.includes(".bw-theme .odds-hero"));
 assert.ok(css.includes(".bw-theme .match-hero"));
 assert.ok(css.includes(".bw-theme .special-analysis"));
 assert.ok(css.includes(".bw-theme .odds-export-actions button"));
 assert.ok(config.includes('root.classList.add("bw-theme")'));
 assert.ok(config.includes('new URL("./assets/logo.webp",document.baseURI)'));
 assert.ok(config.includes('id:"bw-sport"')&&config.includes("footballBrandLogoUrl"));
 assert.ok(kit.includes('const bwBranded='));
 assert.ok(kit.includes('"BW SPORT ဘောလုံးဂျာနယ်"'));
 assert.ok(exporter.includes('const isBW=')&&exporter.includes('"BW SPORT · MORE THAN A GAME"'));
 assert.ok(exporter.includes("opts.brandLogoUrl"));
 assert.ok(read("ykz-family/brand.js").includes('root.classList.add("ykz-theme")'));
 assert.ok(!read("index.html").includes("bw-theme"));
});

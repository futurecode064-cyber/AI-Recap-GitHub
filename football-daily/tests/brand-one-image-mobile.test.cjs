"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("four mirror home and odds pages are mobile viewport sites; main remains untouched",()=>{
 for(const brand of ["bw-sport","ykz-family","ko-thet-family","future-code-journal"]){
  for(const page of ["index.html","odds.html"]){
   const html=read(brand+"/"+page);
   assert.match(html,/name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/);
   assert.match(html,page==="odds.html"?/\.\.\/brand-mobile\.css\?v=mobile-odds-cards-20261021-v2/:/\.\.\/brand-mobile\.css\?v=responsive-20261021-1/);
   assert.doesNotMatch(html,/data-desktop-layout|width=1200/);
  }
 }
 assert.doesNotMatch(read("index.html"),/brand-mobile\.css/);
 assert.doesNotMatch(read("odds.html"),/brand-mobile\.css/);
});
test("All six branded websites use one screenshot layout for 1, 2 and 3-page league downloads",()=>{
 const odds=read("odds.js"),exporter=read("daily-image-export.js"),css=read("odds-sheet-theme.css");
 assert.match(odds,/splitOddsIntoParts\(matches,wanted\)/);
 assert.match(odds,/selectedImageCount=2/);
 assert.match(odds,/brand-odds-mode-controls/);
 assert.match(odds,/တစ်ပုံတည်း Download/);
 assert.match(odds,/၂ ပုံခွဲ Download/);
 assert.match(odds,/၃ ပုံခွဲ Download/);
 assert.match(odds,/requestedParts===1/);
 assert.match(exporter,/if\(oddsPage\)\{/);
 assert.doesNotMatch(exporter,/&&!options\.singleImage/);
 assert.match(css,/brand-odds-mode-button/);
 assert.match(read("brand-mobile.css"),/\.fc-odds-direct-export/);
 for(const brand of ["bw-sport","ykz-family","ko-thet-family","future-code-journal","kmm-sport-hub","bet-city-family"]){
  const html=read(brand+"/odds.html");
  assert.match(html,/odds\.js\?v=20261031-brand-unified-png-v1/);
  assert.match(html,/daily-image-export\.js\?v=20261031-brand-unified-png-v1/);
 }
 assert.doesNotMatch(read("odds.html"),/brand-odds-modes/);
});

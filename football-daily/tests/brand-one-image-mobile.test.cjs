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
   assert.match(html,/\.\.\/brand-mobile\.css\?v=responsive-20261021-1/);
   assert.doesNotMatch(html,/data-desktop-layout|width=1200/);
  }
 }
 assert.doesNotMatch(read("index.html"),/brand-mobile\.css/);
 assert.doesNotMatch(read("odds.html"),/brand-mobile\.css/);
});
test("branded one-image and league-selection buttons stay separate from main",()=>{
 const odds=read("odds.js"),exporter=read("daily-image-export.js"),css=read("brand-mobile.css");
 assert.match(odds,/if\(!isMainOdds&&document\.documentElement\.dataset\.footballBrandName\)/);
 assert.match(odds,/id="brandSingleAll"/);
 assert.match(odds,/id="brandSingleSelected"/);
 assert.match(odds,/\{singleImage:true\}/);
 assert.match(exporter,/&&!options\.singleImage/);
 assert.match(css,/main\.odds-content/);
 assert.match(css,/\.fc-odds-direct-export/);
});

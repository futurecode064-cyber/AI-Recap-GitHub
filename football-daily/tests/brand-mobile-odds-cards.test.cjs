"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const read=p=>fs.readFileSync(path.resolve(__dirname,"..",p),"utf8");
test("branded phone odds cards never modify main site or desktop PNG capture",()=>{
 const js=read("odds.js"),css=read("brand-mobile.css");
 assert.match(js,/function brandMobileOdds\(matches\)/);
 assert.match(js,/!isMainOdds&&document\.documentElement\.dataset\.footballBrandName\)section\.appendChild\(brandMobileOdds\(matches\)\)/);
 assert.match(js,/wrap\.appendChild\(table\)/);
 assert.match(css,/main\.odds-content #oddsList \.odds-group > \.odds-table-wrap\{display:none!important;/);
 assert.match(css,/\.fc-odds-direct-export \.brand-odds-mobile/);
 assert.doesNotMatch(read("odds.html"),/brand-mobile\.css/);
 for(const brand of ["bw-sport","ykz-family","ko-thet-family","future-code-journal"]){
  const html=read(brand+"/odds.html");
  assert.match(html,/odds\.js\?v=mobile-odds-cards-20261021-v2/);
  assert.match(html,/brand-mobile\.css\?v=mobile-odds-cards-20261021-v2/);
 }
});

"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const dir=path.join(__dirname,"..","bet-city-family");
test("BCF independent site keeps original shared daily data",()=>{
 for(const file of ["index.html","odds.html"]){
  const html=fs.readFileSync(path.join(dir,file),"utf8");
  assert.match(html,/Bet City Family ဘောလုံးဂျာနယ်/);
  assert.match(html,/\.\.\/football-data-client\.js/);
  assert.match(html,/\.\/brand-export-banners\.js/);
  assert.doesNotMatch(html,/kominmin888|09400900440|KMM Sport Hub/);
 }
 assert.match(fs.readFileSync(path.join(dir,"index.html"),"utf8"),/data-football-data-url="\.\.\/data\/today\.json"/);
 assert.match(fs.readFileSync(path.join(dir,"odds.html"),"utf8"),/data-football-odds-data-url="\.\.\/data\/odds\/"/);
});
test("BCF image exports require top and bottom originals",()=>{
 const js=fs.readFileSync(path.join(dir,"brand-export-banners.js"),"utf8");
 assert.match(js,/banner-top\.jpg/);
 assert.match(js,/banner-bottom\.jpg/);
 assert.match(js,/ctx\.drawImage\(top,0,0,width,topHeight\)/);
 assert.match(js,/ctx\.drawImage\(bottom,0,topHeight\+height,width,bottomHeight\)/);
});

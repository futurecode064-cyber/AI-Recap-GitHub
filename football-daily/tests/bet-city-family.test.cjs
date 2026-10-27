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
 assert.match(js,/ctx\.drawImage\(bottom,0,topHeight\+visibleHeight,width,bottomHeight\)/);
});

test("BCF clean journal does not render cartoon preview or double hero masthead",()=>{
 const html=fs.readFileSync(path.join(dir,"index.html"),"utf8");
 const odds=fs.readFileSync(path.join(dir,"odds.html"),"utf8");
 const css=fs.readFileSync(path.join(dir,"brand.css"),"utf8");
 const brand=fs.readFileSync(path.join(dir,"brand.js"),"utf8");
 for(const page of [html,odds]){
  assert.doesNotMatch(page,/bcf-stadium-banner|bcf-banner-gallery|id="bcf-banners"/);
  assert.match(page,/brand-export-banners\.js/);
 }
 assert.doesNotMatch(html,/SPORT HUB/);
 assert.doesNotMatch(css,/footballers\.svg/);
 assert.match(css,/football-electric-blue-v3\.webp/);
 assert.match(brand,/football-electric-blue-v3\.webp/);
});
test("BCF PNG export keeps original images and crops only result masthead",()=>{
 const js=fs.readFileSync(path.join(dir,"brand-export-banners.js"),"utf8");
 assert.match(js,/removeResultHeader/);
 assert.match(js,/goal-results/);
 assert.match(js,/visibleHeight/);
 assert.match(js,/ctx\.drawImage\(original,0,trimTop,width,visibleHeight,0,topHeight,width,visibleHeight\)/);
 const css=fs.readFileSync(path.join(dir,"brand.css"),"utf8");
 assert.match(css,/\.fc-odds-direct-export\.brand-odds-export/);
 assert.match(css,/grid-template-columns:minmax\(0,1fr\) 33px 18px 33px minmax\(0,1fr\)/);
 assert.match(css,/--sheet-brand:#1053c8/);
});

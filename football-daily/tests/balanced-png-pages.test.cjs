"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
const context={window:{},document:{},console};vm.runInNewContext(read("daily-image-export.js"),context);
const pages=matches=>context.window.FutureCodeDailyExport.partition(matches);
const seq=n=>Array.from({length:n},(_,i)=>({id:i+1,league:i%3===0?"A":"B",home:"Home "+i,away:"Away "+i}));
test("All odd/even match totals split into balanced independently downloadable pictures",()=>{
 const checks={0:[],1:[1],8:[8],10:[10],11:[6,5],15:[8,7],16:[8,8],18:[9,9],30:[15,15],32:[16,16],36:[18,18],37:[13,12,12],40:[14,13,13],54:[18,18,18]};
 for(const [n,expected] of Object.entries(checks)){
  const source=seq(Number(n)),split=pages(source);
  assert.deepEqual(Array.from(split,p=>p.count),expected,"balanced "+n);
  assert.deepEqual(Array.from(split.flatMap(x=>x.matches),m=>m.id),source.map(m=>m.id),"every fixture retained once for "+n);
  assert.ok(split.every((page,i)=>page.index===i+1&&page.total===split.length&&page.matches.length===page.count));
  assert.ok(split.every(page=>page.count<=18),"mobile-friendly maximum page count");
 }
});
test("Both daily export functions preserve brand identity, score source, and separate filenames",()=>{
 const js=read("daily-image-export.js");
 assert.match(js,/window\.FutureCodeDailyExport=\{saveOdds,saveResults,partition\}/);
 assert.match(js,/options\.total>1\?"-"\+Number\(options\.part\|\|1\)\+"-of-"\+Number\(options\.total\)/);
 assert.match(js,/async function saveResults\(\{matches,date,part=1,total=1\}\)/);
 assert.match(js,/const partSuffix=total>1\?"-"\+part\+"-of-"\+total/);
 assert.match(js,/finals=Array\.isArray\(matches\)\?matches\.filter\(verified\):\[\]/,"finished results only");
 assert.match(js,/brand===\"ykz-family\"/);
 assert.match(js,/brand===\"bw-sport\"/);
 assert.match(js,/brand===\"ko-thet-family\"/);
 assert.doesNotMatch(js,/JSZip|application\/zip|downloadAllZip/);
});
test("All four website home and odds pages use the balanced PNG resources",()=>{
 const dirs=["","ykz-family/","bw-sport/","ko-thet-family/"];
 for(const d of dirs)for(const page of ["index.html","odds.html"]){
  const html=read(d+page);
  assert.match(html,/styles\.css\?v=png-balanced-20261017/,d+page);
  assert.match(html,/daily-image-export\.js\?v=[^"\s]+/,d+page);
  assert.match(html,page==="index.html"?/app\.js\?v=png-balanced-20261017/:/odds\.js\?v=[^"\s]+/,d+page);
 }
});
test("All results, all odds, selected leagues and per-league PNG buttons use balanced splitter",()=>{
 const app=read("app.js"),odds=read("odds.js"),css=read("styles.css");
 assert.match(app,/function renderResultsPngButtons\(\)/);
 assert.match(app,/if\(selectedDay!==-1\)return/);
 assert.match(app,/\.filter\(validFinal\)/);
 assert.match(app,/for\(const page of kit\.partition\(finals\)\)/);
 assert.match(app,/date:selectedDateKey\(\),matches:page\.matches,part:page\.index,total:page\.total/);
 assert.match(odds,/function renderSelectedOddsButtons\(\)/);
 assert.match(odds,/const pages=kit\.partition\(matches,isMainOdds\?\{threshold:3,maxPerPage:3\}:\{\}\)/);
 assert.match(odds,/makeOddsPngButtons\(leagueButtons,data,matches,league\)/);
 assert.match(odds,/makeOddsPngButtons\(host,loadedSheet,matches,all\?"all":"selected"\)/);
 assert.match(css,/\.results-png-pages,\.odds-png-parts,\.odds-league-png-parts/);
 assert.match(css,/\.odds-part-download,\.results-part-download/);
});

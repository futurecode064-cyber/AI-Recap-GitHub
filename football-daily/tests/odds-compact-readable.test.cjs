"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const sheet=JSON.parse(read("data/odds/2026-10-16.json"));
const latest=JSON.parse(read("data/odds/evening/2026-10-16.json"));
test("all four sites use one compact, large-text original/current market table",()=>{
 const js=read("odds.js"),css=read("odds-sheet-theme.css");
 assert.ok(js.includes('["9%","34%","14%","8%","8%","8%","8%","11%"]'));
 assert.ok(js.includes('t.title=time;'),"full Myanmar editorial time remains in title");
 for(const rule of ["max-width:1140px","min-width:880px","font:800 15px/1.6","font:800 16px/1.5","-webkit-overflow-scrolling:touch"]){
  assert.ok(css.includes(rule),"missing compact style "+rule);
 }
 assert.ok(!js.includes("evening-odds.js"),"afternoon odds must not create another section");
 for(const page of ["odds.html","ykz-family/odds.html","bw-sport/odds.html","ko-thet-family/odds.html"]){
  const html=read(page);
  for(const name of ["odds.js","odds-sheet-theme.css","daily-image-export.js"])
   assert.ok(html.includes(name+"?v=odds-png-only-20261016"),page+" cache invalidation for "+name);
 }
});
test("compact PNG draws all 21 matches, including current prices, without losing names",async()=>{
 const labels=[],canvases=[],clicked=[],fontsSeen=[];
 const doc={documentElement:{dataset:{footballBrandName:"FUTURE CODE FOOTBALL DAILY"}},
  fonts:{ready:Promise.resolve()},body:{appendChild(){}},
  createElement(type){
   if(type==="a")return {click(){clicked.push(this.download)},remove(){}};
   if(type!=="canvas")throw Error(type);
   const canvas={width:0,height:0,toBlob(cb){cb({size:500,type:"image/png"})}};
   const ctx={canvas,fillRect(){},beginPath(){},roundRect(){},fill(){},save(){},restore(){},rect(){},clip(){},
    drawImage(){},measureText(v){return {width:String(v).length*11}},
    fillText(v){labels.push(String(v));fontsSeen.push(this.font)}};
   canvas.getContext=()=>ctx;canvases.push(canvas);return canvas;
  }};
 class ImageStub{constructor(){this.naturalWidth=100;this.naturalHeight=100}set src(s){queueMicrotask(()=>this.onload?.())}}
 const context={window:{},document:doc,Image:ImageStub,URL:{createObjectURL(){return"blob:ok"},revokeObjectURL(){}},setTimeout,clearTimeout,console,Promise,Intl};
 vm.createContext(context);
 for(const js of ["canvas-image-kit.js","daily-image-export.js"])vm.runInContext(read(js),context);
 const mergeCtx={window:{},document:{addEventListener(){}},URL,console};
 vm.createContext(mergeCtx);vm.runInContext(read("odds.js"),mergeCtx);
 const merged=mergeCtx.mergeLatestOdds(sheet,latest);
 await context.window.FutureCodeDailyExport.saveOdds(merged);
 assert.equal(canvases[0].width,1200);
 const leagueCount=new Set(sheet.matches.map(m=>m.league)).size;
 assert.equal(canvases[0].height,222+leagueCount*126+21*68+80);
 assert.equal(clicked.length,1);
 assert.equal(merged.matches.length,21);
 const joined=labels.join("");
 for(const m of merged.matches){
  for(const name of [m.home,m.away,m.upperTeam]){
   assert.ok(joined.includes(name),"lost team "+name);
  }
  for(const quote of [m.bodyOdds,m.goalTotalOdds,m.currentBodyOdds,m.currentGoalTotalOdds]){
   assert.ok(labels.includes(quote),"lost morning/current quote "+quote);
  }
 }
 assert.ok(labels.includes("မူလ")&&labels.includes("ယခု"));
 assert.ok(labels.includes("ည ၁:၁၅"),"compact editorial kickoff");
 assert.ok(fontsSeen.some(s=>s.includes("17px")),"larger readable team text");
});

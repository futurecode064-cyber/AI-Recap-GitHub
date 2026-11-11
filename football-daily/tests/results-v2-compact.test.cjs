"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

test("Results V2 exports one large verified FT score above the original article, without prematch markets",async()=>{
 const source=fs.readFileSync(path.join(__dirname,"..","main-results-v2.js"),"utf8");
 const draws=[],captions=[],logos=[];
 const ctx={
  fillStyle:"",strokeStyle:"",lineWidth:1,font:"",textAlign:"",textBaseline:"",
  save(){},restore(){},fillRect(){},strokeRect(){},beginPath(){},ellipse(){},stroke(){},
  drawImage(...args){draws.push(args);},
  fillText(...args){captions.push(args);},
  createLinearGradient(){return {addColorStop(){}};}
 };
 const doc={
  documentElement:{dataset:{}},head:{append(){}},fonts:{ready:Promise.resolve()},
  readyState:"loading",addEventListener(){},
  createElement(type){return type==="canvas"?{width:0,height:0,getContext:()=>ctx}:{textContent:""};}
 };
 const V1={width:1200,height:1800};
 const win={
  FutureCodeFramePreview:{render:async()=>V1},
  FutureCodeCanvasKit:{
   fonts:async()=>{},preloadImages:async()=>{},
   crest:(...args)=>logos.push(args)
  },
  FutureCodeEditorialChoice:{appendPng:c=>c}
 };
 vm.runInNewContext(source,{window:win,document:doc,location:{pathname:"/"},console,Intl,Date},{filename:"main-results-v2.js"});
 assert.equal(typeof win.FutureCodeResultsV2.renderCanvas,"function");
 const m={status:"finished",resultPeriod:"FT",finalScore:"2-1",home:"Home",away:"Away",
  homeCrestUrl:"home.png",awayCrestUrl:"away.png",league:"FA Cup",dailyPreviewText:"Original complete article"};
 const result=await win.FutureCodeResultsV2.renderCanvas(m,{date:"2026-11-09",includeUploadedBanners:false});
 assert.equal(result.width,1200);
 // The old prematch section is replaced by exactly one 360px FT header and a 60px article label.
 assert.equal(result.height,V1.height+360+60-508);
 const preserved=draws.find(args=>args[0]===V1);
 assert.ok(preserved,"Original editorial article and selection footer must be carried over");
 assert.deepEqual(preserved.slice(1),[0,508,1200,1292,0,420,1200,1292]);
 assert.equal(logos.length,2,"Exactly two club crests in the single FT header");
 assert.ok(captions.some(c=>String(c[0]).includes("FT · ပွဲပြီး")),"Verified final-time label required");
 assert.equal(captions.filter(c=>c[0]==="2 - 1").length,1,"One large full-time score only");
 assert.ok(!captions.some(c=>/1X2|နောက်ဆုံး ၅ ပွဲ|မြန်မာကြေး|kickoff| VS /i.test(String(c[0]))),"No prematch comparison data in result");
});

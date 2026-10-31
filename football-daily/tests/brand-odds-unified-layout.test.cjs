"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"..");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
const oddsCode=read("odds.js");
const functionSource=oddsCode.match(/function splitOddsIntoParts\(matches,wanted\)\{[\s\S]*?\n\}/);
if(!functionSource)throw Error("Shared split function missing");
const split=vm.runInNewContext("("+functionSource[0]+")");
const sites=["bet-city-family","future-code-journal","ykz-family","bw-sport","ko-thet-family","kmm-sport-hub"];
test("1, 2 and 3 PNG splits preserve ordered original fixtures, without gaps or duplicate rows",()=>{
 const fixtures=Array.from({length:33},(_,i)=>({fixtureId:"fixture-"+i,league:i<8?"A":i<21?"B":"C"}));
 for(const count of [1,2,3]){
  const pages=split(fixtures,count);
  assert.equal(pages.length,count);
  assert.equal(pages.reduce((n,x)=>n+x.count,0),fixtures.length);
  assert.deepEqual(Array.from(pages,p=>p.count),count===1?[33]:count===2?[17,16]:[11,11,11]);
  assert.deepEqual(Array.from(pages,p=>p.index),Array.from({length:count},(_,i)=>i+1));
  assert.deepEqual(Array.from(pages,p=>p.total),Array(count).fill(count));
  assert.deepEqual(Array.from(pages,p=>Array.from(p.matches)).flat().map(x=>x.fixtureId),fixtures.map(x=>x.fixtureId));
 }
 assert.equal(split(fixtures.slice(0,1),3).length,1);
 assert.equal(split([],2).length,0);
});
test("All six brand odds websites use one shared renderer, and Main is not forced into brand controls",()=>{
 const main=read("odds.html");
 for(const site of sites){
  const html=read(site+"/odds.html");
  assert.match(html,/odds\.js\?v=20261031-brand-unified-png-v1/);
  assert.match(html,/daily-image-export\.js\?v=20261031-brand-unified-png-v1/);
  assert.match(html,/main-odds-dom-frame\.js\?/);
  assert.match(html,/odds-sheet-theme\.css\?v=20261031-brand-unified-png-v1/);
 }
 assert.match(oddsCode,/if\(!isMainOdds&&document\.documentElement\.dataset\.footballBrandName\)/);
 assert.match(oddsCode,/တစ်ပုံတည်း Download/);
 assert.match(oddsCode,/၂ ပုံခွဲ Download/);
 assert.match(oddsCode,/၃ ပုံခွဲ Download/);
 assert.doesNotMatch(main,/brand-odds-modes/);
});
test("Single-image and split-image PNG calls both use identical real DOM screenshot, not a different Canvas design",async()=>{
 const source=read("daily-image-export.js");
 for(const brand of sites){
  const called=[],downloads=[];
  const canvas={width:2160,height:4200,toBlob(cb){cb(new Blob(["png"],{type:"image/png"}))}};
  const ctx={
   window:{
    FutureCodeBrandConfig:{id:brand,colors:{primary:"#124c48"}},
    FutureCodeCanvasKit:{day:v=>v,download:async(_c,name)=>{downloads.push(name)}},
    FutureCodeOddsDomFrame:{draw:async(rows,settings)=>{called.push({rows,settings});return canvas}}
   },
   document:{documentElement:{dataset:{footballBrandName:brand}}},
   location:{pathname:"/"+brand+"/odds.html"},
   setTimeout,clearTimeout,console,Blob
  };
  vm.runInNewContext(source,ctx);
  const api=ctx.window.FutureCodeDailyExport;
  const matches=[{home:"Home",away:"Away",league:"Premier League",kickoff:"19:00"}];
  for(const options of [{singleImage:true,asBlob:true},{part:1,total:2,asBlob:true},{part:1,total:3,asBlob:true}]){
   const result=await api.saveOdds({reportDate:"2026-10-31",matches},options);
   assert.ok(result.blob.size>0);
   assert.ok(result.filename.endsWith(".png"));
   assert.equal(result.filename.startsWith(brand+"-odds-"),true);
  }
  assert.equal(called.length,3);
  assert.ok(called.every(v=>v.rows.length===1&&v.settings.date==="2026-10-31"));
  assert.equal(downloads.length,0,"asBlob must not trigger browser downloads");
 }
});

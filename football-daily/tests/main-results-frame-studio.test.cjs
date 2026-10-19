"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ROOT=path.resolve(__dirname,"..");
const script=fs.readFileSync(path.join(ROOT,"main-results-frame-studio.js"),"utf8");
function sandbox(brand="",pathname="/"){
  const window={};
  const document={documentElement:{dataset:brand?{footballBrandName:brand}:{}},
    readyState:"loading",addEventListener(){}};
  vm.runInNewContext(script,{window,document,location:{pathname},console});
  return window.FutureCodeResultsFrames;
}
test("main-only studio is never initialized in branded mirrors",()=>{
  assert.equal(sandbox("BW SPORT ဘောလုံးဂျာနယ်"),undefined);
  assert.equal(sandbox("YKZ FAMILY GROUP"),undefined);
  assert.equal(sandbox("","/bw-sport/"),undefined);
  assert.equal(sandbox("","/future-code-journal/"),undefined);
});
test("only published final scores may enter branded result PNG",()=>{
  const kit=sandbox();
  assert.ok(kit);
  assert.equal(kit.isFinal({status:"finished",finalScore:"2-0"}),true);
  assert.equal(kit.isFinal({status:"finished",finalScore:"1 : 1"}),true);
  assert.equal(kit.isFinal({status:"live",finalScore:"2-0"}),false);
  assert.equal(kit.isFinal({status:"scheduled",finalScore:"3-1"}),false);
  assert.equal(kit.isFinal({status:"finished",predictedScore:"1-0"}),false);
});
test("auto split is balanced and keeps match order",()=>{
  const {split}=sandbox();
  const games=Array.from({length:19},(_,i)=>i);
  const groups=split(games,"auto");
  assert.equal(groups.length,2);
  assert.deepEqual(Array.from(groups[0]),games.slice(0,10));
  assert.deepEqual(Array.from(groups[1]),games.slice(10));
  assert.equal(split(games.slice(0,12),"auto").length,1);
  assert.equal(split(games.slice(0,11),"two")[0].length,6);
  assert.equal(split(games,"one").length,1);
});
test("main entry point links the studio and its frame assets exist",()=>{
  const main=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
  assert.match(main,/main-results-frame-studio\.js/);
  assert.equal(sandbox().frames.length,3);
  for(const file of ["best-top.jpg","best-bottom.jpg","htet-top.jpg","htet-bottom.jpg","ko-tut-pi-frame.jpg"])
    assert.ok(fs.existsSync(path.join(ROOT,"assets/table-odds-frames",file)),file);
  for(const mirror of ["ykz-family","bw-sport","ko-thet-family","future-code-journal"]){
    const html=fs.readFileSync(path.join(ROOT,mirror,"index.html"),"utf8");
    assert.doesNotMatch(html,/main-results-frame-studio\.js/);
  }
});

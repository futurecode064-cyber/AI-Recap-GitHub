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
test("plain option supports unrestricted colours, with safe score contrast",()=>{
  const api=sandbox();
  const plain=api.frames.find(frame=>frame.id==="plain");
  assert.ok(plain,"Plain colour-only frame exists");
  assert.equal(plain.artwork,undefined);
  assert.equal(plain.top,undefined);
  assert.equal(plain.bottom,undefined);
  assert.equal(api.withColor(plain,"#f4e300").color,"#f4e300");
  assert.equal(api.withColor(plain,"#f4e300").scoreInk,"#17252c");
  assert.equal(api.withColor(plain,"#103064").scoreInk,"#ffffff");
  assert.equal(api.withColor(plain,"invalid").color,"#1560a0");
  assert.equal(api.withColor(api.frames[0],"#ffffff").color,api.frames[0].color);
});
test("plain output renders score, Burmese names, crests without artwork or sponsor text",async()=>{
  const drawing=[],names=[];
  const kit={
    async fonts(){},async preloadImages(){},
    create(width,height){
      assert.equal(width,1200);
      return {canvas:{width,height},ctx:{createLinearGradient(){
        return {addColorStop(pos,colour){drawing.push(colour)}};
      }}};
    },
    fill(ctx,x,y,w,h,color){drawing.push(color)},
    text(ctx,value,x,y,size,color){names.push(String(value))},
    fit(){return 25},
    crest(ctx,url,x,y,size,label){names.push(String(label))}
  };
  const runtimeWindow={FutureCodeCanvasKit:kit};
  const document={documentElement:{dataset:{}},readyState:"loading",addEventListener(){}};
  vm.runInNewContext(script,{window:runtimeWindow,document,location:{pathname:"/"},console});
  const api=runtimeWindow.FutureCodeResultsFrames;
  const out=await api.makePng([
    {status:"finished",finalScore:"2-0",league:"Test League",
    home:"Team A",away:"Team B",homeDisplay:"အသင်း က",awayDisplay:"အသင်း ခ"}
  ],api.withColor(api.frames.find(x=>x.id==="plain"),"#fae435"),"2026-10-18");
  assert.equal(out.width,1200);
  assert.ok(drawing.includes("#fae435"));
  assert.ok(names.includes("အသင်း က"));
  assert.ok(names.includes("အသင်း ခ"));
  assert.ok(names.includes("2-0"));
  assert.ok(!names.some(t=>/BEST YOUR CHOICE|HTET KO|ကိုတွတ်ပီ|Future Code/i.test(t)));
});
test("main entry point links the studio and its frame assets exist",()=>{
  const main=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
  assert.match(main,/main-results-frame-studio\.js/);
  assert.equal(sandbox().frames.length,4);
  for(const file of ["best-top.jpg","best-bottom.jpg","htet-top.jpg","htet-bottom.jpg","ko-tut-pi-frame.jpg"])
    assert.ok(fs.existsSync(path.join(ROOT,"assets/table-odds-frames",file)),file);
  for(const mirror of ["ykz-family","bw-sport","ko-thet-family","future-code-journal"]){
    const html=fs.readFileSync(path.join(ROOT,mirror,"index.html"),"utf8");
    assert.doesNotMatch(html,/main-results-frame-studio\.js/);
  }
});

test("main results frame league filter reads the same pinned published archive as the page",()=>{
  assert.match(script,/window\.FootballData\?\.fetch/);
  assert.match(script,/window\.FootballData\.fetch\.bind\(window\.FootballData\)/);
  assert.match(script,/new URL\("\.\/data\/archive\/"\+target\+"\.json",document\.baseURI\)/);
  assert.match(script,/await reader\(url\.toString\(\),\{cache:"no-store"\}\)/);
  assert.doesNotMatch(script,/await fetch\("\.\/data\/archive\//);
  const main=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
  assert.match(main,/main-results-frame-studio\.js\?v=results-league-d1-20261024/);
});

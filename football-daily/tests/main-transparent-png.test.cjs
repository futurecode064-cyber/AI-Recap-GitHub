"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const root=path.join(__dirname,"..");
const sources=["canvas-image-kit.js","card-export.js"].map(f=>fs.readFileSync(path.join(root,f),"utf8"));

function fakeBrowser(){
 const shapes=[],words=[],outlined=[],clicked=[];
 const document={
  documentElement:{dataset:{}},
  fonts:{ready:Promise.resolve()},
  body:{appendChild(){}},
  createElement(tag){
   if(tag==="a")return {click(){clicked.push(this.download)},remove(){}};
   if(tag!=="canvas")throw Error("Unexpected element "+tag);
   const canvas={width:0,height:0,toBlob(callback){callback({size:650,type:"image/png"})}};
   const ctx={
    canvas,save(){},restore(){},fill(){},beginPath(){},rect(){},clip(){},
    roundRect(...args){shapes.push(args.slice(0,4))},
    fillRect(...args){shapes.push(args.slice(0,4))},
    createLinearGradient(){return {addColorStop(){}}},
    measureText(v){return {width:String(v).length*11}},
    fillText(v){words.push(String(v))},
    strokeText(v){outlined.push(String(v))},
    drawImage(){}
   };
   canvas.getContext=()=>ctx;return canvas;
  }
 };
 class ImageMock{
  constructor(){this.naturalWidth=120;this.naturalHeight=120}
  set src(value){queueMicrotask(()=>this.onload?.())}
 }
 const win={};
 const sandbox={window:win,document,Image:ImageMock,
   URL:{createObjectURL(){return "blob:preview"},revokeObjectURL(){}},
   setTimeout,clearTimeout,Promise,console};
 const context=vm.createContext(sandbox);
 for(const source of sources)vm.runInContext(source,context);
 return {win,shapes,words,outlined,clicked};
}

const match={
 home:"အိမ်ရှင်",away:"ဧည့်သည်",league:"Premier League",
 homeCrestUrl:"https://example.com/home.png",awayCrestUrl:"https://example.com/away.png",
 homeOdds:2.3,drawOdds:3.4,awayOdds:3.1,
 myanmarOdds:{upperTeam:"အိမ်ရှင်",bodyOdds:"၅၀",goalTotalOdds:"၂-၅၀"},
 homeLastFive:[{teamGoals:2,opponentGoals:1}],awayLastFive:[{teamGoals:0,opponentGoals:0}],
 dailyPreviewText:"ပွဲကြိုသုံးသပ်ချက် စာသားအပြည့်အစုံ **အိမ်ရှင်ကို ရွေးချယ်ပါတယ်။**"
};

test("Main-site PNG contains ZERO large/background rectangles and preserves full foreground",async()=>{
 const x=fakeBrowser();
 await x.win.FutureCodeCardExport.save(match,{
  mainScreenshot:true,downloadFilename:"match-transparent.png"
 });
 assert.deepEqual(x.clicked,["match-transparent.png"]);
 assert.equal(x.shapes.filter(a=>a[2]>50||a[3]>50).length,0,
  "No header, hero, team panel, odds cell, commentary or page background may be painted");
 assert.ok(x.shapes.length>0,"Keep only 45px result badges as meaningful data");
 assert.ok(x.words.includes("ပွဲကြိုသုံးသပ်ချက်"));
 assert.ok(x.words.includes("အိမ်ရှင်"));
 assert.ok(x.words.includes("ဧည့်သည်"));
 assert.ok(x.words.some(w=>w.includes("စာသားအပြည့်အစုံ")));
 assert.ok(x.outlined.some(w=>w.includes("စာသားအပြည့်အစုံ")),
  "Burmese commentary must be outlined for legibility on arbitrary backgrounds");
 assert.ok(!x.words.some(w=>w.includes("ဖတ်မည်")||w.includes("ခေါက်မည်")));
});

test("Existing regular/branded Canvas export still draws original opaque poster panels",async()=>{
 const x=fakeBrowser();
 await x.win.FutureCodeCardExport.save(match,{brandName:"FUTURE CODE FOOTBALL"});
 assert.ok(x.shapes.some(a=>a[2]>600),"Original Canvas poster panels must stay opaque");
 assert.equal(x.outlined.length,0,"Branded and regular export must keep original typography");
 assert.equal(x.clicked.length,1);
});

const assetReference=require("./asset-reference.cjs");
"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
function harness(){
 const clicks=[],canvases=[];
 const document={
  documentElement:{dataset:{}},fonts:{ready:Promise.resolve()},body:{appendChild(){}},
  createElement(tag){
   if(tag==="a")return{click(){clicks.push(this.download)},remove(){}};
   if(tag!=="canvas")throw Error("Unexpected "+tag);
   const canvas={width:0,height:0,toBlob(cb){cb(new Blob([new Uint8Array(128)],{type:"image/png"}))}};
   const ctx={canvas,fillRect(){},beginPath(){},roundRect(){},fill(){},save(){},restore(){},scale(){},rect(){},clip(){},drawImage(){},
    createLinearGradient(){return{addColorStop(){}}},measureText(v){return{width:String(v).length*11}},fillText(){},strokeText(){}};
   canvas.getContext=()=>ctx;canvases.push(canvas);return canvas;
  }
 };
 class FakeImage{constructor(){this.naturalWidth=100;this.naturalHeight=100}set src(v){queueMicrotask(()=>this.onload?.())}}
 const window={},ctx=vm.createContext({window,document,Image:FakeImage,Blob,URL:{createObjectURL(){return"blob:png"},revokeObjectURL(){}},setTimeout,clearTimeout,Promise,console});
 for(const file of ["canvas-image-kit.js","card-export.js"])vm.runInContext(fs.readFileSync(path.join(root,file),"utf8"),ctx);
 return{window,clicks,canvases};
}
const makeMatch=n=>({home:"Home"+n,away:"Away"+n,homeDisplay:"အသင်း"+n,awayDisplay:"ဧည့်"+n,
 league:"Premier League",dailyPreviewText:"Professional Myanmar match preview "+n,homeOdds:2,drawOdds:3,awayOdds:4,
 myanmarOdds:{upperTeam:"Home"+n,bodyOdds:"-25",goalTotalOdds:"3-60"},homeLastFive:[],awayLastFive:[]});
test("individual preview downloads a PNG with no ZIP archive",async()=>{
 const x=harness();
 await x.window.FutureCodeCardExport.save(makeMatch(1),{brandName:"Future Code",mainScreenshot:true,downloadFilename:"preview-01.png"});
 assert.equal(x.clicks.length,1);
 assert.equal(x.clicks[0],"preview-01.png");
 assert.ok(x.canvases.some(c=>c.width===1200),"Individual picture stays original width");
 assert.ok(x.canvases.every(c=>c.width!==4872),"Never generate paired batch images");
});
test("no paired or all-preview bulk export remains; current single-match choices preserved",()=>{
 const exporter=fs.readFileSync(path.join(root,"card-export.js"),"utf8");
 const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
 assert.ok(!exporter.includes("saveAll"));
 assert.ok(!exporter.includes("composePair"));
 assert.ok(app.includes('window.FutureCodeCardExport.save('));
 assert.ok(!app.includes("pairMode:"));
 const main=fs.readFileSync(path.join(root,"index.html"),"utf8");
 assetReference(main,"index.html","card-export.js");
 assetReference(main,"index.html","app.js");
});

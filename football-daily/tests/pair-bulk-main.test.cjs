"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.join(__dirname,"..");
function harness(){
 const blobs=[],clicks=[],canvases=[];
 const document={
  documentElement:{dataset:{}},fonts:{ready:Promise.resolve()},
  body:{appendChild(){}},
  createElement(tag){
   if(tag==="a")return {click(){clicks.push(this.download)},remove(){}};
   if(tag!=="canvas")throw Error("Unexpected "+tag);
   const canvas={width:0,height:0,toBlob(cb){const blob=new Blob([new Uint8Array(5)],{type:"image/png"});blobs.push(blob);cb(blob)}};
   const ctx={canvas,fillRect(){},beginPath(){},roundRect(){},fill(){},save(){},restore(){},rect(){},clip(){},drawImage(){},
    createLinearGradient(){return {addColorStop(){}}},measureText(v){return {width:String(v).length*11}},fillText(){},strokeText(){}};
   canvas.getContext=()=>ctx;canvases.push(canvas);return canvas;
  }
 };
 class FakeImage{constructor(){this.naturalWidth=100;this.naturalHeight=100}set src(v){queueMicrotask(()=>this.onload?.())}}
 const window={};
 const ctx=vm.createContext({window,document,Image:FakeImage,Blob,TextEncoder,Uint8Array,DataView,
  createImageBitmap:async()=>({width:1200,height:1410,close(){}}),
  URL:{createObjectURL(){return "blob:test"},revokeObjectURL(){}},setTimeout,clearTimeout,Promise,console});
 for(const file of ["canvas-image-kit.js","card-export.js"])
  vm.runInContext(fs.readFileSync(path.join(root,file),"utf8"),ctx);
 return {window,clicks,canvases};
}
const makeMatch=(n)=>({home:"Home"+n,away:"Away"+n,homeDisplay:"အသင်း"+n,awayDisplay:"ဧည့်"+n,
 league:"Premier League",dailyPreviewText:"Long Burmese match analysis "+n,homeOdds:2,drawOdds:3,awayOdds:4});
test("Main paired bulk ZIP merges adjacent 2 previews into one transparent 2436px image and keeps odd last",async()=>{
 const x=harness();
 const count=await x.window.FutureCodeCardExport.saveAll([1,2,3,4,5].map(makeMatch),{pairMode:true,date:"2026-10-16",brandName:"Future Code"});
 assert.equal(count,3);
 const paired=x.canvases.filter(c=>c.width===2436||c.width===1200&&c.height===1410);
 assert.equal(x.canvases.filter(c=>c.width===2436).length,2);
 assert.ok(x.canvases.some(c=>c.width===1200&&c.height===1410),"Odd fixture should remain one image");
 assert.equal(x.clicks.length,1);
 assert.match(x.clicks[0],/\.zip$/);
});
test("Branded bulk ZIP preserves one match per PNG",async()=>{
 const x=harness();const count=await x.window.FutureCodeCardExport.saveAll([1,2,3].map(makeMatch),{pairMode:false});
 assert.equal(count,3);
 assert.equal(x.canvases.filter(c=>c.width===2436).length,0);
 assert.equal(x.clicks.length,1);
});
test("Paired previews omit both league labels and Future Code footer",()=>{
 const src=fs.readFileSync(path.join(root,"card-export.js"),"utf8");
 assert.ok(src.includes("hideLeagueLabel:true,hideFooterBrand:true"));
 assert.ok(src.includes('if(!opts.hideLeagueLabel)text(ctx,opts.leagueLabel'));
 assert.ok(src.includes('if(!opts.hideFooterBrand){'));
 const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
 assert.ok(app.includes('pairMode:!document.documentElement.dataset.footballBrandName'));
 const main=fs.readFileSync(path.join(root,"index.html"),"utf8");
 assert.ok(main.includes("20261016-pair2"));
 for(const site of ["ykz-family","bw-sport","ko-thet-family"]){
  assert.ok(!fs.readFileSync(path.join(root,site,"index.html"),"utf8").includes("pairMode"));
 }
});

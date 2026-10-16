"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");

test("main site only loads the fast native PNG wrapper (no blocking DOM screenshot library)",()=>{
 const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
 assert.ok(html.includes("main-match-screenshot.js?v=20261016-transparent-all"));
 for(const forbidden of ["vendor/dom-to-image.min.js","dom-capture.js"])
  assert.ok(!html.includes(forbidden),"Slow DOM capture must not load: "+forbidden);
 const scripts=["card-export.js","canvas-image-kit.js","main-match-screenshot.js","app.js"];
 const positions=scripts.map(name=>html.indexOf('src="./'+name));
 assert.ok(positions.every(n=>n>=0));
 assert.ok(positions.every((n,i)=>i===0||n>positions[i-1]));
 for(const brand of ["ykz-family","bw-sport","ko-thet-family","myanmar-football"]){
  const brandHtml=fs.readFileSync(path.join(root,brand,"index.html"),"utf8");
  assert.ok(!brandHtml.includes("main-match-screenshot.js"),brand+" keeps original export");
 }
});
function run(brand=false){
 let calls=[];
 const canvasSave=async(...args)=>{calls.push(args);return "canvas"};
 const exporter={save:canvasSave,saveAll:async()=>42};
 const window={FutureCodeCardExport:exporter};
 const document={documentElement:{hasAttribute(name){return brand&&name==="data-football-brand-name"}}};
 vm.runInNewContext(fs.readFileSync(path.join(root,"main-match-screenshot.js"),"utf8"),{window,document});
 return {exporter,canvasSave,calls};
}
test("single-match main PNG immediately uses native Canvas with full text and transparent outer page",async()=>{
 const x=run();
 const match={home:"ဘားမင်ဂမ်",away:"လိဗာပူး",dailyPreviewText:"စာသားအားလုံး"};
 const card={};
 assert.equal(await x.exporter.save(match,{cardNode:card,special:false}),"canvas");
 assert.equal(x.calls.length,1);
 const [actual,opts]=x.calls[0];
 assert.equal(actual,match);
 assert.equal(opts.mainScreenshot,true);
 assert.equal(opts.special,false);
 assert.match(opts.downloadFilename,/^ပွဲကြိုသုံးသပ်ချက်/);
 assert.match(opts.downloadFilename,/ဘားမင်ဂမ်/);
 assert.match(opts.downloadFilename,/\.png$/);
 const canvas=fs.readFileSync(path.join(root,"card-export.js"),"utf8");
 assert.ok(canvas.includes('if(!transparent)fill(ctx,0,0,W,H,C.bg)'));
 assert.ok(canvas.includes('const fill=transparent?()=>{}:paintFill'),"Panel backgrounds must be skipped in main PNGs");
 assert.ok(canvas.includes('const textKit=transparent?{...k,text}:k'),"Burmese article must retain readable outlined letters");
 assert.ok(canvas.includes('opts.downloadFilename'));
 assert.ok(!canvas.includes('analysis-toggle'),"PNG never prints read/collapse toggle");
});
test("bulk ZIP, programmatic PNGs and branded exporter stay unchanged",async()=>{
 const x=run();
 assert.equal(await x.exporter.save({home:"A",away:"B"},{}),"canvas");
 assert.equal(x.calls[0][1].mainScreenshot,undefined);
 assert.equal(await x.exporter.saveAll([]),42);
 const brand=run(true);
 assert.equal(brand.exporter.save,brand.canvasSave);
 assert.equal(await brand.exporter.save({home:"A",away:"B"},{}),"canvas");
 assert.equal(brand.calls.length,1);
});

"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");

test("only the original Future Code homepage loads the match DOM screenshot exporter",()=>{
 const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
 for(const name of ["vendor/dom-to-image.min.js","dom-capture.js","main-match-screenshot.js"])
  assert.ok(html.includes('src="./'+name),name+" should be loaded on the main website");
 const scripts=["card-export.js","vendor/dom-to-image.min.js","dom-capture.js","main-match-screenshot.js","app.js"];
 const indexes=scripts.map(s=>html.indexOf('src="./'+s));
 assert.ok(indexes.every(n=>n>=0));
 assert.ok(indexes.every((n,i)=>i===0||n>indexes[i-1]),"scripts must run in dependency order");
 for(const brand of ["ykz-family","bw-sport","ko-thet-family","myanmar-football"]){
  const brandHtml=fs.readFileSync(path.join(root,brand,"index.html"),"utf8");
  assert.ok(!brandHtml.includes("main-match-screenshot.js"),brand+" should retain its Canvas PNG export");
  assert.ok(!brandHtml.includes("dom-capture.js"),brand+" should not load screenshot support");
 }
});

function run(brand=false){
 let canvasCount=0;
 const snapshotCalls=[];
 const canvasSave=async()=>{canvasCount++;return "canvas"};
 const exporter={save:canvasSave,saveAll:async()=>42};
 const window={FutureCodeCardExport:exporter,domtoimage:{toBlob(){}},
  FutureCodeDomCapture:{save:async(...args)=>{snapshotCalls.push(args);return true}}};
 const document={documentElement:{hasAttribute(name){return brand&&name==="data-football-brand-name"}}};
 vm.runInNewContext(fs.readFileSync(path.join(root,"main-match-screenshot.js"),"utf8"),{window,document});
 return {exporter,canvasSave,snapshotCalls,get canvasCount(){return canvasCount}};
}

test("each main-site match PNG is the actual full card without page background or controls",async()=>{
 const x=run();
 const card={isConnected:true,classList:{contains:c=>c==="match-card"}};
 const result=await x.exporter.save({home:"အိမ်ရှင်",away:"ဧည့်သည်"},{cardNode:card});
 assert.equal(result,true);
 assert.equal(x.canvasCount,0);
 assert.equal(x.snapshotCalls.length,1);
 const [actualCard,name,opts]=x.snapshotCalls[0];
 assert.equal(actualCard,card);
 assert.match(name,/ပွဲကြိုသုံးသပ်ချက်/);
 assert.match(name,/\.png$/);
 assert.equal(opts.background,"transparent");
 assert.equal(opts.excludeControls,true);
 const dom=fs.readFileSync(path.join(root,"dom-capture.js"),"utf8");
 assert.match(dom,/\.analysis-toggle/);
 assert.match(dom,/\.match-actions/);
 assert.match(dom,/clone\.querySelectorAll\("\.analysis-body/);
 assert.match(dom,/e\.hidden=false/);
});

test("regular Canvas calls, bulk PNG exports and branded sites stay unchanged",async()=>{
 const main=run();
 assert.equal(await main.exporter.save({home:"A",away:"B"},{}),"canvas");
 assert.equal(main.canvasCount,1);
 assert.equal(await main.exporter.saveAll([]),42);
 const brand=run(true);
 assert.equal(brand.exporter.save,brand.canvasSave);
 assert.equal(await brand.exporter.save({home:"A",away:"B"},{}),"canvas");
 assert.equal(brand.canvasCount,1);
});

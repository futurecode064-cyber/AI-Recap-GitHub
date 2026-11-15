"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const brandIds=["ykz-family","kmm-sport-hub","ko-thet-family","bw-sport","future-code-journal"];
const imageData=read("brand-export-data.js");
const current=JSON.parse(read("data/today.json"));
const odds=JSON.parse(read("data/odds/"+current.reportDate+".json"));
const fixtures=[...current.matches,...odds.matches];

function boot(brand){
 const host="https://journal-contract.example";
 const document={baseURI:host+"/"+brand+"/"};
 const window={};
 // Execute the ACTUAL production module, rather than looking for substrings:
 // missing variables in an Object.assign or declaration must fail the test.
 vm.runInNewContext(imageData,{window,document,URL});
 assert(window.FutureCodeBrandExportData,"brand image module failed to initialize");
 return {data:window.FutureCodeBrandExportData,host};
}
test("Daily publication contains valid fixtures and consistent dates",()=>{
 assert.match(current.reportDate,/^\d{4}-\d{2}-\d{2}$/);
 assert.equal(odds.reportDate,current.reportDate);
 assert(current.matches.length>0);
 assert(odds.matches.length>0);
});
for(const brand of brandIds){
 test(brand+" current preview and odds PNG logos resolve to intact same-origin images",()=>{
  const {data,host}=boot(brand);
  let clubCount=0;
  for(const fixture of fixtures){
   const leagueImage=data.leagueCrest(fixture.league);
   assert(leagueImage,brand+" missing league icon: "+fixture.league);
   const leaguePath=new URL(leagueImage);
   assert.equal(leaguePath.origin,host,"League icon must not require external CORS");
   assertLocalPng(leaguePath.pathname,"league "+fixture.league);
   for(const side of ["home","away"]){
    const key=side+"CrestUrl",src=fixture[key];
    assert(src,brand+" missing "+key+" for "+fixture.fixtureId);
    const url=new URL(data.imageUrl(src));
    assert.equal(url.origin,host,brand+" external club PNG: "+fixture.fixtureId+" "+key+" "+url.href);
    assertLocalPng(url.pathname,"club "+fixture.fixtureId+" "+key);
    clubCount++;
   }
  }
  assert.equal(clubCount,2*fixtures.length);
 });
 test(brand+" preview and odds load a single standardized PNG and native Gallery pipeline",()=>{
  for(const htmlName of ["index.html","odds.html"]){
   const html=read(brand+"/"+htmlName);
   const sequence=["../brand-export-data.js","../native-image-save.js","../canvas-image-kit.js","../brand-download-masthead.js","../daily-image-export.js"];
   let last=-1;
   for(const script of sequence){
    const pos=html.indexOf(script);
    assert(pos>last,brand+"/"+htmlName+" wrong script order or missing "+script);
    last=pos;
   }
   assert.match(html,/brand-export-data\.js\?v=20261115-(?:complete-logos|ktf-export-js-crash-fix|daily-png-contract)/);
  }
 });
}
function assertLocalPng(urlPath,label){
 assert(urlPath.startsWith("/assets/"),"unexpected PNG image path: "+urlPath);
 const file=path.join(root,urlPath.replace(/^\//,""));
 assert(fs.existsSync(file),label+" missing "+file);
 const bytes=fs.readFileSync(file);
 assert(bytes.length>100,label+" image is empty: "+file);
 assert(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),label+" not a PNG: "+file);
 const w=bytes.readUInt32BE(16),h=bytes.readUInt32BE(20);
 assert(w>=20&&h>=20,label+" broken image dimensions: "+w+"x"+h);
}
test("PNG download and native bridge functions stay connected",()=>{
 assert.match(read("canvas-image-kit.js"),/FutureCodeImageSave\.saveBlob\(blob,filename\)/);
 assert.match(read("native-image-save.js"),/FCJournalNative/);
 assert.match(read("daily-image-export.js"),/kit\.download\(canvas,filename\)/);
});

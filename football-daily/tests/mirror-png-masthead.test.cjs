"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const expected=[
 ["bw-sport","BW SPORT","ဘောလုံးဂျာနယ်"],
 ["ykz-family","YKZ FAMILY GROUP","အတူရှေ့ဆက် YKZ"],
 ["ko-thet-family","KO THET FAMILY","ဘောလုံးဂျာနယ်"]
];
for(const [id,title,sub] of expected){
 test(id+" saves a full-width journal masthead above the unmodified PNG",async()=>{
  const calls=[],labels=[],downloads=[];
  const context=()=>({
   save(){},restore(){},scale(){},fillRect(){},drawImage(...a){calls.push(a)},
   beginPath(){},moveTo(){},lineTo(){},stroke(){},
   createLinearGradient(){return {addColorStop(){}}},
   measureText(s){return {width:String(s).length*28}},
   fillText(s){labels.push(String(s))}
  });
  const kit={
   fonts:async()=>{},
   create:(width,height)=>({canvas:{width,height},ctx:context()}),
   download:async(canvas,filename)=>{downloads.push({canvas,filename})}
  };
  const window={FutureCodeCanvasKit:kit,FutureCodeBrandConfig:{id}};
  const document={documentElement:{dataset:{}}};
  vm.runInNewContext(fs.readFileSync(path.join(root,"brand-download-masthead.js"),"utf8"),
   {window,document,console,Promise,setTimeout,clearTimeout,Image:class{}});
  const source={width:1200,height:1600};
  await kit.download(source,"one.png");
  assert.equal(downloads.length,1);
  assert.equal(downloads[0].canvas.width,1200);
  assert.equal(downloads[0].canvas.height,1790);
  assert.ok(calls.some(args=>args[0]===source&&args[1]===0&&args[2]===190));
  assert.ok(labels.includes(title));assert.ok(labels.includes(sub));
  assert.equal(source.height,1600);
  for(const page of ["index.html","odds.html"]){
   const html=fs.readFileSync(path.join(root,id,page),"utf8");
   assert.ok(html.includes("../brand-download-masthead.js?v=20261021-journal-header"));
   assert.ok(html.indexOf("canvas-image-kit.js")<html.indexOf("brand-download-masthead.js"));
  }
 });
}
test("Main website and Goal Zone never load this journal-only masthead",()=>{
 for(const page of ["index.html","odds.html","future-code-journal/index.html"]){
  assert.ok(!fs.readFileSync(path.join(root,page),"utf8").includes("brand-download-masthead.js"));
 }
});

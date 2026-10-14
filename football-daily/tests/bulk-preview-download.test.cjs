const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

function harness(){
 const source=fs.readFileSync(path.join(__dirname,"..","card-export.js"),"utf8");
 const clicks=[],urls=[];
 const document={
  documentElement:{dataset:{footballBrandName:"YKZ FAMILY GROUP",footballBrandLogoUrl:""}},
  body:{appendChild(){}},
  createElement(type){
   if(type!=="a")throw Error("Unexpected DOM element "+type);
   return {href:"",download:"",click(){clicks.push(this.download)},remove(){}};
  }
 };
 const ctx={
  measureText(s){return {width:String(s).length*12}},
  createLinearGradient(){return {addColorStop(){}}}
 };
 const kit={
  C:{bg:"#111",head:"#222",panel:"#333",panelAlt:"#444",orange:"#eee",muted:"#aaa",white:"#fff",pale:"#fff"},
  create(width,height){
   return {ctx,canvas:{width,height,toBlob(cb){cb(new Blob([Uint8Array.from([137,80,78,71,13,10,26,10,1,2,3])],{type:"image/png"}))}}};
  },
  fill(){},line(){},text(){},fit(){return 18},crest(){},
  async fonts(){},async preloadImages(){},
  async download(){throw Error("saveAll must never start a separate PNG download")}
 };
 const window={FutureCodeCanvasKit:kit};
 const FakeURL={createObjectURL(blob){urls.push(blob);return "blob:test-zip"},revokeObjectURL(){}};
 vm.runInNewContext(source,{
  document,window,URL:FakeURL,Blob,TextEncoder,Uint8Array,DataView,Promise,
  setTimeout(fn,ms){return 0},clearTimeout(){},console
 });
 return {window,urls,clicks};
}

test("all previews download one ZIP with one full PNG entry per match",async()=>{
 const t=harness(),progress=[];
 const matches=Array.from({length:13},(_,i)=>({
  home:"Home "+i,away:"Away "+i,league:"Premier League",
  dailyPreviewText:"ပွဲကြိုသုံးသပ်ချက် "+i,
  homeLastFive:[],awayLastFive:[],myanmarOdds:{bodyOdds:"60",goalTotalOdds:"2+80"}
 }));
 const result=await t.window.FutureCodeCardExport.saveAll(matches,{
  brandName:"YKZ FAMILY GROUP",date:"2026-10-14",leagueName:()=> "ပရီးမီးယားလိဂ်"
 },(done,total)=>progress.push([done,total]));
 assert.equal(result,13);
 assert.equal(progress.length,13);
 assert.equal(progress.at(-1).join("/"),"13/13");
 assert.deepEqual(t.clicks,["ykz-family-group-all-previews-2026-10-14.zip"]);
 assert.equal(t.urls.length,1,"Only one download object URL must be created");

 const bytes=new Uint8Array(await t.urls[0].arrayBuffer());
 const v=new DataView(bytes.buffer),dec=new TextDecoder();
 const u16=(at)=>v.getUint16(at,true),u32=(at)=>v.getUint32(at,true);
 let at=0;
 for(let i=0;i<13;i++){
  assert.equal(u32(at),0x04034b50,"ZIP local entry "+i);
  assert.equal(u16(at+8),0,"Stored PNG is not recompressed");
  const size=u32(at+18),n=u16(at+26),extra=u16(at+28);
  const name=dec.decode(bytes.subarray(at+30,at+30+n));
  assert.match(name,new RegExp("^"+String(i+1).padStart(2,"0")+"-home-"+i+"-vs-away-"+i+"\\.png$"));
  assert.equal(size,11);
  assert.equal(bytes[at+30+n+extra],137,"Embedded PNG data exists");
  at+=30+n+extra+size;
 }
 assert.equal(u32(at),0x02014b50,"Central directory immediately follows all PNG entries");
 const end=bytes.length-22;
 assert.equal(u32(end),0x06054b50,"End of central directory signature");
 assert.equal(u16(end+8),13);
 assert.equal(u16(end+10),13);
 assert.equal(u32(end+16),at);
});

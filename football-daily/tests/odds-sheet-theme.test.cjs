"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
const sheet=JSON.parse(read("data/odds/2026-10-14.json"));
const versions=[
 {file:"odds.html",name:"FUTURE CODE FOOTBALL DAILY",id:"future-code",header:"#215c55",logo:""},
 {file:"ykz-family/odds.html",name:"YKZ FAMILY GROUP",id:"ykz-family",header:"#aa111b",logo:"https://example.com/ykz-logo.webp"},
 {file:"bw-sport/odds.html",name:"BW SPORT ဘောလုံးဂျာနယ်",id:"bw-sport",header:"#0856c4",logo:"https://example.com/bw-logo.webp"},
 {file:"ko-thet-family/odds.html",name:"Ko Thet Family ဘောလုံးဂျာနယ်",id:"ko-thet-family",header:"#830b15",logo:"https://example.com/ktf-logo.webp"}
];
test("all four odds pages load the shared light ledger CSS after each branded style and bust PNG caches",()=>{
 for(const item of versions){
  const html=read(item.file);
  const nested=item.file.includes("/");
  const style=(nested?"../":"./")+"odds-sheet-theme.css?v=odds-png-only-20261016";
  const exporter=(nested?"../":"./")+"daily-image-export.js?v=odds-png-only-20261016";
  assert.equal(html.split(style).length-1,1,item.file+" must reference ledger theme exactly once");
  assert.equal(html.split(exporter).length-1,1,item.file+" must refresh Canvas exporter exactly once");
  assert.ok(html.indexOf(style)>html.indexOf("</style>"),item.file+" ledger override after inline CSS");
  if(nested)assert.ok(html.indexOf(style)>html.indexOf("./brand.css"),item.file+" ledger override after brand CSS");
  assert.ok(html.includes('id="oddsList"')&&html.includes('id="oddsPngBtn"'));
 }
});
test("light odds ledger uses white body, dark text, branded header and real tables on mobile",()=>{
 const css=read("odds-sheet-theme.css");
 for(const color of ["#215c55","#ad101b","#0756cc","#820711"])assert.ok(css.includes(color));
 for(const marker of [
  ".odds-content .odds-group",".odds-table td",".odds-table th",
  "background:#fff!important","color:#161a21!important",
  "table-layout:fixed!important","overflow-x:auto!important",
  "display:table-row!important","display:table-cell!important",
  ".odds-table td.upper","@media(max-width:700px)"
 ])assert.ok(css.includes(marker),"Missing light spreadsheet style: "+marker);
 assert.ok(!css.includes("body .odds-content .odds-table tr{display:grid"));
});
function harness(variant){
 const fills=[],labels=[],clicked=[];
 const document={
  documentElement:{dataset:{footballBrandName:variant.name,footballBrandLogoUrl:variant.logo}},
  fonts:{ready:Promise.resolve()},
  body:{appendChild(){}},
  createElement(kind){
   if(kind==="a")return {click(){clicked.push(this.download)},remove(){}};
   if(kind!=="canvas")throw Error("Unexpected DOM element "+kind);
   const canvas={width:0,height:0,toBlob(cb){cb({size:500,type:"image/png"})}};
   const ctx={
    canvas,fillRect(x,y,w,h){fills.push({x,y,w,h,color:this.fillStyle})},
    beginPath(){},roundRect(x,y,w,h,r){this._rounded={x,y,w,h}},fill(){if(this._rounded)fills.push({...this._rounded,color:this.fillStyle})},
    save(){},restore(){},rect(){},clip(){},
    drawImage(){},measureText(v){return {width:String(v).length*11}},
    fillText(v){labels.push({text:String(v),color:this.fillStyle})}
   };
   canvas.getContext=()=>ctx;
   harness.lastCanvas=canvas;
   return canvas;
  }
 };
 class FakeImage{constructor(){this.naturalWidth=100;this.naturalHeight=100}set src(v){queueMicrotask(()=>this.onload?.())}}
 const URL={createObjectURL(){return "blob:png"},revokeObjectURL(){}};
 const window={FutureCodeBrandConfig:{id:variant.id}};
 const env={window,document,Image:FakeImage,URL,setTimeout,clearTimeout,Promise,console};
 const ctx=vm.createContext(env);
 for(const name of ["canvas-image-kit.js","daily-image-export.js"])vm.runInContext(read(name),ctx);
 return {window,fills,labels,clicked};
}
test("all four downloadable odds PNGs render a white gridded ledger with brand-specific colored headers and all 15 rows",async()=>{
 assert.equal(sheet.matches.length,15,"Keep the user-requested two fixture removals");
 const groups=new Set(sheet.matches.map(m=>m.league)).size;
 for(const v of versions){
  const h=harness(v);
  await h.window.FutureCodeDailyExport.saveOdds(sheet);
  assert.equal(harness.lastCanvas.width,1200);
  assert.equal(harness.lastCanvas.height,222+groups*126+15*68+80);
  assert.equal(h.clicked[0],v.id+"-odds-2026-10-14.png");
  const colors=h.fills.map(x=>x.color);
  assert.ok(colors.includes("#ffffff"),v.id+" white cells");
  assert.ok(colors.includes("#e7e9ed"),v.id+" light-gray upper-team column");
  assert.ok(colors.includes("#cbd2da"),v.id+" gray spreadsheet borders");
  assert.ok(colors.includes(v.header),v.id+" independent branded league header");
  const texts=h.labels.map(x=>x.text);
  assert.ok(texts.includes("ယနေ့ ပေါက်ကြေးများ"));
  assert.ok(texts.includes(v.name));
  for(const m of sheet.matches){
   for(const value of [m.home,m.away,m.upperTeam,m.bodyOdds,m.goalTotalOdds,m.pdfLastColumn,String(m.kickoffDisplay).replace(/^.*? ည /,'ည ')]){
    assert.ok(texts.join('').includes(String(value)),v.id+" missing "+value);
   }
  }
  assert.ok(!texts.includes("လီဗော်နို")&&!texts.includes("ပရိုဗာချယ်လီ"),"Deleted rows must not leak into exports");
 }
});

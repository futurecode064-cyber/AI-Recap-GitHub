const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const code=['canvas-image-kit.js','daily-image-export.js'].map(p=>fs.readFileSync(path.join(root,p),'utf8'));
function fixture(n){
 return {reportDate:'2026-10-16',matches:Array.from({length:n},(_,i)=>({
  league:i<Math.floor(n/2)?'Premier League':'La Liga',
  home:'HOME-'+i,away:'AWAY-'+i,kickoffDisplay:'20:00',
  upperTeam:'TOP-'+i,bodyOdds:'80',goalTotalOdds:'2-75',pdfLastColumn:'1-0'
 }))};
}
function harness(brand){
 const clicked=[],blobs=[],canvases=[],drawn=[];
 const pngBytes=new Uint8Array([137,80,78,71,13,10,26,10]);
 const document={
  documentElement:{dataset:{footballBrandName:brand||'FUTURE CODE FOOTBALL DAILY'}},
  fonts:{ready:Promise.resolve()},
  body:{appendChild(){}},
  createElement(type){
   if(type==='a')return {click(){clicked.push(this.download)},remove(){}};
   if(type!=='canvas')throw Error('Unexpected DOM node '+type);
   const canvas={width:0,height:0,toBlob(cb){cb(new Blob([pngBytes],{type:'image/png'}));}};
   const ctx={
    canvas,fillRect(){},beginPath(){},roundRect(){},fill(){},save(){},restore(){},rect(){},clip(){},
    createLinearGradient(){return {addColorStop(){}}},createRadialGradient(){return {addColorStop(){}}},
    drawImage(){},measureText(v){return {width:String(v).length*11}},
    fillText(v){drawn.push(String(v))}
   };
   canvas.getContext=()=>ctx;canvases.push(canvas);return canvas;
  }
 };
 class FakeImage{constructor(){this.naturalWidth=50;this.naturalHeight=50}
  set src(value){queueMicrotask(()=>this.onload?.())}
 }
 const URL={createObjectURL(blob){blobs.push(blob);return 'blob:generated-'+blobs.length},revokeObjectURL(){}};
 const window={};
 vm.runInNewContext(code.join('\n'),{window,document,URL,Blob,TextEncoder,Image:FakeImage,
  setTimeout,clearTimeout,Promise,console});
 return {clicked,blobs,canvases,drawn,api:window.FutureCodeDailyExport};
}
test('up to twenty selected matches download one PNG with every original row',async()=>{
 for(const n of [1,20]){
  const h=harness(),data=fixture(n);
  const result=await h.api.saveOddsSmart(data);
  assert.equal(result.fileCount,1);
  assert.equal(h.canvases.length,1);
  assert.equal(h.clicked.length,1);
  assert.ok(h.clicked[0].endsWith('.png'));
  assert.equal(h.drawn.filter(x=>/^HOME-/.test(x)).length,n);
 }
});
test('twenty-one matches become two balanced PNG pages in one valid two-entry ZIP',async()=>{
 const h=harness(),data=fixture(21);
 const result=await h.api.saveOddsSmart(data);
 assert.equal(result.fileCount,2);assert.equal(result.matchCount,21);
 assert.equal(result.format,'zip');assert.equal(h.canvases.length,2);
 assert.equal(h.clicked.length,1);assert.match(h.clicked[0],/two-pages\.zip$/);
 assert.equal(h.drawn.filter(x=>/^HOME-/.test(x)).length,21);
 assert.equal(h.blobs.length,1);assert.equal(h.blobs[0].type,'application/zip');
 const bytes=new Uint8Array(await h.blobs[0].arrayBuffer()),raw=Buffer.from(bytes);
 const names=[...raw.toString('utf8').matchAll(/future-code-odds-2026-10-16-part-0[12]\.png/g)].map(x=>x[0]);
 assert.equal(names.length,4,'Each of two PNG filenames appears in local and central ZIP headers');
 assert.equal(raw.readUInt32LE(0),0x04034b50);
 assert.equal(raw.readUInt32LE(raw.length-22),0x06054b50);
 assert.equal(raw.readUInt16LE(raw.length-22+10),2);
});
test('selected-league subset exports only chosen matches and never rewrites the source data',async()=>{
 const h=harness(),data=fixture(38);
 const subset=data.matches.filter(x=>x.league==='Premier League');
 const result=await h.api.saveOddsSmart({...data,matches:subset});
 assert.equal(result.fileCount,1);assert.equal(subset.length,19);
 assert.equal(data.matches.length,38);
 assert.equal(h.drawn.filter(x=>/^HOME-/.test(x)).length,19);
 assert.equal(h.clicked.length,1);
});
test('large filtered exports include every record across exactly two pages',async()=>{
 const h=harness(),data=fixture(56);
 const result=await h.api.saveOddsSmart(data);
 assert.equal(result.fileCount,2);
 assert.equal(h.canvases.length,2);
 assert.equal(h.drawn.filter(x=>/^HOME-/.test(x)).length,56);
 const heights=h.canvases.map(x=>x.height);
 assert.ok(Math.abs(heights[0]-heights[1])<=131,'Pages should have similar heights');
});
test('four branded odds pages load the shared new filter and exporter assets',()=>{
 for(const page of ['odds.html','ykz-family/odds.html','bw-sport/odds.html','ko-thet-family/odds.html']){
  const html=fs.readFileSync(path.join(root,page),'utf8');
  for(const asset of ['daily-image-export.js?v=odds-filter-20261016','odds.js?v=odds-filter-20261016','odds-sheet-theme.css?v=odds-filter-20261016'])
   assert.ok(html.includes(asset),page+' needs '+asset);
 }
 const js=fs.readFileSync(path.join(root,'odds.js'),'utf8');
 assert.ok(js.includes('setupLeagueFilter(data)'));
 assert.ok(js.includes('saveOddsSmart({...loadedSheet,matches})'));
});

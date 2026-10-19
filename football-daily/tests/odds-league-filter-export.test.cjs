const assetReference=require("./asset-reference.cjs");
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
  const result=await h.api.saveOdds(data);
  assert.equal(result.fileCount,1);
  assert.equal(h.canvases.length,1);
  assert.equal(h.clicked.length,1);
  assert.ok(h.clicked[0].endsWith('.png'));
  assert.equal(h.drawn.filter(x=>/^HOME-/.test(x)).length,n);
 }
});
test('twenty-one matches still export exactly one PNG containing every match',async()=>{
 const h=harness(),data=fixture(21);
 const result=await h.api.saveOdds(data);
 assert.equal(result.fileCount,1);assert.equal(result.matchCount,21);
 assert.equal(result.format,'png');assert.equal(h.canvases.length,1);
 assert.equal(h.clicked.length,1);assert.match(h.clicked[0],/\.png$/);
 assert.equal(h.drawn.filter(x=>/^HOME-/.test(x)).length,21);
 assert.ok(h.blobs.every(blob=>blob.type==='image/png'));
});
test('selected-league subset exports only chosen matches and never rewrites the source data',async()=>{
 const h=harness(),data=fixture(38);
 const subset=data.matches.filter(x=>x.league==='Premier League');
 const result=await h.api.saveOdds({...data,matches:subset});
 assert.equal(result.fileCount,1);assert.equal(subset.length,19);
 assert.equal(data.matches.length,38);
 assert.equal(h.drawn.filter(x=>/^HOME-/.test(x)).length,19);
 assert.equal(h.clicked.length,1);
});
test('56 matches and all leagues export in one PNG without dropping rows',async()=>{
 const h=harness(),data=fixture(56);
 const result=await h.api.saveOdds(data);
 assert.equal(result.fileCount,1);
 assert.equal(h.canvases.length,1);
 assert.equal(result.matchCount,56);
 assert.equal(h.drawn.filter(x=>/^HOME-/.test(x)).length,56);
 assert.equal(h.clicked.length,1);
 assert.match(h.clicked[0],/\.png$/);
 assert.ok(h.canvases[0].height>4000);
});
test('four branded odds pages load the shared new filter and exporter assets',()=>{
 for(const page of ['odds.html','ykz-family/odds.html','bw-sport/odds.html','ko-thet-family/odds.html']){
  const html=fs.readFileSync(path.join(root,page),'utf8');
  for(const asset of ['daily-image-export.js','odds.js','odds-sheet-theme.css'])
   assetReference(html,page,asset);
 }
 const js=fs.readFileSync(path.join(root,'odds.js'),'utf8');
 assert.ok(js.includes('setupLeagueFilter(data)'));
 assert.ok(js.includes('kit.saveOdds({...data,matches:page.matches},options)'));
 assert.ok(js.includes('kit.partition(matches,isMainOdds?{threshold:3,maxPerPage:3}:{})'));
 assert.ok(!js.includes('saveOddsSmart'));
 assert.ok(!fs.readFileSync(path.join(root,'daily-image-export.js'),'utf8').includes('zipPngs'));
});

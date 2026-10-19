'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'main-table-odds-frames.js'),'utf8');
const domSource=fs.readFileSync(path.join(root,'main-odds-dom-frame.js'),'utf8');
const zipSource=fs.readFileSync(path.join(root,'frame-zip.js'),'utf8');
function setup(){
  const calls=[];
  const fakeCanvas={width:2280,height:1080,toBlob(cb){
    cb(new Blob([new Uint8Array([137,80,78,71,13,10,26,10])],{type:'image/png'}));
  }};
  const window={FutureCodeOddsDomFrame:{draw:async(...args)=>{calls.push(args);return fakeCanvas;}}};
  const document={documentElement:{dataset:{}},readyState:'loading',addEventListener(){}};
  const context={window,document,location:{pathname:'/odds.html'},Map,Set,Error,Blob,Uint8Array,Uint32Array,DataView,TextEncoder,Date};
  vm.runInNewContext(zipSource,context);
  vm.runInNewContext(source,context);
  return {api:window.FutureCodeTableOddsFrames,calls};
}
test('Odd/even frame exports preserve every selected row and balanced halves',()=>{
  const {api}=setup();
  for(const n of [1,2,15,16,19]){
    const rows=Array.from({length:n},(_,i)=>({number:i}));
    const halves=api.split(rows,'two');
    assert.equal(halves.flat().length,n);
    assert.deepEqual(Array.from(halves.flat(),r=>r.number),rows.map(r=>r.number));
    assert.ok(halves.length===1||halves[0].length-halves[1].length<=1);
  }
  assert.equal(api.split(Array(19).fill({}),'auto')[0].length,10);
  assert.equal(api.split(Array(19).fill({}),'one').length,1);
});
test('Selected frame routes to website table capture instead of a redesigned canvas table',async()=>{
  const {api,calls}=setup();
  const match={league:'Premier League',home:'အိမ်ရှင်',away:'ဧည့်သည်',bodyOdds:'1+15',
    currentBodyOdds:'1-10',goalTotalOdds:'3+95',currentGoalTotalOdds:'3+90',pdfLastColumn:'2-1'};
  const opts={design:['colour','Colour Background Change','#111111'],colour:'#b51a24',date:'2026-10-19'};
  const rendered=await api.draw([match],opts,1,1);
  assert.equal(rendered.width,2280);
  assert.equal(calls.length,1);
  assert.equal(calls[0][0][0],match);
  assert.equal(calls[0][1],opts);
});
test('PNG is based on real website league and table DOM, never a generic fallback sheet',()=>{
  assert.match(domSource,/document\.querySelectorAll\("#oddsList \.odds-group"\)/);
  assert.match(domSource,/live\.cloneNode\(true\)/);
  assert.match(domSource,/group\.dataset\.oddsLeague=league/);
  assert.match(domSource,/group\.querySelectorAll\("button,\.odds-league-png-parts"\)/);
  assert.match(domSource,/group\.querySelectorAll\("tbody tr"\)/);
  assert.match(domSource,/root\.style\.setProperty\("--sheet-brand",theme\)/);
  assert.match(domSource,/root\.style\.setProperty\("--sheet-deep",colour\(theme,\.70\)\)/);
  assert.match(domSource,/dateEl\.textContent=date\|\|""/);
  assert.match(domSource,/const WIDTH=1040,SCALE=2/);
  assert.doesNotMatch(domSource,/fallbackTable/);
});
test('Blocked DOM screenshot does not change the website table layout',()=>{
  assert.match(domSource,/async function measuredCapture\(root,theme\)/);
  assert.match(domSource,/const rect=\(el,base\)=>/);
  assert.match(domSource,/querySelectorAll\("thead th"\)/);
  assert.match(domSource,/querySelectorAll\("tbody tr"\)/);
  assert.match(domSource,/querySelectorAll\("td"\)/);
  assert.match(domSource,/window\.FutureCodeOddsDomFrame\.lastCapture="measured-website"/);
  assert.match(domSource,/ctx\.drawImage\(shot\.image/);
});
test('League logos stay next to league titles; team logos stay between team names',()=>{
  assert.match(domSource,/header\.querySelector\("h2\.odds-league-heading"\)/);
  assert.match(domSource,/h\.querySelector\("\.league-crest,\.league-mark"\)/);
  assert.match(domSource,/group\.dataset\.oddsLeague/);
  assert.match(domSource,/assets\/table-odds-frames\/league-/);
  assert.match(domSource,/td\.querySelectorAll\("\.team-badge"\)/);
  assert.match(domSource,/await drawCrest\(ctx,img,root/);
  assert.match(domSource,/label\.style\.setProperty\("font-size","20px","important"\)/);
});
test('All frame banners stay at the top/bottom while the table is unchanged',()=>{
  const {api}=setup();
  assert.equal(api.designs.length,16);
  assert.equal(new Set(api.designs.map(d=>d[0])).size,16);
  for(const d of api.designs.filter(d=>d[3])){
    assert.ok(fs.statSync(path.join(root,'assets/table-odds-frames',d[0]+'-frame.jpg')).size>1000);
    assert.ok(d[3].top+d[3].bottom<1);
  }
  assert.match(domSource,/ctx\.drawImage\(frame,0,0/);
  assert.match(domSource,/ctx\.drawImage\(frame,0,frame\.height\*\(1-fractionBottom\)/);
});
test('One-click selected frame download supports both single PNG and two-page ZIP',()=>{
  assert.match(source,/archive=download&&parts\.length>1/);
  assert.match(source,/await archive\.add\(filename,blob\)/);
  assert.match(source,/a\.download=settings\.design\[0\]\+'-odds-table-'\+sheet\.reportDate\+'\.zip'/);
  assert.match(source,/document\.body\.appendChild\(a\);a\.click\(\)/);
  assert.match(source,/PNG Download လင့်ခ်ကို နှိပ်ပါ/);
});
test('ZIP still contains one PNG per frame and balanced half',async()=>{
  const {api,calls}=setup();
  const rows=Array.from({length:19},(_,i)=>({league:'Premier League',home:'H'+i,away:'A'+i}));
  const statuses=[];
  const result=await api.zipFrames(rows,{date:'2026-10-19',colour:'#a41625',mode:'auto'},p=>statuses.push(p));
  assert.equal(result.partCount,2);
  assert.equal(result.fileCount,32);
  assert.equal(calls.length,32);
  assert.equal(result.blob.type,'application/zip');
  const bytes=Buffer.from(await result.blob.arrayBuffer());let pos=0;const names=[];
  while(pos+30<bytes.length && bytes.readUInt32LE(pos)===0x04034b50){
    const len=bytes.readUInt16LE(pos+26),extra=bytes.readUInt16LE(pos+28),size=bytes.readUInt32LE(pos+18);
    names.push(bytes.subarray(pos+30,pos+30+len).toString('utf8'));
    pos+=30+len+extra+size;
  }
  assert.equal(names.length,32);
  assert.equal(new Set(names).size,32);
  assert.equal(bytes.readUInt32LE(bytes.length-22),0x06054b50);
  assert.equal(statuses.at(-1).finished,true);
});
test('Main odds page alone loads DOM renderer and frame ZIP, not sub-brands',()=>{
  const html=fs.readFileSync(path.join(root,'odds.html'),'utf8');
  for(const filename of ['frame-zip.js','vendor/dom-to-image.min.js','main-odds-dom-frame.js','main-table-odds-frames.js'])
    assert.ok(html.includes(filename),filename);
  assert.ok(html.indexOf('vendor/dom-to-image.min.js')<html.indexOf('main-odds-dom-frame.js'));
  assert.ok(html.indexOf('main-odds-dom-frame.js')<html.indexOf('main-table-odds-frames.js'));
  for(const brand of ['ykz-family','bw-sport','ko-thet-family']){
    const sub=fs.readFileSync(path.join(root,brand,'odds.html'),'utf8');
    for(const filename of ['main-odds-dom-frame.js','main-table-odds-frames.js'])
      assert.ok(!sub.includes(filename),brand+': '+filename);
  }
});


test('Source scripts are only served on the main odds page and cache version is refreshed',()=>{
  const html=fs.readFileSync(path.join(root,'odds.html'),'utf8');
  assert.match(html,/main-odds-dom-frame\.js\?v=20261019-layout-v4/);
  assert.match(html,/main-table-odds-frames\.js\?v=20261019-layout-v4/);
  assert.match(domSource,/document\.documentElement\.dataset\.footballBrandName/);
});

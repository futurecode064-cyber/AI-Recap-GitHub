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
test('PNG clones the actual on-screen league groups and their HTML rows',()=>{
  assert.match(domSource,/querySelectorAll\("#oddsList \.odds-group"\)/);
  assert.match(domSource,/originalGroup\.cloneNode\(true\)/);
  assert.match(domSource,/querySelectorAll\("tbody tr"\)/);
  assert.match(domSource,/querySelectorAll\("\.odds-league-png-parts,button"\)/);
  assert.match(domSource,/snapshot\.style\.setProperty\("--sheet-brand", theme\)/);
  assert.match(domSource,/snapshot\.style\.setProperty\("--sheet-deep", shade\(theme, \.70\)\)/);
  assert.match(domSource,/dateBar\.textContent = String\(date \|\| ""\)/);
  assert.doesNotMatch(domSource,/dateBar\.textContent\s*=\s*[^;]*(?:ပွဲ|part|total)/);
  assert.match(domSource,/SCALE = 2/);
});
test('Every uploaded frame is retained with its palette and original top/bottom artwork',()=>{
  const {api}=setup();
  assert.equal(api.designs.length,16);
  assert.equal(new Set(api.designs.map(x=>x[0])).size,16);
  for(const d of api.designs.filter(d=>d[3])){
    assert.ok(fs.statSync(path.join(root,'assets/table-odds-frames',d[0]+'-frame.jpg')).size>1000);
    assert.ok(d[3].top+d[3].bottom<1);
  }
  assert.match(domSource,/ctx\.drawImage\(shot\.image/);
  assert.match(domSource,/ctx\.drawImage\(artwork/);
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

test('DOM image failure always falls back to native website-shaped odds table',async()=>{
  const draws=[];
  const ctx={
    scale(){},fillRect(){},fillText(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},
    drawImage(){draws.push('image');}
  };
  const kit={
    fonts:async()=>{},preloadImages:async()=>{},
    create:(w,h)=>({canvas:{width:w,height:h},ctx}),
    crest:()=>{}
  };
  const window={FutureCodeCanvasKit:kit};
  const document={documentElement:{dataset:{}}};
  const context={window,document,location:{pathname:'/odds.html'},
    Map,Set,Error,Promise,console,Date,Intl,Image:class {},setTimeout,clearTimeout};
  vm.runInNewContext(domSource,context);
  const canvas=await window.FutureCodeOddsDomFrame.draw([
    {league:'Premier League',home:'အိမ်ရှင်',away:'ဧည့်သည်',homeCrestUrl:null,awayCrestUrl:null,
     kickoff:'19:30',upperTeam:'အိမ်ရှင်',bodyOdds:'-30',goalTotalOdds:'3-20',pdfLastColumn:'1-0'}
  ],{design:['colour','Colour Background Change','#124467'],colour:'#124467',date:'2026-10-19'});
  assert.equal(canvas.width,2280);
  assert.ok(canvas.height>120);
  assert.deepEqual(Array.from(draws),['image']);
  assert.equal(window.FutureCodeOddsDomFrame.lastCapture,'table-fallback');
});

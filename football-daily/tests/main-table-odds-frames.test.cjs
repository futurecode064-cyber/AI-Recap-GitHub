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
test('Main PNG captures the existing live website odds DOM only',()=>{
  assert.match(domSource,/source\.cloneNode\(true\)/);
  assert.match(domSource,/document\.querySelectorAll\("#oddsList \.odds-group"\)/);
  assert.match(domSource,/root\.appendChild\(group\)/);
  assert.match(domSource,/querySelectorAll\("\.odds-league-png-parts,button"\)/);
  assert.match(domSource,/querySelectorAll\("tbody tr"\)/);
  assert.match(domSource,/window\.domtoimage\.toBlob\(root/);
  assert.match(domSource,/window\.FutureCodeOddsDomFrame\.lastCapture="html2canvas-website-dom"/);
  assert.doesNotMatch(domSource,/measuredCapture|fallbackTable|drawCrest|ctx\.fillText|ctx\.strokeRect/);
});
test('Theme alters only the cloned website palette and preserves its real headers, crests and columns',()=>{
  assert.match(domSource,/root\.style\.setProperty\("--sheet-brand",theme\)/);
  assert.match(domSource,/root\.style\.setProperty\("--sheet-deep",shade\(theme,\.7\)\)/);
  assert.match(domSource,/const group=source\.cloneNode\(true\)/);
  assert.match(domSource,/No forced font sizes, no new columns, no replacement logos/);
  assert.doesNotMatch(domSource,/createElement\("table"\)|createElement\("thead"\)|createElement\("tbody"\)/);
  assert.doesNotMatch(domSource,/group\.querySelector\("h2\.odds-league-heading"\)\.replaceWith/);
  assert.match(domSource,/dateBar\.textContent=String\(date\|\|""\)/);
});
test('Team and league names stay on one line without rewriting the original text',()=>{
  assert.match(domSource,/title\.style\.setProperty\("white-space","nowrap","important"\)/);
  assert.match(domSource,/name\.style\.setProperty\("white-space","nowrap","important"\)/);
  assert.match(domSource,/const labels=\[\.\.\.pair\.querySelectorAll\("\.club-label"\)\]/);
  assert.match(domSource,/name\.scrollWidth>name\.clientWidth\+1/);
  assert.doesNotMatch(domSource,/innerHTML\s*=\s*['"]<table/);
});
test('PNG fits full visible table width without stretching/making a new table',()=>{
  assert.match(domSource,/const natural=Math\.max\(0,\.\.\.tables\.map/);
  assert.match(domSource,/return Math\.min\(1140,Math\.max\(970,natural,viewport\)\)/);
  assert.match(domSource,/const width=getTableWidth\(\)/);
  assert.match(domSource,/SCALE = 2/);
});
test('Capture errors never silently replace website table with a different layout',()=>{
  assert.match(domSource,/throw Error\("Website PNG Screenshot မအောင်မြင်ပါ/);
  assert.match(domSource,/timeout=setTimeout\(\(\)=>reject\(Error\(label\+" အချိန်ကြာလွန်းပါသည်"\)\),ms\)/);
  assert.doesNotMatch(domSource,/measured-website|table-fallback/);
});
test('All original frame banners remain unchanged and only surround the captured table',()=>{
  const {api}=setup();
  assert.equal(api.designs.length,16);
  assert.equal(new Set(api.designs.map(d=>d[0])).size,16);
  for(const d of api.designs.filter(d=>d[3])){
    assert.ok(fs.statSync(path.join(root,'assets/table-odds-frames',d[0]+'-frame.jpg')).size>1000);
    assert.ok(d[3].top+d[3].bottom<1);
  }
  assert.match(domSource,/ctx\.drawImage\(banner,0,0/);
  assert.match(domSource,/ctx\.drawImage\(banner,0,banner\.height\*\(1-bottomPart\)/);
  assert.match(domSource,/ctx\.drawImage\(shot\.picture,0,topH,W,shot\.height\)/);
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
  assert.match(html,/main-odds-dom-frame\.js\?v=20261019-dom-capture-v6/);
  assert.match(html,/main-table-odds-frames\.js\?v=20261019-dom-capture-v6/);
  assert.match(domSource,/document\.documentElement\.dataset\.footballBrandName/);
});


test('Main odds uses locally hosted HTML DOM screenshot with SVG capture as backup',()=>{
  const html=fs.readFileSync(path.join(root,'odds.html'),'utf8');
  const vendor=fs.readFileSync(path.join(root,'vendor/html2canvas.min.js'),'utf8');
  const license=fs.readFileSync(path.join(root,'vendor/LICENSE-html2canvas.txt'),'utf8');
  assert.ok(vendor.length>150000,'Library is bundled locally, not a fragile remote CDN');
  assert.match(vendor,/html2canvas 1\.4\.1/);
  assert.match(license,/MIT|Permission is hereby granted/);
  assert.ok(html.includes('./vendor/html2canvas.min.js?v=1.4.1'));
  assert.ok(html.indexOf('vendor/html2canvas.min.js')<html.indexOf('main-odds-dom-frame.js'));
  assert.match(html,/main-odds-dom-frame\.js\?v=20261019-dom-capture-v6/);
  assert.match(domSource,/window\.html2canvas\(root,/);
  assert.match(domSource,/useCORS:true/);
  assert.match(domSource,/window\.domtoimage\.toBlob\(root/);
  assert.match(domSource,/window\.FutureCodeOddsDomFrame\.lastCapture="html2canvas-website-dom"/);
  assert.match(domSource,/errors\.push\("HTML: "\+captureFailure\(error\)\)/);
  assert.match(domSource,/errors\.push\("SVG: "\+captureFailure\(error\)\)/);
  assert.doesNotMatch(domSource,/fallbackTable|measuredCapture|drawCrest/);
});
test('Actual HTML capture returns a PNG canvas without redrawing a new table',async()=>{
  const match={league:'Premier League',home:'အိမ်ရှင်',away:'ဧည့်သည်'};
  const removed=[],calls=[];
  function element(kind='div'){
    const node={
      kind,style:{setProperty(){}},children:[],className:'',
      scrollHeight:500,scrollWidth:960,textContent:'',
      getBoundingClientRect:()=>({width:960,height:500}),
      setAttribute(){},remove(){removed.push(kind);},
      appendChild(v){this.children.push(v);return v;},
      append(v){this.children.push(v);},
      querySelectorAll(selector){
        if(selector==='.odds-group')return this.children.filter(x=>x.isGroup);
        if(selector==='tbody tr')return this.rows||[];
        return [];
      },
      querySelector(){return null;},
      cloneNode(){const clone=element('group');clone.isGroup=true;clone.rows=[{remove(){}}];return clone;}
    };
    return node;
  }
  const source=element('source'),table=element('table');
  const document={
    documentElement:{dataset:{}},
    body:{appendChild(){}},
    fonts:{ready:Promise.resolve()},
    createElement:kind=>element(kind),
    querySelectorAll:selector=>selector==='#oddsList .odds-group'?[source]:
      selector==='#oddsList .odds-group .odds-table'?[table]:[],
    querySelector:selector=>selector==='#oddsList'?element('list'):null
  };
  const previewCanvas={width:1940,height:1000};
  const ctx={fillRect(){},drawImage(...args){calls.push(args);}};
  const kit={create:(width,height)=>({canvas:{width,height},ctx})};
  let browserCaptured=0,svgCaptured=0;
  const window={
    FutureCodeCanvasKit:kit,
    html2canvas:async(root,opts)=>{
      browserCaptured++;
      assert.equal(root.className,'odds-content fc-odds-direct-export');
      assert.equal(opts.scale,2);
      assert.equal(opts.useCORS,true);
      return previewCanvas;
    },
    domtoimage:{toBlob(){svgCaptured++;throw Error('Fallback should not run');}}
  };
  const context={window,document,location:{pathname:'/odds.html'},loadedSheet:{matches:[match]},
    requestAnimationFrame:fn=>fn(),setTimeout,clearTimeout,
    getComputedStyle:()=>({fontSize:'12px'}),Map,Set,Promise,URL,Image:class {},Error,console};
  vm.runInNewContext(domSource,context);
  const result=await window.FutureCodeOddsDomFrame.draw([match],{
    design:['colour','Colour Background Change','#a41625'],colour:'#196514',date:'2026-10-19'});
  assert.equal(browserCaptured,1);
  assert.equal(svgCaptured,0);
  assert.equal(window.FutureCodeOddsDomFrame.lastCapture,'html2canvas-website-dom');
  assert.equal(result.width,1940);
  assert.equal(result.height,1000);
  assert.equal(calls.length,1);
  assert.equal(calls[0][0],previewCanvas);
  assert.ok(removed.length>0,'temporary export DOM was cleaned up');
});

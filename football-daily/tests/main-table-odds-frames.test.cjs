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
  assert.equal(api.split(Array(19).fill({}),'all').length,1);
  assert.equal(api.split(Array(19).fill({}),'league').length,1);
  assert.equal(api.split(Array(19).fill({}),'two').length,2);
  assert.deepEqual(Array.from(api.split(Array(5).fill({}),'two'),part=>part.length),[3,2]);
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
  assert.doesNotMatch(domSource,/measuredCapture|fallbackTable|drawCrest/);
  assert.match(domSource,/ctx\.drawImage\(shot\.picture,x,y,cw,ch\)/);
});
test('Theme alters only the cloned website palette and preserves its real headers, crests and columns',()=>{
  assert.match(domSource,/root\.style\.setProperty\("--sheet-brand",theme\)/);
  assert.match(domSource,/root\.style\.setProperty\("--sheet-deep",shade\(theme,\.7\)\)/);
  assert.match(domSource,/const group=source\.cloneNode\(true\)/);
  assert.match(domSource,/Retain every original website cell, logo, caption and odds value/);
  assert.match(domSource,/body \.fc-odds-direct-export \.odds-matchup \.club-label/);
  assert.doesNotMatch(domSource,/createElement\("table"\)|createElement\("thead"\)|createElement\("tbody"\)/);
  assert.doesNotMatch(domSource,/group\.querySelector\("h2\.odds-league-heading"\)\.replaceWith/);
  assert.match(domSource,/dateBar\.textContent=String\(date\|\|""\)/);
});
test('Team and league names stay on one line without rewriting the original text',()=>{
  assert.match(domSource,/title\.style\.setProperty\("white-space","nowrap","important"\)/);
  assert.match(domSource,/name\.style\.setProperty\("white-space","nowrap","important"\)/);
  assert.match(domSource,/const labels=\[\.\.\.pair\.querySelectorAll\("\.club-label"\)\]/);
  assert.match(domSource,/name\.scrollWidth>name\.clientWidth\+1/);
  assert.match(domSource,/px>18/);
  assert.doesNotMatch(domSource,/name\.style\.setProperty\("white-space","normal"/);
  assert.match(domSource,/grid-template-columns","minmax\(0,1fr\) 47px 26px 47px minmax\(0,1fr\)"/);
  assert.match(domSource,/align-items","center","important"/);
  assert.doesNotMatch(domSource,/innerHTML\s*=\s*['"]<table/);
});
test('Export gives the match-up cell a tighter fixed width and keeps both badges compact',()=>{
  assert.match(domSource,/colgroup col:nth-child\(2\)\{width:31%!important\}/);
  assert.match(domSource,/colgroup col:nth-child\(1\)\{width:9%!important\}/);
  assert.match(domSource,/width:43px!important;height:43px!important;flex:0 0 43px!important/);
  assert.match(domSource,/overflow:hidden!important;overflow-wrap:normal!important;word-break:normal!important/);
  assert.match(domSource,/display:grid!important;\s*grid-template-columns:minmax\(0,1fr\) 47px 26px 47px minmax\(0,1fr\)!important/);
});
test('PNG fits full visible table width without stretching/making a new table',()=>{
  assert.match(domSource,/const EXPORT_WIDTH = 1280/);
  assert.match(domSource,/return EXPORT_WIDTH/);
  assert.match(domSource,/const width=getTableWidth\(\)/);
  assert.match(domSource,/SCALE = 2/);
});
test('Capture errors never silently replace website table with a different layout',()=>{
  assert.match(domSource,/throw Error\("Website PNG Screenshot မအောင်မြင်ပါ/);
  assert.match(domSource,/timeout=setTimeout\(\(\)=>reject\(Error\(label\+" အချိန်ကြာလွန်းပါသည်"\)\),ms\)/);
  assert.doesNotMatch(domSource,/measured-website|table-fallback/);
});
test('Named frames preserve their top/bottom banners around the website table',()=>{
  const {api}=setup();
  assert.equal(api.designs.length,16);
  assert.equal(new Set(api.designs.map(d=>d[0])).size,16);
  assert.match(domSource,/const theme=colourOnly\?settings\.colour:design\[2\]/);
  assert.match(domSource,/const shot=await captureWebsite\(rows,theme,settings\.date\)/);
  assert.match(domSource,/const W=2160/);
  assert.match(domSource,/const H=Math.max\(320,topH\+bottomH\+2\*pad\+tableH\)/);
  assert.doesNotMatch(domSource,/const W=2160,H=2160/);
  assert.match(domSource,/ctx\.drawImage\(shot\.picture,x,y,cw,ch\)/);
  assert.match(domSource,/ctx\.drawImage\(shot\.picture,x,y,cw,ch\)/);
  for(const d of api.designs.filter(d=>d[0]!=='colour')){
    const suffixes=d[3]?['-frame.jpg']:['-top.jpg','-bottom.jpg'];
    for(const suffix of suffixes)assert.ok(fs.statSync(path.join(root,'assets/table-odds-frames',d[0]+suffix)).size>1000);
  }
});
test('Preview image can use the full website table width for legibility',()=>{
  const source=fs.readFileSync(path.join(root,'main-table-odds-frames.js'),'utf8');
  assert.match(source,/max-width:1140px/);
});
test('One-click selected frame download supports both single PNG and two-page ZIP',()=>{
  assert.match(source,/archive=download&&parts\.length>1/);
  assert.match(source,/await archive\.add\(filename,blob\)/);
  assert.match(source,/a\.download=settings\.design\[0\]\+'-odds-table-'\+sheet\.reportDate\+'\.zip'/);
  assert.match(source,/document\.body\.appendChild\(a\);a\.click\(\)/);
  assert.match(source,/PNG Download လင့်ခ်ကို နှိပ်ပါ/);
  assert.match(source,/ပွဲအားလုံး Download · ပုံတစ်ပုံ/);
  assert.match(source,/လိဂ်ရွေးပြီး Download/);
  assert.match(source,/ပွဲအားလုံး · ၂ ပုံခွဲ Download/);
  assert.doesNotMatch(source,/1:1 Square|တစ်ပုံ ၃ ပွဲ|တစ်ပုံ ၂ ပွဲ|တစ်ပုံ ၁ ပွဲ/);
});
test('League download mode shows selectable leagues and filters PNG and ZIP rows',()=>{
  assert.match(source,/<option value=\"league\">လိဂ်ရွေးပြီး Download<\/option>/);
  assert.match(source,/<section id=\"tofLeaguePicker\" class=\"tof-league-picker\" hidden>/);
  assert.match(source,/input\.type='checkbox';input\.value=league;input\.checked=true/);
  assert.match(source,/el\('tofSplit'\)\.onchange=\(\)=>\{el\('tofLeaguePicker'\)\.hidden=el\('tofSplit'\)\.value!=='league'/);
  assert.match(source,/sheet\.matches\.filter\(m=>leagues\.has\(m\.league\)\)/);
  assert.match(source,/const list=rowsForMode\(sheet,mode\)/);
  assert.match(source,/const rows=rowsForMode\(sheet,mode\)/);
  assert.match(source,/tofLeagueAll/);
  assert.match(source,/tofLeagueNone/);
});
test('ZIP contains each frame twice for the two-image split',async()=>{
  const {api,calls}=setup();
  const rows=Array.from({length:19},(_,i)=>({league:'Premier League',home:'H'+i,away:'A'+i}));
  const statuses=[];
  const result=await api.zipFrames(rows,{date:'2026-10-19',colour:'#a41625',mode:'two'},p=>statuses.push(p));
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
  assert.equal(new Set(names.map(n=>n.split('/')[0])).size,1,'all frames share one folder');
  assert.ok(names.every(n=>n.split('/').length===2));
  assert.ok(names.includes('all-odds-frames-2026-10-19/bcf-odds-2026-10-19-01.png'));
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
  assert.match(html,/main-odds-dom-frame\.js\?v=20261019-league-picker-v7/);
  assert.match(html,/main-table-odds-frames\.js\?v=20261019-league-picker-v7/);
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
  assert.match(html,/main-odds-dom-frame\.js\?v=20261019-league-picker-v7/);
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
  const kit={create:(width,height)=>({canvas:{width,height},ctx:{fillRect(){},drawImage(...args){calls.push(args);},save(){},restore(){},strokeRect(){},fillText(){}}})};
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
    getComputedStyle:()=>({fontSize:'12px'}),Map,Set,Promise,URL,Image:class {constructor(){this.width=800;this.height=1024;}set src(value){this.url=value;this.onload();}},Error,console};
  vm.runInNewContext(domSource,context);
  const result=await window.FutureCodeOddsDomFrame.draw([match],{
    design:['colour','Colour Background Change','#a41625'],colour:'#196514',date:'2026-10-19'});
  assert.equal(browserCaptured,1);
  assert.equal(svgCaptured,0);
  assert.equal(window.FutureCodeOddsDomFrame.lastCapture,'html2canvas-website-dom');
  assert.equal(result.width,2160);
  assert.ok(result.height>900&&result.height<1200,'single PNG follows the table height');
  assert.equal(calls.length,1,'poster contains the original capture');
  assert.equal(calls[0][2],12,'top gap stays compact');
  assert.equal(result.height-(calls[0][2]+calls[0][4]),12,'bottom gap stays compact');
  assert.ok(removed.length>0,'temporary export DOM was cleaned up');
  const framed=await window.FutureCodeOddsDomFrame.draw([match],{
    design:['bcf','BCF','#073682',{top:0.0927734375,bottom:0.072265625}],date:'2026-10-19'});
  assert.equal(framed.width,2160);
  assert.ok(framed.height>1400&&framed.height<1700,'frame poster fits banners and table without a square canvas');
  assert.equal(calls.length,4,'square poster retains frame banners and the real table capture');
  assert.equal(calls[1][0].url,'./assets/table-odds-frames/bcf-frame.jpg');
  assert.equal(calls[2][0].url,'./assets/table-odds-frames/bcf-frame.jpg');
  assert.equal(calls[3][0],previewCanvas);
  assert.equal(calls[3][2],Math.round(0.0927734375*1024*2160/800)+12,'table sits just below its top frame');
  assert.equal(framed.height-(calls[3][2]+calls[3][4]),Math.round(0.072265625*1024*2160/800)+12,'table sits just above its bottom frame');

});

test('Main website uses bundled league logos and zero letter spacing for Myanmar shaping',()=>{
 const odds=fs.readFileSync(path.join(root,'odds.js'),'utf8');
 assert.match(odds,/if\(isMainOdds\)/);
 assert.match(odds,/assets\/league-logos\//);
 for(const id of ['eng.1','ita.1','esp.1','swe.1','den.1','por.1','esp.2','fra.2','tur.1','swe.2']){
   const bytes=fs.readFileSync(path.join(root,'assets/league-logos',id+'.png'));
   assert.equal(bytes.subarray(1,4).toString(),'PNG');
 }
 const html=fs.readFileSync(path.join(root,'odds.html'),'utf8');
 assert.match(html,/letter-spacing:0!important/);
});

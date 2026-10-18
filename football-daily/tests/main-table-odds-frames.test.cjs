'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'main-table-odds-frames.js'),'utf8');
const zipSource=fs.readFileSync(path.join(root,'frame-zip.js'),'utf8');
function setup(){const words=[],crests=[];const ctx={createLinearGradient:()=>({addColorStop(){}}),strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},drawImage(){}};const kit={fonts:async()=>{},preloadImages:async()=>{},create:(w,h)=>({canvas:{width:w,height:h,toBlob(cb){cb(new Blob([new Uint8Array([137,80,78,71,13,10,26,10])],{type:'image/png'}));}},ctx}),fill(){},crest:(...args)=>crests.push(args),text:(_c,s)=>words.push(String(s))};const window={FutureCodeCanvasKit:kit},document={documentElement:{dataset:{}},readyState:'loading',addEventListener(){}};const context={window,document,location:{pathname:'/odds.html'},Map,Set,Error,Blob,Uint8Array,Uint32Array,DataView,TextEncoder,Date,Image:class{constructor(){this.width=100;this.height=76}set src(v){this.onload()}}};vm.runInNewContext(zipSource,context);vm.runInNewContext(source,context);return {api:window.FutureCodeTableOddsFrames,words,crests};}
test('Table frame export balances odd/even counts and preserves every row',()=>{const {api}=setup();for(const n of [1,2,15,16,19]){const rows=Array.from({length:n},(_,i)=>({number:i}));const parts=api.split(rows,'two');assert.equal(parts.flat().length,n);assert.deepEqual(Array.from(parts.flat(),r=>r.number),rows.map(r=>r.number));assert.ok(parts.length===1||parts[0].length-parts[1].length<=1);}assert.equal(api.split(Array(19).fill({}),'auto')[0].length,10);assert.equal(api.split(Array(19).fill({}),'one').length,1);});
test('Framed table includes original/latest quotes and prediction with no Future Code branding',async()=>{const {api,words}=setup();const canvas=await api.draw([{league:'Premier League',home:'အိမ်ရှင်',away:'ဧည့်သည်',upperTeam:'ဧည့်သည်',kickoff:'19:30',bodyOdds:'1+15',currentBodyOdds:'1-10',goalTotalOdds:'3+95',currentGoalTotalOdds:'3+90',pdfLastColumn:'2-1'}],{design:['colour','Colour Background Change','#111111'],colour:'#b51a24',date:'2026-10-18'},1,1);assert.equal(canvas.width,1600);for(const s of ['အိမ်ရှင်','ဧည့်သည်','1+15','1-10','3+95','3+90','2-1','မူလ','ယခု'])assert.ok(words.includes(s),s);assert.ok(!words.some(s=>/future code/i.test(s)));});
test('Only main odds page includes table-frame download module',()=>{assert.match(fs.readFileSync(path.join(root,'odds.html'),'utf8'),/main-table-odds-frames\.js/);for(const brand of ['ykz-family','bw-sport','ko-thet-family'])assert.doesNotMatch(fs.readFileSync(path.join(root,brand,'odds.html'),'utf8'),/main-table-odds-frames\.js/);});
test('All uploaded frame artworks render with their own palettes and retained middle backgrounds',async()=>{const {api}=setup();assert.equal(api.designs.length,16);assert.equal(new Set(api.designs.map(d=>d[0])).size,16);for(const design of api.designs.filter(d=>d[3])){assert.ok(fs.statSync(path.join(root,'assets/table-odds-frames',design[0]+'-frame.jpg')).size>1000);assert.ok(design[3].top+design[3].bottom<1);const canvas=await api.draw([{league:'Premier League',home:'Home',away:'Away'}],{design,date:'2026-10-18'},1,1);assert.equal(canvas.width,1600);assert.ok(canvas.height>0);}});

test('Frame table supports source display times and readable crest fallbacks',async()=>{
 const {api,words,crests}=setup();
 await api.draw([{league:'Premier League',home:'Home Team',away:'Away Team',kickoffDisplay:'ည ၇:၃၀',upperTeam:'Home Team'}],{design:['colour','Colour Background Change','#111111'],colour:'#b51a24',date:'2026-10-18'},1,1);
 assert.ok(words.includes('ည ၇:၃၀'),'display-only kickoff must not disappear');
 const clubCrests=crests.filter(args=>args[4]===42);
 assert.equal(clubCrests.length,2);
 assert.ok(clubCrests.every(args=>args[6]!==true),'use dark fallback letters on white odds rows');
});
test('Two page frame download never automatically clicks multiple files',()=>{
 assert.match(source,/if\(parts\.length===1\)a\.click\(\)/);
 assert.match(source,/PNG Download ကို တစ်ပုံချင်း နှိပ်ယူပါ/);
});

test('Framed odds show only the date, without match counts or page fractions',async()=>{
 const {api,words}=setup();
 await api.draw([{league:'Premier League',home:'Home',away:'Away'}],{design:['colour','Colour Background Change','#111111'],colour:'#a41625',date:'2026-10-18'},1,2);
 assert.ok(words.includes('2026-10-18'),'date must remain visible');
 assert.ok(!words.some(s=>s.includes('2026-10-18 ·')||s.includes('19 ပွဲ')||s.includes('ပုံ 1/2')),'only date may be printed in the date heading');
});

test('One valid ZIP includes every frame and each balanced PNG exactly once',async()=>{
 const {api}=setup();
 const rows=Array.from({length:19},(_,i)=>({league:i<10?'Premier League':'La Liga',home:'Home'+i,away:'Away'+i,bodyOdds:'1+20',goalTotalOdds:'3+75'}));
 const statuses=[];
 const result=await api.zipFrames(rows,{date:'2026-10-18',colour:'#a41625',mode:'auto'},status=>statuses.push(status));
 assert.equal(api.designs.length,16);
 assert.equal(result.partCount,2);
 assert.equal(result.fileCount,32);
 assert.equal(result.blob.type,'application/zip');
 const bytes=Buffer.from(await result.blob.arrayBuffer());let pos=0;const names=[];
 while(pos+30<bytes.length&&bytes.readUInt32LE(pos)===0x04034b50){
  const len=bytes.readUInt16LE(pos+26),extra=bytes.readUInt16LE(pos+28),size=bytes.readUInt32LE(pos+18);
  names.push(bytes.subarray(pos+30,pos+30+len).toString('utf8'));
  pos+=30+len+extra+size;
 }
 assert.equal(names.length,32);
 assert.equal(new Set(names).size,names.length,'ZIP entries must have unique file names');
 for(const d of api.designs)for(let i=1;i<=2;i++)assert.ok(names.includes(d[0]+'/'+d[0]+'-odds-2026-10-18-'+String(i).padStart(2,'0')+'.png'),d[0]+':'+i);
 assert.equal(bytes.readUInt32LE(pos),0x02014b50,'valid central directory');
 assert.equal(bytes.readUInt32LE(bytes.length-22),0x06054b50,'valid ZIP end');
 assert.equal(bytes.readUInt16LE(bytes.length-12),32,'archive entry count');
 assert.equal(statuses.at(-1).finished,true);
});

test('Only Future Code main odds page loads ZIP utility and all-frames control',()=>{
 const html=fs.readFileSync(path.join(root,'odds.html'),'utf8');
 assert.ok(html.includes('frame-zip.js?v='),'ZIP utility must be on the main odds page');
 assert.ok(html.indexOf('frame-zip.js')<html.indexOf('main-table-odds-frames.js'));
 assert.ok(source.includes('id="tofZip"'));assert.ok(source.includes("el('tofZip').onclick=runAllZip"));
 for(const brand of ['ykz-family','bw-sport','ko-thet-family'])
  assert.ok(!fs.readFileSync(path.join(root,brand,'odds.html'),'utf8').includes('frame-zip.js')&&!fs.readFileSync(path.join(root,brand,'odds.html'),'utf8').includes('main-table-odds-frames.js'));
});

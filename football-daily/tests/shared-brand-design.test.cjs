'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const brands={
 'bw-sport':{name:'BW SPORT ဘောလုံးဂျာနယ်',colors:{primary:'#117cf4',electric:'#35bbff',silver:'#dceeff',navy:'#07162e',background:'#060f22',panel:'#0d2344'}},
 'ykz-family':{name:'YKZ FAMILY GROUP',colors:{primary:'#e00000',darkRed:'#960000',gold:'#ffcf58',background:'#111111',panel:'#202020'}},
 'ko-thet-family':{name:'Ko Thet Family ဘောလုံးဂျာနယ်',colors:{primary:'#8b0b11',darkRed:'#460005',gold:'#f8cf4b',background:'#13080c',panel:'#2c1417'}},
 'future-code-journal':{name:'ဂိုးဇုံ အားကစား ဂျာနယ်',colors:{primary:'#b58a35',electric:'#f0ce78',gold:'#e8bd62',background:'#090909',panel:'#181714'}}
};
for(const [id,config] of Object.entries(brands)){
 test(id+' preview downloads use the shared layout with the brand palette',async()=>{
  let received;
  const document={documentElement:{dataset:{footballBrandName:config.name}}};
  const window={FutureCodeBrandConfig:config,FutureCodeCanvasKit:{},FutureCodeFramePreview:{render:async(...args)=>(received=args,{width:1200,height:1664})}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'card-export.js'),'utf8'),{window,document});
  const match={home:'Home',away:'Away'};
  const result=await window.FutureCodeCardExport.save(match,{asCanvas:true,special:true});
  assert.equal(result.width,1200);
  assert.equal(received[0],match);
  assert.deepEqual(JSON.parse(JSON.stringify(received[1])),{
   bg:config.colors.background||config.colors.black,
   head:config.colors.darkRed||config.colors.navy||config.colors.primary,
   panel:config.colors.panel,alt:config.colors.primary||config.colors.gold,
   accent:config.colors.electric||config.colors.gold||config.colors.silver||config.colors.primary,
   gold:config.colors.gold||config.colors.electric||config.colors.silver||config.colors.primary
  });
  assert.equal(received[2].special,true);
 });
 test(id+' odds download uses shared website-table capture and no frame selection',async()=>{
  let received;
  const canvas={toBlob:cb=>cb(new Blob(['png'],{type:'image/png'}))};
  const document={documentElement:{dataset:{footballBrandName:config.name}}};
  const window={FutureCodeBrandConfig:{...config,id},FutureCodeCanvasKit:{day:()=> '2026-10-20'},FutureCodeOddsDomFrame:{draw:async(...args)=>(received=args,canvas)}};
  const context={window,document,location:{pathname:'/bw-sport/odds.html'},Blob,Promise,setTimeout,clearTimeout};
  vm.runInNewContext(fs.readFileSync(path.join(root,'daily-image-export.js'),'utf8'),context);
  const matches=[{league:'Premier League'}];
  const result=await window.FutureCodeDailyExport.saveOdds({matches,reportDate:'2026-10-20'},{asBlob:true});
  assert.equal(received[0],matches);
  assert.equal(received[1].colour,config.colors.primary||config.colors.gold);
  assert.equal(received[1].design[0],'colour');
  assert.match(result.filename,new RegExp('^'+id+'-odds-'));
  assert.equal(result.blob.type,'image/png');
 });
}
test('All mirror preview and odds pages load the shared renderers without frame studios',()=>{
 for(const id of Object.keys(brands)){
  const preview=fs.readFileSync(path.join(root,id,'index.html'),'utf8');
  const odds=fs.readFileSync(path.join(root,id,'odds.html'),'utf8');
  assert.match(preview,/frame-preview-renderer\.js/);
  assert.match(odds,/main-odds-dom-frame\.js/);
  assert.doesNotMatch(preview,/frame-studio|frame-selector|framePicker/i);
  assert.doesNotMatch(odds,/frame-studio|frame-selector|framePicker/i);
 }
});

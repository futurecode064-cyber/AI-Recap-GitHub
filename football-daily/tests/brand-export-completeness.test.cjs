'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const report=JSON.parse(fs.readFileSync(path.join(root,'data/archive/2026-10-19.json')));
const odds=JSON.parse(fs.readFileSync(path.join(root,'data/odds/2026-10-19.json')));
const brands={'bw-sport':'BW SPORT ဘောလုံးဂျာနယ်','ykz-family':'YKZ FAMILY GROUP','ko-thet-family':'Ko Thet Family ဘောလုံးဂျာနယ်','future-code-journal':'ဂိုးဇုံ အားကစား ဂျာနယ်'};
function harness(id,failOnce=false){
 let failed=false;
 const labels=[],logos=[],requested=[],images=[],canvases=[];
 const document={baseURI:'https://test.example/'+id+'/',fonts:{ready:Promise.resolve()},documentElement:{dataset:{footballBrandName:brands[id]}},
 createElement(type){
  if(type==='a')return {click(){},remove(){}};
  const canvas={width:0,height:0,toBlob(cb){cb(new Blob(['png'],{type:'image/png'}));}};
  const ctx={fillRect(){},beginPath(){},roundRect(){},fill(){},save(){},restore(){},clip(){},rect(){},scale(){},
    createLinearGradient(){return {addColorStop(){}}},createRadialGradient(){return {addColorStop(){}}},
    measureText(t){return {width:String(t).length*11}},fillText(t){labels.push(String(t))},drawImage(img){logos.push(img.url)}};
  canvas.getContext=()=>ctx;canvases.push(canvas);return canvas;
 },body:{appendChild(){}}};
 class Image{constructor(){this.naturalWidth=100;this.naturalHeight=100;images.push(this)}set src(url){this.url=url;requested.push(url);queueMicrotask(()=>{if(failOnce&&!failed){failed=true;this.onerror();}else this.onload();});}}
 const BrowserURL=URL;BrowserURL.createObjectURL=()=> 'blob:test';BrowserURL.revokeObjectURL=()=>{};
 const context={window:{FutureCodeBrandConfig:{id,name:brands[id]}},document,Image,URL:BrowserURL,Blob,queueMicrotask,setTimeout,clearTimeout,console,Promise};
 for(const file of ['brand-export-data.js','canvas-image-kit.js','card-export.js','daily-image-export.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context);
 return {...context,labels,logos,requested,images,canvases};
}
for(const [id,name] of Object.entries(brands)){
 test(name+' preview keeps both five-game strips, league crest, all prices and full article',async()=>{
  const x=harness(id),m=report.matches.find(m=>m.league==='Ligue 2');
  await x.window.FutureCodeCardExport.save(m,{asCanvas:true,brandName:name});
  const expected=[...m.homeLastFive,...m.awayLastFive].map(g=>x.window.FutureCodeBrandExportData.formResult(g));
  assert.deepEqual(x.labels.filter(l=>/^[WDL]$/.test(l)),expected);
  assert.ok(x.logos.some(u=>u.endsWith('/league-logos/fra.2.png')),'Ligue 2 crest drawn');
  for(const value of [m.home,m.away,m.homeOdds,m.drawOdds,m.awayOdds])assert.ok(x.labels.includes(String(value)),String(value));
  for(const value of [m.myanmarOdds.bodyOdds,m.myanmarOdds.goalTotalOdds])assert.ok(x.labels.some(l=>l.includes(value)));
  assert.ok(x.labels.join('').includes(m.dailyPreviewText.replace(/\*\*/g,'').split(' ').at(-1)),'article reaches final words');
  assert.equal(x.canvases.at(-1).width,1200,'existing width preserved');
 });
 test(name+' odds keeps all rows, morning/current prices, forecasts and every league crest',async()=>{
  const x=harness(id),rows=odds.matches.map((m,i)=>({...m,currentBodyOdds:'current-body-'+i,currentGoalTotalOdds:'current-goals-'+i}));
  await x.window.FutureCodeDailyExport.saveOdds({...odds,matches:rows},{asBlob:true});
  for(const m of rows){
   for(const value of [m.home,m.away,m.upperTeam,m.bodyOdds,m.goalTotalOdds,m.currentBodyOdds,m.currentGoalTotalOdds,m.pdfLastColumn])assert.ok(x.labels.join('').includes(String(value)),String(value));
  }
  for(const league of new Set(rows.map(m=>m.league))){
   const url=x.window.FutureCodeBrandExportData.leagueCrest(league);
   assert.ok(x.logos.includes(url),league+' crest is actually drawn');
   assert.ok(fs.existsSync(path.join(root,'assets/league-logos',url.split('/').at(-1))));
  }
 });
 test(name+' result PNG keeps every final score and league crest',async()=>{
  const x=harness(id),finals=[{...report.matches[0],status:'finished',finalScore:'2-1'},{...report.matches[1],status:'finished',finalScore:'0-0'}];
  await x.window.FutureCodeDailyExport.saveResults({matches:finals,date:report.reportDate});
  for(const m of finals){assert.ok(x.labels.includes(m.finalScore));assert.ok(x.logos.includes(x.window.FutureCodeBrandExportData.leagueCrest(m.league)));}
 });
}
test('Every brand page loads shared metadata and refreshed exporters',()=>{
 for(const id of Object.keys(brands))for(const page of ['index.html','odds.html']){
  const html=fs.readFileSync(path.join(root,id,page),'utf8');
  assert.match(html,/\.\.\/brand-export-data\.js\?v=[^\"]+/);
  assert.ok(html.indexOf('./brand.js')<html.indexOf('../canvas-image-kit.js'),'brand palette set before canvas module');
 }
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.ok(!html.includes('brand-export-data.js'),'main website does not load sub-brand metadata');
});
test('Every current and previous-day team crest is bundled, preserving logo URLs in match data',()=>{
 const x=harness('bw-sport'),previous=JSON.parse(fs.readFileSync(path.join(root,'data/archive/2026-10-18.json')));
 for(const m of [...report.matches,...odds.matches,...previous.matches])for(const key of ['homeCrestUrl','awayCrestUrl']){
  if(!m[key])continue;
  const url=x.window.FutureCodeBrandExportData.imageUrl(m[key]);
  assert.ok(url.startsWith('https://test.example/assets/brand-export-teams/'),m[key]);
  const file=path.join(root,new URL(url).pathname);
  assert.ok(fs.statSync(file).size>100);
 }
});

test('A failed crest request can be retried on the next export',async()=>{
 const x=harness('ykz-family',true),kit=x.window.FutureCodeCanvasKit,url='https://images.example/retry.png';
 await kit.preloadImages([url]);
 await kit.preloadImages([url]);
 kit.crest(x.canvases.length?x.canvases[0].getContext('2d'):x.document.createElement('canvas').getContext('2d'),url,0,0,40,'club');
 assert.equal(x.requested.filter(u=>u===url).length,2);
 assert.ok(x.logos.includes(url));
});
test('Goal Zone AI PNG retains the league crest, Myanmar name and model predictions',async()=>{
 const x=harness('future-code-journal');x.document.addEventListener=()=>{};
 x.window.FutureCodeAiScoreModel={predict:()=>['1-0','1-1','2-0']};
 vm.runInNewContext(fs.readFileSync(path.join(root,'future-code-journal/goal-zone-downloads.js'),'utf8'),x);
 const m=report.matches.find(m=>m.league==='Ligue 2');
 await x.window.GoalZoneDownloads.downloadAI(m,report.reportDate);
 assert.ok(x.logos.includes(x.window.FutureCodeBrandExportData.leagueCrest(m.league)));
 assert.ok(x.labels.includes('ပြင်သစ် လိဂ် ၂'));
 for(const score of ['1-0','1-1','2-0'])assert.ok(x.labels.includes(score));
});

test('Current-day leagues resolve to bundled logos on all sub-brands',()=>{
 const current=JSON.parse(fs.readFileSync(path.join(root,'data/today.json')));
 for(const id of Object.keys(brands)){
  const x=harness(id);
  for(const league of new Set(current.matches.map(m=>m.league))){
   const u=x.window.FutureCodeBrandExportData.leagueCrest(league);
   assert.ok(u.startsWith('https://test.example/assets/league-logos/'),league);
   assert.ok(fs.statSync(path.join(root,new URL(u).pathname)).size>100);
  }
 }
});

test('Current publication every team and competition crest is bundled for all six brands and main',()=>{
 const report=JSON.parse(read('data/today.json'));
 assert.match(report.reportDate,/^\\d{4}-\\d{2}-\\d{2}$/);
 const sheet=JSON.parse(read('data/odds/'+report.reportDate+'.json'));
 assert.equal(sheet.reportDate,report.reportDate);
 assert.ok(sheet.matches.length,'daily odds cannot be empty');
 function read(file){return fs.readFileSync(path.join(root,file),'utf8');}
 const configs=[...Object.keys(brands),'kmm-sport-hub','bet-city-family',''];
 for(const id of configs){
  const context={document:{baseURI:'https://test.example/'+(id?id+'/':''),documentElement:{dataset:id?{footballBrandName:id}:{}}},window:{},URL};
  vm.runInNewContext(read(id?'brand-export-data.js':'main-export-logos.js'),context);
  const mapper=context.window.FutureCodeBrandExportData||context.window.FutureCodeMainLogoAssets;
  const urls=sheet.matches.flatMap(m=>[m.homeCrestUrl,m.awayCrestUrl,mapper.leagueCrest(m.league)]);
  for(const url of urls){
   const local=mapper.imageUrl(url);assert.ok(local.startsWith('https://test.example/assets/'),id+' uses local crest '+url);
   const bytes=fs.readFileSync(path.join(root,new URL(local).pathname));
   assert.equal(bytes.subarray(1,4).toString(),'PNG',id+' valid PNG '+url);
   assert.ok(bytes.readUInt32BE(16)>15&&bytes.readUInt32BE(20)>15);
  }
 }
});

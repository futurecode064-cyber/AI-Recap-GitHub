'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const current=JSON.parse(read('data/today.json'));
const previous=JSON.parse(read('data/archive/2026-10-19.json'));
const odds=JSON.parse(read('data/odds/2026-10-20.json'));
function harness(){
 const painted=[],requested=[],window={};
 const document={baseURI:'https://test.example/',documentElement:{dataset:{}},fonts:{ready:Promise.resolve()},body:{appendChild(){}},
 createElement(kind){if(kind==='a')return {click(){},remove(){}};
 const canvas={width:0,height:0,toBlob(cb){cb(new Blob(['png']));}};
 const ctx={fillRect(){},beginPath(){},roundRect(){},fill(){},save(){},restore(){},rect(){},clip(){},scale(){},measureText(s){return {width:String(s).length*11}},fillText(){},createLinearGradient(){return {addColorStop(){}}},createRadialGradient(){return {addColorStop(){}}},drawImage(im){painted.push(im.srcValue)}};canvas.getContext=()=>ctx;return canvas;}};
 class Image{constructor(){this.naturalWidth=100;this.naturalHeight=100;}set src(value){this.srcValue=value;requested.push(value);queueMicrotask(()=>value.startsWith('https://test.example/assets/')?this.onload():this.onerror());}}
 const context={window,document,Image,URL,Blob,queueMicrotask,setTimeout,clearTimeout,console};
 for(const file of ['main-export-logos.js','canvas-image-kit.js','card-export.js','daily-image-export.js'])vm.runInNewContext(read(file),context);
 return {window,document,painted,requested};
}
test('Every current and previous-day team URL resolves to a real same-origin PNG',()=>{
 const x=harness(),resolve=x.window.FutureCodeMainLogoAssets.imageUrl;
 for(const match of [...current.matches,...previous.matches,...odds.matches])for(const key of ['homeCrestUrl','awayCrestUrl']){
  if(!match[key])continue;
  const url=resolve(match[key]);assert.ok(url.startsWith('https://test.example/assets/'),match[key]);
  const bytes=fs.readFileSync(path.join(root,new URL(url).pathname));assert.equal(bytes.subarray(1,4).toString(),'PNG');
 }
});
test('All current leagues, including UCL and both EFL divisions, have local badges',()=>{
 const x=harness();for(const league of new Set([...current.matches,...previous.matches,...odds.matches].map(m=>m.league))){
  const url=x.window.FutureCodeMainLogoAssets.leagueCrest(league);assert.ok(url.startsWith('https://test.example/assets/league-logos/'),league);assert.ok(fs.statSync(path.join(root,new URL(url).pathname)).size>100);
 }
});
test('Main transparent preview draws both team crests and the league crest with remote images unavailable',async()=>{
 const x=harness(),m=current.matches[0],resolve=x.window.FutureCodeMainLogoAssets.imageUrl;
 await x.window.FutureCodeCardExport.save(m,{mainScreenshot:true,asCanvas:true});
 for(const url of [m.homeCrestUrl,m.awayCrestUrl])assert.ok(x.painted.includes(resolve(url)),url);
 assert.ok(x.painted.includes(x.window.FutureCodeMainLogoAssets.leagueCrest(m.league)));
 assert.ok(x.requested.every(url=>url.startsWith('https://test.example/assets/')));
});
test('Main table PNG paints every league and team crest using local assets',async()=>{
 const x=harness(),assets=x.window.FutureCodeMainLogoAssets;
 await x.window.FutureCodeDailyExport.saveOdds(odds,{asBlob:true});
 for(const m of odds.matches){for(const url of [m.homeCrestUrl,m.awayCrestUrl])if(url)assert.ok(x.painted.includes(assets.imageUrl(url)),url);assert.ok(x.painted.includes(assets.leagueCrest(m.league)));}
});
test('Main-only loader is available before export modules and mirror pages do not load it',()=>{
 for(const file of ['index.html','odds.html']){const html=read(file);assert.ok(html.indexOf('main-export-logos.js')<html.indexOf('canvas-image-kit.js'));}
 for(const brand of ['bw-sport','ykz-family','ko-thet-family','future-code-journal'])for(const file of ['index.html','odds.html'])assert.ok(!read(brand+'/'+file).includes('main-export-logos.js'));
});

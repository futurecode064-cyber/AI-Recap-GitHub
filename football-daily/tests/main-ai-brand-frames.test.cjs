'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('AI frame dropdown is wired only to main homepage and to both PNG export paths',()=>{
 const html=read('index.html'),js=read('main-ai-score.js'),exporter=read('main-ai-bulk-export.js');
 for(const [id,name] of [['standard','မူရင်း AI ဇယား'],['best','Best Your Choice'],['final','Final Goal'],['special','Special One Group']]){
  assert.match(html,new RegExp('value="'+id+'"'));
  assert.ok(html.includes(name));
 }
 assert.match(js,/fcAiFrameStyle/);
 assert.match(js,/frame:document\.getElementById/);
 assert.match(js,/planPages\(\[match\]\)/);
 assert.match(exporter,/canvas=await brandCanvas\(canvas,opts\.frame\)/);
 for(const p of ['ykz-family/index.html','bw-sport/index.html','ko-thet-family/index.html'])assert.ok(!read(p).includes('fcAiFrameStyle'));
});
test('Branded AI poster artwork and matching palette stay entirely local',()=>{
 const js=read('main-ai-bulk-export.js');
 for(const file of ['best-top.jpg','best-bottom.jpg','final-goal-frame.jpg','special-one-frame.jpg']){
  assert.match(js,new RegExp(file.replace('.','\\.')));
  assert.ok(fs.statSync(path.join(root,'assets/table-odds-frames',file)).size>1000);
 }
 for(const color of ['#0715b5','#b88a17','#2b9aca'])assert.ok(js.includes(color));
 assert.match(js,/FutureCodeMainLogoAssets\?\.imageUrl\(url\)\|\|url/);
 assert.match(js,/const pic=url=>cache\.get\(safeHttps\(window\.FutureCodeMainLogoAssets\?\.imageUrl\(url\)\|\|url\)\)/);
});

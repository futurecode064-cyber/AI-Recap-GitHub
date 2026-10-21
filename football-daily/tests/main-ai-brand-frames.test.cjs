'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('Main AI frame options route to frame-aware PNG and ZIP paths',()=>{
 const html=read('index.html'),js=read('main-ai-score.js'),exporter=read('main-ai-bulk-export.js');
 for(const [id,name] of [['standard','မူရင်း AI ဇယား'],['best','Best Your Choice'],['final','Final Goal'],['special','Special One Group']]){
  assert.match(html,new RegExp('value="'+id+'"'));
  assert.ok(html.includes(name));
 }
 assert.match(js,/fcAiFrameStyle/);
 assert.match(js,/frame:document\.getElementById/);
 assert.match(js,/planPages\(\[match\]\)/);
 assert.match(exporter,/canvas=await brandCanvas\(canvas,opts\.frame,\{date,matchCount:page\.matchCount\}\)/);
 for(const p of ['ykz-family/index.html','bw-sport/index.html','ko-thet-family/index.html'])
  assert.ok(!read(p).includes('fcAiFrameStyle'));
});
test('All three user-supplied frame originals are intact local PNG assets, not odds frame substitutes',()=>{
 const js=read('main-ai-bulk-export.js');
 for(const [file,w,h] of [
  ['best-your-choice-upload.png',1200,1947],
  ['final-goal-upload.png',1200,1491],
  ['special-one-upload.png',1200,1393]
 ]){
  const buf=fs.readFileSync(path.join(root,'assets/ai-frames',file));
  assert.ok(buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),file);
  assert.equal(buf.readUInt32BE(16),w,file);
  assert.equal(buf.readUInt32BE(20),h,file);
  assert.ok(js.includes(file),file);
 }
 assert.match(js,/new URL\("\.\/assets\/ai-frames\/"/);
 assert.doesNotMatch(js,/table-odds-frames|final-goal-frame\.jpg|special-one-frame\.jpg/);
 assert.match(js,/ctx\.drawImage\(source,0,tableTop,WIDTH,tableSourceH,/);
 assert.match(js,/drawOriginalArtwork\(ctx,original,height,frame\)/);
 assert.match(js,/FutureCodeMainLogoAssets\?\.imageUrl\(url\)\|\|url/);
});

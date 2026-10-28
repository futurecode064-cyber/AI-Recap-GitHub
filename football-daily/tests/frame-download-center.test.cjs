'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(base,file),'utf8');

test('frame HTML deterministically loads workspace before PNG/ZIP exporter',()=>{
 const html=read('frame-editor.html');
 const first=html.indexOf('src="./frame-workspace.js?');
 const second=html.indexOf('src="./frame-export-engine.js?');
 assert.ok(first>0&&second>first,'ordered defer scripts required');
 for(const name of ['downPreview','downZip','sectionLayoutSettings','downFrame','downSection','downPreviewImage','downloadLink'])assert.match(html,new RegExp('id="'+name+'"'));
 assert.match(html,/VIP Internet · Bookies · AI Tips/);
});

test('all six sections keep independent layout settings and new pair selector',()=>{
 const src=read('frame-workspace.js');
 for(const k of ['odds','previews','specials','results','ai','news'])assert.match(src,new RegExp(k+':\\[\\['));
 for(const k of ['odds','results','ai'])assert.match(src,new RegExp(k+':\\[\\[[^\\n]+\\["pair","၂ ပွဲကို PNG တစ်ပုံ"\\]'));
 assert.match(src,/fc-frame-section-layout-v1/);
 assert.match(src,/state\.placements\[section\]/);
});

test('pair PNG is different from splitting all fixtures into only two PNGs',()=>{
 const source=read('frame-export-engine.js');
 assert.match(source,/const splitRows=\(rows,mode\)=>\{/);
 const injected=source.replace('async function stackCanvases','globalThis.__frameTestSplitRows=splitRows;\nasync function stackCanvases');
 const elements=new Map();
 const context={window:{},document:{getElementById:id=>{
  if(!elements.has(id))elements.set(id,{});
  return elements.get(id);
 }},console,Blob,URL,createImageBitmap:()=>{}};
 vm.runInNewContext(injected,context);
 const rows=Array.from({length:5},(_,i)=>({id:i,league:i<3?'A':'B'}));
 const f=context.__frameTestSplitRows;
 assert.deepEqual(Array.from(f(rows,'pair'),x=>Array.from(x,y=>y.id)),[[0,1],[2,3],[4]]);
 assert.deepEqual(Array.from(f(rows,'two'),x=>Array.from(x,y=>y.id)),[[0,1,2],[3,4]]);
 assert.deepEqual(Array.from(f(rows,'one'),x=>Array.from(x,y=>y.id)),[[0,1,2,3,4]]);
 assert.deepEqual(Array.from(f(rows,'league'),x=>Array.from(x,y=>y.id)),[[0,1,2],[3,4]]);
 assert.equal(typeof elements.get('downPreview').onclick,'function');
 assert.equal(typeof elements.get('downZip').onclick,'function');
});

test('current tip engine preserves independent labels and never invents missing VIP',async()=>{
 const api=require('../main-tip-scores.js');
 assert.deepEqual(api.labels,['VIP Internet','Bookies','AI Tips']);
 const match={fixtureId:'fc-20261028-01',home:'Manchester City',away:'Brighton & Hove Albion',homeOdds:'1.65',drawOdds:'4.10',awayOdds:'4.30',myanmarOdds:{upperTeam:'မန်စီးတီး',goalTotalOdds:'3-35',bodyOdds:'1+40'}};
 assert.equal(api.predict(match)[0],'—');
 assert.match(api.bookie(match),/^\d+-\d+$/);
 assert.equal(api.bookie({...match,drawOdds:''}),'—');
 await api.load('2026-10-28',async()=>({ok:true,json:async()=>({reportDate:'2026-10-28',items:[{fixtureId:match.fixtureId,home:match.home,away:match.away,score:'2-1',sourceUrl:'https://footballpredictions.com/example',sourceDate:'2026-10-26',sourceName:'Example'}]})}));
 assert.equal(api.predict(match)[0],'2-1');
 assert.equal(api.predict({...match,away:'Different Team'})[0],'—');
});

test('daily master prompt references are all installed and owner instructions take priority',()=>{
 const agent=read('AGENTS.md');
 for(const p of ['DAILY_ONE_SHOT_V6_2026-10-27.md','MYANMAR_MATCH_PREVIEW_MASTER.md','DAILY_FOOTBALL_NEWS_TOP10.md','DAILY_TIPS_POLICY.md']) assert.ok(agent.includes(p),p);
 for(const p of ['docs/master-prompts/DAILY_ONE_SHOT_V6_2026-10-27.md','docs/master-prompts/MYANMAR_MATCH_PREVIEW_MASTER.md','docs/master-prompts/DAILY_FOOTBALL_NEWS_TOP10.md'])assert.ok(fs.statSync(path.join(base,p)).size>1000,p);
});

test('filter changes invalidate stale preview imagery before next section can show results',()=>{
 const source=read('frame-workspace.js'),engine=read('frame-export-engine.js');
 assert.match(source,/function clearExportPreview\(\)/);
 assert.match(source,/preview\.removeAttribute\("src"\);preview\.hidden=true/);
 assert.match(source,/\$\("downFrame"\)\.onchange=clearExportPreview/);
 assert.match(source,/\$\("matchFilter"\)\.onchange=clearExportPreview/);
 assert.match(engine,/studio\.clearExportPreview\(\)/);
});

test('all current source cup competitions resolve to a real league logo',()=>{
 const logos=read('main-export-logos.js'),odds=read('odds.js');
 for(const league of ['EFL Cup','DFB-Pokal','Copa del Rey']){
  assert.ok(logos.includes('"'+league+'"'),league);
  assert.ok(odds.includes('"'+league+'"'),league);
 }
 assert.match(read('frame-editor.html'),/frame-workspace\.js\?v=20261028-pair-layout-v5/);
});

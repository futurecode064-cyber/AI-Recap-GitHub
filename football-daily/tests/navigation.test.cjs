const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
function setup(branded=false){
 const elements=new Map(),requests=[];
 function element(tag='div'){
  const classes=new Set();
  return {tagName:tag,textContent:'',children:[],attrs:{},dataset:{},
    classList:{toggle(name,force){if(force)classes.add(name);else classes.delete(name)},add(name){classes.add(name)},contains(name){return classes.has(name)}},
    appendChild(n){this.children.push(n);return n},replaceChildren(...items){this.children=items},
    setAttribute(k,v){this.attrs[k]=v},addEventListener(){},
    querySelectorAll(){return this.children.filter(x=>x.tagName==='button')}
  };
 }
 const document={baseURI:'https://example.com/'+(branded?'myanmar-football/':''),documentElement:{dataset:branded?{footballDataUrl:'../data/today.json'}:{}},getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)},createElement:element,addEventListener(){}};
 const context=vm.createContext({document,Intl,Date,URL,AbortController,setTimeout,clearTimeout,console,fetch(url){return new Promise((resolve,reject)=>requests.push({url,resolve,reject}))}});
 vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),context);
 return {run:code=>vm.runInContext(code,context),requests,elements};
}
function ok(reportDate,extras={}){return {ok:true,status:200,json:async()=>({reportDate,published:true,matches:[],...extras})}}
test('branded page resolves yesterday archive and today shared data',async()=>{
 const s=setup(true);
 for(const [day,fragment] of [[-1,/^\/data\/archive\/\d{4}-\d{2}-\d{2}\.json$/],[0,/^\/data\/today\.json$/]]){
  const pending=s.run(`selectedDay=${day};load()`),req=s.requests.at(-1);
  assert.match(new URL(req.url).pathname,fragment);
  req.resolve(ok(s.run('selectedDateKey()')));await pending;
 }
});
test('only competitions represented in the selected date report are visible',async()=>{
 const s=setup(),pending=s.run('load()');
 s.requests[0].resolve(ok(s.run('selectedDateKey()'),{matches:[
  {home:'A',away:'B',league:'English FA Cup'},
  {home:'C',away:'D',league:'UEFA Nations League'},
  {home:'E',away:'F',league:'English FA Cup'}
 ]}));await pending;
 const names=s.elements.get('filters').children.map(x=>x.dataset.league);
 assert.deepEqual(names,['all','FA Cup','UEFA Nations League']);
 assert.equal(names.includes('Premier League'),false);
});
test('special choice filter is hidden unless an actual selected-date choice exists',async()=>{
 const s=setup(),pending=s.run('load()');
 s.requests[0].resolve(ok(s.run('selectedDateKey()'),{matches:[
   {home:'A',away:'B',league:'Serie B',specialChoice:true}
 ]}));await pending;
 assert.deepEqual(s.elements.get('filters').children.map(x=>x.dataset.league),['all','Serie B','special']);
});
test('late rejected request cannot overwrite newer successful selection',async()=>{
 const s=setup(),old=s.run('load()'),next=s.run('selectedDay=-1;load()');
 s.requests[1].resolve(ok(s.run('selectedDateKey()')));await next;
 s.requests[0].reject(Error('old request failed'));await old;
 assert.equal(s.elements.get('statusText').textContent,'ရလဒ်မရရှိသေး');
});
test('latest refresh wins even for the same date',async()=>{
 const s=setup(),a=s.run('load()'),b=s.run('load()');
 s.requests[1].resolve(ok(s.run('selectedDateKey()')));await b;
 s.requests[0].resolve({ok:false,status:500});await a;
 assert.equal(s.elements.get('statusText').textContent,'ထုတ်ဝေပြီး');
});
test('unpublished and stale reports do not leak matches',async()=>{
 for(const extras of [{published:false},{reportDate:'2000-01-01'}]){
  const s=setup(),pending=s.run('load()');
  s.requests[0].resolve(ok(s.run('selectedDateKey()'),{matches:[{home:'A',away:'B'}],...extras}));
  // When a report is unpublished/stale, the site checks a separate fixture-only snapshot.
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(s.requests.length,2);
  s.requests[1].resolve({ok:false,status:404});
  await pending;
  assert.equal(s.run('report.matches.length'),0);
 }
});
test('malformed report recovers to retryable error',async()=>{
 const s=setup(),pending=s.run('load()');s.requests[0].resolve(ok(s.run('selectedDateKey()'),{matches:[null]}));await pending;
 assert.equal(s.elements.get('statusText').textContent,'ချိတ်ဆက်မှု မအောင်မြင်');
 assert.equal(s.elements.get('matchList').attrs['aria-busy'],'false');
});
test('both entry pages contain navigation targets and both export modules',()=>{
 for(const file of ['index.html','myanmar-football/index.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  for(const id of ['dateTabs','dateYesterday','dateToday','reportHeading','reportPill'])assert.ok(html.includes(`id="${id}"`),`${file}: ${id}`);
  assert.equal(html.includes('data-day="1"'),false);
  for(const script of ['card-export.js','social-export.js','app.js'])assert.ok(html.includes(script));
 }
});

test('daily PDF odds page keeps all 17 user supplied entries and nine eligible previews',()=>{
 const sheet=JSON.parse(fs.readFileSync(path.join(root,'data/odds/2026-10-12.json'),'utf8'));
 const today=JSON.parse(fs.readFileSync(path.join(root,'data/today.json'),'utf8'));
 assert.equal(sheet.reportDate,'2026-10-12');
 assert.equal(sheet.matches.length,17);
 assert.equal(sheet.matches.filter(x=>x.eligibleForPreview).length,9);
 assert.equal(today.matches.length,9);
 assert.equal(today.matches.filter(x=>x.homeDisplay&&x.awayDisplay).length,9);
 for(const m of today.matches){
  const quote=sheet.matches.find(x=>x.home===m.homeDisplay&&x.away===m.awayDisplay);
  assert.ok(quote,'No PDF odds fixture found for '+m.homeDisplay);
  assert.equal(m.myanmarOdds.bodyOdds,quote.bodyOdds);
  assert.equal(m.myanmarOdds.goalTotalOdds,quote.goalTotalOdds);
  assert.equal(m.dailyPreviewText.split('**').length,5);
 }
});
test('odds page and its browser script are linked from both football entry pages',()=>{
 assert.ok(fs.existsSync(path.join(root,'odds.html')));
 assert.ok(fs.existsSync(path.join(root,'odds.js')));
 for(const file of ['index.html','myanmar-football/index.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  assert.ok(html.includes('odds.html'),file);
 }
});

test('every featured match has correctly linked home/away crests and native Burmese labels',()=>{
 const today=JSON.parse(fs.readFileSync(path.join(root,'data/today.json'),'utf8'));
 for(const m of today.matches){
  assert.ok(m.homeDisplay && m.awayDisplay,'Burmese team label missing: '+m.home);
  assert.match(m.homeCrestUrl||'',/^https:\/\//,'Missing home crest '+m.home);
  assert.match(m.awayCrestUrl||'',/^https:\/\//,'Missing away crest '+m.away);
  for(const g of m.headToHead||[]){
   assert.ok(g.homeCrestUrl && g.awayCrestUrl,'H2H crests missing '+m.home+' / '+m.away);
  }
 }
});
test('odds sheet clearly labels internet predictions and morning Myanmar market openings',()=>{
 const html=fs.readFileSync(path.join(root,'odds.html'),'utf8');
 const js=fs.readFileSync(path.join(root,'odds.js'),'utf8');
 assert.ok(html.includes('အာရှ စျေးကွက် မြန်မာကြေး မနက်ပိုင်း ဖွင့်လှစ်မှုများ'));
 assert.ok(!html.includes('မူရင်းစာရင်း၏ နောက်ဆုံးကော်လံကို'));
 assert.ok(js.includes('အင်တာနက်ခန့်မှန်းချက်'));
 assert.ok(js.includes('homeCrestUrl') && js.includes('awayCrestUrl'));
 assert.ok(js.includes('odds-matchup'));
});
test('form and H2H sections use record-level verified opponent logos',()=>{
 const js=fs.readFileSync(path.join(root,'app.js'),'utf8');
 assert.ok(js.includes('item.opponentCrestUrl'));
 assert.ok(js.includes('g.homeCrestUrl'));
 assert.ok(js.includes('g.awayCrestUrl'));
});

test('all nine published previews contain complete single-provider sourced 1X2 decimal prices',()=>{
 const today=JSON.parse(fs.readFileSync(path.join(root,'data/today.json'),'utf8'));
 assert.equal(today.reportDate,'2026-10-12');assert.equal(today.matches.length,9);
 for(const m of today.matches){
  for(const key of ['homeOdds','drawOdds','awayOdds']){
   assert.ok(Number(m[key])>1,'Missing real 1X2 '+key+' for '+m.home);
  }
  assert.ok(m.oddsProvider && /^https:\/\//.test(m.oddsSourceUrl),'Odds not attributable to bookmaker '+m.home);
  assert.equal(m.oddsMarket,'Full-time 1X2');
  assert.equal(m.oddsIsLive,false);
  assert.ok(m.myanmarOdds.bodyOdds && m.myanmarOdds.goalTotalOdds,'Original Myanmar odds were lost');
 }
 const js=fs.readFileSync(path.join(root,'app.js'),'utf8');
 assert.ok(js.includes('oddBox(teamLabel(match,"home")+" နိုင် (1)"'));
 assert.ok(js.includes('oddBox(teamLabel(match,"away")+" နိုင် (2)"'));
});

test('navigation has three equally grouped Yesterday/Today/Odds boxes in both entry pages',()=>{
 for(const filename of ['index.html','myanmar-football/index.html']){
  const html=fs.readFileSync(path.join(root,filename),'utf8');
  const from=html.indexOf('<nav class="date-tabs"');
  const to=html.indexOf('</nav>',from);
  const nav=html.slice(from,to);
  assert.equal((nav.match(/data-day=/g)||[]).length,2);
  assert.ok(nav.includes('date-tab-odds'),filename);
  assert.ok(nav.includes('odds.html'),filename);
  assert.ok(!html.includes('odds-feature-link'),filename);
  assert.ok(html.includes('id="resultsPngBtn"'),filename);
  assert.ok(html.includes('daily-image-export.js'),filename);
 }
});
test('mobile odds shows all four columns without horizontal table scrolling',()=>{
 const html=fs.readFileSync(path.join(root,'odds.html'),'utf8');
 assert.ok(html.includes('id="oddsPngBtn"'));
 assert.ok(html.includes('daily-image-export.js'));
 assert.match(html,/\.odds-table\{min-width:0;width:100%;display:block/);
 assert.ok(html.includes('grid-template-columns:repeat(4,minmax(0,1fr))'));
 assert.match(html,/\.odds-table thead\{display:none\}/);
});
test('three-box history and H2H layout preserves all three datasets',()=>{
 const js=fs.readFileSync(path.join(root,'app.js'),'utf8');
 const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
 assert.ok(js.includes('const split=node("div","form-three-grid")'));
 assert.ok(js.includes('append(split,homeForm,h2h,awayForm)'));
 assert.ok(css.includes('.form-three-grid{display:grid;grid-template-columns:repeat(3'));
 assert.ok(css.includes('.form-three-grid{grid-template-columns:1fr}'));
});
test('Canvas exporter includes all odds entries and only confirmed results',()=>{
 const js=fs.readFileSync(path.join(root,'daily-image-export.js'),'utf8');
 assert.ok(js.includes('async function saveOdds(data)'));
 assert.ok(js.includes('async function saveResults({matches,date})'));
 assert.ok(js.includes('matches.filter(verified)'));
 assert.ok(js.includes('m.status==="finished"'));
 assert.ok(js.includes('window.FutureCodeDailyExport={saveOdds,saveResults}'));
 const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
 const odds=fs.readFileSync(path.join(root,'odds.js'),'utf8');
 assert.ok(app.includes('window.FutureCodeDailyExport.saveResults'));
 assert.ok(odds.includes('window.FutureCodeDailyExport.saveOdds'));
});

test('Native Canvas renderer is loaded ahead of download exporters',()=>{
 const kit=fs.readFileSync(path.join(root,'canvas-image-kit.js'),'utf8');
 assert.ok(kit.includes('window.FutureCodeCanvasKit'));
 assert.ok(kit.includes('preloadImages'));
 assert.ok(kit.includes('950'));
 for(const file of ['index.html','myanmar-football/index.html','odds.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  const a=html.indexOf('canvas-image-kit.js');
  const b=html.indexOf('daily-image-export.js');
  assert.ok(a>0&&b>a,'Canvas script must load before export scripts in '+file);
  assert.equal(html.includes('dom-capture.js'),false);
 }
});

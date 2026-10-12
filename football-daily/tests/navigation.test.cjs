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
    classList:{toggle(name,force){if(force)classes.add(name);else classes.delete(name)},contains(name){return classes.has(name)}},
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

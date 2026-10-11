const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
function setup(branded=false){
 const elements=new Map(),requests=[];
 function element(){return {textContent:'',children:[],attrs:{},appendChild(n){this.children.push(n)},replaceChildren(){this.children=[]},setAttribute(k,v){this.attrs[k]=v}}}
 const document={baseURI:'https://example.com/'+(branded?'myanmar-football/':''),documentElement:{dataset:branded?{footballDataUrl:'../data/today.json'}:{}},getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)},createElement:element,addEventListener(){}};
 const context=vm.createContext({document,Intl,Date,URL,AbortController,setTimeout,clearTimeout,console,fetch(url){return new Promise((resolve,reject)=>requests.push({url,resolve,reject}))}});
 vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),context);
 return {run:code=>vm.runInContext(code,context),requests,elements};
}
function ok(reportDate,extras={}){return {ok:true,status:200,json:async()=>({reportDate,published:true,matches:[],...extras})}}
test('branded page resolves archives and upcoming from shared data directory',async()=>{
 const s=setup(true);
 for(const [day,folder] of [[-1,'archive'],[1,'upcoming']]){
  const pending=s.run(`selectedDay=${day};load()`),req=s.requests.at(-1);
  assert.match(new URL(req.url).pathname,new RegExp('^/data/'+folder+'/\\d{4}-\\d{2}-\\d{2}\\.json$'));
  req.resolve(ok(s.run('selectedDateKey()')));await pending;
 }
});
test('late rejected request cannot overwrite newer successful selection',async()=>{
 const s=setup(),old=s.run('load()'),next=s.run('selectedDay=1;load()');
 s.requests[1].resolve(ok(s.run('selectedDateKey()')));await next;
 s.requests[0].reject(Error('old request failed'));await old;
 assert.equal(s.elements.get('statusText').textContent,'ထုတ်ဝေပြီး');
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
  s.requests[0].resolve(ok(s.run('selectedDateKey()'),{matches:[{home:'A',away:'B'}],...extras}));await pending;
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
  for(const id of ['dateTabs','dateYesterday','dateToday','dateTomorrow','reportHeading','reportPill'])assert.ok(html.includes(`id="${id}"`),`${file}: ${id}`);
  for(const script of ['card-export.js','social-export.js','app.js'])assert.ok(html.includes(script));
 }
});

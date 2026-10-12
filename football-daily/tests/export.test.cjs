const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'daily-image-export.js'),'utf8');
const cardSource=fs.readFileSync(path.join(root,'card-export.js'),'utf8');
const sheet=JSON.parse(fs.readFileSync(path.join(root,'data/odds/2026-10-12.json'),'utf8'));
class Node{
 constructor(tag='div'){this.tag=tag;this.children=[];this.className='';this.style={};this.textContent='';this.parentNode=null;}
 appendChild(el){this.children.push(el);el.parentNode=this;return el}
 remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(e=>e!==this)}
 cloneNode(deep){const n=new Node(this.tag);n.className=this.className;n.textContent=this.textContent;
  if(deep)this.children.forEach(c=>n.appendChild(c.cloneNode(true)));return n}
 querySelectorAll(selector){
  const result=[];const search=(node)=>{
   for(const c of node.children){
    if(selector==='.odds-group'&&c.className==='odds-group')result.push(c);
    if(selector==='.odds-table tbody tr'&&c.tag==='tr')result.push(c);
    search(c);
   }
  };search(this);return result;
 }
}
function harness(){
 const capture=[],live=new Node();
 const leagues=[...new Set(sheet.matches.map(m=>m.league))];
 for(const league of leagues){
  const group=new Node();group.className='odds-group';group.textContent=league;
  for(const m of sheet.matches.filter(x=>x.league===league)){
   const row=new Node('tr');row.textContent=[m.home,m.away,m.bodyOdds,m.goalTotalOdds,m.pdfLastColumn].join('|');
   group.appendChild(row);
  }
  live.appendChild(group);
 }
 const body=new Node();
 const document={body,getElementById(id){return id==='oddsList'?live:null},
  createElement(tag){return new Node(tag)}};
 const window={FutureCodeDomCapture:{
  async save(node,filename,options){capture.push({node,filename,options});return true},
  appendHeading(node,title,subtitle){const h=new Node('h2');h.textContent=title;node.appendChild(h);
   const p=new Node('p');p.textContent=subtitle;node.appendChild(p)}
 }};
 const context=vm.createContext({window,document,console});
 vm.runInContext(source,context);
 return {exporter:window.FutureCodeDailyExport,capture,live,body};
}
test('odds image is an exact cloned DOM table with all 17 fixtures and unchanged original prices',async()=>{
 const h=harness();
 await h.exporter.saveOdds(sheet);
 assert.equal(h.capture.length,1);
 assert.equal(h.capture[0].filename,'future-code-odds-2026-10-12.png');
 assert.equal(h.capture[0].options.width,1180);
 const snapshot=h.capture[0].node;
 assert.equal(snapshot.querySelectorAll('.odds-group').length,[...new Set(sheet.matches.map(m=>m.league))].length);
 const rows=snapshot.querySelectorAll('.odds-table tbody tr');
 assert.equal(rows.length,17);
 for(const m of sheet.matches){
  const text=rows.map(r=>r.textContent).join('\n');
  assert.ok(text.includes(m.home+'|'+m.away+'|'+m.bodyOdds+'|'+m.goalTotalOdds+'|'+m.pdfLastColumn),'Missing odds row '+m.number);
 }
 assert.ok(snapshot.children[0].children.some(c=>c.textContent==='ယနေ့ ပေါက်ကြေးများ'));
 assert.equal(h.body.children.length,0,'offscreen capture stage not cleaned up');
});
test('results export only clones true finished results through the existing website renderer',async()=>{
 const h=harness();
 await assert.rejects(()=>h.exporter.saveResults({date:'2026-10-11',matches:[
  {home:'Bad prediction',away:'Team',finalScore:'2-0',status:'scheduled'}
 ],renderResult:m=>new Node('article')}),/ရလဒ်များ မရှိသေးပါ/);
 const matches=[
  {home:'Home',away:'Away',status:'finished',finalScore:'2-1'},
  {home:'Guess',away:'Prediction',status:'scheduled',finalScore:'9-9'},
  {home:'Incomplete',away:'No result',status:'finished',finalScore:'TBD'}
 ];
 const rendered=[];
 await h.exporter.saveResults({matches,date:'2026-10-11',renderResult:m=>{
  rendered.push(m.home);const node=new Node('article');node.className='match-card result-card';node.textContent=m.finalScore;return node;
 }});
 assert.equal(h.capture[0].filename,'football-goal-results-2026-10-11.png');
 assert.deepEqual(rendered,['Home']);
 assert.ok(h.capture[0].node.children[0].textContent==='ဂိုးရလဒ်များ');
 assert.equal(h.capture[0].node.children[2].children.length,1);
 assert.equal(h.capture[0].node.children[2].children[0].textContent,'2-1');
});
test('preview export passes real card DOM to screenshot helper; never reconstructs canvas rows',async()=>{
 const calls=[],node={classList:{contains:x=>x==='match-card'},getBoundingClientRect(){return {width:465}}};
 const window={FutureCodeDomCapture:{async save(...args){calls.push(args);return true}}};
 const context=vm.createContext({window});
 vm.runInContext(cardSource,context);
 await window.FutureCodeCardExport.save({home:'Burgos CF',away:'Granada'},{cardNode:node,brandName:'Future Code'});
 assert.equal(calls.length,1);
 assert.equal(calls[0][0],node);
 assert.equal(calls[0][2].width,465);
 assert.equal(calls[0][2].excludeControls,true);
 assert.match(calls[0][1],/burgos-cf-vs-granada.png$/);
});

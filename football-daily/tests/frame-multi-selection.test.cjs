'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=n=>fs.readFileSync(path.join(root,n),'utf8');
function element(tag){
 return {tag,children:[],dataset:{},style:{},value:"",checked:false,open:false,options:[],className:"",
  append(...xs){this.children.push(...xs)},replaceChildren(...xs){this.children=xs},
  add(option){this.options.push(option)},
  querySelectorAll(q){const found=[];function walk(x){for(const c of x.children||[]){if(q==='details[data-section]'&&c.tag==='details'&&c.dataset.section)found.push(c);
    if(q==='details[data-section][open]'&&c.tag==='details'&&c.dataset.section&&c.open)found.push(c);
    walk(c);}}walk(this);return found;}
 };
}
function fixture(id,league){return {fixtureId:id,home:id+' H',away:id+' A',league,leagueDisplay:league==='EFL Cup'?'အင်္ဂလန် ကာရာဘောင်းဖလား':'ဂျာမနီ ပိုကယ်ဖလား'};}
function harness(seed){
 const mount=element('div'),label=element('p');
 const byId={multiSelectionCenter:mount,multiSelectionSummary:label};
 const document={getElementById:id=>byId[id]||null,createElement:element,querySelector:()=>null};
 const types=['odds','oddsCards','previews','specials','results','ai','news'];
 const SECTION=Object.fromEntries(types.map(k=>[k,k]));
 const data=[fixture('a','EFL Cup'),fixture('b','DFB-Pokal'),fixture('c','EFL Cup')];
 const frames=[{id:'odds-bcf',name:'BCF',color:'#073682'},{id:'odds-best',name:'Best Your Choice',color:'#132ab0'}];
 const placements=Object.fromEntries(types.map(k=>[k,[]]));
 placements.odds=['odds-bcf','odds-best'];placements.oddsCards=['odds-bcf','odds-best'];
 const state={frames,placements},saved=[];
 const studio={TYPES:types,SECTION,getState:()=>state,getRows:k=>['odds','oddsCards'].includes(k)?data:[],
  getOdds:()=>({FutureCodeBurmeseRedOddsFrame:{leagueName:m=>m.league}}),
  clearExportPreview:()=>{},status:()=>{}};
 const localStorage={getItem:()=>JSON.stringify(seed),setItem:(k,v)=>saved.push(JSON.parse(v))};
 const window={FCStudio:studio};
 vm.runInNewContext(source('frame-multi-download.js'),{window,document,localStorage,console,Option:class{constructor(t,v){this.textContent=t;this.value=v;}},Event:class{constructor(name){this.type=name;}}});
 function walk(node,pred){if(pred(node))return node;for(const x of node.children||[]){const found=walk(x,pred);if(found)return found;}return null;}
 return {window,document,mount,saved,walk};
}
test('all seven sections render and are independent multi-select panels',()=>{
 const h=harness({});
 assert.equal(h.mount.querySelectorAll('details[data-section]').length,7);
 assert.equal(h.window.FCStudioMulti.plans().length,2,'card section defaults to both approved branded frames');
 assert.deepEqual(Array.from(h.window.FCStudioMulti.plans(),x=>x.section),['oddsCards','oddsCards']);
 const cards=h.walk(h.mount,n=>n.tag==='details'&&n.dataset.section==='oddsCards');
 assert.ok(cards.open,'new odds-card layout should be visible on first open');
 const odds=h.walk(h.mount,n=>n.tag==='details'&&n.dataset.section==='odds');
 odds.children[0].children[0].checked=true;odds.children[0].children[0].onchange();
 assert.equal(h.window.FCStudioMulti.plans().length,4,'independent sections can both be enabled');
});
test('frame, league and match filters intersect per section and preserve Burmese filenames',()=>{
 const h=harness({oddsCards:{enabled:true,frames:['odds-bcf','odds-best'],leagues:['EFL Cup'],matches:['a']}});
 assert.equal(h.window.FCStudioMulti.plans().length,2);
 for(const p of h.window.FCStudioMulti.plans()){
  assert.equal(p.section,'oddsCards');assert.deepEqual(Array.from(p.rows,m=>m.fixtureId),['a']);
 }
 const card=h.walk(h.mount,n=>n.tag==='details'&&n.dataset.section==='oddsCards');
 const input=h.walk(card,n=>n.tag==='input'&&n.value==='odds-best');
 assert.ok(input&&input.checked);
 input.checked=false;input.onchange();
 assert.deepEqual(Array.from(h.window.FCStudioMulti.plans(),x=>x.frame.id),['odds-bcf']);
 assert.equal(h.saved.at(-1).oddsCards.frames.length,1,'per-section selection saved');
});
test('all-section ZIP path and frame-derived Unicode filenames are enforced by exporter',()=>{
 const exporter=source('frame-export-engine.js'),workspace=source('frame-workspace.js'),html=source('frame-editor.html');
 assert.ok(exporter.includes('window.FCStudioMulti?.plans?.()'),'exporter must honor independent multi-section plans');
 assert.ok(exporter.includes('assignments[i].rows'),'each frame exports only the selected fixtures');
 assert.ok(exporter.includes('zip.add(folder+"/"+uniqueName'),'one folder per section');
 assert.ok(exporter.includes('f.downloadName||f.name'),'Unicode frame filename used');
 assert.ok(workspace.includes('getRows:rawData'),'real published per-section rows required');
 assert.ok(html.includes('frame-multi-download.js')&&html.includes('scopeAll')&&html.includes('scopeNone'));
 assert.equal((html.match(/value="oddsCards"/g)||[]).length,2);
});

test('real browser select is given exactly one Option at a time',()=>{
 const js=source('frame-multi-download.js');
 assert.ok(js.includes('sel.add(new Option("မူလကြေး","original"));sel.add(new Option("ယခုကြေး","current"))'));
 assert.doesNotMatch(js,/sel\.add\(new Option\([^)]*\),new Option/);
});

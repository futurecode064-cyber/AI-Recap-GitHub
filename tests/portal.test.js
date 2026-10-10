'use strict';
// Run actual portal controllers with deterministic DOM/auth fixtures (no paid APIs).
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..'),modules=JSON.parse(fs.readFileSync(path.join(ROOT,'training-app/assets/studio/modules.json')));
const allSections=[...new Set(modules.flatMap(m=>m.permissions))].map(section_key=>({section_key,enabled:true}));
class El{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.value='';this.textContent='';this.disabled=false;this.contentWindow={};this.contentDocument={title:'Future Code Studio',querySelector:()=>({})};this.classes=new Set();this.classList={add:(...x)=>x.forEach(y=>this.classes.add(y)),remove:(...x)=>x.forEach(y=>this.classes.delete(y)),contains:x=>this.classes.has(x),toggle:(x,yes)=>{if(yes===undefined)yes=!this.classes.has(x);yes?this.classes.add(x):this.classes.delete(x)}}}
 append(...x){for(const el of x){el.parent=this;this.children.push(el)}}
 replaceChildren(...x){this.children=[];this.append(...x)}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this)}
 querySelector(){return this.children[0]||new El('button')}
 setAttribute(n,v){this[n]=v}
}
const flush=async()=>{for(let i=0;i<5;i++)await new Promise(r=>setImmediate(r))};
async function portal(query='',sections=allSections){
 const html=fs.readFileSync(path.join(ROOT,'portal/student/index.html'),'utf8'),els={};for(const m of html.matchAll(/id="([^"]+)"/g))els[m[1]]=new El();
 const location=new URL('https://example.test/AI-Recap-GitHub/student/'+query),events={},session={token:'test-token',username:'fixture'},state={sections:structuredClone(sections),error:null,calls:0,cleared:0,loggedOut:0};
 const access={session:()=>session,clear(){session.token='';session.username='';state.cleared++},me:async()=>{state.calls++;if(state.error)throw state.error;return {username:'fixture',sections:state.sections,announcements:[]}},login:async()=>({username:'fixture',sections:state.sections}),logout:async()=>{state.loggedOut++;session.token='';session.username=''}};
 const history={pushState(s,t,u){location.href=new URL(u,location).href}};
 const c={document:{getElementById:id=>els[id],createElement:t=>new El(t),body:new El('body'),title:''},location,history,URL,URLSearchParams,console,setTimeout,clearTimeout,FCStudentAccess:access,indexedDB:{},crypto:{subtle:{}},isSecureContext:true,scrollTo(){},addEventListener:(n,f)=>{(events[n]??=[]).push(f)},fetch:async()=>({ok:true,json:async()=>modules})};c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(ROOT,'portal/student/app.js'),'utf8'),c);await flush();
 return {c,els,state,session,events,async open(id){const a=els.cards.children.find(x=>x.dataset.section===id);assert.ok(a,'missing card '+id);a.onclick({preventDefault(){}});await flush()},frame(){return els.frames.children.find(f=>!f.classList.contains('hidden'))},async message(route,extra={}){const frame=this.frame();for(const fn of events.message||[])fn({origin:location.origin,source:frame?.contentWindow,data:{type:'future-code-navigation',route,...extra}});await flush()}};
}
let total=0;async function test(name,f){await f();console.log('PASS '+name);total++}
async function main(){
 await test('All eight enabled sections open existing shared APK pages',async()=>{
  const p=await portal();assert.equal(p.els.cards.children.length,8);assert.equal(p.els.cards.children.at(-1).dataset.section,'lesson-videos');
  for(const m of modules){await p.open(m.id);const f=p.frame();assert.ok(f);assert.equal(f.src,'https://example.test/AI-Recap-GitHub/content/'+m.asset);assert.equal(p.c.FutureCodePortal.isContentAllowed(f.src),true);assert.ok(fs.existsSync(path.join(ROOT,'portal/content',m.asset.split('?')[0])));p.els.home.onclick();await flush()}
  assert.ok(p.state.calls>=9);
 });
 await test('Lessons, help and editor routes; back retains the previous studio',async()=>{
  const p=await portal();await p.open('future');await p.message('lessons');assert.ok(p.frame().src.endsWith('pro-video-guide.html'));p.els.back.onclick();await flush();assert.equal(p.frame().dataset.route,'future');
  p.els.home.onclick();await p.open('image-studio');const image=p.frame();image.fixtureBrief='unsaved brief';await p.message('help/image');assert.ok(p.frame().src.endsWith('studio-help.html?tool=image'));p.els.back.onclick();await flush();assert.equal(p.frame(),image);assert.equal(p.frame().fixtureBrief,'unsaved brief');
  p.els.home.onclick();await p.open('video-maker');await p.message('editor');assert.ok(p.frame().src.endsWith('media-editor.html?mode=edit'));const old=p.frame();p.els.back.onclick();await flush();await p.message('editor',{fresh:true});assert.notEqual(p.frame(),old);
 });
 await test('Direct lesson/editor links restore the intended route after session check',async()=>{
  for(const route of ['lessons','editor','recap','help/video']){const p=await portal('?section='+encodeURIComponent(route));assert.equal(p.frame().dataset.route,route);assert.equal(p.state.calls,1)}
 });
 await test('Combined permissions remove duplicate design, invoice and guide menu entries',async()=>{
  const p=await portal('',[{section_key:'guides',enabled:true},{section_key:'invoice',enabled:true}]);assert.deepEqual(p.els.cards.children.map(a=>a.dataset.section),['future','documents','lesson-videos']);await p.open('documents');assert.ok(p.frame().src.endsWith('document-studio.html'));
 });
 await test('Disabled sections and revoked permissions cannot open or remain loaded',async()=>{
  const p=await portal();await p.open('image-studio');p.state.sections=p.state.sections.map(s=>s.section_key==='image-studio'?{...s,enabled:false}:s);await p.message('help/image');assert.equal(p.frame(),undefined);assert.match(p.els.status.textContent,/Admin/);assert.ok(!p.els.frames.children.some(f=>f.dataset.route==='image-studio'));
  const denied=await portal('?section=image-studio',[{section_key:'future',enabled:true}]);assert.equal(denied.frame(),undefined);assert.match(denied.els.status.textContent,/Admin/);
 });
 await test('Untrusted frame messages and unknown routes are ignored',async()=>{
  const p=await portal();await p.open('future');const f=p.frame(),calls=p.state.calls;
  for(const fn of p.events.message){fn({origin:'https://other.test',source:f.contentWindow,data:{type:'future-code-navigation',route:'editor'}});fn({origin:p.c.location.origin,source:{},data:{type:'future-code-navigation',route:'editor'}})}
  await p.message('unknown');assert.equal(p.frame(),f);assert.equal(p.state.calls,calls);
 });
 await test('Network failures retain session and the unfinished studio',async()=>{
  const p=await portal();await p.open('video-maker');const f=p.frame();p.state.error=Error('Network offline');await p.message('editor');assert.equal(p.frame(),f);assert.equal(p.session.token,'test-token');assert.equal(p.state.cleared,0);assert.match(p.els.workspaceStatus.textContent,/Network offline/);p.state.error=null;await p.message('editor');assert.equal(p.frame().dataset.route,'editor');
 });
 await test('Navigation cannot interrupt an active generation or media export',async()=>{
  const p=await portal();await p.open('recap');const f=p.frame(),calls=p.state.calls;f.contentWindow.FCStudioBusy=()=>true;await p.message('help/recap');p.els.home.onclick();assert.equal(p.frame(),f);assert.equal(p.state.calls,calls);assert.match(p.els.workspaceStatus.textContent,/Cancel/);f.contentWindow.FCStudioBusy=()=>false;await p.message('help/recap');assert.equal(p.frame().dataset.route,'help/recap');
 });
 await test('Expired sessions remove all studio frames and require login',async()=>{
  const p=await portal();await p.open('recap');p.state.error=Object.assign(Error('Session expired'),{status:401});await p.message('help/recap');assert.equal(p.els.frames.children.length,0);assert.equal(p.session.token,'');assert.equal(p.els.loginPanel.classList.contains('hidden'),false);
 });
 await test('Logout clears local state and revokes the backend session',async()=>{
  const p=await portal();await p.open('recap');p.els.home.onclick();await p.els.logout.onclick();assert.equal(p.state.loggedOut,1);assert.equal(p.session.token,'');assert.equal(p.els.frames.children.length,0);
 });
 await test('Internal lesson hash reload stays inside its authenticated frame',async()=>{
  const p=await portal();await p.open('future');assert.equal(p.c.FutureCodePortal.isContentAllowed(p.frame().src+'#prompts'),true);assert.equal(p.c.FutureCodePortal.isContentAllowed('https://other.test/academy-advanced.html'),false);
 });
 await test('Shared navigation dispatches browser routes and native printing',async()=>{
  const code=fs.readFileSync(path.join(ROOT,'training-app/assets/studio/navigation.js'),'utf8'),messages=[];
  const c={location:new URL('https://example.test/AI-Recap-GitHub/content/sections/video-maker.html'),document:{addEventListener(){}},URL,URLSearchParams};c.window=c;c.parent={FutureCodePortal:{isContentAllowed:()=>true},postMessage:(m,o)=>messages.push({m,o})};vm.createContext(c);vm.runInContext(code,c);c.FCNav.open('editor',{fresh:true});assert.equal(messages[0].m.route,'editor');assert.equal(messages[0].m.fresh,true);assert.equal(messages[0].o,'https://example.test');c.FCNav.open('https://other.test');assert.equal(messages.length,1);
  let printed=0;const n={location:{hostname:'appassets.futurecode.local',href:''},FutureCodeNative:{printPage:()=>printed++},document:{addEventListener(){}}};n.window=n;vm.createContext(n);vm.runInContext(code,n);n.FCNav.open('lessons');assert.equal(n.location.href,'app://lessons');n.print();assert.equal(printed,1);
 });
 console.log(`All ${total} portal routing/access regression groups passed. Browser rendering and Android device acceptance remain separate checks.`);
}
main().catch(e=>{console.error(e);process.exitCode=1});

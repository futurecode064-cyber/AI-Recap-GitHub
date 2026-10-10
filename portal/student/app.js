'use strict';
(()=>{
 const $=id=>document.getElementById(id),access=FCStudentAccess,contentBase=new URL('../content/',location.href);
 let modules=[],data=null,verified=false,active='home',currentAsset='',busy=false,sequence=0;
 const frames=new Map();
 function canLeave(){try{if(frames.get(active)?.contentWindow?.FCStudioBusy?.()){status('လုပ်ဆောင်မှု ပြီးအောင် စောင့်ပါ။ ရပ်ချင်လျှင် Studio ရဲ့ Cancel ကို နှိပ်ပါ။',true);return false}}catch{}return true}
 function pauseMedia(f){try{for(const media of f?.contentDocument?.querySelectorAll?.('video,audio')||[])media.pause()}catch{}}
 function status(text,bad=false){$('status').textContent=text;$('status').classList.toggle('error',bad);$('workspaceStatus').textContent=active==='home'?'':text}
 function view(logged){$('loginPanel').classList.toggle('hidden',logged);$('dashboard').classList.toggle('hidden',!logged)}
 function permissions(){return new Set((data?.sections||[]).filter(s=>s.enabled).map(s=>s.section_key))}
 function canOpen(module){const enabled=permissions();return !!module&&module.permissions.some(key=>enabled.has(key))}
 function routeInfo(route){
  const module=modules.find(m=>m.id===route);if(module)return {...module,route};
  if(route==='lessons'){const m=modules.find(m=>m.id==='future');return m&&{...m,asset:'sections/pro-video-guide.html',title:'သင်ခန်းစာများ',route,parent:'future'}}
  if(route==='editor'){const enabled=permissions(),parent=enabled.has('video-maker')?'video-maker':'recap',m=modules.find(m=>m.id===parent);return m&&{...m,asset:'sections/media-editor.html?mode=edit',title:'Video Editor',route,parent}}
  const tool=/^help\/(image|video|recap)$/.exec(route)?.[1];
  if(tool){const parent={image:'image-studio',video:'video-maker',recap:'recap'}[tool],m=modules.find(m=>m.id===parent);return m&&{...m,asset:'sections/studio-help.html?tool='+tool,title:'အသုံးပြုနည်း',route,parent}}
  return null;
 }
 window.FutureCodePortal={isContentAllowed(url){
  if(!verified||!data)return false;
  try{const target=new URL(url);target.hash='';return [...frames.values()].some(f=>f.src===target.href&&canOpen(routeInfo(f.dataset.route)))}catch{return false}
 }};
 async function loadModules(){
  const r=await fetch(new URL('studio/modules.json',contentBase),{cache:'no-cache'});if(!r.ok)throw Error('Section စာရင်း ဖွင့်မရပါ။ Reload လုပ်ပါ။');
  modules=await r.json();if(!Array.isArray(modules)||modules.length!==8||new Set(modules.map(m=>m.id)).size!==8)throw Error('Section စာရင်း မမှန်ပါ။');
 }
 function render(result){
  data=result;verified=true;$('welcome').textContent='မင်္ဂလာပါ · '+(result.username||access.session().username);
  $('cards').replaceChildren();let total=0;
  for(const m of modules){if(!canOpen(m))continue;total++;const a=document.createElement('a');a.className='tile';a.href='?section='+encodeURIComponent(m.id);a.dataset.section=m.id;
   for(const [tag,text,cls] of [['span',m.icon,'emoji'],['strong',m.title,''],['p',m.description,''],['span','ဖွင့်မည် →','open-label']]){const n=document.createElement(tag);n.textContent=text;n.className=cls;a.append(n)}
   a.onclick=e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();navigate(m.id)};$('cards').append(a);
  }
  $('noSections').classList.toggle('hidden',total!==0);$('announcements').replaceChildren();
  for(const x of result.announcements||[]){const p=document.createElement('p');p.textContent=x.content;$('announcements').append(p)}
  if(!(result.announcements||[]).length)$('announcements').textContent='ကြေညာချက်မရှိသေးပါ။';view(true);
  for(const [route,f] of frames){if(!canOpen(routeInfo(route))){f.remove();frames.delete(route)}}
 }
 function destroyFrames(){for(const f of frames.values())f.remove();frames.clear();currentAsset=''}
 function setHome(push=true,force=false){
  if(!force&&!canLeave())return;
  sequence++;active='home';currentAsset='';for(const f of frames.values()){pauseMedia(f);f.classList.add('hidden')}
  $('workspace').classList.add('hidden');$('portal').classList.remove('hidden');document.body.classList.remove('in-workspace');document.title='Future Code · Student Portal';
  if(push)history.pushState({section:'home'},'',new URL('./',location.href));window.scrollTo(0,0);
 }
 function display(route,push=true){
  if(route==='home'){setHome(push);return true}
  const info=routeInfo(route);if(!info||!canOpen(info)){setHome(push,true);status('ဒီ Section ကို Admin က ပိတ်ထားပါတယ်။',true);return false}
  active=route;currentAsset=info.asset;$('sectionTitle').textContent=info.title;document.title=info.title+' · Future Code';
  $('portal').classList.add('hidden');$('workspace').classList.remove('hidden');document.body.classList.add('in-workspace');$('workspaceStatus').textContent='';
  for(const f of frames.values()){if(f.dataset.route!==route)pauseMedia(f);f.classList.add('hidden')}
  let f=frames.get(route);
  if(!f){
   f=document.createElement('iframe');f.title=info.title;f.dataset.route=route;f.allow='clipboard-write; autoplay; fullscreen';f.referrerPolicy='strict-origin-when-cross-origin';
   f.src=new URL(info.asset,contentBase).href;frames.set(route,f);$('frames').append(f);
   f.onload=()=>{
    try{const d=f.contentDocument;if(!d?.querySelector('body')||/404|Page not found/i.test(d.title)){$('workspaceStatus').textContent='စာမျက်နှာ မရပါ။ ပင်မသို့ ပြန်ပြီး ပြန်စမ်းပါ။'}else if(active===route)$('workspaceStatus').textContent=''}catch{$('workspaceStatus').textContent='စာမျက်နှာ ပြန်ဖွင့်ရန် ပင်မသို့ ပြန်ပါ။'}
   };
  }
  f.classList.remove('hidden');
  if(push)history.pushState({section:route},'','?section='+encodeURIComponent(route));
  return true;
 }
 function requestedRoute(){return new URLSearchParams(location.search).get('section')||'home'}
 function signedOut(message='Student Login ဝင်ပါ။'){
  sequence++;verified=false;data=null;destroyFrames();setHome(false,true);access.clear();view(false);status(message,true);$('retry').classList.add('hidden');
 }
 function handleError(e){
  if(e.status===401||e.status===403){signedOut(e.message+' Login ပြန်ဝင်ပါ။');return}
  // Network errors must not discard a valid token or an unfinished project.
  status(e.message||'အင်တာနက် ချိတ်ဆက်မှု စစ်ပြီး ပြန်စမ်းပါ။',true);$('retry').classList.remove('hidden');
 }
 async function navigate(route,push=true){
  if(!canLeave())return;
  if(route==='home'){setHome(push);return}
  const request=++sequence;
  status('Section ခွင့်ပြုချက် စစ်နေပါတယ်…');
  try{const result=await access.me();if(request!==sequence)return;render(result);if(display(route,push))status('');$('retry').classList.add('hidden')}
  catch(e){if(request===sequence)handleError(e)}
 }
 async function restore(){
  if(busy)return;busy=true;$('retry').disabled=true;const request=++sequence;
  try{await loadModules();if(!access.session().token){view(false);return}status('အကောင့် ပြန်စစ်နေပါတယ်…');const result=await access.me();if(request!==sequence)return;render(result);if(display(requestedRoute(),false))status('');$('retry').classList.add('hidden')}
  catch(e){if(request===sequence)handleError(e)}finally{busy=false;$('retry').disabled=false}
 }
 $('loginForm').onsubmit=async e=>{
  e.preventDefault();if(busy)return;busy=true;const b=e.submitter;b.disabled=true;
  try{if(!modules.length)await loadModules();status('အကောင့်နှင့် Device လုံခြုံရေး စစ်နေပါတယ်…');const result=await access.login($('user').value,$('pass').value);$('pass').value='';render(result);if(display(requestedRoute(),false))status(active==='home'?'✓ Student Login အောင်မြင်ပါပြီ':'');$('retry').classList.add('hidden')}
  catch(e){status(e.message,true)}finally{busy=false;b.disabled=false}
 };
 $('logout').onclick=async()=>{if(!canLeave())return;const task=access.logout();signedOut('Logout ပြီးပါပြီ။');await task};
 $('home').onclick=()=>setHome();$('back').onclick=()=>{const info=routeInfo(active);if(info?.parent)navigate(info.parent);else setHome()};
 $('retry').onclick=restore;$('refresh').onclick=restore;
 window.addEventListener('popstate',()=>{if(!canLeave()){history.replaceState({section:active},'','?section='+encodeURIComponent(active));return}const route=requestedRoute();if(route==='home')setHome(false);else if(verified)navigate(route,false)});
 window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.data?.type!=='future-code-navigation')return;
  const f=frames.get(active);if(!f||e.source!==f.contentWindow)return;
  const route=e.data.route;if(route==='home'||routeInfo(route)){
   if(e.data.fresh===true&&route==='editor'){const old=frames.get(route);if(old){old.remove();frames.delete(route)}}
   navigate(route);
  }
 });
 window.addEventListener('pageshow',e=>{if(e.persisted&&access.session().token)restore()});
 if(!window.isSecureContext||!window.crypto?.subtle||!window.indexedDB){status('Chrome / Edge / Safari မှာ HTTPS link ကို ဖွင့်ပါ။ Secure Device Storage လိုပါတယ်။',true);$('loginForm').querySelector('button').disabled=true}
 else restore();
})();

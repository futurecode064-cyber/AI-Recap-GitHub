/* Shared opt-in reader. Does not replace window.fetch. */
(function(root,factory){
 "use strict";
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(!root?.document)return;
 const assetRoot=new URL('.',root.document.currentScript.src);
 const brands={'future-code-journal':'goal-zone','bw-sport':'bw-sport','ykz-family':'ykz','ko-thet-family':'ko-thet'};
 const relative=root.location.pathname.slice(assetRoot.pathname.length).split('/')[0];
 let storage=null;try{storage=root.localStorage;}catch{}
 const client=api.createClient({config:root.FC_FOOTBALL_ENGINE||{},assetRoot:assetRoot.href,pageUrl:root.location.href,
  brand:brands[relative]||'main',fetcher:root.fetch.bind(root),storage,onState:state=>{
   if(!state.stale&&!state.draft)return;
   const show=()=>{
    let note=root.document.getElementById('footballDataNotice');
    if(!note){note=root.document.createElement('p');note.id='footballDataNotice';note.setAttribute('role','status');
     note.style.cssText='margin:0;padding:12px 16px;background:#332914;color:#fff2c4;font-size:13px;line-height:1.8';root.document.body.prepend(note);}
    note.textContent=state.draft?(state.error?'Draft ဖွင့်မရပါ။ Owner login နှင့် Version ကို စစ်ဆေးပါ။':'OWNER DRAFT PREVIEW — မထုတ်ဝေရသေးသော Version '+state.version):state.fallback?'ချိတ်ဆက်မှု မရသဖြင့် Website တွင် သိမ်းထားသော ဒေတာကို ပြသနေသည်။ ရက်စွဲကို စစ်ဆေးပါ။':
     'ချိတ်ဆက်မှု မရသဖြင့် နောက်ဆုံးသိမ်းထားသော ဒေတာကို ပြသနေသည်။ သိမ်းချိန် — '+state.fetchedAt;
   };
   if(root.document.body)show();else root.document.addEventListener('DOMContentLoaded',show,{once:true});
  }});
 root.FootballData=Object.freeze(client);client.ready();
})(typeof window==='undefined'?null:window,function(){
 'use strict';
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const jsonResponse=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8',...headers}});
 function dayKey(now=new Date(),offset=0){const d=new Date(now.getTime()+390*60000);d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10);}
 async function loadPublishedBundle({apiBase,paths,optionalPaths=[],brand='main',fetcher=fetch,storage=null,timeoutMs=10000}){
  let key;const optional=new Set(optionalPaths),all=[...new Set([...paths,...optionalPaths])].sort();
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
   const base=new URL(apiBase);
   if(base.protocol!=='https:'&&!(base.protocol==='http:'&&base.hostname==='localhost'))throw Error('HTTPS API required');
   key='fc-football-last-complete-bundle-v3:'+JSON.stringify([base.origin,brand,all]);
   const mr=await fetcher(new URL('/api/football/manifest',base),{cache:'no-store',signal:controller.signal});
   if(!mr.ok)throw Error('Manifest unavailable');
   const manifest=await mr.json();if(typeof manifest.version!=='string'||!manifest.version)throw Error('No active version');
   const values=await Promise.all(all.map(async path=>{
    const url=new URL('/api/football/resource',base);url.searchParams.set('path',path);url.searchParams.set('version',manifest.version);url.searchParams.set('brand',brand);
    const r=await fetcher(url,{signal:controller.signal});
    if(r.status===404&&optional.has(path))return [path,null];
    if(!r.ok||r.headers.get('X-Football-Version')!==manifest.version)throw Error('Incomplete publication bundle');
    return [path,await r.json()];
   }));
   const bundle={version:manifest.version,publishedAt:manifest.publishedAt,fetchedAt:new Date().toISOString(),
    resources:Object.fromEntries(values.filter(([,v])=>v!==null)),missing:values.filter(([,v])=>v===null).map(([p])=>p),stale:false};
   try{storage?.setItem(key,JSON.stringify(bundle));}catch{}
   return bundle;
  }catch{
   try{const prior=key?JSON.parse(storage?.getItem(key)||'null'):null;
    if(prior?.version&&paths.every(p=>own(prior.resources||{},p))&&all.every(p=>own(prior.resources||{},p)||optional.has(p)&&prior.missing?.includes(p)))
     return {...prior,stale:true,error:'API unavailable; showing saved publication'};
   }catch{}
   return {fallback:'static',stale:true,error:'API unavailable; keep existing static data'};
  }finally{clearTimeout(timer);controller.abort();}
 }
 function createClient({config={},assetRoot,pageUrl,brand='main',fetcher=fetch,storage=null,onState=()=>{},now=new Date()}){
  const base=new URL(assetRoot),page=new URL(pageUrl);
  const draft=page.searchParams.get('fcDraft');
  const previewDate=page.searchParams.get('date'),clock=draft&&/^\d{4}-\d{2}-\d{2}$/.test(previewDate||'')?new Date(previewDate+'T06:00:00Z'):now;
  const today=dayKey(clock),yesterday=dayKey(clock,-1);
  async function privateDraft(){
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),config.timeoutMs||10000);
   try{
    if(!/^[a-f0-9-]{36}$/.test(draft))throw Error('Invalid draft version');
    const paths=['data/today.json',...optionalPaths];
    const values=await Promise.all(paths.map(async path=>{
     const url=new URL('api/editor/engine/resource',base);url.searchParams.set('version',draft);url.searchParams.set('path',path);
     const r=await fetcher(url,{credentials:'same-origin',cache:'no-store',signal:controller.signal});
     if(r.status===404&&path!=='data/today.json')return [path,null];
     if(!r.ok||r.headers.get('X-Football-Version')!==draft)throw Error('Owner draft unavailable');return [path,await r.json()];
    }));
    const resources=Object.fromEntries(values.filter(([,value])=>value!==null));
    return {draft:true,version:draft,resources,stale:false};
   }catch{return {draft:true,stale:true,error:'Owner draft unavailable',resources:{}};}finally{clearTimeout(timer);controller.abort();}
  }
  const query=page.searchParams.get('date'),oddsDay=/^\d{4}-\d{2}-\d{2}$/.test(query||'')?query:today;
  const optionalPaths=[`data/archive/${yesterday}.json`,`data/fixtures/${today}.json`,`data/fixtures/${yesterday}.json`,
   `data/odds/${oddsDay}.json`,`data/odds/evening/${oddsDay}.json`];
  if(oddsDay!==today)optionalPaths.push(`data/odds/${today}.json`,`data/odds/evening/${today}.json`);
  if(['main','goal-zone'].includes(brand))optionalPaths.push('data/news/latest.json');
  let pending;
  const ready=()=>pending||(pending=(draft?privateDraft():config.enabled===true?
   loadPublishedBundle({apiBase:config.apiBase,paths:['data/today.json'],optionalPaths,brand,fetcher,storage,timeoutMs:config.timeoutMs||10000}):
   Promise.resolve({fallback:'static',stale:false})).then(state=>{onState(state);return state;}));
  return {draftDate:draft&&/^\d{4}-\d{2}-\d{2}$/.test(previewDate||'')?previewDate:null,ready,async fetch(input,init){
   const url=new URL(typeof Request!=='undefined'&&input instanceof Request?input.url:String(input),page);
   const path=url.pathname.startsWith(base.pathname)?url.pathname.slice(base.pathname.length):'';
   if(url.origin!==base.origin||!/^data\/(?:today\.json|(?:archive|fixtures|odds|odds\/evening)\/\d{4}-\d{2}-\d{2}\.json|news\/latest\.json)$/.test(path))return fetcher(input,init);
   const state=await ready();if(state.fallback)return fetcher(input,init);
   if(state.draft&&state.error)return jsonResponse({error:state.error},503);
   if(init?.signal?.aborted)throw new DOMException('Aborted','AbortError');
   if(!own(state.resources,path))return jsonResponse({error:'Resource absent from page publication'},404);
   return jsonResponse(state.resources[path],200,{'X-Football-Version':state.version,'Cache-Control':'no-store'});
  }};
 }
 return {loadPublishedBundle,createClient,dayKey};
});

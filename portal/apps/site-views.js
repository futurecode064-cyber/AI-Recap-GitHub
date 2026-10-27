'use strict';
/* Anonymous site views and optional per-product APK views/download clicks.
   A click is not a verified install. No IP or phone number is collected. */
(() => {
 const current=document.currentScript,site=current?.dataset.siteKey,app=current?.dataset.appKey;
 if(!site)return;
 const id=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():null;
 let visitor=null;
 try {
  visitor=localStorage.getItem('fc_apps_browser_id');
  if(!visitor){visitor=id();if(visitor)localStorage.setItem('fc_apps_browser_id',visitor);}
 }catch(_){}
 function record(kind,appKey){
  const eventId=id();if(!eventId)return;
  try {
   fetch('https://mxwervqihaqlxybghdak.supabase.co/rest/v1/rpc/fc_record_portfolio_event',{
    method:'POST',mode:'cors',keepalive:true,
    headers:{apikey:'sb_publishable_JBcF0nEMbcFSSf7OlCCqmQ_lC1DEM0A','Content-Type':'application/json'},
    body:JSON.stringify({p_event_id:eventId,p_event_kind:kind,p_app_key:appKey,p_browser_id:visitor,p_site_key:site})
   }).catch(()=>{});
  }catch(_){}
 }
 record('site_view',null);
 if(!app)return;
 record('page_view',null);
 record('app_view',app);
 document.addEventListener('click',event=>{
  const link=event.target?.closest?.('a[href]');
  if(!link)return;
  try {
   if(new URL(link.href,location.href).pathname.toLowerCase().endsWith('.apk'))record('download_click',app);
  }catch(_){}
 },{passive:true});
})();
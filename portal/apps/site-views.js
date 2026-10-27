'use strict';
/* Anonymous site page-view tracking. Counts page loads, not unique people. */
(() => {
 const current=document.currentScript,site=current?.dataset.siteKey;
 if(!site)return;
 const id=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():null;
 const eventId=id();if(!eventId)return;
 let visitor=null;
 try {
  visitor=localStorage.getItem('fc_apps_browser_id');
  if(!visitor){visitor=id();if(visitor)localStorage.setItem('fc_apps_browser_id',visitor);}
 }catch(_){}
 try {
  fetch('https://mxwervqihaqlxybghdak.supabase.co/rest/v1/rpc/fc_record_portfolio_event',{
   method:'POST',mode:'cors',keepalive:true,
   headers:{apikey:'sb_publishable_JBcF0nEMbcFSSf7OlCCqmQ_lC1DEM0A','Content-Type':'application/json'},
   body:JSON.stringify({p_event_id:eventId,p_event_kind:'site_view',p_app_key:null,p_browser_id:visitor,p_site_key:site})
  }).catch(()=>{});
 }catch(_){}
})();

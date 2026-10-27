'use strict';
/* Future Code portfolio: page opens, APK detail views and download button clicks.
   A click is not a verified install. No IP or phone number is collected. */
(() => {
 const current=document.currentScript;
 const site=current?.dataset.siteKey,app=current?.dataset.appKey;
 const viewType=current?.dataset.viewType==='website'?'website':'apk';
 const websites=new Set(['football-main','goal-zone','bw-sport','ykz-family','ko-thet-family',
   'kmm-sport-hub','bet-city-family','english-academy-web']);
 const apkSites=new Set(['goal-zone','bw-sport','ykz-family','ko-thet-family','kmm-sport-hub','bet-city-family']);
 if(viewType==='website' ? !websites.has(site) : (!apkSites.has(site)||app!==site))return;
 const base='https://mxwervqihaqlxybghdak.supabase.co/rest/v1/rpc/fc_record_portfolio_event';
 const key='sb_publishable_JBcF0nEMbcFSSf7OlCCqmQ_lC1DEM0A';
 const id=()=>typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function'?crypto.randomUUID():null;
 let browser=null;
 try {
   browser=localStorage.getItem('fc_football_apk_visitor_id');
   if(!browser){browser=id();if(browser)localStorage.setItem('fc_football_apk_visitor_id',browser);}
 }catch(_){}
 function record(kind,appKey) {
  const eventId=id();if(!eventId)return;
  try {
   fetch(base,{method:'POST',mode:'cors',keepalive:true,
     headers:{apikey:key,'Content-Type':'application/json'},
     body:JSON.stringify({p_event_id:eventId,p_event_kind:kind,p_app_key:appKey,
       p_browser_id:browser,p_site_key:site})
   }).catch(()=>{});
  }catch(_){}
 }
 if(viewType==='website'){
  record('site_view',null);
  if(app && site==='english-academy-web' && app==='english-academy'){
   record('page_view',null);record('app_view',app);
   document.addEventListener('click',event=>{
    const link=event.target?.closest?.('a[href]');
    if(!link)return;
    try{if(new URL(link.href,location.href).pathname.toLowerCase().endsWith('.apk'))record('download_click',app);}catch(_){}
   },{passive:true});
  }
  return;
}
 record('page_view',null);
 record('app_view',app);
 const download=document.querySelector('a[data-fc-apk-download]');
 if(download)download.addEventListener('click',()=>record('download_click',app),{passive:true});
})();

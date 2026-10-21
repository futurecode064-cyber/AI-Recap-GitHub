'use strict';
/* Future Code portfolio: anonymous download-page views and APK link clicks.
   These are additional click events, NOT verified installs or D1 file GETs. */
(() => {
  const current=document.currentScript;
  const site=current?.dataset.siteKey;
  const app=current?.dataset.appKey;
  const allow=new Set(['goal-zone','bw-sport','ykz-family','ko-thet-family']);
  if(!allow.has(site)||site!==app)return;
  const base='https://mxwervqihaqlxybghdak.supabase.co/rest/v1/rpc/fc_record_portfolio_event';
  const key='sb_publishable_JBcF0nEMbcFSSf7OlCCqmQ_lC1DEM0A';
  const id=()=>typeof crypto!=='undefined' && typeof crypto.randomUUID==='function' ? crypto.randomUUID() : null;
  let browser=null;
  try {
    browser=localStorage.getItem('fc_football_apk_visitor_id');
    if(!browser){browser=id();if(browser)localStorage.setItem('fc_football_apk_visitor_id',browser);}
  }catch(_){browser=null;}
  function record(kind,appKey) {
    const eventId=id();if(!eventId)return;
    try {
      fetch(base,{method:'POST',mode:'cors',keepalive:true,
        headers:{'apikey':key,'Content-Type':'application/json'},
        body:JSON.stringify({p_event_id:eventId,p_event_kind:kind,p_app_key:appKey,p_browser_id:browser,p_site_key:site})
      }).catch(()=>{});
    }catch(_){}
  }
  record('page_view',null);
  const download=document.querySelector('a[data-fc-apk-download]');
  if(download)download.addEventListener('click',()=>record('download_click',app),{passive:true});
})();

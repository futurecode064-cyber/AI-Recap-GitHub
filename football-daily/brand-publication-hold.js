"use strict";
/* Owner: Nov 10 main only. Freeze every active brand/mirror on its Nov 9 publication. */
(function(){
 const root=document.documentElement;
 if(!root.dataset.footballBrandName)return;
 const date=root.dataset.footballHoldDate;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||""))return;
 const previous=window.fetch.bind(window);
 const livePrefix=new URL("../data/",document.baseURI).pathname;
 const frozenPrefix=new URL("../data/brand-hold/",document.baseURI).pathname;
 function rewrite(input){
   try{
     const original=typeof input==="string"?input:input instanceof URL?input.href:input?.url;
     if(!original)return null;
     const uri=new URL(original,document.baseURI);
     if(uri.origin!==location.origin)return null;
     const path=uri.pathname;
     if(path===livePrefix+"today.json"){
       uri.pathname=frozenPrefix+date+"-today.json";return uri.href;
     }
     // Guard against brand-only auxiliary editors/downloaders reading newly
     // published November 10 odds or tips from shared root.
     if(path===livePrefix+"odds/2026-11-10.json"){
       uri.pathname=livePrefix+"odds/"+date+".json";return uri.href;
     }
     if(path===livePrefix+"odds/evening/2026-11-10.json"){
       uri.pathname=livePrefix+"odds/evening/"+date+".json";return uri.href;
     }
     if(path===livePrefix+"tips/2026-11-10.json"){
       uri.pathname=livePrefix+"tips/"+date+".json";return uri.href;
     }
     return null;
   }catch{return null;}
 }
 window.fetch=function(input,init){
   const held=rewrite(input);
   // Recreate the request when the input is a Request instance, preserving
   // options, headers, credentials and abort controllers.
   return previous(held?(typeof input==="string"||input instanceof URL?held:new Request(held,input)):input,init);
 };
 window.FutureCodeBrandHold=Object.freeze({date});
})();

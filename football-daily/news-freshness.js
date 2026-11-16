"use strict";
/* Date-safe news editions. Historical editions must not masquerade as today's feed. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;if(root)root.FutureCodeNewsFreshness=api;})(typeof window!=="undefined"?window:null,function(){
 function dayKey(now=new Date()){
  const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Yangon",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
  const value=type=>parts.find(p=>p.type===type).value;
  return value("year")+"-"+value("month")+"-"+value("day");
 }
 function inspect(feed,now=new Date()){
  const currentDate=dayKey(now),feedDate=String(feed?.date||"");
  return {currentDate,feedDate,current:feedDate===currentDate&&Array.isArray(feed?.items)&&feed.items.length>0};
 }
 return Object.freeze({dayKey,inspect});
});

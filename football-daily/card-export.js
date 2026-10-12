"use strict";
(function(){
 // Exact same card as the page: VS banner, actual logos, source odds,
 // 3-column Last Five / H2H boxes and Burmese editorial commentary.
 // No parallel canvas layout is maintained or hand-drawn.
 function safeName(v){return String(v||"football").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,90)||"match"}
 async function save(match,opts={}){
  if(!match||!match.home||!match.away)throw Error("Invalid football match");
  if(!opts.cardNode||!opts.cardNode.classList?.contains("match-card"))throw Error("Visible match card required");
  if(!window.FutureCodeDomCapture?.save)throw Error("Website image export module not ready");
  const width=Math.max(320,Math.ceil(opts.cardNode.getBoundingClientRect().width));
  const filename=safeName(opts.brandName)+"-"+safeName(match.home)+"-vs-"+safeName(match.away)+".png";
  return window.FutureCodeDomCapture.save(opts.cardNode,filename,{
    width,background:"#101c20",excludeControls:true
  });
 }
 window.FutureCodeCardExport={save};
})();

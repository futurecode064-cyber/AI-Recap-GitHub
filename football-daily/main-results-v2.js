"use strict";
/* MAIN only. Results V2 uses the V4 square poster with verified FT score,
   archived V2 editorial and original pick. Page and PNG share one renderer. */
(function(){
 if(document.documentElement.dataset.footballBrandName||!["/","/index.html"].includes(location.pathname))return;
 const $=id=>document.getElementById(id);
 const clean=v=>String(v??"").replace(/\*\*/g,"").normalize("NFC").trim();
 const team=(m,side)=>clean(m[side+"Display"]||m[side]||"—");
 const choice=m=>m.previewV2Selection||window.FutureCodeEditorialChoice?.pick(m)||"အတည်မပြုရသေး";
 const valid=m=>m?.status==="finished"&&/^\d+\s*[-:]\s*\d+$/.test(clean(m.finalScore||""));
 const yesterday=()=>{const p=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Yangon",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()).map(x=>[x.type,x.value]));const d=new Date(Date.UTC(+p.year,+p.month-1,+p.day));d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10);};
 const period=m=>m.resultPeriod==="AET"?"AET · အချိန်ပိုပြီး":"FT · ပွဲပြီး";
 const timeNote=m=>m.resultPeriod==="AET"?" · မိနစ် ၉၀ "+(m.regulationScore||"—"):"";
 let selectedDate=yesterday(),matches=[],topBanner=null,bottomBanner=null,loadId=0;
 const css=document.createElement("style");
 css.textContent=[
 '.fc-result-v2{display:none;margin:22px 0 34px;color:#f0f6ff;font-family:"Noto Sans Myanmar",sans-serif}',
 'body[data-fc-main-view="resultsV2"] .fc-result-v2{display:block}',
 'body[data-fc-main-view="resultsV2"] :is(.content>.section-heading,.dashboard-bar,#filters,#sectionNote,#resultsDownloadBar,#matchList,#fcPreviewV2,#fcProbSection,#fcNewsSection,#fcAiScoreSection,#fcVideoStudio,#brandPreviewStudio,#brandOddsStudio){display:none!important}',
 '.fc-result-v2 h2{font:900 26px/1.8 "Noto Sans Myanmar",sans-serif;color:#ffcf70}',
 '.fc-r2-tools{display:flex;flex-wrap:wrap;align-items:end;gap:12px;background:#142e43;border:1px solid #5d8195;border-radius:12px;padding:16px}',
 '.fc-r2-tools label{display:grid;gap:5px;font-size:13px;font-weight:800}',
 '.fc-r2-tools input,.fc-r2-tools select{padding:10px;border:1px solid #90acb8;border-radius:7px;background:#fff;color:#17334a;font:700 13px "Noto Sans Myanmar",sans-serif;max-width:260px}',
 '.fc-r2-tools button,.fc-r2-save{padding:12px 17px;background:#ebbf66;border:1px solid #ffe2a6;border-radius:8px;color:#162a3e;font:800 14px "Noto Sans Myanmar",sans-serif;cursor:pointer}',
 '.fc-r2-save:disabled{opacity:.55;cursor:wait}.fc-r2-status{padding:13px 0;color:#ffe3a2;line-height:1.9}',
 '.fc-r2-list{display:grid;gap:30px}',
 '.fc-r2-card{background:#101a27;border:1px solid #334455;border-radius:14px;overflow:hidden}',
 '.fc-r2-scorehead{position:relative;background:linear-gradient(115deg,#06223c,#185179,#06223c);border-bottom:4px solid #edbd60;padding:14px 26px 23px;text-align:center}',
 '.fc-r2-meta{color:#fff1cb;font-size:17px;font-weight:800;margin:5px 0 11px}',
 '.fc-r2-scoreline{display:grid;grid-template-columns:minmax(0,1fr) 340px minmax(0,1fr);align-items:center;gap:12px}',
 '.fc-r2-club{display:flex;align-items:center;justify-content:center;gap:12px;min-width:0;color:white;font:900 28px/1.6 "Noto Sans Myanmar",sans-serif}',
 '.fc-r2-club img{height:106px;width:106px;object-fit:contain;flex-shrink:0}',
 '.fc-r2-club strong{min-width:0;overflow-wrap:anywhere}',
 '.fc-r2-score-wrap{display:flex;align-items:center;flex-direction:column;justify-content:center;gap:4px}',
 '.fc-r2-score{border:9px solid #ef3631;border-radius:50%;padding:18px 15px;min-width:285px;min-height:155px;display:grid;place-items:center;color:#ffdf91;font:900 82px/1.15 Arial,sans-serif;transform:rotate(-4deg);box-shadow:0 0 0 4px #e83c2c30}',
 '.fc-r2-state{color:#e5f1ff;font:800 14px/1.7 "Noto Sans Myanmar",sans-serif}',
 '.fc-r2-original{margin:0 14px 14px!important;max-width:none!important;box-sizing:border-box}',
  '.fc-r2-original :is(.match-topline,.match-hero,.match-market-layout){display:none!important}',
  '.fc-r2-caption{background:#0c3049;padding:12px;color:#ffda91;text-align:center;font:900 20px/1.6 "Noto Sans Myanmar",sans-serif}',
 '.fc-r2-original .analysis-body{display:block!important;overflow:visible!important;max-height:none!important}',
 '.fc-r2-original .fc-editorial-selection{border:6px solid #ec362e!important;outline:4px solid #ee483480;border-radius:50%!important;padding:12px 28px!important;transform:rotate(-2deg);max-width:91%;box-shadow:none!important}',
 '.fc-r2-download{display:block;margin:15px auto 22px}',
 '@media(max-width:850px){.fc-r2-scoreline{grid-template-columns:minmax(0,1fr) 170px minmax(0,1fr);gap:3px}.fc-r2-score{min-width:150px;min-height:104px;font-size:46px;padding:9px;border-width:6px}.fc-r2-club{font-size:15px;flex-direction:column}.fc-r2-club img{height:55px;width:55px}}'
 ].join("\n");
 document.head.append(css);
 function readBanner(file){
  if(!file)return Promise.resolve(null);
  return new Promise(resolve=>{const reader=new FileReader();reader.onerror=()=>resolve(null);reader.onload=()=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=reader.result;};reader.readAsDataURL(file);});
 }
 function setup(){
  const target=$("fcPreviewV2");if(!target)return;
  const el=document.createElement("section");el.id="fcResultsV2";el.className="fc-result-v2";
  el.innerHTML='<h2>ဂိုးရလဒ် Version 2 · V4 ဒီဇိုင်း + မူလရွေးချယ်မှု</h2><div class="fc-r2-tools">'+
   '<label>ပွဲနေ့စွဲ<input id="fcR2Date" type="date"></label>'+
   '<label>လိဂ်ရွေးရန်<select id="fcR2League"><option value="all">လိဂ်အားလုံး</option></select></label>'+
   '<label>မိမိအပေါ် Banner<input id="fcR2Top" type="file" accept="image/*"></label>'+
   '<label>မိမိအောက် Banner<input id="fcR2Bottom" type="file" accept="image/*"></label>'+
   '<button id="fcR2Refresh" type="button">↻ Refresh</button></div>'+
   '<p id="fcR2Status" class="fc-r2-status" role="status">မနေ့က ပွဲကြိုကတ်နှင့် အတည်ပြုဂိုးရလဒ် ရယူနေသည်…</p>'+
   '<div id="fcR2List" class="fc-r2-list" aria-live="polite"></div>';
  target.insertAdjacentElement("afterend",el);$("fcR2Date").value=selectedDate;
  $("fcR2Date").onchange=()=>{selectedDate=$("fcR2Date").value||yesterday();load();};
  $("fcR2League").onchange=render;
  $("fcR2Refresh").onclick=load;
  $("fcR2Top").onchange=async e=>{topBanner=await readBanner(e.target.files?.[0]);render();};
  $("fcR2Bottom").onchange=async e=>{bottomBanner=await readBanner(e.target.files?.[0]);render();};
  load();
 }
 let renderId=0;
 async function render(){
  const generation=++renderId,root=$("fcR2List");if(!root)return;root.replaceChildren();
  const group=$("fcR2League").value,list=matches.filter(m=>group==="all"||m.league===group);
  for(const m of list){
   if(generation!==renderId)return;
   const item=document.createElement("article");item.className="fc-r2-card";
   const save=document.createElement("button");save.className="fc-r2-save fc-r2-download";save.type="button";
   save.textContent="⬇ ဂိုးရလဒ် V2 · V4 ဒီဇိုင်း PNG Download";
   save.onclick=async()=>{save.disabled=true;try{await png(m);$("fcR2Status").textContent="PNG Download စတင်ပြီးပါပြီ။";}catch(e){$("fcR2Status").textContent="PNG Download မအောင်မြင်ပါ — "+e.message;}finally{save.disabled=false;}};
   root.append(item);
   try{
    const canvas=await renderCanvas(m,{includeUploadedBanners:true});
    if(generation!==renderId)return;
    canvas.style.cssText="display:block;width:100%;height:auto";
    canvas.setAttribute("role","img");canvas.setAttribute("aria-label",team(m,"home")+" "+m.finalScore+" "+team(m,"away")+" · မူလရွေးချယ်မှု "+choice(m));
    item.append(canvas,save);
   }catch(e){const error=document.createElement("p");error.textContent=team(m,"home")+" — "+e.message;item.append(error);}
  }
  if(generation===renderId)$("fcR2Status").textContent=list.length+" ပွဲ · V4 ဒီဇိုင်း · ပွဲပြီးဂိုးရလဒ်နှင့် မူလအထူးရွေးချယ်မှုကို ဝိုင်းပြထားသည်။";
 }
 async function load(){
  ++renderId;
  const n=++loadId,root=$("fcR2List");root.replaceChildren();$("fcR2Status").textContent=selectedDate+" ရလဒ်များ ရယူနေသည်…";
  try{
   const url=new URL("./data/archive/"+selectedDate+".json",document.baseURI);
   url.searchParams.set("v",Date.now());
   const response=await (window.FootballData?.fetch||fetch)(url,{cache:"no-store"});
   if(!response.ok)throw Error("Archive မရပါ");
   const d=await response.json();if(n!==loadId)return;
   if(d.reportDate!==selectedDate||d.published!==true||!Array.isArray(d.matches))throw Error("အတည်ပြု Archive မရှိပါ");
   matches=d.matches.filter(valid);
   const sel=$("fcR2League"),prev=sel.value;
   sel.replaceChildren(new Option("လိဂ်အားလုံး","all"));
   [...new Set(matches.map(m=>m.league))].forEach(l=>sel.add(new Option(matches.find(x=>x.league===l).leagueDisplay||l,l)));
   if([...sel.options].some(o=>o.value===prev))sel.value=prev;
   await render();
  }catch(e){if(n!==loadId)return;matches=[];root.replaceChildren();$("fcR2Status").textContent="ဂိုးရလဒ် V2 Data မရပါ — "+e.message;}
 }
 async function renderCanvas(m,options={}){
  if(!valid(m))throw Error("အတည်ပြု ပွဲပြီးရလဒ် မရှိသေးပါ");
  const renderer=window.FutureCodePreviewV4;
  if(!renderer?.render)throw Error("V4 ဒီဇိုင်း Renderer မရသေးပါ");
  // Archived V2 prose and pick are retained; never read today's editorial into an old result.
  const canvas=await renderer.render(m,{result:true,color:options.color});
  const top=options.includeUploadedBanners!==false?topBanner:null,bottom=options.includeUploadedBanners!==false?bottomBanner:null;
  if(!top&&!bottom)return canvas;
  const w=canvas.width,topH=top?Math.round(w*top.naturalHeight/top.naturalWidth):0,bottomH=bottom?Math.round(w*bottom.naturalHeight/bottom.naturalWidth):0;
  if(topH+canvas.height+bottomH>32767||w*(topH+canvas.height+bottomH)>108000000)throw Error("Banner အရွယ်အစား များလွန်းပါသည်");
  const out=document.createElement("canvas");out.width=w;out.height=topH+canvas.height+bottomH;
  const c=out.getContext("2d");if(top)c.drawImage(top,0,0,w,topH);c.drawImage(canvas,0,topH);if(bottom)c.drawImage(bottom,0,topH+canvas.height,w,bottomH);
  return out;
 }
 async function png(m){
  const out=await renderCanvas(m,{includeUploadedBanners:true});
  const blob=await new Promise((resolve,reject)=>out.toBlob(b=>b?.size?resolve(b):reject(Error("PNG encoding failed")),"image/png"));
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="results-v2-"+selectedDate+"-"+clean(m.fixtureId||m.home||"match").replace(/[^a-z0-9_-]/gi,"-")+".png";
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 }
 window.FutureCodeResultsV2=Object.freeze({renderCanvas});
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup();
})();
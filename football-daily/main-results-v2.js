"use strict";
/* MAIN only. Results V2 = verified FT header + compact logo/score row, then
   the unchanged archived article and original selection. Prematch market panels
   are intentionally omitted from this Results-only presentation. */
(function(){
 if(document.documentElement.dataset.footballBrandName||!["/","/index.html"].includes(location.pathname))return;
 const $=id=>document.getElementById(id);
 const clean=v=>String(v??"").replace(/\*\*/g,"").normalize("NFC").trim();
 const team=(m,side)=>clean(m[side+"Display"]||m[side]||"—");
 const choice=m=>window.FutureCodeEditorialChoice?.pick(m)||"အတည်မပြုရသေး";
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
 '.fc-r2-card{background:#0a2032;border:2px solid #bf9855;border-radius:14px;overflow:hidden}',
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
  el.innerHTML='<h2>ဂိုးရလဒ် Version 2 · FULL TIME + မူလသုံးသပ်ချက်</h2><div class="fc-r2-tools">'+
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
  $("fcR2Top").onchange=async e=>topBanner=await readBanner(e.target.files?.[0]);
  $("fcR2Bottom").onchange=async e=>bottomBanner=await readBanner(e.target.files?.[0]);
  load();
 }
 function logo(src,name){
  const frame=document.createElement("div");frame.className="fc-r2-club";
  if(src){
   const img=document.createElement("img");img.src=src;img.alt=name+" အသင်းလိုဂို";img.loading="lazy";
   img.onerror=()=>img.remove();frame.append(img);
  }
  const label=document.createElement("strong");label.textContent=name;frame.append(label);
  return frame;
 }
 function resultHeader(m){
  const h=document.createElement("header");h.className="fc-r2-scorehead";
  const meta=document.createElement("div");meta.className="fc-r2-meta";
  meta.textContent=(m.leagueDisplay||m.league||"")+" · "+selectedDate+" · "+period(m)+timeNote(m);
  const line=document.createElement("div");line.className="fc-r2-scoreline";
  const middle=document.createElement("div");middle.className="fc-r2-score-wrap";
  const score=document.createElement("strong");score.className="fc-r2-score";score.textContent=clean(m.finalScore).replace(":", " - ");
  const state=document.createElement("small");state.className="fc-r2-state";state.textContent=period(m);
  middle.append(score,state);
  line.append(logo(m.homeCrestUrl,team(m,"home")),middle,logo(m.awayCrestUrl,team(m,"away")));
  h.append(meta,line);return h;
 }
 function render(){
  const root=$("fcR2List");if(!root)return;root.replaceChildren();
  const group=$("fcR2League").value,list=matches.filter(m=>group==="all"||m.league===group);
  for(const m of list){
   const item=document.createElement("article");item.className="fc-r2-card";
   item.append(resultHeader(m));
   // Keep the archived original article and pick; remove duplicate prematch odds/form.
   const original=window.FutureCodeMainPreviewCard?.renderOriginal(m);
   if(!original){
    const error=document.createElement("p");error.textContent="မူရင်း ပွဲကြိုကတ် module မရရှိပါ";item.append(error);
   }else{
    original.classList.add("fc-r2-original");
    for(const selector of [".match-topline",".match-hero",".match-market-layout"])
      original.querySelector(selector)?.remove();
    const caption=document.createElement("div");caption.className="fc-r2-caption";caption.textContent="မူလ ပွဲကြိုသုံးသပ်ချက်";
    item.append(caption);
    original.querySelector(".analysis-toggle")?.remove();
    original.querySelector(".match-actions")?.remove();
    const body=original.querySelector(".analysis-body");if(body){body.hidden=false;body.style.display="block";}
    item.append(original);
   }
   const save=document.createElement("button");save.className="fc-r2-save fc-r2-download";save.type="button";
   save.textContent="⬇ FULL TIME ဂိုးရလဒ် + မူလသုံးသပ်ချက် PNG Download";
   save.disabled=!original;
   save.onclick=async()=>{
    save.disabled=true;
    try{await png(m);$("fcR2Status").textContent="PNG Download စတင်ပြီးပါပြီ။";}
    catch(err){$("fcR2Status").textContent="PNG Download မအောင်မြင်ပါ — "+err.message;}
    finally{save.disabled=false;}
   };
   item.append(save);root.append(item);
  }
  $("fcR2Status").textContent=list.length+" ပွဲ · FULL TIME ဂိုးရလဒ် + မူလသုံးသပ်ချက် + မူလရွေးချယ်မှု။ VS၊ 1X2 ကြေးနှင့် နောက်ဆုံး ၅ ပွဲကို Results V2 မှ ဖယ်ထားပါသည်။";
 }
 async function load(){
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
   render();
  }catch(e){if(n!==loadId)return;matches=[];root.replaceChildren();$("fcR2Status").textContent="ဂိုးရလဒ် V2 Data မရပါ — "+e.message;}
 }
 function cover(c,img,w,y,h){
  if(!img)return;
  const k=Math.max(w/img.naturalWidth,h/img.naturalHeight),sw=w/k,sh=h/k;
  c.drawImage(img,(img.naturalWidth-sw)/2,(img.naturalHeight-sh)/2,sw,sh,0,y,w,h);
 }
 function ring(c,x,y,rx,ry){
  c.save();c.strokeStyle="#f1322c";c.lineWidth=9;c.lineCap="round";
  for(let i=0;i<2;i++){
   c.beginPath();c.ellipse(x,y,rx+i*7,ry+i*4,-0.05,0,Math.PI*2);c.stroke();
  }c.restore();
 }
 async function renderCanvas(m,options={}){
  const renderer=window.FutureCodeFramePreview,kit=window.FutureCodeCanvasKit;
  if(!renderer?.render||!kit)throw Error("V1 Original Canvas Renderer မရသေးပါ");
  await kit.fonts();await document.fonts?.ready;
  // Reuse the *unmodified* source match: identical V1 artwork, team crests,
  // 5-match W/D/L, 1X2, bookmaker lines and the complete original analysis.
  let preview=await renderer.render(m);
  preview=window.FutureCodeEditorialChoice?.appendPng(preview,m)||preview;
  const W=preview.width,headH=360,cutY=508,captionH=60,topH=topBanner&&options.includeUploadedBanners!==false?180:0,bottomH=bottomBanner&&options.includeUploadedBanners!==false?180:0;
  if(preview.height<=cutY+30)throw Error("မူလသုံးသပ်ချက် Canvas အမြင့် မမှန်ပါ");
  const H=topH+headH+captionH+(preview.height-cutY)+bottomH;
  if(H>32000||W*H>110000000)throw Error("PNG အမြင့်/အရွယ်အစား များလွန်းနေပါသည်");
  const out=document.createElement("canvas");out.width=W;out.height=H;
  const c=out.getContext("2d");if(!c)throw Error("Canvas မရပါ");
  c.fillStyle="#06192d";c.fillRect(0,0,W,H);
  if(topH)cover(c,topBanner,W,0,topH);
  const yy=topH;
  const grd=c.createLinearGradient(0,yy,W,yy+headH);grd.addColorStop(0,"#06213b");grd.addColorStop(.5,"#15517e");grd.addColorStop(1,"#06213b");
  c.fillStyle=grd;c.fillRect(0,yy,W,headH);
  c.strokeStyle="#d7ad62";c.lineWidth=4;c.strokeRect(12,yy+11,W-24,headH-20);
  c.textAlign="center";c.textBaseline="middle";c.fillStyle="#ffe2a5";
  c.font='800 24px "Noto Sans Myanmar",sans-serif';
  c.fillText((m.leagueDisplay||m.league||"")+" · "+(options.date||selectedDate)+" · "+period(m),W/2,yy+43,W-95);
  const logos=[m.homeCrestUrl,m.awayCrestUrl].filter(Boolean);
  await kit.preloadImages(logos);
  if(m.homeCrestUrl)kit.crest(c,m.homeCrestUrl,55,yy+95,140,team(m,"home"),true);
  if(m.awayCrestUrl)kit.crest(c,m.awayCrestUrl,W-195,yy+95,140,team(m,"away"),true);
  c.fillStyle="#fff";c.font='900 29px "Noto Sans Myanmar",sans-serif';
  c.fillText(team(m,"home"),265,yy+282,310);c.fillText(team(m,"away"),W-265,yy+282,310);
  c.fillStyle="#ffecb0";c.font="900 112px Arial,sans-serif";
  c.fillText(clean(m.finalScore).replace(/\s*[-:]\s*/," - "),W/2,yy+184,420);
  ring(c,W/2,yy+186,214,94);
  if(m.resultPeriod==="AET"){
   c.fillStyle="#fff";c.font='700 18px "Noto Sans Myanmar",sans-serif';
   c.fillText("မိနစ် ၉၀: "+(m.regulationScore||"—")+" · အချိန်ပိုပြီး "+m.finalScore,W/2,yy+333,650);
  }else{
   c.fillStyle="#fff";c.font="800 19px Arial,sans-serif";c.fillText("Finished",W/2,yy+333,260);
  }
  // Draw the full-time score once. Original Myanmar analysis and chosen club follow.
  const captionY=yy+headH;
  c.fillStyle="#0c3049";c.fillRect(0,captionY,W,captionH);
  c.fillStyle="#ffda91";c.font='900 21px "Noto Sans Myanmar",sans-serif';
  c.fillText("မူလ ပွဲကြိုသုံးသပ်ချက်",W/2,captionY+captionH/2,W-70);
  const articleTop=captionY+captionH;
  c.drawImage(preview,0,cutY,W,preview.height-cutY,0,articleTop,W,preview.height-cutY);
  // The V1 canvas already appends an explicit original-selection footer.
  // Circle exactly that footer; do NOT infer that a handicap bet won.
  const extra=Math.max(100,Math.round(W*.085));
  ring(c,W/2,articleTop+(preview.height-cutY)-extra/2,Math.min(470,W*.39),Math.min(extra*.43,49));
  if(bottomH)cover(c,bottomBanner,W,H-bottomH,bottomH);
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
"use strict";
/* Main-channel Results V2: only verified FT scores and archived pre-match prose. */
(function(){
 if(document.documentElement.dataset.footballBrandName||!["/","/index.html"].includes(location.pathname))return;
 const $=s=>document.getElementById(s),plain=v=>String(v??"").replace(/\*\*/g,"").normalize("NFC").trim();
 const team=(m,s)=>plain(m[s+"Display"]||m[s]||"—");
 const choice=m=>window.FutureCodeEditorialChoice?.pick(m)||"အတည်မပြုရသေး";
 const verified=m=>m?.status==="finished"&&/^\d+\s*[-:]\s*\d+$/.test(String(m.finalScore||""));
 const article=m=>plain(m.dailyPreviewText)||"မနေ့က ရေးသားထားသော ပွဲကြိုသုံးသပ်ချက် မရရှိပါ။";
 const yesterday=()=>{const p=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Yangon",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()).map(x=>[x.type,x.value]));const d=new Date(Date.UTC(+p.year,+p.month-1,+p.day));d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10);};
 let date=yesterday(),matches=[],topBanner=null,bottomBanner=null,serial=0;
 const css=document.createElement("style");
 css.textContent='.fc-result-v2{display:none;margin:22px 0;color:#eef6fc;font-family:"Noto Sans Myanmar",sans-serif}body[data-fc-main-view="resultsV2"] .fc-result-v2{display:block}'+
 'body[data-fc-main-view="resultsV2"] :is(.content>.section-heading,.dashboard-bar,#filters,#sectionNote,#resultsDownloadBar,#matchList,#fcPreviewV2,#fcProbSection,#fcNewsSection,#fcAiScoreSection,#fcVideoStudio,#brandPreviewStudio,#brandOddsStudio){display:none!important}'+
 '.fc-result-v2 h2{color:#ffd071;font-size:27px}.fc-r2-tools{display:flex;flex-wrap:wrap;gap:12px;align-items:end;padding:17px;background:#153448;border:1px solid #517d97;border-radius:13px}.fc-r2-tools label{display:grid;gap:5px;font-weight:750}.fc-r2-tools input,.fc-r2-tools select{font:700 13px "Noto Sans Myanmar",sans-serif;background:white;color:#143044;padding:10px;border-radius:7px;max-width:260px}.fc-r2-tools button,.fc-r2-save{padding:12px 17px;background:#e9bf66;color:#14283b;border:1px solid #ffe1a4;border-radius:8px;font:800 14px "Noto Sans Myanmar",sans-serif;cursor:pointer}.fc-r2-status{color:#ffe3a2;padding:14px 0}.fc-r2-list{display:grid;gap:22px}'+
 '.fc-r2-card{background:#092131;border:2px solid #bb9956;border-radius:12px;overflow:hidden}.fc-r2-meta{padding:12px;color:#f8d489}.fc-r2-head{display:grid;grid-template-columns:1fr 200px 1fr;gap:8px;align-items:center;padding:26px 12px;background:#134263;text-align:center}.fc-r2-head strong{font-size:23px;line-height:1.8;overflow-wrap:anywhere}.fc-r2-score{font:900 42px Arial,sans-serif;border:6px double #f03b39;border-radius:55%;padding:17px 8px;color:#ffe09b}'+
 '.fc-r2-text{margin:13px;padding:20px;background:#fff;color:#163346;border-radius:10px}.fc-r2-text h3{font-size:24px}.fc-r2-text p{font-size:20px;line-height:2;white-space:pre-line;overflow-wrap:anywhere}.fc-r2-pick{margin:12px auto;width:fit-content;max-width:95%;padding:13px 30px;border:6px double #fa3c35;border-radius:55%;font-size:23px;font-weight:900;color:#ffe096}.fc-r2-save{display:block;margin:16px auto}';
 document.head.append(css);
 function readBanner(f){if(!f)return Promise.resolve(null);return new Promise(ok=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>ok(im);im.onerror=()=>ok(null);im.src=r.result;};r.onerror=()=>ok(null);r.readAsDataURL(f);});}
 function setup(){
  const home=$("fcPreviewV2");if(!home)return;
  const s=document.createElement("section");s.className="fc-result-v2";s.id="fcResultsV2";
  s.innerHTML='<h2>ဂိုးရလဒ် Version 2 · ပွဲကြိုသုံးသပ်ချက်နှင့် ရွေးချယ်မှု</h2><div class="fc-r2-tools">'+
   '<label>ပွဲနေ့စွဲ<input type="date" id="fcR2Date"></label><label>လိဂ်ရွေးရန်<select id="fcR2League"><option value="all">လိဂ်အားလုံး</option></select></label>'+
   '<label>အပေါ် Banner<input type="file" id="fcR2Top" accept="image/*"></label><label>အောက် Banner<input type="file" id="fcR2Bottom" accept="image/*"></label><button type="button" id="fcR2Refresh">↻ Refresh</button></div>'+
   '<p class="fc-r2-status" role="status" id="fcR2Status">အတည်ပြုဂိုးရလဒ်များ ရယူနေပါသည်…</p><div class="fc-r2-list" id="fcR2List"></div>';
  home.insertAdjacentElement("afterend",s);$("fcR2Date").value=date;
  $("fcR2Date").onchange=()=>{date=$("fcR2Date").value||yesterday();load();};
  $("fcR2League").onchange=render;$("fcR2Refresh").onclick=load;
  $("fcR2Top").onchange=async e=>{topBanner=await readBanner(e.target.files?.[0]);};
  $("fcR2Bottom").onchange=async e=>{bottomBanner=await readBanner(e.target.files?.[0]);};
  load();
 }
 function render(){
  const out=$("fcR2List"),league=$("fcR2League").value;out.replaceChildren();
  const list=matches.filter(m=>league==="all"||m.league===league);
  for(const m of list){
   const item=document.createElement("article");item.className="fc-r2-card";
   const meta=document.createElement("div");meta.className="fc-r2-meta";meta.textContent=(m.leagueDisplay||m.league||"")+" · "+date+" · "+(m.resultPeriod==="AET"?"AET / အချိန်ပို":"FT / ပွဲပြီး")+(m.resultPeriod==="AET"?" · ပုံမှန်မိနစ် ၉၀ "+(m.regulationScore||"—"):"");
   const head=document.createElement("div");head.className="fc-r2-head";
   const home=document.createElement("strong"),away=document.createElement("strong"),score=document.createElement("span");score.className="fc-r2-score";
   home.textContent=team(m,"home");away.textContent=team(m,"away");score.textContent=plain(m.finalScore).replace(":"," - ");head.append(home,score,away);
   const txt=document.createElement("div");txt.className="fc-r2-text";
   const h=document.createElement("h3");h.textContent="မနေ့က ပွဲကြိုသုံးသပ်ချက်";
   const p=document.createElement("p");p.textContent=article(m);txt.append(h,p);
   const selected=document.createElement("div");selected.className="fc-r2-pick";selected.textContent="ရွေးချယ်မှု - "+choice(m);
   const btn=document.createElement("button");btn.className="fc-r2-save";btn.textContent="⬇ ဒီပွဲ Version 2 PNG Download";
   btn.onclick=async()=>{btn.disabled=true;try{await png(m);$("fcR2Status").textContent="PNG Download စတင်ပြီးပါပြီ။";}catch(e){$("fcR2Status").textContent="PNG မထွက်ပါ — "+e.message;}finally{btn.disabled=false;}};
   item.append(meta,head,txt,selected,btn);out.append(item);
  }
  $("fcR2Status").textContent=list.length+" ပွဲ · ဂိုးရလဒ်နှင့် မူရင်းရွေးချယ်မှုကို ဝိုင်းပြထားပါသည်။ Handicap/ကြေးအနိုင်အရှုံးကို ရလဒ်တစ်ခုတည်းမှ မဆုံးဖြတ်ပါ။";
 }
 async function load(){
  const n=++serial;$("fcR2Status").textContent=date+" အတည်ပြုရလဒ်များ ရယူနေသည်…";$("fcR2List").replaceChildren();
  try{
   const url=new URL("./data/archive/"+date+".json",document.baseURI);url.searchParams.set("v",Date.now());
   const res=await (window.FootballData?.fetch||fetch)(url,{cache:"no-store"});
   if(!res.ok)throw Error("Archive မရပါ");const j=await res.json();if(n!==serial)return;
   if(!j.published||j.reportDate!==date||!Array.isArray(j.matches))throw Error("ရက်စွဲအတွက် အတည်ပြု Archive မရှိပါ။");
   matches=j.matches.filter(verified);const sel=$("fcR2League"),old=sel.value;sel.replaceChildren(new Option("လိဂ်အားလုံး","all"));
   [...new Set(matches.map(m=>m.league))].forEach(l=>sel.add(new Option(matches.find(m=>m.league===l).leagueDisplay||l,l)));
   if([...sel.options].some(x=>x.value===old))sel.value=old;render();
  }catch(e){if(n!==serial)return;matches=[];$("fcR2Status").textContent=e.message;}
 }
 function wrap(ctx,value,width){
  const words=typeof Intl.Segmenter==="function"?Array.from(new Intl.Segmenter("my",{granularity:"word"}).segment(value),x=>x.segment):Array.from(value);
  const lines=[];let line="";for(const w of words){if(ctx.measureText(line+w).width<=width){line+=w;continue;}if(line.trim())lines.push(line.trim());line=w.trimStart();if(ctx.measureText(line).width>width){const gs=typeof Intl.Segmenter==="function"?Array.from(new Intl.Segmenter("my",{granularity:"grapheme"}).segment(line),x=>x.segment):Array.from(line);line="";for(const g of gs){if(line&&ctx.measureText(line+g).width>width){lines.push(line);line="";}line+=g;}}}if(line.trim())lines.push(line.trim());return lines;
 }
 function ring(c,x,y,rx,ry){c.save();c.strokeStyle="#ea3537";c.lineWidth=8;for(let i=0;i<2;i++){c.beginPath();c.ellipse(x,y,rx+i*7,ry+i*6,-.04,0,Math.PI*2);c.stroke();}c.restore();}
 function cover(c,img,w,y,h){if(!img)return;const scale=Math.max(w/img.width,h/img.height),sw=w/scale,sh=h/scale;c.drawImage(img,(img.width-sw)/2,(img.height-sh)/2,sw,sh,0,y,w,h);}
 async function png(m){
  await document.fonts?.ready;const W=1200,measure=document.createElement("canvas").getContext("2d");
  measure.font='500 23px "Noto Sans Myanmar",sans-serif';
  const lines=wrap(measure,article(m),1100),bodyH=Math.max(220,lines.length*42+115),t=topBanner?175:0,b=bottomBanner?160:0,H=t+330+bodyH+140+b;
  if(H>32000)throw Error("စာသား ရှည်လွန်းနေပါသည်");
  const out=document.createElement("canvas");out.width=W;out.height=H;const c=out.getContext("2d");
  c.fillStyle="#081c2d";c.fillRect(0,0,W,H);if(topBanner)cover(c,topBanner,W,0,t);
  c.fillStyle="#174363";c.fillRect(15,t+9,W-30,302);
  c.textAlign="center";c.textBaseline="middle";c.fillStyle="#ffda89";c.font='800 23px "Noto Sans Myanmar",sans-serif';
  c.fillText((m.leagueDisplay||m.league||"")+" · "+date+" · "+(m.resultPeriod==="AET"?"AET (90 min "+(m.regulationScore||"—")+")":"FT"),600,t+47,1130);
  c.fillStyle="white";c.font='900 30px "Noto Sans Myanmar",sans-serif';c.fillText(team(m,"home"),245,t+160,420);c.fillText(team(m,"away"),955,t+160,420);
  c.font="900 63px Arial,sans-serif";c.fillStyle="#ffe19e";c.fillText(plain(m.finalScore).replace(":"," - "),600,t+163,235);ring(c,600,t+162,140,79);
  const y=t+330;c.fillStyle="#fff";c.fillRect(19,y,W-38,bodyH);
  c.fillStyle="#173b5a";c.font='900 28px "Noto Sans Myanmar",sans-serif';c.fillText("မနေ့က ပွဲကြိုသုံးသပ်ချက်",600,y+38,1110);
  c.textAlign="left";c.textBaseline="top";c.font='500 23px "Noto Sans Myanmar",sans-serif';c.fillStyle="#183247";
  for(let i=0;i<lines.length;i++)c.fillText(lines[i],50,y+84+i*42,1100);
  const cy=y+bodyH+69;c.fillStyle="#12354d";c.fillRect(15,y+bodyH+9,W-30,125);
  c.textAlign="center";c.textBaseline="middle";c.fillStyle="#fdd075";c.font='900 30px "Noto Sans Myanmar",sans-serif';c.fillText("ရွေးချယ်မှု - "+choice(m),600,cy,1040);ring(c,600,cy,460,52);
  if(bottomBanner)cover(c,bottomBanner,W,H-b,b);
  const blob=await new Promise((ok,no)=>out.toBlob(x=>x?.size?ok(x):no(Error("encoding failed")),"image/png"));
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;
  a.download="results-v2-"+date+"-"+plain(m.fixtureId||m.home||"match").replace(/[^a-z0-9_-]/gi,"-")+".png";
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup();
})();
"use strict";
/* Main Odds V2: logo-free league-grouped Myanmar price sheet, mirrored in PNG. */
(function(){
 if(document.documentElement.dataset.footballBrandName||!/^\/odds(?:\.html)?\/?$/.test(location.pathname))return;
 const $=s=>document.getElementById(s),str=v=>String(v??"").normalize("NFC").trim(),num=v=>str(v)||"—";
 const today=()=>{const p=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Yangon",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()).map(x=>[x.type,x.value]));return p.year+"-"+p.month+"-"+p.day;};
 let date=new URLSearchParams(location.search).get("date")||today(),sheet=null,topBanner="",bottomBanner="",serial=0,urls=[];
 const css=document.createElement("style");
 css.textContent='.fc-odds-v2{display:none;margin:20px 0;font-family:"Noto Sans Myanmar",sans-serif}body[data-fc-odds-view="v2"] .fc-odds-v2{display:block}'+
 'body[data-fc-odds-view="v2"] .odds-content>:not(.fc-odds-v2){display:none!important}.fc-ov2-tools{display:flex;flex-wrap:wrap;gap:12px;padding:18px;border-radius:12px;background:#1a3854;color:#fff;align-items:end}.fc-ov2-tools label{display:grid;gap:6px;font-size:13px}.fc-ov2-tools input,.fc-ov2-tools select{max-width:245px;font:700 13px "Noto Sans Myanmar",sans-serif;padding:10px;background:#fff;color:#123}.fc-ov2-tools button{padding:11px 15px;border:1px solid #e4ca8d;border-radius:7px;color:#061b37;background:#f0d189;font:900 13px "Noto Sans Myanmar",sans-serif;cursor:pointer}'+
 '.fc-ov2-sheet{width:1200px;max-width:none;background:#fff;color:#071e44;padding:20px;margin:18px auto;box-sizing:border-box}.fc-ov2-title{padding:16px;background:#f7f9fc;color:#0b326f;text-align:center;border:2px solid #0d3678;font:900 24px/1.9 "Noto Sans Myanmar",sans-serif}.fc-ov2-table{width:100%;table-layout:fixed;border-collapse:collapse;font:800 16px/1.8 "Noto Sans Myanmar",sans-serif;text-align:center}.fc-ov2-table th{background:#092f81;color:#fff;padding:12px 5px;border:1px solid #7792bb}.fc-ov2-table td{padding:12px 5px;border:1px solid #9bb0ce;overflow-wrap:anywhere}.fc-ov2-table .fc-ov2-league td{color:#d72424;background:#fff;font-size:19px;font-weight:900;padding:11px}.fc-ov2-table .fc-ov2-upper{background:#0b368b;color:white}.fc-ov2-table .fc-ov2-time{background:#143a8c;color:white}.fc-ov2-table .fc-ov2-versus{font-size:13px;color:#164d9e}.fc-ov2-status{color:#ffda89;line-height:2}.fc-ov2-preview{overflow-x:auto}.fc-ov2-output{display:flex;flex-wrap:wrap;gap:16px;margin:18px 0}.fc-ov2-output a{color:#102a42;background:#f7d98c;padding:10px;border-radius:6px}.fc-ov2-output img{max-width:230px;display:block}';
 document.head.append(css);
 function setup(){
  const nav=document.querySelector(".odds-nav"),main=document.querySelector(".odds-content");if(!nav||!main)return;
  const link=document.createElement("a");link.href="#fcOddsV2";link.textContent="ပေါက်ကြေး Version 2";link.id="fcOddsV2Tab";nav.append(link);
  const section=document.createElement("section");section.id="fcOddsV2";section.className="fc-odds-v2";
  section.innerHTML='<h2 style="color:#ffcd72">ပေါက်ကြေး Version 2 · အသင်းလိုဂိုမပါသောဇယား</h2><div class="fc-ov2-tools">'+
   '<label>ပွဲနေ့စွဲ<input type="date" id="fcOV2Date"></label><label>လိဂ်ရွေးရန်<select id="fcOV2League"><option value="all">လိဂ်အားလုံး</option></select></label>'+
   '<label>အပေါ် Banner<input type="file" id="fcOV2Top" accept="image/*"></label><label>အောက် Banner<input type="file" id="fcOV2Bottom" accept="image/*"></label>'+
   '<button type="button" id="fcOV2Refresh">↻ Refresh</button><button type="button" id="fcOV2Single">⬇ ၁ ပုံ PNG</button><button type="button" id="fcOV2Split">⬇ ၂ ပုံခွဲ PNG</button></div>'+
   '<p id="fcOV2Status" class="fc-ov2-status" role="status">ပေါက်ကြေးများ ရယူနေသည်…</p><div class="fc-ov2-preview" id="fcOV2Preview"></div><div class="fc-ov2-output" id="fcOV2Output"></div>';
  main.append(section);$("fcOV2Date").value=/^\d{4}-\d{2}-\d{2}$/.test(date)?date:today();
  $("fcOV2Date").onchange=()=>{date=$("fcOV2Date").value||today();load();};
  $("fcOV2League").onchange=render;$("fcOV2Refresh").onclick=load;
  $("fcOV2Single").onclick=()=>exportPng(1);$("fcOV2Split").onclick=()=>exportPng(2);
  $("fcOV2Top").onchange=async e=>{topBanner=await readFile(e.target.files?.[0]);render();};
  $("fcOV2Bottom").onchange=async e=>{bottomBanner=await readFile(e.target.files?.[0]);render();};
  const route=()=>{
   const v=location.hash==="#fcOddsV2";document.body.dataset.fcOddsView=v?"v2":"standard";
   link.classList.toggle("active",v);nav.querySelector('a[href="./odds.html"]')?.classList.toggle("active",!v);
  };window.addEventListener("hashchange",route);route();load();
 }
 function readFile(file){if(!file)return Promise.resolve("");return new Promise(ok=>{const reader=new FileReader();reader.onload=()=>ok(String(reader.result||""));reader.onerror=()=>ok("");reader.readAsDataURL(file);});}
 function groupsFor(rows){const map=new Map();for(const m of rows){const k=str(m.league)||"အခြားလိဂ်";if(!map.has(k))map.set(k,[]);map.get(k).push(m);}return [...map];}
 function makeSheet(rows,options={}){
  const root=document.createElement("div");root.className="fc-ov2-sheet";
  if(topBanner&&options.includeUploadedBanners!==false){const img=document.createElement("img");img.src=topBanner;img.style.cssText="width:100%;height:auto;max-height:260px;object-fit:contain;display:block";root.append(img);}
  const title=document.createElement("div");title.className="fc-ov2-title";title.textContent=(options.date||date)+" ရက်နေ့ · ပေါက်ကြေး Version 2";root.append(title);
  const table=document.createElement("table");table.className="fc-ov2-table";
  table.innerHTML='<colgroup><col style="width:8%"><col style="width:17%"><col style="width:3%"><col style="width:17%"><col style="width:14%"><col style="width:8%"><col style="width:8%"><col style="width:8%"><col style="width:8%"><col style="width:9%"></colgroup>'+
   '<thead><tr><th rowspan="2">အချိန်</th><th colspan="3" rowspan="2">တွေ့ဆုံသည့်အသင်း</th><th rowspan="2">အထက်အသင်း</th><th colspan="2">ဘော်ဒီကြေး</th><th colspan="2">ဂိုးပေါင်းကြေး</th><th rowspan="2">အင်တာနက်<br>ခန့်မှန်းချက်</th></tr><tr><th>မူလ</th><th>ယခု</th><th>မူလ</th><th>ယခု</th></tr></thead>';
  const body=document.createElement("tbody");
  for(const [league,list] of groupsFor(rows)){
   const tr=document.createElement("tr");tr.className="fc-ov2-league";const cell=document.createElement("td");cell.colSpan=10;cell.textContent=str(list[0].leagueDisplay||window.groups?.[league]||league);tr.append(cell);body.append(tr);
   for(const m of list){
    const row=document.createElement("tr");
    const clock=window.FutureCodeOddsClock?.short(m)||str(m.kickoffDisplay||m.kickoff||"—");
    const forecast=str(m.pdfLastColumn)||str(m.internetPrediction);
    const values=[clock,m.home,"နှင့်",m.away,m.upperTeam,m.bodyOdds,m.currentBodyOdds,m.goalTotalOdds,m.currentGoalTotalOdds,/^\d{1,2}-\d{1,2}$/.test(forecast)?forecast:""];
    values.forEach((value,index)=>{const cell=document.createElement("td");cell.textContent=index===6||index===8||index===9?str(value):num(value);if(index===0)cell.className="fc-ov2-time";if(index===2)cell.className="fc-ov2-versus";if(index===4)cell.className="fc-ov2-upper";row.append(cell);});
    body.append(row);
   }
  }
  table.append(body);root.append(table);
  if(bottomBanner&&options.includeUploadedBanners!==false){const img=document.createElement("img");img.src=bottomBanner;img.style.cssText="width:100%;height:auto;max-height:260px;object-fit:contain;display:block";root.append(img);}
  return root;
 }
 function selected(){if(!sheet)return [];const league=$("fcOV2League").value;return sheet.matches.filter(m=>league==="all"||m.league===league);}
 function render(){const view=$("fcOV2Preview");if(!view)return;view.replaceChildren();const rows=selected();if(rows.length)view.append(makeSheet(rows));$("fcOV2Status").textContent=rows.length+" ပွဲ · မူလကြေး/ယခုကြေးနှင့် PDF အင်တာနက်ခန့်မှန်းချက်ကို မူရင်းအတိုင်း ဖော်ပြထားသည်။";}
 async function load(){
  const id=++serial;$("fcOV2Status").textContent=date+" ပေါက်ကြေးရယူနေသည်…";
  try{
   const base=new URL("./data/odds/",document.baseURI),r=await (window.FootballData?.fetch||fetch)(new URL(date+".json",base),{cache:"no-store"});
   if(!r.ok)throw Error("ပေါက်ကြေးမရပါ");
   const raw=await r.json();if(raw.reportDate!==date||!Array.isArray(raw.matches))throw Error("နေ့စွဲမကိုက်ပါ");
   let merged=raw;
   try{const evening=await (window.FootballData?.fetch||fetch)(new URL("evening/"+date+".json",base),{cache:"no-store"});if(evening.ok&&typeof mergeLatestOdds==="function")merged=mergeLatestOdds(raw,await evening.json());}catch(e){console.info("ယခုကြေးမရပါ",e);}
   if(id!==serial)return;sheet=merged;const s=$("fcOV2League"),old=s.value;s.replaceChildren(new Option("လိဂ်အားလုံး","all"));
   [...new Set(sheet.matches.map(m=>m.league))].forEach(l=>s.add(new Option(sheet.matches.find(m=>m.league===l).leagueDisplay||l,l)));if([...s.options].some(o=>o.value===old))s.value=old;
   render();
  }catch(e){if(id!==serial)return;sheet=null;$("fcOV2Preview").replaceChildren();$("fcOV2Status").textContent=e.message;}
 }
 async function renderCanvas(rows,options={}){
  if(!Array.isArray(rows)||!rows.length)throw Error("ပေါက်ကြေး Version 2 ပွဲစဉ်မရှိပါ");
  if(typeof html2canvas!=="function")throw Error("Logo-free PNG module မရရှိပါ");
  await document.fonts?.ready;
  const sheet=makeSheet(rows,{includeUploadedBanners:false,date:options.date||date});
  sheet.style.cssText+=";position:fixed;left:-20000px;top:0;width:1200px;";
  document.body.append(sheet);
  try{
   const canvas=await html2canvas(sheet,{scale:1,backgroundColor:"#ffffff",useCORS:true,logging:false,windowWidth:1400});
   if(canvas.width!==1200)throw Error("ပေါက်ကြေးဇယား PNG အကျယ်မမှန်ပါ");
   return canvas;
  }finally{sheet.remove();}
 }
 async function exportPng(count){
  const rows=selected(),out=$("fcOV2Output");out.replaceChildren();urls.forEach(u=>URL.revokeObjectURL(u));urls=[];
  if(!rows.length){$("fcOV2Status").textContent="Download လုပ်ရန် ပွဲမရှိပါ";return;}
  if(typeof html2canvas!=="function"){$("fcOV2Status").textContent="PNG module မရရှိပါ";return;}
  await document.fonts?.ready;const groups=count===1?[rows]:[rows.slice(0,Math.ceil(rows.length/2)),rows.slice(Math.ceil(rows.length/2))].filter(x=>x.length);
  for(let i=0;i<groups.length;i++){
   const source=makeSheet(groups[i]);source.style.position="fixed";source.style.top="0";source.style.left="-20000px";source.style.width="1200px";document.body.append(source);
   try{
    $("fcOV2Status").textContent="PNG "+(i+1)+"/"+groups.length+" ပြင်ဆင်နေသည်…";
    await Promise.all([...source.querySelectorAll("img")].map(img=>img.decode().catch(()=>{})));
    const canvas=await html2canvas(source,{scale:2,backgroundColor:"#ffffff",useCORS:true,logging:false,windowWidth:1400});
    const blob=await new Promise((ok,bad)=>canvas.toBlob(b=>b?.size?ok(b):bad(Error("PNG မထွက်ပါ")),"image/png"));
    const url=URL.createObjectURL(blob);urls.push(url);
    const holder=document.createElement("div"),a=document.createElement("a");a.href=url;a.download="odds-v2-"+date+"-"+(i+1)+"-of-"+groups.length+".png";a.textContent="⬇ PNG "+(i+1)+"/"+groups.length+" Download";
    const image=document.createElement("img");image.src=url;image.alt="ပေါက်ကြေး V2 နမူနာ";
    holder.append(a,image);out.append(holder);if(groups.length===1)a.click();
   }catch(e){$("fcOV2Status").textContent="PNG မအောင်မြင်ပါ — "+e.message;break;}finally{source.remove();}
  }
  if(urls.length==groups.length)$("fcOV2Status").textContent=urls.length+" ပုံ ထုတ်ပြီးပါပြီ။ PNG လင့်ခ်များကို နှိပ်ယူနိုင်ပါသည်။";
 }
 window.FutureCodeOddsV2=Object.freeze({renderCanvas});
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup();
})();
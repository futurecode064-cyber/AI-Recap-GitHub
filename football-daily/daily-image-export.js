"use strict";
(function(){
 function safeDate(v){return /^\d{4}-\d{2}-\d{2}$/.test(v||"")?v:"unknown";}
 function verified(m){
  return m&&m.status==="finished"&&/^\d+\s*[-:]\s*\d+$/.test(String(m.finalScore||""));
 }
 async function saveOdds(data){
  if(!data||!Array.isArray(data.matches)||!data.matches.length)throw Error("No odds ready for image export");
  const live=document.getElementById("oddsList");
  if(!live)throw Error("The daily odds list is missing");
  const sourceRows=live.querySelectorAll(".odds-table tbody tr");
  if(sourceRows.length!==data.matches.length)throw Error("Not all daily fixtures are rendered yet");
  const wrap=document.createElement("div");
  wrap.className="odds-export-sheet";
  wrap.style.cssText="width:1180px;max-width:none;padding:24px;background:#101c20;box-sizing:border-box";
  const header=document.createElement("div");header.className="odds-export-header";
  const title=document.createElement("h2");title.textContent="ယနေ့ ပေါက်ကြေးများ";
  const day=document.createElement("p");day.textContent="မြန်မာစံတော်ချိန် · "+data.reportDate+" · "+data.matches.length+" ပွဲ";
  header.appendChild(title);header.appendChild(day);wrap.appendChild(header);
  const container=document.createElement("div");container.className="odds-export-content";
  // Every existing league table is cloned from the live website, not repainted
  // in custom canvas coordinates; keep the original header, logos and rows.
  for(const league of live.querySelectorAll(".odds-group"))container.appendChild(league.cloneNode(true));
  wrap.appendChild(container);
  const stage=document.createElement("div");
  stage.style.cssText="position:fixed;left:-20000px;top:0;width:1180px;z-index:-9999;pointer-events:none";
  stage.appendChild(wrap);document.body.appendChild(stage);
  try{
   return await window.FutureCodeDomCapture.save(wrap,"future-code-odds-"+safeDate(data.reportDate)+".png",{width:1180,excludeControls:false});
  }finally{stage.remove()}
 }
 async function saveResults({matches,date,renderResult}){
  const finals=Array.isArray(matches)?matches.filter(verified):[];
  if(!finals.length)throw Error("ပွဲပြီးအတည်ပြုထားသော ရလဒ်များ မရှိသေးပါ");
  if(typeof renderResult!=="function")throw Error("Result card renderer is unavailable");
  const wrap=document.createElement("div");
  wrap.className="results-export-sheet";
  wrap.style.cssText="width:1120px;max-width:none;background:#101c20;padding:24px;box-sizing:border-box";
  window.FutureCodeDomCapture.appendHeading(wrap,"ဂိုးရလဒ်များ",
    "မြန်မာစံတော်ချိန် · "+safeDate(date)+" · "+finals.length+" ပွဲပြီး");
  const list=document.createElement("div");list.className="matches";
  for(const m of finals)list.appendChild(renderResult(m));
  wrap.appendChild(list);
  const stage=document.createElement("div");
  stage.style.cssText="position:fixed;left:-20000px;top:0;width:1120px;z-index:-9999;pointer-events:none";
  stage.appendChild(wrap);document.body.appendChild(stage);
  try{
   return await window.FutureCodeDomCapture.save(wrap,"football-goal-results-"+safeDate(date)+".png",{width:1120,excludeControls:false});
  }finally{stage.remove()}
 }
 window.FutureCodeDailyExport={saveOdds,saveResults};
})();

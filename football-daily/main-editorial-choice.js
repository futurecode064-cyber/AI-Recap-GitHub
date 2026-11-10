"use strict";
/* Main channel only. Permanent source-of-truth selection label for V1 and exports. */
(function(){
  if(document.documentElement.dataset.footballBrandName)return;
  const style=document.createElement("style");
  style.textContent=".fc-editorial-selection{margin:18px auto 8px;padding:14px 22px;max-width:95%;width:fit-content;text-align:center;background:#092a39;border:2px solid #e8bd64;border-radius:8px;box-shadow:0 7px 20px #0003;color:#ffe082;font:900 22px/1.8 'Noto Sans Myanmar',sans-serif;overflow-wrap:anywhere}";
  document.head.appendChild(style);
  const clean=s=>String(s??"").replace(/\*\*/g,"").normalize("NFC").trim();
  function pick(m){
    if(!m)return "";
    const names=[clean(m.homeDisplay||m.home),clean(m.awayDisplay||m.away)].filter(Boolean);
    for(const field of ["previewV2Selection","editorialSelection","selectedTeam","selectionTeam"]){
      const value=clean(m[field]);
      if(value&&names.includes(value))return value;
    }
    const raw=clean(m.dailyPreviewText).slice(-480);
    const candidates=names.filter(name=>name&&(
      raw.includes(name+"ကို ရွေးချယ်ပါတယ်")||
      raw.includes(name+"အား ရွေးချယ်ပါတယ်")||
      raw.includes(name+"ကို ရွေးချယ်")||
      raw.includes(name+"ကို ရွေး")
    ));
    return candidates.length===1?candidates[0]:"";
  }
  function line(m){return "ရွေးချယ်မှု - "+(pick(m)||"အတည်မပြုရသေး");}
  function element(m){
    const box=document.createElement("div");
    box.className="fc-editorial-selection";
    box.setAttribute("role","note");
    box.textContent=line(m);
    return box;
  }
  function appendPng(source,m){
    if(!source||typeof source.getContext!=="function"||source.__fcEditorialChoiceAdded)return source;
    const width=source.width,height=source.height,extra=Math.max(100,Math.round(width*.085));
    const out=document.createElement("canvas");
    out.width=width;out.height=height+extra;
    const ctx=out.getContext("2d");
    if(!ctx)return source;
    ctx.drawImage(source,0,0);
    const margin=Math.round(width*.02),top=height+12,boxHeight=extra-24;
    ctx.fillStyle="#071b27";ctx.fillRect(0,height,width,extra);
    ctx.fillStyle="#0c3040";ctx.fillRect(margin,top,width-2*margin,boxHeight);
    ctx.strokeStyle="#edbd57";ctx.lineWidth=Math.max(2,width*.0025);
    ctx.strokeRect(margin+1,top+1,width-2*margin-2,boxHeight-2);
    ctx.fillStyle="#f9cd67";ctx.textBaseline="middle";ctx.textAlign="center";
    ctx.font="900 "+Math.round(width*.028)+'px "Noto Sans Myanmar",sans-serif';
    ctx.fillText(line(m),width/2,top+boxHeight/2,width-2*margin-24);
    out.__fcEditorialChoiceAdded=true;
    return out;
  }
  window.FutureCodeEditorialChoice=Object.freeze({pick,line,element,appendPng});
})();
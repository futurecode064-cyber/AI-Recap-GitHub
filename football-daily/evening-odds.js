"use strict";
(function(){
  // Shared by Future Code, YKZ, BW Sport and Ko Thet odds pages.
  const me=document.currentScript;
  const rootUrl=new URL("./",me&&me.src?me.src:document.baseURI);
  const style=document.createElement("link");
  style.rel="stylesheet";style.href=new URL("evening-odds.css?v=20261014-savefix-2",rootUrl).href;
  document.head.appendChild(style);

  const leagueLabels={
    "UEFA Champions League":"ချန်ပီယံလိဂ်",
    "Championship":"အင်္ဂလန် ချန်ပီယံရှစ်",
    "UEFA Europa League":"ယူရိုပါလိဂ်",
    "UEFA Conference League":"ယူရိုပါကွန်ဖရန့်လိဂ်"
  };
  function el(tag,cls,value){
    const e=document.createElement(tag);if(cls)e.className=cls;
    if(value!==undefined)e.textContent=String(value);return e;
  }
  function parseQuote(value){
    const s=String(value||"").trim();
    const m=/^(\d*)([+-])(\d+)$/.exec(s);
    if(m)return {line:m[1],value:(m[2]==="-"?-1:1)*Number(m[3]),valid:true};
    if(/^(\d+)=$/.test(s))return {line:s.slice(0,-1),value:0,valid:true};
    return {valid:false};
  }
  function difference(morning,evening){
    morning=String(morning);evening=String(evening);
    if(morning===evening)return {text:"မပြောင်း",kind:"same"};
    const a=parseQuote(morning),b=parseQuote(evening);
    if(!a.valid||!b.valid)return {text:morning+" → "+evening,kind:"changed"};
    if(a.line!==b.line){
      return {text:"လိုင်း "+(a.line||"—")+" → "+(b.line||"—")+" · ကြေး "+(a.value>=0?"+":"")+a.value+" → "+(b.value>=0?"+":"")+b.value,kind:"line"};
    }
    const d=b.value-a.value;
    if(!d)return {text:"မပြောင်း",kind:"same"};
    return {text:(d>0?"+":"")+d+" မှတ်",kind:d>0?"up":"down"};
  }
  function tableFor(league,matches){
    const section=el("section","evening-league");
    section.appendChild(el("h3","evening-league-title",leagueLabels[league]||league));
    const scroll=el("div","evening-table-scroll"),table=el("table","evening-table");
    const thead=el("thead"),group=el("tr"),titles=el("tr");
    for(const name of ["ပွဲချိန်","တွေ့ဆုံမည့်အသင်း","ကြေးပေးအသင်း"]){
      const th=el("th","",name);th.rowSpan=2;group.appendChild(th);
    }
    for(const name of ["ဘော်ဒီကြေး","ဂိုးပေါင်းကြေး"]){
      const th=el("th","",name);th.colSpan=3;group.appendChild(th);
    }
    for(const name of ["မနက် (မူလ)","ညနေ (ယခု)","ကွာခြားချက်","မနက် (မူလ)","ညနေ (ယခု)","ကွာခြားချက်"])
      titles.appendChild(el("th","",name));
    thead.appendChild(group);thead.appendChild(titles);table.appendChild(thead);
    const body=el("tbody");
    for(const m of matches){
      const tr=el("tr");
      tr.appendChild(el("td","evening-time",m.kickoffDisplay));
      const pair=el("td","evening-pair");
      const a=el("span","",m.home),b=el("span","",m.away);
      pair.appendChild(a);pair.appendChild(el("span","evening-vs","VS"));pair.appendChild(b);
      tr.appendChild(pair);
      tr.appendChild(el("td","evening-upper",m.upperTeam));
      const fields=[
        ["morningBodyOdds","eveningBodyOdds"],
        ["morningGoalTotalOdds","eveningGoalTotalOdds"]
      ];
      for(const [oldKey,newKey] of fields){
        tr.appendChild(el("td","evening-quote",m[oldKey]));
        tr.appendChild(el("td","evening-quote latest",m[newKey]));
        const delta=difference(m[oldKey],m[newKey]);
        tr.appendChild(el("td","evening-difference is-"+delta.kind,delta.text));
      }
      body.appendChild(tr);
    }
    table.appendChild(body);scroll.appendChild(table);section.appendChild(scroll);
    return section;
  }
  function groupMatches(matches){
    const groups=new Map();
    for(const m of matches){if(!groups.has(m.league))groups.set(m.league,[]);groups.get(m.league).push(m);}
    return [...groups];
  }
  function brandPalette(){
    const id=window.FutureCodeBrandConfig?.id||"future-code";
    return id==="ykz-family"?{header:"#aa111b",deep:"#650409",accent:"#ffd36b"}:
           id==="bw-sport"?{header:"#0856c4",deep:"#072d77",accent:"#d9eefe"}:
           id==="ko-thet-family"?{header:"#830b15",deep:"#45060c",accent:"#ffdc78"}:
           {header:"#215c55",deep:"#163e3b",accent:"#ffcb92"};
  }
  // A direct click on an asynchronous blob link can be blocked by mobile browsers.
  // Keep a visible, user-clickable PNG link and image preview as a reliable fallback.
  function showPngPreview(canvas,filename){
    if(typeof canvas.toDataURL!=="function")throw Error("PNG image preview unavailable");
    const pngUrl=canvas.toDataURL("image/png");
    if(!/^data:image\/png;base64,/i.test(pngUrl))throw Error("PNG encoding failed");
    document.getElementById("eveningPngPreview")?.remove();
    const backdrop=el("div","evening-preview-backdrop");
    backdrop.id="eveningPngPreview";
    backdrop.setAttribute("role","dialog");
    backdrop.setAttribute("aria-modal","true");
    backdrop.setAttribute("aria-label","ညနေခင်းကြေးပြောင်း PNG");
    const panel=el("div","evening-preview-panel");
    const bar=el("div","evening-preview-top");
    const heading=el("h3","","ညနေခင်းကြေးပြောင်း — PNG ပုံ");
    const close=el("button","evening-preview-close","✕ ပိတ်ရန်");
    close.type="button";
    const dismiss=()=>backdrop.remove();
    close.addEventListener("click",dismiss);
    backdrop.addEventListener("click",event=>{if(event.target===backdrop)dismiss();});
    bar.appendChild(heading);bar.appendChild(close);panel.appendChild(bar);
    const actions=el("div","evening-preview-actions");
    const save=el("a","evening-preview-save","⬇ PNG Download / Save");
    save.href=pngUrl;save.download=filename;
    save.setAttribute("aria-label",filename+" PNG ပုံကို သိမ်းရန်");
    const open=el("a","evening-preview-open","ပုံကို သီးသန့်ဖွင့်ရန်");
    open.href=pngUrl;open.target="_blank";open.rel="noopener";
    actions.appendChild(save);actions.appendChild(open);panel.appendChild(actions);
    panel.appendChild(el("p","evening-preview-help","Download မစတင်ပါက အပေါ်က Save ကို ထပ်နှိပ်ပါ။ ဖုန်းမှာ ပုံကို ဖိထားပြီး Save Image လည်း လုပ်နိုင်ပါတယ်။"));
    const img=el("img","evening-preview-image");
    img.src=pngUrl;img.alt="ညနေခင်းကြေးပြောင်း PNG Preview";
    panel.appendChild(img);backdrop.appendChild(panel);document.body.appendChild(backdrop);
    // Attempt immediate save; fallback link remains available even if the device blocks it.
    try{save.click();}catch(err){console.info("Manual PNG Save link available",err);}
  }
  function bindDownload(button,data,league){
    const label=button.textContent;
    button.addEventListener("click",async()=>{
      if(button.disabled)return;
      button.disabled=true;button.textContent="PNG ပုံပြင်ဆင်နေသည်…";
      try{
        await png(data,league);
        button.textContent="✓ PNG ပုံ ဖွင့်ပြီးပါပြီ";
      }catch(err){
        console.error("Evening odds PNG error",err);
        button.textContent="PNG ထုတ်မရပါ — ပြန်နှိပ်ပါ";
        const existing=document.getElementById("eveningPngError");
        existing?.remove();
        const notice=el("p","evening-preview-error","PNG ပုံထုတ်မရသေးပါ။ Browser မှာ ပြန်စမ်းပါ။");
        notice.id="eveningPngError";
        button.parentNode.appendChild(notice);
      }finally{
        button.disabled=false;
        setTimeout(()=>{if(button.isConnected)button.textContent=label;},3500);
      }
    });
  }
  // The approved PNG is rendered once on GitHub and served as a real image file.
  // A normal HTTPS file link works even when a mobile WebView cannot encode Canvas.
  function png(data,onlyLeague){
    const brand=window.FutureCodeBrandConfig?.id||"future-code";
    const leagueSlug=onlyLeague?onlyLeague.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""):"all";
    const fileName=brand+"-"+leagueSlug+".png";
    const fileUrl=new URL("data/odds/evening/png/"+data.reportDate+"/"+fileName,rootUrl).href;
    document.getElementById("eveningPngPreview")?.remove();
    const backdrop=el("div","evening-preview-backdrop");
    backdrop.id="eveningPngPreview";
    backdrop.setAttribute("role","dialog");
    backdrop.setAttribute("aria-modal","true");
    backdrop.setAttribute("aria-label","ညနေခင်းကြေးပြောင်း PNG");
    const panel=el("div","evening-preview-panel");
    const bar=el("div","evening-preview-top");
    bar.appendChild(el("h3","","ညနေခင်းကြေးပြောင်း — PNG"));
    const close=el("button","evening-preview-close","✕ ပိတ်ရန်");
    close.type="button";close.addEventListener("click",()=>backdrop.remove());
    backdrop.addEventListener("click",e=>{if(e.target===backdrop)backdrop.remove();});
    bar.appendChild(close);panel.appendChild(bar);
    const actions=el("div","evening-preview-actions");
    const save=el("a","evening-preview-save","⬇ PNG Download / Save");
    save.href=fileUrl;save.download=fileName;
    const open=el("a","evening-preview-open","ပုံကို သီးသန့်ဖွင့်ရန်");
    open.href=fileUrl;open.target="_blank";open.rel="noopener";
    actions.appendChild(save);actions.appendChild(open);panel.appendChild(actions);
    panel.appendChild(el("p","evening-preview-help","Download မရပါက Save ကို ထပ်နှိပ်ပါ။ ဖုန်းမှာ အောက်ကပုံကို ဖိထားပြီး Save Image လုပ်နိုင်ပါတယ်။"));
    const preview=el("img","evening-preview-image");
    preview.alt="ညနေခင်းကြေးပြောင်း PNG";
    preview.src=fileUrl;
    preview.addEventListener("error",()=>{
      const warning=el("p","evening-preview-error","ပုံဖိုင်ကို Server မှ မရရှိသေးပါ။");
      panel.appendChild(warning);
    });
    panel.appendChild(preview);backdrop.appendChild(panel);document.body.appendChild(backdrop);
    // This is a direct HTTPS PNG download, not an asynchronous Canvas blob/data URL.
    try{save.click();}catch(err){console.info("Manual PNG link remains available",err);}
  }
  function boot(){
    const main=document.querySelector(".odds-content");
    if(!main)return;
    const section=el("section","evening-odds-section");
    section.id="eveningOddsSection";section.hidden=true;
    const header=el("div","evening-head");
    const heading=el("h2","", "ညနေခင်းကြေးပြောင်း");
    header.appendChild(heading);section.appendChild(header);
    const line=el("p","evening-summary","");section.appendChild(line);
    const actions=el("div","evening-actions"),allButton=el("button","evening-png-btn","⬇ ညနေခင်းကြေးပြောင်း PNG Download");
    allButton.type="button";allButton.disabled=true;
    actions.appendChild(allButton);section.appendChild(actions);
    const root=el("div","evening-group-list");section.appendChild(root);
    main.appendChild(section);
    const link=el("a","evening-nav-link","ညနေခင်းကြေးပြောင်း");
    link.href="#eveningOddsSection";
    document.querySelector(".odds-nav")?.appendChild(link);
    const params=new URLSearchParams(location.search);
    const day=/^\d{4}-\d{2}-\d{2}$/.test(params.get("date")||"")?params.get("date"):
       (()=>{const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Yangon",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return p.year+"-"+p.month+"-"+p.day;})();
    (window.FootballData?window.FootballData.fetch:fetch)(new URL("data/odds/evening/"+day+".json",rootUrl),{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("No evening update");return r.json();}).then(data=>{
      if(!Array.isArray(data.matches)||data.reportDate!==day)throw Error("Invalid evening data");
      section.hidden=false;link.hidden=false;
      line.textContent=data.reportDate.split("-").reverse().join("/")+" · "+data.matches.length+" ပွဲ";
      const groups=groupMatches(data.matches);
      for(const [league,items] of groups){
        const holder=el("div","evening-competition");
        const leagueActions=el("div","evening-league-actions"),button=el("button","evening-league-png","⬇ ဒီလိဂ် PNG");
        button.type="button";
        bindDownload(button,data,league);
        leagueActions.appendChild(button);holder.appendChild(leagueActions);holder.appendChild(tableFor(league,items));root.appendChild(holder);
      }
      allButton.disabled=false;
      bindDownload(allButton,data,null);
    }).catch(e=>{console.info("Evening odds not available for this date",e);section.remove();link.remove();});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);
  else boot();
  window.FutureCodeEveningOdds={parseQuote,difference,showPngPreview,png};
})();

"use strict";
/* Main Future Code website ONLY: verified results -> original brand-frame PNGs.
   Branded mirrors do not load this file. No prediction/fixture is treated as a result. */
(function(){
  if(document.documentElement.dataset.footballBrandName || !["/","/index.html"].includes(location.pathname))return;

  const ROOT="./assets/table-odds-frames/";
  const FRAMES=[
    {id:"best",title:"BEST YOUR CHOICE",color:"#161cbe",dark:"#050e52",accent:"#cad7ff",
     top:ROOT+"best-top.jpg",bottom:ROOT+"best-bottom.jpg"},
    {id:"htet",title:"HTET KO",color:"#126c21",dark:"#07370d",accent:"#f4edaa",
     top:ROOT+"htet-top.jpg",bottom:ROOT+"htet-bottom.jpg"},
    {id:"kotwat",title:"ကိုတွတ်ပီ",color:"#ba1114",dark:"#520608",accent:"#ffca9a",
     artwork:ROOT+"ko-tut-pi-frame.jpg",topFraction:0.29,bottomFraction:0.21},
    {id:"plain",title:"Frame မပါ — စိတ်ကြိုက်အရောင်",color:"#1560a0",dark:"#0a304c",plain:true}
  ];
  const LEAGUES={
    "Premier League":"အင်္ဂလန် ပရီးမီးယားလိဂ်",
    "Championship":"အင်္ဂလန် ချန်ပီယံရှစ်","League One":"အင်္ဂလန် လိဂ်ဝမ်း",
    "Serie A":"အီတလီ စီးရီးအေ","Serie B":"အီတလီ စီးရီးဘီ",
    "La Liga":"စပိန် လာလီဂါ","La Liga 2":"စပိန် လာလီဂါ ၂",
    "Bundesliga":"ဂျာမနီ ဘွန်ဒက်စ်လီဂါ","2. Bundesliga":"ဂျာမနီ ဘွန်ဒက်စ်လီဂါ ၂",
    "Ligue 1":"ပြင်သစ် လီဂူးဝမ်း","Ligue 2":"ပြင်သစ် လီဂူး ၂",
    "FA Cup":"အင်္ဂလန် FA ဖလား","EFL Cup":"အင်္ဂလန် လိဂ်ဖလား",
    "Coppa Italia":"အီတလီဖလား","Copa del Rey":"စပိန် ဘုရင့်ဖလား",
    "DFB-Pokal":"ဂျာမနီဖလား","Coupe de France":"ပြင်သစ်ဖလား",
    "UEFA Champions League":"ချန်ပီယံလိဂ်",
    "UEFA Europa League":"ယူရိုပါလိဂ်",
    "UEFA Conference League":"ယူရိုပါ ကွန်ဖရင့်လိဂ်",
    "UEFA Nations League":"နေးရှင်းလိဂ်",
    "FIFA World Cup":"ကမ္ဘာ့ဖလား","FIFA World Cup Qualifying":"ကမ္ဘာ့ဖလား ခြေစစ်ပွဲ",
    "UEFA Euro":"ယူရိုပြိုင်ပွဲ"
  };
  const LEAGUE_BADGES={
    "Premier League":"league-pl.png","Serie A":"league-sa.png",
    "La Liga":"league-pd.png","Bundesliga":"league-bl.png",
    "Ligue 1":"league-fl.png"
  };
  // The plain design has no frame artwork, brand name or sponsor banner.
  // An unrestricted HTML color picker controls its background, league bars and score badges.
  function withColor(frame,value){
    if(!frame.plain)return frame;
    const color=/^#[0-9a-fA-F]{6}$/.test(String(value||""))?String(value):"#1560a0";
    const rgb=color.slice(1).match(/../g).map(hex=>parseInt(hex,16));
    const dark="#"+rgb.map(n=>Math.round(n*0.45).toString(16).padStart(2,"0")).join("");
    const light=(rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722)/255;
    return {...frame,color,dark,scoreInk:light>0.60?"#17252c":"#ffffff"};
  }
  const imgCache=new Map();
  const isFinal=m=>m&&m.status==="finished"&&/^\d+\s*[-:]\s*\d+$/.test(String(m.finalScore||""));
  const team=(m,side)=>String(m[side+"Display"]||m[side]||"—").trim();
  function yesterdayYangon(){
    const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Yangon",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
    const p=Object.fromEntries(parts.filter(x=>x.type!=="literal").map(x=>[x.type,x.value]));
    const d=new Date(p.year+"-"+p.month+"-"+p.day+"T12:00:00Z");
    d.setUTCDate(d.getUTCDate()-1);
    return d.toISOString().slice(0,10);
  }
  function split(rows,mode){
    if(rows.length>1&&(mode==="two"||(mode==="auto"&&rows.length>12))){
      const half=Math.ceil(rows.length/2);
      return [rows.slice(0,half),rows.slice(half)];
    }
    return [rows];
  }
  function loadAsset(src){
    if(!imgCache.has(src)){
      imgCache.set(src,new Promise((resolve,reject)=>{
        const img=new Image();
        img.onload=()=>resolve(img);
        img.onerror=()=>reject(Error("Frame ပုံ မရရှိပါ: "+src));
        img.src=src;
      }));
    }
    return imgCache.get(src);
  }
  function sections(rows){
    const groups=new Map();
    for(const row of rows){
      const name=String(row.league||"အခြားပြိုင်ပွဲ");
      if(!groups.has(name))groups.set(name,[]);
      groups.get(name).push(row);
    }
    return [...groups];
  }
  function drawText(kit,ctx,value,x,y,maxWidth,baseSize,color,align){
    const size=kit.fit(ctx,value,maxWidth,baseSize,17);
    kit.text(ctx,value,x,y,size,color,true,align,maxWidth);
  }
  async function makePng(rows,frame,date){
    if(!rows.length||rows.some(m=>!isFinal(m)))throw Error("အတည်ပြုထားသော ပွဲပြီးရလဒ်များသာ PNG ထုတ်နိုင်ပါသည်။");
    const kit=window.FutureCodeCanvasKit;
    if(!kit)throw Error("PNG ဖန်တီးမှုစနစ် ရယူမရပါ။ Refresh လုပ်ပါ။");
    await kit.fonts();
    const allUrls=rows.flatMap(m=>[m.homeCrestUrl,m.awayCrestUrl]).filter(Boolean);
    await kit.preloadImages(allUrls);
    const groups=sections(rows),W=1200,M=22,ROW=92,LEAGUE=62;
    let top=null,bottom=null,artwork=null,th=0,bh=0,sourceTop=0,sourceBottom=0;
    if(frame.plain){
      // No source image loads, logos or frame/bottom banners on a plain export.
    }else if(frame.artwork){
      artwork=await loadAsset(frame.artwork);
      sourceTop=Math.round(artwork.height*frame.topFraction);
      sourceBottom=Math.round(artwork.height*frame.bottomFraction);
      th=Math.round(sourceTop*W/artwork.width);
      bh=Math.round(sourceBottom*W/artwork.width);
    }else{
      [top,bottom]=await Promise.all([loadAsset(frame.top),loadAsset(frame.bottom)]);
      th=Math.round(top.height*W/top.width);
      bh=Math.round(bottom.height*W/bottom.width);
    }
    const H=th+92+groups.length*(LEAGUE+12)+rows.length*ROW+bh+28;
    const {canvas,ctx}=kit.create(W,H);
    const background=ctx.createLinearGradient(0,0,W,H);
    background.addColorStop(0,frame.dark);background.addColorStop(0.55,frame.color);
    background.addColorStop(1,frame.dark);
    kit.fill(ctx,0,0,W,H,background);
    if(artwork){
      if(sourceTop)ctx.drawImage(artwork,0,0,artwork.width,sourceTop,0,0,W,th);
    }else if(top)ctx.drawImage(top,0,0,W,th);
    let y=th;
    kit.fill(ctx,M,y+12,W-M*2,62,frame.dark,9);
    const showDate=date.split("-").reverse().join(".");
    kit.text(ctx,"("+showDate+" ရက်နေ့ ပွဲပြီး ဂိုးရလဒ်များ)",W/2,y+44,27,"#ffffff",true,"center",W-90);
    y+=92;

    for(const [league,items] of groups){
      kit.fill(ctx,M,y,W-M*2,LEAGUE,frame.dark,7);
      let start=76;
      const badge=LEAGUE_BADGES[league];
      if(badge){
        const logo=await loadAsset(ROOT+badge);
        kit.fill(ctx,M+10,y+7,48,48,"#ffffff",7);
        ctx.drawImage(logo,M+13,y+11,42,39);
        start=86;
      }
      drawText(kit,ctx,LEAGUES[league]||league,M+start,y+31,W-M*2-start-18,29,"#ffffff","left");
      y+=LEAGUE+10;
      for(const match of items){
        kit.fill(ctx,M,y,W-M*2,ROW-3,"#ffffff",3);
        kit.fill(ctx,M,y,7,ROW-3,frame.color);
        kit.crest(ctx,match.homeCrestUrl,M+21,y+12,61,team(match,"home"));
        kit.crest(ctx,match.awayCrestUrl,W-M-82,y+12,61,team(match,"away"));
        drawText(kit,ctx,team(match,"home"),M+100,y+45,326,28,"#15232d","left");
        drawText(kit,ctx,team(match,"away"),W-M-100,y+45,326,28,"#15232d","right");
        kit.fill(ctx,W/2-81,y+12,162,65,frame.color,9);
        kit.text(ctx,String(match.finalScore).replace(":"," - "),W/2,y+43,32,frame.scoreInk||"#ffffff",true,"center",152);
        kit.fill(ctx,M+92,y+79,W-M*2-184,1,"#dde2e6");
        y+=ROW;
      }
      y+=2;
    }
    if(artwork&&sourceBottom){
      ctx.drawImage(artwork,0,artwork.height-sourceBottom,artwork.width,sourceBottom,0,H-bh,W,bh);
    }else if(bottom)ctx.drawImage(bottom,0,H-bh,W,bh);
    return canvas;
  }
  function init(){
    const bar=document.getElementById("resultsDownloadBar");
    const previous=document.querySelector('#dateTabs button[data-day="-1"]');
    if(!bar||!previous)return;
    const studio=document.createElement("section");
    studio.id="mainResultsFrameStudio";
    studio.className="results-frame-studio";
    studio.setAttribute("aria-label","ဂိုးရလဒ် Frame PNG Download");
    studio.innerHTML=
      '<h3>ဂိုးရလဒ် Frame PNG Download</h3>'+
      '<p>Frame ၃ မျိုး သို့မဟုတ် Frame မပါသော စိတ်ကြိုက်အရောင်ကို ရွေးပြီး အသင်းလိုဂို၊ မြန်မာအသင်းအမည်နှင့် အတည်ပြုဂိုးရလဒ်များကို PNG ထုတ်နိုင်ပါသည်။</p>'+
      '<div class="rfs-controls"><label>Frame ရွေးရန် <select id="rfsFrame"></select></label>'+
      '<label id="rfsColourWrap" hidden>စိတ်ကြိုက်အရောင် <input type="color" id="rfsColour" value="#1560a0" aria-label="ဂိုးရလဒ် PNG နောက်ခံအရောင်"></label>'+
      '<label>ပုံခွဲရန် <select id="rfsSplit"><option value="auto">ပွဲများလျှင် တစ်ဝက်စီ ၂ ပုံ</option><option value="two">တစ်ဝက်စီ ၂ ပုံ</option><option value="one">ပုံတစ်ပုံတည်း</option></select></label></div>'+
      '<fieldset class="rfs-fieldset"><legend>ပါဝင်စေချင်သော လိဂ်များ ရွေးပါ</legend>'+
      '<div class="rfs-choices" id="rfsLeagues"></div>'+
      '<div class="rfs-actions"><button type="button" id="rfsAll">လိဂ်အားလုံးရွေး</button><button type="button" id="rfsNone">ရွေးချယ်မှုဖြုတ်</button></div></fieldset>'+
      '<div class="rfs-actions"><button type="button" id="rfsPreview">နမူနာကြည့်မယ်</button>'+
      '<button type="button" id="rfsExport" class="rfs-export">⬇ Frame PNG Download</button></div>'+
      '<p id="rfsStatus" role="status" aria-live="polite">မနေ့က ဂိုးရလဒ်များ ရယူနေသည်…</p>'+
      '<div id="rfsOutput" class="rfs-output"></div>';
    bar.appendChild(studio);

    const style=document.createElement("style");
    style.textContent=[
      '.results-frame-studio{width:100%;padding:16px 18px;background:#12272c;border:1px solid #4c7774;border-radius:13px;color:#f2f5f1;}',
      '.results-frame-studio h3{margin:0 0 8px;color:#ffce9e;font-size:19px;}',
      '.results-frame-studio p{margin:6px 0 13px;font-size:12px;line-height:1.9;color:#d2e2df;}',
      '.results-frame-studio .rfs-controls,.results-frame-studio .rfs-actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:12px 0;}',
      '.results-frame-studio label{display:flex;align-items:center;gap:9px;font-size:13px;line-height:2;}',
      '.results-frame-studio select{padding:11px;border:1px solid #78958e;background:#edf2ed;color:#19332e;border-radius:8px;max-width:100%;}',
      '.results-frame-studio button{border:1px solid #bfbbae;border-radius:8px;padding:10px 16px;background:#e8e9e2;color:#19352d;font-weight:750;}',
      '.results-frame-studio button.rfs-export{background:#ffa65d;border-color:#ffd4ae;}',
      '.results-frame-studio button:disabled,.results-frame-studio select:disabled{opacity:.5;cursor:wait;}',
      '.results-frame-studio .rfs-fieldset{border:1px solid #486b67;border-radius:11px;padding:10px 13px;}',
      '.results-frame-studio .rfs-choices{display:flex;flex-wrap:wrap;gap:8px 15px;}',
      '.results-frame-studio .rfs-choices label{font-size:12px;line-height:1.7;}',
      '.results-frame-studio .rfs-choices input{accent-color:#ffbb8b;}',
      '.results-frame-studio [hidden]{display:none!important;}',
      '.results-frame-studio input[type=color]{width:64px;height:43px;background:transparent;border:1px solid #78958e;border-radius:8px;padding:3px;cursor:pointer;}',
      '.results-frame-studio .rfs-output{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:16px;}',
      '.results-frame-studio .rfs-page{min-width:0;border:1px solid #52736e;background:#1a3034;border-radius:10px;padding:11px;}',
      '.results-frame-studio .rfs-page a{display:block;border-radius:8px;padding:11px 12px;background:#ffc490;text-align:center;color:#16262a;font-weight:800;text-decoration:none;}',
      '.results-frame-studio .rfs-page img{display:block;width:100%;margin-top:12px;border-radius:5px;background:#fff;}',
      '@media(max-width:600px){.results-frame-studio{padding:12px}.results-frame-studio label{flex-wrap:wrap;width:100%;}.results-frame-studio select{width:100%;}}'
    ].join("");
    document.head.appendChild(style);
    const el=id=>studio.querySelector("#"+id);
    for(const f of FRAMES)el("rfsFrame").add(new Option(f.title,f.id));
    const showColour=()=>{el("rfsColourWrap").hidden=el("rfsFrame").value!=="plain";};
    el("rfsFrame").addEventListener("change",showColour);
    showColour();
    let matches=[],date="",busy=false,sequence=0,urls=[];
    const status=message=>{el("rfsStatus").textContent=message;};
    function cleanup(){
      urls.forEach(u=>URL.revokeObjectURL(u));
      urls=[];
      el("rfsOutput").replaceChildren();
    }
    function buildLeagues(){
      const selected=new Set([...el("rfsLeagues").querySelectorAll("input:checked")].map(i=>i.value));
      el("rfsLeagues").replaceChildren();
      for(const league of new Set(matches.map(m=>String(m.league||"အခြားပြိုင်ပွဲ")))){
        const label=document.createElement("label");
        const input=document.createElement("input");input.type="checkbox";input.value=league;
        input.checked=selected.size===0||selected.has(league);
        label.append(input,document.createTextNode(LEAGUES[league]||league));
        el("rfsLeagues").append(label);
      }
    }
    async function refresh(){
      const mySequence=++sequence;
      const target=yesterdayYangon();
      status("မနေ့က အတည်ပြုဂိုးရလဒ်များ ရယူနေသည်…");
      try{
        const res=await fetch("./data/archive/"+target+".json?frame="+Date.now(),{cache:"no-store"});
        if(mySequence!==sequence)return;
        if(!res.ok)throw Error("မနေ့က ဂိုးရလဒ်စာရင်း မရသေးပါ။");
        const data=await res.json();
        if(mySequence!==sequence)return;
        if(data.reportDate!==target||data.published!==true||!Array.isArray(data.matches))throw Error("အတည်ပြုထားသော ဂိုးရလဒ်စာရင်း မရှိသေးပါ။");
        matches=data.matches.filter(isFinal);
        date=target;
        buildLeagues();cleanup();
        status(matches.length?matches.length+" ပွဲ အတည်ပြုဂိုးရလဒ် ရရှိထားပါသည်။ Frame နှင့် လိဂ်ရွေးပြီး PNG ထုတ်ပါ။":"မနေ့က အတည်ပြုထားသော ပွဲပြီးဂိုးရလဒ် မရှိသေးပါ။");
      }catch(err){
        if(mySequence!==sequence)return;
        matches=[];date="";el("rfsLeagues").replaceChildren();cleanup();
        status(err.message||"ဂိုးရလဒ်များ ရယူမရပါ။");
      }
    }
    const disable=state=>{busy=state;studio.querySelectorAll("button,select,input").forEach(x=>x.disabled=state);};
    async function run(download){
      if(busy)return;
      const selected=new Set([...el("rfsLeagues").querySelectorAll("input:checked")].map(x=>x.value));
      const list=matches.filter(m=>selected.has(String(m.league||"အခြားပြိုင်ပွဲ")));
      if(!list.length){status("အတည်ပြုပြီးသား ပွဲနှင့် လိဂ်တစ်ခု အနည်းဆုံး ရွေးပါ။");return;}
      const chosen=FRAMES.find(f=>f.id===el("rfsFrame").value)||FRAMES[0];
      const frame=withColor(chosen,el("rfsColour").value);
      const pages=split(list,el("rfsSplit").value);
      cleanup();disable(true);
      try{
        for(let i=0;i<pages.length;i++){
          status("Frame "+frame.title+" · ပုံ "+(i+1)+"/"+pages.length+" ဖန်တီးနေသည်…");
          const canvas=await makePng(pages[i],frame,date);
          const blob=await new Promise((resolve,reject)=>{
            canvas.toBlob(b=>b&&b.size?resolve(b):reject(Error("PNG ဖန်တီးမရပါ")),"image/png");
          });
          const url=URL.createObjectURL(blob);urls.push(url);
          const page=document.createElement("div");page.className="rfs-page";
          const link=document.createElement("a");link.href=url;
          link.download=(frame.plain?"goal-results-color":frame.id+"-results")+"-"+date+
            (pages.length>1?"-"+(i+1)+"-of-"+pages.length:"")+".png";
          link.textContent="⬇ ပုံ "+(i+1)+"/"+pages.length+" PNG Download · "+pages[i].length+" ပွဲ";
          const img=document.createElement("img");img.src=url;img.alt=frame.title+" ဂိုးရလဒ် PNG "+(i+1);
          img.loading="lazy";
          page.append(link,img);el("rfsOutput").append(page);
          if(download&&pages.length===1)link.click();
        }
        status(list.length+" ပွဲ · "+pages.length+" ပုံ ပြင်ဆင်ပြီးပါပြီ။ "+(pages.length>1?"အောက်က PNG Download ကို တစ်ပုံချင်းနှိပ်ယူပါ။":""));
      }catch(err){
        console.error("Main results frame export failed",err);
        status("PNG ဖန်တီးမရပါ — "+(err.message||"ပြန်စမ်းပါ။"));
      }finally{disable(false);}
    }
    el("rfsPreview").addEventListener("click",()=>run(false));
    el("rfsExport").addEventListener("click",()=>run(true));
    el("rfsAll").addEventListener("click",()=>el("rfsLeagues").querySelectorAll("input").forEach(x=>x.checked=true));
    el("rfsNone").addEventListener("click",()=>el("rfsLeagues").querySelectorAll("input").forEach(x=>x.checked=false));
    previous.addEventListener("click",refresh);
    document.getElementById("reloadBtn")?.addEventListener("click",()=>{
      if(document.body.dataset.fcMainView==="yesterday")refresh();
    });
    refresh();
  }
  window.FutureCodeResultsFrames={frames:FRAMES,split,isFinal,yesterdayYangon,makePng,withColor};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
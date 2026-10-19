"use strict";
/* GOAL ZONE only. Does not alter any shared/mirror download rules. */
(function () {
  if (document.documentElement.dataset.footballBrandName !== "ဂိုးဇုံ အားကစား ဂျာနယ်") return;

  const ROOT = new URL("../data/", document.baseURI);
  const artwork = new URL("./assets/goal-zone-download-banner.webp", document.baseURI).href;
  const brandLogo = new URL("./assets/logo.webp", document.baseURI).href;
  const imagePromises = new Map();
  const $ = id => document.getElementById(id);
  const day = () => {
    const p = new Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Yangon", year:"numeric", month:"2-digit", day:"2-digit"}).formatToParts(new Date());
    const m = Object.fromEntries(p.map(x => [x.type, x.value]));
    return m.year+"-"+m.month+"-"+m.day;
  };
  const yesterday = date => {
    const d = new Date(date+"T12:00:00Z");
    d.setUTCDate(d.getUTCDate()-1);
    return d.toISOString().slice(0,10);
  };
  const safeName = s => String(s||"football").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,42)||"team";
  const loadImage = url => {
    if (!imagePromises.has(url)) imagePromises.set(url, new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    }));
    return imagePromises.get(url);
  };
  function cover(ctx,img,x,y,w,h){
    if (!img || !img.naturalWidth || !img.naturalHeight) return;
    const s = Math.max(w/img.naturalWidth,h/img.naturalHeight);
    const sw = w/s, sh = h/s;
    ctx.drawImage(img,(img.naturalWidth-sw)/2,(img.naturalHeight-sh)/2,sw,sh,x,y,w,h);
  }
  async function bannerCanvas(source){
    const w=source.width, h=Math.max(160,Math.round(w*270/988));
    const out=document.createElement("canvas");
    out.width=w;out.height=source.height+h;
    const ctx=out.getContext("2d");
    if (!ctx) throw Error("Canvas 2D unavailable");
    ctx.fillStyle="#080808";ctx.fillRect(0,0,w,h);
    const banner=await loadImage(artwork);
    if(banner){
      ctx.drawImage(banner,0,0,w,h);
    }else{
      // Fall back to a clear Goal Zone heading when the asset cannot load.
      const logo=await loadImage(brandLogo);
      const stadium=await loadImage(new URL("./assets/football-gold-stadium.webp",document.baseURI).href);
      cover(ctx,stadium,0,0,w,h);
      ctx.fillStyle="rgba(0,0,0,.62)";ctx.fillRect(0,0,w,h);
      if(logo){
        const size=h*.92;ctx.drawImage(logo,(w-size)/2,(h-size)/2,size,size);
      }else{
        ctx.fillStyle="#f7cf73";ctx.textAlign="center";ctx.font="900 "+Math.round(h*.22)+"px sans-serif";
        ctx.fillText("GOAL ZONE",w/2,h*.52);
      }
    }
    ctx.drawImage(source,0,h);
    return out;
  }
  function toBlob(canvas){
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(Error("PNG preparation timed out")),40000);
      try {canvas.toBlob(blob=>{clearTimeout(timer);blob&&blob.size?resolve(blob):reject(Error("PNG export failed"));},"image/png");}
      catch(e){clearTimeout(timer);reject(e);}
    });
  }
  async function prepared(canvas,filename) {
    return {filename,blob:await toBlob(await bannerCanvas(canvas))};
  }
  function browserDownload(blob,name){
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  async function fetchJSON(url){
    const r=await fetch(url,{cache:"no-store"});
    if(!r.ok)return null;
    return r.json();
  }
  async function getToday(){
    const report=await fetchJSON(new URL("today.json",ROOT));
    if(!report||report.published!==true||!Array.isArray(report.matches))return null;
    return report;
  }
  function mergeOdds(base,latest){
    const blank=base.matches.map(m=>({...m,currentBodyOdds:"",currentGoalTotalOdds:""}));
    if(!latest||base.reportDate!==latest.reportDate||!Array.isArray(latest.matches))return {...base,matches:blank};
    const byRow=new Map();
    for(const x of latest.matches){const row=Number(x.row);if(Number.isSafeInteger(row)&&row>0&&!byRow.has(row))byRow.set(row,x);}
    return {...base,matches:blank.map((m,i)=>{
      const x=byRow.get(Number(m.pdfRow||m.number||i+1));
      if(!x||["league","home","away","upperTeam","kickoffDisplay"].some(k=>String(x[k]??"")!==String(m[k]??""))||
         String(x.morningBodyOdds)!==String(m.bodyOdds)||String(x.morningGoalTotalOdds)!==String(m.goalTotalOdds))return m;
      const b=String(x.eveningBodyOdds||"").trim(),g=String(x.eveningGoalTotalOdds||"").trim();
      return {...m,currentBodyOdds:/^(?:-\d+|\d+[+-]\d+|\d+=)$/.test(b)?b:"",currentGoalTotalOdds:/^(?:-\d+|\d+[+-]\d+|\d+=)$/.test(g)?g:""};
    })};
  }
  async function getOdds(reportDate){
    const base=new URL("odds/"+reportDate+".json",ROOT);
    const data=await fetchJSON(base);
    if(!data||data.reportDate!==reportDate||!Array.isArray(data.matches))return null;
    const latest=await fetchJSON(new URL("odds/evening/"+reportDate+".json",ROOT)).catch(()=>null);
    return mergeOdds(data,latest);
  }
  function predictionFor(m){
    const evidence=["homeStanding","awayStanding"].every(k=>m[k]&&Number(m[k].played)>=3 &&
      Number.isFinite(Number(m[k].goalsFor))&&Number.isFinite(Number(m[k].goalsAgainst)));
    const model=window.FutureCodeAiScoreModel;
    return evidence&&model&&typeof model.predict==="function"?model.predict(m):null;
  }
  async function aiCard(m,reportDate){
    const kit=window.FutureCodeCanvasKit;
    if(!kit)throw Error("Canvas kit missing");
    const {canvas,ctx}=kit.create(1080,470);
    const C=kit.C;
    await Promise.all([kit.fonts(),kit.preloadImages([m.homeCrestUrl,m.awayCrestUrl])]);
    kit.fill(ctx,0,0,1080,470,C.bg);
    kit.fill(ctx,32,24,1016,415,C.panel,16);
    kit.fill(ctx,32,24,1016,74,C.head,12);
    kit.text(ctx,String(m.league||"FOOTBALL"),55,60,23,C.orange,true,"left",950);
    const hn=String(m.homeDisplay||m.home||""),an=String(m.awayDisplay||m.away||"");
    kit.crest(ctx,m.homeCrestUrl,180,131,94,hn);
    kit.crest(ctx,m.awayCrestUrl,805,131,94,an);
    kit.text(ctx,hn,227,264,kit.fit(ctx,hn,390,26,17),C.white,true,"center",390);
    kit.text(ctx,"VS",540,186,30,C.orange,true,"center");
    kit.text(ctx,an,852,264,kit.fit(ctx,an,390,26,17),C.white,true,"center",390);
    const scores=predictionFor(m);
    if(scores&&scores.length){
      kit.text(ctx,"ဖြစ်နိုင်ခြေမြင့်သော ဂိုးရလဒ် ၃ မျိုး",540,315,20,C.pale,true,"center");
      scores.slice(0,3).forEach((score,i)=>{
        kit.fill(ctx,259+i*192,350,176,55,i===0?"#815b24":C.panelAlt,10);
        kit.text(ctx,String(score),347+i*192,378,28,C.white,true,"center");
      });
    }else{
      kit.text(ctx,"အတည်ပြုနိုင်သော စာရင်းအချက်အလက် မလုံလောက်သေးပါ။",540,361,21,C.muted,true,"center",950);
    }
    kit.text(ctx,"DATA-ASSISTED OUTLOOK  ·  "+reportDate,540,450,14,C.muted,false,"center");
    return canvas;
  }
  async function downloadAI(m,reportDate){
    const date=reportDate||day();
    const canvas=await aiCard(m,date);
    const item=await prepared(canvas,"goal-zone-ai-"+date+"-"+safeName(m.home)+"-vs-"+safeName(m.away)+".png");
    browserDownload(item.blob,item.filename);
  }
  // This journal's normal single-PNG buttons share the Canvas kit. Replace only
  // this page's download implementation, leaving other websites untouched.
  const kit=window.FutureCodeCanvasKit;
  if(kit && !kit._goalZoneBrandedDownload){
    const original=kit.download;
    kit.download=async function(canvas,filename){return original(await bannerCanvas(canvas),filename);};
    kit._goalZoneBrandedDownload=true;
  }
  const options=[
    {key:"preview",label:"ပွဲကြိုသုံးသပ်ချက်များ"},
    {key:"special",label:"Special Choice"},
    {key:"odds",label:"ပေါက်ကြေးများ"},
    {key:"ai",label:"AI ခန့်မှန်းချက်"},
    {key:"results",label:"မနေ့က ဂိုးရလဒ်များ"}
  ];
  function makePanel(){
    const home=document.getElementById("matchList");
    const odds=document.querySelector(".odds-export-actions");
    const target=home||odds;
    if(!target)return;
    const panel=document.createElement("section");
    panel.className="gz-bulk-panel";
    panel.innerHTML='<div class="gz-bulk-heading"><span>GOAL ZONE · IMAGE STUDIO</span><h2>ပုံအားလုံးကို တစ်ခါတည်း Download</h2><p>Download လုပ်လိုသည့် ပုံအမျိုးအစားနဲ့ ပြိုင်ပွဲကို ရွေးပါ။ PNG ပုံအားလုံးကို ZIP တစ်ဖိုင်ထဲ ထည့်ပေးပါမည်။</p></div>';
    const controls=document.createElement("div");controls.className="gz-bulk-choices";
    options.forEach(x=>{
      const label=document.createElement("label");
      const checkbox=document.createElement("input");checkbox.type="checkbox";checkbox.name="gzBulkCategory";checkbox.value=x.key;checkbox.checked=true;
      label.append(checkbox,document.createTextNode(x.label));controls.append(label);
    });
    const footer=document.createElement("div");footer.className="gz-bulk-footer";
    const leaguelabel=document.createElement("label");leaguelabel.textContent="ပြိုင်ပွဲရွေးရန် ";
    const league=document.createElement("select");league.id="gzBulkLeague";
    league.innerHTML='<option value="all">ပြိုင်ပွဲအားလုံး</option>';
    leaguelabel.appendChild(league);
    const btn=document.createElement("button");btn.type="button";btn.className="gz-bulk-download";btn.textContent="⬇ ရွေးထားသော ပုံအားလုံး Download";
    const status=document.createElement("p");status.id="gzBulkStatus";status.setAttribute("role","status");status.textContent="ZIP တစ်ဖိုင်တည်းဖြင့် Download ယူနိုင်ပါသည်။";
    footer.append(leaguelabel,btn);
    panel.append(controls,footer,status);target.parentNode.insertBefore(panel,target);
    getToday().then(report=>{
      const names=new Set((report?.matches||[]).map(m=>m.league).filter(Boolean));
      return getOdds(report?.reportDate||day()).then(o=>{(o?.matches||[]).forEach(m=>{if(m.league)names.add(m.league)});return names;});
    }).then(names=>{
      [...names].sort().forEach(name=>{const opt=document.createElement("option");opt.value=name;opt.textContent=name;league.appendChild(opt)});
    }).catch(e=>console.warn("GOAL ZONE league selection",e));
    btn.addEventListener("click",async()=>{
      if(btn.disabled)return;
      const selected=new Set([...panel.querySelectorAll("input[name=gzBulkCategory]:checked")].map(c=>c.value));
      if(!selected.size){status.textContent="ပုံအမျိုးအစား အနည်းဆုံးတစ်ခု ရွေးပါ။";return;}
      const selectedLeague=league.value;
      btn.disabled=true;const old=btn.textContent;
      btn.textContent="PNG ပုံများ စုစည်းနေသည်…";
      let count=0;
      try{
        const ZIP=window.FutureCodeFrameZip?.Archive;
        if(!ZIP)throw Error("ZIP module unavailable");
        const archive=new ZIP();
        const report=await getToday();
        const today=report?.reportDate||day();
        const matches=(report?.matches||[]).filter(m=>m.home&&m.away&&m.status!=="finished"&&!m.fixtureOnly&&(selectedLeague==="all"||m.league===selectedLeague));
        const add=async item=>{
          if(!item?.blob)return;
          await archive.add(item.filename,item.blob);
          count++;
          status.textContent="PNG "+count+" ပုံ စုစည်းပြီးပါပြီ…";
          await new Promise(resolve=>setTimeout(resolve,0));
        };
        const brand={brandName:"ဂိုးဇုံ အားကစား ဂျာနယ်",brandLogoUrl:brandLogo};
        if(selected.has("preview")||selected.has("special")){
          if(!window.FutureCodeCardExport?.save)throw Error("Preview exporter missing");
          for(const m of matches){
            if(selected.has("preview")){
              const canvas=await window.FutureCodeCardExport.save({...m,home:m.homeDisplay||m.home,away:m.awayDisplay||m.away},{...brand,leagueLabel:m.league,asCanvas:true,special:false});
              await add(await prepared(canvas,"preview/goal-zone-preview-"+today+"-"+safeName(m.home)+"-"+safeName(m.away)+".png"));
            }
            if(selected.has("special")&&m.specialChoice===true){
              const canvas=await window.FutureCodeCardExport.save({...m,home:m.homeDisplay||m.home,away:m.awayDisplay||m.away},{...brand,leagueLabel:m.league,asCanvas:true,special:true});
              await add(await prepared(canvas,"special-choice/goal-zone-special-"+today+"-"+safeName(m.home)+"-"+safeName(m.away)+".png"));
            }
          }
        }
        if(selected.has("ai")){
          for(const m of matches){
            const canvas=await aiCard(m,today);
            await add(await prepared(canvas,"ai-predictions/goal-zone-ai-"+today+"-"+safeName(m.home)+"-"+safeName(m.away)+".png"));
          }
        }
        if(selected.has("odds")){
          const data=await getOdds(today);
          const games=(data?.matches||[]).filter(m=>selectedLeague==="all"||m.league===selectedLeague);
          const exporter=window.FutureCodeDailyExport;
          if(games.length&&exporter?.saveOdds&&exporter.partition){
            for(const part of exporter.partition(games)){
              const result=await exporter.saveOdds({...data,matches:part.matches},{part:part.index,total:part.total,asBlob:true});
              const bitmap=await createImageBitmap(result.blob);
              const source=document.createElement("canvas");source.width=bitmap.width;source.height=bitmap.height;
              source.getContext("2d").drawImage(bitmap,0,0);bitmap.close?.();
              await add(await prepared(source,"odds/"+result.filename));
            }
          }
        }
        if(selected.has("results")){
          const yday=yesterday(today);
          const previous=await fetchJSON(new URL("archive/"+yday+".json",ROOT));
          const finals=(previous?.matches||[]).filter(m=>m.status==="finished"&&/^\d+\s*[-:]\s*\d+$/.test(String(m.finalScore||""))&&(selectedLeague==="all"||m.league===selectedLeague));
          const exportKit=window.FutureCodeDailyExport;
          if(finals.length&&exportKit?.saveResults&&exportKit.partition){
            for(const part of exportKit.partition(finals)){
              const prior=kit.download;
              let grabbed=null;
              try{
                kit.download=async(c,name)=>{grabbed=await prepared(c,"results/"+name);};
                await exportKit.saveResults({matches:part.matches,date:yday,part:part.index,total:part.total});
              }finally{kit.download=prior;}
              await add(grabbed);
            }
          }
        }
        if(!count)throw Error("ရွေးထားသော အမျိုးအစားအတွက် ထုတ်ဝေထားသော PNG မရှိသေးပါ။");
        browserDownload(archive.finish(),"GOAL-ZONE-"+today+"-"+(selectedLeague==="all"?"all":safeName(selectedLeague))+"-"+count+"-images.zip");
        status.textContent="✓ PNG "+count+" ပုံ ပါဝင်သော ZIP Download စတင်ပြီးပါပြီ။";
      }catch(e){
        console.error("GOAL ZONE bulk export",e);
        status.textContent="Download မအောင်မြင်ပါ — "+(e.message||"ပြန်စမ်းကြည့်ပါ");
      }finally{btn.disabled=false;btn.textContent=old;}
    });
  }
  function addWebBanner(){
    const header=document.querySelector(".site-header");
    if(!header||document.querySelector(".gz-journal-banner"))return;
    const bar=document.createElement("div");
    bar.className="gz-journal-banner";
    bar.setAttribute("role","img");
    bar.setAttribute("aria-label","ဂိုးဇုံ GOAL ZONE အားကစားဂျာနယ်");
    const center=document.createElement("img");
    center.src=artwork;center.alt="ဂိုးဇုံ GOAL ZONE";
    bar.appendChild(center);
    header.insertAdjacentElement("afterend",bar);
  }
  window.GoalZoneDownloads=Object.freeze({downloadAI});
  document.addEventListener("DOMContentLoaded",()=>{addWebBanner();});
})();

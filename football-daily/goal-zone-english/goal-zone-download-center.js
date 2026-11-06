"use strict";
/* GOAL ZONE only — selected sections / league / matches / PNG layout -> real ZIP. */
(function(){
  const root=document.documentElement;
  if(root.dataset.footballBrandName!=="GOAL ZONE JOURNAL")return;
  const base=new URL("../data/",document.baseURI),bannerUrl=new URL("../future-code-journal/assets/goal-zone-download-banner.webp",document.baseURI).href;
  const $=id=>document.getElementById(id);
  const items=[
    ["preview","Match Preview"],["special","Special Choice"],
    ["odds","Asian Handicap Odds"],["results","Match Results"],
    ["ai","AI Predictions"],["probability","Match Probabilities (%)"],
    ["news","Football News"]
  ];
  const imageCache=new Map();
  const name=s=>String(s||"football").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,36)||"item";
  const key=m=>m.fixtureId?"fixture:"+m.fixtureId:[m.league||"",m.home||"",m.away||""].join("|");
  const yesterday=date=>{const d=new Date(date+"T12:00:00Z");d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10);};
  async function read(path){
    const loader=window.FootballData?.fetch||fetch;
    const r=await loader(new URL(path,base),{cache:"no-store"});
    if(!r.ok)throw Error(path+" Data could not be loaded");
    return r.json();
  }
  async function optional(path){try{return await read(path);}catch{return null;}}
  async function getOdds(date){
    const data=await optional("odds/"+date+".json");
    if(!data||data.reportDate!==date||!Array.isArray(data.matches))return null;
    const evening=await optional("odds/evening/"+date+".json");
    if(!evening||evening.reportDate!==date||!Array.isArray(evening.matches))return data;
    const lookup=new Map(evening.matches.filter(m=>Number(m.row)>0).map(m=>[Number(m.row),m]));
    return {...data,matches:data.matches.map((m,i)=>{
      const next=lookup.get(Number(m.pdfRow||m.number||i+1));
      if(!next||["league","home","away","upperTeam","kickoffDisplay"].some(k=>String(next[k]??"")!==String(m[k]??""))||
        String(next.morningBodyOdds)!==String(m.bodyOdds)||
        String(next.morningGoalTotalOdds)!==String(m.goalTotalOdds))return m;
      const b=String(next.eveningBodyOdds||"").trim(),g=String(next.eveningGoalTotalOdds||"").trim();
      return {...m,currentBodyOdds:/^(?:-\d+|\d+[+-]\d+|\d+=)$/.test(b)?b:"",
        currentGoalTotalOdds:/^(?:-\d+|\d+[+-]\d+|\d+=)$/.test(g)?g:""};
    })};
  }
  function loadImage(url){
    if(!imageCache.has(url))imageCache.set(url,new Promise((resolve,reject)=>{
      const image=new Image();image.crossOrigin="anonymous";
      image.onload=()=>resolve(image);
      image.onerror=()=>reject(Error("Banner image unavailable"));
      image.src=url;
    }));
    return imageCache.get(url);
  }
  function png(canvas){
    return new Promise((resolve,reject)=>{
      if(!canvas||!canvas.width||!canvas.height)return reject(Error("Canvas data incomplete"));
      const timer=setTimeout(()=>reject(Error("PNG encoding timeout")),60000);
      canvas.toBlob(blob=>{clearTimeout(timer);blob&&blob.size?resolve(blob):reject(Error("PNG encoding failed"));},"image/png");
    });
  }
  function canvasOf(w,h){
    if(w<1||h<1||h>16384||w>8192)throw Error("PNG too large — select split or one match per image");
    const c=document.createElement("canvas");c.width=w;c.height=h;
    if(!c.getContext("2d"))throw Error("Canvas unavailable");
    return c;
  }
  async function decoded(blob){
    if(typeof createImageBitmap==="function"){
      const bmp=await createImageBitmap(blob);const c=canvasOf(bmp.width,bmp.height);
      c.getContext("2d").drawImage(bmp,0,0);bmp.close?.();return c;
    }
    const url=URL.createObjectURL(blob);
    try{
      const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=url;});
      const c=canvasOf(image.naturalWidth,image.naturalHeight);c.getContext("2d").drawImage(image,0,0);return c;
    }finally{URL.revokeObjectURL(url);}
  }
  function englishBannerWordmark(ctx,w,h){
  const x=w*.17,y=h*.19,bw=w*.66,bh=h*.65;
  ctx.fillStyle="rgba(16,13,10,.95)";ctx.fillRect(x,y,bw,bh);
  ctx.strokeStyle="#e1c27d";ctx.lineWidth=Math.max(2,w*.0025);
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+bw,y);ctx.moveTo(x,y+bh);ctx.lineTo(x+bw,y+bh);ctx.stroke();
  ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.fillStyle="#f8e6be";ctx.font="900 "+Math.round(h*.24)+"px 'Barlow Condensed',Arial,sans-serif";
  ctx.fillText("GOAL ZONE JOURNAL",w/2,y+bh*.43,bw*.94);
  ctx.fillStyle="#dfbd6f";ctx.font="800 "+Math.round(h*.11)+"px Arial,sans-serif";
  ctx.fillText("ENGLISH EDITION",w/2,y+bh*.76,bw*.85);
}

  async function withBanner(source){
    const w=source.width,h=Math.round(w*270/988),output=canvasOf(w,source.height+h);
    const ctx=output.getContext("2d");ctx.fillStyle="#0d0b07";ctx.fillRect(0,0,w,h);
    const img=await loadImage(bannerUrl).catch(()=>null);
    if(img)ctx.drawImage(img,0,0,w,h);
    else{
      ctx.fillStyle="#cba456";ctx.textAlign="center";
      ctx.font="900 "+Math.round(h*.31)+'px "Noto Sans Myanmar",sans-serif';
      ctx.fillText("GOAL ZONE · GOAL ZONE JOURNAL",w/2,h*.63,w*.9);
    }
    englishBannerWordmark(ctx,w,h);
    ctx.drawImage(source,0,h);
    return output;
  }
  function pieces(array,mode){
    if(!array.length)return [];
    if(mode==="single")return [array];
    if(mode==="two"){
      const half=Math.ceil(array.length/2);return [array.slice(0,half),array.slice(half)].filter(x=>x.length);
    }
    if(mode==="pair"){const out=[];for(let i=0;i<array.length;i+=2)out.push(array.slice(i,i+2));return out;}
    return array.map(x=>[x]);
  }
  // Compact multi-column journal contact sheet rather than stacking 48 long
  // articles into an unexportable 50,000px-high image. Preserve each card's
  // original aspect ratio; choose the largest safe readable scale.
  function stack(canvases){
    if(!canvases.length)throw Error("No PNG image to draw");
    if(canvases.length===1)return canvases[0];
    const gap=16,maxTileWidth=Math.max(...canvases.map(c=>c.width));
    const mobile=typeof navigator!=="undefined"&&/Android|iPhone|iPad/i.test(navigator.userAgent||"");
    const maxWidth=mobile?4096:7800,maxHeight=mobile?7500:12500,maxPixels=mobile?14000000:28000000;
    let best=null;
    for(let columns=1;columns<=Math.min(canvases.length,7);columns++){
      const rowCount=Math.ceil(canvases.length/columns);
      const rowHeights=Array.from({length:rowCount},(_,r)=>
        Math.max(...canvases.slice(r*columns,(r+1)*columns).map(c=>Math.ceil(c.height*maxTileWidth/c.width))));
      const naturalWidth=columns*maxTileWidth+(columns-1)*gap;
      const naturalHeight=rowHeights.reduce((a,b)=>a+b,0)+(rowCount-1)*gap;
      const scale=Math.min(1,maxWidth/naturalWidth,maxHeight/naturalHeight,Math.sqrt(maxPixels/(naturalWidth*naturalHeight)));
      if(!best||scale>best.scale+0.000001||(Math.abs(scale-best.scale)<0.000001&&naturalHeight<best.naturalHeight)){
        best={columns,rowHeights,naturalWidth,naturalHeight,scale};
      }
    }
    const {columns,rowHeights,naturalWidth,naturalHeight,scale}=best;
    const width=Math.max(1,Math.floor(naturalWidth*scale)),height=Math.max(1,Math.floor(naturalHeight*scale));
    const result=canvasOf(width,height),ctx=result.getContext("2d");
    ctx.fillStyle="#151008";ctx.fillRect(0,0,width,height);
    let y=0;
    for(let i=0;i<canvases.length;i++){
      const row=Math.floor(i/columns),col=i%columns,c=canvases[i];
      if(col===0&&row>0)y+=rowHeights[row-1]+gap;
      const tileHeight=c.height*maxTileWidth/c.width;
      const xx=Math.round((col*(maxTileWidth+gap))*scale),yy=Math.round(y*scale);
      const tileW=Math.floor(maxTileWidth*scale),tileH=Math.floor(tileHeight*scale);
      ctx.drawImage(c,xx,yy,tileW,tileH);
      ctx.strokeStyle="#bd944a";ctx.lineWidth=Math.max(1,Math.round(scale*2));
      ctx.strokeRect(xx,yy,tileW,tileH);
    }
    return result;
  }
  // Use an accurate, text-complete publication card if an external photograph
  // or an individual original renderer fails, instead of losing the whole ZIP.
  async function fallbackCard(type,item,date){
    const W=1200,side=44,head=200;
    let title="",detail="",body="",label="";
    const home=item?.homeDisplay||item?.home||"",away=item?.awayDisplay||item?.away||"";
    if(type==="news"){
      label="Football News · "+(item.categoryLabel||"GOAL ZONE");
      title=String(item.title||"Football News");
      body=(Array.isArray(item.paragraphs)?item.paragraphs:[]).join("\n\n");
      detail="Original news photograph could not be added to PNG; the complete article text remains.";
    }else{
      label=item.leagueDisplay||item.league||"GOAL ZONE";
      title=home+"  VS  "+away;
      if(type==="preview")body=item.dailyPreviewText||item.preview||"";
      if(type==="special")body=(item.specialAnalysisParagraphs||[]).join("\n\n")||item.dailyPreviewText||"";
      if(type==="results")detail="Confirmed Full-Time Result  "+String(item.finalScore||"—");
      if(type==="odds")detail="Opening Odds "+String(item.bodyOdds??item.morningBodyOdds??"—")+" · Goal Total "+String(item.goalTotalOdds??item.morningGoalTotalOdds??"—")+" · Current Odds "+String(item.currentBodyOdds||"—");
      if(type==="ai"){
        const numbers=window.FutureCodeAiScoreModel?.predict?.(item);
        detail="AI Score Prediction  "+(Array.isArray(numbers)?numbers.join(" · "):"Insufficient data");
      }
      if(type==="probability"){
        const p=window.FutureCodeProbabilityModel?.analyze?.(item,null,date);
        detail="Home "+(p?.win?.home??"—")+"% · Away "+(p?.win?.away??"—")+"% · Over "+(p?.goals?.over??"—")+"% · Under "+(p?.goals?.under??"—")+"%";
      }
    }
    const measure=canvasOf(W,5).getContext("2d");
    const size=type==="news"?24:26,maxTextWidth=W-2*side-25;
    measure.font="500 "+size+'px "Noto Sans Myanmar",sans-serif';
    const lines=[];
    for(const paragraph of String(body||"").replace(/\*\*/g,"").split(/\n+/)){
      if(!paragraph.trim()) {lines.push("");continue;}
      const segments=typeof Intl.Segmenter==="function"?
        Array.from(new Intl.Segmenter("my",{granularity:"word"}).segment(paragraph),x=>x.segment):
        Array.from(paragraph);
      let line="";
      for(const token of segments){
        if(line&&measure.measureText(line+token).width>maxTextWidth){
          lines.push(line);line="";
        }
        line+=token;
      }
      if(line)lines.push(line);
    }
    const bodyStart=head+(detail?85:20),lineHeight=44;
    const H=Math.min(12000,Math.max(590,bodyStart+lines.length*lineHeight+90));
    const result=canvasOf(W,H),ctx=result.getContext("2d");
    ctx.fillStyle="#14110b";ctx.fillRect(0,0,W,H);
    ctx.fillStyle="#302413";ctx.fillRect(18,18,W-36,H-36);
    ctx.strokeStyle="#d4b16b";ctx.lineWidth=3;ctx.strokeRect(18,18,W-36,H-36);
    ctx.fillStyle="#7c581d";ctx.fillRect(18,18,W-36,78);
    ctx.textBaseline="alphabetic";
    ctx.font='800 25px "Noto Sans Myanmar",sans-serif';ctx.fillStyle="#fff0c8";
    ctx.fillText(label,side,68,W-side*2);
    ctx.fillStyle="#ffdf91";ctx.font='800 33px "Noto Sans Myanmar",sans-serif';
    ctx.fillText(title,side,155,W-side*2);
    if(detail){
      ctx.fillStyle="#f3d39a";ctx.font='700 24px "Noto Sans Myanmar",sans-serif';
      ctx.fillText(detail,side,228,W-side*2);
    }
    ctx.fillStyle="#f6edda";ctx.font="500 "+size+'px "Noto Sans Myanmar",sans-serif';
    let y=bodyStart;
    for(const line of lines){if(y>H-70)break;if(line)ctx.fillText(line,side,y,maxTextWidth);y+=lineHeight;}
    ctx.fillStyle="#c2a270";ctx.font='600 18px "Noto Sans Myanmar",sans-serif';
    ctx.fillText("GOAL ZONE  ·  "+date,side,H-38,W-side*2);
    return result;
  }
  async function exportWithFallback(type,group,ctx,notes){
    try{
      const original=await exportGroup(type,group,ctx);
      if(!original?.width||!original?.height||typeof original.toBlob!=="function")
        throw Error("PNG Canvas အချက်အလက် Incomplete");
      return original;
    }catch(originalError){
      console.warn("GOAL ZONE original exporter fallback",type,originalError);
      notes.push(type+" — "+(originalError?.message||String(originalError)));
      const pages=[];
      for(const item of group){
        if(group.length===1){pages.push(await fallbackCard(type,item,ctx.day));continue;}
        try{
          const output=await exportGroup(type,[item],ctx);
          if(!output?.width||!output?.height||typeof output.toBlob!=="function")
            throw Error("Invalid original PNG Canvas");
          pages.push(output);
        }catch(e){pages.push(await fallbackCard(type,item,ctx.day));}
      }
      return stack(pages);
    }
  }
  async function pngWithRetry(canvas){
    try{return await png(canvas);}
    catch(e){
      const scale=Math.min(.7,2300/canvas.width,4500/canvas.height);
      if(!Number.isFinite(scale)||scale<=0)throw e;
      const small=canvasOf(Math.max(1,Math.floor(canvas.width*scale)),Math.max(1,Math.floor(canvas.height*scale)));
      small.getContext("2d").drawImage(canvas,0,0,small.width,small.height);
      return png(small);
    }
  }
  function download(blob,filename){
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  async function aiCanvas(m,date){
    const k=window.FutureCodeCanvasKit;
    if(!k)throw Error("AI exporter unavailable");
    const {canvas,ctx}=k.create(1080,475);
    const logo=window.FutureCodeBrandExportData?.leagueCrest(m.league);
    await Promise.all([k.fonts(),k.preloadImages([m.homeCrestUrl,m.awayCrestUrl,logo].filter(Boolean))]);
    k.fill(ctx,0,0,1080,475,k.C.bg);k.fill(ctx,22,22,1036,428,k.C.panel,15);
    k.fill(ctx,22,22,1036,66,k.C.head,12);
    if(logo)k.crest(ctx,logo,37,29,45,"");
    k.text(ctx,window.FutureCodeBrandExportData?.leagueName(m.league)||m.league||"FOOTBALL",logo?103:46,58,24,k.C.orange,true,"left",920);
    const home=m.homeDisplay||m.home,away=m.awayDisplay||m.away;
    k.crest(ctx,m.homeCrestUrl,133,120,91,home);k.crest(ctx,m.awayCrestUrl,850,120,91,away);
    k.text(ctx,home,255,256,k.fit(ctx,home,420,25,16),k.C.white,true,"center",420);
    k.text(ctx,"VS",540,187,30,k.C.orange,true,"center");
    k.text(ctx,away,825,256,k.fit(ctx,away,420,25,16),k.C.white,true,"center",420);
    const scores=window.FutureCodeAiScoreModel?.predict?.(m);
    if(Array.isArray(scores)&&scores.length){
      k.text(ctx,"AI Predictions",540,319,22,k.C.pale,true,"center");
      scores.slice(0,3).forEach((s,i)=>{k.fill(ctx,252+i*196,345,180,58,i===0?"#745221":k.C.panelAlt,10);k.text(ctx,String(s),342+i*196,376,27,k.C.white,true,"center");});
    }else k.text(ctx,"Insufficient prediction data",540,351,22,k.C.muted,true,"center");
    k.text(ctx,date,540,441,16,k.C.muted,true,"center");return canvas;
  }
  async function probabilityCanvas(m,date,market){
    const k=window.FutureCodeCanvasKit,model=window.FutureCodeProbabilityModel;
    if(!k||!model)throw Error("Probability module unavailable");
    const {canvas:c,ctx}=k.create(1080,480),p=model.analyze(m,market,date);
    await Promise.all([k.fonts(),k.preloadImages([m.homeCrestUrl,m.awayCrestUrl].filter(Boolean))]);
    k.fill(ctx,0,0,1080,480,"#11100d");k.fill(ctx,24,24,1032,420,"#262018",14);
    k.fill(ctx,24,24,1032,64,"#6d4e20",10);
    k.text(ctx,"Match Probabilities (%)",540,58,27,"#ffde92",true,"center");
    const h=m.homeDisplay||m.home,a=m.awayDisplay||m.away;
    k.crest(ctx,m.homeCrestUrl,145,121,83,h);k.crest(ctx,m.awayCrestUrl,820,121,83,a);
    k.text(ctx,h,252,242,k.fit(ctx,h,415,24,17),"#fff6e0",true,"center",415);
    k.text(ctx,a,829,242,k.fit(ctx,a,415,24,17),"#fff6e0",true,"center",415);
    const vals=[["Home",p.win?.home],["Away",p.win?.away],["Over",p.goals?.over],["Under",p.goals?.under]];
    vals.forEach(([label,v],i)=>{
      const x=44+i*251;k.fill(ctx,x,289,239,104,"#3b2f1c",10);
      k.text(ctx,label,x+119,319,17,"#eec875",true,"center");
      k.text(ctx,Number.isInteger(v)?v+"%":"—",x+119,372,35,"#ffffff",true,"center");
    });
    k.text(ctx,(m.leagueDisplay||m.league||"")+" · Over/Under 2.5 Goals · "+date,540,426,15,"#dcc99e",false,"center",980);
    return c;
  }
  async function newsCanvas(story){
    const exp=window.FutureCodeNewsFrameExport;
    if(!exp?.render)throw Error("News exporter unavailable");
    const image=await exp.render(story);
    if(!image?.blob)throw Error("သတင်း PNG Incomplete");
    return decoded(image.blob);
  }
  async function resultCanvas(matches,date){
    const kit=window.FutureCodeCanvasKit,exp=window.FutureCodeDailyExport;
    if(!kit?.download||!exp?.saveResults)throw Error("Results exporter unavailable");
    const prior=kit.download;let captured=null;
    try{
      kit.download=async(c,filename)=>{captured=c;return {filename};};
      await exp.saveResults({matches,date,part:1,total:1});
    }finally{kit.download=prior;}
    if(!captured)throw Error("Match Results ပုံမထုတ်နိုင်ပါ");
    return captured;
  }
  async function oddsCanvas(data,matches){
    const exp=window.FutureCodeDailyExport;
    if(!exp?.saveOdds)throw Error("Odds exporter unavailable");
    const output=await exp.saveOdds({...data,matches},{singleImage:true,asBlob:true});
    return decoded(output.blob);
  }
  async function exportGroup(type,group,ctx){
    if(type==="preview"||type==="special"){
      const exp=window.FutureCodeCardExport;
      if(!exp?.save)throw Error("Preview exporter unavailable");
      const arts=[];
      for(const m of group)arts.push(await exp.save({...m,home:m.homeDisplay||m.home,away:m.awayDisplay||m.away},{
        brandName:"GOAL ZONE JOURNAL",brandLogoUrl:new URL("./logo.svg",document.baseURI).href,
        leagueLabel:m.league,asCanvas:true,special:type==="special"
      }));
      return stack(arts);
    }
    if(type==="ai"){const arts=[];for(const m of group)arts.push(await aiCanvas(m,ctx.day));return stack(arts);}
    if(type==="probability"){const arts=[];for(const m of group)arts.push(await probabilityCanvas(m,ctx.day,ctx.oddsById.get(m.fixtureId)||ctx.oddsByKey.get(key(m))));return stack(arts);}
    if(type==="news"){const arts=[];for(const s of group)arts.push(await newsCanvas(s));return stack(arts);}
    if(type==="odds")return oddsCanvas(ctx.odds,group);
    if(type==="results")return resultCanvas(group,ctx.previousDay);
    throw Error("Unknown export section");
  }
  async function initialize(){
    if($("gzDownloadCenter"))return;
    const anchor=$("gzSectionNav")||document.querySelector(".odds-export-actions");
    if(!anchor)return;
    const panel=document.createElement("section");
    panel.id="gzDownloadCenter";panel.className="gz-bulk-panel";
    panel.setAttribute("aria-label","Goal Zone ZIP Download Center");
    panel.innerHTML='<div class="gz-bulk-heading"><span>GOAL ZONE · DOWNLOAD CENTER</span><h2>Download All Images as ZIP</h2><p>Select the export layout separately for each section: all odds in one image, results split into two, and more — combined into one ZIP.</p></div>'+
      '<div class="gz-bulk-choices gz-section-mode-list" id="gzBulkCategories" role="group" aria-label="PNG Export Layout per Section"></div>'+
      '<div class="gz-center-filters"><label>Select league<select id="gzBulkLeague"><option value="all">All Leagues</option></select></label></div>'+
      '<details class="gz-center-matches"><summary>Select Matches — <span id="gzBulkMatchCount">Checking…</span></summary>'+
      '<div class="gz-center-match-actions"><button type="button" id="gzMatchAll">Select All Matches</button><button type="button" id="gzMatchNone">Clear Selection</button></div>'+
      '<div id="gzBulkMatchList" role="group" aria-label="Match Selection"></div></details>'+
      '<div class="gz-bulk-footer"><button type="button" id="gzBulkDownload" class="gz-bulk-download">⬇ Download Selected Images ZIP</button></div>'+
      '<p id="gzBulkStatus" role="status" aria-live="polite">Loading published matches and news…</p>';
    anchor.insertAdjacentElement("afterend",panel);
    const categories=$("gzBulkCategories"),league=$("gzBulkLeague"),matchList=$("gzBulkMatchList"),status=$("gzBulkStatus"),btn=$("gzBulkDownload");
    // Layout is intentionally SECTION-SPECIFIC. No global PNG layout switch.
    const initialModes={preview:"each",special:"each",odds:"single",results:"two",ai:"two",probability:"single",news:"each"};
    const sectionModeControls=new Map();
    for(const [id,labelText] of items){
      const row=document.createElement("div");row.className="gz-section-mode-row";row.dataset.section=id;
      const label=document.createElement("label");label.className="gz-section-mode-label";
      const checkbox=document.createElement("input");checkbox.type="checkbox";
      checkbox.name="gzCenterCategory";checkbox.value=id;checkbox.checked=true;
      label.append(checkbox,document.createTextNode(labelText));
      const selectorLabel=document.createElement("label");selectorLabel.className="gz-section-mode-selector";
      const caption=document.createElement("span");caption.textContent="Download Format";
      const select=document.createElement("select");select.id="gzMode_"+id;
      select.setAttribute("aria-label",labelText+" PNG Format");
      const selections=[
        ["single","All Selected in One Image"],
        ["two","All Selected Split in Two"],
        ["each",id==="news"?"One News Item per Image":"One Match per Image"],
        ["pair",id==="news"?"Two News Items per Image":"Two Matches per Image"]
      ];
      for(const [value,title] of selections){
        const option=document.createElement("option");option.value=value;option.textContent=title;
        if(value===initialModes[id])option.selected=true;
        select.add(option);
      }
      selectorLabel.append(caption,select);
      checkbox.addEventListener("change",()=>{select.disabled=!checkbox.checked;row.classList.toggle("gz-section-disabled",!checkbox.checked);});
      row.append(label,selectorLabel);categories.append(row);sectionModeControls.set(id,select);
    }
    btn.disabled=true;
    let report,odds,previous,news,day,previousDay,allMatches;
    try{
      report=await read("today.json");
      if(report.published!==true||!Array.isArray(report.matches)||!report.reportDate)throw Error("Published fixtures unavailable");
      day=report.reportDate;previousDay=yesterday(day);
      [odds,previous,news]=await Promise.all([getOdds(day),optional("archive/"+previousDay+".json"),optional("news/latest.json")]);
      const rows=[...report.matches,...(odds?.matches||[]),...(previous?.matches||[]).filter(m=>m.status==="finished")];
      const distinct=new Map();
      rows.filter(m=>m&&m.home&&m.away).forEach(m=>{if(!distinct.has(key(m)))distinct.set(key(m),m);});
      allMatches=[...distinct.values()];
      const leagues=[...new Set(allMatches.map(m=>m.league).filter(Boolean))].sort();
      for(const l of leagues){const option=document.createElement("option");option.value=l;option.textContent=allMatches.find(m=>m.league===l)?.leagueDisplay||window.FutureCodeBrandExportData?.leagueName(l)||l;league.add(option);}
      for(const m of allMatches){
        const label=document.createElement("label"),input=document.createElement("input");
        input.type="checkbox";input.name="gzCenterMatch";input.value=key(m);input.checked=true;
        const title=(m.homeDisplay||m.home)+" — "+(m.awayDisplay||m.away);
        label.dataset.league=m.league||"";
        label.append(input,document.createTextNode((m.leagueDisplay||m.league||"")+" · "+title));matchList.append(label);
      }
      const count=()=>{const visible=[...matchList.querySelectorAll("label")].filter(el=>!el.hidden);
        $("gzBulkMatchCount").textContent=visible.filter(el=>el.querySelector("input").checked).length+" / "+visible.length+"  matches ရွေးထားသည်";};
      league.addEventListener("change",()=>{for(const label of matchList.children)label.hidden=league.value!=="all"&&label.dataset.league!==league.value;count();});
      matchList.addEventListener("change",count);
      $("gzMatchAll").addEventListener("click",()=>{for(const label of matchList.children)if(!label.hidden)label.querySelector("input").checked=true;count();});
      $("gzMatchNone").addEventListener("click",()=>{for(const label of matchList.children)if(!label.hidden)label.querySelector("input").checked=false;count();});
      count();btn.disabled=false;
      status.textContent=allMatches.length+"  matches · "+(Array.isArray(news?.items)?news.items.length:0)+" သတင်း ရရှိသည်။ ZIP အတွက် Section နှင့် ပုံစံ ရွေးပါ။";
    }catch(e){status.textContent="Download Center  dataမရရှိပါ — "+(e.message||e);return;}
    btn.addEventListener("click",async()=>{
      if(btn.disabled)return;
      const chosen=[...panel.querySelectorAll('input[name="gzCenterCategory"]:checked')].map(el=>el.value);
      if(!chosen.length){status.textContent="Select at least one section";return;}
      const selected=new Set([...matchList.querySelectorAll('input[name="gzCenterMatch"]:checked')].map(el=>el.value));
      const want=m=>(league.value==="all"||m.league===league.value)&&selected.has(key(m));
      const matches=report.matches.filter(m=>m.home&&m.away&&m.status!=="finished"&&!m.fixtureOnly&&want(m));
      const oddsMatches=(odds?.matches||[]).filter(m=>want(m));
      const finals=(previous?.matches||[]).filter(m=>m.status==="finished"&&/^\d+\s*[-:]\s*\d+$/.test(String(m.finalScore||""))&&want(m));
      const stories=Array.isArray(news?.items)?news.items:[];
      const context={day,previousDay,odds,oddsById:new Map(oddsMatches.filter(m=>m.fixtureId).map(m=>[m.fixtureId,m])),
        oddsByKey:new Map(oddsMatches.map(m=>[key(m),m]))};
      const source={preview:matches,special:matches.filter(m=>m.specialChoice===true),odds:oddsMatches,
        results:finals,ai:matches,probability:matches,news:stories};
      const ZIP=window.FutureCodeFrameZip?.Archive;
      if(!ZIP){status.textContent="ZIP module unavailable";return;}
      btn.disabled=true;let count=0;const warnings=[];const archive=new ZIP();
      const original=btn.textContent;btn.textContent="Preparing PNG images…";
      try{
        for(const type of chosen){
          const records=source[type]||[];
          if(!records.length)continue;
          const mode=sectionModeControls.get(type).value;
          const groups=pieces(records,mode);
          for(let i=0;i<groups.length;i++){
            status.textContent=type+" · "+(i+1)+"/"+groups.length+" ပုံ ဖန်တီးနေသည်…";
            try{
              const art=await exportWithFallback(type,groups[i],context,warnings);
              const branded=await withBanner(art);
              const filename=type+"/GOAL-ZONE-"+day+"-"+type+"-"+mode+"-"+String(i+1).padStart(2,"0")+"-of-"+String(groups.length).padStart(2,"0")+".png";
              let output;
              try{
                output=await pngWithRetry(branded);
              }catch(encodeError){
                // Canvas export may fail on mobile due to cross-origin crests,
                // photos, or memory. Retry with accurate text-only cards.
                warnings.push(type+" PNG encoding — "+(encodeError?.message||String(encodeError)));
                const originals=[];
                for(const record of groups[i])originals.push(await fallbackCard(type,record,day));
                output=await pngWithRetry(await withBanner(stack(originals)));
              }
              await archive.add(filename,output);count++;
            }catch(pieceError){
              console.error("GOAL ZONE PNG failed",type,i+1,pieceError);
              warnings.push(type+" "+(i+1)+"/"+groups.length+" — "+(pieceError?.message||String(pieceError)));
            }
            await new Promise(resolve=>setTimeout(resolve,0));
          }
        }
        if(!count)throw Error("ရွေးထားသော matches/Section အတွက် ထုတ်ဝေထားသော ပုံမရှိသေးပါ");
        if(warnings.length)await archive.add("EXPORT-NOTES.txt",new Blob([
          "GOAL ZONE · "+day+"\nSome originals required a readable fallback or could not be exported.\n"+
          warnings.join("\n")+"\n"
        ],{type:"text/plain;charset=utf-8"}));
        download(archive.finish(),"GOAL-ZONE-"+day+"-custom-sections-"+count+"-PNGs.zip");
        status.textContent=warnings.length
          ?"ZIP Download စတင်ပြီးပါပြီ။ PNG "+count+" ပုံ ထုတ်ထားပြီး၊ ပြန်စစ်ရန် "+warnings.length+" ခုကို ZIP ထဲက EXPORT-NOTES.txt မှာ ဖော်ပြထားပါသည်။"
          :"✓ ZIP တွင် PNG "+count+" ပုံ ပါဝင်သည်။ Download စတင်ပြီးပါပြီ။";
      }catch(e){console.error("Goal Zone ZIP export",e);status.textContent="ZIP Download failed — "+(e.message||e);}
      finally{btn.disabled=false;btn.textContent=original;}
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initialize,{once:true});
  else initialize();
})();
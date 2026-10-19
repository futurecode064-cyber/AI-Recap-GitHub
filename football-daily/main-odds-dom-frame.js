"use strict";
/* FUTURE CODE MAIN ONLY — a PNG is a screenshot of the ACTUAL website
 * odds HTML table. Frame selection changes its palette and surrounds it with the selected banners.
 * Never redraw or rebuild league headers, team names or table columns. */
(function () {
  if (document.documentElement.dataset.footballBrandName ||
      !/^\/odds(?:\.html)?\/?$/.test(location.pathname)) return;

  // Main-site exports use a genuinely larger table, not only a higher-DPI
  // screenshot of 12–16px type. All other brand pages remain untouched.
  const SCALE = 2;
  const EXPORT_WIDTH = 1680;

  function shade(hex, f) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return "#153d38";
    return "#" + hex.slice(1).match(/../g).map(x =>
      Math.max(0,Math.min(255,Math.round(parseInt(x,16)*f)))
        .toString(16).padStart(2,"0")).join("");
  }
  const artworkCache=new Map();
  function localArtwork(url) {
    if(!artworkCache.has(url))artworkCache.set(url,new Promise((resolve,reject)=>{
      const img=new Image();
      const timer=setTimeout(()=>reject(Error("Frame Banner တင်ချိန်ကြာနေပါသည်")),15000);
      img.onload=()=>{clearTimeout(timer);resolve(img);};
      img.onerror=()=>{clearTimeout(timer);artworkCache.delete(url);reject(Error("Frame Banner မရပါ — "+url));};
      img.src=url;
    }));
    return artworkCache.get(url);
  }
  async function blobImage(blob) {
    const url=URL.createObjectURL(blob);
    try {
      return await new Promise((resolve,reject)=>{
        const img=new Image();
        img.onload=()=>resolve(img);
        img.onerror=()=>reject(Error("Website PNG ဖွင့်မရပါ"));
        img.src=url;
      });
    } finally { URL.revokeObjectURL(url); }
  }
  function waitFonts() {
    if (!document.fonts?.ready) return Promise.resolve();
    return Promise.race([
      document.fonts.ready.catch(()=>{}),
      new Promise(resolve=>setTimeout(resolve,3500))
    ]);
  }
  function waitFrame() {
    return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  }
  function getTableWidth() {
    const tables=[...document.querySelectorAll("#oddsList .odds-group .odds-table")];
    // On a phone, the real website table is horizontally scrollable. Capture
    // its FULL natural width instead of clipping it to the mobile viewport.
    const natural=Math.max(0,...tables.map(t=>Math.max(
      t.scrollWidth,Math.ceil(t.getBoundingClientRect().width))));
    const overview=document.querySelector("#oddsList");
    const viewport=overview?Math.ceil(overview.getBoundingClientRect().width):0;
    return Math.max(EXPORT_WIDTH,Math.min(1800,Math.max(natural,viewport)));
  }
  function prepareOneLine(root) {
    for (const group of root.querySelectorAll(".odds-group")) {
      // No new league heading: keep the cloned on-screen logo and title.
      const title=group.querySelector(".odds-league-heading span:last-child");
      if (title) {
        title.style.setProperty("white-space","nowrap","important");
        title.style.setProperty("overflow-wrap","normal","important");
      }
      for (const pair of group.querySelectorAll(".odds-matchup")) {
        pair.style.setProperty("flex-wrap","nowrap","important");
        const labels=[...pair.querySelectorAll(".club-label")];
        for (const name of labels) {
          name.style.setProperty("white-space","nowrap","important");
          name.style.setProperty("overflow-wrap","normal","important");
          name.style.setProperty("word-break","normal","important");
          name.style.setProperty("flex","1 1 0","important");
          name.style.setProperty("min-width","0","important");
          name.style.setProperty("overflow","hidden","important");
          // Preserve a bold readable minimum. Never hide a long Burmese
          // team name: wrap that one label rather than shrinking to tiny type.
          let px=parseFloat(getComputedStyle(name).fontSize)||25;
          while (name.scrollWidth>name.clientWidth+1 && px>27) {
            px-=0.5;
            name.style.setProperty("font-size",px+"px","important");
          }
          if(name.scrollWidth>name.clientWidth+1) {
            name.style.setProperty("white-space","normal","important");
            name.style.setProperty("overflow","visible","important");
            name.style.setProperty("overflow-wrap","anywhere","important");
          }
        }
      }
    }
  }
  function cloneWebsiteOdds(rows,theme,date) {
    const sheet=typeof loadedSheet!=="undefined"?loadedSheet:null;
    const current=[...document.querySelectorAll("#oddsList .odds-group")];
    if (!sheet?.matches?.length||!current.length)
      throw Error("Website ပေါက်ကြေးဇယား မရသေးပါ။");
    const leagues=[...new Set(sheet.matches.map(m=>m.league))];
    if (leagues.length!==current.length)
      throw Error("Website ပေါက်ကြေးဇယား မပြည့်စုံပါ။ Refresh လုပ်ကြည့်ပါ။");
    const live=new Map(leagues.map((league,i)=>[league,current[i]]));
    const selected=new Map();
    for(const row of rows) {
      if (!selected.has(row.league)) selected.set(row.league,[]);
      selected.get(row.league).push(row);
    }
    const width=getTableWidth();
    const stage=document.createElement("div");
    stage.setAttribute("aria-hidden","true");
    stage.style.cssText="position:fixed;left:0;top:0;width:"+width+
      "px;pointer-events:none;overflow:visible;z-index:-1000;";
    const root=document.createElement("div");
    root.className="odds-content fc-odds-direct-export";
    root.style.cssText="box-sizing:border-box;width:"+width+
      "px;max-width:none;margin:0;padding:8px;background:#10191d;";
    root.style.setProperty("--sheet-brand",theme);
    root.style.setProperty("--sheet-deep",shade(theme,.7));
    root.style.setProperty("--sheet-title","#fff");
    // Date-only title, as approved for the existing frame export.
    const dateBar=document.createElement("div");
    dateBar.textContent=String(date||"");
    dateBar.className="fc-odds-date-heading";
    dateBar.style.cssText="margin:0 0 12px;text-align:center;padding:8px 0;"+
      "background:"+shade(theme,.7)+";color:#fff;border-radius:7px;"+
      "font:900 34px/1.7 'Noto Sans Myanmar',sans-serif;";
    root.appendChild(dateBar);
    for(const [league,included] of selected) {
      const source=live.get(league);
      if (!source) throw Error("လိဂ်ဇယား မတွေ့ပါ — "+league);
      const originals=sheet.matches.filter(m=>m.league===league);
      const wanted=new Set(included.map(m=>originals.indexOf(m)));
      if(wanted.has(-1)) throw Error("ပွဲစဉ်အချက်အလက် မကိုက်ညီပါ။");
      const group=source.cloneNode(true);
      group.querySelectorAll(".odds-league-png-parts,button").forEach(n=>n.remove());
      const trs=[...group.querySelectorAll("tbody tr")];
      if(trs.length!==originals.length)throw Error("Website ပွဲအရေအတွက် မကိုက်ညီပါ။");
      trs.forEach((tr,i)=>{if(!wanted.has(i))tr.remove();});
      // Retain every original website cell, logo, caption and odds value.
      // Export-only typography is applied on this cloned table below.
      group.style.setProperty("margin","0 0 12px","important");
      root.appendChild(group);
    }
    const readable=document.createElement("style");
    // Scoped to the temporary clone, so website display and brand mirrors do
    // not change. Enlarge the CONTENT relative to its width (DPI alone does not).
    readable.textContent=`
      body .fc-odds-direct-export .odds-group {
        max-width:none!important;width:100%!important;margin:0 0 16px!important;
      }
      body .fc-odds-direct-export .odds-table-wrap {
        width:100%!important;overflow:visible!important;
      }
      body .fc-odds-direct-export .odds-group .odds-table {
        width:100%!important;min-width:0!important;max-width:none!important;
        table-layout:fixed!important;font-size:23px!important;
      }
      body .fc-odds-direct-export .odds-group .odds-table th {
        font:800 21px/1.55 "Noto Sans Myanmar",sans-serif!important;
        padding:15px 7px!important;letter-spacing:0!important;
      }
      body .fc-odds-direct-export .odds-group .odds-table thead .odds-heading-row th {
        font-size:21px!important;padding:13px 6px!important;
      }
      body .fc-odds-direct-export .odds-group .odds-table thead .odds-subheading-row th {
        font-size:20px!important;padding:9px 5px!important;
      }
      body .fc-odds-direct-export .odds-group .odds-table tbody td {
        font:800 22px/1.6 "Noto Sans Myanmar",sans-serif!important;
        padding:17px 7px!important;vertical-align:middle!important;
      }
      body .fc-odds-direct-export .odds-group .odds-table tbody td.time {
        font:900 22px/1.55 "Noto Sans Myanmar",sans-serif!important;
        white-space:normal!important;
      }
      body .fc-odds-direct-export .odds-group .odds-table tbody td.upper {
        font:900 22px/1.6 "Noto Sans Myanmar",sans-serif!important;
      }
      body .fc-odds-direct-export .odds-group .odds-table tbody td.price {
        font:900 26px/1.4 "Barlow Condensed","Noto Sans Myanmar",sans-serif!important;
        white-space:nowrap!important;
      }
      body .fc-odds-direct-export .odds-group .odds-table tbody td.prediction {
        font:900 24px/1.4 "Barlow Condensed","Noto Sans Myanmar",sans-serif!important;
        white-space:nowrap!important;
      }
      body .fc-odds-direct-export .odds-matchup {
        display:flex!important;gap:8px!important;align-items:center!important;
        flex-wrap:nowrap!important;
      }
      body .fc-odds-direct-export .odds-matchup .club-label {
        font:900 25px/1.6 "Noto Sans Myanmar",sans-serif!important;
        min-width:0!important;letter-spacing:0!important;
      }
      body .fc-odds-direct-export .odds-matchup .team-badge {
        width:47px!important;height:47px!important;flex:0 0 47px!important;
      }
      body .fc-odds-direct-export .odds-matchup .mini-vs {
        font:900 21px/1.2 "Barlow Condensed",sans-serif!important;
      }
      body .fc-odds-direct-export .main-compact-odds th.main-league-logo .league-crest,
      body .fc-odds-direct-export .main-compact-odds th.main-league-logo .league-mark {
        width:56px!important;height:56px!important;
      }
      body .fc-odds-direct-export .main-compact-odds th.main-league-name {
        font:900 23px/1.6 "Noto Sans Myanmar",sans-serif!important;
        white-space:normal!important;
      }
    `;
    // Red/black sample-inspired styling is isolated to the invisible export clone.
    readable.textContent += "\nbody .fc-odds-direct-export {background:#100608!important;font-family:\"Noto Sans Myanmar\",sans-serif!important}\nbody .fc-odds-direct-export .fc-odds-date-heading {background:linear-gradient(110deg,#210306,#d5121c,#220408)!important;border:3px solid #ea2935!important;border-radius:12px!important;font-size:34px!important;margin-bottom:22px!important}\nbody .fc-odds-direct-export .odds-group {border:3px solid #e12c35!important;border-radius:14px!important;overflow:hidden!important;margin-bottom:25px!important}\nbody .fc-odds-direct-export .odds-group .odds-table {width:100%!important;min-width:0!important;max-width:none!important;border-collapse:collapse!important}\nbody .fc-odds-direct-export .odds-group .odds-table thead tr th {background:linear-gradient(110deg,#0b0b0e,#ba0712,#240408)!important;border:2px solid #dc464b!important;color:#fff!important;font:900 30px/1.55 \"Noto Sans Myanmar\",sans-serif!important;padding:17px 7px!important;text-align:center!important;white-space:normal!important}\nbody .fc-odds-direct-export .odds-group .odds-table thead .odds-subheading-row th {background:linear-gradient(#27282d,#09090a)!important;font-size:27px!important;padding:10px 5px!important}\nbody .fc-odds-direct-export .odds-group .odds-table th.main-league-name {font:900 37px/1.55 \"Noto Sans Myanmar\",sans-serif!important}\nbody .fc-odds-direct-export .main-compact-odds th.main-league-logo .league-crest,body .fc-odds-direct-export .main-compact-odds th.main-league-logo .league-mark {width:75px!important;height:75px!important;border-radius:10px!important;padding:4px!important;background:#fff!important;object-fit:contain!important}\nbody .fc-odds-direct-export .odds-group .odds-table tbody td {background:#fff!important;color:#111!important;border:2px solid #d8dade!important;font:900 32px/1.6 \"Noto Sans Myanmar\",sans-serif!important;padding:24px 8px!important;white-space:normal!important}\nbody .fc-odds-direct-export .odds-group .odds-table tbody td.time {background:linear-gradient(#f3212e,#99050d)!important;color:#fff!important;font-size:30px!important;white-space:normal!important}\nbody .fc-odds-direct-export .odds-group .odds-table tbody td.upper {background:#ffe4e6!important;color:#180b0c!important;font-size:32px!important;overflow-wrap:anywhere!important}\nbody .fc-odds-direct-export .odds-group .odds-table tbody td.price,body .fc-odds-direct-export .odds-group .odds-table tbody td.prediction {background:#fff!important;color:#09090d!important;font:900 42px/1.35 \"Barlow Condensed\",\"Noto Sans Myanmar\",sans-serif!important;padding:24px 3px!important;white-space:nowrap!important;text-align:center!important}\nbody .fc-odds-direct-export .odds-group .odds-table tbody td.odds-current {background:#fff5f5!important;color:#d10c19!important;border-left:2px solid #ff9da3!important}\nbody .fc-odds-direct-export .odds-matchup .club-label {font:900 35px/1.55 \"Noto Sans Myanmar\",sans-serif!important;color:#08090d!important}\nbody .fc-odds-direct-export .odds-matchup .team-badge {width:59px!important;height:59px!important;flex:0 0 59px!important}\nbody .fc-odds-direct-export .odds-matchup .mini-vs {font:900 30px/1.2 \"Barlow Condensed\",sans-serif!important;color:#e00c1b!important}";
    stage.appendChild(readable);
    stage.appendChild(root);
    document.body.appendChild(stage);
    return {stage,root,width};
  }

  function captureFailure(error) {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === "string" && error.trim()) return error.trim();
    if (error && typeof error === "object") {
      const message=String(error.message||error.reason||error.type||error.name||"");
      if(message.trim())return message.slice(0,180);
    }
    return "Browser Screenshot Error";
  }
  async function limited(promise,ms,label) {
    let timeout;
    try {
      return await Promise.race([
        promise,
        new Promise((_,reject)=>{
          timeout=setTimeout(()=>reject(Error(label+" အချိန်ကြာလွန်းပါသည်")),ms);
        })
      ]);
    } finally {clearTimeout(timeout);}
  }
  async function captureWebsite(rows,theme,date) {
    const {stage,root,width}=cloneWebsiteOdds(rows,theme,date);
    try {
      await waitFonts();
      prepareOneLine(root);
      const images=[...root.querySelectorAll("img")];
      images.forEach(img=>{img.loading="eager";img.decoding="sync";});
      // Keep every website logo in the actual cloned DOM.
      await Promise.race([
        Promise.allSettled(images.map(img=>img.decode?img.decode():Promise.resolve())),
        new Promise(resolve=>setTimeout(resolve,4000))
      ]);
      await waitFrame();
      const height=Math.ceil(root.scrollHeight);
      if(height<70||height>13000)
        throw Error("PNG ပုံအမြင့်များလွန်းပါသည်။ ပုံခွဲ၍ Download လုပ်ပါ။");
      const errors=[];

      // Primary: locally vendored html2canvas captures the already-styled
      // WEBSITE DOM (headers, logos, layout, text) without rebuilding a table.
      // Unlike the 2017 SVG serializer it tolerates blocked cross-origin
      // crests and CSS font-face rules without rejecting the whole image.
      if(typeof window.html2canvas==="function") {
        try {
          const canvas=await limited(window.html2canvas(root,{
            backgroundColor:"#10191d",
            scale:SCALE,
            useCORS:true,
            allowTaint:false,
            imageTimeout:6500,
            logging:false,
            removeContainer:true,
            width:width,
            height:height,
            windowWidth:Math.max(1250,width),
            windowHeight:Math.max(800,Math.min(17000,height)),
            scrollX:0,
            scrollY:0,
            foreignObjectRendering:false
          }),25000,"Website HTML Screenshot");
          if(!canvas||!canvas.width||!canvas.height)
            throw Error("HTML Screenshot canvas အလွတ်ဖြစ်နေပါသည်");
          window.FutureCodeOddsDomFrame.lastCapture="html2canvas-website-dom";
          return {picture:canvas,height:canvas.height,width:canvas.width};
        }catch(error){
          errors.push("HTML: "+captureFailure(error));
          console.warn("Main odds HTML screenshot failed",error);
        }
      }else errors.push("HTML: Screenshot Library မရပါ");

      // Secondary: original SVG DOM capture. Still no synthetic/redrawn table.
      if(window.domtoimage?.toBlob) {
        try {
          const blob=await limited(window.domtoimage.toBlob(root,{
            bgcolor:"#10191d",
            width:width*SCALE,
            height:height*SCALE,
            style:{
              width:width+"px",
              height:height+"px",
              transform:"scale("+SCALE+")",
              transformOrigin:"top left"
            },
            imagePlaceholder:"data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
          }),20000,"Website SVG Screenshot");
          if(!blob?.size)throw Error("SVG Screenshot ဖိုင်အလွတ်ဖြစ်နေပါသည်");
          const picture=await blobImage(blob);
          window.FutureCodeOddsDomFrame.lastCapture="svg-website-dom";
          return {picture,height:height*SCALE,width:width*SCALE};
        }catch(error){
          errors.push("SVG: "+captureFailure(error));
          console.warn("Main odds SVG screenshot failed",error);
        }
      }else errors.push("SVG: Screenshot Library မရပါ");

      throw Error("Website PNG Screenshot မအောင်မြင်ပါ — "+errors.join(" / "));
    }finally{
      stage.remove();
    }
  }

  // A 1:1 poster screenshot of the REAL website rows, not invented odds data.
  async function draw(rows,settings) {
    if(!Array.isArray(rows)||!rows.length)throw Error("ပေါက်ကြေး ပွဲစာရင်းမရှိပါ။");
    const design=settings.design;
    const best=design[0]==="best",colourOnly=design[0]==="colour";
    const theme=best?"#c41017":colourOnly?settings.colour:design[2];
    const framed=Boolean(design[3]),dir="./assets/table-odds-frames/";
    const banner=framed?await localArtwork(dir+design[0]+"-frame.jpg"):null;
    const top=(!framed&&!colourOnly)?await localArtwork(dir+design[0]+"-top.jpg"):null;
    const bottom=(!framed&&!colourOnly)?await localArtwork(dir+design[0]+"-bottom.jpg"):null;
    const shot=await captureWebsite(rows,theme,settings.date);
    const W=2160,H=2160;
    const {canvas,ctx}=window.FutureCodeCanvasKit.create(W,H);
    if(canvas.width!==W||canvas.height!==H)throw Error("Square PNG အရွယ်အစား မမှန်ပါ။");
    const topRatio=design[3]?.top||0,bottomRatio=design[3]?.bottom||0;
    const naturalTop=banner?banner.height*topRatio*W/banner.width:
      top?top.height*W/top.width:W*.15;
    const naturalBottom=banner?banner.height*bottomRatio*W/banner.width:
      bottom?bottom.height*W/bottom.width:W*.12;
    const topH=colourOnly?320:Math.min(470,Math.round(naturalTop));
    const bottomH=colourOnly?250:Math.min(310,Math.round(naturalBottom));
    const pad=18,usable=H-topH-bottomH-2*pad;
    if(usable<350)throw Error("Frame အတွက် နေရာမလုံလောက်ပါ။");
    ctx.fillStyle="#100608";ctx.fillRect(0,0,W,H);
    ctx.fillStyle=shade(theme,.4);ctx.fillRect(0,topH,W,H-topH);
    ctx.fillStyle=theme;ctx.fillRect(0,topH-10,W,10);ctx.fillRect(0,H-bottomH,W,10);
    function artwork(fn){
      ctx.save();
      if(best)ctx.filter="hue-rotate(120deg) saturate(1.3)";
      fn();ctx.restore();
    }
    if(banner&&topH&&topRatio)artwork(()=>ctx.drawImage(banner,0,0,banner.width,banner.height*topRatio,0,0,W,topH));
    else if(top)artwork(()=>ctx.drawImage(top,0,0,W,topH));
    if(banner&&bottomH&&bottomRatio)artwork(()=>ctx.drawImage(banner,0,banner.height*(1-bottomRatio),banner.width,banner.height*bottomRatio,0,H-bottomH,W,bottomH));
    else if(bottom)artwork(()=>ctx.drawImage(bottom,0,H-bottomH,W,bottomH));
    if(colourOnly){
      ctx.fillStyle=shade(theme,.65);ctx.fillRect(0,0,W,topH);ctx.fillRect(0,H-bottomH,W,bottomH);
      ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#fff";
      ctx.font='900 94px "Barlow Condensed",sans-serif';
      ctx.fillText("FUTURE CODE FOOTBALL DAILY",W/2,105,W-80);
      ctx.font='900 72px "Noto Sans Myanmar",sans-serif';
      ctx.fillText("ယနေ့ ပေါက်ကြေးများ",W/2,225,W-80);
      ctx.font='800 50px "Noto Sans Myanmar",sans-serif';
      ctx.fillText("မြန်မာကြေး · မူလ / ယခု",W/2,H-bottomH+95,W-120);
      ctx.font='900 49px "Barlow Condensed",sans-serif';
      ctx.fillText("FUTURE CODE FOOTBALL",W/2,H-68,W-100);
    }
    // Never cut off a market column, team logo, original price or latest price.
    const ratio=Math.min((W-2*pad)/shot.width,usable/shot.height);
    const cw=Math.round(shot.width*ratio),ch=Math.round(shot.height*ratio);
    const x=Math.round((W-cw)/2),y=topH+pad+Math.round((usable-ch)/2);
    ctx.fillStyle="#080608";ctx.fillRect(x-5,y-5,cw+10,ch+10);
    ctx.drawImage(shot.picture,x,y,cw,ch);
    ctx.strokeStyle=theme;ctx.lineWidth=6;ctx.strokeRect(x-3,y-3,cw+6,ch+6);
    return canvas;
  }
  window.FutureCodeOddsDomFrame={draw};
})();

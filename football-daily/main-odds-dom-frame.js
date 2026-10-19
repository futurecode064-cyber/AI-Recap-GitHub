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
  const EXPORT_WIDTH = 1280;

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
    // Export typography is measured against a fixed editorial width, independent
    // of a phone's scroll width or a desktop monitor's viewport.
    return EXPORT_WIDTH;
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
        // Each fixture uses the same five tracks. Team-name lengths can no
        // longer push the crests or VS mark sideways from row to row.
        pair.style.setProperty("display","grid","important");
        pair.style.setProperty("grid-template-columns","minmax(0,1fr) 47px 26px 47px minmax(0,1fr)","important");
        pair.style.setProperty("column-gap","3px","important");
        pair.style.setProperty("align-items","center","important");
        pair.style.setProperty("width","100%","important");
        const labels=[...pair.querySelectorAll(".club-label")];
        for (const name of labels) {
          name.style.setProperty("white-space","nowrap","important");
          name.style.setProperty("overflow-wrap","normal","important");
          name.style.setProperty("word-break","normal","important");
          name.style.setProperty("flex","1 1 auto","important");
          name.style.setProperty("min-width","0","important");
          name.style.setProperty("overflow","hidden","important");
          // Keep the crest, VS and both names on one baseline. Reduce the
          // label font only as needed to fit the actual name in this cell.
          let px=parseFloat(getComputedStyle(name).fontSize)||25;
          while (name.scrollWidth>name.clientWidth+1 && px>18) {
            px-=0.5;
            name.style.setProperty("font-size",px+"px","important");
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
    root.style.setProperty("--export-tint",theme+"22");
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
      body .fc-odds-direct-export .main-compact-odds .odds-table colgroup col:nth-child(1){width:9%!important}
      body .fc-odds-direct-export .main-compact-odds .odds-table colgroup col:nth-child(2){width:31%!important}
      body .fc-odds-direct-export .main-compact-odds .odds-table colgroup col:nth-child(3){width:13%!important}
      body .fc-odds-direct-export .main-compact-odds .odds-table colgroup col:nth-child(4),
      body .fc-odds-direct-export .main-compact-odds .odds-table colgroup col:nth-child(5),
      body .fc-odds-direct-export .main-compact-odds .odds-table colgroup col:nth-child(6),
      body .fc-odds-direct-export .main-compact-odds .odds-table colgroup col:nth-child(7){width:9%!important}
      body .fc-odds-direct-export .main-compact-odds .odds-table colgroup col:nth-child(8){width:11%!important}
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
        display:grid!important;
        grid-template-columns:minmax(0,1fr) 47px 26px 47px minmax(0,1fr)!important;
        column-gap:3px!important;align-items:center!important;
      }
      body .fc-odds-direct-export .odds-matchup .club-label {
        font:900 25px/1.6 "Noto Sans Myanmar",sans-serif!important;
        min-width:0!important;letter-spacing:0!important;white-space:nowrap!important;
        overflow:hidden!important;overflow-wrap:normal!important;word-break:normal!important;
        width:100%!important;max-width:100%!important;flex:none!important;
      }
      body .fc-odds-direct-export .odds-matchup .team-badge {
        width:43px!important;height:43px!important;flex:0 0 43px!important;
        align-self:center!important;object-fit:contain!important;
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
    // Every coloured surface follows the selected frame; artwork keeps its
    // original colours. White cells and dark type preserve market contrast.
    readable.textContent += `
      body .fc-odds-direct-export {background:#101014!important}
      body .fc-odds-direct-export .odds-league-header {display:none!important}
      body .fc-odds-direct-export .fc-odds-date-heading {
        background:linear-gradient(110deg,#111,var(--sheet-brand),#111)!important;
        border:2px solid var(--sheet-brand)!important;font-size:32px!important;margin-bottom:10px!important;
      }
      body .fc-odds-direct-export .odds-group {
        border:2px solid var(--sheet-brand)!important;border-radius:10px!important;
        overflow:hidden!important;margin-bottom:12px!important;
      }
      body .fc-odds-direct-export .odds-group .odds-table {
        border-collapse:collapse!important;
      }
      body .fc-odds-direct-export .odds-group .odds-table thead tr th {
        background:linear-gradient(120deg,#111,var(--sheet-deep))!important;
        color:#fff!important;border:1px solid var(--sheet-brand)!important;
        font:900 24px/1.6 "Noto Sans Myanmar",sans-serif!important;padding:9px 4px!important;
      }
      body .fc-odds-direct-export .odds-group .odds-table thead .odds-subheading-row th {
        background:#19191d!important;font-size:22px!important;padding:4px!important;
      }
      body .fc-odds-direct-export .odds-group .odds-table th.main-league-name {
        font-size:32px!important;text-align:left!important;padding-left:12px!important;
      }
      body .fc-odds-direct-export .main-compact-odds th.main-league-logo .league-crest,
      body .fc-odds-direct-export .main-compact-odds th.main-league-logo .league-mark {
        width:75px!important;height:75px!important;background:#fff!important;border-radius:8px!important;padding:4px!important;
      }
      body .fc-odds-direct-export .odds-group .odds-table tbody td {
        background:#fff!important;color:#101014!important;border:1px solid #c8c8cc!important;
        font:900 29px/1.65 "Noto Sans Myanmar",sans-serif!important;padding:14px 4px!important;
      }
      body .fc-odds-direct-export .odds-group .odds-table tbody td.time {
        background:var(--sheet-deep)!important;color:#fff!important;font-size:25px!important;
      }
      body .fc-odds-direct-export .odds-group .odds-table tbody td.upper {
        background:linear-gradient(var(--export-tint),var(--export-tint)),#fff!important;font-size:28px!important;
      }
      body .fc-odds-direct-export .odds-group .odds-table tbody td.price,
      body .fc-odds-direct-export .odds-group .odds-table tbody td.prediction {
        font:900 36px/1.4 "Barlow Condensed","Noto Sans Myanmar",sans-serif!important;
        white-space:nowrap!important;text-align:center!important;padding:14px 2px!important;
      }
      body .fc-odds-direct-export .odds-group .odds-table tbody td.odds-current {
        color:var(--sheet-deep)!important;
      }
      body .fc-odds-direct-export .odds-matchup {column-gap:3px!important}
      body .fc-odds-direct-export .odds-matchup .club-label {
        font:900 31px/1.65 "Noto Sans Myanmar",sans-serif!important;
      }
      body .fc-odds-direct-export .odds-matchup .team-badge {
        width:47px!important;height:47px!important;flex:0 0 47px!important;
      }
      body .fc-odds-direct-export .odds-matchup .mini-vs {
        color:var(--sheet-deep)!important;font-size:26px!important;
      }
      body .fc-odds-direct-export .club-label,
      body .fc-odds-direct-export .odds-table th,
      body .fc-odds-direct-export .odds-table td.upper {
        font-variation-settings:"wdth" 75!important;
      }
      body .fc-odds-direct-export td::before {display:none!important}
    `;
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
      if(document.fonts?.load)await limited(document.fonts.load('900 31px "Noto Sans Myanmar"', "မြန်မာ ပေါက်ကြေး"),15000,"မြန်မာဖောင့်");
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

  // A close-fit poster screenshot of the REAL website rows, not invented odds data.
  async function draw(rows,settings) {
    if(!Array.isArray(rows)||!rows.length)throw Error("ပေါက်ကြေး ပွဲစာရင်းမရှိပါ။");
    const design=settings.design;
    const colourOnly=design[0]==="colour";
    const theme=colourOnly?settings.colour:design[2];
    const framed=Boolean(design[3]),dir="./assets/table-odds-frames/";
    const banner=framed?await localArtwork(dir+design[0]+"-frame.jpg"):null;
    const top=(!framed&&!colourOnly)?await localArtwork(dir+design[0]+"-top.jpg"):null;
    const bottom=(!framed&&!colourOnly)?await localArtwork(dir+design[0]+"-bottom.jpg"):null;
    const shot=await captureWebsite(rows,theme,settings.date);
    const W=2160;
    const {canvas,ctx}=window.FutureCodeCanvasKit.create(W,1);
    const topRatio=design[3]?.top||0,bottomRatio=design[3]?.bottom||0;
    const topH=colourOnly?0:Math.round(banner&&topRatio?banner.height*topRatio*W/banner.width:
      top?top.height*W/top.width:0);
    const bottomH=colourOnly?0:Math.round(banner&&bottomRatio?banner.height*bottomRatio*W/banner.width:
      bottom?bottom.height*W/bottom.width:0);
    const pad=12,ratio=(W-2*pad)/shot.width;
    const tableH=Math.round(shot.height*ratio);
    const H=Math.max(320,topH+bottomH+2*pad+tableH);
    canvas.height=H;
    if(canvas.width!==W||canvas.height!==H)throw Error("PNG ပုံအရွယ်အစား မမှန်ပါ။");
    ctx.fillStyle="#100608";ctx.fillRect(0,0,W,H);
    ctx.fillStyle=shade(theme,.4);ctx.fillRect(0,0,W,H);
    ctx.fillStyle=theme;ctx.fillRect(0,topH-10,W,10);ctx.fillRect(0,H-bottomH,W,10);
    function artwork(fn){
      ctx.save();
      // Preserve the supplied frame artwork without hue rotation.
      fn();ctx.restore();
    }
    if(banner&&topH&&topRatio)artwork(()=>ctx.drawImage(banner,0,0,banner.width,banner.height*topRatio,0,0,W,topH));
    else if(top)artwork(()=>ctx.drawImage(top,0,0,W,topH));
    if(banner&&bottomH&&bottomRatio)artwork(()=>ctx.drawImage(banner,0,banner.height*(1-bottomRatio),banner.width,banner.height*bottomRatio,0,H-bottomH,W,bottomH));
    else if(bottom)artwork(()=>ctx.drawImage(bottom,0,H-bottomH,W,bottomH));
    // Fill the poster width with the actual website table and put the frame
    // banners directly beside it, without square-canvas letterboxing.
    const cw=Math.round(shot.width*ratio),ch=Math.round(shot.height*ratio);
    const x=Math.round((W-cw)/2),y=topH+pad;
    ctx.fillStyle="#080608";ctx.fillRect(x-5,y-5,cw+10,ch+10);
    ctx.drawImage(shot.picture,x,y,cw,ch);
    ctx.strokeStyle=theme;ctx.lineWidth=6;ctx.strokeRect(x-3,y-3,cw+6,ch+6);
    return canvas;
  }
  window.FutureCodeOddsDomFrame={draw};
})();

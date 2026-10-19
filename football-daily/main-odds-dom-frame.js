"use strict";
/* FUTURE CODE MAIN ONLY — a PNG is a screenshot of the ACTUAL website
 * odds HTML table. Frame selection changes its palette and surrounds it with the selected banners.
 * Never redraw or rebuild league headers, team names or table columns. */
(function () {
  if (document.documentElement.dataset.footballBrandName ||
      !/^\/odds(?:\.html)?\/?$/.test(location.pathname)) return;

  const SCALE = 2;

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
    return Math.min(1140,Math.max(970,natural,viewport));
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
          // Keep the real website font unless a particularly long name cannot
          // fit in its EXISTING column; then only shrink that specific label.
          let px=parseFloat(getComputedStyle(name).fontSize)||15;
          while (name.scrollWidth>name.clientWidth+1 && px>11) {
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
    // Date-only title, as approved for the existing frame export.
    const dateBar=document.createElement("div");
    dateBar.textContent=String(date||"");
    dateBar.className="fc-odds-date-heading";
    dateBar.style.cssText="margin:0 0 12px;text-align:center;padding:8px 0;"+
      "background:"+shade(theme,.7)+";color:#fff;border-radius:7px;"+
      "font:800 17px/1.7 'Noto Sans Myanmar',sans-serif;";
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
      // No forced font sizes, no new columns, no replacement logos/header.
      group.style.setProperty("margin","0 0 12px","important");
      root.appendChild(group);
    }
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

  async function draw(rows,settings) {
    const design=settings.design;
    const theme=design[0]==="colour"?settings.colour:design[2];
    const colourOnly=design[0]==="colour",framed=Boolean(design[3]);
    const dir="./assets/table-odds-frames/";
    const banner=framed?await localArtwork(dir+design[0]+"-frame.jpg"):null;
    const top=(!framed&&!colourOnly)?await localArtwork(dir+design[0]+"-top.jpg"):null;
    const bottom=(!framed&&!colourOnly)?await localArtwork(dir+design[0]+"-bottom.jpg"):null;
    const shot=await captureWebsite(rows,theme,settings.date);
    if(colourOnly)return shot.picture;
    const W=shot.width,topPart=design[3]?.top||0,bottomPart=design[3]?.bottom||0;
    const topH=banner?Math.round(banner.height*topPart*W/banner.width):Math.round(top.height*W/top.width);
    const bottomH=banner?Math.round(banner.height*bottomPart*W/banner.width):Math.round(bottom.height*W/bottom.width);
    const {canvas,ctx}=window.FutureCodeCanvasKit.create(W,shot.height+topH+bottomH);
    ctx.fillStyle=shade(theme,.55);ctx.fillRect(0,0,W,canvas.height);
    if(banner&&topH)ctx.drawImage(banner,0,0,banner.width,banner.height*topPart,0,0,W,topH);
    else if(top)ctx.drawImage(top,0,0,W,topH);
    ctx.drawImage(shot.picture,0,topH,W,shot.height);
    if(banner&&bottomH)ctx.drawImage(banner,0,banner.height*(1-bottomPart),banner.width,banner.height*bottomPart,0,topH+shot.height,W,bottomH);
    else if(bottom)ctx.drawImage(bottom,0,topH+shot.height,W,bottomH);
    return canvas;
  }
  window.FutureCodeOddsDomFrame={draw};
})();

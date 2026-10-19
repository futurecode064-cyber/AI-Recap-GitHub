"use strict";
/* FUTURE CODE MAIN ONLY — a PNG is a screenshot of the ACTUAL website
 * odds HTML table. Frame selection changes its palette and artwork ONLY.
 * Never redraw or rebuild league headers, team names or table columns. */
(function () {
  if (document.documentElement.dataset.footballBrandName ||
      !/^\/odds(?:\.html)?\/?$/.test(location.pathname)) return;

  const SCALE = 2;
  const artworkCache = new Map();

  function shade(hex, f) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return "#153d38";
    return "#" + hex.slice(1).match(/../g).map(x =>
      Math.max(0,Math.min(255,Math.round(parseInt(x,16)*f)))
        .toString(16).padStart(2,"0")).join("");
  }
  function localArtwork(url) {
    if (!artworkCache.has(url)) artworkCache.set(url,new Promise((resolve,reject)=>{
      const img = new Image();
      const timer = setTimeout(()=>reject(Error("Frame Banner တင်ချိန်ကြာနေပါသည်")),15000);
      img.onload=()=>{clearTimeout(timer);resolve(img);};
      img.onerror=()=>{clearTimeout(timer);reject(Error("Frame Banner မရပါ — "+url));};
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
    stage.style.cssText="position:fixed;left:-30000px;top:0;width:"+width+
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
  async function captureWebsite(rows,theme,date) {
    if(!window.domtoimage?.toBlob)
      throw Error("Website Screenshot Library မရသေးပါ။ Refresh လုပ်ပါ။");
    const {stage,root,width}=cloneWebsiteOdds(rows,theme,date);
    try {
      await waitFonts();
      prepareOneLine(root);
      const images=[...root.querySelectorAll("img")];
      images.forEach(i=>{i.loading="eager";i.decoding="sync";});
      // Image requests use the same URLs as the visible website, not a new
      // drawing system. Wait briefly for browser-cached logos.
      await Promise.race([
        Promise.allSettled(images.map(i=>i.decode?i.decode():Promise.resolve())),
        new Promise(resolve=>setTimeout(resolve,5000))
      ]);
      await waitFrame();
      const height=Math.ceil(root.scrollHeight);
      if(height<70||height>13000)
        throw Error("PNG ပုံအမြင့်များလွန်းပါသည်။ ပုံခွဲ၍ Download လုပ်ပါ။");

      let timer;
      try {
        const blob=await Promise.race([
          window.domtoimage.toBlob(root,{
            bgcolor:"#10191d",width:width*SCALE,height:height*SCALE,
            style:{
              width:width+"px",height:height+"px",
              transform:"scale("+SCALE+")",transformOrigin:"top left"
            },
            imagePlaceholder:"data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
          }),
          new Promise((_,reject)=>{timer=setTimeout(
            ()=>reject(Error("Website Screenshot အချိန်ကုန်သွားပါပြီ")),28000);})
        ]);
        if(!blob?.size)throw Error("Website Screenshot ဖိုင်အလွတ် ဖြစ်နေပါသည်။");
        const picture=await blobImage(blob);
        window.FutureCodeOddsDomFrame.lastCapture="exact-website-dom";
        return {picture,height:height*SCALE,width:width*SCALE};
      }finally{clearTimeout(timer);}
    } finally {stage.remove();}
  }
  async function draw(rows,settings){
    const kit=window.FutureCodeCanvasKit;
    if(!kit)throw Error("PNG Canvas module မရသေးပါ။");
    const design=settings.design;
    const theme=design[0]==="colour"?settings.colour:design[2];
    // Keep each selected frame's EXISTING top/bottom banner, if provided.
    const framed=Boolean(design[3]),colourOnly=design[0]==="colour";
    const dir="./assets/table-odds-frames/";
    const banner=framed?await localArtwork(dir+design[0]+"-frame.jpg"):null;
    const top=(!framed&&!colourOnly)?await localArtwork(dir+design[0]+"-top.jpg"):null;
    const bottom=(!framed&&!colourOnly)?await localArtwork(dir+design[0]+"-bottom.jpg"):null;
    const shot=await captureWebsite(rows,theme,settings.date);
    const W=shot.width,topPart=framed?design[3].top:0;
    const bottomPart=framed?design[3].bottom:0;
    const topH=banner?Math.round(banner.height*topPart*W/banner.width):
      top?Math.round(top.height*W/top.width):0;
    const bottomH=banner?Math.round(banner.height*bottomPart*W/banner.width):
      bottom?Math.round(bottom.height*W/bottom.width):0;
    const {canvas,ctx}=kit.create(W,shot.height+topH+bottomH);
    ctx.fillStyle=shade(theme,.55);
    ctx.fillRect(0,0,W,canvas.height);
    if(banner&&topH)
      ctx.drawImage(banner,0,0,banner.width,banner.height*topPart,0,0,W,topH);
    else if(top)ctx.drawImage(top,0,0,W,topH);
    ctx.drawImage(shot.picture,0,topH,W,shot.height);
    if(banner&&bottomH)
      ctx.drawImage(banner,0,banner.height*(1-bottomPart),banner.width,
        banner.height*bottomPart,0,topH+shot.height,W,bottomH);
    else if(bottom)ctx.drawImage(bottom,0,topH+shot.height,W,bottomH);
    return canvas;
  }
  window.FutureCodeOddsDomFrame={draw};
})();
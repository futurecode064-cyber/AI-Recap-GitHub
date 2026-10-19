"use strict";
/* Main odds PNG: capture the actual HTML odds groups.  The selected frame
   changes branding (banner and header palette), not the table layout. */
(function () {
  if (document.documentElement.dataset.footballBrandName ||
      !/^\/odds(?:\.html)?\/?$/.test(location.pathname)) return;

  const WIDTH = 1140, SCALE = 2;
  const imageCache = new Map();
  function loadImage(src) {
    if (!imageCache.has(src)) imageCache.set(src, new Promise((resolve, reject) => {
      const im = new Image();
      const timer = setTimeout(() => resolve(null), 5000);
      im.onload = () => { clearTimeout(timer); resolve(im); };
      im.onerror = () => { clearTimeout(timer); resolve(null); };
      im.src = src;
    }));
    return imageCache.get(src);
  }
  function shade(hex, factor) {
    return "#" + hex.slice(1).match(/../g).map(c =>
      Math.max(0, Math.min(255, Math.round(parseInt(c, 16) * factor))).toString(16).padStart(2, "0")
    ).join("");
  }
  function asImage(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("PNG Preview ဖွင့်မရပါ")); };
      image.src = url;
    });
  }
  async function captureWebsiteGroups(rows, theme, date) {
    if (!window.domtoimage || typeof window.domtoimage.toBlob !== "function")
      throw new Error("Website PNG capture library မရပါ။ Refresh လုပ်ကြည့်ပါ။");
    const sheet = typeof loadedSheet !== "undefined" ? loadedSheet : null;
    const original = document.querySelectorAll("#oddsList .odds-group");
    if (!sheet || !Array.isArray(sheet.matches) || !original.length)
      throw new Error("Website ပေါက်ကြေးဇယား မရသေးပါ။");

    const leagueNames = [...new Set(sheet.matches.map(m => m.league))];
    const sources = new Map(leagueNames.map((l, i) => [l, original[i]]));
    const byLeague = new Map();
    for (const m of rows) {
      if (!byLeague.has(m.league)) byLeague.set(m.league, []);
      byLeague.get(m.league).push(m);
    }

    const offscreen = document.createElement("div");
    offscreen.style.cssText = "position:fixed;left:-30000px;top:0;z-index:-1;pointer-events:none;width:1140px;overflow:visible";
    const snapshot = document.createElement("div");
    snapshot.className = "odds-content";
    snapshot.style.cssText = "box-sizing:border-box;width:1140px;max-width:none;margin:0;padding:12px 0;background:#10191d";
    snapshot.style.setProperty("--sheet-brand", theme);
    snapshot.style.setProperty("--sheet-deep", shade(theme, .70));
    snapshot.style.setProperty("--sheet-title", "#ffffff");
    snapshot.style.setProperty("padding", "12px 0", "important");
    // Keep the previously approved date-only label (never add match totals).
    const dateBar = document.createElement("div");
    dateBar.textContent = String(date || "");
    dateBar.style.cssText = "box-sizing:border-box;margin:0 0 13px;padding:12px 10px;text-align:center;border-radius:10px;background:" + shade(theme, .70) + ";color:#fff;font:800 23px/1.7 'Noto Sans Myanmar',sans-serif";
    snapshot.appendChild(dateBar);

    for (const [league, included] of byLeague) {
      const originalGroup = sources.get(league);
      if (!originalGroup) throw new Error("League ဇယား မတွေ့ပါ — " + league);
      const allRows = sheet.matches.filter(m => m.league === league);
      const wanted = new Set(included.map(m => allRows.indexOf(m)));
      if (wanted.has(-1)) throw new Error("Download ပွဲစာရင်းနှင့် Website မကိုက်ပါ။");
      const group = originalGroup.cloneNode(true);
      group.querySelectorAll(".odds-league-png-parts,button").forEach(el => el.remove());
      const trs = [...group.querySelectorAll("tbody tr")];
      if (trs.length !== allRows.length)
        throw new Error("Website ပွဲအရေအတွက် မကိုက်ညီပါ။ Refresh လုပ်ကြည့်ပါ။");
      trs.forEach((tr, i) => { if (!wanted.has(i)) tr.remove(); });
      group.style.setProperty("margin", "0 auto 14px", "important");
      snapshot.appendChild(group);
    }
    offscreen.appendChild(snapshot);
    document.body.appendChild(offscreen);
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const imgs = [...snapshot.querySelectorAll("img")];
      imgs.forEach(im => { im.loading = "eager"; im.decoding = "sync"; });
      await Promise.allSettled(imgs.map(im => im.decode ? im.decode() : Promise.resolve()));
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const height = Math.ceil(snapshot.scrollHeight);
      if (height < 40 || height > 13000) throw new Error("PNG ဇယားအမြင့် များလွန်းပါသည်။ ပုံခွဲပြီး Download လုပ်ပါ။");
      const png = await window.domtoimage.toBlob(snapshot, {
        bgcolor: "#10191d",
        width: WIDTH * SCALE,
        height: height * SCALE,
        style: {
          width: WIDTH + "px",
          height: height + "px",
          transform: "scale(" + SCALE + ")",
          transformOrigin: "top left"
        },
        imagePlaceholder: "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
      });
      if (!png || !png.size) throw new Error("Website ဇယား PNG မဖန်တီးနိုင်ပါ။");
      return { image: await asImage(png), height: height * SCALE };
    } finally {
      offscreen.remove();
    }
  }

  // If browser SVG/foreignObject capture fails (commonly due to blocked remote
  // fonts or crests), keep PNG downloads functional with a matching table grid.
  // This is NOT a redesigned match poster.
  let captureDisabled = false;
  async function fallbackTable(rows, theme, date) {
    const kit = window.FutureCodeCanvasKit;
    if (!kit) throw new Error("PNG Canvas module မရသေးပါ။");
    await kit.fonts();
    await kit.preloadImages(rows.flatMap(m => [m.homeCrestUrl, m.awayCrestUrl]).filter(Boolean));
    const byLeague = new Map();
    for (const m of rows) {
      if (!byLeague.has(m.league)) byLeague.set(m.league, []);
      byLeague.get(m.league).push(m);
    }
    const topPad=70, leagueH=57, columnH=78, rowH=75, gap=14, pad=10;
    const width=1140, height=topPad+24+[...byLeague.values()].reduce(
      (sum, matches) => sum+leagueH+columnH+matches.length*rowH+gap, 0);
    if(height>13000)throw new Error("ပုံအမြင့်များလွန်းပါသည်။ ပုံခွဲ၍ Download လုပ်ပါ။");
    const {canvas,ctx}=kit.create(width*2,height*2);
    ctx.scale(2,2);
    const bg=shade(theme,.52), deep=shade(theme,.70);
    const fill=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
    const write=(value,x,y,px,color="#111820",align="center",max)=>{
      ctx.font="800 "+px+"px 'Noto Sans Myanmar',sans-serif";
      ctx.textAlign=align;ctx.textBaseline="middle";ctx.fillStyle=color;
      ctx.fillText(String(value??""),x,y,max);
    };
    fill(0,0,width,height,bg);
    fill(pad,10,width-pad*2,53,deep);
    write(date,width/2,38,23,"#fff");
    const widths=[96,384,158,90,90,90,90,142],xs=[0];
    widths.forEach(w=>xs.push(xs.at(-1)+w));
    const tableLeft=pad, tableRight=width-pad, innerWidth=tableRight-tableLeft;
    let y=topPad;
    for(const [league,matches] of byLeague){
      fill(pad,y,innerWidth,leagueH,deep);
      const display=(typeof groups!=="undefined" && groups[league]) || league;
      write(display,width/2,y+leagueH/2,21,"#fff","center",innerWidth-45);
      y+=leagueH;
      const xAt=i=>pad+xs[i]*(innerWidth/width);
      const wAt=i=>widths[i]*(innerWidth/width);
      fill(pad,y,innerWidth,columnH,theme);
      const headings=[["ပွဲချိန်",0],["ယှဉ်ပြိုင်မည့်အသင်း",1],["အပေါ်အသင်း",2],["အင်တာနက်ခန့်မှန်းချက်",7]];
      for(const [title,i] of headings)write(title,xAt(i)+wAt(i)/2,y+columnH/2,15,"#fff","center",wAt(i)-7);
      write("ဘော်ဒီကြေး",(xAt(3)+xAt(5))/2,y+22,19,"#fff");
      write("ဂိုးပေါင်းကြေး",(xAt(5)+xAt(7))/2,y+22,19,"#fff");
      for(let i=3;i<7;i++)write(i%2?"မူလ":"ယခု",xAt(i)+wAt(i)/2,y+58,15,"#fff");
      ctx.strokeStyle="#ffffff44";ctx.lineWidth=1;
      for(let i=1;i<8;i++){ctx.beginPath();ctx.moveTo(xAt(i),y);ctx.lineTo(xAt(i),y+columnH);ctx.stroke();}
      y+=columnH;
      for(let n=0;n<matches.length;n++){
        const m=matches[n];
        fill(pad,y,innerWidth,rowH,n%2?"#f7f8fa":"#fff");
        fill(xAt(2),y,wAt(2),rowH,n%2?"#dfe3e7":"#e8eaed");
        fill(xAt(4),y,wAt(4),rowH,"#edf7f3");
        fill(xAt(6),y,wAt(6),rowH,"#edf7f3");
        ctx.strokeStyle="#cfd3d8";ctx.lineWidth=1;
        ctx.strokeRect(pad+.5,y+.5,innerWidth-1,rowH-1);
        for(let i=1;i<8;i++){ctx.beginPath();ctx.moveTo(xAt(i),y);ctx.lineTo(xAt(i),y+rowH);ctx.stroke();}
        const middle=y+rowH/2;
        write((m.kickoffDisplay||m.kickoff||"").replace(/^.*? ည /,"ည "),xAt(0)+wAt(0)/2,middle,15,"#172126","center",wAt(0)-5);
        const mx=xAt(1),mw=wAt(1),sx=mw/384;
        write(m.home,mx+126*sx,middle,17,"#141923","right",122*sx);
        kit.crest(ctx,m.homeCrestUrl,mx+135*sx,y+21,33*sx,m.home);
        write("VS",mx+196*sx,middle,13,"#ad2831");
        kit.crest(ctx,m.awayCrestUrl,mx+220*sx,y+21,33*sx,m.away);
        write(m.away,mx+263*sx,middle,17,"#141923","left",120*sx);
        write(m.upperTeam||"",xAt(2)+wAt(2)/2,middle,16,"#141923","center",wAt(2)-7);
        const quote=[m.bodyOdds,m.currentBodyOdds,m.goalTotalOdds,m.currentGoalTotalOdds,m.pdfLastColumn];
        for(let i=0;i<quote.length;i++)write(quote[i]??"",xAt(i+3)+wAt(i+3)/2,middle,19,"#111820","center",wAt(i+3)-5);
        y+=rowH;
      }
      y+=gap;
    }
    return {image:canvas,height:canvas.height};
  }

  async function draw(rows, settings) {
    const kit = window.FutureCodeCanvasKit;
    if (!kit) throw new Error("PNG canvas module မရသေးပါ။");
    const design = settings.design, colourOnly = design[0] === "colour";
    const theme = colourOnly ? settings.colour : design[2];
    const artwork = design[3] ?
      await loadImage("./assets/table-odds-frames/" + design[0] + "-frame.jpg") : null;
    const top = artwork || colourOnly ? null :
      await loadImage("./assets/table-odds-frames/" + design[0] + "-top.jpg");
    const bottom = artwork || colourOnly ? null :
      await loadImage("./assets/table-odds-frames/" + design[0] + "-bottom.jpg");

    // Screenshot is the same HTML, headers, columns, Myanmar spellings and
    // original/current prices that users see on the main website.
    let shot;
    if (!captureDisabled) {
      try {
        // A blocked font/image request must not leave the Download button spinning.
        const attempt = captureWebsiteGroups(rows, theme, settings.date);
        let deadline;
        try {
          shot = await Promise.race([
            attempt,
            new Promise((_,reject)=>{deadline=setTimeout(
              ()=>reject(new Error("DOM image capture timed out")),9000);})
          ]);
        } finally { clearTimeout(deadline); }
        window.FutureCodeOddsDomFrame.lastCapture = "website";
      } catch (error) {
        console.warn("Website screenshot capture unavailable; rendering the same table natively.", error);
        captureDisabled = true;
      }
    }
    if (!shot) {
      shot = await fallbackTable(rows,theme,settings.date);
      window.FutureCodeOddsDomFrame.lastCapture = "table-fallback";
    }
    const outWidth = WIDTH * SCALE;
    const topFraction = artwork ? design[3].top : 0;
    const bottomFraction = artwork ? design[3].bottom : 0;
    const topH = artwork ? Math.round(artwork.height * topFraction * outWidth / artwork.width) :
      top ? Math.round(top.height * outWidth / top.width) : 0;
    const bottomH = artwork ? Math.round(artwork.height * bottomFraction * outWidth / artwork.width) :
      bottom ? Math.round(bottom.height * outWidth / bottom.width) : 0;
    const { canvas, ctx } = kit.create(outWidth, topH + shot.height + bottomH);
    ctx.fillStyle = shade(theme, .52);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (artwork && topH) {
      const slice = artwork.height * topFraction;
      ctx.drawImage(artwork, 0, 0, artwork.width, slice, 0, 0, outWidth, topH);
    } else if (top) ctx.drawImage(top, 0, 0, outWidth, topH);
    ctx.drawImage(shot.image, 0, topH, outWidth, shot.height);
    if (artwork && bottomH) {
      const slice = artwork.height * bottomFraction;
      ctx.drawImage(artwork, 0, artwork.height - slice, artwork.width, slice,
        0, canvas.height - bottomH, outWidth, bottomH);
    } else if (bottom) ctx.drawImage(bottom, 0, canvas.height - bottomH, outWidth, bottomH);
    return canvas;
  }
  window.FutureCodeOddsDomFrame = { draw };
})();
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
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error("Frame ပုံ ရယူမရပါ"));
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
    const shot = await captureWebsiteGroups(rows, theme, settings.date);
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
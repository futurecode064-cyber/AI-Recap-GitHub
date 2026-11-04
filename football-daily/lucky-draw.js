/* Future Code + BW Sport: browser-only 10-match ticket. No storage, bot or backend. */
(() => {
  "use strict";
  const site = document.documentElement.dataset.drawSite === "bw" ? "bw" : "main";
  const config = site === "bw"
    ? { brand: "BW ဂျာနယ်", prefix: "BW", recipient: "ballwins", dataBase: "../data/odds/", logo: "./assets/logo.webp",
        dark: "#06162d", panel: "#112947", accent: "#40c3ff", soft: "#e4f5ff" }
    : { brand: "FUTURE CODE FOOTBALL", prefix: "MAIN", recipient: "graphicdesignmm", dataBase: "./data/odds/", logo: null,
        dark: "#102625", panel: "#23403b", accent: "#f2c67d", soft: "#f6f7f1" };
  const byId = id => document.getElementById(id);
  const nodes = {
    matches: byId("draw-matches"), count: byId("draw-count"), status: byId("draw-status"),
    name: byId("draw-name"), telegram: byId("draw-telegram"), generate: byId("draw-generate"),
    result: byId("draw-result"), preview: byId("draw-preview"), share: byId("draw-share"),
    download: byId("draw-download"), recipient: byId("draw-recipient"), date: byId("draw-date")
  };
  const choices = new Map();
  let matches = [];
  let reportDate = "";
  let imageBlob = null;
  let imageUrl = "";
  let imageName = "";
  let ticketId = "";

  const text = value => String(value == null ? "" : value).trim();
  function editorialDate() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Yangon", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date());
    const obj = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const current = new Date(Date.UTC(+obj.year, +obj.month - 1, +obj.day));
    if (+obj.hour < 6) current.setUTCDate(current.getUTCDate() - 1);
    return current.toISOString().slice(0, 10);
  }
  function readableDate(day) {
    const pieces = day.split("-");
    return pieces.length === 3 ? pieces[2] + "/" + pieces[1] + "/" + pieces[0] : day;
  }
  function canStillPick(m) {
    if (["finished", "ft", "completed", "cancelled", "canceled", "postponed", "live", "in_progress"].includes(text(m.status).toLowerCase())) return false;
    const kickoff = Date.parse(m.kickoffUtc);
    return Number.isFinite(kickoff) && kickoff > Date.now();
  }
  function announce(message, error = false) {
    nodes.status.textContent = message;
    nodes.status.classList.toggle("draw-error", !!error);
  }
  function invalidate() {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageUrl = "";
    imageBlob = null;
    imageName = "";
    nodes.preview.removeAttribute("src");
    nodes.result.hidden = true;
  }
  function labelButton(label, active, disabled, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "draw-team" + (active ? " is-selected" : "");
    button.textContent = label;
    button.disabled = disabled;
    button.setAttribute("aria-pressed", String(active));
    button.addEventListener("click", handler);
    return button;
  }
  function render() {
    const fragment = document.createDocumentFragment();
    let eligible = 0;
    for (const m of matches) {
      const available = canStillPick(m);
      if (available) eligible++;
      if (!available) choices.delete(m.id);
      const picked = choices.get(m.id);
      const row = document.createElement("article");
      row.className = "draw-match";
      const head = document.createElement("div");
      head.className = "draw-match-heading";
      const title = document.createElement("strong");
      title.textContent = m.home + "  VS  " + m.away;
      const detail = document.createElement("span");
      detail.textContent = m.league + " · " + m.clock + (available ? "" : " · ပွဲစပြီး/ပိတ်ပြီး");
      head.append(title, detail);
      const buttons = document.createElement("div");
      buttons.className = "draw-match-choices";
      for (const pick of ["home", "away"]) {
        const label = pick === "home" ? m.home : m.away;
        buttons.appendChild(labelButton(label, picked === pick, !available || (!picked && choices.size >= 10), () => {
          if (!canStillPick(m)) { render(); announce("ပွဲစပြီးသွားတဲ့ ပွဲကို ရွေးလို့မရပါ။", true); return; }
          if (choices.get(m.id) === pick) choices.delete(m.id);
          else if (choices.has(m.id) || choices.size < 10) choices.set(m.id, pick);
          invalidate();
          render();
        }));
      }
      row.append(head, buttons);
      fragment.appendChild(row);
    }
    nodes.matches.replaceChildren(fragment);
    nodes.count.textContent = choices.size + " / ၁၀ ပွဲ";
    nodes.generate.disabled = choices.size !== 10;
    if (matches.length) announce(eligible < 10
      ? "မစတင်ရသေးတဲ့ပွဲ ၁၀ ပွဲ မပြည့်တော့ပါ။ နောက်နေ့ ပေါက်ကြေးတင်ပြီးမှ ကံစမ်းနိုင်ပါမယ်။"
      : choices.size === 10 ? "၁၀ ပွဲ ပြည့်ပါပြီ။ အမည်ဖြည့်ပြီး PNG အစောင်ဖန်တီးနိုင်ပါပြီ။"
      : "ကိုယ်ကြိုက်တဲ့ အသင်းကို နှိပ်ပါ။ ရွေးပြီးသားအသင်းကို ပြန်နှိပ်ရင် ဖြုတ်နိုင်ပါတယ်။");
  }
  async function loadMatches() {
    const date = editorialDate();
    reportDate = date;
    nodes.date.textContent = readableDate(date) + " (မြန်မာစံတော်ချိန်)";
    try {
      const url = config.dataBase + encodeURIComponent(date) + ".json";
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("ပေါက်ကြေးစာရင်း မတွေ့ပါ (HTTP " + response.status + ")");
      const data = await response.json();
      if (data.reportDate !== date || !Array.isArray(data.matches)) throw new Error("ဒီနေ့ ပေါက်ကြေးဒေတာ မမှန်ပါ။");
      const seen = new Set();
      matches = data.matches.map((m, i) => ({
        id: text(m.fixtureId) || "row-" + i,
        home: text(m.home), away: text(m.away), league: text(m.leagueDisplay || m.league),
        clock: text(m.kickoffDisplay || m.sourceKickoff || m.kickoffYangon || ""),
        kickoffUtc: m.kickoffUtc, status: m.status
      })).filter(m => {
        if (!m.home || !m.away || seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
      if (!matches.length) throw new Error("ယနေ့ ပွဲစာရင်း မရှိသေးပါ။");
      render();
    } catch (error) {
      matches = [];
      choices.clear();
      nodes.matches.replaceChildren();
      nodes.generate.disabled = true;
      announce("ယနေ့ ပေါက်ကြေးကို မဖွင့်နိုင်သေးပါ။ " + (error.message || "နောက်မှပြန်စမ်းပါ။"), true);
    }
  }
  const drawRound = (ctx, x, y, w, h, radius, fill) => {
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, w, h, radius);
    else ctx.rect(x, y, w, h);
    ctx.fillStyle = fill;
    ctx.fill();
  };
  function fitted(ctx, value, x, y, maxWidth, size, color, weight = 700, minSize = 16) {
    const content = text(value);
    let fontSize = size;
    do {
      ctx.font = weight + " " + fontSize + "px 'Noto Sans Myanmar', system-ui, sans-serif";
      if (ctx.measureText(content).width <= maxWidth || fontSize <= minSize) break;
      fontSize -= 1;
    } while (fontSize > minSize);
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(content, x, y, maxWidth);
  }
  async function brandedLogo(ctx) {
    if (site !== "bw") {
      drawRound(ctx, 45, 43, 65, 65, 17, config.accent);
      fitted(ctx, "FC+", 55, 87, 48, 26, config.dark, 900);
      return;
    }
    const logo = new Image();
    try {
      await new Promise((resolve, reject) => {
        logo.onload = resolve;
        logo.onerror = reject;
        logo.src = config.logo;
        setTimeout(() => reject(new Error("logo timeout")), 3500);
      });
      ctx.drawImage(logo, 47, 38, 74, 74);
    } catch (_) {
      drawRound(ctx, 45, 43, 65, 65, 17, config.accent);
      fitted(ctx, "BW", 55, 87, 48, 26, config.dark, 900);
    }
  }
  async function ticketToBlob(details) {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("ပုံဖန်တီးရန် Canvas မရပါ။");
    ctx.fillStyle = config.dark;
    ctx.fillRect(0, 0, 1080, 1080);
    ctx.fillStyle = config.accent;
    ctx.fillRect(0, 0, 1080, 11);
    await brandedLogo(ctx);
    fitted(ctx, config.brand, 132, 79, 895, 35, config.soft, 900);
    fitted(ctx, "နေ့စဉ် ၁၀ ပွဲ ကံစမ်းအစောင်", 45, 150, 990, 43, config.accent, 800);
    drawRound(ctx, 40, 168, 1000, 75, 14, config.panel);
    fitted(ctx, "အမည်: " + details.name, 55, 196, 920, 24, config.soft);
    const extra = details.telegram ? " | TG: " + details.telegram : "";
    fitted(ctx, readableDate(reportDate) + "  |  " + ticketId + extra, 55, 228, 925, 22, config.accent, 700);
    details.selections.forEach((pick, i) => {
      const y = 252 + i * 70;
      drawRound(ctx, 40, y, 1000, 66, 12, i % 2 ? config.panel : "#193036");
      if (site === "bw" && i % 2 === 0) {
        drawRound(ctx, 40, y, 1000, 66, 12, "#102b4c");
      }
      drawRound(ctx, 51, y + 13, 48, 40, 10, config.accent);
      fitted(ctx, String(i + 1).padStart(2, "0"), 59, y + 42, 36, 20, config.dark, 800);
      fitted(ctx, pick.match.home + "  VS  " + pick.match.away, 115, y + 27, 900, 24, config.soft, 700, 17);
      fitted(ctx, "ရွေးချယ်မှု — " + pick.team, 115, y + 55, 900, 24, config.accent, 800, 17);
    });
    ctx.fillStyle = config.accent;
    ctx.fillRect(40, 965, 1000, 2);
    fitted(ctx, "Telegram @"+config.recipient+" သို့ ပို့ရန်", 45, 1001, 980, 24, config.accent);
    fitted(ctx, site === "bw" ? "BW ဂျာနယ်" : "Developed by Future Code AI Studio", 45, 1040, 970, 21, config.soft, 600);
    const blob = await new Promise((resolve, reject) => canvas.toBlob(
      file => file ? resolve(file) : reject(new Error("PNG ထုတ်မရပါ။")), "image/png"
    ));
    return blob;
  }
  function cryptoId() {
    const bytes = new Uint8Array(6);
    if (self.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
    else throw new Error("လုံခြုံသော HTTPS မှသာ အစောင်ဖန်တီးနိုင်ပါသည်။");
    return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  }
  async function generate() {
    const name = text(nodes.name.value);
    const telegram = text(nodes.telegram.value);
    if (!name) { announce("ကံစမ်းသူအမည် ဖြည့်ပါ။", true); nodes.name.focus(); return; }
    if (telegram && !/^@?[A-Za-z0-9_]{5,32}$/.test(telegram)) {
      announce("Telegram username ကို @username ပုံစံဖြင့် ဖြည့်ပါ (သို့မဟုတ် အလွတ်ထားနိုင်သည်)။", true);
      nodes.telegram.focus();
      return;
    }
    const selected = matches.filter(m => choices.has(m.id)).map(match => ({
      match, team: choices.get(match.id) === "home" ? match.home : match.away
    }));
    if (selected.length !== 10 || selected.some(x => !canStillPick(x.match))) {
      render(); announce("မစတင်ရသေးတဲ့ ပွဲ ၁၀ ပွဲကို ရွေးပါ။", true); return;
    }
    if (editorialDate() !== reportDate) {
      invalidate(); await loadMatches();
      announce("နေ့စွဲပြောင်းသွားပါပြီ။ ယနေ့ ပွဲသစ်များကို ပြန်ရွေးပါ။", true);
      return;
    }
    nodes.generate.disabled = true;
    announce("အစောင်ပုံ PNG ဖန်တီးနေပါသည်…");
    try {
      ticketId = config.prefix + "-" + reportDate.replace(/-/g, "") + "-" + cryptoId();
      const blob = await ticketToBlob({ name, telegram, selections: selected });
      invalidate();
      imageBlob = blob;
      imageName = ticketId + ".png";
      imageUrl = URL.createObjectURL(blob);
      nodes.preview.src = imageUrl;
      nodes.preview.alt = "ကံစမ်းအစောင် " + ticketId;
      nodes.download.href = imageUrl;
      nodes.download.download = imageName;
      nodes.result.hidden = false;
      announce("PNG အစောင် ပြီးပါပြီ။ Telegram ကိုရွေးပြီး @" + config.recipient + " ဆီ ပုံပို့ပါ။");
      nodes.result.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      announce("PNG ဖန်တီးမအောင်မြင်ပါ — " + (error.message || "ပြန်စမ်းပါ။"), true);
    } finally {
      nodes.generate.disabled = choices.size !== 10;
    }
  }
  async function share() {
    if (!imageBlob) return;
    const file = new File([imageBlob], imageName, { type: "image/png" });
    if (!navigator.share || (navigator.canShare && !navigator.canShare({ files: [file] }))) {
      announce("ဒီ Browser က ပုံ Share မရပါ။ PNG Download ပြီး Telegram @" + config.recipient + " ကို ဖွင့်၍ ပုံတွဲပို့ပါ။", true);
      return;
    }
    try {
      await navigator.share({ files: [file] });
      announce("Share ကို ဖွင့်ပေးပြီးပါပြီ။ Telegram @" + config.recipient + " ဆီ Send နှိပ်ပြီးမှသာ ရောက်ပါမယ်။");
    } catch (error) {
      if (error.name !== "AbortError") announce("Share မအောင်မြင်ပါ။ ပုံ Download လုပ်ပြီး Telegram မှ ပို့နိုင်ပါတယ်။", true);
    }
  }
  function init() {
    nodes.recipient.href = "https://t.me/" + config.recipient;
    nodes.recipient.textContent = "Telegram @" + config.recipient + " ကို ဖွင့်ရန်";
    const receiverText = byId("draw-receiver");
    if (receiverText) receiverText.textContent = "@" + config.recipient;
    nodes.generate.addEventListener("click", generate);
    nodes.share.addEventListener("click", share);
    for (const field of [nodes.name, nodes.telegram]) field.addEventListener("input", invalidate);
    loadMatches();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

/**
 * Future Code MAIN ONLY login guard for Cloudflare Pages Advanced Mode.
 *
 * Cloudflare encrypted production secrets (never commit their values):
 *   FCD_MAIN_PASSWORD    - password for the owner login
 *   FCD_SESSION_SECRET  - independent random 32+ character secret
 *
 * The owner email is a login identifier, not a secret.
 * IMPORTANT: Do not deploy this file before both secrets are configured.
 * Only root HTML pages are gated. Brand pages and shared assets stay public.
 */
const MAIN_EMAIL = "futurecode064@gmail.com";
const COOKIE_NAME = "__Host-fc_main_session";
const CSRF_COOKIE_NAME = "__Host-fc_main_login_csrf";
const MAX_AGE_SECONDS = 8 * 60 * 60;
const MAIN_PATHS = new Set(["/", "/index", "/index/", "/index.html", "/odds", "/odds/", "/odds.html"]);
const LOGIN_PATHS = new Set(["/login", "/login/", "/login.html"]);
const LOGOUT_PATHS = new Set(["/logout", "/logout/"]);
const encoder = new TextEncoder();

/* GOAL ZONE analytics. Only the journal home, journal odds and APK page are tracked.
 * Cloudflare D1 binding (optional until enabled): GOALZONE_ANALYTICS_DB
 * Visitor IDs are random first-party cookies, never names, email or raw IP.
 */
const GZ_PREFIX = "/future-code-journal/android/";
const GZ_JOURNAL_PAGES = new Map([
  ["/future-code-journal/", "Goal Zone Journal"],
  ["/future-code-journal/index", "Goal Zone Journal"],
  ["/future-code-journal/index.html", "Goal Zone Journal"],
  ["/future-code-journal/odds", "Goal Zone Odds"],
  ["/future-code-journal/odds/", "Goal Zone Odds"],
  ["/future-code-journal/odds.html", "Goal Zone Odds"]
]);
const GZ_STATS_PATHS = new Set([GZ_PREFIX + "stats", GZ_PREFIX + "stats.html", GZ_PREFIX + "stats/"]);
const GZ_VISIT_PATH = GZ_PREFIX + "api/visit";
const GZ_REPORT_PATH = GZ_PREFIX + "api/stats";
const GZ_VISITOR_COOKIE = "__Host-gz_anon";
const GZ_APK = /^\/future-code-journal\/android\/([A-Za-z0-9_.-]+\.apk)$/;
const GZ_BOT = /bot|crawler|spider|headless|preview|facebookexternalhit|whatsapp/i;
const GZ_SCHEMA = "CREATE TABLE IF NOT EXISTS gz_analytics (id INTEGER PRIMARY KEY AUTOINCREMENT, day TEXT NOT NULL, event_type TEXT NOT NULL, app TEXT NOT NULL, visitor_hash TEXT NOT NULL, country TEXT NOT NULL, created_at INTEGER NOT NULL)";
function gzDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Yangon", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);
  const val = part => parts.find(p => p.type === part).value;
  return val("year") + "-" + val("month") + "-" + val("day");
}
function gzCookie(request) {
  const present = cookieValue(request, GZ_VISITOR_COOKIE);
  if (/^[a-f0-9]{32}$/.test(present)) return { token: present, fresh: false };
  return { token: [...crypto.getRandomValues(new Uint8Array(16))]
    .map(n => n.toString(16).padStart(2, "0")).join(""), fresh: true };
}
function gzCookieHeader(token) {
  return GZ_VISITOR_COOKIE + "=" + token +
    "; Max-Age=31536000; Path=/; HttpOnly; Secure; SameSite=Lax";
}
async function gzHash(token, env) {
  const secret = env.FCD_SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode("goalzone-visitor:" + token)));
  return enc64(sig);
}
function gzDb(env) {
  return env.GOALZONE_ANALYTICS_DB?.prepare ? env.GOALZONE_ANALYTICS_DB : null;
}
function gzIsBot(request) {
  return GZ_BOT.test(request.headers.get("user-agent") || "");
}
async function gzStore(request, env, eventType, app) {
  const db = gzDb(env);
  if (!db || gzIsBot(request)) return null;
  const cookie = gzCookie(request);
  const hash = await gzHash(cookie.token, env);
  if (!hash) return null;
  const countryCode = String(request.cf?.country || "Unknown").toUpperCase();
  const country = /^[A-Z]{2}$/.test(countryCode) ? countryCode : "Unknown";
  await db.prepare(GZ_SCHEMA).run();
  await db.prepare("INSERT INTO gz_analytics (day, event_type, app, visitor_hash, country, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(gzDate(), eventType, app, hash, country, Math.floor(Date.now() / 1000)).run();
  return cookie.fresh ? gzCookieHeader(cookie.token) : null;
}
async function gzVisit(request, env) {
  if (request.method !== "POST") return respond("Method Not Allowed", 405, { Allow: "POST" });
  if (request.headers.get("Origin") !== new URL(request.url).origin ||
      request.headers.get("Sec-Fetch-Site") === "cross-site") return respond("Forbidden", 403);
  try {
    const cookie = await gzStore(request, env, "visit", "Goal Zone Android page");
    return respond(null, 204, cookie ? { "Set-Cookie": cookie } : {});
  } catch {
    return respond(null, 204);
  }
}
function gzJson(value, status = 200) {
  return respond(JSON.stringify(value), status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "none"
  });
}
async function gzStats(request, env) {
  if (request.method !== "GET") return respond("Method Not Allowed", 405, { Allow: "GET" });
  if (!ready(env) || !(await hasSession(request, env))) return gzJson({error:"Owner login required"}, 401);
  const db = gzDb(env);
  if (!db) return gzJson({error:"D1 binding GOALZONE_ANALYTICS_DB is not configured"}, 503);
  const range = Number(new URL(request.url).searchParams.get("days") || 7);
  const days = [1, 7, 30, 90].includes(range) ? range : 7;
  const since = gzDate(new Date(Date.now() - (days - 1) * 86400000));
  try {
    await db.prepare(GZ_SCHEMA).run();
    const [totals, daily, apps, countries, recent] = await Promise.all([
      db.prepare("SELECT COUNT(CASE WHEN event_type IN ('visit', 'website_visit') THEN 1 END) AS views, COUNT(DISTINCT CASE WHEN event_type IN ('visit', 'website_visit') THEN visitor_hash END) AS visitors, COUNT(CASE WHEN event_type='website_visit' THEN 1 END) AS websiteViews, COUNT(DISTINCT CASE WHEN event_type='website_visit' THEN visitor_hash END) AS websiteVisitors, COUNT(CASE WHEN event_type='visit' THEN 1 END) AS apkViews, COUNT(DISTINCT CASE WHEN event_type='visit' THEN visitor_hash END) AS apkVisitors, COUNT(CASE WHEN event_type='download' THEN 1 END) AS downloads FROM gz_analytics WHERE day >= ?").bind(since).first(),
      db.prepare("SELECT day, COUNT(CASE WHEN event_type IN ('visit', 'website_visit') THEN 1 END) AS views, COUNT(DISTINCT CASE WHEN event_type IN ('visit', 'website_visit') THEN visitor_hash END) AS visitors, COUNT(CASE WHEN event_type='website_visit' THEN 1 END) AS websiteViews, COUNT(DISTINCT CASE WHEN event_type='website_visit' THEN visitor_hash END) AS websiteVisitors, COUNT(CASE WHEN event_type='visit' THEN 1 END) AS apkViews, COUNT(DISTINCT CASE WHEN event_type='visit' THEN visitor_hash END) AS apkVisitors, COUNT(CASE WHEN event_type='download' THEN 1 END) AS downloads FROM gz_analytics WHERE day >= ? GROUP BY day ORDER BY day DESC").bind(since).all(),
      db.prepare("SELECT app, COUNT(*) AS downloads FROM gz_analytics WHERE day >= ? AND event_type='download' GROUP BY app ORDER BY downloads DESC").bind(since).all(),
      db.prepare("SELECT country, COUNT(DISTINCT visitor_hash) AS visitors, COUNT(*) AS views FROM gz_analytics WHERE day >= ? AND event_type IN ('visit', 'website_visit') GROUP BY country ORDER BY views DESC LIMIT 15").bind(since).all(),
      db.prepare("SELECT created_at, app, country FROM gz_analytics WHERE day >= ? AND event_type='download' ORDER BY id DESC LIMIT 20").bind(since).all()
    ]);
    return gzJson({
      asOf: new Date().toISOString(), timezone: "Asia/Yangon", days,
      totals: totals || {views:0, visitors:0, downloads:0},
      daily: daily.results || [], apps: apps.results || [],
      countries: countries.results || [], recent: recent.results || []
    });
  } catch {
    return gzJson({error:"Analytics database is unavailable. Verify the Cloudflare D1 binding."}, 503);
  }
}
async function gzJournalPage(request, env, label) {
  // Server-side count works even when JavaScript is disabled. Count only actual
  // successful HTML GET responses from the two Goal Zone journal routes.
  const asset = await env.ASSETS.fetch(request);
  if (request.method !== "GET" || !asset.ok || gzIsBot(request) ||
      !(asset.headers.get("Content-Type") || "").includes("text/html")) return asset;
  let cookie = null;
  try {
    cookie = await gzStore(request, env, "website_visit", label);
  } catch {
    // Site availability must never depend on the analytics database.
  }
  if (!cookie) return asset;
  const headers = new Headers(asset.headers);
  headers.set("Set-Cookie", cookie);
  headers.set("Cache-Control", "private, no-store");
  return new Response(asset.body, {status: asset.status, statusText: asset.statusText, headers});
}
async function gzDownload(request, env) {
  // Count only complete APK GET requests. HEAD and Range probes are excluded.
  const result = await env.ASSETS.fetch(request);
  if (request.method !== "GET" || request.headers.has("Range") || !result.ok || gzIsBot(request)) return result;
  let cookie = null;
  try {
    cookie = await gzStore(request, env, "download", decodeURIComponent(new URL(request.url).pathname.split("/").pop()));
  } catch {
    // Analytics must never prevent a customer from downloading the APK.
  }
  if (!cookie) return result;
  const headers = new Headers(result.headers);
  headers.set("Set-Cookie", cookie);
  headers.set("Cache-Control", "private, no-store");
  return new Response(result.body, {status: result.status, statusText: result.statusText, headers});
}


function ready(env) {
  return typeof env?.FCD_MAIN_PASSWORD === "string" &&
    env.FCD_MAIN_PASSWORD.length >= 1 &&
    typeof env?.FCD_SESSION_SECRET === "string" &&
    env.FCD_SESSION_SECRET.length >= 32;
}
function httpHeaders(extra = {}) {
  return {
    "Cache-Control": "private, no-store, max-age=0",
    "Pragma": "no-cache",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    ...extra
  };
}
function respond(body, status, headers = {}) {
  return new Response(body, { status, headers: httpHeaders(headers) });
}
function redirect(url, status = 303, cookie) {
  const h = httpHeaders({ Location: url });
  if (cookie) h["Set-Cookie"] = cookie;
  return new Response(null, { status, headers: h });
}
function nextPage(raw) {
  if (!raw || typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//") ||
      raw.includes("\\") || raw.includes("\r") || raw.includes("\n")) return "/";
  try {
    const parsed = new URL(raw, "https://future-code-login.invalid");
    if (parsed.origin !== "https://future-code-login.invalid" || !(MAIN_PATHS.has(parsed.pathname) || GZ_STATS_PATHS.has(parsed.pathname) || parsed.pathname === "/editor/" || parsed.pathname === "/editor/setup.html")) return "/";
    return parsed.pathname + parsed.search;
  } catch { return "/"; }
}
function enc64(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}
function dec64(s) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(s)) return null;
  try {
    const binary = atob(s.replaceAll("-", "+").replaceAll("_", "/") + "=");
    return Uint8Array.from(binary, c => c.charCodeAt(0));
  } catch { return null; }
}
async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
function cookieValue(request, name = COOKIE_NAME) {
  const raw = request.headers.get("Cookie") || "";
  const segment = raw.split(";").map(v => v.trim()).find(v => v.startsWith(name + "="));
  return segment ? segment.slice(name.length + 1) : "";
}
function newCsrfToken() {
  return [...crypto.getRandomValues(new Uint8Array(24))]
    .map(b => b.toString(16).padStart(2, "0")).join("");
}
function csrfCookie(token) {
  return CSRF_COOKIE_NAME + "=" + token +
    "; Max-Age=1200; Path=/; HttpOnly; Secure; SameSite=Strict";
}
function validCsrf(request, input) {
  const cookie = cookieValue(request, CSRF_COOKIE_NAME);
  if (typeof input !== "string" || !/^[a-f0-9]{48}$/.test(input) ||
      !/^[a-f0-9]{48}$/.test(cookie)) return false;
  let diff = 0;
  for (let i = 0; i < 48; i++) diff |= input.charCodeAt(i) ^ cookie.charCodeAt(i);
  return diff === 0;
}
async function hasSession(request, env) {
  if (!ready(env)) return false;
  const value = cookieValue(request);
  if (value.length > 280) return false;
  const parts = value.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return false;
  const expires = Number(parts[1]);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(expires) || expires <= now || expires > now + MAX_AGE_SECONDS) return false;
  if (!/^[a-f0-9]{32}$/.test(parts[2])) return false;
  const signature = dec64(parts[3]);
  if (!signature) return false;
  const signed = parts.slice(0, 3).join(".");
  try {
    return await crypto.subtle.verify("HMAC", await hmacKey(env.FCD_SESSION_SECRET), signature, encoder.encode(signed));
  } catch { return false; }
}
async function createCookie(env) {
  const until = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const nonce = [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, "0")).join("");
  const payload = "v1." + until + "." + nonce;
  const signature = enc64(new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(env.FCD_SESSION_SECRET), encoder.encode(payload))));
  return COOKIE_NAME + "=" + payload + "." + signature +
    "; Max-Age=" + MAX_AGE_SECONDS + "; Path=/; HttpOnly; Secure; SameSite=Lax";
}
async function samePassword(a, b) {
  const [x, y] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(a)),
    crypto.subtle.digest("SHA-256", encoder.encode(b))
  ]);
  const left = new Uint8Array(x), right = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i];
  return diff === 0;
}
function originAllowed(request) {
  const fetchSite = request.headers.get("Sec-Fetch-Site");
  if (fetchSite === "cross-site") return false;
  const origin = request.headers.get("Origin");
  // Referrer/privacy policies can make a legitimate same-origin form POST
  // carry Origin: null. Require browser Fetch Metadata in that case.
  if (origin === "null") return fetchSite === "same-origin";
  return !origin || origin === new URL(request.url).origin;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function loginPage(next, error = false, csrf = "") {
  const alert = error ? '<p class="error" role="alert">Email သို့မဟုတ် Password မမှန်ပါ။ ပြန်စမ်းကြည့်ပါ။</p>' : "";
  return '<!doctype html><html lang="my"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=1200">' +
    '<meta name="robots" content="noindex,nofollow">' +
    '<meta name="theme-color" content="#0d151a"><title>Login | Future Code Main</title>' +
    '<style>*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(ellipse at 15% 0%,#20534d 0%,#101c21 50%,#0b1319 100%);display:grid;place-items:center;color:#f7f8f6;font-family:system-ui,"Noto Sans Myanmar",sans-serif;padding:20px}' +
    'main{width:min(100%,440px);background:#14252a;border:1px solid #355b56;border-radius:24px;padding:36px 30px;box-shadow:0 25px 60px #0007}' +
    '.brand{font-size:27px;font-weight:900;letter-spacing:.03em;color:#ffae72;margin:0 0 8px}.eyebrow{font-size:12px;letter-spacing:.17em;color:#aaccc5;margin:0 0 28px}' +
    'h1{font-size:23px;margin:0 0 10px}p{font-size:13px;line-height:1.9;color:#b9d0ca}label{display:block;margin:18px 0 7px;font-size:13px;font-weight:700}' +
    'input{width:100%;border-radius:11px;border:1px solid #4e6864;background:#0d1a1e;color:#fff;padding:14px;font-size:16px;outline-offset:2px}' +
    'button{width:100%;border:0;border-radius:11px;margin-top:23px;background:#f9a86c;color:#1a2926;font-weight:800;font-size:16px;padding:15px;cursor:pointer}' +
    '.error{color:#ffd8d4;background:#562a30;padding:10px 14px;border-radius:9px}footer{text-align:center;margin-top:24px;font-size:11px;color:#9bb0ac}</style></head>' +
    '<body><main><div class="brand">FC+ FUTURE CODE</div><div class="eyebrow">FOOTBALL MAIN CHANNEL</div>' +
    '<h1>အကောင့်ဖြင့် ဝင်ရောက်ရန်</h1><p>Future Code Main အတွက်သာ Login လိုအပ်ပါသည်။</p>' +
    alert + '<form method="POST" action="/login" autocomplete="on">' +
    '<input type="hidden" name="next" value="' + escapeHtml(next) + '">' +
    '<input type="hidden" name="csrf" value="' + escapeHtml(csrf) + '">' +
    '<label for="email">Email</label><input id="email" name="email" type="email" autocomplete="username" required maxlength="254">' +
    '<label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="256">' +
    '<button type="submit">Login ဝင်ရန်</button></form><footer>Future Code AI Studio · Main Website Only</footer>' +
    '</main></body></html>';
}
function loginResponse(next, error = false, status = 200) {
  const csrf = newCsrfToken();
  return respond(loginPage(next, error, csrf), status, {
    "Content-Type": "text/html; charset=utf-8",
    "Set-Cookie": csrfCookie(csrf),
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
  });
}
function unavailable() {
  return respond("Future Code Main login setup is pending. Main site is not available until its Cloudflare secrets are configured.", 503, { "Content-Type": "text/plain; charset=utf-8" });
}
async function loginPost(request, env) {
  // Browsers can send Origin: null or omit Origin for privacy reasons.
  // The same-site CSRF cookie + hidden token is the login POST's primary
  // protection, instead of rejecting legitimate users based on Origin.
  if (request.headers.get("Sec-Fetch-Site") === "cross-site") return respond("Forbidden", 403);
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > 4096) return respond("Form too large", 413);
  let form;
  try { form = await request.formData(); } catch { return respond("Invalid form", 400); }
  const email = form.get("email"), password = form.get("password");
  const next = nextPage(form.get("next"));
  if (!validCsrf(request, form.get("csrf"))) return loginResponse(next, true, 403);
  if (typeof email !== "string" || typeof password !== "string" ||
      email.length > 254 || password.length > 256) return loginResponse(next, true, 401);
  if (email.trim().toLowerCase() !== MAIN_EMAIL ||
      !(await samePassword(password, env.FCD_MAIN_PASSWORD))) return loginResponse(next, true, 401);
  return redirect(next, 303, await createCookie(env));
}
const LOGOUT_MARKUP = '<form method="POST" action="/logout" style="position:fixed;right:12px;top:12px;z-index:999999;margin:0">' +
  '<button type="submit" style="cursor:pointer;background:#14292b;color:#fff;border:1px solid #f3ad70;border-radius:999px;padding:10px 15px;font-size:12px;font-weight:700;box-shadow:0 2px 12px #0006">Logout</button></form>';
async function serveMain(request, env) {
  const asset = await env.ASSETS.fetch(request);
  if (request.method === "HEAD" || !asset.ok || !(asset.headers.get("Content-Type") || "").includes("text/html")) return asset;
  const content = await asset.text();
  const headers = new Headers(asset.headers);
  headers.delete("Content-Length");
  headers.delete("Content-Encoding");
  headers.delete("ETag");
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Vary", "Cookie");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  return new Response(content.replace(/<\/body>/i, LOGOUT_MARKUP + "</body>"), { status: asset.status, headers });
}
export default {
  async fetch(request, env) {
    const response = await handleRequest(request, env);
    const headers = new Headers(response.headers);
    // A live positive/negative probe distinguishes Worker responses from static assets.
    headers.set("X-Football-Worker", "selective-routes-v1");
    return new Response(response.body, {status: response.status, statusText: response.statusText, headers});
  }
};
async function handleRequest(request, env) {
    const path = new URL(request.url).pathname;
    if (path === "/api/editor/news" || path.startsWith("/api/editor/news/")) return newsApi(request, env, path);
    if (path.startsWith("/api/editor/")) return editorApi(request, env, path);
    if (path === "/editor" || path.startsWith("/editor/")) {
      if (!ready(env)) return unavailable();
      if (!(await hasSession(request, env))) return redirect("/login?next=/editor/", 302);
      if (path === "/editor") return redirect("/editor/", 302);
      const asset = await env.ASSETS.fetch(request);
      const headers = new Headers(asset.headers);
      for (const [key, value] of Object.entries(httpHeaders())) headers.set(key, value);
      return new Response(asset.body, { status: asset.status, headers });
    }
    if (LOGIN_PATHS.has(path)) {
      if (!ready(env)) return unavailable();
      if (request.method === "GET" || request.method === "HEAD") {
        const next = nextPage(new URL(request.url).searchParams.get("next"));
        if (await hasSession(request, env)) return redirect(next);
        return loginResponse(next);
      }
      if (request.method === "POST") return loginPost(request, env);
      return respond("Method Not Allowed", 405, { Allow: "GET, HEAD, POST" });
    }
    if (LOGOUT_PATHS.has(path)) {
      if (request.method !== "POST") return respond("Method Not Allowed", 405, { Allow: "POST" });
      if (!originAllowed(request)) return respond("Forbidden", 403);
      return redirect("/login", 303, COOKIE_NAME + "=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax");
    }
    if (MAIN_PATHS.has(path)) {
      if (!ready(env)) return unavailable();
      if (!(await hasSession(request, env))) {
        const next = path + new URL(request.url).search;
        return redirect("/login?next=" + encodeURIComponent(next), 302);
      }
      return serveMain(request, env);
    }
    // Independent Goal Zone APK analytics routes; other brands keep existing behavior.
    if (path === GZ_VISIT_PATH) return gzVisit(request, env);
    if (path === GZ_REPORT_PATH) return gzStats(request, env);
    if (GZ_STATS_PATHS.has(path)) {
      if (!ready(env)) return unavailable();
      if (!(await hasSession(request, env))) return redirect("/login?next=" + encodeURIComponent(GZ_PREFIX + "stats.html"), 302);
      return serveMain(request, env);
    }
    if (GZ_APK.test(path)) return gzDownload(request, env);
    if (GZ_JOURNAL_PAGES.has(path)) return gzJournalPage(request, env, GZ_JOURNAL_PAGES.get(path));
    // Shared data, scripts, brand routes and assets are publicly accessible.
    return env.ASSETS.fetch(request);
}

// Owner content editor. GitHub credentials stay in encrypted Cloudflare secrets.
const EDITOR_SOURCE = 'futurecode064-cyber/future-code-football-daily';
const EDITOR_DELIVERY = 'futurecode064-cyber/AI-Recap-GitHub';
const EDITOR_WORKFLOW = 'football-standalone-sync.yml';
const EDITOR_LEAGUE_SIZES = {'Premier League':20,Championship:24,'League One':24,'La Liga':20,'La Liga 2':22,'Serie A':20,'Serie B':20,Bundesliga:18,'2. Bundesliga':18,'Ligue 1':18,'Ligue 2':18};
function editorDay(offset=0){return gzDate(new Date(Date.now()+offset*86400000));}
function editorDate(value){return typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;}
function editorUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}}
function editorErrors(bundle){
 const errors=[], report=bundle?.report, sheet=bundle?.odds;
 if(!report||!sheet||!Array.isArray(report.matches)||!Array.isArray(sheet.matches))return ['ပွဲနှင့် ပေါက်ကြေးဖိုင် ပုံစံမမှန်ပါ'];
 if(report.reportDate!==editorDay()||sheet.reportDate!==report.reportDate)errors.push('ယနေ့ မြန်မာရက်စွဲနှင့် report/odds ရက်စွဲတို့ ကိုက်ညီရမည်');
 if(report.published!==true||report.matchDateTimezone!=='Asia/Yangon')errors.push('Published နှင့် Asia/Yangon သတ်မှတ်ချက်လိုအပ်သည်');
 if(!report.matches.length||report.matches.length>120)errors.push('ပွဲအရေအတွက် ၁ မှ ၁၂၀ အတွင်း ဖြစ်ရမည်');
 if(!Array.isArray(report.noFixturesLeagues))errors.push('noFixturesLeagues စာရင်းလိုအပ်သည်');
 if(sheet.matches.length!==report.matches.length)errors.push('ပွဲနှင့် ကြေး အရေအတွက် မတူပါ');
 const seen=new Set(),ranks=new Set();
 report.matches.forEach((m,i)=>{
  const prefix='ပွဲ '+(i+1)+' · ',e=text=>errors.push(prefix+text);
  if(!m||typeof m!=='object'){e('ပုံစံမမှန်ပါ');return;}
  for(const k of ['home','away','homeDisplay','awayDisplay','league','kickoffYangon'])if(typeof m[k]!=='string'||!m[k].trim()||m[k].length>200)e(k+' ဖြည့်ပါ');
  if(m.home===m.away)e('အိမ်ရှင်နှင့် ဧည့်သည် တူနေသည်');
  const identity=[m.league,m.home,m.away].join('|');if(seen.has(identity))e('ပွဲထပ်နေသည်');seen.add(identity);
  if(!editorDate(m.kickoffCalendarDate)||![report.reportDate,editorDay(1)].includes(m.kickoffCalendarDate)||m.nightEditorialDate!==report.reportDate)e('ကန်မည့်ရက် / ညစာရင်းရက် စစ်ပါ');
  const preview=m.dailyPreviewText;
  if(typeof preview!=='string'||preview.trim().length<300||preview.length>20000||/\n/.test(preview)||!preview.endsWith('။**'))e('ပွဲကြိုစာမူ စာလုံး ၃၀၀ အထက်၊ စာပိုဒ်တစ်ခုနှင့် bold ရွေးချယ်စာသားအဆုံးသတ် လိုအပ်သည်');
  if(/ခန့်မှန်း\s*ဂိုးရလဒ်/.test(preview||''))e('ပုံမှန်ပွဲကြိုတွင် ခန့်မှန်းဂိုး မထည့်ပါနှင့်');
  if(m.previewJournalist?.status!=='owner_approved_published')e('ပိုင်ရှင်အတည်ပြုစာမူ metadata လိုအပ်သည်');
  if(!editorUrl(m.fixtureSourceUrl||m.previewV2?.fixtureSourceUrl||m.researchSources?.[0]))e('ပွဲအချက်အလက်ရင်းမြစ် HTTPS URL ဖြည့်ပါ');
  for(const side of ['home','away']){
   if(m[side+'CrestUrl']&&!editorUrl(m[side+'CrestUrl']))e(side+' Logo HTTPS URL မမှန်ပါ');
   const form=m[side+'LastFive'];
   if(!Array.isArray(form)||form.length!==5||form.some(x=>!x||(!/^[WDL]$/.test(x.result||'')&&!(Number.isInteger(x.teamGoals)&&x.teamGoals>=0&&Number.isInteger(x.opponentGoals)&&x.opponentGoals>=0))||!editorUrl(x.sourceUrl)))e(side+' နောက်ဆုံး ၅ ပွဲနှင့် ရင်းမြစ် စစ်ပါ');
   if(EDITOR_LEAGUE_SIZES[m.league]){
    const r=m[side+'Standing'];if(!r||['played','wins','draws','losses','points','position'].some(k=>!Number.isInteger(r[k])||r[k]<0)||r.played!==r.wins+r.draws+r.losses||r.position<1||r.position>EDITOR_LEAGUE_SIZES[m.league])e(side+' standings (ကစားပြီး = နိုင်+သရေ+ရှုံး၊ အဆင့်၊ ရမှတ်) စစ်ပါ');
   }
  }
  if(EDITOR_LEAGUE_SIZES[m.league]&&!editorUrl(m.standingsSourceUrl))e('Standings ရင်းမြစ် HTTPS URL ဖြည့်ပါ');
  const prices=[m.homeOdds,m.drawOdds,m.awayOdds];if(prices.some(x=>x!==null&&x!==undefined&&x!=='')){
   if(prices.some(x=>!Number.isFinite(Number(x))||Number(x)<=1)||!m.oddsProvider||!editorUrl(m.oddsSourceUrl))e('1X2 သုံးခုလုံး ၁ ထက်ကြီးသောကြေးနှင့် bookmaker/source ဖြည့်ပါ');
  }
  if(m.specialChoice===true){if(!Number.isInteger(m.specialChoiceRank)||m.specialChoiceRank<1||ranks.has(m.specialChoiceRank))e('Special နံပါတ် မထပ်စေရ');ranks.add(m.specialChoiceRank);
   const p=m.specialAnalysisParagraphs;if(!Array.isArray(p)||!p.length||p.some(x=>typeof x!=='string'||x.length>20000)||!/^.*\*\*[^*]+\s*ကို ရွေးချယ်ပါတယ်။\*\*$/.test(p[p.length-1]||''))e('Special စာမူကို bold ရွေးချယ်စာသားဖြင့် အဆုံးသတ်ပါ');
  }
  const o=sheet.matches[i];if(!o||o.league!==m.league||o.canonicalHome!==m.home||o.canonicalAway!==m.away||o.home!==m.homeDisplay||o.away!==m.awayDisplay){e('ပွဲနှင့် ကြေး အသင်းအစဉ်မကိုက်ပါ');return;}
  for(const k of ['bodyOdds','goalTotalOdds'])if(typeof o[k]!=='string'||!o[k].trim()||o[k].length>40)e('မူလ '+k+' ဖြည့်ပါ');
  for(const k of ['currentBodyOdds','currentGoalTotalOdds','pdfLastColumn'])if(o[k]!==undefined&&(typeof o[k]!=='string'||o[k].length>40))e(k+' ပုံစံမမှန်ပါ');
  for(const k of ['currentBodyOdds','currentGoalTotalOdds'])if(o[k]&&!/^(?:-\d+|\d+[+-]\d+|\d+=)$/.test(o[k]))e(k+' ကို -70၊ 1-30၊ 3+95၊ 1= ပုံစံဖြည့်ပါ');
  if(![m.homeDisplay,m.awayDisplay].includes(o.upperTeam))e('ကြေးပေးအသင်းသည် ပွဲထဲကအသင်း ဖြစ်ရမည်');
  if(!m.myanmarOdds||['upperTeam','bodyOdds','goalTotalOdds'].some(k=>m.myanmarOdds[k]!==o[k]))e('ကတ်နှင့် table မြန်မာကြေးမကိုက်ပါ');
 });
 if(bundle.results){const r=bundle.results;if(r.reportDate!==editorDay(-1)||!Array.isArray(r.matches)||r.matches.length>200)errors.push('မနေ့ကရလဒ် report မမှန်ပါ');else r.matches.forEach((m,i)=>{if(m.status==='finished'&&(!/^\d{1,2}-\d{1,2}$/.test(m.finalScore||'')||!editorUrl(m.resultSourceUrl)||!editorDate(m.resultVerifiedDate)))errors.push('မနေ့က ပွဲ '+(i+1)+' · FT ဂိုးနှင့် ရင်းမြစ် စစ်ပါ');});}
 return errors.slice(0,150);
}
async function editorGithub(env,repo,path,method='GET',body){
 const headers={'Accept':'application/vnd.github+json','User-Agent':'FutureCode-Owner-Editor','X-GitHub-Api-Version':'2022-11-28'};
 if(env.FCD_EDITOR_GITHUB_TOKEN)headers.Authorization='Bearer '+env.FCD_EDITOR_GITHUB_TOKEN;
 if(body!==undefined)headers['Content-Type']='application/json';
 const r=await fetch('https://api.github.com/repos/'+repo+'/'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(15000)});
 if(!r.ok){const error=new Error(r.status===404?'GitHub ဖိုင်/ခွင့်ပြုချက် မတွေ့ပါ':r.status===401||r.status===403?'GitHub credential သက်တမ်း/permission စစ်ပါ':r.status===409||r.status===422?'GitHub ပြိုင်ပြင်ထားနိုင်သည်။ Server data အသစ်ပြန်ယူပြီး ပြောင်းလဲမှုနှိုင်းယှဉ်ပါ':'GitHub ဝန်ဆောင်မှု အမှား '+r.status);error.status=r.status;throw error;}
 return r.status===204?null:await r.json();
}
function editorDecode(content){const bytes=Uint8Array.from(atob(content.replace(/\s/g,'')),c=>c.charCodeAt(0));return JSON.parse(new TextDecoder().decode(bytes));}
async function editorFile(env,repo,path,ref,optional=false){try{const d=await editorGithub(env,repo,'contents/'+path+'?ref='+encodeURIComponent(ref));return editorDecode(d.content);}catch(e){if(optional&&e.status===404)return null;throw e;}}
async function editorBody(request){
 if(request.headers.get('Content-Type')?.split(';')[0]!=='application/json')throw new Error('JSON request လိုအပ်သည်');
 const reader=request.body?.getReader();if(!reader)throw new Error('Data မပါပါ');let n=0;const chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;n+=value.byteLength;if(n>1500000){await reader.cancel();throw new Error('Data 1.5 MB ထက်ကြီးနေသည်');}chunks.push(value);}
 const all=new Uint8Array(n);let pos=0;for(const c of chunks){all.set(c,pos);pos+=c.length;}return JSON.parse(new TextDecoder().decode(all));
}
async function editorDispatch(env){await editorGithub(env,EDITOR_DELIVERY,'actions/workflows/'+EDITOR_WORKFLOW+'/dispatches','POST',{ref:'main'});}
async function editorApi(request,env,path){
 if(!ready(env)||!await hasSession(request,env))return gzJson({error:'Owner login လိုအပ်သည်'},401);
 const url=new URL(request.url);
 if(request.method==='POST'&&(request.headers.get('Origin')!==url.origin||request.headers.get('X-Football-Editor')!=='1'||request.headers.get('Sec-Fetch-Site')==='cross-site'))return gzJson({error:'ဤ website editor မှသာ တင်နိုင်ပါသည်'},403);
 try{
  if(path==='/api/editor/state'&&request.method==='GET'){
   const date=url.searchParams.get('date')||editorDay();if(!editorDate(date)||date>editorDay(1))return gzJson({error:'ရက်စွဲမမှန်ပါ'},400);
   const ref=await editorGithub(env,EDITOR_SOURCE,'git/ref/heads/main'),head=ref.object.sha,previous=new Date(Date.parse(date+'T12:00:00Z')-86400000).toISOString().slice(0,10);
   const [current,dated,odds,results,evening]=await Promise.all([editorFile(env,EDITOR_SOURCE,'football-daily/data/today.json',head),editorFile(env,EDITOR_SOURCE,'football-daily/data/archive/'+date+'.json',head,true),editorFile(env,EDITOR_SOURCE,'football-daily/data/odds/'+date+'.json',head,true),editorFile(env,EDITOR_SOURCE,'football-daily/data/archive/'+previous+'.json',head,true),editorFile(env,EDITOR_SOURCE,'football-daily/data/odds/evening/'+date+'.json',head,true)]);
   if(odds&&evening?.reportDate===date)for(const [i,m] of odds.matches.entries()){const x=evening.matches?.find(x=>Number(x.row)===Number(m.pdfRow||m.number||i+1));if(x&&['league','home','away','upperTeam','kickoffDisplay'].every(k=>String(x[k]??'')===String(m[k]??''))&&x.morningBodyOdds===m.bodyOdds&&x.morningGoalTotalOdds===m.goalTotalOdds){m.currentBodyOdds=x.eveningBodyOdds||'';m.currentGoalTotalOdds=x.eveningGoalTotalOdds||'';}}
   return gzJson({head,configured:Boolean(env.FCD_EDITOR_GITHUB_TOKEN),report:current.reportDate===date?current:dated||{reportDate:date,matches:[],noFixturesLeagues:[]},odds:odds||{reportDate:date,matches:[]},results:results||(current.reportDate===previous?current:null)});
  }
  if(path==='/api/editor/status'&&request.method==='GET'){
   const sha=url.searchParams.get('commit');if(!/^[a-f0-9]{40}$/.test(sha||''))return gzJson({error:'Commit မမှန်ပါ'},400);
   const expected=await editorFile(env,EDITOR_SOURCE,'football-daily/data/editor-publication.json',sha);
   const canonical=await editorFile(env,EDITOR_SOURCE,'football-daily/data/editor-publication.json','main',true);
   const workflowUrl='https://github.com/'+EDITOR_DELIVERY+'/actions/workflows/'+EDITOR_WORKFLOW;
   if(canonical?.id!==expected.id)return gzJson({phase:'superseded',message:'နောက်ထပ် report အသစ်တင်ထားပါသည်။ နောက်ဆုံး data ကို ပြန်ဖွင့်ပါ။',workflowUrl});
   const live=await env.ASSETS.fetch(new Request(url.origin+'/data/editor-publication.json?editor-check='+Date.now()));
   if(live.ok){try{if((await live.json()).id===expected.id)return gzJson({phase:'live',message:'✓ ဤထုတ်ဝေမှု၏ marker ကို live deployment တွင် တွေ့ရှိပါပြီ။ Brand စာမျက်နှာနှင့် PNG ကို ဖွင့်စစ်ပါ။',workflowUrl});}catch{}}
   const marker=await editorFile(env,EDITOR_DELIVERY,'football-daily/data/editor-publication.json','football-daily-render',true);
   const runs=await editorGithub(env,EDITOR_DELIVERY,'actions/workflows/'+EDITOR_WORKFLOW+'/runs?per_page=5');
   const run=runs.workflow_runs?.find(r=>Date.parse(r.created_at)>=Date.parse(expected.createdAt)-5000);
   const mirrored=marker?.id===expected.id,failed=!mirrored&&run?.conclusion==='failure';
   return gzJson({phase:failed?'failed':mirrored?'deploying':'queued',message:failed?'Production sync မအောင်မြင်ပါ။ GitHub error ကိုကြည့်ပါ။ Data ကို GitHub တွင် သိမ်းထားပြီးဖြစ်သည်။':mirrored?'GitHub production ဆီ ပို့ပြီးပါပြီ။ Cloudflare live deployment ကို စောင့်နေသည်။':'GitHub တွင် သိမ်းထားပြီး production sync ကို စောင့်နေသည်။',workflowUrl:run?.html_url||workflowUrl});
  }
  if(!['/api/editor/validate','/api/editor/publish','/api/editor/deliver'].includes(path)||request.method!=='POST')return gzJson({error:'Method/endpoint မမှန်ပါ'},405);
  const body=await editorBody(request);
  if(path==='/api/editor/deliver'){
   if(!env.FCD_EDITOR_GITHUB_TOKEN)return gzJson({error:'Publish credential မချိတ်ရသေးပါ'},503);
   if(!/^[a-f0-9]{40}$/.test(body.commit||''))return gzJson({error:'Commit မမှန်ပါ'},400);
   const head=await editorGithub(env,EDITOR_SOURCE,'git/ref/heads/main');if(head.object.sha!==body.commit)return gzJson({error:'Report အသစ်ရှိနေသည်။ Server data ပြန်ဖွင့်ပါ။'},409);
   await editorFile(env,EDITOR_SOURCE,'football-daily/data/editor-publication.json',body.commit);await editorDispatch(env);return gzJson({message:'သိမ်းပြီးသား report ကို production sync ပြန်ခေါ်ပြီးပါပြီ'});
  }
  const errors=editorErrors(body);if(errors.length)return gzJson({error:'အချက်အလက် ပြန်ပြင်ရန်လိုသည်',errors},422);
  if(path==='/api/editor/validate')return gzJson({message:'✓ Data format စစ်ဆေးမှုအောင်မြင်သည်။ ဘောလုံးအချက်အလက်အမှန်ကို ပိုင်ရှင်က အတည်ပြုရန်လိုသည်။'});
  if(!env.FCD_EDITOR_GITHUB_TOKEN)return gzJson({error:'FCD_EDITOR_GITHUB_TOKEN ကို Cloudflare Secret တွင် တစ်ကြိမ်ချိတ်ရန်လိုသည်'},503);
  if(body.confirmed!==true)return gzJson({error:'ပိုင်ရှင် အတည်ပြုရန်လိုသည်'},400);
  const ref=await editorGithub(env,EDITOR_SOURCE,'git/ref/heads/main'),head=ref.object.sha;
  if(head!==body.expectedHead)return gzJson({error:'GitHub data ပြောင်းထားပါသည်။ Draft ဖိုင်သိမ်းပြီး Server data အသစ်နှင့် နှိုင်းယှဉ်ပါ။'},409);
  const commit=await editorGithub(env,EDITOR_SOURCE,'git/commits/'+head),day=body.report.reportDate;
  const old=await editorFile(env,EDITOR_SOURCE,'football-daily/data/today.json',head);
  if(old.reportDate>day)return gzJson({error:'Report အသစ်ကို အဟောင်းဖြင့် အစားမထိုးနိုင်ပါ'},409);
  const writes=new Map(),put=(p,d)=>writes.set('football-daily/'+p,JSON.stringify(d,null,2)+'\n');
  if(old.reportDate<day&&editorDate(old.reportDate)){
   const existing=await editorFile(env,EDITOR_SOURCE,'football-daily/data/archive/'+old.reportDate+'.json',head,true);
   if(!existing)put('data/archive/'+old.reportDate+'.json',old);
  }
  if(body.results){
   const date=body.results.reportDate,original=await editorFile(env,EDITOR_SOURCE,'football-daily/data/archive/'+date+'.json',head,true)||(old.reportDate===date?old:null);
   if(!original||original.matches.length!==body.results.matches.length)return gzJson({error:'မနေ့ကပွဲစာရင်း ပြောင်းထားသည်။ ပြန်ဖွင့်ပါ။'},409);
   const resultFields=['status','finalScore','resultSourceUrl','resultVerifiedDate'];
   for(let i=0;i<original.matches.length;i++){
    const before=original.matches[i],after=body.results.matches[i];if(before.home!==after.home||before.away!==after.away||before.league!==after.league)return gzJson({error:'မနေ့ကပွဲ အသင်းအစဉ်မကိုက်ပါ'},422);
    for(const k of resultFields){if(after[k]===undefined)delete before[k];else before[k]=after[k];}
   }
   delete original.resultReview;put('data/archive/'+date+'.json',original);
  }
  put('data/today.json',body.report);put('data/archive/'+day+'.json',body.report);put('data/odds/'+day+'.json',body.odds);
  put('data/odds/evening/'+day+'.json',{reportDate:day,title:day+' owner editor ယခုကြေး',matches:body.odds.matches.map((m,i)=>({row:Number(m.pdfRow||m.number||i+1),league:m.league,home:m.home,away:m.away,upperTeam:m.upperTeam,kickoffDisplay:m.kickoffDisplay,homeCrestUrl:m.homeCrestUrl,awayCrestUrl:m.awayCrestUrl,morningBodyOdds:m.bodyOdds,morningGoalTotalOdds:m.goalTotalOdds,eveningBodyOdds:m.currentBodyOdds||'',eveningGoalTotalOdds:m.currentGoalTotalOdds||''}))});
  const publication={id:crypto.randomUUID(),createdAt:new Date().toISOString(),reportDate:day,source:'owner-content-editor'};put('data/editor-publication.json',publication);
  const tree=await editorGithub(env,EDITOR_SOURCE,'git/trees','POST',{base_tree:commit.tree.sha,tree:[...writes].map(([path,content])=>({path,mode:'100644',type:'blob',content}))});
  const saved=await editorGithub(env,EDITOR_SOURCE,'git/commits','POST',{message:'Publish owner football report '+day,tree:tree.sha,parents:[head]});
  // Non-force fast-forward refuses concurrent writers. No partial data commits.
  await editorGithub(env,EDITOR_SOURCE,'git/refs/heads/main','PATCH',{sha:saved.sha,force:false});
  let dispatched=true;try{await editorDispatch(env);}catch{dispatched=false;}
  return gzJson({commit:saved.sha,dispatched,message:dispatched?'Data ကို GitHub တွင် သိမ်းပြီး production sync ခေါ်ထားပါပြီ။ Live deployment ကို စောင့်ပါ။':'Data ကို GitHub တွင် သိမ်းပြီးပါပြီ။ Production ခေါ်မှု မအောင်မြင်သေးပါ။ အောက်က ပြန်ပို့ရန်ကို နှိပ်ပါ။'},202);
 }catch(e){return gzJson({error:e instanceof SyntaxError?'JSON data မမှန်ပါ':e.message||'Editor ဝန်ဆောင်မှုအမှား'},e.status===409||e.status===422?409:502);}
}


/* Football news publisher. Reuses the main owner session and editor-only GitHub
 * secret; publishes ONE shared feed consumed by Main and Goal Zone.
 * Media uploads are saved to the source repository, but are not delivered until
 * the news feed itself is published. No GitHub token goes to the browser.
 */
const NEWS_FILE = 'football-daily/data/news/latest.json';
const NEWS_CATEGORIES = Object.freeze({
  international:'နိုင်ငံတကာ ဘောလုံးသတင်း',
  'team-player':'အသင်းနှင့် ကစားသမားသတင်း',
  transfer:'အပြောင်းအရွှေ့ သတင်း',
  match:'ဘောလုံးပွဲ သတင်းနှင့် ရလဒ်',
  other:'အခြား ဘောလုံးသတင်း'
});
function newsValidate(raw){
  const errors=[], entries=[], seen=new Set();
  if(!Array.isArray(raw)||raw.length>60)return {errors:['သတင်းအရေအတွက် ၆၀ ပုဒ်အောက်သာ ထည့်ပါ'],items:[]};
  for(const [i,story] of raw.entries()){
    const tag='သတင်း '+(i+1)+' · ';
    if(!story||typeof story!=='object'){errors.push(tag+'ဖိုင်ပုံစံမမှန်ပါ');continue;}
    const title=String(story.title||'').trim(),id=String(story.id||'').trim();
    const category=String(story.category||'other'),image=String(story.image||'').trim();
    const imageAlt=String(story.imageAlt||'').trim(),sourceName=String(story.sourceName||'').trim();
    const sourceUrl=String(story.sourceUrl||'').trim(),date=String(story.sourceDateISO||'');
    const paragraphs=Array.isArray(story.paragraphs)?story.paragraphs.map(p=>String(p).trim()).filter(Boolean):[];
    if(!/^[a-z0-9-]{6,100}$/.test(id)||seen.has(id))errors.push(tag+'ID မှားနေသည် / ထပ်နေသည်');
    seen.add(id);
    if(title.length<4||title.length>220)errors.push(tag+'ခေါင်းစဉ် စာလုံး ၄–၂၂၀ အတွင်း ဖြည့်ပါ');
    if(!(category in NEWS_CATEGORIES))errors.push(tag+'သတင်းအမျိုးအစားမှားနေသည်');
    if(paragraphs.length<1||paragraphs.length>25||paragraphs.some(p=>p.length>10000)||paragraphs.join('').length>30000)errors.push(tag+'သတင်းစာသား/စာပိုဒ် ပြန်စစ်ပါ');
    if(image.length>1200||(image&&!((image.startsWith('/data/news/images/')&&/^\/data\/news\/images\/[a-zA-Z0-9/_\-.]+$/.test(image)&&!image.includes('..'))||editorUrl(image))))errors.push(tag+'ပုံလင့်ခ် မမှန်ပါ');
    if(imageAlt.length>250||sourceName.length>150)errors.push(tag+'ပုံနှင့် ရင်းမြစ်စာသားရှည်လွန်းသည်');
    if(sourceUrl&&!editorUrl(sourceUrl))errors.push(tag+'ရင်းမြစ် HTTPS လင့်ခ်မမှန်ပါ');
    if(!editorDate(date))errors.push(tag+'သတင်းရက်စွဲ မမှန်ပါ');
    entries.push({
      id,category,categoryLabel:NEWS_CATEGORIES[category],title,paragraphs,image,
      imageAlt:imageAlt||title,sourceName:sourceName||'Future Code',
      sourceUrl,sourceDateISO:date,
      sourceDateLabel:editorDate(date)?new Intl.DateTimeFormat('my-MM',{year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Yangon'}).format(new Date(date+'T12:00:00Z')):'',
      publishedAt:typeof story.publishedAt==='string'&&story.publishedAt.length<40?story.publishedAt:new Date().toISOString()
    });
  }
  return {errors:errors.slice(0,60),items:entries};
}
async function newsApi(request,env,path){
  if(!ready(env)||!(await hasSession(request,env)))return gzJson({error:'Owner login လိုအပ်သည်'},401);
  const url=new URL(request.url);
  if(request.method==='POST'&&(request.headers.get('Origin')!==url.origin||
    request.headers.get('X-Football-Editor')!=='1'||request.headers.get('Sec-Fetch-Site')==='cross-site'))
    return gzJson({error:'Website အတွင်းမှသာ သတင်းတင်နိုင်ပါသည်'},403);
  try{
    if(path==='/api/editor/news'&&request.method==='GET'){
      const file=await editorGithub(env,EDITOR_SOURCE,'contents/'+NEWS_FILE+'?ref=main');
      return gzJson({feed:editorDecode(file.content),sha:file.sha,configured:Boolean(env.FCD_EDITOR_GITHUB_TOKEN)});
    }
    if(path==='/api/editor/news/status'&&request.method==='GET'){
      const revision=url.searchParams.get('revision');
      if(!/^[a-f0-9-]{36}$/.test(revision||''))return gzJson({error:'ထုတ်ဝေမှု ID မမှန်ပါ'},400);
      const current=await editorFile(env,EDITOR_SOURCE,NEWS_FILE,'main');
      if(current.revision!==revision)return gzJson({phase:'superseded',message:'နောက်ထပ် သတင်းအသစ်တင်ထားပြီးဖြစ်သည်။'});
      const live=await env.ASSETS.fetch(new Request(url.origin+'/data/news/latest.json?news-check='+Date.now(),{cache:'no-store'}));
      if(live.ok){try{if((await live.json()).revision===revision)return gzJson({phase:'live',message:'✓ Main နှင့် ဂိုးဇုံအတွက် Live feed ပြောင်းလဲပြီးပါပြီ။'});}catch{}}
      return gzJson({phase:'queued',message:'GitHub တွင် သိမ်းပြီးဖြစ်သည်။ Production Sync / Cloudflare Deployment ပြီးစီးရန် စောင့်နေသည်။'});
    }
    if(request.method!=='POST'||!['/api/editor/news/image','/api/editor/news/publish','/api/editor/news/deliver'].includes(path))
      return gzJson({error:'Method/endpoint မမှန်ပါ'},405);
    if(!env.FCD_EDITOR_GITHUB_TOKEN)return gzJson({error:'Cloudflare Secret FCD_EDITOR_GITHUB_TOKEN မချိတ်ဆက်ရသေးပါ။ /editor/setup.html တွင် ကြည့်ပါ။'},503);
    const body=await editorBody(request);
    if(path==='/api/editor/news/image'){
      const match=typeof body.dataUrl==='string'&&/^data:image\/(webp|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(body.dataUrl);
      if(!match)return gzJson({error:'JPEG / WebP ပုံသာ Upload လုပ်နိုင်ပါသည်'},422);
      const bytes=atob(match[2]);
      const webp=match[1]==='webp';
      if(bytes.length<100||bytes.length>900000||
        (webp?bytes.slice(0,4)!=='RIFF'||bytes.slice(8,12)!=='WEBP':
          bytes.charCodeAt(0)!==255||bytes.charCodeAt(1)!==216||bytes.charCodeAt(2)!==255))
        return gzJson({error:'ပုံအမျိုးအစား သို့မဟုတ် ပုံအရွယ်အစား မမှန်ပါ'},422);
      const file='football-daily/data/news/images/uploads/'+editorDay()+'/'+crypto.randomUUID()+(webp?'.webp':'.jpg');
      const blob=await editorGithub(env,EDITOR_SOURCE,'git/blobs','POST',{content:match[2],encoding:'base64'});
      const ref=await editorGithub(env,EDITOR_SOURCE,'git/ref/heads/main');
      const commit=await editorGithub(env,EDITOR_SOURCE,'git/commits/'+ref.object.sha);
      const tree=await editorGithub(env,EDITOR_SOURCE,'git/trees','POST',{
        base_tree:commit.tree.sha,tree:[{path:file,mode:'100644',type:'blob',sha:blob.sha}]
      });
      const saved=await editorGithub(env,EDITOR_SOURCE,'git/commits','POST',{
        message:'Upload owner football news image',tree:tree.sha,parents:[ref.object.sha]
      });
      await editorGithub(env,EDITOR_SOURCE,'git/refs/heads/main','PATCH',{sha:saved.sha,force:false});
      return gzJson({image:'/'+file.replace(/^football-daily\//,'')},201);
    }
    if(path==='/api/editor/news/deliver'){
      const revision=String(body.revision||'');
      if(!/^[a-f0-9-]{36}$/.test(revision))return gzJson({error:'ID မမှန်ပါ'},422);
      const feed=await editorFile(env,EDITOR_SOURCE,NEWS_FILE,'main');
      if(feed.revision!==revision)return gzJson({error:'သတင်းအသစ်ရှိနေသည်။ အသစ်ပြန်ဖွင့်ပါ'},409);
      await editorDispatch(env);
      return gzJson({message:'Production Sync ပြန်ခေါ်ပြီးပါပြီ'});
    }
    const checked=newsValidate(body.items);
    if(checked.errors.length)return gzJson({error:'သတင်းအချက်အလက် ပြင်ဆင်ရန်လိုသည်',errors:checked.errors},422);
    if(!/^[a-f0-9]{40}$/.test(body.expectedSha||''))return gzJson({error:'News feed ကို အရင်ဖွင့်ပါ'},409);
    const ref=await editorGithub(env,EDITOR_SOURCE,'git/ref/heads/main');
    const current=await editorGithub(env,EDITOR_SOURCE,'contents/'+NEWS_FILE+'?ref='+ref.object.sha);
    if(current.sha!==body.expectedSha)return gzJson({error:'အခြားတစ်နေရာမှ သတင်းပြင်ထားသည်။ မိမိ Draft ကိုသိမ်းပြီး Data အသစ်ပြန်ဖွင့်ပါ။'},409);
    const feed={
      date:editorDay(),timezone:'Asia/Yangon',
      windowLabel:'နောက်ဆုံး ထုတ်ဝေထားသော ဘောလုံးသတင်းများ · မြန်မာစံတော်ချိန်',
      revision:crypto.randomUUID(),updatedAt:new Date().toISOString(),
      items:checked.items
    };
    const head=await editorGithub(env,EDITOR_SOURCE,'git/commits/'+ref.object.sha);
    const tree=await editorGithub(env,EDITOR_SOURCE,'git/trees','POST',{
      base_tree:head.tree.sha,tree:[{path:NEWS_FILE,mode:'100644',type:'blob',content:JSON.stringify(feed,null,2)+'\n'}]
    });
    const saved=await editorGithub(env,EDITOR_SOURCE,'git/commits','POST',{
      message:'Publish owner football news ('+feed.items.length+' articles)',tree:tree.sha,parents:[ref.object.sha]
    });
    await editorGithub(env,EDITOR_SOURCE,'git/refs/heads/main','PATCH',{sha:saved.sha,force:false});
    let dispatched=true;try{await editorDispatch(env);}catch{dispatched=false;}
    return gzJson({
      sha:(await editorGithub(env,EDITOR_SOURCE,'contents/'+NEWS_FILE+'?ref='+saved.sha)).sha,
      commit:saved.sha,revision:feed.revision,dispatched,
      message:dispatched?'သတင်းများကို GitHub တွင် သိမ်းပြီး Production Sync အလိုအလျောက်ခေါ်ထားပါပြီ။':'သတင်းများကို GitHub တွင် သိမ်းပြီးပါပြီ။ Production Sync ခေါ်မရသေးပါ။ ပြန်ပို့ရန် နှိပ်ပါ။'
    },202);
  }catch(e){
    return gzJson({error:e instanceof SyntaxError?'JSON data မမှန်ပါ':e.message||'News editor အမှား'},e.status===409||e.status===422?409:502);
  }
}

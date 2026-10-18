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
const MAX_AGE_SECONDS = 8 * 60 * 60;
const MAIN_PATHS = new Set(["/", "/index", "/index.html", "/odds", "/odds/", "/odds.html"]);
const LOGIN_PATHS = new Set(["/login", "/login/", "/login.html"]);
const LOGOUT_PATHS = new Set(["/logout", "/logout/"]);
const encoder = new TextEncoder();

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
    if (parsed.origin !== "https://future-code-login.invalid" || !MAIN_PATHS.has(parsed.pathname)) return "/";
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
function cookieValue(request) {
  const raw = request.headers.get("Cookie") || "";
  const segment = raw.split(";").map(v => v.trim()).find(v => v.startsWith(COOKIE_NAME + "="));
  return segment ? segment.slice(COOKIE_NAME.length + 1) : "";
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
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) return false;
  const fetchSite = request.headers.get("Sec-Fetch-Site");
  return fetchSite !== "cross-site";
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function loginPage(next, error = false) {
  const alert = error ? '<p class="error" role="alert">Email သို့မဟုတ် Password မမှန်ပါ။ ပြန်စမ်းကြည့်ပါ။</p>' : "";
  return '<!doctype html><html lang="my"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
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
    '<label for="email">Email</label><input id="email" name="email" type="email" autocomplete="username" required maxlength="254">' +
    '<label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="256">' +
    '<button type="submit">Login ဝင်ရန်</button></form><footer>Future Code AI Studio · Main Website Only</footer>' +
    '</main></body></html>';
}
function loginResponse(next, error = false, status = 200) {
  return respond(loginPage(next, error), status, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
  });
}
function unavailable() {
  return respond("Future Code Main login setup is pending. Main site is not available until its Cloudflare secrets are configured.", 503, { "Content-Type": "text/plain; charset=utf-8" });
}
async function loginPost(request, env) {
  if (!originAllowed(request)) return respond("Forbidden", 403);
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > 4096) return respond("Form too large", 413);
  let form;
  try { form = await request.formData(); } catch { return respond("Invalid form", 400); }
  const email = form.get("email"), password = form.get("password");
  const next = nextPage(form.get("next"));
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
    const path = new URL(request.url).pathname;
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
    // Shared data, scripts, brand routes and assets are publicly accessible.
    return env.ASSETS.fetch(request);
  }
};

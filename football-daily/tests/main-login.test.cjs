"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const workerCode = fs.readFileSync(path.join(__dirname, "..", "_worker.js"), "utf8");
const SECRET = "unit-test-only-password";
const envConfig = { FCD_MAIN_PASSWORD: SECRET, FCD_SESSION_SECRET: "unit-test-session-key-01234567890123456789" };

async function loadWorker() {
  return (await import("data:text/javascript;base64," + Buffer.from(workerCode).toString("base64"))).default;
}
function fakeEnv() {
  const calls = [];
  const env = { ...envConfig, ASSETS: { async fetch(req) {
    calls.push(new URL(req.url).pathname);
    return new Response("<html><body>FOOTBALL ASSET</body></html>", {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  } } };
  return { env, calls };
}
function getRequest(route, opts = {}) {
  return new Request("https://future-code-football-daily.pages.dev" + route, opts);
}

test("only Future Code Main routes require valid signed login", async () => {
  const worker = await loadWorker();
  const {env,calls} = fakeEnv();

  for (const route of ["/", "/index", "/index/", "/index.html", "/odds", "/odds/", "/odds.html"]) {
    const result = await worker.fetch(getRequest(route), env);
    assert.equal(result.status, 302, route);
    assert.equal(result.headers.get("X-Football-Worker"), "selective-routes-v1");
    assert.ok(result.headers.get("Location").startsWith("/login?next="), route);
  }
  assert.equal(calls.length, 0, "blocked pages must not be served");

  for (const route of [
    "/ykz-family/", "/ykz-family/odds.html", "/bw-sport/", "/bw-sport/odds.html",
    "/ko-thet-family/", "/ko-thet-family/odds.html",
    "/future-code-journal/", "/future-code-journal/index.html", "/future-code-journal/odds.html",
    "/future-code-journal/brand.js", "/future-code-journal/assets/logo.webp",
    "/styles.css", "/app.js", "/data/today.json", "/data/odds/2026-10-17.json"
  ]) {
    const result = await worker.fetch(getRequest(route), env);
    assert.equal(result.status, 200, route);
  }
  assert.equal(calls.length, 15, "public brand routes and shared assets remain public");

  const login = await worker.fetch(getRequest("/login?next=%2Fodds%3Fdate%3D2026-10-17"), env);
  assert.equal(login.status, 200);
  const page = await login.text();
  assert.match(page, /name="email"/);
  assert.match(page, /name="password"/);
  const token = page.match(/name="csrf" value="([a-f0-9]{48})"/)?.[1];
  assert.ok(token, "login GET must provide a CSRF token");
  const csrfCookie = login.headers.get("Set-Cookie")?.split(";")[0];
  assert.ok(csrfCookie?.startsWith("__Host-fc_main_login_csrf="));
  assert.match(login.headers.get("Set-Cookie"), /SameSite=Strict/);
  assert.doesNotMatch(page, new RegExp(SECRET));
  assert.equal(login.headers.get("Cache-Control"), "private, no-store, max-age=0");

  const failed = await worker.fetch(getRequest("/login", {
    method: "POST", headers: {"Origin": "https://future-code-football-daily.pages.dev", "Cookie": csrfCookie},
    body: new URLSearchParams({email: "futurecode064@gmail.com", password: "bad-password", next: "/odds", csrf: token})
  }), env);
  assert.equal(failed.status, 401);
  assert.doesNotMatch(failed.headers.get("Set-Cookie") || "", /__Host-fc_main_session/);

  const crossSite = await worker.fetch(getRequest("/login", {
    method: "POST", headers: {"Origin": "https://evil.example", "Cookie": csrfCookie, "Sec-Fetch-Site": "cross-site"},
    body: new URLSearchParams({email: "futurecode064@gmail.com", password: SECRET, csrf: token})
  }), env);
  assert.equal(crossSite.status, 403);

  const missingCsrf = await worker.fetch(getRequest("/login", {
    method: "POST", headers: {"Origin": "https://future-code-football-daily.pages.dev"},
    body: new URLSearchParams({email: "futurecode064@gmail.com", password: SECRET})
  }), env);
  assert.equal(missingCsrf.status, 403);
  assert.match(await missingCsrf.text(), /name="csrf"/, "expired form must show a retryable login page");

  const success = await worker.fetch(getRequest("/login", {
    method: "POST", headers: {"Origin": "null", "Sec-Fetch-Site": "same-origin", "Cookie": csrfCookie},
    body: new URLSearchParams({email: "futurecode064@gmail.com", password: SECRET, next: "//evil.example", csrf: token})
  }), env);
  assert.equal(success.status, 303);
  assert.equal(success.headers.get("Location"), "/");
  const setCookie = success.headers.get("Set-Cookie");
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /Secure/);
  assert.match(setCookie, /SameSite=Lax/);
  const cookie = setCookie.split(";")[0];

  const allowed = await worker.fetch(getRequest("/odds.html", {headers:{Cookie:cookie}}), env);
  assert.equal(allowed.status, 200);
  assert.match(await allowed.text(), /Logout/);
  assert.equal(allowed.headers.get("Cache-Control"), "private, no-store, max-age=0");
  const forbidden = await worker.fetch(getRequest("/", {headers:{Cookie:cookie + "tampered"}}), env);
  assert.equal(forbidden.status, 302);

  const logout = await worker.fetch(getRequest("/logout", { method:"POST", headers:{
    Origin:"https://future-code-football-daily.pages.dev",Cookie:cookie
  }}), env);
  assert.equal(logout.status, 303);
  assert.match(logout.headers.get("Set-Cookie"), /Max-Age=0/);
  assert.equal(logout.headers.get("Location"), "/login");
});

test("missing Cloudflare secrets fail closed for main and never affect brand sites", async () => {
  const worker = await loadWorker();
  const {env} = fakeEnv();
  delete env.FCD_MAIN_PASSWORD;
  let response = await worker.fetch(getRequest("/"), env);
  assert.equal(response.status, 503);
  response = await worker.fetch(getRequest("/login"), env);
  assert.equal(response.status, 503);
  response = await worker.fetch(getRequest("/bw-sport/odds.html"), env);
  assert.equal(response.status, 200);
});

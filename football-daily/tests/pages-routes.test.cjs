"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const routes = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "_routes.json"), "utf8"));
const worker = fs.readFileSync(path.join(__dirname, "..", "_worker.js"), "utf8");

// Verify routing intent; Cloudflare preview/usage check is still required.
function routeMatches(pattern, pathname) {
  const re = new RegExp("^" + pattern.split("*").map(
    part => part.replace(/[.*+?^$(){}|[\]\\]/g, "\\$&")
  ).join(".*") + "$");
  return re.test(pathname);
}
function invokesWorker(pathname) {
  return routes.include.some(pattern => routeMatches(pattern, pathname)) &&
    !routes.exclude.some(pattern => routeMatches(pattern, pathname));
}

test("Pages routing stays within documented limits", () => {
  assert.equal(routes.version, 1);
  assert.ok(routes.include.length > 0);
  assert.ok(routes.include.length + routes.exclude.length <= 100);
  for (const rule of [...routes.include, ...routes.exclude]) {
    assert.ok(rule.startsWith("/") && rule.length <= 100, rule);
  }
});

test("Main login, news publishing and editor routes invoke the Worker", () => {
  for (const p of [
    "/", "/index", "/index/", "/index.html", "/odds", "/odds/", "/odds.html",
    "/login", "/login/", "/login.html", "/logout", "/logout/",
    "/editor", "/editor/", "/editor/editor.css", "/editor/setup.html",
    "/api/editor/state", "/api/editor/news", "/api/editor/news/status",
    "/api/editor/news/image", "/api/editor/news/publish"
  ]) assert.equal(invokesWorker(p), true, p);
  assert.match(worker, /"\/index\/"/, "index alias must be login-protected");
});

test("Goal Zone analytics and APK download counters invoke the Worker", () => {
  for (const p of [
    "/future-code-journal/", "/future-code-journal/index", "/future-code-journal/index.html",
    "/future-code-journal/odds", "/future-code-journal/odds/", "/future-code-journal/odds.html",
    "/future-code-journal/android/api/visit",
    "/future-code-journal/android/api/stats",
    "/future-code-journal/android/stats",
    "/future-code-journal/android/stats/",
    "/future-code-journal/android/stats.html",
    "/future-code-journal/android/GoalZone_Sports_Journal_v1.0.1.apk"
  ]) assert.equal(invokesWorker(p), true, p);
  assert.match(worker, /GZ_PREFIX \+ "stats"/, "stats alias must be login-protected");
});

test("Public JS, CSS, logos, data and branded sites bypass the Worker", () => {
  for (const p of [
    "/app.js", "/odds.js", "/styles.css", "/brand-export-data.js",
    "/canvas-image-kit.js", "/frame-zip.js",
    "/assets/logo.webp", "/data/today.json", "/data/archive/2026-10-19.json",
    "/data/odds/2026-10-20.json", "/data/news/latest.json",
    "/data/news/images/uploads/2026-10-20/story.webp",
    "/ykz-family/", "/ykz-family/odds.html", "/bw-sport/",
    "/bw-sport/odds.html", "/ko-thet-family/",
    "/ko-thet-family/odds.html", "/myanmar-football/",
    "/future-code-journal/brand.js", "/future-code-journal/assets/logo.webp",
    "/future-code-journal/android/index.html"
  ]) assert.equal(invokesWorker(p), false, p);
});

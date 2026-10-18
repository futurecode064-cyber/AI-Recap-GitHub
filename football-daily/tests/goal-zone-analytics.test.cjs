"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const worker = fs.readFileSync(path.join(__dirname, "..", "_worker.js"), "utf8");
const android = fs.readFileSync(path.join(__dirname, "..", "future-code-journal", "android", "index.html"), "utf8");
const stats = fs.readFileSync(path.join(__dirname, "..", "future-code-journal", "android", "stats.html"), "utf8");

test("Goal Zone analytics routes are isolated from other football websites", () => {
  assert.match(worker, /const GZ_PREFIX = "\/future-code-journal\/android\/"/);
  assert.match(worker, /if \(GZ_APK\.test\(path\)\) return gzDownload/);
  assert.match(worker, /if \(GZ_STATS_PATHS\.has\(path\)\)/);
  assert.match(worker, /await hasSession\(request, env\)/);
  assert.match(worker, /GOALZONE_ANALYTICS_DB/);
  assert.match(worker, /env\.ASSETS\.fetch\(request\)/);
});
test("Goal Zone download page is tracked and dashboard supports daily filters", () => {
  assert.match(android, /api\/visit/);
  assert.match(android, /GoalZone_Sports_Journal_v1\.0\.1\.apk/);
  assert.match(stats, /api\/stats\?days=/);
  assert.match(stats, /Last 7 days/);
  assert.match(stats, /Last 30 days/);
  assert.match(stats, /robots.*noindex,nofollow/);
});
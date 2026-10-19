'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
for (const [slug,brand] of [
  ['bw-sport','BW SPORT ဘောလုံးဂျာနယ်'],
  ['ykz-family','YKZ FAMILY GROUP'],
  ['ko-thet-family','Ko Thet Family ဘောလုံးဂျာနယ်']
]) {
 test(slug + ' mobile page is independent and does not advertise missing APKs', () => {
   const html = fs.readFileSync(path.join(root,slug,'android','index.html'),'utf8');
   assert.ok(html.includes(brand));
   assert.ok(html.includes('href="../assets/logo.webp"'));
   assert.ok(html.includes('src="../assets/logo.webp"'));
   assert.ok(html.includes('href="../../brand-app-download.css"'));
   assert.equal((html.match(/href="\.\.\/"/g) || []).length,2);
   assert.match(html,/Android APK ဖိုင် မတင်ရသေးပါ/);
   assert.doesNotMatch(html,/\.apk["']/i);
   assert.doesNotMatch(html,/facebook|tiktok|telegram|social-links|follow/i);
   assert.match(html,/Home screen/i);
 });
}

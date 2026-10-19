'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const expected = [
  {slug:'bw-sport',brand:'BW SPORT ဘောလုံးဂျာနယ်',tag:'bw-sport-journal-v1.0.0',apk:'BW-Sport-Journal.apk',version:'1.0.0'},
  {slug:'ykz-family',brand:'YKZ FAMILY GROUP',tag:'ykz-soccer-tips-v1.1.0',apk:'YKZ-Soccer-Tips.apk',version:'1.1.0'},
  {slug:'ko-thet-family',brand:'Ko Thet Family ဘောလုံးဂျာနယ်',tag:'ko-thet-family-journal-v1.0.1',apk:'Ko-Thet-Family-Journal.apk',version:'1.0.1'}
];
for (const e of expected) {
 test(e.slug + ' has correct APK release and two platforms only', () => {
   const html=fs.readFileSync(path.join(root,e.slug,'android','index.html'),'utf8');
   const apkUrl='https://github.com/futurecode064-cyber/AI-Recap-GitHub/releases/download/'+e.tag+'/'+e.apk;
   assert.ok(html.includes(e.brand));
   assert.ok(html.includes('src="../assets/logo.webp"'));
   assert.ok(html.includes('href="../assets/logo.webp"'));
   assert.ok(html.includes('href="../../brand-app-download.css"'));
   assert.ok(html.includes('href="'+apkUrl+'"'));
   assert.ok(html.includes('Android APK Download · v'+e.version));
   assert.equal((html.match(/href="\.\.\/"/g)||[]).length,1,'iOS website link');
   assert.doesNotMatch(html,/Android APK ဖိုင် မတင်ရသေးပါ/);
   assert.doesNotMatch(html,/facebook|tiktok|telegram|social-links|follow/i);
   assert.ok(html.includes('iOS Website ဖွင့်ရန်'));
 });
}

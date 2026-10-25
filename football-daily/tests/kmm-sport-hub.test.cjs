"use strict";
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('KMM Sport Hub preserves YKZ sections but never clones football data',()=>{
 const home=read('kmm-sport-hub/index.html'),odds=read('kmm-sport-hub/odds.html');
 assert.match(home,/data-football-data-url="\.\.\/data\/today\.json"/);
 assert.match(odds,/data-football-odds-data-url="\.\.\/data\/odds\/"/);
 for(const file of ['../app.js','../canvas-image-kit.js','../daily-image-export.js','../brand-download-masthead.js'])assert.ok(home.includes(file),file);
 for(const file of ['../odds.js','../daily-image-export.js','../main-odds-dom-frame.js'])assert.ok(odds.includes(file),file);
 for(const id of ['matchList','dateTabs','filters','resultsDownloadBar','resultsPngBtn'])assert.ok(home.includes('id="'+id+'"'),id);
 for(const id of ['oddsList','oddsPngBtn'])assert.ok(odds.includes('id="'+id+'"'),id);
 assert.equal(fs.existsSync(path.join(root,'kmm-sport-hub/data')),false);
});
test('KMM uses exact owner-provided Viber relay and direct Telegram; both pages',()=>{
 for(const page of ['kmm-sport-hub/index.html','kmm-sport-hub/odds.html']){
  const h=read(page);
  assert.match(h,/href="https:\/\/msng\.link\/o\?\+959400900440=vi"/);
  assert.match(h,/href="https:\/\/t\.me\/kominmin888"/);
  assert.ok(h.includes('09400900440'));
  assert.ok(h.includes('Contact ဆက်သွယ်ရန်'));
  assert.ok(h.includes('href="#contact"'));
 }
});
test('KMM original logo is valid rounded 128px WebP',()=>{
 const img=fs.readFileSync(path.join(root,'kmm-sport-hub/assets/logo.webp'));
 assert.equal(img.toString('ascii',0,4),'RIFF');
 assert.equal(img.toString('ascii',8,12),'WEBP');
 assert.equal(img.readUInt32LE(4)+8,img.length);
 assert.ok(img.length>2000);
});
test('KMM true-red/gold stadium branding and exports stay independent of other sites',()=>{
 const css=read('kmm-sport-hub/brand.css');
 assert.ok(css.includes('.kmm-theme .match-card'));
 assert.ok(css.includes('.kmm-theme .odds-table'));
 assert.ok(css.includes('border-radius:50%'));
 const cfg=read('kmm-sport-hub/brand.js');
 assert.match(cfg,/footballBrandLogoUrl/);
 assert.match(cfg,/id:"kmm-sport-hub"/);
 const client=read('football-data-client.js');
 assert.ok(client.includes("'kmm-sport-hub':'kmm'"));
 const kit=read('canvas-image-kit.js'),card=read('card-export.js');
 assert.ok(kit.includes('kmmBranded'));
 assert.ok(card.includes('isKMM'));
 assert.ok(read('brand-download-masthead.js').includes('"kmm-sport-hub"'));
 assert.ok(read('daily-image-export.js').includes('brand==="kmm-sport-hub"'));
 for(const page of ['index.html','ykz-family/index.html','bw-sport/index.html','ko-thet-family/index.html']){
  assert.ok(!read(page).includes('kmm-theme'));
 }
});

test('KMM matchday redesign uses the locally hosted footballer artwork and original logo',()=>{
 const home=read('kmm-sport-hub/index.html'),odds=read('kmm-sport-hub/odds.html'),css=read('kmm-sport-hub/brand.css');
 assert.match(home,/class="kmm-stadium-banner"/);
 assert.match(home,/class="kmm-banner-logo" src="\.\/assets\/logo\.webp"/);
 assert.match(home,/<h1>KMM <span>အားကစား<\/span><br>ဂျာနယ်<\/h1>/);
 assert.match(css,/--kmm-red:#df0000/);
 assert.match(css,/--kmm-gold:#f3c75d/);
 assert.match(css,/football-gold-stadium\.webp/);
 assert.ok(fs.existsSync(path.join(root,'future-code-journal/assets/football-gold-stadium.webp')),'local stadium photograph exists');
 assert.match(css,/\.kmm-theme \.hero::before/);
 assert.match(css,/\.kmm-theme \.kmm-stadium-banner/);
 for(const html of [home,odds]){
  assert.match(html,/class="kmm-theme"/);
  assert.match(html,/kmm-red-gold-stadium-20261025/);
  assert.match(html,/content="#b40000"/);
 }
 assert.match(read('kmm-sport-hub/brand.js'),/gold:"#f3c65a"/);
 assert.match(read('brand-download-masthead.js'),/symbol:"KMM"/);
 assert.match(read('canvas-image-kit.js'),/kmmBranded\?\{bg:"#100705",head:"#980000"/);
 assert.match(read('daily-image-export.js'),/brand==="kmm-sport-hub".*accent:"#f3c65a"/);
 assert.match(read('card-export.js'),/isKMM\?"#b20000"/);
});

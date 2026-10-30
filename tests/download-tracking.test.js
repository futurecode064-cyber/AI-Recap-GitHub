'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'portal/apps/index.html'), 'utf8');
const tracker = fs.readFileSync(path.join(root, 'portal/apps/stats.js'), 'utf8');
const appKeys = ['solarquote','ai-studio','app-creator','myanmar-kyar','video-cutter','ai-astrology','el-nino','daily-money','medicine-reminder','kids-learning','safety-guide','goal-zone','mandalay-city-helper','language-academy','chinese-learning','thai-speaking','english-academy'];

const tags = [...html.matchAll(/<a\b(?=[^>]*class="download")[^>]*>/g)].map(m => m[0]);
assert.equal(tags.length, appKeys.length, 'all public APKs need analytics');
const anchors = tags.map(tag => {
  const key = tag.match(/data-app-key="([^"]+)"/)?.[1];
  assert.ok(key, 'missing stable app key: ' + tag);
  const href = tag.match(/href="([^"]+)"/)?.[1];
  assert.ok(href && (href.endsWith('.apk') || (((key === 'myanmar-kyar' && href === '../myanmar-kyar/') || (key === 'language-academy' && href === 'languages/')))), 'missing APK URL: ' + tag);
  return { href, dataset: {appKey:key}, handlers:{},
    addEventListener(name, fn){this.handlers[name] = fn;} };
});
assert.deepEqual(anchors.map(a=>a.dataset.appKey).sort(), appKeys.slice().sort());

const events = [];
let seq = 0;
vm.runInNewContext(tracker, {
  URL,
  location: {href:'https://example.test/AI-Recap-GitHub/apps/'},
  crypto: {randomUUID:()=> '00000000-0000-4000-8000-'+String(++seq).padStart(12,'0')},
  localStorage: {getItem:()=>null, setItem:()=>{}},
  document: {querySelectorAll:()=>anchors},
  fetch: async (url, options) => {events.push({url,options,body:JSON.parse(options.body)});return {ok:true};}
});
for(const anchor of anchors){
  if(!anchor.href.endsWith('.apk')){assert.equal(anchor.handlers.click,undefined,'navigation must not count as an APK download');continue;}
  assert.equal(typeof anchor.handlers.click,'function','untracked button: '+anchor.href);
  anchor.handlers.click();
}
assert.equal(events.filter(e=>e.body.p_event_kind==='page_view').length,1);
const clicks=events.filter(e=>e.body.p_event_kind==='download_click');
assert.equal(clicks.length, appKeys.length-1);
assert.deepEqual(clicks.map(e=>e.body.p_app_key).sort(),appKeys.filter(k=>k!=='myanmar-kyar').sort());
for(const click of clicks){
  assert.equal(click.body.p_site_key, 'future-code-apps');
  assert.equal(click.options.keepalive,true);
  assert.equal(click.options.method,'POST');
  assert.ok(click.url.endsWith('/rest/v1/rpc/fc_record_portfolio_event'));
}
console.log('PASS: 16 direct APK links tracked; Kyar navigation is not counted as an APK download.');
const adminHtml = fs.readFileSync(path.join(root, 'portal/apps/admin.html'), 'utf8');
const adminJs = fs.readFileSync(path.join(root, 'portal/apps/admin.js'), 'utf8');
const releaseSnapshot = JSON.parse(fs.readFileSync(path.join(root, 'portal/apps/github-releases-snapshot.json'), 'utf8'));
assert.ok(adminHtml.includes('siteSections'), 'website category statistics must render');
assert.ok(adminJs.includes('fc_portfolio_inventory_dashboard'), 'admin needs authenticated full portfolio inventory RPC');
assert.ok(adminHtml.includes('projectInventory'), 'dashboard must list source and draft projects');
assert.ok(adminJs.includes('trackingStatus'), 'untracked websites must not appear as verified zeros');
assert.ok(adminJs.includes('Game Play Sessions'), 'actual game plays must be distinct from website page views');
assert.ok(adminJs.includes('downloadUrl') && adminJs.includes('downloadHost'), 'each APK row should link back to its real release source');
assert.ok(adminJs.includes('https://api.github.com/repos/futurecode064-cyber/AI-Recap-GitHub/releases?per_page=100'),
  'public GitHub API must support up-to-date release counts');
assert.ok(adminJs.includes('releaseSnapshot') === false);
assert.ok(adminJs.includes('refreshReleaseCounts();'), 'dashboard must fetch release counts');
assert.equal(releaseSnapshot.releases.filter(x => x.siteKey === 'ykz-family').reduce((n,x)=>n+x.downloads,0), 3);
assert.equal(releaseSnapshot.releases.filter(x => x.siteKey === 'ko-thet-family').reduce((n,x)=>n+x.downloads,0), 1);
assert.equal(releaseSnapshot.releases.filter(x => x.siteKey === 'bw-sport').reduce((n,x)=>n+x.downloads,0), 0);
assert.equal(releaseSnapshot.releases.filter(x => x.appKey === 'chinese-learning').reduce((n,x)=>n+x.downloads,0), 7, 'Chinese historical release downloads');
assert.equal(releaseSnapshot.releases.filter(x => x.appKey === 'language-academy').reduce((n,x)=>n+x.downloads,0), 5, 'Language Academy historical release downloads');
assert.ok(adminJs.includes('Version အလိုက် · '+''), 'Chinese and Language versions must be expandable');
console.log('PASS: GitHub APK Release historical counts are displayed independently of tracked click events.');

const academyHtml = fs.readFileSync(path.join(root, 'portal/apps/languages/index.html'), 'utf8');
assert.match(academyHtml, /data-site-key="language-academy-web" data-app-key="language-academy"/);
const migration = fs.readFileSync(path.join(root, 'supabase/migrations/20261027_portfolio_language_site_download_tracking.sql'), 'utf8');
assert.match(migration, /'language-academy-web', 'language-academy'/);
console.log('PASS: Language Academy website views are linked to the APK app key.');

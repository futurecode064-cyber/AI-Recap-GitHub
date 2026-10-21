'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'portal/apps/index.html'), 'utf8');
const tracker = fs.readFileSync(path.join(root, 'portal/apps/stats.js'), 'utf8');
const appKeys = ['ai-studio','app-creator','myanmar-kyar','video-cutter','ai-astrology','el-nino','daily-money','medicine-reminder','kids-learning','safety-guide','goal-zone'];

const tags = [...html.matchAll(/<a\b(?=[^>]*class="download")[^>]*>/g)].map(m => m[0]);
assert.equal(tags.length, appKeys.length, 'all public APKs need analytics');
const anchors = tags.map(tag => {
  const key = tag.match(/data-app-key="([^"]+)"/)?.[1];
  assert.ok(key, 'missing stable app key: ' + tag);
  const href = tag.match(/href="([^"]+)"/)?.[1];
  assert.ok(href && (href.endsWith('.apk') || (key === 'myanmar-kyar' && href === '../myanmar-kyar/')), 'missing APK URL: ' + tag);
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
  assert.equal(click.options.keepalive,true);
  assert.equal(click.options.method,'POST');
  assert.ok(click.url.endsWith('/rest/v1/rpc/fc_record_download_event'));
}
console.log('PASS: 10 direct APK links tracked; Kyar navigation does not double-count its landing-page download.');
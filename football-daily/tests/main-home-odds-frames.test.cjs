'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'brand-odds-studio.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

test('Main homepage owns odds frame selector and ZIP, not another brand',()=>{
 assert.match(source,/section\.id='brandOddsStudio'/);
 assert.match(html,/#brandOddsStudio/);
 assert.match(html,/brand-odds-studio\.js\?v=20261020-home-frame-zip-v1/);
 assert.match(source,/document\.documentElement\.dataset\.footballBrandName/);
 assert.match(source,/\^\\\/(?:index\\\.html)?\$/);
 assert.match(source,/id="boAllZip"/);
 assert.match(source,/el\('boAllZip'\)\.onclick=runAllZip/);
 for(const brand of ['bw-sport','ykz-family','ko-thet-family','future-code-journal']){
   if(fs.existsSync(path.join(root,brand,'index.html'))){
    const page=fs.readFileSync(path.join(root,brand,'index.html'),'utf8');
    assert.doesNotMatch(page,/brand-odds-studio\.js/,brand+' does not load main selector');
   }
 }
});

test('Existing frame choices are preserved and uploaded JPG artwork is selectable',()=>{
 for(const id of ['ggoal','kmm','special','thuta','kotwat','colour'])
  assert.ok(source.includes("['"+id+"',"),'old '+id);
 const artwork=[
  'best-top.jpg','best-bottom.jpg','htet-top.jpg','htet-bottom.jpg',
  'bcf-frame.jpg','final-goal-frame.jpg','hyper-goal-frame.jpg',
  'team-pmm-frame.jpg','ymc-frame.jpg','khin-khin-htar-frame.jpg',
  'ko-chan-frame.jpg','ggoal-frame.jpg','kmm-frame.jpg',
  'special-one-frame.jpg','ko-tut-pi-frame.jpg','thuta-frame.jpg'
 ];
 for(const file of artwork){
  assert.ok(fs.statSync(path.join(root,'assets/table-odds-frames',file)).size>2000,file);
 }
 const unique=[...source.matchAll(/\['([a-z-]+-art)','/g)].map(x=>x[1]);
 assert.equal(unique.length,14);
 assert.equal(new Set(unique).size,14);
 assert.match(source,/full\.height\*artwork\.top/);
 assert.match(source,/full\.height\*artwork\.bottom/);
 assert.match(source,/assets\/table-odds-frames\//);
});

test('ZIP includes every frame, all chosen leagues, respects split choice and has a fallback link',()=>{
 assert.match(source,/async function runAllZip\(/);
 assert.match(source,/new window\.FutureCodeFrameZip\.Archive\(\)/);
 assert.match(source,/new Set\(\[\.\.\.el\('boLeagues'\)\.querySelectorAll\('input:checked'\)/);
 assert.match(source,/const list=rows\.filter\(m=>leagues\.has\(m\.league\)\)/);
 assert.match(source,/for\(const f of frames\)/);
 assert.match(source,/const blob=await draw\(groups\[i\],i\+1,groups\.length,f\)/);
 assert.match(source,/await archive\.add\('all-odds-frames-'/);
 assert.match(source,/link\.download='main-all-odds-frames-'/);
 assert.match(source,/el\('boOutput'\)\.append\(link\);link\.click\(\)/);
 assert.match(source,/Download မစခဲ့လျှင်/);
});

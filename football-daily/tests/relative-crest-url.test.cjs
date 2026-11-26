const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const fn=source.match(/function goodUrl\(url\)\{[^\n]+/)[0];
test('preview logo validation accepts same-origin asset paths for every brand',()=>{
 for(const route of ['/','/future-code-journal/','/goal-zone-english/','/ykz-family/','/bw-sport/','/ko-thet-family/','/kmm-sport-hub/']){
  const ctx={URL,document:{baseURI:'https://future-code-football-daily.pages.dev'+route}};
  vm.createContext(ctx);vm.runInContext(fn,ctx);
  assert.equal(ctx.goodUrl('/assets/team-logos/2026-11-26/101.png'),true);
  assert.equal(ctx.goodUrl('assets/team-logos/2026-11-26/101.png'),true);
  assert.equal(ctx.goodUrl('javascript:alert(1)'),false);
 }
});

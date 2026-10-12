const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
function read(p){return fs.readFileSync(path.join(root,p),'utf8')}
test('YKZ branded football entry and odds page load the ORIGINAL shared scripts and same live JSON data',()=>{
 const home=read('ykz-family/index.html'),odds=read('ykz-family/odds.html');
 assert.ok(home.includes('YKZ FAMILY GROUP'));
 assert.ok(home.includes('အတူရှေ့ဆက် YKZ'));
 assert.ok(home.includes('data-football-data-url="../data/today.json"'));
 assert.ok(odds.includes('data-football-odds-data-url="../data/odds/"'));
 for(const [file,html] of [['index',home],['odds',odds]]){
  assert.match(html,/<link[^>]+\.\/brand\.css/);
  assert.match(html,/\.\/brand\.js/);
  assert.match(html,/\.\/assets\/logo\.webp/);
  assert.ok(html.includes('../canvas-image-kit.js'));
  assert.ok(html.includes('../daily-image-export.js'));
 }
 assert.ok(home.includes('../app.js'));
 assert.ok(home.includes('../card-export.js'));
 assert.ok(odds.includes('../odds.js'));
 assert.equal(fs.existsSync(path.join(root,'ykz-family','data')),false,'Never duplicate report JSON');
});
test('YKZ logo contains a real WebP image from the uploaded badge',()=>{
 const im=fs.readFileSync(path.join(root,'ykz-family/assets/logo.webp'));
 assert.ok(im.length>1000);
 assert.equal(im.toString('ascii',0,4),'RIFF');
 assert.equal(im.toString('ascii',8,12),'WEBP');
 assert.equal(im.readUInt32LE(4)+8,im.length,'Valid RIFF bytes, no truncated logo');
});
test('YKZ true scarlet red and gold theme is isolated from the original football site',()=>{
 const css=read('ykz-family/brand.css');
 const config=read('ykz-family/brand.js');
 assert.ok(css.includes('.ykz-theme .match-card'));
 assert.ok(css.includes('.ykz-theme .vs-banner'));
 assert.ok(css.includes('.ykz-theme .odds-group'));
 assert.ok(css.includes('--ykz-red:#e00000'));
 assert.ok(css.includes('#d50000'));
 assert.ok(css.includes('linear-gradient(90deg,#bb0000,#590000)'));
 assert.ok(!css.includes('#c4223c')&&!css.includes('#bd2542'),'Old pink/magenta theme remains');
 assert.ok(!css.includes('#21152e')&&!css.includes('#3c132b'),'Old purple background remains');
 assert.ok(css.includes('#ffcf58'));
 assert.ok(config.includes('root.classList.add("ykz-theme")'));
 assert.ok(config.includes('footballBrandLogoUrl'));
 assert.ok(config.includes('slogan:"အတူရှေ့ဆက် YKZ"'));
 for(const path of ['ykz-family/index.html','ykz-family/odds.html']){
  const html=read(path);
  assert.ok(html.includes('အတူရှေ့ဆက် YKZ'),path+' missing correct slogan');
  assert.ok(!html.includes('>ရှေ့ဆက် YKZ<'),path+' retains old short slogan');
  assert.ok(html.includes('content="#d50000"'),path+' theme color is not scarlet');
 }
 const original=read('index.html');
 assert.equal(original.includes('ykz-theme'),false);
 assert.equal(original.includes('ykz-family'),false);
});
test('Shared Myanmar odds URL resolves to correct fixture snapshot for both brand and original',()=>{
 const source=read('odds.js');
 assert.ok(source.includes('dataset.footballOddsDataUrl'));
 const base='https://future-code-football-daily.pages.dev/';
 assert.equal(new URL('2026-10-12.json',new URL('./data/odds/',base+'odds.html')).href,
   base+'data/odds/2026-10-12.json');
 assert.equal(new URL('2026-10-12.json',new URL('../data/odds/',base+'ykz-family/odds.html')).href,
   base+'data/odds/2026-10-12.json');
});
test('YKZ full PNG gets brand colors, slogan, logo and brand-specific filenames; original root remains default',()=>{
 const kit=read('canvas-image-kit.js');
 const odds=read('daily-image-export.js');
 const preview=read('card-export.js');
 assert.ok(kit.includes('document.documentElement?.dataset?.footballBrandName==="YKZ FAMILY GROUP"'));
 assert.ok(kit.includes('အတူရှေ့ဆက် YKZ'));
 assert.ok(kit.includes('footballBrandLogoUrl'));
 assert.ok(kit.includes('အတူရှေ့ဆက် YKZ'));
 assert.ok(kit.includes('head:"#960000"'));
 assert.ok(preview.includes('isYKZ?"#990000"'));
 assert.ok(odds.includes('window.FutureCodeBrandConfig?.id||"future-code"'));
 assert.ok(odds.includes('brand+"-odds-"'));
 assert.ok(preview.includes('opts.brandLogoUrl'));
 assert.ok(preview.includes('isYKZ'));
});

const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
function boot(route='/future-code-journal/',missingBanner=false){
 const draws=[],texts=[],elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,{value:'none'});return elements.get(id)};
 const context=()=>({beginPath(){},roundRect(){},fill(){},stroke(){},fillRect(){},save(){},restore(){},drawImage(...args){draws.push(args)},createLinearGradient:()=>({addColorStop(){}}),ellipse(){},fillText(t){texts.push(String(t))},measureText:t=>({width:Array.from(String(t)).length*15})});
 const doc={documentElement:{dataset:{footballBrandName:'ဂိုးဇုံ အားကစား ဂျာနယ်',gzSection:'previewV4'}},head:{append(){}},getElementById:el,createElement:()=>({width:0,height:0,getContext:context}),fonts:{load:async()=>{},ready:Promise.resolve()},baseURI:'https://example.test'+route,readyState:'loading',addEventListener(){}};
 class Image{set src(value){this.url=value;this.naturalWidth=value.includes('goal-zone-preview-special-analysis')||value.includes('goal-zone-results-v2-correct-predictions')?2172:988;this.naturalHeight=value.includes('goal-zone-preview-special-analysis')||value.includes('goal-zone-results-v2-correct-predictions')?724:270;Promise.resolve().then(()=>missingBanner&&value.includes('goal-zone-preview-special-analysis')?this.onerror():this.onload());}}
 const win={},sandbox={window:win,document:doc,location:{pathname:route,origin:'https://example.test',search:''},Image,URL,URLSearchParams,Intl,setTimeout,clearTimeout,console};
 for(const file of ['main-preview-v4.js','main-results-v2.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox);
 return {win,draws,texts};
}
const m={fixtureId:'fixture',homeDisplay:'Home',awayDisplay:'Away',previewV2Selection:'Away',previewV2Summary:'The identical approved V2 paragraph.',dailyPreviewText:'Original long preview',status:'finished',finalScore:'1-2'};
test('Goal Zone reuses V4 editorial and adds its actual banner once at the original aspect ratio',async()=>{
 const {win,texts,draws}=boot(),api=win.FutureCodePreviewV4,plain=await api.render(m,{includeBrandBanner:false}),branded=await api.render(m);
 assert.equal(branded.width,1080);assert.equal(branded.height,plain.height+360);assert(texts.includes(m.previewV2Summary));
 assert.equal(await api.brandCanvas(branded),branded);
 assert(draws.some(args=>args[0]?.url?.includes("goal-zone-preview-special-analysis.png")),
  "Preview V4 must use the existing, approved preview PNG exactly");
 const resultOnly=boot();const result=await resultOnly.win.FutureCodeResultsV2.renderCanvas(m);
 const rawResult=await resultOnly.win.FutureCodeResultsV2.renderCanvas(m,{includeBrandBanner:false});
 assert.equal(result.height,rawResult.height+360);assert(resultOnly.texts.includes('1 - 2'));
 assert(resultOnly.draws.some(args=>args[0]?.url?.includes("goal-zone-results-v2-correct-predictions.png")),
  "Results V2 must use the existing, approved correct-predictions PNG");
 assert(!resultOnly.draws.some(args=>args[0]?.url?.includes("goal-zone-preview-special-analysis.png")),
  "Results V2 must not reuse the preview header");
});
test('missing Goal Zone banner fails explicitly; unrelated brands do not get these sections',async()=>{
 await assert.rejects(boot('/future-code-journal/',true).win.FutureCodePreviewV4.render(m),/Banner/);
 const other=boot('/bw-sport/');assert.equal(other.win.FutureCodePreviewV4,undefined);assert.equal(other.win.FutureCodeResultsV2,undefined);
});
test('Goal Zone navigation and ZIP expose both new formats without an old-layout fallback',()=>{
 const html=fs.readFileSync(path.join(root,'future-code-journal/index.html'),'utf8'),nav=fs.readFileSync(path.join(root,'future-code-journal/sections.js'),'utf8'),zip=fs.readFileSync(path.join(root,'future-code-journal/goal-zone-download-center.js'),'utf8');
 for(const key of ['previewV4','resultsV2']){
  assert(!html.includes('data-gz-section-link="'+key+'"'),"Public menu must hide "+key);
  assert(zip.includes('["'+key+'"'),"ZIP Download Center must retain "+key);
 }
 assert(html.includes('id="fcPreviewV4"'),"Keep V4 render source mounted for downloads");
 assert(nav.includes('query === "previewV4" || query === "resultsV2"'),"Old deep links must redirect to Download Center");
 const css=fs.readFileSync(path.join(root,'future-code-journal/v4-sections.css'),'utf8');
 assert(css.includes(':root.fcj-theme #fcPreviewV4')&&css.includes(':root.fcj-theme #fcResultsV2'));
 assert(!css.includes('display:block!important'),"Do not re-expose hidden sections");
 assert(zip.includes('!$("fcPreviewV4")'));assert(!zip.includes('id==="previewV4"&&!window'));
 assert(html.includes('../main-preview-v4.js'));assert(html.includes('../main-results-v2.js'));assert(zip.includes('includeBrandBanner:false'));
 assert.match(zip,/type==="previewV4"\|\|type==="resultsV2"\)throw originalError/);
});

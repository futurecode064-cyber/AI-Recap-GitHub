const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
function boot(route='/future-code-journal/',missingBanner=false){
 const draws=[],texts=[],elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,{value:'none'});return elements.get(id)};
 const context=()=>({beginPath(){},roundRect(){},fill(){},stroke(){},fillRect(){},save(){},restore(){},drawImage(...args){draws.push(args)},createLinearGradient:()=>({addColorStop(){}}),ellipse(){},fillText(t){texts.push(String(t))},measureText:t=>({width:Array.from(String(t)).length*15})});
 const doc={documentElement:{dataset:{footballBrandName:'ဂိုးဇုံ အားကစား ဂျာနယ်',gzSection:'previewV4'}},head:{append(){}},getElementById:el,createElement:()=>({width:0,height:0,getContext:context}),fonts:{load:async()=>{},ready:Promise.resolve()},baseURI:'https://example.test'+route,readyState:'loading',addEventListener(){}};
 class Image{set src(value){this.url=value;this.naturalWidth=988;this.naturalHeight=270;Promise.resolve().then(()=>missingBanner&&value.includes('goal-zone-download-banner')?this.onerror():this.onload());}}
 const win={},sandbox={window:win,document:doc,location:{pathname:route,origin:'https://example.test',search:''},Image,URL,URLSearchParams,Intl,setTimeout,clearTimeout,console};
 for(const file of ['main-preview-v4.js','main-results-v2.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox);
 return {win,draws,texts};
}
const m={fixtureId:'fixture',homeDisplay:'Home',awayDisplay:'Away',previewV2Selection:'Away',previewV2Summary:'The identical approved V2 paragraph.',dailyPreviewText:'Original long preview',status:'finished',finalScore:'1-2'};
test('Goal Zone reuses V4 editorial and adds its actual banner once at the original aspect ratio',async()=>{
 const {win,texts}=boot(),api=win.FutureCodePreviewV4,plain=await api.render(m,{includeBrandBanner:false}),branded=await api.render(m);
 assert.equal(branded.width,1080);assert.equal(branded.height,plain.height+Math.round(1080*270/988));assert(texts.includes(m.previewV2Summary));
 assert.equal(await api.brandCanvas(branded),branded);
 const result=await win.FutureCodeResultsV2.renderCanvas(m),rawResult=await win.FutureCodeResultsV2.renderCanvas(m,{includeBrandBanner:false});
 assert.equal(result.height,rawResult.height+Math.round(1080*270/988));assert(texts.includes('1 - 2'));
});
test('missing Goal Zone banner fails explicitly; unrelated brands do not get these sections',async()=>{
 await assert.rejects(boot('/future-code-journal/',true).win.FutureCodePreviewV4.render(m),/Banner/);
 const other=boot('/bw-sport/');assert.equal(other.win.FutureCodePreviewV4,undefined);assert.equal(other.win.FutureCodeResultsV2,undefined);
});
test('Goal Zone navigation and ZIP expose both new formats without an old-layout fallback',()=>{
 const html=fs.readFileSync(path.join(root,'future-code-journal/index.html'),'utf8'),nav=fs.readFileSync(path.join(root,'future-code-journal/sections.js'),'utf8'),zip=fs.readFileSync(path.join(root,'future-code-journal/goal-zone-download-center.js'),'utf8');
 for(const key of ['previewV4','resultsV2']){assert(html.includes('data-gz-section-link="'+key+'"'));assert(nav.includes('"'+key+'"'));assert(zip.includes('["'+key+'"'));}
 assert(html.includes('../main-preview-v4.js'));assert(html.includes('../main-results-v2.js'));assert(zip.includes('includeBrandBanner:false'));
 assert.match(zip,/type==="previewV4"\|\|type==="resultsV2"\)throw originalError/);
});

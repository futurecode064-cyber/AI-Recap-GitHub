'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function boot(failed=''){
 const requests=[],drawn=[];
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),measureText:s=>({width:String(s).length*6}),drawImage:image=>drawn.push(image?.src)}, {get:(o,k)=>o[k]||(()=>{})});
 class Image{set src(v){this._src=v;requests.push(v);this.naturalWidth=500;this.naturalHeight=500;queueMicrotask(()=>v.includes(failed)&&failed?this.onerror():this.onload());}get src(){return this._src;}}
 const document={baseURI:'https://future-code-football-daily.pages.dev/',fonts:{load:async()=>{}},createElement:()=>({getContext:()=>ctx,toBlob:cb=>cb(new Blob(['png'],{type:'image/png'}))})};
 const window={FutureCodeMainLogoAssets:{imageUrl:src=>src}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../main-ai-bulk-export.js'),'utf8'),{window,document,Image,URL,Blob,console,setTimeout,clearTimeout,queueMicrotask});
 return {api:window.FutureCodeAiBulkExport,requests,drawn};
}
const fixture={home:'Nottingham Forest',away:'Chelsea',league:'Premier League',homeCrestUrl:'/assets/team-logos/2026-11-27/393.png',awayCrestUrl:'assets/team-logos/2026-11-27/363.png',kickoff:'02:30'};
function options(){return {date:'2026-11-27',predict:()=>['2-1','1-0','1-1'],leagueLogo:()=>'/assets/league-logos/eng.1.png',teamLogo:(m,side)=>m[side+'CrestUrl']};}
test('AI posters load and draw root-relative and document-relative crests used by daily Frame Editor ZIP',async()=>{
 const {api,requests,drawn}=boot();const blob=await api.renderBlob(api.planSinglePage([fixture]),options());
 assert.equal(blob.type,'image/png');
 for(const p of ['assets/team-logos/2026-11-27/393.png','assets/team-logos/2026-11-27/363.png','assets/league-logos/eng.1.png']){
  const url='https://future-code-football-daily.pages.dev/'+p;assert(requests.includes(url),url+' requested');assert(drawn.includes(url),url+' drawn');
 }
});
test('an actual failed crest still rejects the AI poster instead of silently omitting the logo',async()=>{
 const {api}=boot('363.png');await assert.rejects(api.renderBlob(api.planSinglePage([fixture]),options()),/Chelsea away/);
});

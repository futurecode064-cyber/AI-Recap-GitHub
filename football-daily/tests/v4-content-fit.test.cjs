const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function renderer(){
 const rings=[],texts=[];
 const gradient=()=>({addColorStop(){}});
 const context=()=>({beginPath(){},roundRect(){},fill(){},stroke(){},fillRect(){},save(){},restore(){},drawImage(){},createLinearGradient:gradient,ellipse(...a){rings.push(a)},fillText(s){texts.push(String(s))},measureText:s=>({width:Array.from(String(s)).length*15})});
 const doc={getElementById:()=>({}),createElement:()=>({width:0,height:0,getContext:context}),fonts:{load:async()=>{},ready:Promise.resolve()},baseURI:'https://test/',readyState:'loading',addEventListener(){}};
 class MissingImage{set src(v){this.onerror?.();}}
 const win={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','main-preview-v4.js'),'utf8'),{window:win,document:doc,location:{pathname:'/',origin:'https://test/'},Image:MissingImage,URL,URLSearchParams,Intl,setTimeout,clearTimeout,console});
 return {api:win.FutureCodePreviewV4,rings,texts};
}
const match={fixtureId:'test',homeDisplay:'Home',awayDisplay:'Away',previewV2Selection:'Away',dailyPreviewText:'Original article',previewV2Summary:'A short original V2 paragraph.',status:'finished',finalScore:'1-2'};
test('poster height grows with the identical V2 paragraph rather than adding square whitespace',async()=>{
 const {api,texts}=renderer(),short=await api.render(match),long=await api.render({...match,previewV2Summary:'More original V2 editorial words. '.repeat(20)});
 assert.equal(short.width,1080);assert(long.height>short.height);assert(short.height<1080);
 assert(texts.includes(match.previewV2Summary));assert(!texts.includes('930'));
});
test('result score and selection use large red circles without adding form rows',async()=>{
 const {api,rings,texts}=renderer();await api.render(match,{result:true});
 assert.equal(texts.filter(t=>t==='1 - 2').length,1);assert(texts.includes('Away'));assert(!texts.includes('VS'));
 assert.equal(rings.length,4);assert(rings[0][2]>=150&&rings[0][3]>=76);assert(rings[2][2]>=210&&rings[2][3]>=43);
 const regular=renderer();await regular.api.render(match);assert.equal(regular.rings.length,0);assert(regular.texts.includes('VS'));
});

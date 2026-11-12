const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'native-image-save.js'),'utf8');
const brands=['ykz-family','bw-sport','ko-thet-family','kmm-sport-hub','future-code-journal','bet-city-family'];
function boot({brand='ykz-family',bridge='FCJournalNative',ua='Android; wv) FutureCodeJournalAndroid/1.0',failRead=false,throwSave=false}={}){
 const calls=[],fallback=[],elements=new Map();let errors=0;
 const native={save(...args){if(throwSave)throw Error('native failure');calls.push(args)},error(){errors++}};
 const window={};if(bridge)window[bridge]=native;
 const document={getElementById:id=>elements.get(id),createElement(){return {style:{},setAttribute(){},click(){fallback.push(this.download)},remove(){}}},body:{appendChild(e){elements.set(e.id,e)}}};
 class Reader{readAsDataURL(blob){if(failRead)return this.onerror();this.result='data:'+blob.type+';base64,iVBORw0KGgo=';this.onload();}}
 vm.runInNewContext(source,{window,document,location:{pathname:'/'+brand+'/'},navigator:{userAgent:ua},FileReader:Reader,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},setTimeout:()=>1,console});
 return {api:window.FutureCodeImageSave,window,native,calls,fallback,status:()=>elements.get('fcImageSaveStatus'),errors:()=>errors};
}
const png={type:'image/png',size:100};
for(const brand of brands)test(brand+' uses the released two-argument Gallery interface with unique safe names',async()=>{
 const x=boot({brand});const result=await x.api.saveBlob(png,'football-vs-football.png');await x.api.saveBlob(png,'football-vs-football.png');
 assert.equal(result.nativeImageSave,true);assert.equal(x.calls[0].length,2);assert.equal(x.calls[0][0],'data:image/png;base64,iVBORw0KGgo=');
 assert.match(x.calls[0][1],/^[A-Za-z0-9_-]+\.png$/);assert.notEqual(x.calls[0][1],x.calls[1][1]);assert(x.calls[0][1].length<=120);assert.equal(x.fallback.length,0);
});
test('legacy YKZNative keeps three arguments; newer bridge takes priority',async()=>{
 const old=boot({bridge:'YKZNative'});await old.api.saveBlob(png,'old.png');assert.equal(old.calls[0].length,3);assert.equal(old.calls[0][2],'image/png');
 const current=boot();current.window.YKZNative={save(){throw Error('Wrong bridge')}};await current.api.saveBlob(png,'new.png');assert.equal(current.calls.length,1);
});
test('Android Chrome retains browser download; late native bridges work without reload',async()=>{
 const browser=boot({bridge:null,ua:'Android Chrome/130'});await browser.api.saveBlob(png,'web.png');assert.deepEqual(browser.fallback,['web.png']);
 const late=boot({bridge:null});late.window.FCJournalNative=late.native;await late.api.saveBlob(png,'late.png');assert.equal(late.calls.length,1);
});
test('missing native bridge and failed encoding never claim Gallery success',async()=>{
 const absent=boot({bridge:null});await assert.rejects(absent.api.saveBlob(png,'missing.png'),/APK/);assert.equal(absent.fallback.length,0);
 for(const options of [{failRead:true},{throwSave:true}]){const x=boot(options);await assert.rejects(x.api.saveBlob(png,'fail.png'));assert.equal(x.calls.length,0);assert.equal(x.errors(),1);assert(x.status().textContent.includes('ပုံသိမ်းမရပါ'));}
});
test('invalid MIME and oversized image are rejected before Java invocation',async()=>{
 const x=boot();for(const blob of [{type:'application/zip',size:100},{type:'image/png',size:24000001},{type:'image/png',size:0}])await assert.rejects(x.api.saveBlob(blob,'bad.png'));
 assert.equal(x.calls.length,0);assert.equal(boot({brand:'unrelated'}).api,undefined);
});
test('every active football-app export page loads the common saver before the shared canvas module',()=>{
 let pages=0;for(const brand of brands)for(const file of fs.readdirSync(path.join(root,brand)).filter(f=>f.endsWith('.html'))){
  const html=fs.readFileSync(path.join(root,brand,file),'utf8');if(!html.includes('../canvas-image-kit.js'))continue;pages++;
  assert(html.indexOf('../native-image-save.js')<html.indexOf('../canvas-image-kit.js'),brand+'/'+file);assert(!html.includes('src="./native-image-save.js'));
 }assert(pages>=10);
 for(const file of ['canvas-image-kit.js','social-export.js','main-ai-score.js','future-code-journal/goal-zone-downloads.js','brand-preview-studio.js'])assert(fs.readFileSync(path.join(root,file),'utf8').includes('FutureCodeImageSave.saveBlob'),file);
});
test('Myanmar named previews keep distinct fixture identities in their PNG filenames',async()=>{
 const names=[],window={FutureCodeCanvasKit:{download:async(c,name)=>names.push(name)},FutureCodeFramePreview:{render:async()=>({width:1200,height:1400})}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'card-export.js'),'utf8'),{window,document:{documentElement:{dataset:{}}},console});
 for(const id of ['fc-20261112-01','fc-20261112-02'])await window.FutureCodeCardExport.save({fixtureId:id,home:'တူရကီ',away:'ဘယ်လ်ဂျီယံ'});
 assert.deepEqual(names,['preview-fc-20261112-01.png','preview-fc-20261112-02.png']);
});

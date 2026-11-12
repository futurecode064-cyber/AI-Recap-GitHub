const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','ykz-family','native-image-save.js'),'utf8');
function boot({bridge='FCJournalNative',ua='Android; wv) FutureCodeJournalAndroid/1.0',failRead=false,throwSave=false}={}){
 const calls=[],fallback=[],elements=new Map();let prepared=0,errors=0;
 const canvas={toBlob(cb){cb({size:100,type:'image/png'})}};
 const kit={download:async(...a)=>fallback.push(a),prepareBrandDownload:async c=>{prepared++;return c;}};
 const native={save(...args){if(throwSave)throw Error('bridge failure');calls.push(args)},error(){errors++;}};
 const window={FutureCodeCanvasKit:kit};if(bridge)window[bridge]=native;
 const document={readyState:'complete',getElementById:id=>elements.get(id),createElement(){return {style:{},setAttribute(){}}},body:{appendChild(e){elements.set(e.id,e)}}};
 class FileReader{readAsDataURL(){if(failRead)return this.onerror();this.result='data:image/png;base64,iVBORw0KGgo=';this.onload();}}
 vm.runInNewContext(source,{window,document,navigator:{userAgent:ua},FileReader,setTimeout,clearTimeout,console});
 return {window,kit,native,calls,fallback,canvas,status:()=>elements.get('ykzImageSaveStatus'),prepared:()=>prepared,errors:()=>errors};
}
test('released FCJournalNative receives PNG bytes and exactly its two Java arguments',async()=>{
 const x=boot(),result=await x.kit.download(x.canvas,'YKZ-match.png');
 assert.equal(result.nativeImageSave,true);assert.equal(x.calls.length,1);assert.equal(x.calls[0].length,2);
 assert.equal(x.calls[0][0],'data:image/png;base64,iVBORw0KGgo=');assert.equal(x.calls[0][1],'YKZ-match.png');
 assert.equal(x.fallback.length,0);assert.equal(x.prepared(),1);assert(x.status().textContent.includes('သိမ်းဆည်းရန်'));
});
test('legacy YKZNative keeps its three-argument signature',async()=>{const x=boot({bridge:'YKZNative'});await x.kit.download(x.canvas,'legacy.png');assert.equal(x.calls[0].length,3);assert.equal(x.calls[0][2],'image/png');});
test('ordinary Android Chrome retains the existing browser download',async()=>{const x=boot({bridge:null,ua:'Android Chrome/130'});await x.kit.download(x.canvas,'web.png');assert.equal(x.fallback.length,1);assert.equal(x.prepared(),0);});
test('late injected journal bridge is resolved when the user saves',async()=>{const x=boot({bridge:null});x.window.FCJournalNative=x.native;await x.kit.download(x.canvas,'late.png');assert.equal(x.calls.length,1);});
test('a WebView without a bridge reports failure instead of claiming a download started',async()=>{const x=boot({bridge:null});await assert.rejects(x.kit.download(x.canvas,'missing.png'),/APK/);assert.equal(x.fallback.length,0);assert(x.status().textContent.includes('မချိတ်ဆက်'))});
test('encoding and bridge failures reject the operation without a false success',async()=>{
 for(const options of [{failRead:true},{throwSave:true}]){const x=boot(options);await assert.rejects(x.kit.download(x.canvas,'failed.png'));assert.equal(x.calls.length,0);assert.equal(x.errors(),1);assert(x.status().textContent.includes('ပုံသိမ်းမရပါ'));}
});
test('invalid or oversized PNG cannot enter the Java interface',async()=>{const x=boot();await assert.rejects(x.kit.download({toBlob:cb=>cb({size:24000001})},'huge.png'));assert.equal(x.calls.length,0);});

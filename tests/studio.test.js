'use strict';
// No network or paid generation. DOM and media fixtures exercise real controller code.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'../training-app/assets');
let passed=0;
async function test(name,fn){await fn();console.log('PASS '+name);passed++}
class El {
 constructor(tag='div',a={}){this.tagName=tag.toUpperCase();this.type=a.type||'';this.id=a.id||'';this.min=a.min||'';this.max=a.max||'';this._value=a.value;this.checked='checked' in a;this.disabled='disabled' in a;this.children=[];this.listeners={};this.dataset={};this.textContent='';this.style={};this.duration=20;this.readyState=4;this.videoWidth=640;this.videoHeight=360;this.paused=true;this.currentTime=0;this.playbackRate=1;this.classList={add(){},remove(){},toggle(){}}}
 get options(){return this.children.filter(x=>x.tagName==='OPTION')}
 get value(){return String(this._value??this.options.find(o=>o.selected)?.value??this.options[0]?.value??'')}
 set value(v){this._value=v}
 append(...x){this.children.push(...x)}
 replaceChildren(...x){this.children=x;if(this.tagName==='SELECT')this._value=undefined}
 setAttribute(k,v){this[k]=v}
 addEventListener(n,fn){(this.listeners[n]??=[]).push(fn)}
 removeEventListener(n,fn){this.listeners[n]=(this.listeners[n]||[]).filter(x=>x!==fn)}
 querySelectorAll(tag){return this.children.flatMap(x=>x instanceof El?[...(x.tagName===tag.toUpperCase()?[x]:[]),...x.querySelectorAll(tag)]:[])}
 scrollIntoView(){} focus(){} select(){} remove(){}
 pause(){this.paused=true}
 async play(){this.paused=false}
 click(){return this.onclick?.()}
 getContext(){return {canvas:this,save(){},restore(){},fillRect(){},translate(){},rotate(){},scale(){},drawImage(){},fillText(){},strokeText(){},measureText:t=>({width:Array.from(t).length*10})}}
}
function attributes(t){const a={};for(const m of t.matchAll(/([\w-]+)(?:="([^"]*)")?/g))a[m[1]]=m[2]??'';return a}
function context(page='media-editor',query=''){
 const html=fs.readFileSync(path.join(ROOT,'sections',page+'.html'),'utf8'),els={};
 for(const m of html.matchAll(/<(input|select|textarea|video|audio|canvas|button|div|section|p|span|progress|a|h1|label)\b([^>]*)>/g)){
  const a=attributes(m[2]);if(!a.id)continue;const e=new El(m[1],a);els[a.id]=e;
  if(m[1]==='select'){const end=html.indexOf('</select>',m.index),body=html.slice(m.index+m[0].length,end);for(const q of body.matchAll(/<option([^>]*)>([^<]*)<\/option>/g)){const oa=attributes(q[1]);const o=new El('option',oa);o.value=oa.value??q[2];o.selected='selected' in oa;e.append(o)}}
  if(m[1]==='textarea')e.value=html.slice(m.index+m[0].length,html.indexOf('</textarea>',m.index));
 }
 class Reader {readAsDataURL(b){b.arrayBuffer().then(a=>{this.result='data:'+b.type+';base64,'+Buffer.from(a).toString('base64');this.onload()}).catch(e=>this.onerror(e))}}
 const doc={getElementById:id=>els[id],createElement:t=>new El(t),createTextNode:t=>t,activeElement:null,body:new El('body'),querySelectorAll:q=>q.startsWith('[data-')?[]:Object.values(els).filter(e=>q.split(',').includes(e.tagName.toLowerCase())),fonts:{ready:Promise.resolve()}};
 const c={document:doc,navigator:{clipboard:{writeText:async()=>{}}},location:{search:query,href:''},URL,URLSearchParams,Blob,File,FileReader:Reader,AbortController,DOMException,Uint8Array,DataView,ArrayBuffer,Intl,JSON,Math,Date,Number,String,performance,setTimeout,clearTimeout,requestAnimationFrame:()=>1,cancelAnimationFrame(){},atob,btoa,confirm:()=>true,console};
 c.window=c;c.fetch=async()=>{throw Error('Unexpected network call')};vm.createContext(c);
 c.load=name=>vm.runInContext(fs.readFileSync(path.join(ROOT,'studio',name+'.js'),'utf8'),c);
 c.els=els;c.load('shared');return c;
}
function localStore(c){const records=new Map();c.FC.store=async(action,table,key,value)=>{const k=table+':'+key;if(action==='get')return records.get(k);if(action==='all')return [...records].filter(([n])=>n.startsWith(table+':')).map(([,v])=>v);if(action==='put')records.set(k,value);if(action==='delete')records.delete(k);if(action==='clear')for(const n of records.keys())if(n.startsWith(table+':'))records.delete(n)};return records}
const apiResponse=j=>({ok:true,status:200,json:async()=>j});
async function main(){
 await test('REST validation, quota errors and no automatic generation retry',async()=>{
  const c=context();let calls=0;c.fetch=async(u,o)=>{calls++;assert.equal(o.headers['x-goog-api-key'],'example-key');assert.equal(o.method,'POST');return {ok:false,status:429,json:async()=>({error:{message:'Quota exhausted'}})}};
  await assert.rejects(c.FC.api('','models/x'),/API Key/);await assert.rejects(c.FC.api('example-key','../x'),/resource/);
  await assert.rejects(c.FC.api('example-key','models/x:generateContent',{}),/HTTP 429/);assert.equal(calls,1);
  c.fetch=async()=>({ok:true,status:204,json:async()=>{throw Error('empty')}});assert.equal(JSON.stringify(await c.FC.api('k','files/x',null,{method:'DELETE'})),'{}');
 });
 await test('Native saving transfers exact chunk bytes and cancels failures',async()=>{
  const c=context();const source=new Blob([Buffer.alloc(900000,137)],{type:'video/webm'}),chunks=[];let done=0,cancelled=0;
  c.FutureCodeDownloads={beginSave:()=> 'save-id',appendSave:(id,b)=>{assert.equal(id,'save-id');chunks.push(Buffer.from(b,'base64'));return true},finishSave:()=>{done++;return true},cancelSave:()=>{cancelled++}};
  await c.FC.save(source,'result.webm');assert.equal(chunks.length,3);assert.equal(Buffer.concat(chunks).length,900000);assert.ok(Buffer.concat(chunks).every(b=>b===137));assert.equal(done,1);
  c.FutureCodeDownloads.appendSave=()=>false;await assert.rejects(c.FC.save(source,'bad.webm'));assert.equal(cancelled,1);
 });
 await test('WAV wrapping and current/legacy voice request schemas',async()=>{
  const c=context(),bytes=new Uint8Array([0,0,1,0]);const raw=await c.FC.audioWav(bytes).arrayBuffer();assert.equal(raw.byteLength,48);assert.equal(Buffer.from(raw).subarray(0,4).toString(),'RIFF');assert.equal(new DataView(raw).getUint32(24,true),24000);assert.equal(c.FC.audioWav(new Uint8Array(raw)).size,48);
  let body;c.fetch=async(u,o)=>{body=JSON.parse(o.body);return apiResponse({candidates:[{content:{parts:[{inlineData:{mimeType:'audio/L16;rate=24000',data:Buffer.from(bytes).toString('base64')}}]}}]})};
  await c.FC.voice('key','gemini-3.8-flash-tts','မင်္ဂလာပါ','Kore','Calm');assert.equal(body.generationConfig.speechConfig.voiceConfig.voice,'Kore');assert.equal(body.contents[0].parts[0].speech_metadata.style,'Calm');
  await c.FC.voice('key','gemini-2.5-flash-preview-tts','Hi','Kore','Calm');assert.equal(body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName,'Kore');
 });
 await test('Model listing follows pagination and filters generation models',async()=>{
  const c=context();let n=0;c.fetch=async()=>apiResponse(++n===1?{models:[{name:'models/gemini-2.5-flash',supportedGenerationMethods:['generateContent']}],nextPageToken:'next'}:{models:[{name:'models/gemini-3.8-flash-tts'}]});await c.FC.models('k',[['model','text'],['voiceModel','voice']]);assert.equal(n,2);assert.equal(c.els.model.value,'gemini-2.5-flash');assert.equal(c.els.voiceModel.value,'gemini-3.8-flash-tts');
 });
 await test('Large video resumable upload polls and deletes the temporary file',async()=>{
  const c=context();c.FC.sleep=async()=>{};let n=0,deleted=false;
  c.fetch=async(u,o)=>{n++;if(n===1)return {ok:true,headers:{get:()=> 'https://generativelanguage.googleapis.com/upload/fixture'}};if(n===2)return apiResponse({file:{name:'files/fixture',uri:'https://generativelanguage.googleapis.com/v1beta/files/fixture',state:'ACTIVE',mimeType:'video/mp4'}});if(o.method==='DELETE'){deleted=true;return {ok:true,json:async()=>{throw Error('204')}}}throw Error('Unexpected upload poll')};
  const file=new File([Buffer.alloc(13*1048576)],'clip.mp4',{type:'video/mp4'}),x=await c.FC.videoInput('k',file);assert.equal(x.part.fileData.mimeType,'video/mp4');await x.cleanup();assert.ok(deleted);
 });
 await test('Image editing requires source and changes; generation keeps detailed brief',async()=>{
  const c=context('image-studio');localStore(c);c.FC.imagePart=async()=>({inlineData:{mimeType:'image/png',data:'AA=='}});let payload,saved;
  c.FC.api=async(k,p,b)=>{payload=b;return {candidates:[{content:{parts:[{inlineData:{mimeType:'image/png',data:'AA=='}}]}}]}};
  c.FC.save=async(b)=>{saved=JSON.parse(await b.text());return 'saved'};c.load('image');
  c.els.mode.value='edit';c.els.changes.value='Change background to blue';c.els.key.value='key';await c.els.generate.onclick();assert.equal(payload,undefined);
  await c.els.imageFile.onchange({target:{files:[new File(['a'],'portrait.png',{type:'image/png'})],value:'a'}});
  c.els.preserve.value='Preserve face';c.els.buildPrompt.onclick();await c.els.generate.onclick();assert.match(payload.contents[0].parts[0].text,/Change background to blue/);assert.match(payload.contents[0].parts[0].text,/Preserve face/);assert.equal(payload.contents[0].parts.at(-1).inlineData.mimeType,'image/png');
  c.els.changes.value='Change hat';await c.els.saveBrief.onclick();assert.equal(saved.brief.changes,'Change hat');assert.ok(!JSON.stringify(saved).includes('"key"'));
 });
 await test('Veo references use exact image schema and resume polls without generation',async()=>{
  const c=context('video-maker');localStore(c);const posts=[];c.FC.sleep=async()=>{};c.FC.imagePart=async()=>({inlineData:{mimeType:'image/png',data:'AA=='}});c.FC.api=async(k,p,b)=>{if(b){posts.push(b);return {name:'models/veo-3.1-generate-preview/operations/test-1'}}return {done:true,response:{generateVideoResponse:{generatedSamples:[{video:{uri:'https://generativelanguage.googleapis.com/v1beta/files/movie'}}]}}}};
  c.fetch=async()=>({ok:true,blob:async()=>new Blob(['video'],{type:'video/mp4'})});c.load('video');await Promise.resolve();
  c.els.key.value='key';c.els.mode.value='references';c.els.model.value='veo-3.1-generate-preview';c.els.clipDuration.value='8';c.els.references.files=[new File(['x'],'ref.png',{type:'image/png'})];c.els.videoPrompt.value='A cinematic shot';await c.els.generate.onclick();assert.equal(posts.length,1);assert.equal(posts[0].instances[0].referenceImages[0].image.inlineData.mimeType,'image/png');assert.equal(posts[0].parameters.durationSeconds,8);await c.els.resume.onclick();assert.equal(posts.length,1);
 });
 await test('Uploaded video handoff preserves edit instructions',async()=>{
  const c=context('video-maker');localStore(c);let details;c.FC.handoff=async(b,d)=>details=d;c.load('video');c.els.editFile.files=[new File(['v'],'own.mp4',{type:'video/mp4'})];c.els.editInstructions.value='Trim intro and add caption';await c.els.openEditor.onclick();assert.equal(details.instructions,'Trim intro and add caption');
 });
 await test('Final preview edits, invalid timestamps, undo/redo and subtitle timing',async()=>{
  const c=context();localStore(c);c.FCRender={draw(){},seek:async()=>{}};c.FC.metadata=async()=>{};let saved;c.FC.save=async(b)=>{saved=await b.text();return 'saved'};c.load('editor');await Promise.resolve();
  c.els.fullScript.value='ပထမ Scene\nဒုတိယ Scene';c.els.applyScript.onclick();assert.equal(c.FCEditor.getScenes().length,2);
  c.els.editFinal.onclick();c.els.finalStart.value='0';c.els.finalEnd.value='6';c.els.finalNarration.value='Edited narration';c.els.finalCaption.value='New caption';c.els.finalSpeed.value='2';c.els.applyFinalEdit.onclick();assert.equal(c.FCEditor.getScenes()[0].text,'Edited narration');
  c.els.finalEnd.value='-1';c.els.applyFinalEdit.onclick();assert.equal(c.FCEditor.getScenes()[0].end,6);
  c.els.undo.onclick();assert.notEqual(c.FCEditor.getScenes()[0].text,'Edited narration');c.els.redo.onclick();assert.equal(c.FCEditor.getScenes()[0].text,'Edited narration');
  await c.els.exportSrt.onclick();assert.match(saved,/00:00:00,000 --> 00:00:03,000\nNew caption/);assert.match(saved,/00:00:03,000 --> 00:00:13,000/);
  const project={schema:'future-code-video-v7',scenes:[{start:0,end:3,text:'Valid'}],options:{sourceVolume:999,font:-100}};await c.els.projectFile.onchange({target:{files:[new File([JSON.stringify(project)],'project.json')],value:'a'}});assert.equal(c.FCEditor.getOptions().sourceVolume,100);assert.ok(c.FCEditor.getOptions().font>=1);
 });
 await test('Legacy v6 project milliseconds import to seconds',async()=>{
  const c=context();localStore(c);c.FCRender={draw(){}};c.load('editor');await Promise.resolve();await c.els.projectFile.onchange({target:{files:[new File([JSON.stringify({schema:'future-code-recap-v6',scenes:[{start:1000,end:6000,text:'Legacy'}]})],'v6.json')],value:'a'}});assert.equal(c.FCEditor.getScenes()[0].start,1);assert.equal(c.FCEditor.getScenes()[0].end,6);
 });
 await test('Renderer exports twice, mixes muted voice correctly and cleans cancellation',async()=>{
  const c=context();let mediaSources=0;const audioContexts=[],tracks=[];
  class AudioNode {constructor(){this.gain={value:1};this.connections=[]}connect(n){this.connections.push(n)}disconnect(){this.connections=[]}start(){}stop(){}}
  class AudioFixture {
   constructor(){this.state='running';this.destination=new AudioNode();this.gains=[];audioContexts.push(this)}
   async resume(){}createMediaElementSource(){mediaSources++;return new AudioNode()}
   createGain(){const n=new AudioNode();this.gains.push(n);return n}
   createMediaStreamDestination(){return {stream:{getAudioTracks:()=>[{stop(){}}]}}}
   createBufferSource(){return new AudioNode()}
   async decodeAudioData(){return {duration:.5}}
  }
  class Recorder {
   static isTypeSupported(t){return t==='video/webm;codecs=vp8,opus'}
   constructor(s,o){this.state='inactive';this.mimeType=o.mimeType}
   start(){this.state='recording'}pause(){this.state='paused'}resume(){this.state='recording'}
   stop(){if(this.state==='inactive')return;this.state='inactive';this.ondataavailable?.({data:new Blob(['encoded-fixture'],{type:this.mimeType})});this.onstop?.()}
  }
  c.AudioContext=AudioFixture;c.MediaRecorder=Recorder;c.HTMLCanvasElement=class{};
  const capture=()=>{const t={stopped:false,stop(){this.stopped=true}};tracks.push(t);return {addTrack(){},getTracks:()=>[t]}};
  c.HTMLCanvasElement.prototype.captureStream=capture;
  const create=c.document.createElement;c.document.createElement=t=>{const e=create(t);if(t==='canvas')e.captureStream=capture;return e};
  const video=c.els.sourcePlayer;video.duration=.6;let time=0;
  Object.defineProperty(video,'currentTime',{get:()=>time,set:n=>{time=n;queueMicrotask(()=>video.listeners.seeked?.slice().forEach(f=>f()))}});
  c.FC.sleep=async()=>{if(!video.paused)video.currentTime=Math.min(video.duration,video.currentTime+.05*video.playbackRate)};
  c.load('renderer');const scenes=[{id:'one',start:0,end:.6,speed:1,volume:50,caption:'မြန်မာစာ'}];
  const options={ratio:'16:9',resolution:360,sourceVolume:100,voiceVolume:0,alignVoice:true,speed:1,fit:'fit',brightness:100,contrast:100,saturation:100,font:4,captions:true,captionColor:'#ffffff',captionPosition:'bottom'};
  for(let i=0;i<2;i++){const result=await c.FCRender.render(video,scenes,options,{voiceById:{one:new Blob(['voice'])}});assert.equal(result.extension,'webm');assert.equal(result.duration,.5);assert.ok(result.blob.size>0)}
  assert.equal(mediaSources,1);assert.ok(audioContexts[0].gains.some(n=>n.gain.value===0));assert.ok(tracks.every(t=>t.stopped));
  const controller=new AbortController();c.FC.sleep=async()=>controller.abort();
  await assert.rejects(c.FCRender.render(video,scenes,options,{signal:controller.signal}),e=>e.name==='AbortError');assert.ok(tracks.every(t=>t.stopped));assert.ok(video.paused);
 });
 await test('Renderer rejects missing device codec and wraps Myanmar captions',async()=>{
  const c=context();c.HTMLCanvasElement=class{};c.load('renderer');await assert.rejects(c.FCRender.render({},[],{}),/WebView/);const lines=c.FCRender.lines({measureText:t=>({width:[...t].length*8})},'မင်္ဂလာပါ မြန်မာစာ',40);assert.ok(lines.length>1);assert.equal(lines.join(''),'မင်္ဂလာပါ မြန်မာစာ');
 });
 console.log('All '+passed+' studio regression groups passed. DOM/media fixtures are simulated; phone/API acceptance tests remain.');
}
main().catch(e=>{console.error(e);process.exitCode=1});

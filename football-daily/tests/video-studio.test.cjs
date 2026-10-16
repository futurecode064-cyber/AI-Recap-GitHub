"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const root=path.join(__dirname,"..");
const script=fs.readFileSync(path.join(root,"video-studio.js"),"utf8");
function studio(){
 const window={},document={getElementById:()=>null};
 const fakeMedia={isTypeSupported:(value)=>value==="video/webm;codecs=\"vp8\""};
 vm.runInNewContext(script,{window,document,Intl,Date,MediaRecorder:fakeMedia,URL});
 return window.FutureCodeVideoStudio;
}
function context(){return {font:"",measureText:txt=>({width:[...String(txt)].length*19})}}
test("Video Studio is loaded on ORIGINAL main only; no branded website entry modified",()=>{
 const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
 assert.ok(html.includes('id="fcVideoStudio"'));
 for(const id of ["fcVideoMode","fcVideoLeague","fcVideoQuality","fcVideoPace","fcVideoPreview","fcVideoDownload","fcVideoStop","fcVideoCanvas"]){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.ok(html.includes("video-studio.js?v=20261016-video2"));
 assert.ok(html.includes("video-studio.css?v=20261016-video2"));
 assert.ok(!html.includes("content-protection.js"),"Main-page copying stays enabled");
 for(const site of ["ykz-family","bw-sport","ko-thet-family","myanmar-football"]){
  const branded=fs.readFileSync(path.join(root,site,"index.html"),"utf8");
  assert.ok(!branded.includes("video-studio.js"),site+" video functionality isolated");
  assert.ok(!branded.includes('id="fcVideoStudio"'));
 }
});
test("Only verified yesterday final scores become results scenes; no predicted score can appear",()=>{
 const api=studio();
 const list=[
  {home:"A",away:"B",status:"finished",finalScore:"2-0"},
  {home:"C",away:"D",status:"scheduled",finalScore:"7-2"},
  {home:"E",away:"F",status:"finished",finalScore:"TBD"},
  {home:"G",away:"H",status:"live",finalScore:"1-0"}
 ];
 const scenes=api.buildScenes("results",list,context());
 assert.equal(scenes.length,1);
 assert.equal(scenes[0].match.home,"A");
 assert.equal(scenes[0].kind,"result");
});
test("One complete preview scene per match, no article text lost or page overflow",()=>{
 const api=studio();
 const full=Array.from({length:32},(_,i)=>"အိမ်ရှင်အသင်းကစားပုံ"+i+" နှင့် ဧည့်သည်အသင်းသုံးသပ်ချက်။").join(" ");
 const scenes=api.buildScenes("previews",[{home:"A",away:"B",dailyPreviewText:full}],context());
 assert.equal(scenes.length,1);
 const s=scenes[0];assert.equal(s.kind,"preview");
 assert.equal(s.lines.join("").replace(/\s+/g,""),full.replace(/\s+/g,""));
 assert.ok(s.lines.length*s.lineHeight<=928);
 assert.ok(s.seconds>=16);
 assert.ok(!script.includes("previewOverview")&&!script.includes("previewText"));
});
test("Odds video is grouped by league, optional league filter; no fabricated results",()=>{
 const api=studio(),matches=[
  {league:"Serie A",home:"A",away:"B",bodyOdds:"-5",goalTotalOdds:"3-60",pdfLastColumn:"2-1"},
  {league:"Serie A",home:"C",away:"D",bodyOdds:"+50"},
  {league:"La Liga",home:"E",away:"F",bodyOdds:"-25"}
 ];
 const scenes=api.buildScenes("odds",matches,context());
 assert.deepEqual(Array.from(scenes,s=>s.kind),["odds","odds","odds"]);
 const filtered=api.buildScenes("odds",matches,context(),{league:"La Liga"});
 assert.equal(filtered.length,1);
 assert.equal(filtered[0].match.home,"E");
});
test("Video export supports MP4 only if MediaRecorder allows it; otherwise WebM",()=>{
 assert.equal(studio().chooseMime(),'video/webm;codecs="vp8"');
 assert.ok(script.includes("canvas.captureStream(30)"));
 assert.ok(script.includes("new MediaRecorder(stream,options)"));
 assert.ok(script.includes("recorder.ondataavailable"));
 assert.ok(script.includes("if(cancel){message("));
 assert.ok(script.includes("video/mp4")&&script.includes("video/webm"));
});

test("Multiple leagues and individual matches can be excluded for BOTH odds and previews",()=>{
 const api=studio(),matches=[
  {league:"Serie A",home:"A",away:"B",dailyPreviewText:"တစ်"},
  {league:"Serie A",home:"C",away:"D",dailyPreviewText:"နှစ်"},
  {league:"La Liga",home:"E",away:"F",dailyPreviewText:"သုံး"},
  {league:"Ligue 1",home:"G",away:"H",dailyPreviewText:"လေး"}
 ];
 for(const mode of ["odds","previews"]){
  const scenes=api.buildScenes(mode,matches,context(),{leagues:["Serie A","La Liga"],excluded:[api.matchKey(matches[1])]});
  assert.deepEqual(Array.from(scenes,s=>s.match.home),["A","E"]);
  assert.equal(api.buildScenes(mode,matches,context(),{leagues:[]}).length,0);
 }
 assert.ok(!script.includes("ခန့်မှန်းချက်သည်"));
});
test("Ten real transition implementations render through the canvas pipeline",()=>{
 const api=studio(),operations=[];
 const ctx=new Proxy(context(),{get:(target,key)=>{
  if(key in target)return target[key];
  if(key==="createLinearGradient"||key==="createRadialGradient")return ()=>({addColorStop(){}});
  return (...args)=>operations.push([key,...args]);
 }});
 const scenes=api.buildScenes("odds",[{home:"A",away:"B"},{home:"C",away:"D"}],ctx);
 const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
 assert.equal(Object.keys(api.TRANSITIONS).length,10);
 const signatures=[];
 for(const effect of Object.keys(api.TRANSITIONS)){
  assert.ok(html.includes('value="'+effect+'"'));
  operations.length=0;
  assert.equal(api.frame(ctx,scenes,scenes[0].seconds-.4,"2026-10-16",effect),0);
  signatures.push(JSON.stringify(operations));
  assert.equal(operations.filter(op=>op[0]==="save").length,operations.filter(op=>op[0]==="restore").length);
 }
 // Four movements, four reveals and zoom each use distinct transforms or clipping.
 assert.ok(new Set(signatures).size>=9);
});

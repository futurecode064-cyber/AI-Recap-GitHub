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
 assert.ok(html.includes("video-studio.js?v=20261016-video1"));
 assert.ok(html.includes("video-studio.css?v=20261016-video1"));
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
test("Full preview commentary spans multiple scenes without clipping or omitting Burmese content",()=>{
 const api=studio();
 const full=Array.from({length:32},(_,i)=>"အိမ်ရှင်အသင်းကစားပုံ"+i+" နှင့် ဧည့်သည်အသင်းသုံးသပ်ချက်။").join(" ");
 const scenes=api.buildScenes("previews",[{home:"A",away:"B",dailyPreviewText:full}],context());
 assert.ok(scenes.length>=2);
 assert.equal(scenes[0].kind,"previewOverview");
 const pages=scenes.slice(1);
 assert.ok(pages.every(p=>p.kind==="previewText"&&p.lines.length<=12));
 const original=full.replace(/\s+/g,"");
 const after=pages.flatMap(p=>p.lines).join("").replace(/\s+/g,"");
 assert.equal(after,original,"every letter and digit should survive pagination");
 assert.equal(pages.at(-1).page,pages.length);
});
test("Odds video is grouped by league, optional league filter; no fabricated results",()=>{
 const api=studio(),matches=[
  {league:"Serie A",home:"A",away:"B",bodyOdds:"-5",goalTotalOdds:"3-60",pdfLastColumn:"2-1"},
  {league:"Serie A",home:"C",away:"D",bodyOdds:"+50"},
  {league:"La Liga",home:"E",away:"F",bodyOdds:"-25"}
 ];
 const scenes=api.buildScenes("odds",matches,context());
 assert.deepEqual(Array.from(scenes,s=>s.kind),["league","odds","odds","league","odds"]);
 assert.equal(scenes[0].count,2);
 assert.equal(scenes[3].count,1);
 const filtered=api.buildScenes("odds",matches,context(),{league:"La Liga"});
 assert.equal(filtered.length,2);
 assert.equal(filtered[1].match.home,"E");
});
test("Video export supports MP4 only if MediaRecorder allows it; otherwise WebM",()=>{
 assert.equal(studio().chooseMime(),'video/webm;codecs="vp8"');
 assert.ok(script.includes("canvas.captureStream(24)"));
 assert.ok(script.includes("new MediaRecorder(stream,options)"));
 assert.ok(script.includes("recorder.ondataavailable"));
 assert.ok(script.includes("if(cancel){message("));
 assert.ok(script.includes("video/mp4")&&script.includes("video/webm"));
});

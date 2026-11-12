"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
function boot(){
 const calls=[],poster={width:1080,height:1080};
 const win={FutureCodePreviewV4:{render:async(m,options)=>{calls.push({m,options});return poster;}}};
 const doc={documentElement:{dataset:{}},head:{append(){}},readyState:"loading",addEventListener(){},createElement(){return {textContent:""};}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,"..","main-results-v2.js"),"utf8"),{window:win,document:doc,location:{pathname:"/"},console,Intl,Date});
 return {api:win.FutureCodeResultsV2,calls,poster};
}
test("Results V2 retains the archived V2 prose and pick in the shared V4 square poster",async()=>{
 const {api,calls,poster}=boot();
 const match=Object.freeze({fixtureId:"archived-match",status:"finished",finalScore:"1-2",previewV2Summary:"Original archived V2 paragraph",previewV2Selection:"Away",homeDisplay:"Home",awayDisplay:"Away"});
 assert.equal(await api.renderCanvas(match,{color:"#16486c",includeUploadedBanners:false}),poster);
 assert.equal(calls.length,1);assert.equal(calls[0].m,match);
 assert.equal(calls[0].m.previewV2Summary,"Original archived V2 paragraph");
 assert.equal(calls[0].m.previewV2Selection,"Away");
 assert.equal(calls[0].options.result,true);assert.equal(calls[0].options.color,"#16486c");
});
test("scheduled, live and unverified results cannot be exported as full time",async()=>{
 const {api,calls}=boot();
 for(const m of [{status:"live",finalScore:"1-0"},{status:"scheduled",finalScore:"0-0"},{status:"finished",predictedScore:"2-1"},{status:"finished",finalScore:"pending"}])await assert.rejects(api.renderCanvas(m),/အတည်ပြု/);
 assert.equal(calls.length,0);
});
test("extra time score metadata reaches the V4 renderer unchanged",async()=>{
 const {api,calls}=boot(),match={status:"finished",finalScore:"3:2",regulationScore:"2-2",resultPeriod:"AET"};
 await api.renderCanvas(match);assert.equal(calls[0].m.regulationScore,"2-2");assert.equal(calls[0].m.resultPeriod,"AET");
});

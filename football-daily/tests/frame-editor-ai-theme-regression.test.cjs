"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");

test("Frame Editor AI PNG uses saved theme, removes generic brand bars, preserves fixtures and wraps exactly once",async()=>{
 const canvases=[],wraps=[];
 function makeCanvas(){
  const operations=[];
  const ctx={
   fillStyle:"#000",strokeStyle:"#000",lineWidth:1,font:"",textAlign:"",
   save(){},restore(){},measureText(v){return {width:String(v).length*10};},
   fillText(v){operations.push({kind:"text",value:v});},
   fillRect(...dimensions){operations.push({kind:"fill",value:this.fillStyle,dimensions});},
   strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},
   drawImage(...args){operations.push({kind:"image",args});},
   createLinearGradient(){const gradient={stops:[],addColorStop(n,v){this.stops.push([n,v]);}};operations.push({kind:"gradient",gradient});return gradient;}
  };
  const canvas={width:0,height:0,operations,getContext(){return ctx;},
   toBlob(callback){callback({size:100,type:"image/png",width:this.width,height:this.height});}};
  canvases.push(canvas);return canvas;
 }
 const window={FutureCodeProfessionalFrames:{
  getFrame:id=>id==="test-gold"?{color:"#c99900"}:null,
  async wrap(canvas,section,frameId){wraps.push({canvas,section,frameId});return canvas;}
 }};
 const document={createElement(name){assert.equal(name,"canvas");return makeCanvas();}};
 const mod={exports:{}};
 vm.runInNewContext(read("main-ai-bulk-export.js"),{module:mod,window,document,URL}, {filename:"main-ai-bulk-export.js"});
 const page={groups:[{league:"A",matches:[{home:"Home",away:"Away",kickoff:"02:30"}]}],matchCount:1};
 const blob=await mod.exports.renderBlob(page,{
  frame:"pro:test-gold",frameColor:"#c99900",cleanPoster:true,date:"2026-10-30",
  predict:()=>["2-1","1-0","1-1"],leagueLabel:x=>x,
  teamName:(m,s)=>m[s],leagueLogo:()=>null,teamLogo:()=>null,displayTime:m=>m.kickoff
 });
 assert.equal(blob.type,"image/png");
 assert.equal(canvases.length,2,"one native source and one clean composited table");
 assert.equal(canvases[0].height,343,"native height includes 118px header, 163px table, 62px footer");
 assert.equal(canvases[1].height,223,"clean poster has 60px caption and 163px table; no native footer");
 assert.ok(canvases[0].operations.some(o=>o.kind==="gradient"&&o.gradient.stops.some(s=>s[1]==="#c99900")),"selected theme must reach league banners");
 assert.ok(canvases[1].operations.some(o=>o.kind==="image"&&o.args[2]===118&&o.args[4]===163),"only league and match table is copied, not old branding");
 const cleanText=canvases[1].operations.filter(o=>o.kind==="text").map(o=>o.value);
 assert.ok(cleanText.includes("VIP Internet · Bookies · AI Tips"));
 assert.ok(cleanText.includes("2026-10-30"));
 assert.ok(cleanText.every(s=>!/FUTURE CODE/i.test(s)),"no Future Code branding between user banners");
 assert.equal(wraps.length,1,"never double-wrap the frame");
 assert.equal(wraps[0].frameId,"pro:test-gold");
 assert.equal(wraps[0].canvas,canvases[1]);
});
test("Frame Editor passes current frame colour into native renderer without a second banner overlay",()=>{
 const src=read("frame-export-engine.js");
 assert.match(src,/frameColor:color,cleanPoster:!nativeStyle/);
 assert.match(src,/frame:nativeStyle\|\|"pro:"\+f\.id/);
 assert.doesNotMatch(src,/blobCanvas\(await p\.wrap\(cv,"ai"/);
});

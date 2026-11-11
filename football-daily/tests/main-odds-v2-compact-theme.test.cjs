"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

test("Main Odds V2 keeps every market, uses eight readable columns and a 900px PNG",async()=>{
 const src=fs.readFileSync(path.join(__dirname,"..","main-odds-v2.js"),"utf8");
 assert.match(src,/fcOV2Theme/,"Colour selector must be present");
 assert.match(src,/fcOV2Custom/,"Custom colour input must be present");
 assert.match(src,/root\.style\.setProperty\("--ov2-brand",themeColor\)/,"Theme must be applied inside the exported sheet");
 const made=[];
 function element(type){
  const el={type,children:[],className:"",innerHTML:"",textContent:"",style:{cssText:"",vars:{},setProperty(k,v){this.vars[k]=v;}},
   append(...children){this.children.push(...children);},remove(){this.removed=true;}};
  made.push(el);return el;
 }
 const document={documentElement:{dataset:{}},head:{append(){}},body:{append(){}},
  createElement:element,fonts:{ready:Promise.resolve()},readyState:"loading",addEventListener(){}};
 let captured;
 const html2canvas=async(sheet,options)=>{
  captured={sheet,options};
  return {width:900,height:320};
 };
 const window={FutureCodeOddsClock:{short:()=>"4:30 PM"},groups:{}};
 vm.runInNewContext(src,{document,window,location:{pathname:"/odds.html",search:"",hash:""},URLSearchParams,
  html2canvas,Intl,Date,console},{filename:"main-odds-v2.js"});
 const odds={league:"Test League",leagueDisplay:"စမ်းသပ်လိဂ်",home:"အိမ်ရှင်",away:"ဧည့်သည်",
  upperTeam:"အိမ်ရှင်",bodyOdds:"-30",currentBodyOdds:"-25",
  goalTotalOdds:"3+50",currentGoalTotalOdds:"3+55",pdfLastColumn:"2-1"};
 const canvas=await window.FutureCodeOddsV2.renderCanvas([odds],{date:"2026-11-11"});
 assert.equal(canvas.width,900);
 assert.equal(captured.options.windowWidth,1100);
 assert.equal(captured.sheet.style.vars["--ov2-brand"],"#123b87");
 const table=captured.sheet.children.find(x=>x.type==="table");
 assert.equal((table.innerHTML.match(/<col style=/g)||[]).length,8);
 const body=table.children[0];
 assert.equal(body.children[0].children[0].colSpan,8);
 const values=body.children[1].children.map(x=>x.textContent);
 assert.equal(values.length,8);
 assert.deepEqual(Array.from(values),["4:30 PM","အိမ်ရှင် နှင့် ဧည့်သည်","အိမ်ရှင်","-30","-25","3+50","3+55","2-1"]);
});

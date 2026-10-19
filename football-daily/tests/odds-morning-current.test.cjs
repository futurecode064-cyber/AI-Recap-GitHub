"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const data=p=>JSON.parse(read(p));
const context={window:{},document:{documentElement:{dataset:{footballBrandName:"TEST"}},addEventListener(){}},location:{pathname:"/ykz-family/odds.html"},URL,console};
vm.createContext(context);vm.runInContext(read("odds.js"),context);
const merge=(original,latest)=>context.mergeLatestOdds(original,latest);
function morning(date){return data("data/odds/"+date+".json");}
function afternoon(date){return data("data/odds/evening/"+date+".json");}
test("16 October morning sheet has empty current quotes pending owner submission",()=>{
 const m=morning("2026-10-16"),out=merge(m,null);
 assert.equal(m.matches.length,21);
 assert.equal(out.matches.length,21);
 assert.ok(out.matches.every(x=>x.currentBodyOdds===""&&x.currentGoalTotalOdds===""));
 for(let i=0;i<m.matches.length;i++){
  assert.equal(out.matches[i].bodyOdds,m.matches[i].bodyOdds);
  assert.equal(out.matches[i].goalTotalOdds,m.matches[i].goalTotalOdds);
 }
});
test("verified afternoon PDF quotes merge by original row on historic 15 Oct 36 matches",()=>{
 const m=morning("2026-10-15"),evening=afternoon("2026-10-15");
 const out=merge(m,evening);
 assert.equal(out.matches.length,36);
 for(let i=0;i<m.matches.length;i++){
  assert.equal(out.matches[i].bodyOdds,m.matches[i].bodyOdds);
  assert.equal(out.matches[i].goalTotalOdds,m.matches[i].goalTotalOdds);
  assert.equal(out.matches[i].currentBodyOdds,evening.matches[i].eveningBodyOdds);
  assert.equal(out.matches[i].currentGoalTotalOdds,evening.matches[i].eveningGoalTotalOdds);
 }
 assert.equal(m.matches[0].currentBodyOdds,undefined,"Never change morning source JSON");
});
test("partial 14 October afternoon odds fill only matching rows; remaining latest slots are empty",()=>{
 const morningSheet=morning("2026-10-14"),evening=afternoon("2026-10-14");
 const out=merge(morningSheet,evening),matched=out.matches.filter(x=>x.currentBodyOdds!=="");
 assert.equal(matched.length,13);
 assert.equal(out.matches.filter(x=>x.currentBodyOdds==="").length,2);
});
test("wrong report date, changed team, changed morning price or invalid quote never populate current slots",()=>{
 const m=morning("2026-10-15"),afternoonReport=afternoon("2026-10-15");
 const wrongDate={...afternoonReport,reportDate:"2026-10-14"};
 assert.ok(merge(m,wrongDate).matches.every(x=>x.currentBodyOdds===""));
 const corrupt=afternoonReport.matches.map((x,i)=>{
  if(i===0)return {...x,home:"Not the same team"};
  if(i===1)return {...x,morningGoalTotalOdds:"999+"};
  if(i===2)return {...x,eveningBodyOdds:"unknown",eveningGoalTotalOdds:""};
  return x;
 });
 const out=merge(m,{...afternoonReport,matches:corrupt});
 for(const i of [0,1])assert.equal(out.matches[i].currentBodyOdds,"");
 assert.equal(out.matches[2].currentBodyOdds,"");
 assert.equal(out.matches[2].currentGoalTotalOdds,"");
 assert.equal(out.matches[3].currentBodyOdds,afternoonReport.matches[3].eveningBodyOdds);
});
test("only one odds section is rendered with grouped morning/current headings",()=>{
 const js=read("odds.js");
 assert.ok(js.includes('th.colSpan=2'));
 assert.ok(js.includes('th.rowSpan=2'));
 assert.ok(js.includes('"မူလ"'));
 assert.ok(js.includes('"ယခု"'));
 assert.ok(js.includes('element("td","price odds-current"'));
 assert.ok(!js.includes("evening-odds.js"));
 const png=read("daily-image-export.js");
 assert.ok(png.includes('text(ctx,"မူလ"'));
 assert.ok(png.includes('text(ctx,"ယခု"'));
 assert.ok(png.includes('m.currentBodyOdds'));
 assert.ok(png.includes('m.currentGoalTotalOdds'));
 for(const brand of ["odds.html","ykz-family/odds.html","bw-sport/odds.html","ko-thet-family/odds.html"]){
  const html=read(brand);
  assert.match(html,/odds-sheet-theme\.css\?v=[0-9a-z-]+/i,`${brand} must load versioned odds stylesheet`);
 }
});

"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const evening=JSON.parse(read("data/odds/evening/2026-10-14.json"));
const morning=JSON.parse(read("data/odds/2026-10-14.json"));
test("2026-10-14 evening comparison has exactly 13 matching morning games",()=>{
 assert.equal(evening.reportDate,"2026-10-14");
 assert.equal(evening.matches.length,13);
 assert.equal(morning.matches.length,15);
 assert.equal(evening.matches[0].morningBodyOdds,"2+60");
 assert.equal(evening.matches[0].eveningBodyOdds,"1-65");
 assert.equal(evening.matches[0].morningGoalTotalOdds,"3-100");
 assert.equal(evening.matches[0].eveningGoalTotalOdds,"3-30");
 assert.deepEqual(Object.keys(evening).sort(),["matches","reportDate","title"].sort());
 assert.equal(evening.matches[3].morningBodyOdds,"1-10"); 
 assert.equal(evening.matches[3].eveningBodyOdds,"1+45");
 assert.equal(evening.matches[11].morningGoalTotalOdds,"3+30");
 assert.equal(evening.matches[11].eveningGoalTotalOdds,"3+90");
});
test("morning original quotes and evening updates remain separate from existing canonical matches",()=>{
 for(const m of evening.matches){
  for(const key of ["morningBodyOdds","eveningBodyOdds","morningGoalTotalOdds","eveningGoalTotalOdds"]){
   assert.match(m[key],/^(?:\d+[+=-]\d*|-\d+)$/,m.row+": "+key);
  }
  const match=morning.matches[m.row-1];
  assert.equal(m.home,match.home);assert.equal(m.away,match.away);
  assert.equal(m.upperTeam,match.upperTeam);
  assert.equal(m.league,match.league);
  assert.equal(m.morningBodyOdds,match.bodyOdds);
  assert.equal(m.morningGoalTotalOdds,match.goalTotalOdds);
 }
});
test("all four brands use only one integrated morning/latest price table",()=>{
 const odds=read("odds.js");
 assert.ok(odds.includes('new URL("evening/"+day+".json",base)'));
 assert.ok(odds.includes('function mergeLatestOdds(morning,update)'));
 assert.ok(odds.includes('မူလ')&&odds.includes('ယခု'));
 assert.ok(!odds.includes('evening-odds.js'),"Do not load separate evening section anymore");
 assert.ok(!odds.includes('eveningOddsSection'));
 for(const html of ["odds.html","ykz-family/odds.html","bw-sport/odds.html","ko-thet-family/odds.html"]){
  assert.match(read(html),/odds\.js/);
  assert.match(read(html),/oddsList/);
 }
 // Historical afternoon reports and PNGs remain archived, not discarded.
 assert.equal(evening.matches.length,13);
});
function loader(){
 const listeners=[],styles=[];
 const document={
  currentScript:{src:"https://example.test/football-daily/evening-odds.js"},
  documentElement:{dataset:{}},
  readyState:"loading",
  createElement(){return {};},
  head:{appendChild(x){styles.push(x)}},
  addEventListener(type,callback){listeners.push({type,callback})}
 };
 const window={};
 vm.runInNewContext(read("evening-odds.js"),{document,window,URL,console});
 assert.equal(styles.length,1);
 assert.equal(listeners[0].type,"DOMContentLoaded");
 return window.FutureCodeEveningOdds;
}
test("quote changes compute point difference on same handicap line and detect line shifts",()=>{
 const o=loader();
 assert.equal(o.difference("-100","-90").text,"+10 မှတ်");
 assert.equal(o.difference("-50","-75").text,"-25 မှတ်");
 assert.equal(o.difference("3-100","3-30").text,"+70 မှတ်");
 assert.equal(o.difference("3+80","3+100").text,"+20 မှတ်");
 assert.equal(o.difference("3=","3=").kind,"same");
 assert.equal(o.difference("2+60","1-65").kind,"line");
 assert.match(o.difference("2+60","1-65").text,/လိုင်း 2 → 1/);
 assert.equal(o.difference("-5","-5").kind,"same");
 assert.equal(o.difference("1-10","1+45").text,"+55 မှတ်");
 assert.equal(o.difference("3+30","3+90").text,"+60 မှတ်");
});

test("evening PNG save always gives the user a clickable image preview and second save route",()=>{
 const clicks=[],appended=[];
 function element(tag){
  const e={tag,children:[],attrs:{},isConnected:true,
   appendChild(c){this.children.push(c);c.parentNode=this;},
   setAttribute(k,v){this.attrs[k]=v;},
   addEventListener(type,handler){this["on"+type]=handler;},
   click(){clicks.push(this);},
   remove(){this.removed=true;}
  };
  return e;
 }
 const body=element("body");
 const doc={currentScript:{src:"https://example.test/evening-odds.js"},
  documentElement:{dataset:{}},readyState:"loading",createElement:element,
  head:{appendChild:e=>appended.push(e)},body,
  getElementById:()=>null,
  addEventListener:()=>{}
 };
 const win={};
 vm.runInNewContext(read("evening-odds.js"),{document:doc,window:win,URL,console});
 assert.equal(appended.length,1);
 const imageData="data:image/png;base64,UE5HREFUQQ==";
 win.FutureCodeEveningOdds.showPngPreview({toDataURL:()=>imageData},"brand-evening-odds-2026-10-14.png");
 assert.equal(body.children.length,1);
 const overlay=body.children[0],panel=overlay.children[0];
 assert.equal(overlay.id,"eveningPngPreview");
 const actions=panel.children.find(x=>x.className==="evening-preview-actions");
 assert.ok(actions);
 const save=actions.children[0],open=actions.children[1];
 assert.equal(save.download,"brand-evening-odds-2026-10-14.png");
 assert.equal(save.href,imageData);
 assert.equal(open.href,imageData);
 assert.equal(open.target,"_blank");
 assert.equal(clicks[0],save,"automatic attempt made, explicit Save link remains");
 const image=panel.children.find(x=>x.tag==="img");
 assert.equal(image.src,imageData,"long-press-save preview is available");
 assert.ok(read("evening-odds.js").includes("bindDownload(button,data,league)"));
 assert.ok(read("evening-odds.js").includes("bindDownload(allButton,data,null)"));
 assert.ok(read("evening-odds.js").includes("PNG ထုတ်မရပါ — ပြန်နှိပ်ပါ"));
});

test("12 permanent PNGs exist, have valid PNG signatures, and match the four brands",()=>{
 const brands=["future-code","ykz-family","bw-sport","ko-thet-family"];
 const slugs=["all","uefa-champions-league","championship"];
 for(const brand of brands)for(const slug of slugs){
  const file=path.join(root,"data/odds/evening/png/2026-10-14",brand+"-"+slug+".png");
  assert.ok(fs.existsSync(file),file);
  const bytes=fs.readFileSync(file);
  assert.ok(bytes.length>10000,file);
  assert.equal(bytes.subarray(0,8).toString("hex"),"89504e470d0a1a0a",file);
 }
});
test("Evening save button uses permanent same-origin PNG links instead of Canvas encoding",()=>{
 const clicked=[],created=[];
 function node(tag){
  return {tag,children:[],attrs:{},isConnected:true,
   appendChild(child){this.children.push(child);child.parentNode=this;},
   setAttribute(k,v){this.attrs[k]=v;},
   addEventListener(type,fn){this["on"+type]=fn;},
   remove(){this.removed=true;},
   click(){clicked.push(this);}
  };
 }
 const body=node("body"),head={appendChild:e=>created.push(e)};
 const document={
  currentScript:{src:"https://example.test/football-daily/evening-odds.js"},
  documentElement:{dataset:{}},
  readyState:"loading",createElement:node,head,body,
  getElementById:()=>null,addEventListener:()=>{}
 };
 const window={FutureCodeBrandConfig:{id:"ykz-family"}};
 vm.runInNewContext(read("evening-odds.js"),{document,window,URL,console});
 const data={reportDate:"2026-10-14",matches:evening.matches};
 window.FutureCodeEveningOdds.png(data,null);
 assert.equal(body.children.length,1);
 const panel=body.children[0].children[0];
 const actions=panel.children.find(x=>x.className==="evening-preview-actions");
 assert.ok(actions);
 const save=actions.children[0],preview=panel.children.find(x=>x.tag==="img");
 const all="https://example.test/football-daily/data/odds/evening/png/2026-10-14/ykz-family-all.png";
 assert.equal(save.href,all);
 assert.equal(save.download,"ykz-family-all.png");
 assert.equal(preview.src,all);
 assert.equal(clicked[0],save);
 window.FutureCodeEveningOdds.png(data,"UEFA Champions League");
 const leaguePanel=body.children[1].children[0];
 const leagueActions=leaguePanel.children.find(x=>x.className==="evening-preview-actions");
 assert.ok(leagueActions.children[0].href.endsWith("/ykz-family-uefa-champions-league.png"));
 assert.ok(read("evening-odds.js").includes("bindDownload(button,data,league)"));
 assert.ok(read("evening-odds.js").includes("bindDownload(allButton,data,null)"));
});

"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("Goal Zone exported odds use a fixed grid and larger typography",()=>{
 const source=read("main-odds-dom-frame.js");
 for(const term of ['goalZone()?1400:EXPORT_WIDTH','fc-gz-odds-print',
   '"9%","33%","13%","8.5%","8.5%","8.5%","8.5%","11%"',
   'table-layout:fixed!important','height:100px!important','font:900 33px/1.4',
   'name.style.setProperty("font-size","27px","important")'])assert(source.includes(term),term);
 assert(!read("odds.js").includes("fc-gz-odds-print"));
});
test("Goal Zone two-PNG default keeps the single-PNG choice",()=>{
 const center=read("future-code-journal/goal-zone-download-center.js");
 assert(center.includes('odds:"two"'));
 assert(center.includes('["single","ရွေးထားသော အားလုံး ၁ ပုံတည်း"]'));
 assert(read("future-code-journal/odds.html").includes("20261112-goalzone-odds-readable-v1"));
});

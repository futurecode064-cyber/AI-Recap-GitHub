"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const {validateReport,CONFIG}=require("../scripts/validate_preview_v2.cjs");
const data=JSON.parse(fs.readFileSync(path.join(root,"data/today.json"),"utf8"));
const load=name=>fs.readFileSync(path.join(root,name),"utf8");
test("Preview Version 2 permanent format applies to every published fixture",()=>{
 const check=validateReport(data);
 assert.equal(check.errors.length,0,JSON.stringify(check.errors,null,2));
 assert.equal(check.checked,data.matches.length);
 assert(check.checked>0);
 assert.equal(CONFIG.export.bannerPolicy,"single pair per final combined PNG");
});
test("No mechanical V2 summaries, stale dates, or invented team choices",()=>{
 const one=structuredClone(data);
 one.matches[0].previewV2Summary=one.matches[0].dailyPreviewText.slice(0,320);
 assert.equal(validateReport(one).ok,false);
 const two=structuredClone(data);two.matches[0].previewV2EditorialDate="2026-01-01";
 assert.equal(validateReport(two).ok,false);
 const three=structuredClone(data);three.matches[0].previewV2Selection="အခြားအသင်း";
 assert.equal(validateReport(three).ok,false);
});
test("Main and Frame Editor combine unframed cards BEFORE exactly one outer banner",()=>{
 const main=load("main-preview-v2.js"),frame=load("frame-export-engine.js");
 assert.match(main,/for\(const m of chunk\)canvases\.push\(await render\(m,\{color:frame\?\.color\}\)\)/);
 assert.match(main,/api\.wrap\(out,"previewsV2","pro:"\+chosen\)/);
 assert.doesNotMatch(main,/api\.wrap\(x,"previewsV2"/);
 assert.match(frame,/const combined=await stackCanvases\(canvases\)/);
 assert.match(frame,/p\.wrap\(combined,k,"pro:"\+f\.id\)/);
 const v2Export=frame.slice(frame.indexOf('if(k==="previewsV2")'),frame.indexOf('}else if(k==="previews"'));
 assert.doesNotMatch(v2Export,/canvases\.push\(await p\.wrap\(src,k/);
});
test("Contract keeps 2/3-match options, Myanmar word-wrap and frame-editor theme",()=>{
 const main=load("main-preview-v2.js"),studio=load("frame-workspace.js");
 assert.match(main,/fcV2Two/);assert.match(main,/fcV2Three/);
 assert.match(main,/Intl\.Segmenter/);
 assert.match(studio,/previewsV2:\[\["one"/);
 assert.match(studio,/\["pair","၂ ပွဲ/);
 assert.match(studio,/\["triple","၃ ပွဲ/);
 assert.match(main,/color:frame\?\.color/);
});

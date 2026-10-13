"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const expectedFirst="နေ့စဥ် မနက် ၇ နာရီ နှင့် ၈ နာရီကြားတွင်";
const expectedSecond="နေ့စဥ် ကန်မည့် ပွဲများ အားလုံး ကို update ကြည့်ရှူ နိုင်ပါပြီ";
const sites=["index.html","ykz-family/index.html","bw-sport/index.html","ko-thet-family/index.html"];
test("all four football brands show the exact requested 7–8 AM Myanmar notice instead of the 06:00 clock",()=>{
 for(const page of sites){
  const src=fs.readFileSync(path.join(root,page),"utf8");
  assert.equal((src.match(/class="hero-update-notice"/g)||[]).length,1,page+" must show one notice");
  assert.ok(src.includes("<p>"+expectedFirst+"</p>"),page+" must match opening Myanmar text");
  assert.ok(src.includes("<p>"+expectedSecond+"</p>"),page+" must match update wording");
  assert.ok(!src.includes("class=\"hero-number\""),page+" must not show old 06:00 clock");
  assert.ok(!src.includes("DAILY FOOTBALL · MMT"),page+" must remove old slogan");
  assert.ok(!src.includes("EVERY MORNING · MMT"),page+" must remove old slogan");
  assert.ok(src.includes("styles.css?v=copy-guard-20261013"),page+" should load latest shared styling");
 }
});
test("new notice stays legible and responsive in all existing site palettes",()=>{
 const css=fs.readFileSync(path.join(root,"styles.css"),"utf8");
 assert.ok(css.includes(".hero-update-notice{"));
 assert.ok(css.includes(".hero-update-notice p:first-child{"));
 assert.ok(css.includes(".hero-update-notice p:last-child{"));
 assert.ok(css.includes("var(--orange)"));
 assert.ok(css.includes("var(--cream)"));
 assert.ok(css.includes("@media(max-width:620px)"));
});

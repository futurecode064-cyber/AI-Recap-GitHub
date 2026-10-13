"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const required="ပေါက်ကြေးများသည် အိုင်ဘတ် ခွန်ရှစ်ကိုး ဆိုဒ်မှာ မနက်ပိုင်း ဖွင့် ထားသော မြန်မာကြေး များဖြစ်ပါသည်။";
const previous="အချက်အလက်ကို ပေးပို့ထားသည့်ကြေးစာရင်းအရ ဖော်ပြသည်။";
test("all branded odds pages use the exact approved Myanmar attribution footer",()=>{
 for(const page of ["odds.html","ykz-family/odds.html","bw-sport/odds.html"]){
  const html=fs.readFileSync(path.join(root,page),"utf8");
  assert.equal(html.split(required).length-1,1,page+": expected exactly one new footer");
  assert.ok(!html.includes(previous),page+": old attribution must be removed");
  assert.ok(html.includes("<footer>"),page+": footer is mandatory");
  assert.ok(html.indexOf(required)>html.indexOf("<footer>"),page+": text belongs to footer");
 }
});

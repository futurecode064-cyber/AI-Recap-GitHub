"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
const source=fs.readFileSync(path.join(root,"_worker.js"),"utf8");
const feed=JSON.parse(fs.readFileSync(path.join(root,"data/news/latest.json"),"utf8"));
const origin="https://future-code-football-daily.pages.dev";
async function mod(){
 return import("data:text/javascript;base64,"+Buffer.from(source+"\nexport {newsValidate};").toString("base64"));
}
const env={
 FCD_MAIN_PASSWORD:"test-owner-password",
 FCD_SESSION_SECRET:"secret-012345678901234567890123456789",
 FCD_EDITOR_GITHUB_TOKEN:"token-test",
 ASSETS:{fetch:async()=>new Response("page",{status:200})}
};
test("Previously published news can be loaded and edited without changing its original article IDs",async()=>{
 const {newsValidate}=await mod();
 const checked=newsValidate(feed.items);
 assert.deepEqual(checked.errors,[]);
 assert.deepEqual(checked.items.map(x=>x.id),feed.items.map(x=>x.id));
});
test("Multiple headlines, images and same-source revisions pass the news schema",async()=>{
 const {newsValidate}=await mod();
 const item={id:"news-example-123456",title:"အသင်းနှစ်သင်း ယှဉ်ပြိုင်မည့် နောက်ဆုံးသတင်း",category:"match",
 paragraphs:["ပထမစာပိုဒ်။","ဒုတိယစာပိုဒ်။"],image:"/data/news/images/uploads/2026-10-20/abc.webp",
 imageAlt:"သတင်းပုံ",sourceName:"Future Code",sourceUrl:"",sourceDateISO:"2026-10-20"};
 const checked=newsValidate([item,{...item,id:"news-example-123457",title:"အခြား သတင်းခေါင်းစဉ်"}]);
 assert.deepEqual(checked.errors,[]);
 assert.equal(checked.items.length,2);
});
test("Unsafe URLs, duplicate story IDs, missing paragraphs and nonexistent category cannot publish",async()=>{
 const {newsValidate}=await mod();
 const item={id:"news-test-12345",title:"သတင်း စမ်းသပ်သည့် ခေါင်းစဉ်",category:"unknown",
 paragraphs:[],image:"javascript:alert(1)",sourceDateISO:"2026-10-20"};
 const checked=newsValidate([item,item]);
 assert.ok(checked.errors.length>=6);
});
test("News editing endpoints and news HTML require authenticated owner session",async()=>{
 const {default:worker}=await mod();
 for(const url of ["/api/editor/news","/api/editor/news/status?revision="+"a".repeat(36),"/api/editor/news/image","/api/editor/news/publish"]){
  const res=await worker.fetch(new Request(origin+url),env);
  assert.equal(res.status,401);
 }
 const page=await worker.fetch(new Request(origin+"/editor/news.html"),env);
 assert.equal(page.status,302);assert.match(page.headers.get("Location"),/\/login/);
});

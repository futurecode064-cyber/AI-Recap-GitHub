"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
test("Shared news publisher is linked from Main, and only Main plus Goal Zone render its single feed",()=>{
 const main=read("index.html"),goalZone=read("future-code-journal/index.html");
 for(const html of [main,goalZone]){
  assert.match(html,/news-section\.css/);assert.match(html,/news-section\.js/);assert.match(html,/fcNewsSection/);
 }
 assert.match(main,/data-news-url="\.\/data\/news\/latest\.json"/);
 assert.match(goalZone,/data-news-url="\.\.\/data\/news\/latest\.json"/);
 assert.match(main,/href="\/editor\/news\.html"/);
 assert.ok(main.indexOf("</nav>",main.indexOf('id="dateTabs"'))<main.indexOf('id="fcNewsSection"'));
 assert.ok(goalZone.indexOf("</nav>",goalZone.indexOf('class="fcj-quick-nav"'))<goalZone.indexOf('id="fcNewsSection"'));
 for(const brand of ["ykz-family","bw-sport","ko-thet-family"]){
  const html=read(brand+"/index.html");
  assert.doesNotMatch(html,/news-section\.css|news-section\.js|fcNewsSection|data\/news\/latest/);
 }
});
test("Editable shared feed is valid and all referenced local images exist",()=>{
 const data=JSON.parse(read("data/news/latest.json"));
 assert.ok(Array.isArray(data.items));
 assert.ok(data.items.length<=60);
 const ids=new Set();
 for(const item of data.items){
  assert.ok(typeof item.id==="string"&&!ids.has(item.id));ids.add(item.id);
  assert.ok(typeof item.title==="string"&&item.title.trim().length>=4);
  assert.ok(Array.isArray(item.paragraphs)&&item.paragraphs.length>=1);
  assert.match(item.sourceDateISO,/^\d{4}-\d{2}-\d{2}$/);
  if(item.sourceUrl)assert.match(item.sourceUrl,/^https:\/\//);
  if(item.image?.startsWith("/data/news/")){
   assert.ok(fs.existsSync(path.join(root,item.image.slice(1))),"missing image: "+item.image);
  }
 }
 const form=read("editor/news.html"),script=read("editor/news.js"),worker=read("_worker.js");
 assert.match(form,/id="newsForm"/);
 assert.match(script,/\/image/);assert.match(script,/\/publish/);
 assert.match(worker,/async function newsApi/);
 assert.match(worker,/await hasSession\(request,env\)/);
});

"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
test("Football news is shown only on the Future Code main and Goal Zone journal from one shared feed",()=>{
 const main=read("index.html"),goalZone=read("future-code-journal/index.html");
 for(const html of [main,goalZone]){
  assert.match(html,/news-section\.css/);assert.match(html,/news-section\.js/);assert.match(html,/fcNewsSection/);
 }
 assert.match(main,/data-news-url="\.\/data\/news\/latest\.json"/);
 assert.match(goalZone,/data-news-url="\.\.\/data\/news\/latest\.json"/);
 assert.ok(main.indexOf("</nav>",main.indexOf('id="dateTabs"'))<main.indexOf('id="fcNewsSection"'));
 assert.ok(goalZone.indexOf("</nav>",goalZone.indexOf('class="fcj-quick-nav"'))<goalZone.indexOf('id="fcNewsSection"'));
 for(const brand of ["ykz-family","bw-sport","ko-thet-family"]){
  const html=read(`${brand}/index.html`);
  assert.doesNotMatch(html,/news-section\.css|news-section\.js|fcNewsSection|data\/news\/latest/);
 }
});
test("Daily Burmese football news has all requested categories, source links and local text-free illustrations",()=>{
 const data=JSON.parse(read("data/news/latest.json"));
 const categories=new Set(data.items.map(item=>item.category));
 for(const category of ["international","team-player","transfer"])assert.ok(categories.has(category));
 assert.ok(data.items.length>=4);
 for(const item of data.items){
  assert.ok(item.title.length>10);assert.ok(item.paragraphs.length>=2);
  assert.match(item.sourceUrl,/^https:\/\//);
  assert.match(item.sourceDateISO,/^2026-10-(19|20)$/);
  assert.match(item.image,/^\/data\/news\/images\/2026-10-20\//);
  assert.ok(fs.existsSync(path.join(root,item.image.slice(1))),`missing image: ${item.image}`);
 }
});

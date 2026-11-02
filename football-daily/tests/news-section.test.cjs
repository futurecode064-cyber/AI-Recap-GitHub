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

test("Colour journal PNG hides every photo caption while keeping source credits",()=>{
 const js=read("news-section.js"),css=read("news-section.css");
 assert.match(js,/async function createNewsPoster/);
 assert.match(js,/const masthead=/);
 assert.match(js,/const photoBox=/);
 assert.match(js,/const linesPerColumn=/);
 assert.match(js,/newsPngMetadata/);
 assert.doesNotMatch(js,/ctx\.fillText\("SOURCE:/);
 assert.doesNotMatch(js,/body\.append\(credit\)/);
 assert.doesNotMatch(js,/const caption=s\.imageCaption/);
 assert.doesNotMatch(js,/card\.append\(node\("div",s\.imageCaption/);
 assert.match(css,/\.fc-news-attribution/);
 assert.match(read("index.html"),/news-section\.js\?v=journal-palette-20261102-v6/);
 assert.match(read("future-code-journal/index.html"),/news-section\.js\?v=journal-palette-20261102-v6/);
});


test("News palette uses readable white mastheads and sky-blue tints",()=>{
 const palette=require("../news-palette.js");
 for(const color of ["#2000ff","#132ab0","#eac020","#124d19","#ff0000"]){
  const c=palette.resolve({color});
  assert(palette.contrast(c.masthead,c.background)>=4.5);
  assert(palette.contrast(c.bodyText,c.articlePanel)>=4.5);
 }
 const blue=palette.defaults("#2000ff");
 const channels=[1,3,5].map(i=>parseInt(blue.glow.slice(i,i+2),16));
 assert(channels[2]>channels[1]&&channels[1]>channels[0],"blue tint must not turn violet");
});
test("Custom news colors persist and reset when the main theme changes",()=>{
 const palette=require("../news-palette.js"),frame={color:"#132ab0",newsPaletteTheme:"#132ab0",newsColors:{masthead:"#eeeeee",bodyText:"#123456"}};
 assert.equal(palette.resolve(frame).bodyText,"#123456");
 assert.equal(palette.resolve({...frame,color:"#ff0000"}).bodyText,palette.defaults("#ff0000").bodyText);
 assert.equal(palette.resolve({color:"#132ab0",newsColors:{bodyText:"invalid"}}).bodyText,"#142c42");
 const workspace=read("frame-workspace.js"),professional=read("main-professional-frame-studio.js");
 assert.match(workspace,/item.newsColors=readNewsColors/);
 assert.match(workspace,/newsColorsAuto/);
 assert.match(workspace,/renderDraft/);
 assert.match(professional,/newsColors:Object.fromEntries/);
});

"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
test("MAIN page alone has nine menu tiles, names today correctly, loads independent views",()=>{
 const home=read("index.html");
 const nav=home.match(/<nav class="date-tabs fc-main-five-nav"[^>]*>([\s\S]*?)<\/nav>/);
 assert.ok(nav,"main five-tile navigation exists");
 assert.equal([...nav[1].matchAll(/<(button|a)\b/g)].length,9);
 assert.match(nav[1],/ယနေ့ ပွဲကြိုသုံးသပ်ချက်များ/);
 assert.match(nav[1],/href="#fcVideoStudio"/);
 assert.match(nav[1],/href="#fcAiScoreSection"/);
 assert.match(nav[1],/href="#fcProbSection"/);
 assert.match(nav[1],/href="#fcNewsSection"/);
 assert.match(home,/data-fc-main-view="today"/);
 assert.match(home,/main-section-tabs\.js/);
 for(const name of ["ykz-family","bw-sport","ko-thet-family"]){
  const html=read(name+"/index.html");
  assert.doesNotMatch(html,/main-section-tabs|data-fc-main-view|fc-main-five-nav/);
 }
});
test("CSS hides extra studios from Today's previews and hides preview list from AI/Video tabs",()=>{
 const css=read("main-ai-score.css");
 for(const mode of ["today","yesterday"]){
  assert.ok(css.includes('body[data-fc-main-view="'+mode+'"] #fcAiScoreSection'));
  assert.ok(css.includes('body[data-fc-main-view="'+mode+'"] #fcVideoStudio'));
 }
 for(const mode of ["ai","video"]){
  assert.ok(css.includes('body[data-fc-main-view="'+mode+'"] #matchList'));
  assert.ok(css.includes('body[data-fc-main-view="'+mode+'"] #filters'));
  assert.ok(css.includes('body[data-fc-main-view="'+mode+'"] #sectionNote'));
 }
});
test("Actual tab interactions select only the requested view and keep deep links",()=>{
 const callbacks={};
 const nodes={};
 function node(id){
  const classes=new Set(id==="today"?["active"]:[]);
  const actions={};
  return {
   actions, attributes:{},
   classList:{contains:x=>x==="fc-main-five-nav"||classes.has(x),toggle(x,v){if(v)classes.add(x);else classes.delete(x)}},
   setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k]},
   addEventListener(k,cb){actions[k]=cb;},textContent:id==="title"?"ဒီနေ့ ပွဲကြိုသုံးသပ်ချက်များ":"",
   tagName:id==="yesterday"||id==="today"?"BUTTON":"A",
   scrollIntoView(){},
   querySelector(q){
    return q==='button[data-day="-1"]'?nodes.yesterday:
      q==='button[data-day="0"]'?nodes.today:
      q===".fc-main-studio-tab"?nodes.video:
      q===".fc-main-ai-tab"?nodes.ai:
      q===".fc-main-preview-frame-tab"?nodes.previewFrame:
      q===".fc-main-odds-frame-tab"?nodes.oddsFrame:
      q===".fc-main-news-tab"?nodes.news:
      q===".fc-main-prob-tab"?nodes.probability:null;
   }
  };
 }
 for(const id of ["nav","aiSection","videoSection","newsSection","title","yesterday","today","video","ai","news","previewFrame","oddsFrame","probability","probSection","previewPanel","oddsPanel"])nodes[id]=node(id);
 const targets={dateTabs:nodes.nav,fcAiScoreSection:nodes.aiSection,fcVideoStudio:nodes.videoSection,fcNewsSection:nodes.newsSection,fcProbSection:nodes.probSection,reportHeading:nodes.title,brandPreviewStudio:nodes.previewPanel,brandOddsStudio:nodes.oddsPanel};
 nodes.nav.parentNode={append(){}};
 const location={pathname:"/",hash:"",href:"https://example.test/"};
 const history={
  pushState(_a,_b,url){location.href=url;location.hash=new URL(url).hash},
  replaceState(_a,_b,url){location.href=url;location.hash=new URL(url).hash}
 };
 const document={readyState:"loading",body:{dataset:{fcMainView:"today"}},getElementById:k=>targets[k]||null,
  addEventListener(name,cb){callbacks[name]=cb}};
 const window={addEventListener(name,cb){callbacks["window-"+name]=cb}};
 const sandbox={document,window,location,history,URL,MutationObserver:class{observe(){}},requestAnimationFrame:cb=>cb()};
 vm.runInNewContext(read("main-section-tabs.js"),sandbox);
 assert.equal(typeof callbacks.DOMContentLoaded,"function");
 callbacks.DOMContentLoaded();
 assert.equal(document.body.dataset.fcMainView,"today");
 assert.equal(nodes.title.textContent,"ယနေ့ ပွဲကြိုသုံးသပ်ချက်များ");
 nodes.probability.actions.click({preventDefault(){}});
 assert.equal(document.body.dataset.fcMainView,"probabilities");
 assert.equal(location.hash,"#fcProbSection");
 nodes.ai.actions.click({preventDefault(){}});
 assert.equal(document.body.dataset.fcMainView,"ai");
 assert.equal(location.hash,"#fcAiScoreSection");
 assert.equal(nodes.ai.attributes["aria-current"],"page");
 assert.equal(nodes.today.attributes["aria-current"],undefined);
 nodes.video.actions.click({preventDefault(){}});
 assert.equal(document.body.dataset.fcMainView,"video");
 assert.equal(location.hash,"#fcVideoStudio");
 nodes.previewFrame.actions.click({preventDefault(){}});
 assert.equal(document.body.dataset.fcMainView,"previewFrame");
 assert.equal(location.hash,"#brandPreviewStudio");
 assert.equal(nodes.ai.attributes["aria-current"],undefined);
 nodes.oddsFrame.actions.click({preventDefault(){}});
 assert.equal(document.body.dataset.fcMainView,"oddsFrame");
 assert.equal(location.hash,"#brandOddsStudio");
 assert.equal(nodes.previewFrame.attributes["aria-current"],undefined);
 nodes.news.actions.click({preventDefault(){}});
 assert.equal(document.body.dataset.fcMainView,"news");
 assert.equal(location.hash,"#fcNewsSection");
 assert.equal(nodes.news.attributes["aria-current"],"page");
 nodes.today.actions.click({});
 assert.equal(document.body.dataset.fcMainView,"today");
 assert.equal(location.hash,"");
 nodes.yesterday.actions.click({});
 assert.equal(document.body.dataset.fcMainView,"yesterday");
 location.hash="#fcAiScoreSection";
 callbacks["window-popstate"]();
 assert.equal(document.body.dataset.fcMainView,"ai");
});

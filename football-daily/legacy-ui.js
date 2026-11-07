(function(){
"use strict";
const el=document.documentElement, brand=el.dataset.brand==="goal"?"goal":"main";
const root=el.dataset.root||"../";

const app=document.getElementById("legacyApp"), escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let index=[];
const manifestUrl=root+"data/legacy/index.json";
const param=new URLSearchParams(location.search).get("article");
function formatDate(date){return date+" · Asia/Yangon"}
function mk(tag,attrs={},content){const n=document.createElement(tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(content!==undefined)n.textContent=content;return n}
function linkTo(id){return "?article="+encodeURIComponent(id)}
function posterFor(article){
  return (brand==="main" ? article.posterMain : article.posterGoal) || article.poster || article.photo || "";
}
function downloadText(a){
 const full=a.storyText
   ? [a.seriesTitle,"အပိုင်း ("+a.episode+") — "+a.episodeTitle,a.date,a.storyText.replace(/^###\s+/gm,"").replace(/^\*\*(.*?)\*\*$/gm,"$1").replace(/^\*(.*?)\*$/gm,"$1").replace(/^---$/gm,"")].join("\n\n")
   : [a.title,a.subtitle,a.date,...(a.intro||[]),...(a.sections||[]).flatMap(s=>["",s.heading,...s.paragraphs])].join("\n\n");
 const blob=new Blob(["\uFEFF"+full],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),x=mk("a",{href:url,download:a.date+"-"+a.id+".txt"});
 document.body.append(x);x.click();x.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
}
async function downloadImage(a){
 const imageUrl=posterFor(a);
 if(!imageUrl)throw Error("ပုံဖိုင်မရှိသေးပါ။");
 const fileName=a.date+"-"+a.id+(brand==="main"?"-future-code-football":"-goal-zone-journal")+".png";
 try{
   const response=await fetch(imageUrl,{mode:"cors"});
   if(!response.ok)throw Error("HTTP "+response.status);
   const file=await response.blob();
   if(!file.type.startsWith("image/"))throw Error("Invalid image");
   const blobUrl=URL.createObjectURL(file);
   const link=mk("a",{href:blobUrl,download:fileName});
   document.body.append(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(blobUrl),12000);
 }catch(error){
   const link=mk("a",{href:imageUrl,target:"_blank",rel:"noopener noreferrer"});
   document.body.append(link);link.click();link.remove();
   throw Error("ပုံဖိုင် Download ကို Browser က တိုက်ရိုက်မခွင့်ပြုပါ။ ဖွင့်ထားတဲ့ ပုံကို Save Image နဲ့ သိမ်းနိုင်ပါတယ်။");
 }
}
function button(label,fn,secondaryButton){const b=mk("button",{type:"button",class:"btn"+(secondaryButton?" secondary":"")},label);b.onclick=async()=>{b.disabled=true;const text=b.textContent;b.textContent="ဖန်တီးနေသည်…";try{await fn()}catch(e){alert("Download မအောင်မြင်ပါ: "+e.message)}finally{b.disabled=false;b.textContent=text}};return b}
function renderArticle(a){
 if(a.seriesId&&a.storyText){renderStoryArticle(a);return;}
 document.title=a.title+" | THE LEGACY";
 app.innerHTML="";
 const wrap=mk("article",{class:"reader"}),crumb=mk("a",{class:"crumb",href:"./"},"← THE LEGACY · ဆောင်းပါးအားလုံး");wrap.append(crumb);
 wrap.append(mk("div",{class:"article-kicker"},a.category+" · "+formatDate(a.date)),mk("h1",{},a.title),mk("div",{class:"sub"},a.subtitle));

 const figure=mk("figure",{class:"photo"});
 figure.append(mk("img",{src:posterFor(a),alt:a.title,loading:"eager"}));
 wrap.append(figure);
 const actions=mk("div",{class:"actions"});
 actions.append(button("⬇ ဆောင်းပါးစာသား TXT Download",()=>downloadText(a)),
                button("⬇ Graphic Design ပုံ PNG Download",()=>downloadImage(a),true));
 wrap.append(actions);
 a.intro.forEach(p=>wrap.append(mk("p",{},p)));
 a.sections.forEach((s,i)=>{const chap=mk("section",{class:"chapter"});chap.append(mk("h2",{},String(i+1).padStart(2,"0")+" · "+s.heading));s.paragraphs.forEach(p=>chap.append(mk("p",{},p)));wrap.append(chap)});
 app.append(wrap);
}

function renderStoryArticle(a){
 document.title="အပိုင်း ("+a.episode+") — "+a.episodeTitle+" | "+(brand==="goal"?"ဂိုးဇုံ":"FUTURE CODE FOOTBALL");
 app.innerHTML="";
 const wrap=mk("article",{class:"reader series-reader"});
 const crumb=mk("div",{class:"series-crumbs"});
 crumb.append(mk("a",{href:"./",class:"crumb"},"← THE LEGACY"),mk("a",{href:"?series="+encodeURIComponent(a.seriesId),class:"crumb"},"THE TWO KINGS · အပိုင်းအားလုံး"));
 wrap.append(crumb);
 wrap.append(mk("div",{class:"article-kicker"},"THE LEGACY · အခန်းဆက်ဝတ္ထုရှည် · "+formatDate(a.date)));
 const mast=mk("div",{class:"series-masthead"});
 mast.append(mk("span",{class:"series-label"},"THE TWO KINGS"),mk("h1",{},a.seriesMyanmarTitle||a.seriesTitle),mk("p",{class:"series-episode-title"},"အပိုင်း ("+a.episode+") — "+a.episodeTitle),mk("p",{class:"series-small"},"Cristiano Ronaldo × Lionel Messi · အပိုင်း "+a.episode+"/"+(a.plannedEpisodes||"—")));
 wrap.append(mast);
 const figure=mk("figure",{class:"photo series-poster"});figure.append(mk("img",{src:posterFor(a),alt:a.title,loading:"eager"}));wrap.append(figure);
 const actions=mk("div",{class:"actions"});
 actions.append(button("⬇ အပိုင်း ("+a.episode+") TXT Download",()=>downloadText(a)),button("⬇ Graphic Design ပုံ PNG Download",()=>downloadImage(a),true));
 wrap.append(actions);
 const story=mk("section",{class:"series-story"});
 a.storyText.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean).forEach(block=>{
   if(block.startsWith("### ")){story.append(mk("h2",{},block.slice(4).trim()));return;}
   if(block==="---"){story.append(mk("hr",{class:"story-divider"}));return;}
   let cls="";
   if(/^\*\*[^]*\*\*$/.test(block)){block=block.slice(2,-2);cls="story-emphasis"}
   else if(/^\*[^]*\*$/.test(block)){block=block.slice(1,-1);cls="story-italic"}
   story.append(mk("p",cls?{class:cls}:{},block));
 });
 wrap.append(story);
 const seriesLinks=mk("nav",{class:"series-pagination","aria-label":"အခန်းဆက် ရှေ့နောက်အပိုင်းများ"});
 const episodes=index.filter(x=>x.seriesId===a.seriesId).sort((a,b)=>Number(a.episode)-Number(b.episode));
 const prev=episodes.find(x=>Number(x.episode)===Number(a.episode)-1),next=episodes.find(x=>Number(x.episode)===Number(a.episode)+1);
 if(prev)seriesLinks.append(mk("a",{href:linkTo(prev.id),class:"series-nav-link"},"← အပိုင်း ("+prev.episode+")"));
 else seriesLinks.append(mk("span",{class:"series-pending"},"အခန်းဆက် အစပိုင်း"));
 seriesLinks.append(mk("a",{href:"?series="+encodeURIComponent(a.seriesId),class:"series-nav-link"},"အပိုင်းအားလုံး"));
 if(next)seriesLinks.append(mk("a",{href:linkTo(next.id),class:"series-nav-link"},"အပိုင်း ("+next.episode+") →"));
 else seriesLinks.append(mk("span",{class:"series-pending"},"အပိုင်း ("+(Number(a.episode)+1)+") မတင်ရသေးပါ"));
 wrap.append(seriesLinks);
 app.append(wrap);
}
function renderSeriesIndex(seriesId){
 const episodes=index.filter(a=>a.seriesId===seriesId).sort((a,b)=>Number(a.episode)-Number(b.episode));
 app.innerHTML="";
 if(!episodes.length){app.append(mk("p",{class:"container message"},"အခန်းဆက် မတွေ့ပါ။"));return;}
 const first=episodes[0];
 document.title=first.seriesTitle+" | THE LEGACY";
 const container=mk("div",{class:"container series-collection"});
 container.append(mk("a",{class:"crumb",href:"./"},"← THE LEGACY ဆောင်းပါးမှတ်တမ်း"));
 const header=mk("div",{class:"series-collection-hero"});
 const photo=mk("img",{src:posterFor(first),alt:first.seriesTitle,loading:"eager"});
 const copy=mk("div",{class:"series-collection-copy"});
 copy.append(mk("span",{class:"series-label"},"THE LEGACY · SPECIAL SERIES"),mk("h1",{},first.seriesTitle),mk("p",{},"Cristiano Ronaldo × Lionel Messi — သမိုင်းဖြစ်ရပ်မှန်ပေါ်အခြေခံတဲ့ အခန်းဆက် ဘောလုံးဝတ္ထုရှည်။"),mk("p",{class:"series-small"},"တင်ထားပြီးသောအပိုင်း "+episodes.length+" · အပိုင်းအရေအတွက် "+(first.plannedEpisodes||"—")+" ပိုင်း ရည်ရွယ်ထားသည်"));
 header.append(photo,copy);container.append(header);
 container.append(mk("h2",{},"အခန်းဆက် အပိုင်းများ"));
 const list=mk("div",{class:"series-episode-grid"});
 episodes.forEach(a=>{const link=mk("a",{href:linkTo(a.id),class:"series-episode-card"});
 link.append(mk("div",{class:"series-episode-number"},"EP "+String(a.episode).padStart(2,"0")),mk("h3",{},a.episodeTitle||a.title),mk("p",{},a.summary),mk("span",{class:"series-small"},a.date+" · ဖတ်ရှုရန် →"));list.append(link)});
 container.append(list);
 if(episodes.length<(first.plannedEpisodes||0))container.append(mk("p",{class:"series-pending collection-note"},"နောက်အပိုင်းများကို ထပ်မံတင်ဆက်သွားပါမယ်။ အဟောင်းတွေကို မဖျက်ဘဲ ဒီနေရာမှာ အစဉ်လိုက်ဖတ်နိုင်ပါတယ်။"));
 app.append(container);
}
function renderArchive(){
 document.title="THE LEGACY | ဘောလုံးသမိုင်း";
 app.innerHTML='<div class="container"><div class="archive-top"><h2>ဆောင်းပါးမှတ်တမ်း</h2><span id="legacyCount" class="count"></span></div><div class="filters"><input id="legacySearch" aria-label="ခေါင်းစဉ်ရှာရန်" placeholder="ခေါင်းစဉ်၊ ကစားသမား၊ အသင်း ရှာရန်"><select id="legacyCategory" aria-label="အမျိုးအစား"><option value="">အမျိုးအစားအားလုံး</option></select><select id="legacyDate" aria-label="နေ့စွဲ"><option value="">နေ့စွဲအားလုံး</option></select></div><div class="grid" id="legacyGrid"></div></div>';
 const series=index.filter(a=>a.seriesId).sort((a,b)=>Number(a.episode)-Number(b.episode));
 if(series.length){
  const feature=mk("a",{class:"series-featured",href:"?series="+encodeURIComponent(series[0].seriesId)});
  const cover=mk("img",{src:posterFor(series[0]),alt:series[0].seriesTitle,loading:"lazy"});
  const copy=mk("div",{class:"series-featured-copy"});
  copy.append(mk("span",{class:"series-label"},"THE LEGACY · အခန်းဆက်ဝတ္ထုရှည်"),mk("h3",{},series[0].seriesTitle),mk("p",{},"အပိုင်းတစ်ပိုင်းပြီးတိုင်း နောက်တစ်ပိုင်းဖတ်ချင်စေမယ့် ရော်နယ်ဒို × မက်ဆီ အားပြိုင်မှုဇာတ်လမ်း။"),mk("strong",{},"အပိုင်း "+series.length+" ပိုင်း တင်ထားပြီး · အားလုံးဖတ်ရန် →"));
  feature.append(cover,copy);
  app.querySelector(".archive-top").before(feature);
 }
 const cat=document.getElementById("legacyCategory"),dates=document.getElementById("legacyDate");[...new Set(index.map(a=>a.category))].forEach(s=>cat.append(mk("option",{value:s},s)));[...new Set(index.map(a=>a.date))].sort().reverse().forEach(s=>dates.append(mk("option",{value:s},s)));
 const draw=()=>{const term=document.getElementById("legacySearch").value.trim().toLowerCase(),category=cat.value,date=dates.value;const hits=index.filter(a=>(!term||(a.title+a.subtitle+a.summary+a.category).toLowerCase().includes(term))&&(!category||a.category===category)&&(!date||a.date===date)).sort((a,b)=>b.date.localeCompare(a.date)||a.title.localeCompare(b.title));
 document.getElementById("legacyCount").textContent=hits.length+" ဆောင်းပါး";
 const grid=document.getElementById("legacyGrid");grid.innerHTML="";hits.forEach(a=>{const card=mk("article",{class:"article-card"}),link=mk("a",{href:linkTo(a.id)}),thumbnail=mk("div",{class:"thumb"});thumbnail.append(mk("img",{src:posterFor(a),loading:"lazy",alt:a.title}));link.append(thumbnail);card.append(link);const info=mk("div",{class:"info"});info.append(mk("div",{class:"meta"},formatDate(a.date)+" · "+a.category),mk("h3",{},a.title),mk("p",{},a.summary),mk("a",{class:"link",href:linkTo(a.id)},"ဆောင်းပါးအပြည့်အစုံ ဖတ်ရန် →"));card.append(info);grid.append(card)});if(!hits.length)grid.append(mk("p",{class:"message"},"ဤအမျိုးအစားနှင့် ကိုက်ညီသည့် ဆောင်းပါး မရှိသေးပါ။"));};
 document.querySelectorAll("#legacySearch,#legacyCategory,#legacyDate").forEach(e=>e.addEventListener("input",draw));draw();
}
async function start(){try{const r=await fetch(manifestUrl,{cache:"no-cache"});if(!r.ok)throw Error("Archive HTTP "+r.status);const data=await r.json();index=Array.isArray(data.articles)?data.articles:[];if(param){const match=index.find(a=>a.id===param);if(!match){app.textContent="ဆောင်းပါး မတွေ့ပါ။";return;}if(!/^articles\/[a-z0-9-]+\.json$/.test(match.path))throw Error("Invalid archive path");const page=await fetch(root+"data/legacy/"+match.path,{cache:"no-cache"});if(!page.ok)throw Error("Article HTTP "+page.status);renderArticle(await page.json());}else if(new URLSearchParams(location.search).get("series"))renderSeriesIndex(new URLSearchParams(location.search).get("series"));else renderArchive();}catch(e){app.innerHTML="";app.append(mk("p",{class:"container message"},"ဆောင်းပါးမှတ်တမ်း ရယူမရပါ။ ပြန်လည်ဖွင့်ကြည့်ပါ။ ("+e.message+")"));}}
start();
})();
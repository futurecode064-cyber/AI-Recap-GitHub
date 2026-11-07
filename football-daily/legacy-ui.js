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
function downloadText(a){
 const full=[a.title,a.subtitle,a.date,"ဂိုးဇုံ / FUTURE CODE | THE LEGACY",...a.intro,...a.sections.flatMap(s=>["",s.heading,...s.paragraphs]),"",...a.sources.map(s=>s.title+" — "+s.url)].join("\n\n");
 const blob=new Blob(["\uFEFF"+full],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),x=mk("a",{href:url,download:a.date+"-"+a.id+".txt"});document.body.append(x);x.click();x.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
async function downloadImage(a){
 const imageUrl=a.poster||a.photo;
 if(!imageUrl)throw Error("ပုံဖိုင်မရှိသေးပါ။");
 const fileName=a.date+"-"+a.id+"-goalzone-legacy.png";
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
 document.title=a.title+" | THE LEGACY";
 app.innerHTML="";
 const wrap=mk("article",{class:"reader"}),crumb=mk("a",{class:"crumb",href:"./"},"← THE LEGACY · ဆောင်းပါးအားလုံး");wrap.append(crumb);
 wrap.append(mk("div",{class:"article-kicker"},a.category+" · "+formatDate(a.date)),mk("h1",{},a.title),mk("div",{class:"sub"},a.subtitle));

 const figure=mk("figure",{class:"photo"});
 figure.append(mk("img",{src:a.poster||a.photo,alt:a.title,loading:"eager"}));
 wrap.append(figure);
 const actions=mk("div",{class:"actions"});
 actions.append(button("⬇ ဆောင်းပါးစာသား TXT Download",()=>downloadText(a)),
                button("⬇ Graphic Design ပုံ PNG Download",()=>downloadImage(a),true));
 wrap.append(actions);
 a.intro.forEach(p=>wrap.append(mk("p",{},p)));
 a.sections.forEach((s,i)=>{const chap=mk("section",{class:"chapter"});chap.append(mk("h2",{},String(i+1).padStart(2,"0")+" · "+s.heading));s.paragraphs.forEach(p=>chap.append(mk("p",{},p)));wrap.append(chap)});
 app.append(wrap);
}
function renderArchive(){
 document.title="THE LEGACY | ဘောလုံးသမိုင်း";
 app.innerHTML='<div class="container"><div class="archive-top"><h2>ဆောင်းပါးမှတ်တမ်း</h2><span id="legacyCount" class="count"></span></div><div class="filters"><input id="legacySearch" aria-label="ခေါင်းစဉ်ရှာရန်" placeholder="ခေါင်းစဉ်၊ ကစားသမား၊ အသင်း ရှာရန်"><select id="legacyCategory" aria-label="အမျိုးအစား"><option value="">အမျိုးအစားအားလုံး</option></select><select id="legacyDate" aria-label="နေ့စွဲ"><option value="">နေ့စွဲအားလုံး</option></select></div><div class="grid" id="legacyGrid"></div></div>';
 const cat=document.getElementById("legacyCategory"),dates=document.getElementById("legacyDate");[...new Set(index.map(a=>a.category))].forEach(s=>cat.append(mk("option",{value:s},s)));[...new Set(index.map(a=>a.date))].sort().reverse().forEach(s=>dates.append(mk("option",{value:s},s)));
 const draw=()=>{const term=document.getElementById("legacySearch").value.trim().toLowerCase(),category=cat.value,date=dates.value;const hits=index.filter(a=>(!term||(a.title+a.subtitle+a.summary+a.category).toLowerCase().includes(term))&&(!category||a.category===category)&&(!date||a.date===date)).sort((a,b)=>b.date.localeCompare(a.date)||a.title.localeCompare(b.title));
 document.getElementById("legacyCount").textContent=hits.length+" ဆောင်းပါး";
 const grid=document.getElementById("legacyGrid");grid.innerHTML="";hits.forEach(a=>{const card=mk("article",{class:"article-card"}),link=mk("a",{href:linkTo(a.id)}),thumbnail=mk("div",{class:"thumb"});thumbnail.append(mk("img",{src:a.poster||a.photo,loading:"lazy",alt:a.title}));link.append(thumbnail);card.append(link);const info=mk("div",{class:"info"});info.append(mk("div",{class:"meta"},formatDate(a.date)+" · "+a.category),mk("h3",{},a.title),mk("p",{},a.summary),mk("a",{class:"link",href:linkTo(a.id)},"ဆောင်းပါးအပြည့်အစုံ ဖတ်ရန် →"));card.append(info);grid.append(card)});if(!hits.length)grid.append(mk("p",{class:"message"},"ဤအမျိုးအစားနှင့် ကိုက်ညီသည့် ဆောင်းပါး မရှိသေးပါ။"));};
 document.querySelectorAll("#legacySearch,#legacyCategory,#legacyDate").forEach(e=>e.addEventListener("input",draw));draw();
}
async function start(){try{const r=await fetch(manifestUrl,{cache:"no-cache"});if(!r.ok)throw Error("Archive HTTP "+r.status);const data=await r.json();index=Array.isArray(data.articles)?data.articles:[];if(param){const match=index.find(a=>a.id===param);if(!match){app.textContent="ဆောင်းပါး မတွေ့ပါ။";return;}if(!/^articles\/[a-z0-9-]+\.json$/.test(match.path))throw Error("Invalid archive path");const page=await fetch(root+"data/legacy/"+match.path,{cache:"no-cache"});if(!page.ok)throw Error("Article HTTP "+page.status);renderArticle(await page.json());}else renderArchive();}catch(e){app.innerHTML="";app.append(mk("p",{class:"container message"},"ဆောင်းပါးမှတ်တမ်း ရယူမရပါ။ ပြန်လည်ဖွင့်ကြည့်ပါ။ ("+e.message+")"));}}
start();
})();
"use strict";
const $=id=>document.getElementById(id), LS="fcai.v2.";
const safe=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const getStored=(key,def)=>{try{const x=JSON.parse(localStorage.getItem(LS+key));return x===null?def:x}catch{return def}};
const state={data:null,health:{results:{}},cat:"all",q:"",plan:"all",sort:"recommended",page:1,lang:getStored("lang","my"),favorites:new Set(getStored("favorites",[])),compare:new Set(),collections:getStored("collections",{}),follows:new Set(getStored("follows",[])),route:"browse",tool:null,toastTimeout:null};
function store(k,v){try{localStorage.setItem(LS+k,JSON.stringify(v))}catch{}}
function toast(s){const x=$("toast");x.textContent=s;x.style.display="block";clearTimeout(state.toastTimeout);state.toastTimeout=setTimeout(()=>{x.style.display="none"},4200)}
const label=c=>state.lang==="my"?c.my:c.en;
const category=id=>state.data?.categories.find(x=>x.id===id);
const categoryLabel=id=>{const c=category(id);return c?label(c):id};
const monogram=t=>String(t.name).split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase();
const safeId=id=>/^[a-z0-9-]{1,120}$/.test(id);
const allTools=()=>state.data?.tools||[];
function renderNav(){
 const data=state.data;if(!data)return;
 $("nav").innerHTML='<div class="navtitle">EXPLORE • '+(data.categories.length-1)+' CATEGORIES</div>'+
 data.categories.map(c=>'<button class="'+(state.cat===c.id?"active":"")+'" data-cat="'+safe(c.id)+'"><span>'+safe(c.icon)+' &nbsp;'+safe(label(c))+'</span><em>'+data.tools.filter(t=>c.id==="all"||t.categories.includes(c.id)).length+'</em></button>').join("");
 $("tabs").innerHTML=data.categories.map(c=>'<button class="tab '+(state.cat===c.id?"active":"")+'" data-cat="'+safe(c.id)+'">'+safe(c.icon)+' '+safe(label(c))+'</button>').join("");
}
function searchWords(s){return String(s||"").toLocaleLowerCase().normalize("NFKC").replace(/[\u200b-\u200d]/g," ").trim()}
function getFiltered(){
 const words=searchWords(state.q).match(/"[^"]+"|\S+/g)||[];
 let matches=allTools().filter(t=>{
  if(state.cat!=="all"&&!t.categories.includes(state.cat))return false;
  if(state.plan==="fav"&&!state.favorites.has(t.id))return false;
  if(state.plan==="open-source"&&t.kind!=="open-source")return false;
  if(!["all","fav","open-source"].includes(state.plan)&&t.plan!==state.plan)return false;
  const corpus=searchWords([t.name,t.description,t.descriptionMy||"",t.kind||"",t.repo||"",...(t.categories||[]).map(categoryLabel),...(t.strengths||[])].join(" "));
  return words.every(w=>{
    if(w.startsWith("category:"))return t.categories.some(x=>x.includes(w.slice(9)));
    if(w.startsWith("type:"))return String(t.kind||"").includes(w.slice(5));
    if(w.startsWith("plan:"))return t.plan===w.slice(5);
    return corpus.includes(w.replace(/^"|"$/g,""));
  });
 });
 if(state.sort==="alpha")matches.sort((a,b)=>a.name.localeCompare(b.name));
 else if(state.sort==="score")matches.sort((a,b)=>(b.score||0)-(a.score||0));
 else if(state.sort==="new")matches.sort((a,b)=>(b.sourceReviewedAt||b.updatedAt||"").localeCompare(a.sourceReviewedAt||a.updatedAt||""));
 else{
  const favorites=state.favorites,selectedCats=new Set([...state.favorites].map(id=>allTools().find(t=>t.id===id)).filter(Boolean).flatMap(x=>x.categories));
  matches.sort((a,b)=>{
   const sc=x=>(favorites.has(x.id)?150:0)+x.categories.filter(c=>selectedCats.has(c)).length*13+(x.kind!=="open-source"?25:0)+(x.score||0)*0.3;
   return sc(b)-sc(a);
  });
 }
 return matches;
}
function healthBadge(t){
 const x=state.health?.results?.[t.id];if(!x)return "";
 if(x.status==="ok")return '<span class="linkhealth ok" title="Last checked externally: '+safe(x.checkedAt||"")+'">● Link checked</span>';
 if(x.status==="broken")return '<span class="linkhealth broken" title="External check returned a missing URL; please verify manually">● Link issue</span>';
 return '<span class="linkhealth unknown" title="Automated check inconclusive">● Check pending</span>';
}
function renderCards(){
 if(!state.data)return;
 const rows=getFiltered(),count=rows.length,pageRows=rows.slice(0,state.page*48);
 $("results").textContent=count.toLocaleString()+" tools";
 const grid=$("cards");
 grid.innerHTML=pageRows.length?pageRows.map(t=>{
  const descr=t.descriptionMy&&state.lang==="my"?t.descriptionMy:t.description;
  return '<article class="card"><div class="cardtop"><div class="avatar">'+safe(monogram(t))+'</div><button data-fav="'+safe(t.id)+'" class="heart '+(state.favorites.has(t.id)?"on":"")+'" aria-label="Favorite '+safe(t.name)+'">'+(state.favorites.has(t.id)?"♥":"♡")+'</button></div>'+
  '<h3>'+safe(t.name)+'</h3><p>'+safe(descr)+'</p><div class="tags">'+t.categories.slice(0,3).map(id=>'<span class="tag">'+safe(categoryLabel(id))+'</span>').join("")+'</div>'+
  '<div class="tagline-meta">'+(t.kind==="open-source"?"Open-source • ":"")+(t.plan==="freemium"?"Free + Paid":safe(t.plan))+' '+healthBadge(t)+'</div>'+
  '<div class="cardbottom"><button data-detail="'+safe(t.id)+'">Details ↗</button><a href="'+safe(t.url)+'" target="_blank" rel="noopener noreferrer">Official link ↗</a></div><button class="comparebtn" data-compare="'+safe(t.id)+'">'+(state.compare.has(t.id)?"✓ Compare selected":"＋ Compare")+'</button></article>'
 }).join(""):'<div class="empty">ဒီ Filter နဲ့ ကိုက်ညီတဲ့ Tool မတွေ့ပါ။ Keyword / Category ပြောင်းကြည့်ပါ။</div>';
 const more=document.createElement("div");more.className="loadmore";
 if(pageRows.length<count){more.innerHTML='<button class="primary" data-more="1">Load more ('+(count-pageRows.length).toLocaleString()+' remaining) ↓</button>';grid.after(more)}
 document.querySelectorAll(".loadmore").forEach((e,i)=>{if(i>0)e.remove()});
 $("favCount").textContent=state.favorites.size.toLocaleString();
 $("comparebar").style.display=state.compare.size?"flex":"none";
 $("comparecount").textContent=state.compare.size+" / 3 selected";
}
function refreshBrowse(){
 if(!state.data)return;
 $("toolCount").textContent=state.data.tools.length.toLocaleString();
 $("catCount").textContent=(state.data.categories.length-1);
 $("updated").textContent="Catalog "+safe(state.data.version||"")+" · Updated "+safe(state.data.updatedAt||"");
 $("lang").textContent=state.lang==="my"?"မြန်မာ":"English";
 renderNav();renderCards();
}
function scrollBrowse(){state.route="browse";location.hash="#/browse";showRoute();$("catalog").scrollIntoView({behavior:"smooth"})}
function openModal(markup){$("modalbody").innerHTML=markup;$("modalback").style.display="flex"}
function closeModal(){$("modalback").style.display="none"}
function collectionCount(){return Object.keys(state.collections||{}).length}
function ensureUI(){
 const top=$(".top");const menu=document.createElement("div");menu.className="actionstrip";
 menu.innerHTML='<button data-route="browse">✦ Explore</button><button data-route="recommended">✨ For You</button><button data-route="collections">▣ Collections</button><button data-submit="1">＋ Submit Tool</button><a href="./admin/" title="Owner dashboard and submission moderation">⚙ Admin</a>';
 top.after(menu);
 const bar=$(".toolbar");const row=document.createElement("div");row.className="advbar";
 row.innerHTML='<label>Sort <select id="sorter"><option value="recommended">Recommended</option><option value="score">Source score</option><option value="alpha">Name A–Z</option><option value="new">Recent review</option></select></label>'+
 '<button id="follow" class="followbtn" type="button">＋ Follow category</button><span class="fine">Advanced: type:open-source • category:agents • plan:freemium</span>';
 bar.after(row);
 const f=$("filters");f.innerHTML+='<button data-plan="open-source">Open-source</button>';
 const sec=document.createElement("section");sec.id="routeView";sec.className="routeview";sec.hidden=true;$("catalog").after(sec);
 $("hero").querySelector("p").textContent="Future Code AI Studio ရဲ့ AI Tools Directory — AI Service, Open-source AI Project, Coding, Image, Video, Agent တွေကို Category ၃၀ ထဲမှာ ရှာဖွေ၊ စိစစ်၊ နှိုင်းယှဉ်နိုင်ပါတယ်။";
 const fourth=$(".metrics .metric:last-child");
 if(fourth)fourth.innerHTML='<b style="color:#bbf672">30</b><span>Specialist categories</span>';
 const foot=$(".footer");
 if(foot)foot.innerHTML+='<div class="sourcecredit">Open-source listing data adapted from <a href="https://github.com/archestack/best-of-ai" rel="noopener noreferrer" target="_blank">Archestack Best of AI</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. Entries are source-reviewed; recent link checks are shown separately. No affiliation or endorsement implied.</div>';
}
function showRoute(){
 const hash=decodeURIComponent(location.hash||"#/browse");
 const route=document.getElementById("routeView"),catalog=$("catalog"),hero=$(".hero"),metrics=$(".metrics");
 const view=hash.startsWith("#/tool/")?"tool":hash.startsWith("#/collections")?"collections":hash.startsWith("#/recommended")?"recommended":"browse";
 state.route=view;
 catalog.hidden=view!=="browse";route.hidden=view==="browse";hero.hidden=view!=="browse";metrics.hidden=view!=="browse";
 if(view==="browse"){refreshBrowse();return}
 if(view==="tool"){
  const id=hash.slice("#/tool/".length).split("?")[0];
  const t=allTools().find(x=>x.id===id);
  if(!t){route.innerHTML='<p>Tool Detail မတွေ့ပါ။</p><button class="primary" data-route="browse">Back to tools</button>';return}
  state.tool=t;
  route.innerHTML='<div class="breadcrumbs"><button data-route="browse">← All AI Tools</button> / '+safe(t.categories.map(categoryLabel).join(" · "))+'</div>'+
  '<div class="detailhead"><div class="avatar big">'+safe(monogram(t))+'</div><div><div class="eyebrow">'+safe(t.kind||"AI Tool")+'</div><h1>'+safe(t.name)+'</h1><p>'+safe(t.descriptionMy||t.description)+'</p></div></div>'+
  '<div class="detailcols"><div class="detailsurface"><h2>About this tool</h2><p>'+safe(t.description)+'</p>'+
  (t.descriptionMy?'<h3>မြန်မာဘာသာ ရှင်းလင်းချက်</h3><p>'+safe(t.descriptionMy)+'</p>':"")+
  '<h3>Categories</h3><div class="tags">'+t.categories.map(c=>'<button class="tag categorylink" data-cat="'+safe(c)+'">'+safe(categoryLabel(c))+'</button>').join("")+'</div>'+
  (t.strengths?.length?'<h3>Strengths</h3><ul>'+t.strengths.map(x=>'<li>'+safe(x)+'</li>').join("")+'</ul>':"")+
  (t.weaknesses?.length?'<h3>Things to consider</h3><ul>'+t.weaknesses.map(x=>'<li>'+safe(x)+'</li>').join("")+'</ul>':"")+
  '</div><aside class="detailsurface"><h3>Quick info</h3><p><b>Type:</b> '+safe(t.kind||"web-service")+'</p><p><b>Access:</b> '+safe(t.plan||"check official")+'</p>'+
  (t.license?'<p><b>Source license:</b> '+safe(t.license)+'</p>':"")+
  (t.repo?'<p><b>Repository:</b> '+safe(t.repo)+'</p>':"")+
  '<p><b>Review status:</b> '+safe(t.verification||"not checked")+'</p>'+healthBadge(t)+
  '<a class="primary primarylink" target="_blank" rel="noopener noreferrer" href="'+safe(t.url)+'">Open official page ↗</a>'+
  '<button class="outline outlinewide" data-fav="'+safe(t.id)+'">'+(state.favorites.has(t.id)?"♥ Remove favorite":"♡ Add favorite")+'</button>'+
  '<button class="outline outlinewide" data-add-collection="'+safe(t.id)+'">▣ Add to collection</button>'+
  '<button class="outline outlinewide" data-share="'+safe(t.id)+'">↗ Copy detail link</button>'+
  '<p class="fine">Features, pricing and access may change. Verify on the official page. No affiliation with listed services.</p></aside></div>';
 }
 if(view==="collections")renderCollections();
 if(view==="recommended")renderRecommended();
 document.querySelector("main")?.scrollIntoView({behavior:"instant"});
}
function setRoute(r){location.hash="#/"+r;if(location.hash==="#/"+r)showRoute()}
function showCollectionForm(){
 const names=Object.keys(state.collections);openModal('<h2>Add to collection</h2>'+
 '<p>ကိုယ့် AI Tools စုစည်းမှု ထဲမှာ သိမ်းထားနိုင်ပါတယ်။ စာရင်းကို ဒီ Browser မှာ သိမ်းပါမယ်။</p>'+
 '<label>Choose collection</label><select id="chooseCollection">'+names.map(n=>'<option value="'+safe(n)+'">'+safe(n)+'</option>').join("")+'</select>'+
 '<button class="primary wide" data-confirm-add="1" '+(names.length?"":"disabled")+'>Save tool</button>'+
 '<button class="outline outlinewide" data-create-collection="1">＋ New collection</button>');
}
function newCollection(){
 const name=prompt("Collection နာမည် (1–45 characters):");
 if(name===null)return;const n=name.trim().slice(0,45);
 if(!n){toast("နာမည် လိုအပ်ပါတယ်");return}
 if(Object.prototype.hasOwnProperty.call(state.collections,n)){toast("နာမည်တူ စာရင်း ရှိပြီးပါပြီ");return}
 if(collectionCount()>=80){toast("Collections 80 ခုအထိသာ ဖန်တီးနိုင်ပါတယ်");return}
 state.collections[n]=[];store("collections",state.collections);toast("Collection အသစ် ဖန်တီးပြီး");
 if(state.route==="collections")renderCollections();if($("chooseCollection"))showCollectionForm();
}
function renderCollections(){
 const names=Object.keys(state.collections);
 $("routeView").innerHTML='<div class="routehead"><h1>▣ My AI Collections</h1><p>AI Tools ကို မိမိလိုသလို စုစည်း၊ Import/Export လုပ်နိုင်ပါတယ်။ ဒီ Browser ထဲမှာ သိမ်းဆည်းထားပြီး Account Sync မပါသေးပါ။</p>'+
 '<div class="rowbuttons"><button class="primary" data-create-collection="1">＋ New collection</button><button class="outline" data-export="1">↓ Export JSON</button><button class="outline" data-import="1">↑ Import JSON</button></div></div>'+
 (names.length?'<div class="collectiongrid">'+names.map(n=>'<article class="collectionitem"><h3>▣ '+safe(n)+'</h3><p>'+(state.collections[n]||[]).length+' saved tools</p><div class="tag">'+(state.collections[n]||[]).slice(0,6).map(id=>safe(allTools().find(t=>t.id===id)?.name||id)).join(" · ")+'</div><div class="rowbuttons"><button class="small" data-open-collection="'+safe(n)+'">Open</button><button class="small" data-delete-collection="'+safe(n)+'">Delete</button></div></article>').join("")+'</div>':'<div class="empty">Collection မရှိသေးပါ။ New collection နဲ့ စတင်ပါ။</div>');
}
function openCollection(name){
 const ids=state.collections[name]||[];
 $("routeView").innerHTML='<div class="breadcrumbs"><button data-route="collections">← Collections</button></div><div class="routehead"><h1>▣ '+safe(name)+'</h1><p>'+ids.length+' tools</p><button class="outline" data-export="1">Export all</button></div><div class="collectiongrid">'+(ids.map(id=>allTools().find(t=>t.id===id)).filter(Boolean).map(t=>'<article class="collectionitem"><h3>'+safe(t.name)+'</h3><p>'+safe(t.description)+'</p><div class="rowbuttons"><button class="small" data-detail="'+safe(t.id)+'">View details</button><button class="small" data-remove-from="'+safe(name)+'" data-id="'+safe(t.id)+'">Remove</button></div></article>').join("")||'<div class="empty">ဒီ Collection ထဲ Tool မရှိသေးပါ။</div>')+'</div>';
}
function renderRecommended(){
 const favoriteItems=allTools().filter(t=>state.favorites.has(t.id)||Object.values(state.collections).some(ids=>ids.includes(t.id)));
 const counts={};
 for(const t of favoriteItems)for(const c of t.categories)counts[c]=(counts[c]||0)+1;
 const rows=allTools().filter(t=>!favoriteItems.includes(t)).map(t=>({t,score:(t.kind==="web-service"?6:0)+(t.score||0)/20+t.categories.reduce((n,c)=>n+(counts[c]||0)*20,0)})).sort((a,b)=>b.score-a.score).slice(0,36);
 $("routeView").innerHTML='<div class="routehead"><h1>✨ Smart Recommendations</h1><p>သင့် Favorites နဲ့ Collections အမျိုးအစားတွေကို အခြေခံပြီး Tool တူရာတွေကို ရွေးပြထားပါတယ်။ AI နဲ့ သင့်အကြောင်းကို အပြင် Server ဆီ မပို့ပါ။</p></div>'+
 (favoriteItems.length?"":'<p class="noticebox">Favorites ထဲမှာ AI Tool တွေ သိမ်းထားရင် Recommendation ပိုကိုက်ညီလာမယ်။</p>')+
 '<div class="recommendgrid">'+rows.map(({t})=>'<article class="collectionitem"><div class="avatar">'+safe(monogram(t))+'</div><h3>'+safe(t.name)+'</h3><p>'+safe(t.descriptionMy||t.description)+'</p><div class="rowbuttons"><button class="small" data-detail="'+safe(t.id)+'">Details ↗</button><button class="small" data-fav="'+safe(t.id)+'">♡ Favorite</button></div></article>').join("")+'</div>';
}
function submitTool(){
 openModal('<h2>＋ Submit an AI Tool</h2><p>AI Tool အသစ်ကို Future Code Catalog ထဲ တင်သွင်းဖို့ အကြံပြုနိုင်ပါတယ်။ GitHub Issue ကို ဖွင့်ပြီး ပေးပို့ရမှာဖြစ်လို့ GitHub Account လိုအပ်ပါတယ်။ Submission က public ဖြစ်ပါတယ်။ အတည်မပြုခင် Catalog ထဲ မထည့်ပါ။</p>'+
 '<label>Tool name</label><input id="newToolName" maxlength="120" placeholder="e.g. My AI App">'+
 '<label>Official HTTPS website</label><input id="newToolUrl" placeholder="https://..." type="url">'+
 '<label>Category / Use case</label><input id="newToolCategory" maxlength="120" placeholder="e.g. AI Video">'+
 '<label>Description</label><textarea id="newToolDesc" maxlength="850" rows="3" placeholder="What does it help you do?"></textarea>'+
 '<button class="primary wide" data-submit-github="1">Continue to GitHub ↗</button>');
}
function exportData(){
 const bundle={schemaVersion:1,app:"Future Code AI Tools",favorites:[...state.favorites],collections:state.collections,followedCategories:[...state.follows]};
 const bytes=new Blob([JSON.stringify(bundle,null,2)],{type:"application/json"});
 const u=URL.createObjectURL(bytes),a=document.createElement("a");a.href=u;a.download="future-code-ai-collections.json";a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);
}
function importData(){
 const input=document.createElement("input");input.type="file";input.accept="application/json";input.onchange=async()=>{
  const file=input.files?.[0];if(!file||file.size>150000){toast("JSON ဖိုင် 150 KB အောက်သာ သုံးပါ");return}
  try{
   const doc=JSON.parse(await file.text());
   if(doc.schemaVersion!==1||!doc.collections||typeof doc.collections!=="object"||Array.isArray(doc.collections))throw Error("bad schema");
   const clean={};const allowed=new Set(allTools().map(t=>t.id));
   for(const [name,ids] of Object.entries(doc.collections).slice(0,80)){
     if(typeof name!=="string"||name.length>45||!Array.isArray(ids))continue;
     clean[name]=[...new Set(ids.filter(id=>typeof id==="string"&&allowed.has(id)))].slice(0,1500);
   }
   state.collections=clean;state.favorites=new Set((doc.favorites||[]).filter(id=>allowed.has(id)));
   state.follows=new Set((doc.followedCategories||[]).filter(id=>category(id)));
   store("favorites",[...state.favorites]);store("collections",clean);store("follows",[...state.follows]);
   toast("Collections import ပြီး");if(state.route==="collections")renderCollections();
  }catch{toast("Import JSON format မမှန်ပါ")}
 };input.click();
}
function compare(){
 const items=allTools().filter(t=>state.compare.has(t.id));
 if(!items.length)return;
 openModal('<h2>Compare AI Tools</h2><p>အရောင်းဈေးနှုန်းနဲ့ Feature အတိအကျကို Official Website မှာ စစ်ပါ။</p>'+
 items.map(t=>'<article class="comparison"><h3>'+safe(t.name)+'</h3><p>'+safe(t.descriptionMy||t.description)+'</p><p>Type: '+safe(t.kind||"web-service")+' · '+safe(t.plan||"—")+'</p><div class="tags">'+t.categories.map(c=>'<span class="tag">'+safe(categoryLabel(c))+'</span>').join("")+'</div><a class="primary primarylink" href="'+safe(t.url)+'" target="_blank" rel="noopener noreferrer">Official ↗</a></article>').join(""));
}
function watchRevision(data,news){
 const previous=getStored("lastRevision",null);
 const oldSet=new Set(getStored("seenToolIds",[]));
 if(previous&&previous!==data.revision){
   const added=data.tools.filter(t=>!oldSet.has(t.id));
   const interested=added.filter(t=>t.categories.some(c=>state.follows.has(c)));
   const message=interested.length?("Follow လုပ်ထားတဲ့ Category ထဲမှာ AI Tool "+interested.length+" ခု အသစ်ရှိလာပါတယ်"):news?.message||"AI Tools Catalog Update";
   toast(message);
   if(getStored("notify",false) && "Notification" in window && Notification.permission==="granted" && document.visibilityState==="visible"){
    navigator.serviceWorker?.ready.then(reg=>reg.showNotification("Future Code AI Tools Update",{body:message,icon:"./icon.svg",tag:"fc-ai-tools"})).catch(()=>{});
   }
 }
 store("lastRevision",data.revision);store("seenToolIds",data.tools.map(x=>x.id));
}
async function json(file){const r=await fetch("./"+file+"?stamp="+Date.now(),{cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);return r.json()}
async function loadCatalog(){
 try{
  const data=await json("tools.json");
  if(!Array.isArray(data.tools)||!Array.isArray(data.categories)||!data.revision)throw Error("Invalid catalog");
  let news=null;try{news=await json("updates.json")}catch{}
  const changed=state.data?.revision!==data.revision;
  state.data=data;
  if(changed){watchRevision(data,news);refreshBrowse();showRoute()}
  json("link-health.json").then(status=>{if(status&&typeof status.results==="object"){state.health=status;if(state.route==="browse")renderCards()}}).catch(()=>{});
 }catch(e){if(!state.data){$("cards").innerHTML='<div class="empty">Catalog ဖတ်မရသေးပါ။ Internet ပြန်ရရင် Refresh လုပ်ပါ။</div>';toast("Network connection / cache ကို စစ်ပါ")}}
}
async function enableNotify(){
 if(!("Notification" in window)){toast("ဒီ Browser မှာ Notification မပံ့ပိုးပါ");return}
 try{
 const p=await Notification.requestPermission();
 if(p==="granted"){store("notify",true);toast("🔔 App ဖွင့်ထားချိန် Update Notification ဖွင့်ပြီးပါပြီ");if(navigator.serviceWorker?.ready){navigator.serviceWorker.ready.then(reg=>reg.showNotification("Future Code AI Tools",{body:"Update Alert အတွက် Browser Permission ရပါပြီ",icon:"./icon.svg"})).catch(()=>{})}}
 else toast("Notification ခွင့်ပြုချက်မရပါ");
 }catch{toast("Notification Permission မရပါ")}
}
function clickHandler(e){
 const b=e.target.closest("button");if(!b)return;
 if(b.dataset.route){setRoute(b.dataset.route);return}
 if(b.dataset.cat){state.cat=b.dataset.cat;state.page=1;location.hash="#/browse";refreshBrowse();showRoute();if(innerWidth<1050)$("catalog").scrollIntoView({behavior:"smooth"});return}
 if(b.dataset.plan){state.plan=b.dataset.plan;state.page=1;document.querySelectorAll("[data-plan]").forEach(x=>x.classList.toggle("active",x.dataset.plan===state.plan));renderCards();return}
 if(b.dataset.more){state.page++;renderCards();return}
 if(b.dataset.detail){setRoute("tool/"+b.dataset.detail);return}
 if(b.dataset.fav){const id=b.dataset.fav;state.favorites.has(id)?state.favorites.delete(id):state.favorites.add(id);store("favorites",[...state.favorites]);if(state.route==="browse")renderCards();else showRoute();return}
 if(b.dataset.compare){const id=b.dataset.compare;state.compare.has(id)?state.compare.delete(id):state.compare.size<3?state.compare.add(id):toast("Compare အတွက် ၃ ခုအထိသာ ရွေးနိုင်ပါတယ်");renderCards();return}
 if(b.dataset.share){const url=location.origin+location.pathname+"#/tool/"+b.dataset.share;navigator.clipboard?.writeText(url).then(()=>toast("Tool Link ကို ကူးပြီး")).catch(()=>toast(url));return}
 if(b.dataset.addCollection){state.tool=allTools().find(t=>t.id===b.dataset.addCollection);showCollectionForm();return}
 if(b.dataset.createCollection){newCollection();return}
 if(b.dataset.confirmAdd){
  const name=$("chooseCollection")?.value;
  if(name&&state.tool&&state.collections[name]&&!state.collections[name].includes(state.tool.id)){
   state.collections[name].push(state.tool.id);store("collections",state.collections);closeModal();toast("Collection ထဲသိမ်းပြီး");
  }return
 }
 if(b.dataset.openCollection){openCollection(b.dataset.openCollection);return}
 if(b.dataset.deleteCollection){if(confirm("Collection ကို ဖျက်မလား?")){delete state.collections[b.dataset.deleteCollection];store("collections",state.collections);renderCollections()}return}
 if(b.dataset.removeFrom){state.collections[b.dataset.removeFrom]=(state.collections[b.dataset.removeFrom]||[]).filter(id=>id!==b.dataset.id);store("collections",state.collections);openCollection(b.dataset.removeFrom);return}
 if(b.dataset.export){exportData();return}
 if(b.dataset.import){importData();return}
 if(b.dataset.submit){submitTool();return}
 if(b.dataset.submitGithub){
  const name=$("newToolName")?.value.trim()||"",url=$("newToolUrl")?.value.trim()||"",cat=$("newToolCategory")?.value.trim()||"",desc=$("newToolDesc")?.value.trim()||"";
  try{const u=new URL(url);if(u.protocol!=="https:")throw Error()}catch{toast("HTTPS Official URL မှန်မှန်ထည့်ပါ");return}
  if(name.length<2||!desc){toast("Tool name နဲ့ ရှင်းလင်းချက် လိုအပ်ပါတယ်");return}
  const body="### Official URL\n"+url+"\n\n### Category\n"+cat+"\n\n### Description\n"+desc+"\n\n### Note\nSubmitted from Future Code AI Tools Directory; requires editor review.";
  const issue="https://github.com/futurecode064-cyber/AI-Recap-GitHub/issues/new?title="+encodeURIComponent("[AI Tool Submission] "+name)+"&body="+encodeURIComponent(body);
  window.open(issue,"_blank","noopener,noreferrer");return
 }
}
function init(){
 ensureUI();
 document.addEventListener("click",clickHandler);
 $("search").addEventListener("input",e=>{state.q=e.target.value;state.page=1;if(state.data&&state.route==="browse")renderCards()});
 $("sorter").addEventListener("change",e=>{state.sort=e.target.value;state.page=1;renderCards()});
 $("follow").addEventListener("click",()=>{if(state.cat==="all"){toast("Follow လုပ်မယ့် Category ကို အရင်ရွေးပါ");return}state.follows.has(state.cat)?state.follows.delete(state.cat):state.follows.add(state.cat);store("follows",[...state.follows]);$("follow").textContent=state.follows.has(state.cat)?"✓ Following category":"＋ Follow category";toast("Category Notification preference သိမ်းပြီး")});
 $("lang").addEventListener("click",()=>{state.lang=state.lang==="my"?"en":"my";store("lang",state.lang);refreshBrowse();showRoute()});
 $("explore").addEventListener("click",scrollBrowse);
 $("notify").addEventListener("click",enableNotify);
 $("sideNotify").addEventListener("click",enableNotify);
 $("updates").addEventListener("click",async()=>{try{const u=await json("updates.json");openModal("<h2>✦ What's New</h2><h3>"+safe(u.title)+"</h3><p>"+safe(u.message)+"</p><p>Version "+safe(u.version||"")+"</p>")}catch{toast("Update News မရသေးပါ")}});
 $("close").addEventListener("click",closeModal);
 $("modalback").addEventListener("click",e=>{if(e.target===$("modalback"))closeModal()});
 $("showCompare").addEventListener("click",compare);
 $("clearCompare").addEventListener("click",()=>{state.compare.clear();renderCards()});
 window.addEventListener("hashchange",showRoute);
 window.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("search").focus()}});
 window.addEventListener("focus",()=>{loadCatalog()});
 if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
 setInterval(()=>{if(document.visibilityState==="visible")loadCatalog()},300000);
 loadCatalog();
}
init();

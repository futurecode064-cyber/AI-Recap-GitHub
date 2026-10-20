"use strict";
(function(){
 const section=document.getElementById("fcNewsSection");
 if(!section)return;
 const grid=document.getElementById("fcNewsGrid");
 const filters=document.getElementById("fcNewsFilters");
 const windowNode=document.getElementById("fcNewsWindow");
 const countNode=document.getElementById("fcNewsCount");
 const categories=[
  {id:"all",label:"သတင်းအားလုံး"},
  {id:"international",label:"နိုင်ငံတကာ ဘောလုံးသတင်း"},
  {id:"team-player",label:"အသင်းနှင့် ကစားသမားသတင်း"},
  {id:"transfer",label:"အပြောင်းအရွှေ့ သတင်း"}
 ];
 const escape=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
 let stories=[];let active="all";
 function renderFilters(){
  filters.innerHTML=categories.map(c=>`<button class="fc-news-filter" type="button" data-news-category="${c.id}" aria-pressed="${active===c.id}">${c.label}</button>`).join("");
  filters.querySelectorAll("button").forEach(button=>button.addEventListener("click",()=>{active=button.dataset.newsCategory;renderFilters();renderStories();}));
 }
 function renderStories(){
  const visible=active==="all"?stories:stories.filter(s=>s.category===active);
  countNode.textContent=`${visible.length} ပုဒ်`;
  if(!visible.length){grid.innerHTML='<p class="fc-news-empty">ဒီအမျိုးအစားအတွက် သတင်းမရှိသေးပါ။</p>';return;}
  grid.innerHTML=visible.map(s=>`<article class="fc-news-card">
   <div class="fc-news-image-wrap"><img class="fc-news-image" src="${escape(s.image)}" alt="${escape(s.imageAlt)}" loading="lazy" decoding="async"></div>
   <div class="fc-news-image-caption">သရုပ်ဖော်ပုံ</div>
   <div class="fc-news-card-body"><div class="fc-news-meta"><span class="fc-news-category">${escape(s.categoryLabel)}</span><time class="fc-news-date" datetime="${escape(s.sourceDateISO)}">${escape(s.sourceDateLabel)}</time></div>
    <h3>${escape(s.title)}</h3>${s.paragraphs.map(p=>`<p class="fc-news-copy">${escape(p)}</p>`).join("")}
    <a class="fc-news-source" href="${escape(s.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escape(s.sourceName)} မှ အရင်းအမြစ် ↗</a>
   </div></article>`).join("");
 }
 async function load(){
  try{
   const response=await fetch(section.dataset.newsUrl,{cache:"no-store"});
   if(!response.ok)throw new Error("News feed unavailable");
   const data=await response.json();
   stories=Array.isArray(data.items)?data.items:[];
   windowNode.textContent=data.windowLabel||"ယနေ့ ဘောလုံးသတင်း";
   renderFilters();renderStories();
  }catch(error){grid.innerHTML='<p class="fc-news-status">သတင်းများကို ခဏနေရင် ပြန်ကြည့်ပေးပါ။</p>';windowNode.textContent="သတင်းအချက်အလက် ရယူရန် မအောင်မြင်ပါ။";}
 }
 load();
})();

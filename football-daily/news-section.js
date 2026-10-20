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
  {id:"transfer",label:"အပြောင်းအရွှေ့ သတင်း"},
  {id:"match",label:"ဘောလုံးပွဲ သတင်းနှင့် ရလဒ်"},
  {id:"other",label:"အခြား ဘောလုံးသတင်း"}
 ];
 let stories=[],active="all";
 const node=(tag,text,cls)=>{
  const e=document.createElement(tag);
  if(text!==undefined)e.textContent=text;
  if(cls)e.className=cls;
  return e;
 };
 function renderFilters(){
  filters.replaceChildren();
  for(const category of categories){
   const button=node("button",category.label,"fc-news-filter");
   button.type="button";button.dataset.newsCategory=category.id;
   button.setAttribute("aria-pressed",String(active===category.id));
   button.addEventListener("click",()=>{active=category.id;renderFilters();renderStories();});
   filters.append(button);
  }
 }
 function renderStories(){
  const visible=active==="all"?stories:stories.filter(s=>s.category===active);
  countNode.textContent=visible.length+" ပုဒ်";
  grid.replaceChildren();
  if(!visible.length){grid.append(node("p","ဒီအမျိုးအစားအတွက် သတင်းမရှိသေးပါ။","fc-news-empty"));return;}
  const fragment=document.createDocumentFragment();
  for(const s of visible){
   const card=node("article",undefined,"fc-news-card");
   if(s.image){
    const wrap=node("div",undefined,"fc-news-image-wrap");
    const img=node("img",undefined,"fc-news-image");
    img.src=s.image;img.alt=s.imageAlt||s.title;img.loading="lazy";img.decoding="async";
    img.onerror=()=>wrap.remove();
    wrap.append(img);card.append(wrap);
    if(s.imageCaption)card.append(node("div",s.imageCaption,"fc-news-image-caption"));
   }
   const body=node("div",undefined,"fc-news-card-body");
   const meta=node("div",undefined,"fc-news-meta");
   meta.append(node("span",s.categoryLabel||"ဘောလုံးသတင်း","fc-news-category"));
   const time=node("time",s.sourceDateLabel||s.sourceDateISO||"","fc-news-date");
   if(s.sourceDateISO)time.dateTime=s.sourceDateISO;
   meta.append(time);body.append(meta);
   body.append(node("h3",s.title));
   for(const text of Array.isArray(s.paragraphs)?s.paragraphs:[]){
    body.append(node("p",text,"fc-news-copy"));
   }
   if(s.sourceUrl && /^https:\/\//i.test(s.sourceUrl)){
    const link=node("a",(s.sourceName||"သတင်းရင်းမြစ်")+" ↗","fc-news-source");
    link.href=s.sourceUrl;link.target="_blank";link.rel="noopener noreferrer";body.append(link);
   }else if(s.sourceName){
    body.append(node("span",s.sourceName,"fc-news-source"));
   }
   card.append(body);fragment.append(card);
  }
  grid.append(fragment);
 }
 async function load(){
  try{
   const response=await fetch(section.dataset.newsUrl,{cache:"no-store"});
   if(!response.ok)throw new Error("News feed unavailable");
   const data=await response.json();
   stories=Array.isArray(data.items)?data.items:[];
   windowNode.textContent=data.windowLabel||"နောက်ဆုံး ဘောလုံးသတင်းများ";
   renderFilters();renderStories();
  }catch{
   grid.replaceChildren(node("p","သတင်းများကို ယာယီဖွင့်မရပါ။ နောက်မှ ပြန်ကြည့်ပါ။","fc-news-status"));
   windowNode.textContent="သတင်းအချက်အလက် ရယူရန် မအောင်မြင်ပါ။";
  }
 }
 load();
})();
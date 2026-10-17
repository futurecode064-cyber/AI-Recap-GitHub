"use strict";
/* Future Code MAIN WEBSITE ONLY. Five independent sections.
 * Branded mirror sites do not load this module; shared app.js is unchanged.
 */
(function(){
  if(!["/","/index.html"].includes(location.pathname))return;
  const TODAY_TITLE="ယနေ့ ပွဲကြိုသုံးသပ်ချက်များ";
  const MODE_TO_HASH={ai:"#fcAiScoreSection",video:"#fcVideoStudio"};
  const HASH_TO_MODE={"#fcAiScoreSection":"ai","#fcVideoStudio":"video"};

  function init(){
    const nav=document.getElementById("dateTabs");
    const ai=document.getElementById("fcAiScoreSection");
    const video=document.getElementById("fcVideoStudio");
    const title=document.getElementById("reportHeading");
    if(!nav||!ai||!video||!title||!nav.classList.contains("fc-main-five-nav"))return;
    const previous=nav.querySelector('button[data-day="-1"]');
    const today=nav.querySelector('button[data-day="0"]');
    const videoTab=nav.querySelector(".fc-main-studio-tab");
    const aiTab=nav.querySelector(".fc-main-ai-tab");
    if(!previous||!today||!videoTab||!aiTab)return;

    let view="today";
    const updateTodayTitle=()=>{
      if(view==="today" && title.textContent!==TODAY_TITLE)title.textContent=TODAY_TITLE;
    };
    // The shared legacy app controls yesterday/today headings. Normalize only
    // the MAIN site's today wording, without changing any branded mirrors.
    const headingObserver=new MutationObserver(updateTodayTitle);
    headingObserver.observe(title,{childList:true});

    function show(mode){
      view=["yesterday","today","ai","video"].includes(mode)?mode:"today";
      document.body.dataset.fcMainView=view;
      const selection=[[previous,view==="yesterday"],[today,view==="today"],[videoTab,view==="video"],[aiTab,view==="ai"]];
      for(const [control,on] of selection){
        control.classList.toggle("active",on);
        if(on)control.setAttribute("aria-current",control.tagName==="BUTTON"?"date":"page");
        else control.removeAttribute("aria-current");
      }
      updateTodayTitle();
    }
    function scrollToNav(){
      // New content appears immediately below the five navigation cards.
      // Focus stays on the clicked item; never scroll into hidden panels.
      nav.scrollIntoView({block:"start",behavior:"auto"});
    }
    function navigate(mode,hash){
      if(hash){
        const url=new URL(location.href);
        url.hash=MODE_TO_HASH[mode]||"";
        if(url.href!==location.href)history.pushState(null,"",url.href);
      }
      show(mode);
      scrollToNav();
    }
    previous.addEventListener("click",()=>{
      const url=new URL(location.href);
      if(url.hash){url.hash="";history.replaceState(null,"",url.href);}
      show("yesterday");
    });
    today.addEventListener("click",()=>{
      const url=new URL(location.href);
      if(url.hash){url.hash="";history.replaceState(null,"",url.href);}
      show("today");
    });
    videoTab.addEventListener("click",event=>{
      event.preventDefault();navigate("video",true);
    });
    aiTab.addEventListener("click",event=>{
      event.preventDefault();navigate("ai",true);
    });
    function route(){
      const mode=HASH_TO_MODE[location.hash]||"today";
      show(mode);
      if(mode!=="today")requestAnimationFrame(scrollToNav);
    }
    window.addEventListener("popstate",route);
    window.addEventListener("hashchange",route);
    route();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();

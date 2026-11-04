/* Future Code APK website announcement. This is an on-page notice, not browser push. */
(function () {
  "use strict";
  var release = "20261104";
  var brands = {
    "future-code-journal": {name:"ဂိုးဇုံ အားကစားဂျာနယ်",version:"1.0.5",accent:"#eecb79"},
    "ykz-family": {name:"YKZ FAMILY",version:"1.2.3",accent:"#ff7070"},
    "bw-sport": {name:"BW SPORT",version:"1.0.4",accent:"#73d8ff"},
    "ko-thet-family": {name:"KO THET FAMILY",version:"1.0.5",accent:"#e9bc7c"},
    "kmm-sport-hub": {name:"KMM SPORT HUB",version:"1.0.4",accent:"#71e0c5"}
  };
  var slug = location.pathname.split("/").filter(Boolean)[0];
  var brand = brands[slug];
  if (!brand) return;
  var key = "fc-website-announcement:" + slug + ":" + release + ":" + brand.version;
  try { if (sessionStorage.getItem(key) === "dismissed") return; } catch (_) {}
  function start(){
    if (!document.body || document.getElementById("fc-apk-website-announcement")) return;
    var wrapper = document.createElement("div");
    wrapper.id = "fc-apk-website-announcement";
    var card = document.createElement("section");
    card.className = "fc-apk-ann-card";
    card.setAttribute("role","dialog");
    card.setAttribute("aria-modal","true");
    card.setAttribute("aria-labelledby","fc-apk-announcement-heading");
    card.style.setProperty("--fc-ann-accent",brand.accent);
    card.innerHTML = [
      '<button class="fc-ann-close" type="button" aria-label="အသိပေးချက်ပိတ်ရန်">×</button>',
      '<span class="fc-ann-pill">NOVEMBER 04, 2026 · APK UPDATE</span>',
      '<h2 class="fc-ann-title" id="fc-apk-announcement-heading">🎉 APK Version အသစ် Download ရယူနိုင်ပါပြီ!</h2>',
      '<p class="fc-ann-brand"></p>',
      '<p class="fc-ann-intro">Notification နှင့် Gallery ပုံသိမ်းစနစ်များ ပါဝင်တဲ့ Version အသစ်ကို ရယူနိုင်ပါပြီ။</p>',
      '<ul class="fc-ann-features">',
      '<li>ဘောလုံးပွဲကြိုနှင့် ပေါက်ကြေး Data အသစ်တင်ပြီးချိန် Notification အသိပေးနိုင်ရန် ပြင်ဆင်ထားသည်</li>',
      '<li>ပွဲကြိုပုံ၊ ပေါက်ကြေးပုံနှင့် ရလဒ်ပုံများကို ဖုန်း Gallery ထဲ သိမ်းနိုင်ရန် ပြင်ဆင်ထားသည်</li>',
      '<li>App ဖွင့်ချိန် လိုအပ်တဲ့ Notification/Storage ခွင့်ပြုချက်များ တောင်းခံနိုင်သည်</li>',
      '</ul>',
      '<a class="fc-ann-download" href="#">⬇ APK Version အသစ် Download ရယူရန်</a>',
      '<button class="fc-ann-later" type="button">နောက်မှ ကြည့်မယ်</button>',
      '<p class="fc-ann-footnote">APK မသွင်းရသေးလည်း Website ဖွင့်ချိန် ဒီအသိပေးချက်ကို မြင်ရပါမယ်။ App Notification အလုပ်လုပ်ရန် Install နှင့် ဖုန်းခွင့်ပြုချက် လိုအပ်ပါတယ်။</p>'
    ].join("");
    card.querySelector(".fc-ann-brand").textContent=brand.name+" · v"+brand.version;
    var download=card.querySelector(".fc-ann-download");
    download.href="/"+slug+"/android/";
    var previous=document.activeElement;
    var closed=false;
    function close(){
      if(closed)return;closed=true;
      try{sessionStorage.setItem(key,"dismissed")}catch(_){}
      document.removeEventListener("keydown",onKey);
      wrapper.remove();
      if(previous&&typeof previous.focus==="function")previous.focus();
    }
    var closeButton=card.querySelector(".fc-ann-close");
    var later=card.querySelector(".fc-ann-later");
    function onKey(event){
      if(event.key==="Escape"){event.preventDefault();close()}
      if(event.key==="Tab"){
        var fields=[closeButton,download,later],index=fields.indexOf(document.activeElement);
        if(event.shiftKey&&index<=0){event.preventDefault();later.focus()}
        else if(!event.shiftKey&&index===fields.length-1){event.preventDefault();closeButton.focus()}
      }
    }
    closeButton.addEventListener("click",close);
    later.addEventListener("click",close);
    download.addEventListener("click",function(){try{sessionStorage.setItem(key,"dismissed")}catch(_){}});
    wrapper.addEventListener("click",function(event){if(event.target===wrapper)close()});
    wrapper.appendChild(card);
    document.body.appendChild(wrapper);
    document.addEventListener("keydown",onKey);
    closeButton.focus();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();

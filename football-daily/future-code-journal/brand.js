"use strict";
(function(){
 const root=document.documentElement;
 root.classList.add("fcj-theme");
 const logo=new URL("./assets/logo.webp",document.baseURI).href;
 root.dataset.footballBrandName="FUTURE CODE နေ့စဉ် ဘောလုံးဂျာနယ်";
 root.dataset.footballBrandLogoUrl=logo;
 window.FutureCodeBrandConfig=Object.freeze({
  id:"future-code-journal",name:"FUTURE CODE နေ့စဉ် ဘောလုံးဂျာနယ်",slogan:"",
  logoUrl:logo,dataRoot:new URL("../data/",document.baseURI).href,
  colors:{primary:"#852d9d",electric:"#65efd1",gold:"#ead69a",background:"#130f20",panel:"#261b34",border:"#754e87",text:"#f8f3ff"}
 });
})();
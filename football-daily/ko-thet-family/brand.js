"use strict";
(function(){
 const root=document.documentElement;
 root.classList.add("ktf-theme");
 const logo=new URL("./assets/logo.webp?v=ktf-20261013",document.baseURI).href;
 root.dataset.footballBrandName="Ko Thet Family ဘောလုံးဂျာနယ်";
 root.dataset.footballBrandSlogan="ဘောလုံးဂျာနယ်";
 root.dataset.footballBrandLogoUrl=logo;
 // Each branded microsite shares the same root fixture/report/odds archive.
 window.FutureCodeBrandConfig=Object.freeze({
  id:"ko-thet-family", name:"Ko Thet Family ဘောလုံးဂျာနယ်", slogan:"ဘောလုံးဂျာနယ်",
  logoUrl:logo, dataRoot:new URL("../data/",document.baseURI).href,
  colors:{primary:"#8b0b11",darkRed:"#460005",gold:"#f8cf4b",black:"#11090c",
          background:"#13080c",panel:"#2c1417",border:"#ac7a3d",text:"#fff4de"}
 });
})();

"use strict";
(function(){
 const root=document.documentElement;
 root.classList.add("ykz-theme");
 const logo=new URL("./assets/logo.webp",document.baseURI).href;
 root.dataset.footballBrandName="YKZ FAMILY GROUP";
 root.dataset.footballBrandSlogan="ရှေ့ဆက် YKZ";
 root.dataset.footballBrandLogoUrl=logo;
 // Each branded microsite shares the same root fixture/report/odds archive.
 window.FutureCodeBrandConfig=Object.freeze({
  id:"ykz-family", name:"YKZ FAMILY GROUP", slogan:"ရှေ့ဆက် YKZ",
  logoUrl:logo, dataRoot:new URL("../data/",document.baseURI).href,
  colors:{primary:"#bb2036",darkRed:"#781728",gold:"#ffcb66",navy:"#17203e",
          background:"#130f1a",panel:"#281721",border:"#64404b",text:"#fff6eb"}
 });
})();

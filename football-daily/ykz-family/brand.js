"use strict";
(function(){
 const root=document.documentElement;
 root.classList.add("ykz-theme");
 const logo=new URL("./assets/logo.webp",document.baseURI).href;
 root.dataset.footballBrandName="YKZ FAMILY GROUP";
 root.dataset.footballBrandSlogan="အတူရှေ့ဆက် YKZ";
 root.dataset.footballBrandLogoUrl=logo;
 // Each branded microsite shares the same root fixture/report/odds archive.
 window.FutureCodeBrandConfig=Object.freeze({
  id:"ykz-family", name:"YKZ FAMILY GROUP", slogan:"အတူရှေ့ဆက် YKZ",
  logoUrl:logo, dataRoot:new URL("../data/",document.baseURI).href,
  colors:{primary:"#e00000",darkRed:"#960000",gold:"#ffcf58",black:"#111111",
          background:"#111111",panel:"#202020",border:"#772222",text:"#fff9ed"}
 });
})();

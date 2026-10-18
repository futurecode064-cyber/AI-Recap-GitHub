"use strict";
(function(){
 const root=document.documentElement;
 root.classList.add("fcj-theme");
 const logo=new URL("./assets/logo.webp",document.baseURI).href;
 root.dataset.footballBrandName="FUTURE CODE အားကစား ဂျာနယ်";
 root.dataset.footballBrandLogoUrl=logo;
 root.dataset.footballBrandArtworkUrl=new URL("./assets/football-gold-stadium.webp",document.baseURI).href;
 window.FutureCodeBrandConfig=Object.freeze({
  id:"future-code-journal",name:"FUTURE CODE အားကစား ဂျာနယ်",slogan:"",
  logoUrl:logo,dataRoot:new URL("../data/",document.baseURI).href,
  colors:{primary:"#b58a35",electric:"#f0ce78",gold:"#e8bd62",background:"#090909",panel:"#181714",border:"#6f582f",text:"#fff8e8"}
 });
})();
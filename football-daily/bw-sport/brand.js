"use strict";
(function(){
 const root=document.documentElement;
 root.classList.add("bw-theme");
 const logo=new URL("./assets/logo.webp?v=no-tagline-20261013",document.baseURI).href;
 root.dataset.footballBrandName="BW SPORT ဘောလုံးဂျာနယ်";
 root.dataset.footballBrandLogoUrl=logo;
 // All group sites share the original verified football data, history and odds.
 window.FutureCodeBrandConfig=Object.freeze({
  id:"bw-sport",name:"BW SPORT ဘောလုံးဂျာနယ်",slogan:"",
  logoUrl:logo,dataRoot:new URL("../data/",document.baseURI).href,
  colors:{primary:"#117cf4",electric:"#35bbff",silver:"#dceeff",navy:"#07162e",
   background:"#060f22",panel:"#0d2344",border:"#2867a2",text:"#edf5ff"}
 });
})();

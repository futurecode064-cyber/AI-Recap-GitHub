"use strict";
(function(){
 const root=document.documentElement;
 root.classList.add("kmm-theme");
 const logo=new URL("./assets/logo.webp",document.baseURI).href;
 const artwork=new URL("../future-code-journal/assets/football-gold-stadium.webp",document.baseURI).href;
 root.dataset.footballBrandName="KMM Sport Hub";
 root.dataset.footballBrandSlogan="FOOTBALL · MATCHDAY · INSIGHTS";
 root.dataset.footballBrandLogoUrl=logo;
 root.dataset.footballBrandArtworkUrl=artwork;
 window.FutureCodeBrandConfig=Object.freeze({
  id:"kmm-sport-hub",name:"KMM Sport Hub",slogan:"FOOTBALL · MATCHDAY · INSIGHTS",
  logoUrl:logo,artworkUrl:artwork,dataRoot:new URL("../data/",document.baseURI).href,
  colors:{primary:"#d30000",darkRed:"#710000",gold:"#f3c65a",electric:"#f3c65a",
   black:"#090605",background:"#0e0706",panel:"#220b06",border:"#98712e",text:"#fff3d9"}
 });
})();

"use strict";
(function(){
 const root=document.documentElement;
 root.classList.add("fcj-theme");
 const logo=new URL("./logo.svg",document.baseURI).href;
 root.dataset.footballBrandName="GOAL ZONE JOURNAL";
 root.dataset.footballBrandLogoUrl=logo;
 root.dataset.footballBrandArtworkUrl=new URL("../future-code-journal/assets/football-gold-stadium.webp",document.baseURI).href;
 window.FutureCodeBrandConfig=Object.freeze({
  id:"future-code-journal",name:"GOAL ZONE JOURNAL",slogan:"",
  logoUrl:logo,dataRoot:new URL("../data/",document.baseURI).href,
  colors:{primary:"#b58a35",electric:"#f0ce78",gold:"#e8bd62",background:"#090909",panel:"#181714",border:"#6f582f",text:"#fff8e8"}
 });
})();
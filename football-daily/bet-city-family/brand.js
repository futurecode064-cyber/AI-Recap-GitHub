"use strict";
(function(){
  const root=document.documentElement;
  root.classList.add("bcf-theme");
  const logo="./assets/logo.png";
  root.dataset.footballBrandName="Bet City Family ဘောလုံးဂျာနယ်";
  root.dataset.footballBrandSlogan="PAING FAMILY GROUP · BET CITY FAMILY";
  root.dataset.footballBrandLogoUrl=new URL(logo,document.baseURI).href;
  root.dataset.footballBrandArtworkUrl=new URL("./assets/footballers.svg",document.baseURI).href;
  window.FutureCodeBrandConfig=Object.freeze({
    id:"bet-city-family",
    name:"Bet City Family ဘောလုံးဂျာနယ်",
    slogan:"PAING FAMILY GROUP",
    logoUrl:new URL(logo,document.baseURI).href,
    artworkUrl:new URL("./assets/footballers.svg",document.baseURI).href,
    dataRoot:new URL("../data/",document.baseURI).href,
    colors:{primary:"#0639c3",darkRed:"#01115c",gold:"#f7c64f",electric:"#31baff",
       black:"#01092b",background:"#020c36",panel:"#071957",border:"#5277d6",text:"#f9fbff"}
  });
})();
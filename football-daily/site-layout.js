"use strict";
/* Future Code Website Builder pages only. Existing client brands are untouched. */
(function(){
document.addEventListener("DOMContentLoaded",function(){
 const cfg=window.FutureCodeSiteBuilder;
 if(!cfg||!Array.isArray(cfg.sections))return;
 const main=document.querySelector("main"),original=main?.querySelector(".content");
 if(!main||!original)return;
 const unit=(className)=>{const s=document.createElement("section");s.className=className;return s};
 const blocks={};
 blocks.hero=main.querySelector(".hero");
 blocks.dashboard=unit("content container sb-dashboard");
 blocks.tabs=unit("content container sb-tabs");
 blocks.matches=unit("content container sb-matches");
 const selectors={dashboard:[".dashboard-bar"],tabs:["#dateTabs"],matches:[".section-heading","#filters","#sectionNote","#resultsDownloadBar","#matchList"]};
 for(const [key,values] of Object.entries(selectors))for(const selector of values){const e=original.querySelector(selector);if(e)blocks[key].append(e)}
 const makeBanner=(type)=>{
   const s=unit("container sb-banner");const local=cfg.assets?.[type];
   if(!local)return s;
   const img=document.createElement("img");img.src=new URL(local,document.baseURI).href;img.alt=type==="topBanner"?"Top Banner":"Bottom Banner";
   const link=type==="topBanner"?cfg.topLink:cfg.bottomLink;
   if(link&&/^https:\/\//i.test(link)){const a=document.createElement("a");a.href=link;a.rel="noopener noreferrer";a.target="_blank";a.append(img);s.append(a)}else s.append(img);
   return s;
 };
 blocks.topBanner=makeBanner("topBanner");blocks.bottomBanner=makeBanner("bottomBanner");
 blocks.custom=unit("content container sb-custom");
 if(cfg.customTitle){const h=document.createElement("h2");h.textContent=cfg.customTitle;blocks.custom.append(h)}
 if(cfg.customText){const p=document.createElement("p");p.textContent=cfg.customText;blocks.custom.append(p)}
 blocks.social=unit("content container sb-social");
 for(const [id,label] of [["facebook","Facebook"],["tiktok","TikTok"],["telegram","Telegram"]]){
   const link=cfg.social?.[id];if(!link||!/^https:\/\//i.test(link))continue;
   const a=document.createElement("a");a.href=link;a.target="_blank";a.rel="noopener noreferrer";a.textContent=label;blocks.social.append(a);
 }
 // Preserve all app selectors and data nodes, even when sections are hidden.
 for(const section of cfg.sections){
   const block=blocks[section.id];if(!block)continue;
   if(!section.enabled)block.hidden=true;
   main.append(block);
 }
 original.remove();
 const heading=document.querySelector(".hero h1");if(heading&&cfg.title)heading.textContent=cfg.title;
 const intro=document.querySelector(".hero-desc");if(intro&&cfg.description)intro.textContent=cfg.description;
 const slogan=document.querySelector(".ykz-hero-slogan");if(slogan)slogan.textContent=cfg.slogan||"";
 const footer=document.querySelector("footer");if(footer){
  const strong=footer.querySelector("strong");if(strong)strong.textContent=cfg.name;
  const p=footer.querySelector("p");if(p)p.textContent=cfg.footerText||cfg.slogan;
 }
 document.documentElement.style.setProperty("--sb-font-multiplier",cfg.fontSize==="extra"?"1.18":cfg.fontSize==="large"?"1.09":"1");
});
})();

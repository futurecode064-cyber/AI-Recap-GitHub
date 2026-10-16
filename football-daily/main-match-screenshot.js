"use strict";
/*
 * Fast, main-site-only article PNG download.
 * The first DOM screenshot prototype re-serialized the whole CSS and remote
 * fonts, and could stay on "Preparing PNG" for an unbounded period.
 * Use the existing bounded native Canvas renderer instead.
 *
 * Other branded pages never load this override. They keep their original
 * export function, poster styling and brand palettes.
 */
(function(){
  if(document.documentElement.hasAttribute("data-football-brand-name"))return;
  const exporter=window.FutureCodeCardExport;
  if(!exporter||typeof exporter.save!=="function")return;
  const nativeSave=exporter.save;

  function safeName(value){
    return String(value||"match").normalize("NFC")
      .replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g,"-")
      .replace(/\s+/g," ").trim().slice(0,64)||"match";
  }

  exporter.save=async function(match,opts={}){
    // Batch ZIP and other consumers keep the unchanged native renderer.
    if(!opts.cardNode)return nativeSave.call(exporter,match,opts);
    const fileName="ပွဲကြိုသုံးသပ်ချက် - "+
      safeName(match?.home||"အိမ်ရှင်")+" vs "+
      safeName(match?.away||"ဧည့်သည်")+".png";

    // Native Canvas draws ONLY the isolated match card:
    // club crests, fixtures, WDL, bookmaker odds, Myanmar prices,
    // and unabridged commentary. No website wallpaper, button or
    // read/collapse toggle. Never invoke the slow DOM serializer.
    return nativeSave.call(exporter,match,{
      ...opts,
      mainScreenshot:true,
      downloadFilename:fileName
    });
  };
})();

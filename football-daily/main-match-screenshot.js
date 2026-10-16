"use strict";
/*
 * Main Future Code Football only:
 * Save the actual on-screen match article (not a repainted poster).
 * The shared app.js supplies opts.cardNode for a single-match download.
 * Branded site entrypoints do not load this module; their Canvas exports remain unchanged.
 */
(function(){
  if(document.documentElement.hasAttribute("data-football-brand-name"))return;
  const exporter=window.FutureCodeCardExport;
  if(!exporter||typeof exporter.save!=="function")return;
  const canvasSave=exporter.save;

  function safeFilenamePart(value){
    // Keep Burmese club names readable while excluding forbidden filename characters.
    return String(value||"match").normalize("NFC")
      .replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g,"-")
      .replace(/\s+/g," ").trim().slice(0,75)||"match";
  }

  exporter.save=async function(match,opts={}){
    // Preserve other call sites (including any programmatic Canvas exports).
    const card=opts.cardNode;
    if(!card||!card.isConnected)return canvasSave.call(exporter,match,opts);
    if(!card.classList||!card.classList.contains("match-card"))
      throw Error("A match preview card is required for a screenshot.");
    if(!window.FutureCodeDomCapture||!window.domtoimage)
      throw Error("The local match screenshot exporter did not load.");

    const filename="ပွဲကြိုသုံးသပ်ချက် - "+
      safeFilenamePart(match?.home||"အိမ်ရှင်")+" vs "+
      safeFilenamePart(match?.away||"ဧည့်သည်")+".png";

    // Clone only this match card.  The snapshot helper removes all buttons,
    // expands the entire commentary, and uses a transparent outer background.
    // The teal/orange card panels keep their native styles for readability.
    return window.FutureCodeDomCapture.save(card,filename,{
      background:"transparent",
      excludeControls:true
    });
  };
})();

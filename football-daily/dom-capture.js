"use strict";
/* Capture the real, CSS-styled DOM. We do not repaint match details on canvas. */
(function(){
 async function save(node,filename,{width,background="#111d22",excludeControls=true}={}){
  if(!node||!window.domtoimage||typeof window.domtoimage.toBlob!=="function")throw Error("DOM image exporter is unavailable.");
  if(document.fonts?.ready)await document.fonts.ready;
  const box=node.getBoundingClientRect();
  const w=Math.ceil(width||box.width||node.scrollWidth);
  if(!(w>0))throw Error("Nothing is visible to export");
  // The staging node is laid out in the real document so computed CSS,
  // media queries and image sizing are identical to the website.
  // Do not use display:none: hidden DOM cannot be rasterized correctly.
  const stage=document.createElement("div");
  stage.className="football-snapshot-stage";
  stage.style.cssText="position:fixed;left:-20000px;top:0;z-index:-9999;pointer-events:none;box-sizing:border-box;overflow:visible;background:"+background+";width:"+w+"px;";
  const clone=node.cloneNode(true);
  clone.removeAttribute("id");
  clone.style.boxSizing="border-box";
  clone.style.width="100%";
  clone.style.maxWidth="none";
  clone.style.margin="0";
  // Downloaded match poster should contain the full written analysis, even
  // when the reader has currently folded the on-screen expansion control.
  if(excludeControls){
   clone.querySelectorAll(".match-actions,.analysis-toggle,.match-download,.social-export-actions,button,select").forEach(e=>e.remove());
   clone.querySelectorAll(".analysis-body,.special-analysis").forEach(e=>{
     e.hidden=false;e.style.display="block";e.style.maxHeight="none";
   });
  }
  stage.appendChild(clone);
  document.body.appendChild(stage);
  try{
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   const height=Math.ceil(Math.max(clone.scrollHeight,clone.getBoundingClientRect().height));
   if(!height||height>30000)throw Error("Image exceeds browser export height limit");
   // Vendor is local, so the export script works without a third-party CDN.
   // Dom-to-image clones computed styles and embeds visible images/fonts.
   const blob=await window.domtoimage.toBlob(clone,{
     bgcolor:background,width:w,height,cacheBust:true,
     imagePlaceholder:"data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
   });
   if(!blob||blob.size===0)throw Error("DOM PNG could not be produced");
   const href=URL.createObjectURL(blob);
   const a=document.createElement("a");
   a.download=filename;a.href=href;document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(href),60000);
   return true;
  }finally{stage.remove()}
 }
 function appendHeading(stage,title,sub){
  const heading=document.createElement("div");heading.className="snapshot-heading";
  const h=document.createElement("h2");h.textContent=title;heading.appendChild(h);
  if(sub){const p=document.createElement("p");p.textContent=sub;heading.appendChild(p)}
  stage.appendChild(heading);
 }
 window.FutureCodeDomCapture={save,appendHeading};
})();

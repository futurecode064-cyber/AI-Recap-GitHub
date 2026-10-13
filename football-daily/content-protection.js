"use strict";
/* Read-only football publication UI: deter casual copying, not a DRM guarantee.
   Protect visible editorial content while keeping all forms, navigation, buttons,
   share controls, accessibility and PNG download functions operational. */
(function(){
  const html=document.documentElement;
  if(!html || html.classList.contains("football-copy-guard"))return;
  html.classList.add("football-copy-guard");
  const editableSelector='input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]';
  function isEditable(target){
    if(!target)return false;
    const el=target.nodeType===3?target.parentElement:target;
    if(!el)return false;
    return !!(el.isContentEditable || (typeof el.closest==="function" && el.closest(editableSelector)));
  }
  function blockOutsideEditor(event){
    if(isEditable(event.target))return;
    if(event.cancelable!==false)event.preventDefault();
  }
  // Browser copy menu / context menu and Android/iOS press-and-hold selection.
  document.addEventListener("copy",blockOutsideEditor,true);
  document.addEventListener("cut",blockOutsideEditor,true);
  document.addEventListener("contextmenu",blockOutsideEditor,true);
  document.addEventListener("selectstart",blockOutsideEditor,true);
  // Keyboard copy shortcuts on Windows, macOS and supported browsers.
  document.addEventListener("keydown",function(event){
    if(isEditable(event.target))return;
    const key=String(event.key||"").toLowerCase();
    if(((event.ctrlKey||event.metaKey) && (key==="c" || key==="insert")) ||
       (event.ctrlKey && key==="insert")){
      if(event.cancelable!==false)event.preventDefault();
    }
  },true);
})();

'use strict';
// The same lesson/tool pages run in the Android shell and the student web portal.
window.FCNav=(()=>{
 const native=location.hostname==='appassets.futurecode.local';
 if(native&&window.FutureCodeNative)window.print=()=>window.FutureCodeNative.printPage();
 function open(route,{fresh=false}={}){
  if(!/^(home|lessons|editor|help\/(image|video|recap))$/.test(route))return;
  if(native){location.href='app://'+route;return}
  if(window.parent!==window){window.parent.postMessage({type:'future-code-navigation',route,fresh},location.origin);return}
  location.replace(new URL('../../student/?section='+encodeURIComponent(route),location.href));
 }
 if(!native){
  let allowed=false;
  try{allowed=window.parent!==window&&window.parent.FutureCodePortal?.isContentAllowed(location.href)===true}catch{}
  if(!allowed){
   const name=location.pathname.split('/').pop(),map={
    'academy-advanced.html':'future','academy.html':'future','pro-video-guide.html':'lessons',
    'ai-apps-download.html':'downloads','ai-directory.html':'tools','document-studio.html':'documents',
    'image-studio.html':'image-studio','video-maker.html':'video-maker','media-editor.html':new URLSearchParams(location.search).get('mode')==='edit'?'editor':'recap',
    'lesson-videos.html':'lesson-videos','studio-help.html':'help/'+(new URLSearchParams(location.search).get('tool')||'recap')
   };
   location.replace(new URL('../../student/?section='+encodeURIComponent(map[name]||'home'),location.href));
  }
 }
 document.addEventListener('click',e=>{
  const a=e.target.closest?.('a[href^="app://"]');
  if(a){e.preventDefault();open(a.getAttribute('href').slice(6))}
 });
 return {open,native};
})();

"use strict";
/* Shared football-app image save contract. Daily JSON never changes this transport. */
(function () {
  const brands=["ykz-family","bw-sport","ko-thet-family","kmm-sport-hub","future-code-journal","bet-city-family"];
  if(!brands.includes(location.pathname.split("/")[1])||window.FutureCodeImageSave)return;
  function nativeBridge() {
    if (window.FCJournalNative && typeof window.FCJournalNative.save === "function")
      return {name: "FCJournalNative", object: window.FCJournalNative, args: 2};
    if (window.YKZNative && typeof window.YKZNative.save === "function")
      return {name: "YKZNative", object: window.YKZNative, args: 3};
    return null;
  }
  function notice(message, failed) {
    let box = document.getElementById("fcImageSaveStatus");
    if (!box) {
      box = document.createElement("p"); box.id = "fcImageSaveStatus";
      box.setAttribute("role", "status"); box.setAttribute("aria-live", "polite");
      box.style.cssText = "position:fixed;z-index:2147483647;left:16px;right:16px;bottom:20px;margin:0;padding:14px 18px;border:1px solid #ffcf58;border-radius:12px;background:#202020;color:#fff9ed;font:600 14px/1.9 sans-serif;box-shadow:0 4px 20px #0008";
      box.onclick = () => {box.hidden = true;}; document.body.appendChild(box);
    }
    box.hidden = false; box.textContent = message;
    box.style.borderColor = failed ? "#ff6868" : "#ffcf58";
  }
  let sequence=0;
  function nativeFilename(filename,mime){
    const ext=mime==="image/jpeg"?"jpg":mime==="image/webp"?"webp":mime==="image/gif"?"gif":"png";
    const stem=String(filename||"image").split(/[\\/]/).pop().replace(/\.[^.]*$/,"").normalize("NFKD").replace(/[^a-zA-Z0-9_-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,64)||"image";
    return location.pathname.split("/")[1]+"-"+stem+"-"+Date.now().toString(36)+"-"+(++sequence)+"."+ext;
  }
  async function saveBlob(blob, filename) {
    const bridge=nativeBridge();
    const webview=/Android/i.test(navigator.userAgent||"")&&/; wv\)|FutureCodeJournalAndroid/i.test(navigator.userAgent||"");
    if(!bridge){
      if(webview){const e=Error("APK ပုံသိမ်းစနစ် မချိတ်ဆက်ပါ။ App ကို ပိတ်ပြန်ဖွင့်ပါ။ မရသေးပါက APK ကို Update လုပ်ပါ။");notice(e.message,true);throw e;}
      const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);return {nativeImageSave:false};
    }
    try{
      if(!blob||!/^image\/(png|jpeg|webp|gif)$/.test(blob.type)||!blob.size||blob.size>24000000)throw Error("Invalid or oversized image");
      const data=await new Promise((resolve,reject)=>{
        const reader=new FileReader();reader.onload=()=>typeof reader.result==="string"?resolve(reader.result):reject(Error("Image conversion failed"));
        reader.onerror=()=>reject(Error("Image conversion failed"));reader.readAsDataURL(blob);
      });
      if(!data.startsWith("data:"+blob.type+";base64,")||data.length>35000000)throw Error("Invalid image data");
      const name=nativeFilename(filename,blob.type);
      if(bridge.args===2)bridge.object.save(data,name);else bridge.object.save(data,name,blob.type);
      notice("ပုံကို Gallery သို့ သိမ်းဆည်းရန် ပို့ပြီးပါပြီ။ ဖုန်း၏ သိမ်းပြီးအသိပေးချက်ကို စောင့်ပါ။",false);
      return {nativeImageSave:true,filename:name,bytes:blob.size};
    }catch(e){notice("ပုံသိမ်းမရပါ။ App ကို ပိတ်ပြန်ဖွင့်ပြီး ပြန်စမ်းပါ။",true);try{if(typeof bridge.object.error==="function")bridge.object.error();}catch(_){}throw e;}
  }
  window.FutureCodeImageSave=Object.freeze({saveBlob,nativeAvailable:()=>!!nativeBridge()});
})();

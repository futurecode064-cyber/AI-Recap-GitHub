"use strict";
/* YKZ-only: use the actual released journal bridge, without a blob-link hop. */
(function () {
  function nativeBridge() {
    if (window.FCJournalNative && typeof window.FCJournalNative.save === "function")
      return {name: "FCJournalNative", object: window.FCJournalNative, args: 2};
    if (window.YKZNative && typeof window.YKZNative.save === "function")
      return {name: "YKZNative", object: window.YKZNative, args: 3};
    return null;
  }
  function notice(message, failed) {
    let box = document.getElementById("ykzImageSaveStatus");
    if (!box) {
      box = document.createElement("p"); box.id = "ykzImageSaveStatus";
      box.setAttribute("role", "status"); box.setAttribute("aria-live", "polite");
      box.style.cssText = "position:fixed;z-index:2147483647;left:16px;right:16px;bottom:20px;margin:0;padding:14px 18px;border:1px solid #ffcf58;border-radius:12px;background:#202020;color:#fff9ed;font:600 14px/1.9 sans-serif;box-shadow:0 4px 20px #0008";
      box.onclick = () => {box.hidden = true;}; document.body.appendChild(box);
    }
    box.hidden = false; box.textContent = message;
    box.style.borderColor = failed ? "#ff6868" : "#ffcf58";
  }
  function install() {
    const kit = window.FutureCodeCanvasKit;
    if (!kit || typeof kit.download !== "function" || kit.__ykzNativeImageSaveV3) return;
    kit.__ykzNativeImageSaveV3 = true;
    const original = kit.download.bind(kit);
    kit.download = async function (canvas, filename) {
      // Resolve at click time: some older wrappers inject their bridge after DOM ready.
      const bridge = nativeBridge();
      if (!bridge) {
        if (/Android/i.test(navigator.userAgent || "") && /; wv\)|FutureCodeJournalAndroid/i.test(navigator.userAgent || "")) {
          const error = Error("APK ပုံသိမ်းစနစ် မချိတ်ဆက်ပါ။ App ကို ပိတ်ပြန်ဖွင့်ပါ။ မရသေးပါက APK အသစ်ကို Update လုပ်ပါ။");
          notice(error.message, true); throw error;
        }
        return original(canvas, filename);
      }
      try {
        const framed = typeof kit.prepareBrandDownload === "function"
          ? await kit.prepareBrandDownload(canvas) : canvas;
        if (!framed || typeof framed.toBlob !== "function") throw Error("PNG canvas unavailable");
        const blob = await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(Error("PNG encoding timed out")), 25000);
          try {framed.toBlob(b => {clearTimeout(timer);b && b.size ? resolve(b) : reject(Error("PNG encoding failed"));}, "image/png");}
          catch (error) {clearTimeout(timer);reject(error);}
        });
        if (blob.size > 24000000) throw Error("PNG is too large for Android bridge");
        const data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(Error("PNG base64 conversion failed"));
          reader.onerror = () => reject(Error("PNG FileReader failed")); reader.readAsDataURL(blob);
        });
        if (!data.startsWith("data:image/png;base64,") || data.length > 35000000)
          throw Error("Invalid PNG data for Android bridge");
        const name = String(filename || "YKZ-Soccer-Tips.png");
        // FCJournalNative.save(data,name) is the signature in the published v1.2.3 APK.
        if (bridge.args === 2) bridge.object.save(data, name);
        else bridge.object.save(data, name, "image/png");
        notice("ပုံကို Gallery သို့ သိမ်းဆည်းရန် ပို့ပြီးပါပြီ။ ဖုန်း၏ သိမ်းပြီးအသိပေးချက်ကို စောင့်ပါ။", false);
        return {nativeImageSave: true};
      } catch (error) {
        notice("ပုံသိမ်းမရပါ။ App ကို ပိတ်ပြန်ဖွင့်ပြီး ပြန်စမ်းပါ။", true);
        try {if (typeof bridge.object.error === "function") bridge.object.error();} catch (_) {}
        throw error;
      }
    };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, {once: true});
  else install();
})();

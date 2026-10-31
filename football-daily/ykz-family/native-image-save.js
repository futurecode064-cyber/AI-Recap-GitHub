"use strict";
/* YKZ-only Android Gallery bridge. Ordinary website PNG downloads stay unchanged. */
(function () {
  function install() {
    const kit = window.FutureCodeCanvasKit;
    const bridge = window.YKZNative;
    if (!kit || typeof kit.download !== "function" ||
        !bridge || typeof bridge.save !== "function" || kit.__ykzNativeImageSaveV2) return;
    kit.__ykzNativeImageSaveV2 = true;
    const original = kit.download.bind(kit);
    kit.download = async function (canvas, filename) {
      if (!window.YKZNative || typeof window.YKZNative.save !== "function") {
        return original(canvas, filename);
      }
      try {
        const framed = typeof kit.prepareBrandDownload === "function"
          ? await kit.prepareBrandDownload(canvas) : canvas;
        if (!framed || typeof framed.toBlob !== "function") throw Error("PNG canvas unavailable");
        const blob = await Promise.race([
          new Promise((resolve, reject) => framed.toBlob(b => b && b.size
            ? resolve(b) : reject(Error("PNG encoding failed")), "image/png")),
          new Promise((_, reject) => setTimeout(() => reject(Error("PNG encoding timed out")), 25000))
        ]);
        if (blob.size > 24000000) throw Error("PNG is too large for Android bridge");
        const data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => typeof reader.result === "string"
            ? resolve(reader.result) : reject(Error("PNG base64 conversion failed"));
          reader.onerror = () => reject(Error("PNG FileReader failed"));
          reader.readAsDataURL(blob);
        });
        if (!data.startsWith("data:image/png;base64,") || data.length > 35000000)
          throw Error("Invalid PNG data for Android bridge");
        window.YKZNative.save(data, String(filename || "YKZ-Soccer-Tips.png"), "image/png");
      } catch (error) {
        try { if (window.YKZNative?.error) window.YKZNative.error(); } catch (_) {}
        throw error;
      }
    };
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, {once: true});
  } else install();
})();

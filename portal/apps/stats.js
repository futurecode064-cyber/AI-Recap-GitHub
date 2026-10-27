'use strict';
/* Future Code Apps anonymous download-click analytics (not completed installs). */
(() => {
  const backend = "https://mxwervqihaqlxybghdak.supabase.co";
  const publishableKey = "sb_publishable_JBcF0nEMbcFSSf7OlCCqmQ_lC1DEM0A";
  // Backward compatibility for older pages; all current APK buttons declare a stable data-app-key.
  const knownApps = Object.freeze({
    "GoalZone_Sports_Journal_v1.0.1.apk": "goal-zone",
    "Future_Code_Mandalay_City_Helper_v1.0.0.apk": "mandalay-city-helper",
    "Future-Code-AI-Studio.apk": "ai-studio",
    "Future-Code-App-Creator.apk": "app-creator",
    "Myanmar-Kyar-Kwet.apk": "myanmar-kyar",
    "Future_Code_Auto_Video_Editor_v2.0.1_FIXED.apk": "video-cutter",
    "Future_Code_AI_Astrology_v1.1.apk": "ai-astrology",
    "El_Nino_Protection_v1.2_Official.apk": "el-nino",
    "FutureCode_DailyMoney_v1.0.1.apk": "daily-money",
    "FutureCode_MedicineReminder_v1.0.1.apk": "medicine-reminder",
    "FutureCode_KidsLearning_v1.0.1.apk": "kids-learning",
    "FutureCode_SafetyGuide_v1.0.1.apk": "safety-guide"
  });
  function uuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return null;
  }
  let browserId = null;
  try {
    browserId = localStorage.getItem("fc_apps_browser_id");
    if (!browserId) {
      browserId = uuid();
      if (browserId) localStorage.setItem("fc_apps_browser_id", browserId);
    }
  } catch (_) { browserId = null; }
  function record(kind, key) {
    const id = uuid();
    if (!id) return;
    // A failed analytics request must never interfere with an APK download.
    try {
      fetch(backend + "/rest/v1/rpc/fc_record_portfolio_event", {
        method: "POST",
        mode: "cors",
        keepalive: true,
        headers: { "apikey": publishableKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          p_event_id: id,
          p_event_kind: kind,
          p_app_key: key,
          p_browser_id: browserId,
          p_site_key: 'future-code-apps'
        })
      }).catch(() => {});
    } catch (_) {}
  }
  record("page_view", null);
  document.querySelectorAll("a.download").forEach(anchor => {
    let filename = "";
    try { filename = decodeURIComponent(new URL(anchor.href, location.href).pathname.split('/').pop()); }
    catch (_) { /* Explicit data-app-key below is still usable. */ }
    if (!/\.apk$/i.test(new URL(anchor.href, location.href).pathname)) return;
    const app = anchor.dataset.appKey || knownApps[filename] ||
      Object.entries(knownApps).find(([name]) => filename.endsWith('-' + name))?.[1];
    if (!app || !Object.values(knownApps).includes(app)) return;
    anchor.dataset.analyticsApp = app;
    anchor.addEventListener("click", () => record("download_click", app), {passive: true});
  });
})();

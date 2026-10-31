'use strict';
/* Future Code Apps anonymous download-click analytics (not completed installs). */
(() => {
  const backend = "https://mxwervqihaqlxybghdak.supabase.co";
  const publishableKey = "sb_publishable_JBcF0nEMbcFSSf7OlCCqmQ_lC1DEM0A";
  // Backward compatibility for older pages; all current APK buttons declare a stable data-app-key.
  const knownApps = Object.freeze({
    "FutureCodeStockGuard-v1.1.0.apk": "stockguard",
    "FutureCodeSolarQuote-v1.0.1.apk": "solarquote",
    "GoalZone_Sports_Journal_v1.0.1.apk": "goal-zone",
    "Future_Code_Mandalay_City_Helper_v1.0.0.apk": "mandalay-city-helper",
    "Future-Code-AI-Studio.apk": "ai-studio",
    "Future_Code_Thai_Speaking_v1.0.0_Beta.apk": "thai-speaking",
    "Future_Code_English_Academy_v1.0.0.apk": "english-academy",
    "Future_Code_Chinese_v1.0.0.apk": "chinese-learning",
    "Future_Code_Chinese_v1.0.1.apk": "chinese-learning",
    "Future_Code_Chinese_v1.0.2.apk": "chinese-learning",
    "Future_Code_Chinese_v1.0.3.apk": "chinese-learning",
    "Future_Code_Language_Academy_v1.0.0.apk": "language-academy",
    "Future_Code_Language_Academy_v1.0.1.apk": "language-academy",
    "Future_Code_Language_Academy_v1.0.2.apk": "language-academy",
    "Future_Code_English_Academy_v1.0.4.apk": "english-academy",
    "Future_Code_Thai_Speaking_v1.0.5.apk": "thai-speaking",
    "Future_Code_Chinese_v1.0.6.apk": "chinese-learning",
    "Future_Code_Language_Academy_v1.0.6.apk": "language-academy",
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
  // The Myanmar Kyar detail page has its own direct APK download link.
  // Count it as an app detail view without treating navigation as a download.
  try {
    if (/\/myanmar-kyar\/(?:index\.html)?$/i.test(new URL(location.href).pathname)) {
      record("app_view", "myanmar-kyar");
    }
  } catch (_) {}
  // Only count when a user actually opens the APK detail panel.
  if (typeof document.addEventListener === 'function') {
    document.addEventListener('click', event => {
      const button = event.target?.closest?.('[data-details]');
      const card = button?.closest?.('.card');
      const appKey = card?.querySelector?.('a.download[data-app-key]')?.dataset?.appKey;
      if (appKey) record('app_view', appKey);
    });
  }
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

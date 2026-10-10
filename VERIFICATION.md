# Future Code AI Studio v8 verification

Version 1.4.1 / code 8; package mm.futurecode.videostudio.pro.

## Fixed behavior

- Every enabled module has a real browser destination. Browser and APK read the same eight-module manifest; Design/Invoice are merged, guides are nested, and Lesson Videos is last.
- Start Lessons opens the professional lesson guide. Tool help, video editor, generated/own-video handoff, back/home and old public URLs route correctly in the browser.
- Web builds copy current APK pages, CSS and JavaScript from checked-in source. Publishing cannot overwrite them from old v4/v5/v6 ZIP downloads.
- Browser device key database and session names are preserved. Each section entry checks server permissions. Network failures retain the existing token/project; revoked or expired access removes the studio frames.
- Help/back preserves web form state. Generation/export cannot be interrupted by section navigation. Native help keeps the current studio loaded. Native document/guide printing opens Android Print/Save PDF.
- Owner release key and package from v7 are retained for an in-place v8 update.

## Checks completed locally

- Python asset verifier: 10 reachable pages + 6 scripts; every web page/resource exists and shared web/APK bytes match; exact Telegram/Facebook group links; no duplicate menu routes; workflow source assertions.
- Node portal regression: 12 groups (all sections, nested routes, deep links, permissions, forged messages, network failure, busy generation, expiry, logout, internal hashes and printing/navigation).
- Node access regression: real Web Crypto P-256 signatures, stored key reuse, timestamp session proof, typed HTTP errors and logout request (mock HTTP/IndexedDB fixtures).
- Node studio regression: 12 groups for detailed image editing, Veo payload/resume, own-video handoff, final preview editing, legacy project imports, voice/audio, repeated exports and cancellation (simulated DOM/media/network).
- Native Java compiled against Android 36, min 26/target 35, then D8/aapt2/zipalign/apksigner. APK v2/v3 signatures verified with the unchanged owner certificate.

## Acceptance limits

No physical Android device is connected. No billable image/video/voice generation is performed without a user API key. Simulated media tests do not prove every device/browser codec. Public HTTP and browser login/redirect verification after publication are recorded in the delivery audit outside source; authenticated browser workflows above are deterministic fixtures, not a signed-in live-browser run.

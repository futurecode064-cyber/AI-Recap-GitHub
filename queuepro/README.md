# Future Code QueuePro v1.0.0
Standalone offline Android queue manager. Package com.futurecode.queuepro (Android 9+).
- IndexedDB atomic token sequence, daily reset with historical reports
- New / call / recall / complete / skip
- Full-screen queue display and beep; ticket share / print
- Offline CSV report, JSON backup and restore (Storage Access Framework)
- Myanmar-first UI, no INTERNET permission
Build: cd queuepro/project && gradle :app:assembleDebug
Production release requires stable keystore secrets; never publish debug as production. The QueuePro workflow intentionally blocks public signed-release publishing until configured.

# Journal APK audit — 2026-11-14

Audited the five active journal APKs downloaded from production download pages: Goal Zone 1.0.5 (code 6), YKZ 1.2.3 (6), BW 1.0.4 (5), Ko Thet 1.0.5 (6), KMM 1.0.4 (5). All ZIP CRC checks passed and each has its expected application ID, Android minimum API 26, target API 35, notification and install permissions. Certificate metadata was extracted; no Android device installation test was available.

All five current releases have certificate SHA-256 98407044295dba61390bf38c452aa2d8dc8bcfc7390261680bbccbf30d6a66a4.

Ko Thet historical APK certificates differ:
- v1.0.1, code 2: 4ecafa18303da822d13c6cd21722a9116d0e3f26bfffdc8eb1bc80d88efc84c9
- v1.0.3, code 4: 987d97c3d01966c119e67396d4ae8d608caf6dcc391dced838e38c2d599fc822
- v1.0.5, code 6: 98407044295dba61390bf38c452aa2d8dc8bcfc7390261680bbccbf30d6a66a4

These have distinct signing identities. Ordinary in-place updates between them are incompatible; the installed version's original signing private key (or a valid supported signing lineage) is required. Do not regenerate keys, overwrite releases or promise an in-place update. The encrypted signing backup on feature/football-bundled-fcm-20261029 corresponds to the separate October 31 release process; do not assume it matches November 4.

Fixed production latest.json: Goal Zone previously advertised 1.0.1; the other four routes returned HTML instead of JSON. Manifests now point to the existing November 4 release binaries with SHA-256 and certificate values extracted from those exact downloads. No new APK binary was built or published. This repairs update discovery only; it cannot repair certificate incompatibility in an installed app.

Shared image-save/brand contract tests: 17 passed. BCF remains suspended and unchanged. Remaining: recover appropriate private signing backups, build higher-version compatible APKs, cryptographically verify release signatures and test upgrade/install/Gallery/FCM on Android before publishing replacement binaries.

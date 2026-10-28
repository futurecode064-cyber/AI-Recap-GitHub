# Language APK release status — 2026-10-28

Verified and published:
- English Academy 1.0.5 (versionCode 6): 60 lessons, 300 neural MP3 clips.
- Chinese 1.0.7 (versionCode 8): 30 units / 240 phrase entries, 231 distinct neural MP3 clips.

Both match the signing certificates of the owner-uploaded previous APKs. The build release gate verifies every referenced clip and its SHA-256. All packaged MP3s are checked for valid decoding locally. Physical Android installation and native-teacher listening certification are not verified.

Prepared, not released:
- Thai 1.0.6 (versionCode 7): 24 modules, 269 distinct phrase/alphabet models.
- Language Academy 1.0.7 (versionCode 8): 12 languages × 30 phrases, 360 clips.

Their speech-generation jobs failed with NoAudioReceived in the Thai voice. Further cloud speech generation was blocked by automatic approval review because it transmits curriculum text to Bing without explicit external-transmission authorization. Do not retry speech generation or route that transmission through another job without authorization. The two workflows are manual-only pending resolution. Stable Thai 1.0.5 and Language Academy 1.0.6 downloads remain in the catalogue.

All package IDs and existing signing services are preserved. English/Chinese/Thai source includes a checksum-verified DownloadManager updater. Academy retains its existing checksum updater. APK installation requires Android user approval. The older English 1.0.4 client has an update URL allowlist defect; the first transition may require a manual download.

# Language APK releases — 2026-10-28

All four signed stable releases are published:
- English Academy 1.0.5 (versionCode 6): 60 lessons, 300 neural MP3 clips.
- Chinese 1.0.7 (versionCode 8): 30 units / 240 phrase entries, 231 distinct neural MP3 clips.
- Thai Speaking 1.0.7 (versionCode 8): 24 modules, 269 phrase/alphabet neural MP3 clips.
- Language Academy 1.0.8 (versionCode 9): 12 languages × 30 phrases, 360 neural MP3 clips.

The owner explicitly authorized sending lesson text to Microsoft/Bing speech synthesis on 2026-10-28. The Thai voice uses Niwat. A failed synthesis fails the release without a robotic fallback. Thai 1.0.7 reuses the identical verified audio from signed Thai 1.0.6 and fixes the initial voice-data setup prompt. Academy 1.0.8 removes the obsolete pending-release notice.

Every release preserves the original application ID and signing certificate. Final downloaded APKs were checked for versionCode, versionName, original signing identity, complete lesson-to-audio coverage, clip hashes, and valid decoding of all MP3s. The build release gate refuses missing or corrupted audio. Physical Android installation and native-teacher listening certification are not verified.

English/Chinese/Thai include a checksum-verified DownloadManager updater; Academy retains its checksum updater. Android user approval is required to install updates. The older English 1.0.4 client has an update-link allowlist defect, so its first transition may require a manual download.

GitHub Pages and the original ChatGPT APK catalogue are updated without changing other APK listings. Stable app keys and analytics identity are retained.

# Future Code Movie Recap Maker — Android

Native Kotlin / Jetpack Compose / Media3 project for Myanmar-language movie recaps.
This continues the existing `AI-Recap-GitHub` repository, not a new project.

## Modes

### 1. Public YouTube link → AI Burmese recap

1. Obtain your own API key at https://aistudio.google.com/apikey .
2. Open the APK, paste a **public YouTube** or youtu.be link and enter your key.
3. Select 1 / 3 / 5 / 10 minute target and storytelling style.
4. Tap **Analyze & write Burmese recap**.
5. Gemini Video Understanding analyzes the public YouTube video and returns a time-coded Burmese story script. You can edit every line, enable/disable scenes, adjust start/end in 5-second increments.
6. Tap **Generate Burmese voiceover WAV** to make a shareable narration file.
7. For an MP4 with actual movie footage, **select a matching locally accessible video that you own or have permission to use**, then tap **Render edited MP4**.

No unauthorized YouTube download, DRM bypass, or movie database is included. The public YouTube link alone can produce the script and voiceover; it **cannot** automatically package downloaded movie clips into a recap video.

### 2. Local video → offline extractive recap

Pick a local video and tap **Create transcript-based recap**. This extracts important spoken passages via Android speech recognition. It is a heuristic transcript summary, *not* full AI movie plot understanding. Language support depends on the device recognizer, and prerecorded PCM support requires Android API 33+.

## Narration choices

- **Phone TTS** (default): no additional cloud requests. Requires an installed TTS engine/voice for the selected language. Without the selected language voice, the renderer explains that it kept original clip sound rather than falsely claiming Burmese narration.
- **Gemini Cloud Burmese voice** (explicit opt-in checkbox): real Burmese synthesis via the `gemini-3.8-flash-tts` model using **your** key. This is intended for phones without a my-MM voice; subject to Gemini quotas, model availability, and any billing enabled on your API project. Output is a WAV file and can be included during video rendering. API provider receives the narration text.

The YouTube AI script feature uses `gemini-3.5-flash-lite`, which may have free-tier allowances; **zero cost is not guaranteed**, especially if you have enabled billing. The APK has no hard-coded secret, no user account and no app-owned paid backend. The user key is stored in app-private preferences and Android backup is disabled.

## Workflow and output

```
YouTube URL → Gemini scene/timestamp analysis → Editable Burmese text
         → Android or Gemini TTS → Narration WAV
         → Matching, permissioned local video + captions → Media3 MP4 + SRT
```

- MP4 saved in the app-specific Movies directory; share directly through Android sharesheet.
- WAV saved in the app-specific Music directory; share to another video editor.
- SRT saved alongside the MP4.
- The program does not guarantee every AI timestamp/plot fact is perfect. Review content, edits, rights, TTS pronunciation and exported video.

## Get the APK

Go to [GitHub Actions](https://github.com/futurecode064-cyber/AI-Recap-GitHub/actions/workflows/android-build.yml).
Open the latest **successful** Android Build run and download artifact `ai-video-recap-maker-debug`. Unzip to obtain `app-debug.apk`.

Note: a green Android build verifies compilation, **not** successful Google API access, narration on an individual handset, or runtime MP4 export. Test on a real Android 13+ device with your own permitted media.

## Build locally

- Android SDK 36, JDK 17, Gradle 8.13.
- `gradle :app:assembleDebug`
- Result: `app/build/outputs/apk/debug/app-debug.apk`
- CI workflow: `.github/workflows/android-build.yml`.
- Distribute to users only after release signing and real-device functional tests.

## Copyright and privacy

Use only public links you are allowed to analyze and footage you may legally reuse. Summaries are not automatically free from copyright restrictions; check licensing/fair use and platform terms. Google receives the video URL and AI prompts when you choose cloud analysis. The app does not scrape YouTube, TikTok, or Facebook media.

## Browser Web App (live)

**Live site:** https://futurecode-movie-recap.floot.app

The existing `web-preview/index.html` is now a real browser-side implementation (not a simulated progress animation) of public YouTube/local short-video AI analysis, editable Myanmar-language scene narration, Gemini 3.8 Burmese TTS WAV export, SRT/TXT/JSON project export, and optional locally permissioned footage rendering with MediaRecorder. The published Floot mirror serves this same HTML inside the app and uses a small no-storage `/_api/gemini` proxy to avoid direct-browser Gemini CORS restrictions. A personal Google Gemini API key is still required; no key is embedded or stored. Google model availability and rates may change. Uploaded local video for direct inline analysis is capped at 14MB; YouTube links can handle larger public footage subject to Gemini limits. Browser video export selects MP4 when supported, otherwise WebM, and requires a locally chosen matching movie file and narration audio. **Live Gemini calls and real-device render tests require a supplied key and permitted test media and have not yet been end-to-end verified.**

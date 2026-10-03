# AI Video Recap Maker — Android MVP

A local-first Android app that converts a user-selected video into a short recap. It is designed to avoid creator-side server bills and paid AI APIs.

## What works in this MVP

- Pick a local video using Android's document picker.
- Decode its audio locally to 16 kHz mono PCM.
- Split audio into time-stamped chunks.
- Auto-transcribe each chunk with Android SpeechRecognizer using injected PCM (Android 13/API 33+).
- Prefer the device's on-device recognizer when available; fall back to the installed system recognizer otherwise.
- Generate a factual, extractive recap locally (no cloud LLM, no fabricated plot facts).
- Auto-select source scenes using transcript importance and timestamps.
- Generate narration with the phone's TextToSpeech engine when the selected language is available.
- Burn recap captions onto each selected video clip using Media3 TextOverlay.
- Export an MP4 with Media3 Transformer.
- Generate a matching `.srt` subtitle file.
- Preview, edit recap lines, enable/disable clips, re-render, and share the MP4.

## Cost model

There is no app-owned backend, database, paid API, or paid AI service. Processing happens on the user's phone. A device's fallback speech-recognition provider can require internet, depending on the phone; on-device recognition is preferred automatically.

## Requirements

- Android Studio with Android SDK 36.
- JDK 17.
- Android 13+ (API 33+) for reliable prerecorded-audio injection into SpeechRecognizer.
- A speech recognition engine that supports the selected language.
- A TTS engine/voice for narration; if unavailable, the export keeps the original clip audio and still burns captions.

## Build

1. Open this folder in Android Studio.
2. Let Gradle sync dependencies.
3. Build `app` or run it on a physical Android 13+ phone.
4. For release distribution, create your own release signing configuration. Do not commit signing keys.

## Important limitations

- This reconstruction cannot include uncommitted files from the user's interrupted Codex workspace; those files were not present in GitHub or ChatGPT Library. This project preserves the requested product goal rather than pretending to recover unavailable files.
- The v1 summarizer is extractive rather than an LLM. This keeps it fully local, fast, and free while reducing hallucinations.
- Burmese speech recognition and Burmese TTS depend on the speech/TTS engine installed on the phone.
- Very long films are computationally expensive; processing time depends on device performance.
- The app only processes videos supplied by the user. It includes no movie downloader, DRM bypass, or copyrighted-content database.

## Architecture

`AudioDecoder` → `PcmChunker` → `DeviceSpeechTranscriber` → `RecapGenerator` → `TtsNarrator` → `SubtitleWriter` → `VideoRenderer`

Media3 version: 1.11.1.

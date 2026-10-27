# Chinese bundled offline pronunciation

The Future Code Chinese v1.0.6 Android app uses local prerecorded MP3 clips for 192 Mandarin words and expressions. Build-time synthesized audio is stored in `app/src/main/assets/audio/zh/`. `OfflineAudio.java` plays these clips without Internet, a phone TTS service, or a voice-data installation. Build passes only if `verify_offline_audio_apk.py` finds all 192 files inside the actual APK.

The voices are synthesized and have not been certified for Mandarin tone accuracy by a native teacher; pronunciation is supportive practice rather than a validated tonal assessment.

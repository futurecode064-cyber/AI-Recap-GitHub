# Built-in offline pronunciation

The Android release contains real MP3 audio clips for all 12 languages and 216 foundation phrases. These audio files are synthesized at build time using eSpeak NG and packaged as `assets/audio/<language>/<SHA-256-prefix>.mp3`. The Android application uses `OfflineAudio.java` to play the local sound file without requiring the Android TTS voice service or an Internet connection. A release build must pass the APK ZIP asset count verification before signing.

Audio has a synthetic voice; native-speaker editorial verification remains necessary before using pronunciation as a formal examination standard.

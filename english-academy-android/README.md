# Future Code English Academy Android source

Version 1.0.1 keeps the existing package name and owner release certificate. The offline course now contains 54 bilingual lessons across six levels (A0–C1), including an applied capstone in every level.

Build with JDK 17 and Android SDK platform 35 / build-tools 35.0.0:

```sh
python3 android/build.py
```

The signed release is built by `.github/workflows/english-academy-apk.yml`. It retrieves the established owner signing key through the restricted `fc-english-signing` Edge Function. The keystore is not included in this source directory or repository.

The app provides local lesson progress, quizzes, reading and writing practice, speech recognition with a heuristic overlap score, optional reminders and update checks. Android speech services depend on the device. The course is self-study material and does not award a CEFR certificate.

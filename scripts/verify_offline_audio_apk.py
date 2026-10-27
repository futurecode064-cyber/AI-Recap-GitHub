#!/usr/bin/env python3
"""Release gate: fail if an APK doesn't physically embed every offline MP3 clip."""
import json,sys,zipfile
from pathlib import Path
if len(sys.argv)!=3:
    raise SystemExit("usage: verify_offline_audio_apk.py APK_PATH MIN_CLIP_COUNT")
apk=Path(sys.argv[1]);minimum=int(sys.argv[2])
assert apk.exists() and apk.stat().st_size>15000, f"Missing built APK: {apk}"
with zipfile.ZipFile(apk) as z:
    meta=json.loads(z.read("assets/audio/manifest.json"))
    listed=[item for item in z.infolist() if item.filename.startswith("assets/audio/") and item.filename.endswith(".mp3")]
    assert len(listed)==meta["clipCount"], f'Embedded clips {len(listed)} != declared {meta["clipCount"]}'
    assert len(listed)>=minimum, f'Too few clips: {len(listed)} < {minimum}'
    assert len(listed)==sum(meta["generated"].values()),"Per-language total differs from asset count"
    assert all(item.file_size>800 for item in listed),"Some prerecorded audio clips are empty or invalid"
    print("PASS signed-release offline audio audit",apk,meta)

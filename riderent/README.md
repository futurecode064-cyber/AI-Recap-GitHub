# Future Code RideRent v1.0.1

Renamed from original Kotlin equipment-rental source at renttrack/RentTrack-Android-v1.0.1-source.zip. App ID com.futurecode.riderent; original property RentTrack remains studio.futurecode.renttrack.

Original E-Bike rental features unchanged. Build/rebranding source transformation: scripts/prepare_riderent.py. Android manifest, launcher icon, visible app names, update channel and APK download catalog were changed. No signing private key is committed to GitHub. Signing uses a dedicated OIDC-protected RideRent signing vault and permanent key in private Supabase storage; it does not share signing keys, app data or Android identity with property RentTrack. Old com.futurecode.renttrack installs are distinct and cannot migrate in place. Physical-device QA pending.

APK SHA256: a18b8c02511e2cbeea6b9c7ca3d204630bb653627b177ce8360ff662cad355d8
Signer certificate SHA256: 31bceefea8f81259d8cf301739dfca39616aaa447c622ccc8130ec943273d340

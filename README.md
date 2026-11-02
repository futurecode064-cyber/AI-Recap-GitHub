# Tea Shop Rush Crew — Future Code AI Studio

Original Godot 4.5.1 Android-first **2–5 player LAN cooperative tea-shop game**. Independent of Mandalay City Helper.

Five roles: Cashier, Tea Brewer, Snack Cook, Table Server, Stock Keeper. Six stations: Cash, Brew, Cook, Serve, Stock, Clean. Workflow: STOCK → BREW → COOK → SERVE → CASH, clean cups when needed. 20 levels, countdown, customer mood, inventory, rewards, win/lose, local JSON career save. 3D procedural shop, avatars, touch controls, beeps, tutorial, settings, lobby and results.

**How to play:** Import in Godot 4.5.1. Host chooses HOST LAN GAME, guests on same Wi-Fi enter host's IPv4 and JOIN LAN GAME. Pick roles. Host starts with 2–5 players. Move with touch arrows or WASD, press ACTION/E near glowing stations. UDP 24582 must be reachable.

**Network:** Host-authoritative ENet; host validates action range and cooldown. Host sends mission/player snapshots. Basic name-based role restoration for 30 seconds. No internet relay, host migration, persistent server, anti-cheat attestation, or secure identity.

**Build:** GitHub Actions workflow attempts static QA, Godot import, mission and ENet loopback tests, then Android arm64 **debug** APK export. Debug APK is not production-signed release. Device installation, 30–60 FPS and final HD art need real phone testing. See run logs for PASS/FAIL.

© 2026 Future Code AI Studio. Original source.

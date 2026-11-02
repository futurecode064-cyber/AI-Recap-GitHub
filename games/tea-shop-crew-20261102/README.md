# Tea Shop Morning Crew — Godot 4.5.1 Development Package
**Future Code AI Studio | 2026-11-02 | v0.1.0 | Android-first 2–5 LAN co-op**

## Current verified status
The native Godot game has a real two-process headless LAN integration test (1 host + 1 guest): both clients received the win state, 6 completed orders, host received 235 coins and progressed to level 2. Five-player integration should be reported separately only if its own run passes. This is **not** a finished semi-realistic HD game; assets are procedural low-detail blockout. A signed installable release APK is **not** claimed without a successful Android export and device installation.

## Small map / roles
34×26m outdoor plot; 22×17m shop floor. Counter (0,-2.8), tea (-5.8,-4.5), kitchen (5.7,-4.5), serving (0,2.3), washing (8.5,4.1), stock (-8.4,3.7). Most station-to-station walks are 4–11m. Roles: Waiter, Tea Maker, Cook, Cleaner, Stock Keeper. Anyone can work at any station; matching roles earn small happiness bonuses; stock keeper restocks more supplies.

## Core loop
LAN lobby (host IP + port 24618) → choose role → host starts (at least 2 players) → accept order at yellow counter → prepare Tea at green kettle or Snack/Mohinga at red kitchen → deliver at blue serving area → wash at washing sink → refill supplies at purple shelf → repeat until level target. Win: complete all orders before timer and maintain satisfaction >0. Lose: time/happiness depleted or teammate disconnect leaves fewer than 2 players. Host alone cannot start a production shift.

## Difficulty
L1: 6 orders, 185s, 2 concurrent tickets; L5: 14 orders, 205s, 3 concurrent tickets; L10: 24 orders, 230s, 4 concurrent tickets; L20: 44 orders, 280s, 5 concurrent tickets. Customers lose patience more quickly with level; new tickets arrive more quickly. The current formula increases time and targets; this balancing needs device playtests.

## Controls / UI
WASD or arrow keys and E on desktop. On mobile: touch directional buttons and WORK. Lobby includes nickname, host IP, Host/Join, role selection and start. HUD shows level, progress, timer, satisfaction, coins, player count, tickets and stock. Menu toggles sound. Synthesized feedback tone, not a final licensed sound pack. Save file user://tea_shop_crew_v1.json contains career level, coins, wins, sound, name and token.

## Network and anti-griefing
ENet UDP port 24618. Host authoritative for player positions, station action, supplies, mission, coins, results. Client sends movement input at 10 Hz; host sends snapshots about 8 Hz. Host checks distance <3m, rate limit 480ms and valid ticket stage. Reconnect token restores role in lobby but is not authenticated and cannot resume a running shift. No internet relay, matchmaking or host migration. Insecure LAN tokens should not be treated as production identity.

## Asset and sound inventory
Procedural boxes: floor, walls, counter, tables, benches, kettle, stove, sink, stock shelves, six color-coded stations; capsule player avatars; directional sunlight and omni light; station name labels. Synthesized WAV-like sine-tone generated at runtime. **Final HD 3D assets, PBR props, animations, voice, ambient sound, shadows, texture atlases, LOD, occlusion tuning remain pending.**

## Build / install
1. Import project.godot with Godot 4.5.1 stable.
2. Open main.tscn and run. Host and join using same Wi-Fi; firewall must allow UDP 24618.
3. For Android export: install Godot 4.5.1 export templates, JDK 17 and Android SDK with build-tools 35; configure Godot Editor Settings > Export > Android paths.
4. Export debug Android APK using export preset "Android"; this package includes GitHub Actions workflow for attempted CI export.
5. On phone, permit installing from the source you trust; install APK, then join LAN using the host's local IP.
6. Never share production signing keystores or credentials in source control.

## Implementation milestones
M1 native gameplay + roles + tickets + save (source implemented).
M2 headless LAN host+client integration (2-player PASS).
M3 5-player soak, reconnect/disconnect, win/lose, save/load verification (testing).
M4 Android debug APK CI export and on-device install/performance QA (not automatically assumed).
M5 final 3D assets/animations/sound/UI, 30–60 FPS optimization and secure online relay (not implemented).

## Risks / QA
Network: packet loss, peer disconnect, host migration unsupported; test 2–5 Android devices on actual Wi-Fi. Gameplay: ticket order, stock depletion, role bonus, late customer, level 20 and save corruption. UI: notches, landscape aspect ratios, touch latency, overlapping controls. Security: no accounts, tokens are not secure. Art: current procedural blockout falls short of semi-realistic target. Android export may fail due to SDK paths, templates, signing or permissions; read CI logs.

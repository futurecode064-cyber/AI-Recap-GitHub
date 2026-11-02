# Tea Shop Morning Crew — QA Evidence (2026-11-02)
Engine: Godot 4.5.1 stable official f62fdbde1, Linux ARM64 headless, using Floot VM compute. Project from GitHub repository path games/tea-shop-crew-20261102.

## Verified tests
1. Real Godot import/runtime: Godot headless editor import and headless runtime 20 frames succeeded after fixing GDScript type inference.
2. 2-process LAN integration: one host + one guest on loopback UDP 24618, both exit code 0, host reports HOST_PASS connected=2 completed=6 coins=235 level=2, client reports CLIENT_PASS connected=2 completed=6 result=SHIFT WON.
3. 5-process LAN integration: one host + four guests on loopback UDP 24618, all five exit code 0, host reports HOST_PASS connected=5 completed=6 coins=235 level=2; all four clients report CLIENT_PASS connected=5 completed=6 result=SHIFT WON.
4. Loss/save/load integration: exit code 0, RULE_PASS timer_loss=true no_loss_reward=true save_load=true level=4 coins=777.

## Important limitations
- Tests use five headless Godot processes on one Linux VM, not five physical Android phones, not distinct Wi-Fi devices, not internet/NAT networking.
- The smoke test programmatically moves the host avatar to station positions and invokes validated actions. This checks game rules and replicated state, not real touchscreen input or human game feel.
- Host logs Unable to send packet on channel 0, max channels: 0 during rapid test-client shutdown, after game result. The network teardown warning remains a QA issue; it did not prevent all clients from receiving the winning state.
- Host environment emitted libfontconfig.so.1 warning. No on-screen font/layout or graphics QA was performed.
- No certified signed release APK, Android install test, frame-rate measurements, GPU stress test, network-loss test or production-grade reconnect test is claimed.
- Procedural 3D blockout is not the requested final HD semi-realistic art.
- Gameplay tuning, stock pressure, player collisions, tutorial flow, secure tokens, offline/online reconnect and device audio need further work.

## CI build
GitHub Actions workflow .github/workflows/tea-shop-crew-android.yml attempts a Godot 4.5.1 Android debug APK export. Consult the latest run's actual conclusion and artifacts; a workflow definition is not evidence of a successful APK.

## Source and integrity
Source is stored in GitHub at games/tea-shop-crew-20261102. ZIP checksum must be computed from the actual packaged bytes, never from a filename alone.

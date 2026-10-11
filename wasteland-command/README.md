# Wasteland Command HD

Hosted browser single-player: Godot 4.4.1 web export in `dist/play/`.
Online playtest: `dist/online/` and dependency-free Node.js server in `server/`.

## Run the online build

Node.js 22 or later is required. Run `npm test`, then `npm start`.
Open http://localhost:3001 in two or more browser sessions. Create a room,
share the room code, mark every player ready and let the host start.
The server supports 2–10 human players. It serves the online client itself.
For testing across devices, deploy the server to HTTPS.

`PORT` defaults to 3001. `ALLOWED_ORIGIN` permits the separately hosted web
client; same-origin requests also work. Set `dist/online/config.js` to the
published server URL when using the Sites-hosted client.

## Implemented online mechanics

Server-authoritative 10 Hz simulation, 300 ms snapshot polling, private random
room codes and per-player bearer tokens, lobby ready/start, 2–10 seats, reconnect
using the same browser session, selection, move/attack/hold orders, barracks and
factory queues, oil income, building placement, recruitment, headquarters defeat,
last-player victory, surrender and spectator rendering after defeat.
Three recruitable units (infantry, buggy, tank), five building types including HQ.
50 units and 20 buildings per player; up to 50 rooms per process.

## Scope and limitations

This is an original experimental RTS, not a complete PS1 KKnD: Krossfire remake.
Single-player contains 3 custom missions, 4 units and 8 building types.
Online has one open arena, no AI, fog, alliances, original maps or campaign.
Unit statistics and costs are prototype values. HD art is reconstructed artwork,
not original game asset extraction. Full original faction rosters, original
mission scripts and all original maps remain unimplemented.

Network simulation is tested with 10 HTTP clients locally; browser multiplayer
and real phone play have not been tested. Online server deployment is pending.
Rooms live in memory and are lost on restart. There is no host migration in a
lobby: if the host intentionally leaves, ownership passes to the next player;
an offline host must reconnect or players must create a new room. Disconnected
armies remain in the match. Room cleanup occurs after 30 minutes without traffic.
Polling is suitable for a prototype and needs load/latency testing before release.

## Deployment

`render.yaml` describes one free Node service. Render needs this source pushed
to a supported GitHub/GitLab/Bitbucket repository and a confirmed workspace.
The current Sites Git repository is not a supported Render Git provider.
The available Render workspace is “My Workspace”; selection requires user
confirmation under the Render connector's workspace rule.

## Verification

`npm test` verifies 10 clients joining concurrently, room capacity, player tokens,
ready/host restrictions, matching snapshots, command ownership, idempotent paid
orders, production, movement, oil spending, reconnect identity, victory, draw,
invalid costs/buildings/coordinates and origin rejection.
No browser automation skill was available in the managed environment; visual
browser validation was not performed. Existing single-player was desktop-rendered
and tested with Godot headless regression tests before the web export.

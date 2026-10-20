# Shared brand publishing and live verification

Brands share the same JSON, scripts, and production Pages deployment. Add brand
identity and entry pages; do not copy the shared data or create a per-brand daily
deployment. PNG exports run in the browser.

## Selective Worker routing

`_routes.json` sends only owner login/editor APIs and Goal Zone analytics routes
to `_worker.js`. Public brand assets, shared JSON, images, JS and CSS bypass it.
Goal Zone HTML and APK download routes deliberately retain their existing D1
analytics behavior. New public brand pages use no Worker by default.

Worker responses carry `X-Football-Worker: selective-routes-v1`. This is a
diagnostic marker, not a credential or an authentication mechanism. The live
checker confirms this marker on protected responses and its absence on static
responses; an absent marker alone is not proof that the new Worker deployed.

Pages Runtime must use **Fail closed** for owner-protected HTML. This account
setting cannot be asserted from repository files. Check it in Cloudflare; never
remove login/editor routes from the include list to reduce request usage.

## A saved source is not a verified live publication

1. Save the approved data to the canonical source repository.
2. Run the existing manual guarded production mirror.
3. After the production branch is updated, wait for the live verifier to pass.
4. Call the publication live only after JSON and brand/asset byte hashes match,
   protected URLs reject anonymous access, and static URLs bypass the Worker.

The mirror workflow uses `scripts/verify_live.py` and writes a separate live
verification table to its Actions summary. A timeout/failure retains the saved
source and production commit, but is not a successful live publication. Retry
verification before publishing again; do not bypass independent-production-edit
guards or force-push the production branch.

Manual read-only check from the repository root:

```sh
python3 football-daily/scripts/verify_live.py
```

The checker verifies the existing report, dated odds, evening odds, news feed,
shared scripts, each current shared-data brand, owner login/editor and stats.
It never requests passwords, GitHub tokens or protected report contents.

## Traffic capacity measurements

Live HTTP probes and their response timings measure route behavior and delivery
from the probe location. They do not measure daily visitors, monthly bandwidth,
account-wide Worker invocations, D1 usage or the remaining build allowance.
Read those totals from Cloudflare for a specified date range. Count all projects
and Workers on the account before comparing against a shared free allowance.

Record at least a complete 24-hour period after deploying selective routing,
preferably seven matchdays including a busy day. Keep public static requests
separate from Worker invocations and Goal Zone analytics. Do not add a Worker
visit counter to every new brand just to measure static traffic.

News images and archives accumulate across time. Store shared images once,
optimize them, and set retention before large archives reach the Pages file
limit. Do not multiply stored daily PNGs by brand count.

# Future Code Main — owner login deployment checklist

Status: **STAGED ONLY** on `feature/main-only-login`. Not published to production.

## Scope
- Login required only for Future Code Main: `/`, `/index`, `/index.html`, `/odds`, `/odds/`, `/odds.html`.
- The homepage's embedded Video Studio and AI Score section are included.
- `ykz-family`, `bw-sport` and `ko-thet-family` remain public.
- Shared assets and JSON data are necessarily public because the independent brand sites use them; this login gates *main website page access*, not all raw football data.

## Owner identity
- Email: `futurecode064@gmail.com`
- Password: stored only in Cloudflare Pages production secret `FCD_MAIN_PASSWORD` (never hardcode it or commit it).
- Signed session secret: separate Cloudflare Pages production secret `FCD_SESSION_SECRET` (minimum 32 randomly generated characters).

## Before deployment (required)
1. Open the existing Cloudflare project for `future-code-football-daily.pages.dev`.
2. Open **Settings > Variables and Secrets** for the **Production** environment.
3. Add encrypted secret **FCD_MAIN_PASSWORD** with the owner's chosen password, then Save.
4. Add encrypted secret **FCD_SESSION_SECRET** with a new unpredictable 64+ character value, then Save. Generate it locally using a password manager; do not reuse the login password.
5. Confirm both names exist as *encrypted secrets*. The values should not appear in GitHub, the page HTML, or logs.
6. Only after that, promote `football-daily/_worker.js` and its tests from `feature/main-only-login` to standalone `main`, then run the **guarded mirror workflow** in `AI-Recap-GitHub` to sync to production branch `football-daily-render`. Run the Cloudflare Pages production deployment if necessary.
7. Verify unauthenticated main home and odds redirect to `/login`, correct login opens both, incorrect credentials fail, logout clears cookie, and all 3 brand home/odds pages are still public.

## Failure and rollback
- Without either secret, the advanced Pages Worker intentionally returns 503 for the main site rather than making it public. **Do not deploy before secrets are saved.**
- To roll back, remove `_worker.js` from the published `football-daily/` output and redeploy (the brand sites and other static files continue to work).
- Check Cloudflare Pages Function deployment logs if the page is unexpectedly locked.

## Implementation
`_worker.js` is a Cloudflare Pages Advanced Mode module worker in the output directory. It checks credentials against Cloudflare encrypted secrets; sessions use an HMAC-SHA256 signed, Secure, HttpOnly, SameSite=Lax cookie with an 8-hour expiry. No localStorage token, no public password, and no client-side-only password check. The advanced worker serves all other paths via `env.ASSETS.fetch`.

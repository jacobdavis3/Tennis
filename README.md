# NYC Tennis Reservation Bot

Automates booking a court on [nycgovparks.org/tennisreservation](https://www.nycgovparks.org/tennisreservation)
for your own account, plus a dashboard to configure and monitor it.

- **`bot/`** — Playwright script that logs in and books a slot. Runs on a GitHub Actions
  schedule (and on demand) via `.github/workflows/reserve.yml`.
- **`dashboard/`** — React app (Vite) deployed to GitHub Pages via `.github/workflows/deploy-pages.yml`.
  Configure the facility/time/duration, trigger a run manually, and view booking history.
- **`data/`** — `bot-config.json` (the bot's recurring settings) and `history.json` (run log).
  Both are committed to the repo so they're shared between the dashboard and the scheduled bot.

## ⚠️ Before this books anything real

I could not load an authenticated session against the live site to inspect its actual markup, so
**`bot/src/selectors.ts` is a best-guess placeholder**, not verified selectors. The bot will not
successfully complete a real booking until you calibrate it:

1. `cd bot && npm install && npx playwright install chromium`
2. `npm run codegen` — opens a real browser with Playwright's Inspector recording every
   click as a selector. Log in and manually click through one full booking (facility → date →
   time slot → checkout → payment → confirmation screen).
3. Copy the selectors the Inspector recorded into `bot/src/selectors.ts`, replacing the
   `// VERIFY` placeholders. Pay particular attention to:
   - the login form field names,
   - what element proves you're logged in (`loggedInMarker`),
   - how the slot grid is structured (`slotRow` / `slotTimeLabel` / `slotBookButton`),
   - the `facilityId` values (dashboard → Config tab needs the real one per facility).
4. Also double check `URLS.login` in the same file.
5. Confirm the **actual rollover time** when a new day 7-days-out opens for booking, and adjust
   the `cron` schedule in `.github/workflows/reserve.yml` to fire a minute or two before it (see
   note on timing below).

Until step 3 is done, scheduled/manual runs will fail fast with a clear error (bad selector),
which is safe — they won't hang or half-complete a booking.

### A timing caveat, honestly

GitHub Actions `schedule` triggers are **not precise** — they commonly fire several minutes late
under load, with no SLA. If slots at your facility get sniped within seconds of opening, GitHub
Actions cron may lose that race regardless of how good the selectors are. It's fine for
"beat most manual humans," but don't expect it to win every time against other bots hitting the
same instant. If that matters, consider triggering runs from something with tighter timing
guarantees (a VPS with `cron`, an AWS Lambda + EventBridge schedule, etc.) instead of GitHub's
scheduler — the bot script itself (`bot/src/index.ts`) doesn't care how it's invoked.

## Setup

### 1. Secrets (bot login)

In the repo's **Settings → Secrets and variables → Actions**, add:

- `NYCGOVPARKS_USERNAME`
- `NYCGOVPARKS_PASSWORD`

These are only ever read inside the GitHub Actions runner — never exposed to the dashboard.

### 2. Enable GitHub Pages

**Settings → Pages → Source → GitHub Actions.** Push to `main` and `deploy-pages.yml` will
publish `dashboard/` automatically.

### 3. Personal access token for the dashboard

The dashboard is a static site with no backend of its own — it talks directly to the GitHub API
from your browser to read/write `data/bot-config.json` and to trigger the workflow. Create a
**fine-grained PAT** scoped to just this repo with:

- Contents: Read and write
- Actions: Read and write

Paste it into the dashboard's Settings tab. It's stored only in that browser's `localStorage` —
never sent anywhere but `api.github.com`. Treat it like a password; anyone with it can write to
your repo and trigger workflow runs.

### 4. Configure and enable

Dashboard → Config tab → fill in facility name/ID, preferred times, duration, days in advance →
**Save to GitHub** → check **Enable scheduled auto-booking**. The next scheduled run will use it.

## Local development

```bash
cd dashboard && npm install && npm run dev   # dashboard at localhost:5173
cd bot && npm install && npm run reserve      # requires NYCGOVPARKS_USERNAME/PASSWORD env vars + data/bot-config.json filled in
```

## Scope and responsible use

This automates **your own** account/permit for personal reservations — one login, one player.
It isn't built for reselling slots or booking on behalf of people who haven't authorized it, and
doing that would likely violate NYC Parks' terms of use. Keep `preferredTimes`/`duration` to what
you'd actually book by hand, and don't run multiple parallel instances against the same account.

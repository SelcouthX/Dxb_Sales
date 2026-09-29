# DXB Deal Scanner

Logs round-trip fares from Dubai every hour, learns what "normal" costs per route and month,
and flags anything 40%+ cheaper. This is the **2–3 week test**: if real deals show up regularly,
the idea is validated and the engine is built. If not, drop it with proof.

## Setup (about 15 minutes)

1. **Get a free Travelpayouts account** → https://www.travelpayouts.com
   - Join the **Aviasales** program.
   - Copy your **API token** (Profile → API token) and your **marker** (your affiliate ID).
2. **Put this folder on GitHub** (or drag-and-drop deploy won't run scheduled functions — use Git).
3. **Netlify → Add new site → Import from Git** → pick the repo. Build settings are read from `netlify.toml`.
4. **Site settings → Environment variables**, add:
   | Name | Value |
   |---|---|
   | `TRAVELPAYOUTS_TOKEN` | your API token |
   | `TRAVELPAYOUTS_MARKER` | your marker (optional, turns links into commission links) |
   | `SCAN_KEY` | any random password, for manual scans |
5. Redeploy. Then open `https://YOUR-SITE.netlify.app/api/scan-now?key=YOUR_SCAN_KEY` once
   to confirm it works. You should see `{"scanned":[...],"newDeals":0,"errors":0}`.
6. Open your site's home page — that's the dashboard. The hourly scan runs by itself from here.

## What to expect

- **Days 1–4:** no deals. It's collecting prices to learn "normal." Watch the *Route health*
  table — "Prices logged" should keep climbing.
- **Day 5+:** deals appear if they exist.
- **Red flag to watch:** if "Found last scan" stays at 0 for many routes, the data source has thin
  coverage for Dubai (its prices come from Aviasales users' searches). That's a real finding, not a bug.

## Decision rule (set it now, before you see results)

After 3 weeks: **5+ genuine deals per week across these 20 routes → worth building the alert product.**
Fewer than that → the idea doesn't work from DXB with this data. Move on.

## Tweak

Everything is in `lib/config.mjs`: destinations, the 40% threshold, trip length, months ahead.

## Files

- `lib/config.mjs` — settings
- `lib/api.mjs` — Travelpayouts calls
- `lib/deals.mjs` — "normal price" and deal math
- `lib/scan.mjs` — one hourly pass, stores data in Netlify Blobs
- `netlify/functions/` — hourly job, manual trigger, dashboard data
- `public/index.html` — dashboard
- `test/` — run `npm test`

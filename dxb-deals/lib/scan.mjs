// One scan pass: fetch prices for the next slice of routes, store history, record deals.
import { getStore } from "@netlify/blobs";
import { ROUTES, ROUTES_PER_RUN, MONTHS_AHEAD, TOKEN } from "./config.mjs";
import { fetchMonth, nextMonths } from "./api.mjs";
import { mergeHistory, findDeals, baselines } from "./deals.mjs";

// DXB keeps its original storage key so data logged before multi-airport support isn't lost.
const historyKey = ({ origin, destination }) =>
  origin === "DXB" ? `history/${destination}` : `history/${origin}-${destination}`;

export async function runScan() {
  if (!TOKEN) throw new Error("Missing TRAVELPAYOUTS_TOKEN env var");
  const store = getStore("dxb-deals");

  // Rotate through routes so each run stays well under the time limit.
  const state = (await store.get("state", { type: "json" })) || { cursor: 0 };
  const start = (state.cursor || 0) % ROUTES.length;
  const slice = [];
  for (let i = 0; i < Math.min(ROUTES_PER_RUN, ROUTES.length); i++) {
    slice.push(ROUTES[(start + i) % ROUTES.length]);
  }
  state.cursor = (start + ROUTES_PER_RUN) % ROUTES.length;

  const months = nextMonths(MONTHS_AHEAD);
  const errors = [];
  const newDeals = [];
  const routeStats = (await store.get("stats", { type: "json" })) || {};
  // Drop stats saved under the old destination-only format (e.g. "ATH").
  for (const k of Object.keys(routeStats)) if (!k.includes("-")) delete routeStats[k];

  for (const r of slice) {
    const results = await Promise.allSettled(months.map((m) => fetchMonth(r.origin, r.destination, m)));
    const fresh = [];
    for (const res of results) {
      if (res.status === "fulfilled") fresh.push(...res.value);
      else errors.push(res.reason.message);
    }

    const key = historyKey(r);
    const history = (await store.get(key, { type: "json" })) || [];
    // Judge fresh prices against history BEFORE adding them, so a deal can't pull its own baseline down.
    newDeals.push(...findDeals(fresh, history));
    const merged = mergeHistory(history, fresh);
    await store.setJSON(key, merged);

    routeStats[`${r.origin}-${r.destination}`] = {
      samples: merged.length,
      lastScan: new Date().toISOString(),
      lastFound: fresh.length,
      months: baselines(merged),
    };
  }

  // Keep a rolling log of deals (newest first, last 300).
  const deals = (await store.get("deals", { type: "json" })) || [];
  const seen = new Set(deals.map((d) => `${d.route}|${d.departAt}|${d.price}`));
  for (const d of newDeals) {
    const id = `${d.route}|${d.departAt}|${d.price}`;
    if (!seen.has(id)) { deals.unshift({ ...d, flaggedAt: new Date().toISOString() }); seen.add(id); }
  }
  await store.setJSON("deals", deals.slice(0, 300));
  await store.setJSON("stats", routeStats);
  await store.setJSON("state", { ...state, lastRun: new Date().toISOString(), lastErrors: errors.slice(0, 10) });

  return { scanned: slice.map((r) => `${r.origin}-${r.destination}`), newDeals: newDeals.length, errors: errors.length };
}

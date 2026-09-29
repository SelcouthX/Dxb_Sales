// One scan pass: fetch prices for the next slice of destinations, store history, record deals.
import { getStore } from "@netlify/blobs";
import { DESTINATIONS, DESTS_PER_RUN, MONTHS_AHEAD, TOKEN } from "./config.mjs";
import { fetchMonth, nextMonths } from "./api.mjs";
import { mergeHistory, findDeals, baselines } from "./deals.mjs";

export async function runScan() {
  if (!TOKEN) throw new Error("Missing TRAVELPAYOUTS_TOKEN env var");
  const store = getStore("dxb-deals");

  // Rotate through destinations so each hourly run stays well under the time limit.
  const state = (await store.get("state", { type: "json" })) || { cursor: 0 };
  const slice = [];
  for (let i = 0; i < DESTS_PER_RUN; i++) {
    slice.push(DESTINATIONS[(state.cursor + i) % DESTINATIONS.length]);
  }
  state.cursor = (state.cursor + DESTS_PER_RUN) % DESTINATIONS.length;

  const months = nextMonths(MONTHS_AHEAD);
  const errors = [];
  const newDeals = [];
  const routeStats = (await store.get("stats", { type: "json" })) || {};

  for (const dest of slice) {
    const results = await Promise.allSettled(months.map((m) => fetchMonth(dest, m)));
    const fresh = [];
    for (const r of results) {
      if (r.status === "fulfilled") fresh.push(...r.value);
      else errors.push(r.reason.message);
    }

    const key = `history/${dest}`;
    const history = (await store.get(key, { type: "json" })) || [];
    // Judge fresh prices against history BEFORE adding them, so a deal can't pull its own baseline down.
    newDeals.push(...findDeals(fresh, history));
    const merged = mergeHistory(history, fresh);
    await store.setJSON(key, merged);

    routeStats[dest] = {
      samples: merged.length,
      lastScan: new Date().toISOString(),
      lastFound: fresh.length,
      months: baselines(merged),
    };
  }

  // Keep a rolling log of deals (newest first, last 200).
  const deals = (await store.get("deals", { type: "json" })) || [];
  const seen = new Set(deals.map((d) => `${d.route}|${d.departAt}|${d.price}`));
  for (const d of newDeals) {
    const id = `${d.route}|${d.departAt}|${d.price}`;
    if (!seen.has(id)) { deals.unshift({ ...d, flaggedAt: new Date().toISOString() }); seen.add(id); }
  }
  await store.setJSON("deals", deals.slice(0, 200));
  await store.setJSON("stats", routeStats);
  await store.setJSON("state", { ...state, lastRun: new Date().toISOString(), lastErrors: errors.slice(0, 10) });

  return { scanned: slice, newDeals: newDeals.length, errors: errors.length };
}

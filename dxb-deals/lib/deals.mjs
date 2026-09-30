// Pure logic — no network, no storage. Easy to test.
import { DEAL_THRESHOLD, GOOD_THRESHOLD, MIN_SAMPLES, HISTORY_DAYS } from "./config.mjs";

export function median(nums) {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// "2026-11-14T08:00:00+04:00" -> "2026-11"
export const monthOf = (iso) => String(iso).slice(0, 7);

// Merge new observations into a route's history, dropping old ones.
// Keeps one entry per (departure day, scan day) so repeated scans don't skew the median.
export function mergeHistory(history, fresh, now = Date.now()) {
  const cutoff = now - HISTORY_DAYS * 864e5;
  const byKey = new Map();
  for (const o of [...history, ...fresh]) {
    if (new Date(o.seenAt).getTime() < cutoff) continue;
    const key = `${String(o.departAt).slice(0, 10)}|${String(o.seenAt).slice(0, 10)}`;
    const prev = byKey.get(key);
    if (!prev || o.price < prev.price) byKey.set(key, o);
  }
  return [...byKey.values()];
}

// "Normal" price = median of everything seen for that route in that departure month.
export function baselines(history) {
  const groups = {};
  for (const o of history) (groups[monthOf(o.departAt)] ||= []).push(o.price);
  const out = {};
  for (const [month, prices] of Object.entries(groups)) {
    out[month] = { median: median(prices), samples: prices.length };
  }
  return out;
}

// A fresh price is flagged if it's at least GOOD_THRESHOLD below that month's normal,
// and we have enough samples to trust "normal".
// tier "deal" = DEAL_THRESHOLD+ below, tier "good" = between GOOD_THRESHOLD and DEAL_THRESHOLD.
export function findDeals(fresh, history) {
  const base = baselines(history);
  const deals = [];
  for (const o of fresh) {
    const b = base[monthOf(o.departAt)];
    if (!b || b.samples < MIN_SAMPLES) continue;
    const drop = 1 - o.price / b.median;
    if (drop >= GOOD_THRESHOLD) {
      deals.push({
        ...o,
        normal: Math.round(b.median),
        dropPct: Math.round(drop * 100),
        tier: drop >= DEAL_THRESHOLD ? "deal" : "good",
      });
    }
  }
  return deals;
}

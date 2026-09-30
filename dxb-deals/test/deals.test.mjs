import { test } from "node:test";
import assert from "node:assert/strict";
import { median, mergeHistory, findDeals, baselines } from "../lib/deals.mjs";

const now = Date.now();
const iso = (daysAgo) => new Date(now - daysAgo * 864e5).toISOString();

// 20 "normal" prices around AED 1,400 for November departures, seen over 20 different days
const history = Array.from({ length: 20 }, (_, i) => ({
  route: "DXB-ATH", price: 1300 + (i % 5) * 50,
  departAt: `2026-11-${String(i + 1).padStart(2, "0")}T08:00:00+04:00`, seenAt: iso(i + 1),
}));

test("median", () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([1, 2, 3, 4]), 2.5);
  assert.equal(median([]), null);
});

test("flags a 45% drop", () => {
  const fresh = [{ route: "DXB-ATH", price: 770, departAt: "2026-11-20T08:00:00+04:00", seenAt: iso(0) }];
  const deals = findDeals(fresh, history);
  assert.equal(deals.length, 1);
  assert.equal(deals[0].normal, 1400);
  assert.equal(deals[0].dropPct, 45);
  assert.equal(deals[0].tier, "deal");
});

test("flags a 30% drop as a good price, not a deal", () => {
  const fresh = [{ route: "DXB-ATH", price: 980, departAt: "2026-11-20T08:00:00+04:00", seenAt: iso(0) }];
  const deals = findDeals(fresh, history);
  assert.equal(deals.length, 1);
  assert.equal(deals[0].tier, "good");
  assert.equal(deals[0].dropPct, 30);
});

test("ignores a 20% drop", () => {
  const fresh = [{ route: "DXB-ATH", price: 1120, departAt: "2026-11-20T08:00:00+04:00", seenAt: iso(0) }];
  assert.equal(findDeals(fresh, history).length, 0);
});

test("ignores a normal price", () => {
  const fresh = [{ route: "DXB-ATH", price: 1250, departAt: "2026-11-20T08:00:00+04:00", seenAt: iso(0) }];
  assert.equal(findDeals(fresh, history).length, 0);
});

test("won't judge a month with too little data", () => {
  const fresh = [{ route: "DXB-ATH", price: 300, departAt: "2026-12-20T08:00:00+04:00", seenAt: iso(0) }];
  assert.equal(findDeals(fresh, history).length, 0);
});

test("history drops old entries and dedupes same day", () => {
  const old = { price: 999, departAt: "2026-11-05", seenAt: iso(60) };
  const dupA = { price: 1500, departAt: "2026-11-06", seenAt: iso(0) };
  const dupB = { price: 1450, departAt: "2026-11-06", seenAt: iso(0) };
  const merged = mergeHistory([old, dupA], [dupB], now);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].price, 1450);
});

test("baselines per month", () => {
  const b = baselines(history);
  assert.equal(b["2026-11"].samples, 20);
});

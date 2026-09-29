// Talks to the Travelpayouts (Aviasales) Data API.
// Docs: https://support.travelpayouts.com/hc/en-us/articles/203956163-Aviasales-Data-API
import {
  ORIGIN, CURRENCY, MARKET, TOKEN, MARKER, TRIP_MIN_DAYS, TRIP_MAX_DAYS,
} from "./config.mjs";

const BASE = "https://api.travelpayouts.com/aviasales/v3/grouped_prices";

// Cheapest round trip per departure day, for one destination and one month.
export async function fetchMonth(destination, month) {
  const params = new URLSearchParams({
    origin: ORIGIN,
    destination,
    departure_at: month, // YYYY-MM
    group_by: "departure_at",
    currency: CURRENCY,
    min_trip_duration: String(TRIP_MIN_DAYS),
    max_trip_duration: String(TRIP_MAX_DAYS),
  });
  if (MARKET) params.set("market", MARKET);

  const res = await fetch(`${BASE}?${params}`, {
    headers: { "X-Access-Token": TOKEN, "Accept-Encoding": "gzip, deflate" },
  });
  if (!res.ok) throw new Error(`${destination} ${month}: HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(`${destination} ${month}: ${json.error}`);

  const seenAt = new Date().toISOString();
  return Object.values(json.data || {}).map((t) => ({
    route: `${ORIGIN}-${destination}`,
    destination,
    price: t.price,
    airline: t.airline,
    transfers: t.transfers ?? null,
    departAt: t.departure_at,
    returnAt: t.return_at || null,
    link: bookingLink(t.link),
    seenAt,
  }));
}

function bookingLink(path) {
  if (!path) return null;
  const url = `https://www.aviasales.com${path.startsWith("/search") ? "" : "/search"}${path}`;
  return MARKER ? `${url}&marker=${encodeURIComponent(MARKER)}` : url;
}

// Next N months as YYYY-MM strings, starting this month.
export function nextMonths(n, from = new Date()) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + i, 1));
    out.push(d.toISOString().slice(0, 7));
  }
  return out;
}

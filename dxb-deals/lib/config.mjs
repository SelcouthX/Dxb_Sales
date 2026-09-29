// All settings in one place. Change these freely.

export const ORIGIN = process.env.ORIGIN || "DXB"; // DXB city code also covers DWC

// Start narrow: ~20 destinations Dubai residents actually fly to.
export const DESTINATIONS = [
  "ATH", "LCA", "TBS", "IST", "BAK", "EVN", // short-haul / Europe edge
  "BKK", "MNL", "KUL", "CMB", "MLE",        // Asia
  "BOM", "DEL", "COK", "KTM",               // South Asia home routes
  "CAI", "AMM",                             // MENA
  "LON", "PAR", "MIL",                      // Europe long-haul
];

export const MONTHS_AHEAD = 6;      // scan departures this many months out
export const DESTS_PER_RUN = 5;     // hourly run rotates through the list (each route ~every 4h)
export const DEAL_THRESHOLD = 0.4;  // 40% below normal = deal
export const MIN_SAMPLES = 15;      // don't judge "normal" until we've seen this many prices
export const HISTORY_DAYS = 45;     // forget observations older than this
export const TRIP_MIN_DAYS = 3;     // round trips between 3 and 14 days
export const TRIP_MAX_DAYS = 14;

export const CURRENCY = process.env.CURRENCY || "aed";
export const MARKET = process.env.MARKET || ""; // empty = auto from origin
export const TOKEN = process.env.TRAVELPAYOUTS_TOKEN;
export const MARKER = process.env.TRAVELPAYOUTS_MARKER || ""; // affiliate ID → commission links

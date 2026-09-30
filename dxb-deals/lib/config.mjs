// All settings in one place. Change these freely.

// UAE departure airports. DXB city code also covers DWC.
// UAE departure airports. DXB city code also covers DWC. SHJ = Air Arabia's hub.
export const ORIGINS = ["DXB", "AUH", "SHJ"];

// Destinations matched to the UAE's biggest communities + popular leisure trips.
export const DESTINATIONS = [
  // Home routes, biggest communities first
  "BOM", "DEL", "COK", "BLR", "HYD",        // India
  "KHI", "LHE", "ISB",                      // Pakistan
  "DAC", "MNL", "KTM", "CMB",               // Bangladesh, Philippines, Nepal, Sri Lanka
  "CAI", "AMM", "BEY", "ADD", "MOW", "LON", // Egypt, Jordan, Lebanon, Ethiopia, Russia, UK
  // Europe leisure
  "ATH", "LCA", "IST", "ROM", "MIL", "BCN", "MAD", "PAR",
  // Short-haul weekends
  "TBS", "BAK", "EVN",
  // Asia leisure
  "BKK", "KUL", "MLE", "DPS",
];

// Every origin × destination pair gets scanned.
export const ROUTES = ORIGINS.flatMap((o) => DESTINATIONS.map((d) => ({ origin: o, destination: d })));

export const MONTHS_AHEAD = 6;      // scan departures this many months out
export const ROUTES_PER_RUN = 5;    // each run (every 20 min) scans this many routes
export const DEAL_THRESHOLD = 0.4;  // 40% below normal = deal
export const GOOD_THRESHOLD = 0.25; // 25–39% below normal = "good price" (lower tier, for testing)
export const MIN_SAMPLES = 15;      // don't judge "normal" until we've seen this many prices
export const HISTORY_DAYS = 45;     // forget observations older than this
export const TRIP_MIN_DAYS = 3;     // round trips between 3 and 14 days
export const TRIP_MAX_DAYS = 14;

export const CURRENCY = process.env.CURRENCY || "aed";
export const MARKET = process.env.MARKET || ""; // empty = auto from origin
export const TOKEN = process.env.TRAVELPAYOUTS_TOKEN;
export const MARKER = process.env.TRAVELPAYOUTS_MARKER || ""; // affiliate ID → commission links

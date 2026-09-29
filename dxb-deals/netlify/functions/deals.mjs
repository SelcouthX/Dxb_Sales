// Read-only data for the dashboard: /api/deals
import { getStore } from "@netlify/blobs";

export default async () => {
  const store = getStore("dxb-deals");
  const [deals, stats, state] = await Promise.all([
    store.get("deals", { type: "json" }),
    store.get("stats", { type: "json" }),
    store.get("state", { type: "json" }),
  ]);
  return Response.json({ deals: deals || [], stats: stats || {}, state: state || {} });
};

export const config = { path: "/api/deals" };

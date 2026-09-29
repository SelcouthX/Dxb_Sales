// Manual trigger for testing: /api/scan-now?key=YOUR_SCAN_KEY
import { runScan } from "../../lib/scan.mjs";

export default async (req) => {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.SCAN_KEY || key !== process.env.SCAN_KEY) {
    return new Response("Forbidden", { status: 403 });
  }
  try {
    return Response.json(await runScan());
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};

export const config = { path: "/api/scan-now" };

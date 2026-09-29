// Runs automatically every 20 minutes on Netlify (5 routes per run → each of the 99 routes ~every 6.5 hours).
import { runScan } from "../../lib/scan.mjs";

export default async () => {
  const result = await runScan();
  console.log("scan", JSON.stringify(result));
};

export const config = { schedule: "*/20 * * * *" };

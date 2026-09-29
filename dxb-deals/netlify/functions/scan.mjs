// Runs automatically every hour on Netlify.
import { runScan } from "../../lib/scan.mjs";

export default async () => {
  const result = await runScan();
  console.log("scan", JSON.stringify(result));
};

export const config = { schedule: "@hourly" };

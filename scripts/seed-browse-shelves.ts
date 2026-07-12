/**
 * One-shot seed: npx tsx scripts/seed-browse-shelves.ts
 * Loads .env.local then syncs AniList browse shelves into Postgres.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

async function main(): Promise<void> {
  const { syncBrowseShelves } = await import("../lib/browse-sync");
  const result = await syncBrowseShelves();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

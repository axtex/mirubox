import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local first (Next.js convention), then fall back to .env
config({ path: ".env.local" });
config({ path: ".env" });

function withSslMode(url: string): string {
  return `${url}${url.includes("?") ? "&" : "?"}sslmode=require`;
}

// Schema commands need a direct connection — Supabase's transaction pooler (6543) breaks prepared statements.
const schemaUrl = process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: schemaUrl ? withSslMode(schemaUrl) : undefined,
  },
});

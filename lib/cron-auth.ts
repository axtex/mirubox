/**
 * Bearer auth for /api/cron/*. Required in every environment, including `next dev`.
 * Local curls must send Authorization: Bearer $CRON_SECRET from .env.local.
 */
export function cronAuthError(req: Request): Response | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron] CRON_SECRET not set");
    return Response.json({ error: "Misconfigured" }, { status: 500 });
  }

  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

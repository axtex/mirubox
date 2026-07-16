import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/auth";
import { getUpcomingEpisodes, getRecentReleases } from "@/lib/schedule-data";
import { ScheduleClient } from "@/components/schedule/ScheduleClient";

export default async function SchedulePage(): Promise<React.JSX.Element> {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="py-8 min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 11,
              color: "var(--fg-muted)",
            }}
          >
            <Link
              href="/auth/signin?callbackUrl=/schedule"
              style={{
                color: "var(--primary)",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Sign in
            </Link>
            {" "}to see your schedule.
          </p>
        </div>
      </div>
    );
  }

  const [upcoming, recent] = await Promise.all([
    getUpcomingEpisodes(session.user.id),
    getRecentReleases(session.user.id),
  ]);

  return (
    <div className="py-8 min-h-screen" style={{ background: "var(--bg)" }}>
      <Suspense fallback={null}>
        <ScheduleClient upcoming={upcoming} recent={recent} />
      </Suspense>
    </div>
  );
}

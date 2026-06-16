import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import type { XpEvent } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { timeAgo, xpIcon } from "@/lib/profile";

export default async function ProfileXpPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/profile/xp");

  const xpEvents = await prisma.xpEvent.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="py-8" style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 text-label mb-6 link-subtle"
        style={{ color: "var(--fg-subtle)" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        BACK TO PROFILE
      </Link>

      <div className="section-header mb-6">
        <div className="section-header-row">
          <h1 className="text-headline-lg font-display flex items-center gap-2 uppercase">
            <Clock className="w-5 h-5" style={{ color: "var(--primary)" }} />
            XP HISTORY
          </h1>
        </div>
        <div className="section-underline" />
      </div>

      {xpEvents.length === 0 ? (
        <p className="text-label" style={{ color: "var(--fg-subtle)" }}>NO ACTIVITY YET</p>
      ) : (
        <div className="scrollbar-theme flex flex-col gap-2 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
          {xpEvents.map((event: XpEvent) => (
            <div
              key={event.id}
              className="flex items-center gap-3 px-4 py-3"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 4 }}
            >
              <span style={{ color: "var(--fg-subtle)" }}>{xpIcon(event.reason)}</span>
              <span className="flex-1 text-sm" style={{ color: "var(--fg-muted)" }}>
                {event.reason}
              </span>
              <span className="text-label shrink-0" style={{ color: "var(--fg-subtle)", fontSize: 9 }}>
                {timeAgo(event.createdAt)}
              </span>
              <span className="text-label shrink-0" style={{ color: "var(--primary)" }}>
                +{event.amount} XP
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

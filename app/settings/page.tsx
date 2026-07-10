import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AccountSettingsForm } from "@/components/settings/AccountSettingsForm";

export const metadata: Metadata = {
  title: "Settings — mirubox",
};

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="mb-4">
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-subtle)", letterSpacing: "0.1em" }}>
          {title}
        </p>
        <div style={{ width: 24, height: 1.5, background: "var(--primary)", marginTop: 4 }} />
      </div>
      {children}
    </section>
  );
}

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/profile");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, displayName: true, username: true },
  });

  const displayName = user?.displayName || user?.name || user?.email?.split("@")[0] || "";

  return (
    <div className="py-8" style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <div className="mb-8">
        <h1
          className="mb-2 font-display uppercase"
          style={{ fontFamily: "var(--font-anybody)", fontSize: 28, fontWeight: 800, letterSpacing: "0.04em", color: "var(--fg)" }}
        >
          SETTINGS
        </h1>
        <Link
          href="/profile"
          className="flex w-fit items-center gap-1.5"
          style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-subtle)", textDecoration: "none", letterSpacing: "0.06em" }}
        >
          <ChevronLeft className="w-3.5 h-3.5 shrink-0 -ml-[5px]" strokeWidth={2} />
          BACK TO PROFILE
        </Link>
      </div>

      <div style={{ maxWidth: 480 }}>
        <SettingsSection title="ACCOUNT">
          <AccountSettingsForm
            initialDisplayName={displayName}
            username={user?.username ?? null}
            email={user?.email ?? null}
          />
        </SettingsSection>

        <SettingsSection title="NOTIFICATIONS">
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-subtle)" }}>
            Email preferences coming soon.
          </p>
        </SettingsSection>

        <SettingsSection title="DANGER ZONE">
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-subtle)" }}>
            Delete account coming soon.
          </p>
        </SettingsSection>
      </div>
    </div>
  );
}

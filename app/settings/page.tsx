import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "var(--fg-subtle)", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/settings");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });

  return (
    <div className="py-8" style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <div className="mb-8">
        <h1
          className="font-display uppercase"
          style={{ fontFamily: "var(--font-anybody)", fontSize: 28, fontWeight: 800, letterSpacing: "0.04em", color: "var(--fg)" }}
        >
          SETTINGS
        </h1>
        <Link
          href="/profile"
          style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-subtle)", textDecoration: "none", letterSpacing: "0.06em" }}
        >
          ← BACK TO PROFILE
        </Link>
      </div>

      <div style={{ maxWidth: 480 }}>

        {/* Account */}
        <SettingsSection title="ACCOUNT">
          {/* TODO: wire up save action for display name */}
          <Field label="DISPLAY NAME">
            <input
              type="text"
              defaultValue={user?.name ?? ""}
              disabled
              style={{
                width: "100%",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 2,
                padding: "8px 10px",
                fontFamily: "var(--font-geist)",
                fontSize: 13,
                color: "var(--fg-muted)",
                outline: "none",
              }}
            />
          </Field>
          <Field label="EMAIL">
            <input
              type="email"
              defaultValue={user?.email ?? ""}
              disabled
              style={{
                width: "100%",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 2,
                padding: "8px 10px",
                fontFamily: "var(--font-geist)",
                fontSize: 13,
                color: "var(--fg-subtle)",
                outline: "none",
              }}
            />
          </Field>
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "var(--fg-subtle)" }}>
            Account editing coming soon.
          </p>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="NOTIFICATIONS">
          {/* TODO: implement email notification preferences */}
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-subtle)" }}>
            Email preferences coming soon.
          </p>
        </SettingsSection>

        {/* XP & badges */}
        <SettingsSection title="XP & BADGES">
          <Link
            href="/how-it-works"
            style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--primary)", textDecoration: "none", letterSpacing: "0.04em" }}
          >
            Learn how XP and badges work →
          </Link>
        </SettingsSection>

        {/* Danger zone */}
        <SettingsSection title="DANGER ZONE">
          {/* TODO: implement account deletion flow */}
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-subtle)" }}>
            Delete account coming soon.
          </p>
        </SettingsSection>

      </div>
    </div>
  );
}

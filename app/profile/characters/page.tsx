import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CHARACTER_ROSTER } from "@/lib/characters";

export default async function ProfileCharactersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/profile/characters");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { xp: true },
  });

  if (!user) redirect("/auth/signin");

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
          <h1 className="text-headline-lg font-display uppercase">YOUR CHARACTERS</h1>
        </div>
        <div className="section-underline" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {CHARACTER_ROSTER.map((char) => {
          const isUnlocked = user.xp >= char.xpRequired;
          const unlockPct = char.xpRequired > 0 ? Math.min(100, Math.round((user.xp / char.xpRequired) * 100)) : 100;

          return (
            <Link
              key={char.id}
              href={isUnlocked ? "/chat" : "/profile/characters"}
              className="flex flex-col items-center gap-2 p-4 text-center"
              style={{
                background: isUnlocked ? `${char.accentColor}11` : "var(--bg-card)",
                border: `1px solid ${isUnlocked ? char.accentColor + "55" : "var(--border)"}`,
                borderRadius: 4,
              }}
            >
              <span style={{ fontSize: 40, opacity: isUnlocked ? 1 : 0.3 }}>
                {isUnlocked ? char.avatarEmoji : "🔒"}
              </span>
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ fontFamily: "var(--font-anybody)", color: isUnlocked ? "var(--fg)" : "var(--fg-subtle)" }}
                >
                  {char.name}
                </p>
                <p className="text-label mt-0.5" style={{ color: "var(--fg-subtle)", fontSize: 9 }}>
                  {char.anime}
                </p>
              </div>
              {isUnlocked ? (
                <span
                  className="text-label px-2 py-0.5"
                  style={{ background: char.accentColor, color: "#fff", borderRadius: 2, fontSize: 9 }}
                >
                  UNLOCKED
                </span>
              ) : (
                <>
                  <p className="text-label" style={{ color: "var(--primary)", fontSize: 9 }}>
                    UNLOCK AT {char.xpRequired} XP
                  </p>
                  <div className="w-full overflow-hidden" style={{ height: 2, background: "var(--bg-elevated)", borderRadius: 1 }}>
                    <div className="h-full" style={{ width: `${unlockPct}%`, background: char.accentColor, borderRadius: 1 }} />
                  </div>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

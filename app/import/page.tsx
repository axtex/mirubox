import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ImportClient } from "@/components/import/ImportClient";

export default async function ImportPage(): Promise<React.JSX.Element> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/import");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      anilistUsername: true,
      lastAnilistImport: true,
      lastMalImport: true,
    },
  });

  return (
    <div className="py-8 min-h-screen" style={{ background: "var(--bg)" }}>
      <ImportClient
        anilistUsername={user?.anilistUsername ?? null}
        lastAnilistImport={user?.lastAnilistImport?.toISOString() ?? null}
        lastMalImport={user?.lastMalImport?.toISOString() ?? null}
      />
    </div>
  );
}

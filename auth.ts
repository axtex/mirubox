import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// Auth.js requires a full URL (with protocol). Vercel env vars are often set as "mirubox.vercel.app".
for (const key of ["AUTH_URL", "NEXTAUTH_URL"] as const) {
  const value = process.env[key];
  if (value && !/^https?:\/\//i.test(value)) {
    process.env[key] = `https://${value}`;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: process.env.EMAIL_FROM!,
    }),
  ],
  trustHost: true,
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      const userId = user?.id ?? token.sub;

      // session.update() after onboarding: always re-read DB so proxy sees onboarded=true.
      // Do this before needsProfile so a stale JWT cannot overwrite the fresh row.
      if (trigger === "update" && userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            username: true,
            displayName: true,
            avatarUrl: true,
            onboarded: true,
          },
        });
        if (dbUser) {
          token.username = dbUser.username ?? null;
          token.displayName = dbUser.displayName ?? null;
          token.avatarUrl = dbUser.avatarUrl ?? null;
          token.onboarded = dbUser.onboarded;
          if (dbUser.displayName) token.name = dbUser.displayName;
          return token;
        }
        // Fall through to client patch if DB read fails.
        const patch = session as Partial<{
          username: string | null;
          displayName: string | null;
          avatarUrl: string | null;
          onboarded: boolean;
        }> | null;
        if (patch) {
          if (patch.username !== undefined) token.username = patch.username;
          if (patch.displayName !== undefined) token.displayName = patch.displayName;
          if (patch.avatarUrl !== undefined) token.avatarUrl = patch.avatarUrl;
          if (patch.onboarded !== undefined) token.onboarded = patch.onboarded;
        }
        return token;
      }

      // Refresh when signing in, or when profile fields are still missing (null/undefined).
      // Important: older sessions may have username: null permanently if we only check undefined.
      // Also re-read while onboarded is false so completing onboarding is visible to proxy.
      const needsProfile =
        Boolean(userId) &&
        (Boolean(user?.id) ||
          !token.username ||
          token.onboarded === false ||
          token.avatarUrl === undefined ||
          token.displayName === undefined ||
          token.onboarded === undefined);

      if (userId && needsProfile) {
        if (user?.id) token.sub = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            username: true,
            displayName: true,
            avatarUrl: true,
            onboarded: true,
          },
        });
        token.username = dbUser?.username ?? null;
        token.displayName = dbUser?.displayName ?? null;
        token.avatarUrl = dbUser?.avatarUrl ?? null;
        token.onboarded = dbUser?.onboarded ?? false;
        if (dbUser?.displayName) token.name = dbUser.displayName;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.username = token.username ?? null;
        session.user.displayName = token.displayName ?? null;
        session.user.avatarUrl = token.avatarUrl ?? null;
        session.user.onboarded = token.onboarded ?? false;
        if (token.displayName) {
          session.user.name = token.displayName;
        }
      }
      return session;
    },
  },
});

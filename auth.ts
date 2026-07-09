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
      if (user?.id) {
        token.sub = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
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
      }
      if (trigger === "update" && session) {
        const patch = session as Partial<{
          username: string | null;
          displayName: string | null;
          avatarUrl: string | null;
          onboarded: boolean;
        }>;
        if (patch.username !== undefined) token.username = patch.username;
        if (patch.displayName !== undefined) token.displayName = patch.displayName;
        if (patch.avatarUrl !== undefined) token.avatarUrl = patch.avatarUrl;
        if (patch.onboarded !== undefined) token.onboarded = patch.onboarded;
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
      }
      return session;
    },
  },
});

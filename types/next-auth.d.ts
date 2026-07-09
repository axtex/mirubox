import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username?: string | null;
      displayName?: string | null;
      avatarUrl?: string | null;
      onboarded: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
    onboarded?: boolean;
  }
}

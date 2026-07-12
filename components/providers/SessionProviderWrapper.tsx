"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/** Session is resolved client-side so the root layout stays sync / cacheable. */
export function SessionProviderWrapper({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

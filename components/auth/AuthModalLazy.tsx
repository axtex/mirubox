"use client";

import dynamic from "next/dynamic";

const AuthModal = dynamic(
  () => import("@/components/auth/AuthModal").then((m) => m.AuthModal),
  { ssr: false },
);

export function AuthModalLazy(): React.JSX.Element {
  return <AuthModal />;
}

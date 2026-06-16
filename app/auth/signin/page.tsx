import { Suspense } from "react";
import { SignInForm } from "./SignInForm";

export default function SignInPage() {
  return (
    <div
      className="min-h-dvh flex items-center justify-center"
      style={{ background: "var(--bg)" }}
    >
      <Suspense fallback={<div style={{ color: "var(--fg-muted)" }} className="text-sm">Loading…</div>}>
        <SignInForm />
      </Suspense>
    </div>
  );
}

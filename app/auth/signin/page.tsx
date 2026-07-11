import { Suspense } from "react";
import { SignInForm } from "./SignInForm";
import { StatusMessage } from "@/components/ui/StatusMessage";

export default function SignInPage() {
  return (
    <div
      className="min-h-dvh flex items-center justify-center px-4"
      style={{ background: "var(--bg)" }}
    >
      <Suspense fallback={<StatusMessage block variant="muted">Loading…</StatusMessage>}>
        <SignInForm />
      </Suspense>
    </div>
  );
}

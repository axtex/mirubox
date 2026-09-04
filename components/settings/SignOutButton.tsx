"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export function SignOutButton(): React.JSX.Element {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void signOut({ callbackUrl: "/" });
      }}
      className="btn-ghost btn-ghost-sm"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}

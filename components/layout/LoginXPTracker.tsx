"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/context/ToastContext";
import type { ToastNotification } from "@/lib/xp";

export function LoginXPTracker(): null {
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";
  const { showToast } = useToast();

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch("/api/auth/login-xp", { method: "POST" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { notifications?: ToastNotification[] } | null) => {
        data?.notifications?.forEach((n) => showToast(n));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  return null;
}

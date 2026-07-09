"use client";

import { useEffect } from "react";

export function LoginXPTracker({ isLoggedIn }: { isLoggedIn: boolean }): null {
  useEffect(() => {
    if (!isLoggedIn) return;
    fetch("/api/auth/login-xp", { method: "POST" }).catch(() => {});
  }, [isLoggedIn]);

  return null;
}

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const POLL_INTERVAL_MS = 60000;

export function useNotificationPolling() {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session?.user) return;

    let cancelled = false;

    const fetchCount = async () => {
      try {
        const res = await fetch("/api/notifications/unread-count");
        if (!res.ok) return;
        const data = (await res.json()) as { count: number };
        if (!cancelled) setUnreadCount(data.count);
      } catch {
        // Silent fail — don't crash on network error
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session]);

  return { unreadCount, setUnreadCount };
}

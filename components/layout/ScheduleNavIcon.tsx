"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";

/** Desktop nav calendar icon — matches NotificationBell button chrome. */
export function ScheduleNavIcon(): React.JSX.Element {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href="/schedule"
      title="Schedule"
      aria-label="Schedule"
      className="relative flex items-center justify-center transition-colors"
      style={{
        width: 32,
        height: 32,
        background: hovered ? "rgba(232, 23, 63, 0.05)" : "transparent",
        border: `1px solid ${hovered ? "var(--primary)" : "var(--bg-card-high)"}`,
        borderRadius: 2,
        color: hovered ? "var(--primary)" : "var(--fg-muted)",
        textDecoration: "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <CalendarDays className="w-3.5 h-3.5" />
    </Link>
  );
}

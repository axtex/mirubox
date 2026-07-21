import type { LucideIcon } from "lucide-react";
import { actionIcon } from "@/lib/activity-display";
import {
  getNotifVisual,
  type NotifVisualType,
} from "@/lib/notification-visuals";
import type { ActivityAction } from "@/lib/profile-types";
import { IconCircle } from "@/components/ui/IconCircle";

export const metadata = {
  title: "Icon preview · mirubox",
  robots: { index: false, follow: false },
};

const NOTIF_TYPES: NotifVisualType[] = [
  "BADGE_EARNED",
  "RANK_UP",
  "LIST_LIKED",
  "NEW_FOLLOWER",
  "EPISODE_AVAILABLE",
  "CHAPTER_AVAILABLE",
  "XP",
  "ERROR",
];

const ACTIVITY_ACTIONS: ActivityAction[] = [
  "NEW_FOLLOWER",
  "LIST_LIKED",
  "ADD_TO_TRACKER",
  "MARK_COMPLETED",
  "RATE_TITLE",
  "WRITE_REVIEW",
  "BADGE_UNLOCKED",
  "CREATE_LIST",
  "DAILY_LOGIN",
];

function IconChip({
  Icon,
  bg,
  border,
  label,
  sub,
}: {
  Icon: LucideIcon;
  bg: string;
  border: string;
  label: string;
  sub: string;
}): React.JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderBottom: "1px solid var(--bg-card)",
      }}
    >
      <IconCircle Icon={Icon} bg={bg} border={border} />
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 12, color: "var(--fg)", margin: 0 }}>{label}</p>
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 9,
            color: "var(--fg-subtle)",
            margin: "2px 0 0",
          }}
        >
          {sub}
        </p>
      </div>
    </div>
  );
}

export default function IconPreviewPage(): React.JSX.Element {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "32px 16px 64px",
      }}
    >
      <h1
        style={{
          fontSize: 18,
          color: "var(--fg)",
          margin: "0 0 4px",
          fontWeight: 600,
        }}
      >
        Lucide icon preview
      </h1>
      <p
        style={{
          fontSize: 12,
          color: "var(--fg-muted)",
          margin: "0 0 28px",
        }}
      >
        Activity + notification glyphs after emoji → Lucide swap. Dev-only.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
        }}
      >
        <section
          style={{
            border: "1px solid var(--bg-card)",
            borderRadius: 4,
            overflow: "hidden",
            background: "var(--bg-surface)",
          }}
        >
          <header
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid var(--bg-card)",
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              color: "var(--fg-subtle)",
              letterSpacing: "0.06em",
            }}
          >
            NOTIFICATIONS
          </header>
          {NOTIF_TYPES.map((type) => {
            const v = getNotifVisual(type);
            return (
              <IconChip
                key={type}
                Icon={v.Icon}
                bg={v.bg}
                border={v.border}
                label={type}
                sub={v.Icon.displayName ?? type}
              />
            );
          })}
        </section>

        <section
          style={{
            border: "1px solid var(--bg-card)",
            borderRadius: 4,
            overflow: "hidden",
            background: "var(--bg-surface)",
          }}
        >
          <header
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid var(--bg-card)",
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              color: "var(--fg-subtle)",
              letterSpacing: "0.06em",
            }}
          >
            ACTIVITY
          </header>
          {ACTIVITY_ACTIONS.map((action) => {
            const v = actionIcon(action);
            return (
              <IconChip
                key={action}
                Icon={v.Icon}
                bg={v.bg}
                border={v.border}
                label={action}
                sub={v.Icon.displayName ?? action}
              />
            );
          })}
        </section>
      </div>
    </main>
  );
}

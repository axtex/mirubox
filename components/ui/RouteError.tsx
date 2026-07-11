"use client";

import { StatusMessage } from "@/components/ui/StatusMessage";

interface RouteErrorProps {
  message: string;
  reset: () => void;
}

/** Shared error-boundary UI for route-level error.tsx files — matches app/not-found.tsx's tone. */
export function RouteError({ message, reset }: RouteErrorProps): React.JSX.Element {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 text-center"
      style={{ background: "var(--bg)" }}
    >
      <StatusMessage
        block
        variant="muted"
        style={{
          fontSize: 11,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {message}
      </StatusMessage>
      <button type="button" onClick={reset} className="review-modal-save" style={{ padding: "7px 16px", fontSize: 10 }}>
        TRY AGAIN
      </button>
    </div>
  );
}

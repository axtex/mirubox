"use client";

import { RouteError } from "@/components/ui/RouteError";

export default function TrackerError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return <RouteError message="Failed to load your tracker." reset={reset} />;
}

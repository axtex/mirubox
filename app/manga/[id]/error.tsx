"use client";

import { RouteError } from "@/components/ui/RouteError";

export default function MangaError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return <RouteError message="Failed to load this title." reset={reset} />;
}

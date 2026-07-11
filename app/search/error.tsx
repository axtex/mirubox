"use client";

import { RouteError } from "@/components/ui/RouteError";

export default function SearchError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return <RouteError message="Search unavailable." reset={reset} />;
}

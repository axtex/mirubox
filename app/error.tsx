"use client";

import { RouteError } from "@/components/ui/RouteError";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return <RouteError message="Something went wrong." reset={reset} />;
}

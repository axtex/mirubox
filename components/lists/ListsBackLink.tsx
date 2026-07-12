"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getListsBackHref } from "@/lib/lists-back";

export function ListsBackLink(): React.JSX.Element {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        router.push(getListsBackHref());
      }}
      className="mb-5 flex w-fit items-center gap-1.5"
      style={{
        fontFamily: "var(--font-space-mono)",
        fontSize: 10,
        color: "var(--fg-muted)",
        letterSpacing: "0.06em",
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
      }}
    >
      <ChevronLeft className="w-3.5 h-3.5 shrink-0 -ml-[5px]" strokeWidth={2} />
      LISTS
    </button>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 text-center"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="font-display select-none"
        style={{
          fontFamily: "var(--font-anybody)",
          fontSize: "clamp(96px, 20vw, 160px)",
          fontWeight: 800,
          letterSpacing: "-0.06em",
          lineHeight: 1,
          color: "var(--fg-subtle)",
          opacity: 0.25,
        }}
      >
        404
      </div>

      <h1
        className="font-display uppercase"
        style={{
          fontFamily: "var(--font-anybody)",
          fontSize: "clamp(16px, 3vw, 22px)",
          fontWeight: 700,
          letterSpacing: "0.05em",
          color: "var(--fg)",
        }}
      >
        THIS PART IS UNDER CONSTRUCTION.
      </h1>

      <div className="flex items-center" style={{ gap: 6 }}>
        <Link href="/contact" className="review-modal-cancel" style={{ textDecoration: "none" }}>
          REPORT
        </Link>
        <button
          type="button"
          onClick={() => router.back()}
          className="review-modal-save inline-flex items-center gap-0.5"
        >
          RETURN
          <ChevronRight className="w-2.5 h-2.5 shrink-0" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

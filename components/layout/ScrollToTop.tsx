"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** Reset window + document scroll (both axes) and dismiss focus-driven iOS zoom. */
function resetViewportScroll(): void {
  const active = document.activeElement;
  if (active instanceof HTMLElement && active !== document.body) {
    active.blur();
  }

  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.documentElement.scrollLeft = 0;
  document.body.scrollTop = 0;
  document.body.scrollLeft = 0;
}

/** Reset window scroll on client navigations (App Router). */
export function ScrollToTop(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    resetViewportScroll();
    // Next / iOS may restore scroll after the first paint — re-assert.
    const id = requestAnimationFrame(() => {
      resetViewportScroll();
      requestAnimationFrame(resetViewportScroll);
    });
    return () => cancelAnimationFrame(id);
  }, [pathname, search]);

  return null;
}

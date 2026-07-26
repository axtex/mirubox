"use client";

import { useEffect, useState } from "react";

/** True when viewport is below the `md` (768px) breakpoint. SSR-safe (false until mount). */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = (): void => {
      setIsMobile(window.innerWidth < 768);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

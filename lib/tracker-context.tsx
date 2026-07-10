"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useToast, type Toast } from "@/context/ToastContext";
import type { ToastNotification } from "@/lib/xp";

function fireToasts(showToast: (t: Omit<Toast, "id">) => void, notifications?: ToastNotification[]) {
  notifications?.forEach((n) => showToast(n));
}

export interface TrackerMapEntry {
  status: string;
  favourite: boolean;
}

/** Tracker rows used only for favourites — excluded from tracker UI. */
export const FAVOURITE_ONLY_STATUS = "FAVOURITE";

export function isTrackedEntry(entry: TrackerMapEntry | null | undefined): boolean {
  return entry != null && entry.status !== FAVOURITE_ONLY_STATUS;
}

interface TrackerContextValue {
  isLoggedIn: boolean;
  trackerMap: Map<number, TrackerMapEntry>;
  favouriteIds: Set<number>;
  addToTracker: (mediaId: number, mediaType: string, status?: string) => Promise<void>;
  updateStatus: (mediaId: number, status: string) => Promise<void>;
  removeFromTracker: (mediaId: number) => Promise<void>;
  toggleFavourite: (mediaId: number, mediaType: string) => Promise<void>;
}

const TrackerContext = createContext<TrackerContextValue>({
  isLoggedIn: false,
  trackerMap: new Map(),
  favouriteIds: new Set(),
  addToTracker: async () => {},
  updateStatus: async () => {},
  removeFromTracker: async () => {},
  toggleFavourite: async () => {},
});

export function TrackerProvider({
  isLoggedIn,
  children,
}: {
  isLoggedIn: boolean;
  children: ReactNode;
}) {
  const { showToast } = useToast();
  const [trackerMap, setTrackerMap] = useState<Map<number, TrackerMapEntry>>(new Map());
  const [favouriteIds, setFavouriteIds] = useState<Set<number>>(new Set());

  // Refs always hold latest values — lets callbacks avoid stale closures
  const mapRef = useRef(trackerMap);
  useEffect(() => { mapRef.current = trackerMap; }, [trackerMap]);
  const favRef = useRef(favouriteIds);
  useEffect(() => { favRef.current = favouriteIds; }, [favouriteIds]);

  useEffect(() => {
    if (!isLoggedIn) return;
    Promise.all([
      fetch("/api/tracker/ids").then((r) => r.json() as Promise<{ entries: { id: number; status: string; favourite: boolean }[] }>),
      fetch("/api/favourites/ids").then((r) => r.json() as Promise<{ ids: number[] }>),
    ])
      .then(([trackerData, favData]) => {
        setTrackerMap(
          new Map(trackerData.entries.map((e) => [e.id, { status: e.status, favourite: e.favourite }]))
        );
        setFavouriteIds(new Set(favData.ids));
      })
      .catch(() => {});
  }, [isLoggedIn]);

  const addToTracker = useCallback(
    async (mediaId: number, mediaType: string, status = "PLANNED") => {
      const prev = mapRef.current.get(mediaId);
      setTrackerMap((m) =>
        new Map(m).set(mediaId, { status, favourite: prev?.favourite ?? false })
      );
      try {
        const res = await fetch("/api/tracker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ animeId: mediaId, status, mediaType }),
        });
        if (!res.ok) throw new Error("api error");
        const data = (await res.json()) as { notifications?: ToastNotification[] };
        fireToasts(showToast, data.notifications);
      } catch {
        setTrackerMap((m) => {
          const next = new Map(m);
          if (prev === undefined) next.delete(mediaId);
          else next.set(mediaId, prev);
          return next;
        });
      }
    },
    [showToast]
  );

  const updateStatus = useCallback(async (mediaId: number, status: string) => {
    const prev = mapRef.current.get(mediaId);
    setTrackerMap((m) =>
      new Map(m).set(mediaId, { status, favourite: prev?.favourite ?? false })
    );
    try {
      const res = await fetch("/api/tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId: mediaId, status }),
      });
      if (!res.ok) throw new Error("api error");
      const data = (await res.json()) as { notifications?: ToastNotification[] };
      fireToasts(showToast, data.notifications);
    } catch {
      setTrackerMap((m) => {
        const next = new Map(m);
        if (prev === undefined) next.delete(mediaId);
        else next.set(mediaId, prev);
        return next;
      });
    }
  }, [showToast]);

  const removeFromTracker = useCallback(async (mediaId: number) => {
    const prev = mapRef.current.get(mediaId);
    setTrackerMap((m) => {
      const next = new Map(m);
      next.delete(mediaId);
      return next;
    });
    try {
      const res = await fetch("/api/tracker", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId: mediaId }),
      });
      if (!res.ok) throw new Error("api error");
    } catch {
      if (prev !== undefined) {
        setTrackerMap((m) => new Map(m).set(mediaId, prev));
      }
    }
  }, []);

  const toggleFavourite = useCallback(async (mediaId: number, mediaType: string) => {
    const isFav = favRef.current.has(mediaId);
    const newFav = !isFav;

    // Optimistic update
    setFavouriteIds((prev) => {
      const next = new Set(prev);
      if (newFav) next.add(mediaId);
      else next.delete(mediaId);
      return next;
    });

    try {
      if (newFav) {
        const res = await fetch("/api/favourites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaId, mediaType }),
        });
        if (!res.ok) throw new Error("api error");
      } else {
        const res = await fetch(`/api/favourites/${mediaId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("api error");
      }
    } catch {
      // Rollback
      setFavouriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(mediaId);
        else next.delete(mediaId);
        return next;
      });
    }
  }, []);

  return (
    <TrackerContext.Provider
      value={{ isLoggedIn, trackerMap, favouriteIds, addToTracker, updateStatus, removeFromTracker, toggleFavourite }}
    >
      {children}
    </TrackerContext.Provider>
  );
}

export function useTracker(): TrackerContextValue {
  return useContext(TrackerContext);
}

export interface StatusColorDef {
  color: string;
  bg: string;
  border: string;
}

export const STATUS_COLORS: Record<string, StatusColorDef> = {
  IN_PROGRESS: { color: "#1d9e75", bg: "rgba(29,158,117,0.2)",  border: "rgba(29,158,117,0.4)" },
  COMPLETED:   { color: "#534AB7", bg: "rgba(83,74,183,0.2)",   border: "rgba(83,74,183,0.4)" },
  PLANNED:     { color: "#5a5a65", bg: "rgba(90,90,101,0.15)",  border: "rgba(90,90,101,0.3)" },
  DROPPED:     { color: "#e8173f", bg: "rgba(232,23,63,0.15)",  border: "rgba(232,23,63,0.3)" },
  ON_HOLD:     { color: "#BA7517", bg: "rgba(186,117,23,0.15)", border: "rgba(186,117,23,0.3)" },
};

export const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: "IN PROGRESS",
  COMPLETED:   "COMPLETED",
  PLANNED:     "PLANNED",
  DROPPED:     "DROPPED",
  ON_HOLD:     "ON HOLD",
};

import { prisma } from "@/lib/prisma";

export const ANILIST_CIRCUIT_KEY = "__anilist_circuit";

export type AniListCircuitCode =
  | "circuit_open"
  | "paced"
  | "timeout"
  | "disabled"
  | "failed";

export class AniListUnavailableError extends Error {
  readonly code: AniListCircuitCode;

  constructor(code: AniListCircuitCode, message?: string) {
    super(message ?? code);
    this.name = "AniListUnavailableError";
    this.code = code;
  }
}

type CircuitState = "closed" | "open";

interface CircuitSnapshot {
  state: CircuitState;
  failures: number;
  openedAt: number | null;
  lastProbeAt: number | null;
}

const FAILURE_THRESHOLD = 3;
const OPEN_MS = 5 * 60 * 1000;
const PROBE_GAP_MS = 30 * 1000;

let snapshot: CircuitSnapshot = {
  state: "closed",
  failures: 0,
  openedAt: null,
  lastProbeAt: null,
};

let hydratePromise: Promise<void> | null = null;

interface CircuitMeta {
  state?: unknown;
  failures?: unknown;
  openedAt?: unknown;
  lastProbeAt?: unknown;
}

function isCircuitMeta(value: unknown): value is CircuitMeta {
  return typeof value === "object" && value !== null;
}

function applyMeta(meta: CircuitMeta): void {
  snapshot = {
    state: meta.state === "open" ? "open" : "closed",
    failures: typeof meta.failures === "number" ? meta.failures : 0,
    openedAt: typeof meta.openedAt === "number" ? meta.openedAt : null,
    lastProbeAt: typeof meta.lastProbeAt === "number" ? meta.lastProbeAt : null,
  };
}

function persist(): void {
  const meta = {
    state: snapshot.state,
    failures: snapshot.failures,
    openedAt: snapshot.openedAt,
    lastProbeAt: snapshot.lastProbeAt,
  };
  void prisma.browseShelf
    .upsert({
      where: { key: ANILIST_CIRCUIT_KEY },
      create: { key: ANILIST_CIRCUIT_KEY, mediaIds: [], meta, syncedAt: new Date() },
      update: { meta, syncedAt: new Date() },
    })
    .catch(() => undefined);
}

export async function hydrateAniListCircuit(): Promise<void> {
  if (!hydratePromise) {
    hydratePromise = (async () => {
      try {
        const row = await prisma.browseShelf.findUnique({
          where: { key: ANILIST_CIRCUIT_KEY },
        });
        if (isCircuitMeta(row?.meta)) applyMeta(row.meta);
      } catch {
        // Memory defaults — CLOSED — if the health row cannot be read.
      }
    })();
  }
  await hydratePromise;
}

/** True when callers should skip GraphQL and use Postgres. */
export function shouldSkipAniList(): boolean {
  if (snapshot.state !== "open") return false;
  const openedAt = snapshot.openedAt ?? 0;
  if (Date.now() - openedAt < OPEN_MS) return true;

  const lastProbeAt = snapshot.lastProbeAt ?? 0;
  if (Date.now() - lastProbeAt < PROBE_GAP_MS) return true;

  snapshot.lastProbeAt = Date.now();
  persist();
  return false;
}

export function recordAniListSuccess(): void {
  const wasOpen = snapshot.state === "open" || snapshot.failures > 0;
  snapshot = {
    state: "closed",
    failures: 0,
    openedAt: null,
    lastProbeAt: null,
  };
  if (wasOpen) persist();
}

export function recordAniListFailure(): void {
  const failures = snapshot.failures + 1;
  if (failures >= FAILURE_THRESHOLD) {
    snapshot = {
      state: "open",
      failures,
      openedAt: Date.now(),
      lastProbeAt: snapshot.lastProbeAt,
    };
    persist();
    return;
  }
  snapshot = { ...snapshot, failures };
}

export function isAniListOutageError(err: unknown): boolean {
  if (err instanceof AniListUnavailableError) {
    return err.code !== "paced";
  }
  const status =
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof (err as { response?: { status?: unknown } }).response?.status === "number"
      ? (err as { response: { status: number } }).response.status
      : null;
  if (status === 429) return false;
  if (status === 403 || (status !== null && status >= 500)) return true;

  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("429") || msg.includes("Too Many")) return false;
  if (msg.includes("timed out")) return true;
  if (msg.includes("temporarily disabled")) return true;
  if (msg.includes("Failed to fetch data from AniList")) return true;
  if (msg.includes("ECONNRESET") || msg.includes("ENOTFOUND") || msg.includes("ECONNREFUSED")) {
    return true;
  }
  if (msg.includes("fetch failed")) return true;
  return false;
}

/** Test-only: reset in-memory circuit without touching Postgres. */
export function resetAniListCircuitForTests(): void {
  snapshot = {
    state: "closed",
    failures: 0,
    openedAt: null,
    lastProbeAt: null,
  };
  hydratePromise = Promise.resolve();
}

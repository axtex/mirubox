import { afterEach, describe, expect, it, vi } from "vitest";
import { cronAuthError } from "@/lib/cron-auth";

const originalSecret = process.env.CRON_SECRET;

function setSecret(value: string | undefined): void {
  if (value === undefined) {
    delete process.env.CRON_SECRET;
  } else {
    process.env.CRON_SECRET = value;
  }
}

function cronRequest(authorization?: string): Request {
  return new Request("http://localhost/api/cron/browse-sync", {
    headers: authorization ? { authorization } : {},
  });
}

async function bodyOf(res: Response | null): Promise<{
  status: number | null;
  body: unknown;
}> {
  if (!res) return { status: null, body: null };
  return { status: res.status, body: await res.json() };
}

describe("cronAuthError", () => {
  afterEach(() => {
    setSecret(originalSecret);
    vi.restoreAllMocks();
  });

  it("returns 500 when CRON_SECRET is missing", async () => {
    setSecret(undefined);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await bodyOf(cronAuthError(cronRequest("Bearer anything")));

    expect(result).toEqual({
      status: 500,
      body: { error: "Misconfigured" },
    });
  });

  it("returns 401 when the Authorization header is missing", async () => {
    setSecret("test-cron-secret");

    const result = await bodyOf(cronAuthError(cronRequest()));

    expect(result).toEqual({
      status: 401,
      body: { error: "Unauthorized" },
    });
  });

  it("returns 401 when the Bearer token does not match", async () => {
    setSecret("test-cron-secret");

    const result = await bodyOf(cronAuthError(cronRequest("Bearer wrong")));

    expect(result).toEqual({
      status: 401,
      body: { error: "Unauthorized" },
    });
  });

  it("returns 401 when the header is the secret without the Bearer prefix", async () => {
    setSecret("test-cron-secret");

    const result = await bodyOf(cronAuthError(cronRequest("test-cron-secret")));

    expect(result).toEqual({
      status: 401,
      body: { error: "Unauthorized" },
    });
  });

  it("returns 401 when there is an extra space after Bearer", async () => {
    setSecret("test-cron-secret");

    const result = await bodyOf(cronAuthError(cronRequest("Bearer  test-cron-secret")));

    expect(result).toEqual({
      status: 401,
      body: { error: "Unauthorized" },
    });
  });

  it("returns null when the Bearer token matches exactly", async () => {
    setSecret("test-cron-secret");

    expect(cronAuthError(cronRequest("Bearer test-cron-secret"))).toBeNull();
  });
});

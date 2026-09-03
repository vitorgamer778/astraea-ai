import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { exchangeCodeForSession: vi.fn() } })),
}));

import { GET } from "./route";

describe("GET /auth/callback", () => {
  it("allows a same-origin relative destination", async () => {
    const response = await GET(new Request("https://astraea.test/auth/callback?next=%2Fchat%3Ffrom%3Dauth"));
    expect(response.headers.get("location")).toBe("https://astraea.test/chat?from=auth");
  });

  it("blocks absolute and protocol-relative open redirects", async () => {
    for (const next of ["https://evil.example/phish", "//evil.example/phish"]) {
      const response = await GET(new Request(`https://astraea.test/auth/callback?next=${encodeURIComponent(next)}`));
      expect(response.headers.get("location")).toBe("https://astraea.test/");
    }
  });
});

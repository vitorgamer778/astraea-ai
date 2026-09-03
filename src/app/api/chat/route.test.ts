import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  gateway: vi.fn((id: string) => ({ id })),
  streamText: vi.fn(() => ({
    stream: (async function* () {
      yield { type: "text-delta", id: "text-1", text: "Hello " };
      yield { type: "text-delta", id: "text-1", text: "from Astraea" };
    })(),
  })),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("ai", () => ({ gateway: mocks.gateway, streamText: mocks.streamText }));

import { POST } from "./route";

const conversationId = "11111111-1111-4111-8111-111111111111";

function request(body: unknown) {
  return new Request("http://localhost/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

function supabaseFor(user: { id: string } | null, conversation = true) {
  const builder = { select: vi.fn(), eq: vi.fn(), single: vi.fn().mockResolvedValue({ data: conversation ? { id: conversationId } : null, error: conversation ? null : new Error("not found") }) };
  builder.select.mockReturnValue(builder); builder.eq.mockReturnValue(builder);
  return { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) }, from: vi.fn(() => builder) };
}

afterEach(() => {
  vi.clearAllMocks();
  delete process.env.AI_GATEWAY_API_KEY;
  delete process.env.VERCEL_OIDC_TOKEN;
});

describe("POST /api/chat", () => {
  it("rejects unauthenticated requests", async () => {
    mocks.createClient.mockResolvedValue(supabaseFor(null));
    expect((await POST(request({ conversationId, messages: [{ role: "user", content: "Hello" }] }))).status).toBe(401);
  });

  it("returns an actionable error when AI is not configured", async () => {
    mocks.createClient.mockResolvedValue(supabaseFor({ id: "user-a" }));
    const response = await POST(request({ conversationId, messages: [{ role: "user", content: "Hello" }] }));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual(expect.objectContaining({ error: expect.stringContaining("AI_GATEWAY_API_KEY") }));
  });

  it("streams an authenticated model response", async () => {
    process.env.AI_GATEWAY_API_KEY = "test-key";
    mocks.createClient.mockResolvedValue(supabaseFor({ id: "user-a" }));
    const response = await POST(request({ conversationId, messages: [{ role: "user", content: "Hello" }] }));
    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("Hello from Astraea");
    expect(mocks.gateway).toHaveBeenCalledWith("openai/gpt-5.6-luna");
    expect(mocks.streamText).toHaveBeenCalledWith(expect.objectContaining({ messages: [{ role: "user", content: "Hello" }], maxOutputTokens: 1_200 }));
  });

  it("surfaces an AI provider failure instead of returning an empty 200 stream", async () => {
    process.env.AI_GATEWAY_API_KEY = "test-key";
    mocks.createClient.mockResolvedValue(supabaseFor({ id: "user-a" }));
    mocks.streamText.mockReturnValueOnce({
      stream: (async function* () { yield { type: "error", error: { statusCode: 403 } }; })(),
    } as never);
    const response = await POST(request({ conversationId, messages: [{ role: "user", content: "Hello" }] }));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "Astraea's AI provider is unavailable. Please try again shortly." });
  });

  it("rejects an oversized aggregate conversation history", async () => {
    process.env.AI_GATEWAY_API_KEY = "test-key";
    mocks.createClient.mockResolvedValue(supabaseFor({ id: "user-a" }));
    const response = await POST(request({ conversationId, messages: Array.from({ length: 5 }, () => ({ role: "user", content: "x".repeat(10_000) })) }));
    expect(response.status).toBe(400);
  });
});

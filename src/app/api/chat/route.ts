import { gateway, streamText, type ModelMessage } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  conversationId: z.string().uuid(),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(12_000),
  })).min(1).max(40),
}).refine(
  ({ messages }) => messages.reduce((total, message) => total + message.content.length, 0) <= 48_000,
  { message: "The conversation history is too large.", path: ["messages"] },
);

function gatewayErrorResponse(error: unknown) {
  const statusCode = typeof error === "object" && error !== null && "statusCode" in error
    ? Number(error.statusCode)
    : undefined;
  if (statusCode === 429) {
    return Response.json({ error: "Too many AI requests. Please wait a moment and try again." }, { status: 429 });
  }
  console.error("[api/chat] AI Gateway request failed", {
    name: error instanceof Error ? error.name : "UnknownError",
    statusCode,
  });
  return Response.json({ error: "Astraea's AI provider is unavailable. Please try again shortly." }, { status: 503 });
}

async function createTextStreamResponse(result: ReturnType<typeof streamText>) {
  const iterator = result.stream[Symbol.asyncIterator]();
  let firstText = "";

  try {
    while (true) {
      const part = await iterator.next();
      if (part.done) return gatewayErrorResponse(new Error("The model returned no text."));
      if (part.value.type === "error") return gatewayErrorResponse(part.value.error);
      if (part.value.type === "abort") return gatewayErrorResponse(new Error(part.value.reason ?? "The model request was aborted."));
      if (part.value.type === "text-delta") {
        firstText = part.value.text;
        break;
      }
    }
  } catch (error) {
    return gatewayErrorResponse(error);
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(firstText));
      try {
        while (true) {
          const part = await iterator.next();
          if (part.done) break;
          if (part.value.type === "text-delta") controller.enqueue(encoder.encode(part.value.text));
          if (part.value.type === "error") throw part.value.error;
          if (part.value.type === "abort") throw new Error(part.value.reason ?? "The model request was aborted.");
        }
        controller.close();
      } catch (error) {
        console.error("[api/chat] AI Gateway stream failed", {
          name: error instanceof Error ? error.name : "UnknownError",
        });
        controller.error(error);
      }
    },
    cancel() {
      void iterator.return?.();
    },
  });

  return new Response(body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return Response.json({ error: "Your session has expired." }, { status: 401 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "The chat request is invalid." }, { status: 400 });

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", parsed.data.conversationId)
    .single();
  if (conversationError || !conversation) return Response.json({ error: "Conversation not found." }, { status: 404 });

  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    return Response.json({ error: "The Astraea AI model is not configured yet. Add AI_GATEWAY_API_KEY locally or connect Vercel OIDC." }, { status: 503 });
  }

  const result = streamText({
    model: gateway(process.env.ASTRAEA_MODEL ?? "openai/gpt-5.6-luna"),
    system: "You are Astraea, a precise, thoughtful AI assistant. Answer in the user's language. Be clear, useful, honest about uncertainty, and format technical answers with readable Markdown. Never claim access to workspace knowledge unless relevant context was explicitly provided.",
    messages: parsed.data.messages as ModelMessage[],
    maxOutputTokens: 1_200,
    providerOptions: {
      gateway: {
        user: auth.user.id,
        tags: ["feature:chat", "env:production"],
      },
    },
  });

  return createTextStreamResponse(result);
}

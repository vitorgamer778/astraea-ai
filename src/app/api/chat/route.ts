import { gateway, streamText, type ModelMessage } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  conversationId: z.string().uuid(),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(12_000),
  })).min(1).max(40),
});

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
  });

  return result.toTextStreamResponse();
}

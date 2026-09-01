import type { SupabaseClient } from "@supabase/supabase-js";
import type { Conversation, Message } from "./types";

export async function listConversations(client: SupabaseClient) {
  const { data, error } = await client.from("conversations").select("id,title,updated_at,user_id,workspace_id").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Conversation[];
}
export async function listMessages(client: SupabaseClient, conversationId: string) {
  const { data, error } = await client.from("messages").select("id,conversation_id,role,content,created_at,model").eq("conversation_id", conversationId).order("created_at");
  if (error) throw error;
  return (data ?? []) as Message[];
}
export async function createConversation(client: SupabaseClient, title: string) {
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) throw new Error("Your session has expired.");
  const { data, error } = await client.from("conversations").insert({ title, user_id: auth.user.id }).select("id,title,updated_at,user_id,workspace_id").single();
  if (error) throw error;
  return data as Conversation;
}
export async function saveMessage(client: SupabaseClient, message: Pick<Message, "conversation_id" | "role" | "content">) {
  const { data, error } = await client.from("messages").insert(message).select("id,conversation_id,role,content,created_at,model").single();
  if (error) throw error;
  return data as Message;
}

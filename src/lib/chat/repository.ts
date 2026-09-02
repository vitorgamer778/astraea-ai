import type { SupabaseClient } from "@supabase/supabase-js";
import type { Conversation, Message } from "./types";

export async function listConversations(client: SupabaseClient) {
  const { data, error } = await client.from("conversations").select("id,title,updated_at,user_id,workspace_id").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Conversation[];
}

async function getWorkspaceId(client: SupabaseClient) {
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) throw new Error("Your session has expired.");
  const { data, error } = await client
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();
  if (error) throw error;
  if (!data?.workspace_id) throw new Error("No Astraea workspace is linked to this account.");
  return { userId: auth.user.id, workspaceId: data.workspace_id as string };
}

export async function listMessages(client: SupabaseClient, conversationId: string) {
  const { data, error } = await client.from("messages").select("id,conversation_id,workspace_id,role,content,created_at,model").eq("conversation_id", conversationId).order("created_at");
  if (error) throw error;
  return (data ?? []) as Message[];
}
export async function createConversation(client: SupabaseClient, title: string) {
  const { userId, workspaceId } = await getWorkspaceId(client);
  const { data, error } = await client.from("conversations").insert({ title, user_id: userId, workspace_id: workspaceId }).select("id,title,updated_at,user_id,workspace_id").single();
  if (error) throw error;
  return data as Conversation;
}
export async function saveMessage(client: SupabaseClient, message: Pick<Message, "conversation_id" | "workspace_id" | "role" | "content">) {
  if (!message.workspace_id) throw new Error("The conversation is not linked to a workspace.");
  const { data, error } = await client.from("messages").insert(message).select("id,conversation_id,workspace_id,role,content,created_at,model").single();
  if (error) throw error;
  return data as Message;
}

export async function renameConversation(client: SupabaseClient, conversationId: string, title: string) {
  const { data, error } = await client.from("conversations").update({ title: title.trim(), updated_at: new Date().toISOString() }).eq("id", conversationId).select("id,title,updated_at,user_id,workspace_id").single();
  if (error) throw error;
  return data as Conversation;
}

export async function deleteConversation(client: SupabaseClient, conversationId: string) {
  const { error } = await client.from("conversations").delete().eq("id", conversationId);
  if (error) throw error;
}

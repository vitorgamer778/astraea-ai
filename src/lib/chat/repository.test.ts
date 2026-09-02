import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createConversation, deleteConversation, listMessages, renameConversation, saveMessage } from "./repository";

function clientWithTables(tables: Record<string, unknown>, userId = "user-a") {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }) },
    from: vi.fn((table: string) => tables[table]),
  } as unknown as SupabaseClient;
}

describe("chat repository", () => {
  it("creates a conversation in the authenticated user's workspace", async () => {
    const membership = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), single: vi.fn().mockResolvedValue({ data: { workspace_id: "workspace-a" }, error: null }) };
    membership.select.mockReturnValue(membership); membership.eq.mockReturnValue(membership); membership.order.mockReturnValue(membership); membership.limit.mockReturnValue(membership);
    const conversation = { id: "conversation-a", title: "New conversation", workspace_id: "workspace-a", user_id: "user-a", updated_at: "now" };
    const conversations = { insert: vi.fn(), select: vi.fn(), single: vi.fn().mockResolvedValue({ data: conversation, error: null }) };
    conversations.insert.mockReturnValue(conversations); conversations.select.mockReturnValue(conversations);
    const client = clientWithTables({ workspace_members: membership, conversations });

    await expect(createConversation(client, "New conversation")).resolves.toEqual(conversation);
    expect(conversations.insert).toHaveBeenCalledWith({ title: "New conversation", user_id: "user-a", workspace_id: "workspace-a" });
  });

  it("persists and reloads a workspace-scoped message", async () => {
    const saved = { id: "message-a", conversation_id: "conversation-a", workspace_id: "workspace-a", role: "user", content: "Hello", created_at: "now" };
    const insertBuilder = { insert: vi.fn(), select: vi.fn(), single: vi.fn().mockResolvedValue({ data: saved, error: null }) };
    insertBuilder.insert.mockReturnValue(insertBuilder); insertBuilder.select.mockReturnValue(insertBuilder);
    await expect(saveMessage(clientWithTables({ messages: insertBuilder }), { conversation_id: "conversation-a", workspace_id: "workspace-a", role: "user", content: "Hello" })).resolves.toEqual(saved);
    expect(insertBuilder.insert).toHaveBeenCalledWith({ conversation_id: "conversation-a", workspace_id: "workspace-a", role: "user", content: "Hello" });

    const listBuilder = { select: vi.fn(), eq: vi.fn(), order: vi.fn().mockResolvedValue({ data: [saved], error: null }) };
    listBuilder.select.mockReturnValue(listBuilder); listBuilder.eq.mockReturnValue(listBuilder);
    await expect(listMessages(clientWithTables({ messages: listBuilder }), "conversation-a")).resolves.toEqual([saved]);
  });

  it("renames a conversation", async () => {
    const updated = { id: "conversation-a", title: "Renamed", workspace_id: "workspace-a", updated_at: "now" };
    const builder = { update: vi.fn(), eq: vi.fn(), select: vi.fn(), single: vi.fn().mockResolvedValue({ data: updated, error: null }) };
    builder.update.mockReturnValue(builder); builder.eq.mockReturnValue(builder); builder.select.mockReturnValue(builder);
    await expect(renameConversation(clientWithTables({ conversations: builder }), "conversation-a", " Renamed ")).resolves.toEqual(updated);
    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ title: "Renamed" }));
  });

  it("deletes a conversation", async () => {
    const terminal = Promise.resolve({ error: null });
    const builder = { delete: vi.fn(), eq: vi.fn().mockReturnValue(terminal) };
    builder.delete.mockReturnValue(builder);
    await expect(deleteConversation(clientWithTables({ conversations: builder }), "conversation-a")).resolves.toBeUndefined();
    expect(builder.eq).toHaveBeenCalledWith("id", "conversation-a");
  });
});

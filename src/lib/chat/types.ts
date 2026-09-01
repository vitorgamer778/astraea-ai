export type ChatRole = "user" | "assistant" | "system";
export interface Conversation { id: string; title: string; updated_at: string; user_id?: string; workspace_id?: string | null; }
export interface Message { id: string; conversation_id: string; role: ChatRole; content: string; created_at: string; model?: string | null; }

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !publishableKey || !serviceRoleKey) throw new Error("Supabase integration test environment is incomplete.");

const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const suffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const password = `Astraea!${randomUUID()}aA1`;
const users = [
  { email: `astraea-rls-a-${suffix}@example.com`, id: null },
  { email: `astraea-rls-b-${suffix}@example.com`, id: null },
];
let conversationId;

function assert(condition, message) { if (!condition) throw new Error(message); }
function authClient() { return createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } }); }

try {
  for (const user of users) {
    const { data, error } = await admin.auth.admin.createUser({ email: user.email, password, email_confirm: true });
    if (error) throw error;
    user.id = data.user.id;
  }

  const clientA = authClient();
  const clientB = authClient();
  const loginA = await clientA.auth.signInWithPassword({ email: users[0].email, password });
  const loginB = await clientB.auth.signInWithPassword({ email: users[1].email, password });
  assert(!loginA.error && !loginB.error, "Password login failed.");
  const refreshed = await clientA.auth.refreshSession();
  assert(!refreshed.error && refreshed.data.session, "Session refresh failed.");

  const membershipA = await clientA.from("workspace_members").select("workspace_id,role").eq("user_id", users[0].id).single();
  assert(!membershipA.error && membershipA.data?.workspace_id && membershipA.data.role === "owner", "Signup provisioning did not create an owner workspace.");
  const workspaceId = membershipA.data.workspace_id;

  const created = await clientA.from("conversations").insert({ workspace_id: workspaceId, user_id: users[0].id, title: "Integration conversation" }).select("id,title,workspace_id").single();
  if (created.error) throw created.error;
  conversationId = created.data.id;

  const insertedMessage = await clientA.from("messages").insert({ workspace_id: workspaceId, conversation_id: conversationId, role: "user", content: "Persistent integration message" }).select("id,content").single();
  if (insertedMessage.error) throw insertedMessage.error;

  const reloadedA = authClient();
  const reloadLogin = await reloadedA.auth.signInWithPassword({ email: users[0].email, password });
  assert(!reloadLogin.error, "Reload login failed.");
  const history = await reloadedA.from("messages").select("id,content").eq("conversation_id", conversationId);
  assert(!history.error && history.data?.length === 1 && history.data[0].content === "Persistent integration message", "Reload did not preserve history.");

  const renamed = await clientA.from("conversations").update({ title: "Renamed integration conversation" }).eq("id", conversationId).select("title").single();
  assert(!renamed.error && renamed.data.title === "Renamed integration conversation", "Conversation rename failed.");
  const updatedMessage = await clientA.from("messages").update({ content: "Updated integration message" }).eq("id", insertedMessage.data.id).select("content").single();
  assert(!updatedMessage.error && updatedMessage.data.content === "Updated integration message", "Message update policy failed for owner.");

  const foreignSelect = await clientB.from("conversations").select("id").eq("id", conversationId);
  assert(!foreignSelect.error && foreignSelect.data?.length === 0, "RLS exposed user A's conversation to user B.");
  const foreignInsert = await clientB.from("messages").insert({ workspace_id: workspaceId, conversation_id: conversationId, role: "user", content: "Forbidden" });
  assert(Boolean(foreignInsert.error), "RLS allowed user B to insert into user A's conversation.");
  const foreignUpdate = await clientB.from("conversations").update({ title: "Forbidden" }).eq("id", conversationId).select("id");
  assert(!foreignUpdate.error && foreignUpdate.data?.length === 0, "RLS allowed user B to update user A's conversation.");
  const foreignDelete = await clientB.from("conversations").delete().eq("id", conversationId).select("id");
  assert(!foreignDelete.error && foreignDelete.data?.length === 0, "RLS allowed user B to delete user A's conversation.");

  const deleted = await clientA.from("conversations").delete().eq("id", conversationId).select("id").single();
  assert(!deleted.error, "Conversation delete failed for author.");
  conversationId = undefined;
  const cascade = await clientA.from("messages").select("id").eq("conversation_id", deleted.data.id);
  assert(!cascade.error && cascade.data?.length === 0, "Conversation delete did not cascade to messages.");

  await clientA.auth.signOut();
  const signedOut = await clientA.auth.getSession();
  assert(!signedOut.data.session, "Logout left a local session active.");
  const anonymous = authClient();
  const anonymousRead = await anonymous.from("conversations").select("id").limit(1);
  assert(!anonymousRead.error && anonymousRead.data?.length === 0, "Unauthenticated access returned conversation data.");

  console.log(JSON.stringify({ auth: true, sessionRefresh: true, provisioning: true, conversationsCrud: true, messagesCrud: true, reloadPersistence: true, rlsSelectInsertUpdateDelete: true, crossUserIsolation: true, logout: true, anonymousReadBlocked: true }));
} finally {
  if (conversationId) await admin.from("conversations").delete().eq("id", conversationId);
  for (const user of users) if (user.id) await admin.auth.admin.deleteUser(user.id);
}

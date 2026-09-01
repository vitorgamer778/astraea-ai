import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth/auth-panel";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims) redirect("/");
  }
  return <AuthPanel isConfigured={isSupabaseConfigured()} />;
}

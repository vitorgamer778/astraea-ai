"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandMark } from "@/components/brand-mark";
import { createClient } from "@/lib/supabase/client";

export function AuthPanel({ isConfigured }: { isConfigured: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null); setMessage(null); setPending(true);
    try {
      if (!isConfigured) throw new Error("Add the Supabase environment variables to enable authentication.");
      const supabase = createClient();
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        router.push("/");
        router.refresh();
      } else {
        const { error: authError } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
        if (authError) throw authError;
        setMessage("Check your inbox to confirm your Astraea account.");
      }
    } catch (value) { setError(value instanceof Error ? value.message : "Authentication failed."); }
    finally { setPending(false); }
  }

  return (
    <main className="astraea-grid relative grid min-h-screen place-items-center overflow-hidden p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,oklch(0.57_0.2_292/.18),transparent_38%)]" />
      <section className="relative w-full max-w-md rounded-3xl border border-white/10 bg-card/85 p-7 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-9">
        <div className="mb-8 flex items-center gap-3"><BrandMark /><div><p className="font-semibold tracking-tight">Astraea AI</p><p className="text-xs text-muted-foreground">Your intelligent workspace</p></div></div>
        <h1 className="text-2xl font-semibold tracking-[-0.035em]">{mode === "login" ? "Welcome back" : "Create your workspace"}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{mode === "login" ? "Continue your conversations and knowledge work." : "Start building with a calmer, more capable AI workspace."}</p>
        <form className="mt-7 space-y-4" onSubmit={submit}>
          <label className="block space-y-2 text-sm"><span className="text-muted-foreground">Email</span><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className="h-11 bg-background/50" /></label>
          <label className="block space-y-2 text-sm"><span className="text-muted-foreground">Password</span><Input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="At least 8 characters" className="h-11 bg-background/50" /></label>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {message && <Alert><ShieldCheck className="size-4" /><AlertDescription>{message}</AlertDescription></Alert>}
          <Button className="h-11 w-full" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : <>{mode === "login" ? "Sign in" : "Create account"}<ArrowRight /></>}</Button>
        </form>
        <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground"><button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }} className="transition hover:text-foreground">{mode === "login" ? "Create an account" : "Already have an account?"}</button>{!isConfigured && <Link href="/" className="transition hover:text-foreground">Preview UI</Link>}</div>
      </section>
    </main>
  );
}

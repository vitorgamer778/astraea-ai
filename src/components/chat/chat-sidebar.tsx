"use client";

import { useRouter } from "next/navigation";
import { Bot, FileText, Library, LogOut, MessageSquare, MoreHorizontal, Pencil, Plus, Search, Settings2, Trash2, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { BrandMark } from "@/components/brand-mark";
import type { Conversation } from "@/lib/chat/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Props = {
  conversations: Conversation[]; activeId: string | null; email: string | null; isPreview: boolean;
  open: boolean; onClose: () => void; onSelect: (id: string) => void; onNew: () => void;
  onRename: (id: string, title: string) => void; onDelete: (id: string) => void;
};

export function ChatSidebar({ conversations, activeId, email, isPreview, open, onClose, onSelect, onNew, onRename, onDelete }: Props) {
  const router = useRouter();

  async function signOut() {
    if (isPreview) return;
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  function requestRename(item: Conversation) {
    const title = window.prompt("Rename conversation", item.title)?.trim();
    if (title && title !== item.title) onRename(item.id, title);
  }

  function requestDelete(item: Conversation) {
    if (window.confirm(`Delete “${item.title}”? This cannot be undone.`)) onDelete(item.id);
  }

  return <>
    {open && <button aria-label="Close sidebar" onClick={onClose} className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm lg:hidden" />}
    <aside className={cn("fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(18rem,88vw)] shrink-0 -translate-x-full flex-col border-r border-white/[0.07] bg-sidebar/95 shadow-2xl backdrop-blur-xl transition-transform lg:static lg:h-screen lg:w-72 lg:translate-x-0 lg:bg-sidebar lg:shadow-none", open && "translate-x-0")}>
      <div className="flex h-16 items-center gap-3 px-4"><BrandMark className="size-8" /><div className="flex-1"><p className="text-sm font-semibold tracking-tight">Astraea</p><p className="text-[11px] text-muted-foreground">Intelligence, in orbit</p></div><Button onClick={onClose} size="icon-sm" variant="ghost" className="lg:hidden"><X /></Button></div>
      <div className="space-y-2 px-3"><Button onClick={onNew} className="w-full justify-start shadow-lg shadow-primary/10"><Plus />New conversation</Button><Button variant="ghost" className="w-full justify-start text-muted-foreground"><Search />Search</Button></div>
      <nav className="mt-5 space-y-1 px-3 text-sm"><p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">Workspace</p>{[[MessageSquare,"Chat"],[Library,"Knowledge"],[Bot,"Agents"],[FileText,"Projects"]].map(([Icon,label]) => <button key={label as string} className={cn("flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground", label === "Chat" && "bg-sidebar-accent text-foreground")}><Icon className="size-4" />{label as string}</button>)}</nav>
      <Separator className="my-4" />
      <p className="px-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">Recent</p>
      <ScrollArea className="min-h-0 flex-1 px-3"><div className="space-y-1 pb-4">{conversations.map((item) => <div key={item.id} className={cn("group flex items-center rounded-lg pr-1 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground", activeId === item.id && "bg-sidebar-accent text-foreground")}><button onClick={() => onSelect(item.id)} className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left"><MessageSquare className="size-3.5 shrink-0 opacity-60" /><span className="truncate">{item.title}</span></button><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Options for ${item.title}`} className="size-7 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-40"><DropdownMenuItem onSelect={() => requestRename(item)}><Pencil />Rename</DropdownMenuItem><DropdownMenuItem variant="destructive" onSelect={() => requestDelete(item)}><Trash2 />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>)}</div></ScrollArea>
      <div className="border-t border-white/[0.07] p-3"><DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-sidebar-accent"><Avatar className="size-8"><AvatarFallback className="bg-primary/15 text-xs text-primary">{email?.slice(0,2).toUpperCase() ?? "AI"}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{email ?? "Preview workspace"}</p><p className="text-[10px] text-muted-foreground">Free plan</p></div><Settings2 className="size-4 text-muted-foreground" /></button></DropdownMenuTrigger><DropdownMenuContent side="top" align="end" className="w-52"><DropdownMenuItem disabled={isPreview} onSelect={() => void signOut()}><LogOut />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
    </aside>
  </>;
}

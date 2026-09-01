import { Bot, FileText, Library, MessageSquare, MoreHorizontal, Plus, Search, Settings2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { BrandMark } from "@/components/brand-mark";
import type { Conversation } from "@/lib/chat/types";
import { cn } from "@/lib/utils";

export function ChatSidebar({ conversations, activeId, email, onSelect, onNew }: { conversations: Conversation[]; activeId: string | null; email: string | null; onSelect: (id: string) => void; onNew: () => void; }) {
  return <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-white/[0.07] bg-sidebar lg:flex">
    <div className="flex h-16 items-center gap-3 px-4"><BrandMark className="size-8" /><div className="flex-1"><p className="text-sm font-semibold tracking-tight">Astraea</p><p className="text-[11px] text-muted-foreground">Intelligence, in orbit</p></div><Button size="icon-sm" variant="ghost"><MoreHorizontal /></Button></div>
    <div className="space-y-2 px-3"><Button onClick={onNew} className="w-full justify-start shadow-lg shadow-primary/10"><Plus />New conversation</Button><Button variant="ghost" className="w-full justify-start text-muted-foreground"><Search />Search</Button></div>
    <nav className="mt-5 space-y-1 px-3 text-sm"><p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">Workspace</p>{[[MessageSquare,"Chat"],[Library,"Knowledge"],[Bot,"Agents"],[FileText,"Projects"]].map(([Icon,label]) => <button key={label as string} className={cn("flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground", label === "Chat" && "bg-sidebar-accent text-foreground")}><Icon className="size-4" />{label as string}</button>)}</nav>
    <Separator className="my-4" />
    <p className="px-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">Recent</p>
    <ScrollArea className="min-h-0 flex-1 px-3"><div className="space-y-1 pb-4">{conversations.map((item) => <button key={item.id} onClick={() => onSelect(item.id)} className={cn("group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground", activeId === item.id && "bg-sidebar-accent text-foreground")}><MessageSquare className="size-3.5 shrink-0 opacity-60" /><span className="truncate">{item.title}</span></button>)}</div></ScrollArea>
    <div className="border-t border-white/[0.07] p-3"><button className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-sidebar-accent"><Avatar className="size-8"><AvatarFallback className="bg-primary/15 text-xs text-primary">{email?.slice(0,2).toUpperCase() ?? "AI"}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{email ?? "Preview workspace"}</p><p className="text-[10px] text-muted-foreground">Free plan</p></div><Settings2 className="size-4 text-muted-foreground" /></button></div>
  </aside>;
}

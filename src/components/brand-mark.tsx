import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return <span className={cn("grid size-9 place-items-center rounded-xl border border-primary/25 bg-primary/12 text-primary shadow-[0_0_28px_-8px_var(--primary)]", className)}><Sparkles className="size-4" /></span>;
}

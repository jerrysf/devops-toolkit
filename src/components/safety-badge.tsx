import { Eye, PencilLine, Skull } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Inline pill used in troubleshooting guides to mark whether a command
 * is safe to run. Rendered next to commands in MDX content:
 *   <Safety level="readonly" /> `kubectl get pods`
 */
const levels = {
  readonly: {
    icon: Eye,
    label: "read-only",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  },
  modify: {
    icon: PencilLine,
    label: "modifies resources",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  },
  destructive: {
    icon: Skull,
    label: "destructive",
    className: "border-red-500/50 bg-red-500/10 text-red-300",
  },
} as const;

export function SafetyBadge({
  level,
  className,
}: {
  level: keyof typeof levels;
  className?: string;
}) {
  const { icon: Icon, label, className: pill } = levels[level];
  return (
    <span
      className={cn(
        "not-prose mx-1 inline-flex translate-y-[-1px] items-center gap-1 rounded-full border px-2 py-0.5 align-middle text-[11px] font-medium whitespace-nowrap",
        pill,
        className,
      )}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}

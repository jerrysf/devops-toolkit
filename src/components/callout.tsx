import { AlertTriangle, Info, OctagonX } from "lucide-react";
import { cn } from "@/lib/utils";

const styles = {
  info: {
    icon: Info,
    className: "border-sky-500/40 bg-sky-500/10 text-sky-200",
    label: "Note",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-amber-500/40 bg-amber-500/10 text-amber-200",
    label: "Warning",
  },
  danger: {
    icon: OctagonX,
    className: "border-red-500/50 bg-red-500/10 text-red-200",
    label: "Destructive operation",
  },
} as const;

export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: keyof typeof styles;
  title?: string;
  children: React.ReactNode;
}) {
  const { icon: Icon, className, label } = styles[type];
  return (
    <div
      role="note"
      className={cn(
        "my-4 rounded-lg border p-4 text-sm [&_code]:text-inherit [&_p:last-child]:mb-0 [&_p]:mt-0",
        className,
      )}
    >
      <p className="mb-1 flex items-center gap-2 font-medium">
        <Icon className="size-4 shrink-0" />
        {title ?? label}
      </p>
      <div className="text-inherit/90">{children}</div>
    </div>
  );
}

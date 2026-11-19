"use client";

import { AlertTriangle, Info } from "lucide-react";
import { CopyButton } from "@/components/copy-button";

/** Shared layout for YAML generator tools: form slot + output panel. */
export function GeneratorShell({
  form,
  yaml,
  warnings = [],
  explanations = [],
}: {
  form: React.ReactNode;
  yaml: string;
  warnings?: string[];
  explanations?: string[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">{form}</div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Generated YAML</span>
          <CopyButton text={yaml} />
        </div>
        <pre className="max-h-[560px] overflow-auto rounded-lg border border-border bg-[#0a1224] p-4 font-mono text-[13px] leading-relaxed text-slate-100">
          {yaml}
        </pre>
        {warnings.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {warnings.map((w, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-sm text-amber-200"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {w}
              </li>
            ))}
          </ul>
        )}
        {explanations.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {explanations.map((e, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-lg border border-sky-500/30 bg-sky-500/5 p-2.5 text-xs text-sky-200/90"
              >
                <Info className="mt-0.5 size-3.5 shrink-0" /> {e}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

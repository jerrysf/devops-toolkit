"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/copy-button";
import {
  CRON_FIELDS,
  CRON_PRESETS,
  describeCron,
  describeField,
  nextRuns,
  parseCronExpression,
} from "@/lib/cron";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type FieldMode = "every" | "at" | "everyN" | "range";

interface BuilderField {
  mode: FieldMode;
  a: string;
  b: string;
}

const FIELD_NAMES = ["minute", "hour", "day of month", "month", "day of week"];
const FIELD_RANGES = ["0–59", "0–23", "1–31", "1–12/JAN–DEC", "0–7/SUN–SAT"];

function fieldExpr(f: BuilderField): string {
  switch (f.mode) {
    case "every":
      return "*";
    case "at":
      return f.a || "*";
    case "everyN":
      return `*/${f.a || "1"}`;
    case "range":
      return `${f.a || "0"}-${f.b || "0"}`;
  }
}

export function CronGeneratorTool() {
  const [expr, setExpr] = useState("0 9 * * 1-5");
  const [builder, setBuilder] = useState<BuilderField[]>([
    { mode: "at", a: "0", b: "" },
    { mode: "at", a: "9", b: "" },
    { mode: "every", a: "", b: "" },
    { mode: "every", a: "", b: "" },
    { mode: "range", a: "1", b: "5" },
  ]);
  const parsed = useMemo(() => parseCronExpression(expr), [expr]);
  // Next-run times depend on "now", so they're computed after mount on
  // the client — not during prerender.
  const [runs, setRuns] = useState<Date[]>([]);

  /* eslint-disable react-hooks/set-state-in-effect -- syncing React
     state with wall-clock time; "now" can't be read at prerender. */
  useEffect(() => {
    if (parsed.ok) setRuns(nextRuns(parsed.fields, 5));
    else setRuns([]);
  }, [parsed]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    trackEvent("tool_opened", { tool: "cron-generator" });
  }, []);
  useEffect(() => {
    if (parsed.ok) {
      trackEvent("tool_used", { tool: "cron-generator", outcome: "valid" });
    }
  }, [parsed]);

  return (
    <div className="space-y-8">
      {/* Structured builder */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-3 text-sm font-medium">Build a schedule</p>
        <div className="grid gap-3 sm:grid-cols-5">
          {builder.map((f, i) => (
            <div key={i} className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {FIELD_NAMES[i]}
              </p>
              <select
                value={f.mode}
                onChange={(e) => {
                  const next = builder.map((x, j) =>
                    j === i ? { ...x, mode: e.target.value as FieldMode } : x,
                  );
                  setBuilder(next);
                  setExpr(next.map(fieldExpr).join(" "));
                }}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              >
                <option value="every">every</option>
                <option value="at">at / on</option>
                <option value="everyN">every N</option>
                <option value="range">range</option>
              </select>
              {f.mode !== "every" && (
                <div className="flex gap-1">
                  <Input
                    value={f.a}
                    onChange={(e) => {
                      const next = builder.map((x, j) =>
                        j === i ? { ...x, a: e.target.value } : x,
                      );
                      setBuilder(next);
                      setExpr(next.map(fieldExpr).join(" "));
                    }}
                    placeholder={f.mode === "everyN" ? "N" : "from"}
                    className="h-7 font-mono text-xs"
                  />
                  {f.mode === "range" && (
                    <Input
                      value={f.b}
                      onChange={(e) => {
                        const next = builder.map((x, j) =>
                          j === i ? { ...x, b: e.target.value } : x,
                        );
                        setBuilder(next);
                        setExpr(next.map(fieldExpr).join(" "));
                      }}
                      placeholder="to"
                      className="h-7 font-mono text-xs"
                    />
                  )}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">{FIELD_RANGES[i]}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Day-of-week accepts numbers (0–7, both 0 and 7 = Sunday) or names
          (SUN–SAT); month accepts JAN–DEC.
        </p>
      </div>

      <div>
        <label htmlFor="cron-expr" className="mb-2 block text-sm font-medium">
          Cron expression (5 fields)
        </label>
        <div className="flex max-w-xl items-center gap-2">
          <Input
            id="cron-expr"
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            placeholder="* * * * *"
            spellCheck={false}
            className="font-mono text-base"
            aria-describedby="cron-help"
          />
          {parsed.ok && <CopyButton text={parsed.normalized} className="!border-border/60 !bg-muted !text-foreground hover:!bg-muted/70" />}
        </div>
        <p id="cron-help" className="mt-2 text-xs text-muted-foreground">
          minute hour day-of-month month day-of-week
        </p>
      </div>

      {/* Field breakdown */}
      <div className="grid gap-2 sm:grid-cols-5">
        {CRON_FIELDS.map((spec, i) => {
          const field = parsed.ok ? parsed.fields[i] : undefined;
          const fieldError = !parsed.ok
            ? parsed.errors.find((e) => e.fieldIndex === i)
            : undefined;
          return (
            <div
              key={spec.name}
              className={cn(
                "rounded-lg border p-3",
                fieldError
                  ? "border-red-500/50 bg-red-500/10"
                  : "border-border bg-card",
              )}
            >
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {spec.label}
              </p>
              <p className="mt-1 font-mono text-sm">
                {expr.trim().split(/\s+/)[i] ?? "—"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {field ? describeField(field) : `${spec.min}–${spec.max}`}
              </p>
              {fieldError && (
                <p className="mt-1 text-xs text-red-300">{fieldError.message}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Status */}
      {parsed.ok ? (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <p>{describeCron(parsed.fields)}</p>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium">Next 5 runs (local time)</h3>
            <ul className="space-y-1 font-mono text-sm text-muted-foreground">
              {runs.map((d, i) => (
                <li key={i}>
                  {d.toLocaleString(undefined, {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-red-300">
            <XCircle className="size-4" /> Invalid expression
          </p>
          <ul className="mt-2 space-y-1">
            {parsed.errors.map((e, i) => (
              <li key={i} className="text-sm text-red-200">
                {e.field !== "expression" && (
                  <span className="font-medium">{e.field}: </span>
                )}
                {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Presets */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Common presets</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CRON_PRESETS.map((p) => (
            <button
              key={p.expression}
              type="button"
              onClick={() => setExpr(p.expression)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left transition-colors",
                expr === p.expression
                  ? "border-primary/60 bg-primary/10"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <span className="block text-sm">{p.label}</span>
              <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                {p.expression}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

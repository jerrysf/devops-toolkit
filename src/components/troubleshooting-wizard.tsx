"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { SafetyBadge } from "@/components/safety-badge";
import { stepAt, type WizardTree } from "@/lib/wizard";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

interface Hop {
  nodeId: string;
  optionIndex: number;
  /** What the user answered — shown in the final path summary. */
  question: string;
  answer: string;
}

const confidenceStyle = {
  high: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  low: "border-slate-500/40 bg-slate-500/10 text-slate-300",
} as const;

/**
 * Guided diagnostic wizard. Decision-support only — it never claims to
 * have inspected a real cluster.
 */
export function TroubleshootingWizard({ tree }: { tree: WizardTree }) {
  const [path, setPath] = useState<Hop[]>([]);
  const step = stepAt(
    tree,
    path.map(({ nodeId, optionIndex }) => ({ nodeId, optionIndex })),
  );

  const maxDepth = 5; // soft cap for the progress bar — trees are ≤5 deep
  const progress = Math.min(100, Math.round((step.depth / maxDepth) * 100));

  function answer(optionIndex: number) {
    if (step.kind !== "question") return;
    const opt = step.node.options[optionIndex];
    setPath((p) => [
      ...p,
      {
        nodeId: step.node.id,
        optionIndex,
        question: step.node.question,
        answer: opt.label,
      },
    ]);
    trackEvent("tool_used", { tool: "wizard", scenario: tree.slug });
  }

  function back() {
    setPath((p) => p.slice(0, -1));
  }

  function restart() {
    setPath([]);
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Progress */}
      <div className="border-b border-border/60 px-5 py-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {step.kind === "result"
              ? "Diagnosis reached"
              : `Step ${step.depth + 1}`}
          </span>
          <div className="flex items-center gap-2">
            {path.length > 0 && (
              <button
                type="button"
                onClick={restart}
                className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
              >
                <RotateCcw className="size-3" /> Restart
              </button>
            )}
          </div>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${step.kind === "result" ? 100 : progress}%` }}
          />
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {step.kind === "question" ? (
          <>
            <h2 className="text-lg font-medium">{step.node.question}</h2>
            {step.node.hint && (
              <p className="mt-3 flex items-start gap-2 rounded-lg border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
                {step.node.hint}
              </p>
            )}
            <div className="mt-5 space-y-2">
              {step.node.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => answer(i)}
                  className="group flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-left text-sm transition-colors hover:border-primary/60 hover:bg-primary/5"
                >
                  {opt.label}
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              ))}
            </div>
          </>
        ) : (
          <ResultView result={step.result} path={path} tree={tree} />
        )}

        {path.length > 0 && (
          <div className="mt-6 border-t border-border/60 pt-4">
            <Button variant="ghost" size="sm" onClick={back}>
              <ArrowLeft /> Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultView({
  result,
  path,
  tree,
}: {
  result: WizardTree["results"][string];
  path: Hop[];
  tree: WizardTree;
}) {
  return (
    <div>
      <span
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
          confidenceStyle[result.confidence],
        )}
      >
        {result.confidence} confidence
      </span>
      <h2 className="mt-3 text-lg font-medium">{result.title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{result.explanation}</p>

      <h3 className="mt-5 text-sm font-medium">Recommended commands</h3>
      <div className="mt-2 space-y-2">
        {result.commands.map((c, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-lg border border-border bg-[#0a1224] p-3"
          >
            <div className="min-w-0 flex-1">
              <code className="block overflow-x-auto font-mono text-[13px] text-slate-200">
                {c.command}
              </code>
              <p className="mt-1 text-xs text-slate-400">{c.description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <SafetyBadge level={c.safety} />
              <CopyButton text={c.command} />
            </div>
          </div>
        ))}
      </div>

      {result.nextSteps && (
        <p className="mt-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Next:</span>{" "}
          {result.nextSteps}
        </p>
      )}

      {result.guideSlug && (
        <Link
          href={`/kubernetes/${result.guideSlug}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
        >
          Read the full {tree.title} guide <ArrowRight className="size-3.5" />
        </Link>
      )}

      {/* Diagnosis path */}
      {path.length > 0 && (
        <details className="mt-6 rounded-lg border border-border/60 bg-muted/30 p-4">
          <summary className="cursor-pointer text-sm font-medium">
            Your diagnosis path ({path.length} step{path.length === 1 ? "" : "s"})
          </summary>
          <ol className="mt-3 space-y-2">
            {path.map((hop, i) => (
              <li key={i} className="text-sm">
                <span className="text-muted-foreground">
                  {i + 1}. {hop.question}
                </span>{" "}
                <span className="text-foreground">→ {hop.answer}</span>
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}

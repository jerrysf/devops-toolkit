"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Lightbulb,
  RotateCcw,
  Send,
  Trophy,
} from "lucide-react";
import { execute, parseCommand, type SimScenario } from "@/lib/simulator";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface TermLine {
  kind: "cmd" | "out" | "info" | "warn";
  text: string;
}

interface Progress {
  completed: boolean;
  bestScore: number;
}

const STORAGE_KEY = "devops-toolkit:sim-progress";

function loadProgress(): Record<string, Progress> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveProgress(slug: string, p: Progress) {
  const all = loadProgress();
  const prev = all[slug];
  all[slug] = {
    completed: p.completed || prev?.completed || false,
    bestScore: Math.max(p.bestScore, prev?.bestScore ?? 0),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

type SimStatus = "not-started" | "in-progress" | "completed";

// Event-handler timestamps — not render-scoped values.
const nowMs = () => Date.now();

export function SimulatorTerminal({ scenario }: { scenario: SimScenario }) {
  const [lines, setLines] = useState<TermLine[]>(() =>
    scenario.welcome.map((text) => ({ kind: "info" as const, text })),
  );
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [status, setStatus] = useState<SimStatus>("not-started");
  const startedAtRef = useRef<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState<number | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [commandsRun, setCommandsRun] = useState(0);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [solved, setSolved] = useState<string | null>(null); // explanation
  const [showDiagnose, setShowDiagnose] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Final score — computed once at completion, not displayed while
  // playing. Base 100; -15/hint, -10/wrong guess, floor 10.
  const finalScore = Math.max(10, 100 - hintsUsed * 15 - wrongGuesses * 10);

  const reset = useCallback(() => {
    setLines([
      ...scenario.welcome.map((text) => ({ kind: "info" as const, text })),
    ]);
    setStatus("not-started");
    startedAtRef.current = null;
    setElapsedSec(null);
    setHintsUsed(0);
    setCommandsRun(0);
    setWrongGuesses(0);
    setSolved(null);
    setShowDiagnose(false);
    setHistory([]);
    setHistIdx(-1);
  }, [scenario]);

  function begin() {
    if (status === "not-started") {
      setStatus("in-progress");
      startedAtRef.current = nowMs();
      trackEvent("simulator_started", { scenario: scenario.slug });
    }
  }

  useEffect(() => {
    trackEvent("tool_opened", { tool: "simulator", scenario: scenario.slug });
  }, [scenario.slug]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  function runCommand() {
    const raw = input;
    setInput("");
    setHistIdx(-1);
    if (raw.trim()) {
      setHistory((h) => [...h, raw]);
      begin();
    }

    const parsed = parseCommand(raw);
    const output = execute(parsed, scenario.cluster);

    const push: TermLine[] = [{ kind: "cmd", text: `$ ${raw}` }];
    if (output === "__HINT__") {
      const hint =
        scenario.hints[Math.min(hintsUsed, scenario.hints.length - 1)];
      setHintsUsed((n) => n + 1);
      push.push({ kind: "warn", text: `HINT (${Math.min(hintsUsed + 1, scenario.hints.length)}/${scenario.hints.length}): ${hint}` });
    } else if (output === "__CLEAR__") {
      setLines([]);
      return;
    } else if (output === "__EXIT__") {
      push.push({ kind: "info", text: "Use the scenario list above to switch." });
    } else if (output) {
      push.push({ kind: "out", text: output });
    }
    if (parsed.kind === "get" || parsed.kind === "describe" || parsed.kind === "logs" || parsed.kind === "top") {
      setCommandsRun((n) => n + 1);
    }
    setLines((l) => [...l, ...push]);
  }

  function submitDiagnosis(id: string) {
    const opt = scenario.diagnosis.find((d) => d.id === id);
    if (!opt) return;
    begin();
    if (opt.correct) {
      const elapsed = startedAtRef.current
        ? Math.round((nowMs() - startedAtRef.current) / 1000)
        : 0;
      setElapsedSec(elapsed);
      setStatus("completed");
      setSolved(opt.explanation);
      setShowDiagnose(false);
      saveProgress(scenario.slug, { completed: true, bestScore: finalScore });
      trackEvent("simulator_completed", {
        scenario: scenario.slug,
        score: finalScore,
        hints: hintsUsed,
        commands: commandsRun,
        wrong_guesses: wrongGuesses,
        seconds: elapsed,
      });
    } else {
      setWrongGuesses((n) => n + 1);
      setLines((l) => [
        ...l,
        { kind: "warn", text: `Not quite — ${opt.explanation}` },
      ]);
    }
  }

  function fmtElapsed(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  return (
    <div className="space-y-4">
      {/* Brief */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">{scenario.brief}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Educational simulation — deterministic mock cluster, no real
          infrastructure. Read-only commands only.
        </p>
      </div>

      {/* Terminal */}
      <div className="overflow-hidden rounded-xl border border-border bg-[#060b18]">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-red-500/70" />
            <span className="size-2.5 rounded-full bg-amber-500/70" />
            <span className="size-2.5 rounded-full bg-emerald-500/70" />
            <span className="ml-3 font-mono text-xs text-muted-foreground">
              simulated kubectl — {scenario.slug}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                begin();
                setLines((l) => [
                  ...l,
                  {
                    kind: "warn",
                    text: `HINT (${Math.min(hintsUsed + 1, scenario.hints.length)}/${scenario.hints.length}): ${scenario.hints[Math.min(hintsUsed, scenario.hints.length - 1)]}`,
                  },
                ]);
                setHintsUsed((n) => n + 1);
              }}
              className="flex items-center gap-1 rounded px-2 py-1 font-mono text-xs text-amber-300 hover:bg-amber-500/10"
            >
              <Lightbulb className="size-3.5" /> hint
            </button>
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1 rounded px-2 py-1 font-mono text-xs text-muted-foreground hover:bg-muted"
            >
              <RotateCcw className="size-3.5" /> reset
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          onClick={() => inputRef.current?.focus()}
          className="h-[420px] overflow-y-auto p-4 font-mono text-[13px] leading-relaxed"
        >
          {lines.map((line, i) => (
            <pre
              key={i}
              className={cn(
                "whitespace-pre-wrap break-words",
                line.kind === "cmd" && "mt-3 text-primary",
                line.kind === "out" && "text-slate-300",
                line.kind === "info" && "text-muted-foreground",
                line.kind === "warn" && "text-amber-300",
              )}
            >
              {line.text}
            </pre>
          ))}
          {solved && (
            <div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 font-sans">
              <p className="flex items-center gap-2 font-medium text-emerald-300">
                <Trophy className="size-4" /> Correct — scenario solved. Score:{" "}
                {finalScore}/100
                {elapsedSec !== null && ` · ${fmtElapsed(elapsedSec)}`}
              </p>
              <p className="mt-2 text-sm text-emerald-100/90">{solved}</p>
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runCommand();
          }}
          className="flex items-center gap-2 border-t border-border/60 px-4 py-2.5"
        >
          <span className="font-mono text-sm text-primary">$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                e.preventDefault();
                const idx =
                  histIdx === -1 ? history.length - 1 : Math.max(0, histIdx - 1);
                if (history[idx]) {
                  setHistIdx(idx);
                  setInput(history[idx]);
                }
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                if (histIdx >= 0) {
                  const idx = histIdx + 1;
                  if (idx >= history.length) {
                    setHistIdx(-1);
                    setInput("");
                  } else {
                    setHistIdx(idx);
                    setInput(history[idx]);
                  }
                }
              }
            }}
            placeholder="kubectl get pods"
            spellCheck={false}
            autoComplete="off"
            aria-label="Terminal input"
            className="flex-1 bg-transparent font-mono text-sm text-slate-100 outline-none placeholder:text-muted-foreground/50"
          />
          <button
            type="submit"
            aria-label="Run command"
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Send className="size-4" />
          </button>
        </form>
      </div>

      {/* Diagnosis */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">
              {status === "not-started"
                ? "Investigate the incident, then submit your diagnosis"
                : status === "in-progress"
                  ? "Ready to diagnose?"
                  : "Diagnosis complete"}
            </p>
            <p className="text-xs text-muted-foreground">
              {status === "not-started" && (
                <>Not started — run commands to begin investigating.</>
              )}
              {status === "in-progress" && (
                <>
                  In progress · {commandsRun} diagnostic commands · {hintsUsed}{" "}
                  hints · {wrongGuesses} wrong guesses · score shown on
                  completion
                </>
              )}
              {status === "completed" && (
                <>
                  Final score {finalScore}/100 · {commandsRun} commands ·{" "}
                  {hintsUsed} hints · {wrongGuesses} wrong guesses
                  {elapsedSec !== null && ` · ${fmtElapsed(elapsedSec)}`}
                </>
              )}
            </p>
          </div>
          {!solved && (
            <button
              type="button"
              onClick={() => setShowDiagnose((s) => !s)}
              className="rounded-lg border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
            >
              {showDiagnose ? "Hide options" : "Submit diagnosis"}
            </button>
          )}
          {solved && (
            <Link
              href="/simulator"
              className="rounded-lg border border-border px-4 py-2 text-sm hover:border-primary/50"
            >
              Next scenario →
            </Link>
          )}
        </div>

        {showDiagnose && !solved && (
          <div className="mt-4 space-y-2">
            {scenario.diagnosis.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => submitDiagnosis(d.id)}
                className="block w-full rounded-lg border border-border p-3 text-left text-sm transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                {d.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Walkthrough (shown after solving) */}
      {solved && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="size-4 text-emerald-400" /> Suggested
            investigation path
          </p>
          <ol className="space-y-2">
            {scenario.walkthrough.map((w, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <code className="shrink-0 font-mono text-primary">
                  {i + 1}. {w.command}
                </code>
                <span className="text-muted-foreground">— {w.why}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

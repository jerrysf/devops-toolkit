"use client";

import { useEffect, useRef, useState } from "react";

interface Line {
  type: "cmd" | "out" | "ok";
  text: string;
  /** part of `text` to render highlighted (cyan). */
  highlight?: string;
}

const script: Line[] = [
  { type: "cmd", text: "kubectl get pods -n prod" },
  {
    type: "out",
    text: "web-6c8f9bb-2xklp   0/1   CrashLoopBackOff   7 (3m ago)",
    highlight: "CrashLoopBackOff",
  },
  { type: "cmd", text: "kubectl logs web-6c8f9bb-2xklp --previous" },
  {
    type: "out",
    text: "FATAL missing required env var DATABASE_URL",
    highlight: "DATABASE_URL",
  },
  { type: "ok", text: "root cause found — 2 commands, 40 seconds" },
];

const TYPE_MS = 28;
const LINE_MS = 420;
const DONE_MS = 4200;

function RenderLine({ line }: { line: Line }) {
  const hl = line.highlight;
  const body = hl ? (
    <>
      {line.text.split(hl)[0]}
      <span className="text-cyan-300">{hl}</span>
      {line.text.split(hl)[1]}
    </>
  ) : (
    line.text
  );
  if (line.type === "ok") return <p className="text-emerald-400">✓ {line.text}</p>;
  return <p className="text-slate-300">{body}</p>;
}

export function HeroTerminal() {
  const [lines, setLines] = useState<Line[]>([]);
  const [typed, setTyped] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const char = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    let i = 0;
    function step() {
      if (i >= script.length) {
        timer.current = setTimeout(() => {
          i = 0;
          char.current = 0;
          setLines([]);
          setTyped("");
          setLineIdx(0);
          timer.current = setTimeout(step, 500);
        }, DONE_MS);
        return;
      }
      const line = script[i];
      if (line.type === "cmd") {
        char.current += 1;
        setTyped(line.text.slice(0, char.current));
        if (char.current >= line.text.length) {
          setLines((l) => [...l, line]);
          setTyped("");
          i += 1;
          setLineIdx(i);
          char.current = 0;
          timer.current = setTimeout(step, LINE_MS);
        } else {
          timer.current = setTimeout(step, TYPE_MS);
        }
      } else {
        setLines((l) => [...l, line]);
        i += 1;
        setLineIdx(i);
        timer.current = setTimeout(step, LINE_MS);
      }
    }
    timer.current = setTimeout(step, 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const typingCmd =
    lineIdx < script.length && script[lineIdx].type === "cmd";

  return (
    <div
      className="rounded-xl border border-border bg-[#0a1224] shadow-2xl shadow-primary/10"
      role="img"
      aria-label="Animated terminal: kubectl commands revealing a CrashLoopBackOff root cause"
    >
      <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-red-500/70" />
        <span className="size-2.5 rounded-full bg-amber-500/70" />
        <span className="size-2.5 rounded-full bg-emerald-500/70" />
        <span className="ml-3 font-mono text-xs text-slate-500">
          kubectl — troubleshooting
        </span>
      </div>
      <div className="min-h-[168px] space-y-2 p-4 font-mono text-[13px] leading-6">
        {lines.map((line, i) =>
          line.type === "cmd" ? (
            <p key={i} className="text-slate-500">
              $ {line.text}
            </p>
          ) : (
            <RenderLine key={i} line={line} />
          ),
        )}
        {typingCmd && (
          <p className="text-slate-500">
            $ {typed}
            <span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-cyan-400/80" />
          </p>
        )}
        {!typingCmd && lines.length < script.length && (
          <p className="text-slate-600">
            <span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-cyan-400/60" />
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { validateYaml, type YamlResult } from "@/lib/yaml";
import { trackEvent } from "@/lib/analytics";

const SAMPLE = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: example-ns
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: registry.example.com/web:1.4.2
          ports:
            - containerPort: 8080
`;

export function YamlValidatorTool() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<YamlResult | null>(null);

  useEffect(() => {
    trackEvent("tool_opened", { tool: "yaml-validator" });
  }, []);

  function validate() {
    const r = validateYaml(input);
    setResult(r);
    trackEvent("tool_used", { tool: "yaml-validator", outcome: r.valid ? "valid" : "invalid" });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="yaml-input" className="text-sm font-medium">
            YAML input
          </label>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setInput(SAMPLE)}>
              Load example
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setInput("");
                setResult(null);
              }}
            >
              Clear
            </Button>
          </div>
        </div>
        <Textarea
          id="yaml-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste YAML here…"
          spellCheck={false}
          className="min-h-[420px] font-mono text-[13px] leading-relaxed"
        />
        <Button className="mt-3" onClick={validate} disabled={!input.trim()}>
          Validate YAML
        </Button>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Result</span>
          {result?.valid && result.formatted && (
            <CopyButton text={result.formatted} className="!border-border/60 !bg-muted !text-foreground hover:!bg-muted/70" />
          )}
        </div>

        {!result && (
          <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            Validation results appear here
          </div>
        )}

        {result && !result.valid && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-red-300">
              <XCircle className="size-4" /> Invalid YAML
            </p>
            <ul className="mt-2 space-y-1">
              {result.errors.map((e, i) => (
                <li key={i} className="font-mono text-[13px] text-red-200">
                  {e.line !== undefined && (
                    <span className="text-red-400">
                      line {e.line}
                      {e.column !== undefined && `:${e.column}`} —{" "}
                    </span>
                  )}
                  {e.message}
                </li>
              ))}
            </ul>
            {result.errors[0]?.snippet && (
              <pre className="mt-3 overflow-x-auto rounded bg-black/30 p-3 text-xs text-red-200">
                {result.errors[0].snippet}
              </pre>
            )}
          </div>
        )}

        {result?.valid && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">
              <CheckCircle2 className="size-4" />
              Valid YAML — {result.documentCount} document
              {result.documentCount === 1 ? "" : "s"} parsed
            </div>
            <pre className="max-h-[380px] overflow-auto rounded-lg border border-border bg-code-bg p-4 font-mono text-[13px] leading-relaxed text-code-foreground">
              {result.formatted}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

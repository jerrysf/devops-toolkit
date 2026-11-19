"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  analyzeManifests,
  K8S_TARGET_VERSION,
  type ManifestIssue,
} from "@/lib/k8s-manifest";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

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
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              memory: 512Mi
---
apiVersion: v1
kind: Service
metadata:
  name: web
  namespace: example-ns
spec:
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 8080
`;

const severityStyle = {
  error: { icon: XCircle, cls: "border-red-500/40 bg-red-500/10 text-red-200" },
  warning: {
    icon: AlertTriangle,
    cls: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  },
  info: { icon: Info, cls: "border-sky-500/40 bg-sky-500/10 text-sky-200" },
} as const;

function IssueRow({ issue }: { issue: ManifestIssue }) {
  const { icon: Icon, cls } = severityStyle[issue.severity];
  return (
    <li className={cn("rounded-lg border p-3 text-sm", cls)}>
      <p className="flex items-start gap-2">
        <Icon className="mt-0.5 size-4 shrink-0" />
        <span>
          {issue.line !== undefined && (
            <span className="mr-1 font-mono text-xs opacity-80">
              line {issue.line} —
            </span>
          )}
          {issue.path && (
            <code className="mr-1 font-mono text-xs opacity-80">
              {issue.path}:
            </code>
          )}
          {issue.message}
        </span>
      </p>
    </li>
  );
}

export function ManifestValidatorTool() {
  const [input, setInput] = useState("");
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    trackEvent("tool_opened", { tool: "manifest-validator" });
  }, []);

  const report = validated && input.trim() ? analyzeManifests(input) : null;
  const errorCount =
    report?.issues.filter((i) => i.severity === "error").length ?? 0;
  const warningCount =
    report?.issues.filter((i) => i.severity === "warning").length ?? 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="manifest-input" className="text-sm font-medium">
            Manifest YAML (multi-document supported)
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
                setValidated(false);
              }}
            >
              Clear
            </Button>
          </div>
        </div>
        <Textarea
          id="manifest-input"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setValidated(false);
          }}
          placeholder="apiVersion: apps/v1&#10;kind: Deployment&#10;…"
          spellCheck={false}
          className="min-h-[460px] font-mono text-[13px] leading-relaxed"
        />
        <Button className="mt-3" onClick={() => {
          setValidated(true);
          const r = analyzeManifests(input);
          trackEvent("tool_used", {
            tool: "manifest-validator",
            outcome: r.syntaxValid && !r.issues.some((i) => i.severity === "error") ? "valid" : "invalid",
          });
        }} disabled={!input.trim()}>
          Validate manifest
        </Button>
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium">Report</span>
        {!report && (
          <div className="flex min-h-[460px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            Validation results appear here
          </div>
        )}

        {report && !report.syntaxValid && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-red-300">
              <XCircle className="size-4" /> YAML syntax error
            </p>
            <p className="mt-2 font-mono text-[13px] text-red-200">
              {report.syntaxError?.line !== undefined &&
                `line ${report.syntaxError.line} — `}
              {report.syntaxError?.message}
            </p>
          </div>
        )}

        {report?.syntaxValid && (
          <div className="space-y-3">
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border p-3 text-sm",
                errorCount > 0
                  ? "border-red-500/40 bg-red-500/10 text-red-300"
                  : warningCount > 0
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
              )}
            >
              {errorCount > 0 ? (
                <XCircle className="size-4 shrink-0" />
              ) : (
                <CheckCircle2 className="size-4 shrink-0" />
              )}
              {errorCount > 0
                ? `${errorCount} error${errorCount === 1 ? "" : "s"}${warningCount ? `, ${warningCount} warning${warningCount === 1 ? "" : "s"}` : ""}`
                : warningCount > 0
                  ? `Valid structure — ${warningCount} warning${warningCount === 1 ? "" : "s"}`
                  : `Structure looks good — ${report.documentCount} resource${report.documentCount === 1 ? "" : "s"} checked against K8s ${K8S_TARGET_VERSION}`}
            </div>

            {report.resources.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Resources found
                </p>
                <ul className="space-y-1 font-mono text-[13px] text-muted-foreground">
                  {report.resources.map((r, i) => (
                    <li key={i}>
                      <span className="text-foreground">{r.kind}</span>
                      {"/"}
                      {r.name}
                      <span className="ml-2 text-xs">({r.apiVersion})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <ul className="space-y-2">
              {report.issues.map((issue, i) => (
                <IssueRow key={i} issue={issue} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

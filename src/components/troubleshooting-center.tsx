"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  componentLabels,
  difficultyOrder,
  kubernetesArticles,
  severityOrder,
  type ArticleMeta,
  type Component,
  type Difficulty,
  type Severity,
} from "@/data/articles";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

const severityStyle: Record<Severity, string> = {
  critical: "border-red-500/50 bg-red-500/10 text-red-300",
  high: "border-orange-500/50 bg-orange-500/10 text-orange-300",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  low: "border-slate-500/40 bg-slate-500/10 text-slate-300",
};

const difficultyStyle: Record<Difficulty, string> = {
  beginner: "text-emerald-400",
  intermediate: "text-amber-400",
  advanced: "text-red-400",
};

type SortKey = "severity" | "difficulty" | "title";

const sortLabels: Record<SortKey, string> = {
  severity: "Severity",
  difficulty: "Difficulty",
  title: "A–Z",
};

const allComponents = Object.keys(componentLabels) as Component[];

function matches(article: ArticleMeta, q: string): boolean {
  const haystack = [
    article.title,
    article.shortTitle,
    article.description,
    ...article.symptoms,
    ...article.keywords,
  ]
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export function TroubleshootingCenter() {
  const [query, setQuery] = useState("");
  const [component, setComponent] = useState<Component | null>(null);
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [sort, setSort] = useState<SortKey>("severity");

  const results = useMemo(() => {
    const list = kubernetesArticles.filter(
      (a) =>
        (!query || matches(a, query)) &&
        (!component || a.component === component) &&
        (!severity || a.severity === severity),
    );
    const key = {
      severity: (a: ArticleMeta) => severityOrder.indexOf(a.severity),
      difficulty: (a: ArticleMeta) => difficultyOrder.indexOf(a.difficulty),
      title: (a: ArticleMeta) => a.shortTitle.toLowerCase(),
    }[sort];
    return [...list].sort((a, b) => {
      const cmp =
        typeof key(a) === "number"
          ? (key(a) as number) - (key(b) as number)
          : String(key(a)).localeCompare(String(key(b)));
      // Published guides always float above in-progress ones.
      return cmp || Number(b.published) - Number(a.published);
    });
  }, [query, component, severity, sort]);

  const published = results.filter((a) => a.published);
  const pending = results.filter((a) => !a.published);

  return (
    <div>
      {/* Search + filters */}
      <div className="space-y-4">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.length > 2) {
                trackEvent("tool_used", { tool: "troubleshoot-search" });
              }
            }}
            placeholder="Search an error or symptom — e.g. OOMKilled, 502, ImagePull…"
            className="pl-9"
            aria-label="Search troubleshooting scenarios"
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <FilterGroup
            label="Component"
            options={allComponents.map((c) => ({ value: c, label: componentLabels[c] }))}
            selected={component}
            onSelect={(v) => setComponent(v === component ? null : v)}
          />
          <FilterGroup
            label="Severity"
            options={severityOrder.map((s) => ({ value: s, label: s }))}
            selected={severity}
            onSelect={(v) => setSeverity(v === severity ? null : v)}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Sort
            </span>
            {(Object.keys(sortLabels) as SortKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setSort(k)}
                className={cn(
                  "rounded-md px-2 py-1 text-xs transition-colors",
                  sort === k
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {sortLabels[k]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <p className="mt-6 text-sm text-muted-foreground" role="status">
        {published.length} published guide{published.length === 1 ? "" : "s"}
        {pending.length > 0 && ` · ${pending.length} in progress`}
      </p>

      {results.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">
            No scenarios match "{query}" — try a broader term like "pod",
            "image", or "node".
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setComponent(null);
              setSeverity(null);
            }}
            className="mt-3 text-sm text-primary underline-offset-4 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {published.map((a) => (
            <ScenarioResultCard key={a.slug} article={a} />
          ))}
          {pending.map((a) => (
            <ScenarioResultCard key={a.slug} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterGroup<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T | null;
  onSelect: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onSelect(o.value)}
          aria-pressed={selected === o.value}
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs capitalize transition-colors",
            selected === o.value
              ? "border-primary/60 bg-primary/15 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ScenarioResultCard({ article }: { article: ArticleMeta }) {
  const body = (
    <>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
            severityStyle[article.severity],
          )}
        >
          {article.severity}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {componentLabels[article.component]}
        </span>
        <span
          className={cn(
            "ml-auto text-[11px] font-medium",
            difficultyStyle[article.difficulty],
          )}
        >
          {article.difficulty}
        </span>
      </div>
      <h3 className="mt-3 font-medium group-hover:text-primary">
        {article.shortTitle}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
        {article.description}
      </p>
      <p className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        {article.published ? (
          <>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" /> {article.readingTimeMinutes} min
            </span>
            <span>K8s {article.kubernetesVersions}</span>
          </>
        ) : (
          <span className="font-mono uppercase tracking-wider">
            Guide in progress
          </span>
        )}
      </p>
    </>
  );

  if (!article.published) {
    return (
      <div className="group rounded-xl border border-dashed border-border p-5 opacity-70">
        {body}
      </div>
    );
  }
  return (
    <Link
      href={`/kubernetes/${article.slug}`}
      className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
    >
      {body}
      <span className="sr-only"> — read guide</span>
    </Link>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getKbCategory, searchKb, type KbItem } from "@/data/kb";

const typeLabel: Record<KbItem["type"], string> = {
  guide: "Guide",
  reference: "Reference",
  tool: "Tool",
  wizard: "Wizard",
  simulator: "Simulator",
  checklist: "Checklist",
};

export function KbSearch() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchKb(query), [query]);
  const searching = query.trim().length > 0;

  return (
    <div>
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search guides, references, tools…"
          className="pl-9"
          aria-label="Search knowledge base"
        />
      </div>

      {searching && (
        <div className="mt-4 max-w-3xl">
          {results.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              Nothing found for “{query}”. Try an error type like
              “crashloop” or a topic like “dns”.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {results.map((item, i) => (
                <li key={`${item.href}-${i}`}>
                  <Link
                    href={item.href}
                    className="group flex items-start justify-between gap-4 p-4 transition-colors hover:bg-muted/40"
                  >
                    <span>
                      <span className="flex items-center gap-2 font-medium">
                        {item.title}
                        <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                    <span className="mt-1 flex shrink-0 gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border border-border px-2 py-0.5">
                        {typeLabel[item.type]}
                      </span>
                      <span className="hidden rounded-full border border-border px-2 py-0.5 sm:inline">
                        {getKbCategory(item.category)?.title}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

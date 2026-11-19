import Link from "next/link";
import { ArrowRight, RefreshCcw, Download, ServerCrash, CircleDot } from "lucide-react";
import type { ArticleMeta } from "@/data/articles";

const iconMap: Record<string, typeof RefreshCcw> = {
  crashloopbackoff: RefreshCcw,
  imagepullbackoff: Download,
  "node-not-ready": ServerCrash,
};

export function ScenarioCard({ article }: { article: ArticleMeta }) {
  const Icon = iconMap[article.slug] ?? CircleDot;

  if (!article.published) {
    return (
      <div className="rounded-xl border border-dashed border-border p-5 opacity-60">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-medium">{article.shortTitle}</h3>
            <p className="text-xs text-muted-foreground">Guide in progress</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/kubernetes/${article.slug}`}
      className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-card/80"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon className="size-4" />
        </span>
        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <h3 className="mt-3 font-medium">{article.shortTitle}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
        {article.description}
      </p>
    </Link>
  );
}

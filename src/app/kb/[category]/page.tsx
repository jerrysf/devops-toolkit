import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Hammer } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  getKbCategory,
  kbCategories,
  kbItemsFor,
  type KbItem,
} from "@/data/kb";
import { absoluteUrl } from "@/lib/site";

export function generateStaticParams() {
  return kbCategories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = getKbCategory(category);
  if (!cat) return {};
  return {
    title: `${cat.title} — Knowledge Base`,
    description: cat.description,
    alternates: { canonical: absoluteUrl(`/kb/${cat.slug}`) },
  };
}

const typeBadge: Record<KbItem["type"], string> = {
  guide: "border-sky-500/40 text-sky-300",
  reference: "border-violet-500/40 text-violet-300",
  tool: "border-emerald-500/40 text-emerald-300",
  wizard: "border-cyan-500/40 text-cyan-300",
  simulator: "border-amber-500/40 text-amber-300",
  checklist: "border-rose-500/40 text-rose-300",
};

export default async function KbCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = getKbCategory(category);
  if (!cat) notFound();
  const items = kbItemsFor(cat.slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[
          { title: "Knowledge Base", href: "/kb" },
          { title: cat.title },
        ]}
      />
      <header className="mb-8 mt-6 max-w-2xl">
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          <span className="flex size-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <cat.icon className="size-6" />
          </span>
          {cat.title}
        </h1>
        <p className="mt-3 text-muted-foreground">{cat.description}</p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <Hammer className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">In development</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Content for this category is being written and reviewed. In the
            meantime, the{" "}
            <Link href="/kb/kubernetes" className="text-primary hover:underline">
              Kubernetes
            </Link>{" "}
            and{" "}
            <Link
              href="/kb/incident-management"
              className="text-primary hover:underline"
            >
              Incident Management
            </Link>{" "}
            sections are live.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={`${item.href}-${i}`}>
              <Link
                href={item.href}
                className="group flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
              >
                <span>
                  <span className="flex items-center gap-2 font-medium">
                    {item.title}
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {item.description}
                  </span>
                </span>
                <span
                  className={`mt-0.5 shrink-0 rounded-full border px-2.5 py-0.5 text-xs capitalize ${typeBadge[item.type]}`}
                >
                  {item.type}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

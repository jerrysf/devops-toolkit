import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, Server } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductCta } from "@/components/product-cta";
import { getArticleMeta, publishedArticles, kubernetesArticles } from "@/data/articles";
import { mdxArticles } from "@/lib/mdx-articles";
import { absoluteUrl, siteConfig } from "@/lib/site";

export function generateStaticParams() {
  return publishedArticles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/kubernetes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const meta = getArticleMeta(slug);
  if (!meta) return {};
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: { canonical: absoluteUrl(`/kubernetes/${meta.slug}`) },
    openGraph: {
      type: "article",
      title: meta.title,
      description: meta.description,
      modifiedTime: meta.lastReviewed,
    },
  };
}

export default async function ArticlePage({
  params,
}: PageProps<"/kubernetes/[slug]">) {
  const { slug } = await params;
  const meta = getArticleMeta(slug);
  const loader = mdxArticles[slug];
  if (!meta || !loader) notFound();

  const { default: Content } = await loader();

  const related = meta.related
    .map((r) => kubernetesArticles.find((a) => a.slug === r))
    .filter((a): a is NonNullable<typeof a> => a !== undefined && a.published);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: meta.title,
    description: meta.description,
    dateModified: meta.lastReviewed,
    author: { "@type": "Organization", name: siteConfig.name },
    publisher: { "@type": "Organization", name: siteConfig.name },
    mainEntityOfPage: absoluteUrl(`/kubernetes/${meta.slug}`),
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs
        items={[
          { title: "Kubernetes", href: "/kubernetes" },
          { title: meta.shortTitle },
        ]}
      />

      <header className="mt-6 border-b border-border/60 pb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {meta.title}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          {meta.description}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" /> {meta.readingTimeMinutes} min read
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Server className="size-3.5" /> Kubernetes{" "}
            {meta.kubernetesVersions}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" /> Last reviewed{" "}
            {meta.lastReviewed}
          </span>
        </div>
      </header>

      <div className="prose prose-invert mt-8 max-w-none prose-headings:scroll-mt-20 prose-a:text-primary prose-code:before:content-none prose-code:after:content-none prose-pre:bg-transparent prose-pre:p-0 dark:prose-invert">
        <Content />
      </div>

      {related.length > 0 && (
        <section className="mt-12 border-t border-border/60 pt-8">
          <h2 className="text-lg font-medium">Related scenarios</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.map((a) => (
              <Link
                key={a.slug}
                href={`/kubernetes/${a.slug}`}
                className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
              >
                <h3 className="text-sm font-medium">{a.shortTitle}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {a.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <ProductCta />
      </section>
    </article>
  );
}

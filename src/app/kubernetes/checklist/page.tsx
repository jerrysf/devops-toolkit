import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { absoluteUrl } from "@/lib/site";
import Content from "../../../../content/kubernetes/checklist.mdx";

export const metadata: Metadata = {
  title: "Kubernetes Incident Response Checklist",
  description:
    "A printable checklist for the first 30 minutes of a Kubernetes incident: orient, localize, decide, act, verify.",
  alternates: { canonical: absoluteUrl("/kubernetes/checklist") },
};

export default function ChecklistPage() {
  return (
    <article>
      <Breadcrumbs
        items={[
          { title: "Kubernetes", href: "/kubernetes" },
          { title: "Incident Checklist" },
        ]}
      />
      <div className="prose prose-invert mt-6 max-w-none prose-headings:scroll-mt-20 prose-a:text-primary prose-code:before:content-none prose-code:after:content-none prose-pre:bg-transparent prose-pre:p-0 dark:prose-invert">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Kubernetes Incident Response Checklist
        </h1>
        <Content />
      </div>
    </article>
  );
}

import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { absoluteUrl } from "@/lib/site";
import Content from "../../../../content/kubernetes/kubectl-commands.mdx";

export const metadata: Metadata = {
  title: "kubectl Command Reference for Troubleshooting",
  description:
    "The kubectl commands that matter during an incident — organized by what you're trying to learn, with what each flag does.",
  alternates: { canonical: absoluteUrl("/kubernetes/kubectl-commands") },
};

export default function KubectlCommandsPage() {
  return (
    <article>
      <Breadcrumbs
        items={[
          { title: "Kubernetes", href: "/kubernetes" },
          { title: "kubectl Commands" },
        ]}
      />
      <div className="prose prose-invert mt-6 max-w-none prose-headings:scroll-mt-20 prose-a:text-primary prose-code:before:content-none prose-code:after:content-none prose-pre:bg-transparent prose-pre:p-0 dark:prose-invert">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          kubectl Command Reference
        </h1>
        <Content />
      </div>
    </article>
  );
}

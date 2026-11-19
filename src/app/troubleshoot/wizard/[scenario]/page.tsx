import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { TroubleshootingWizard } from "@/components/troubleshooting-wizard";
import { getWizard, wizardTrees } from "@/data/wizards";
import { Callout } from "@/components/callout";
import { absoluteUrl } from "@/lib/site";

export function generateStaticParams() {
  return wizardTrees.map((t) => ({ scenario: t.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/troubleshoot/wizard/[scenario]">): Promise<Metadata> {
  const { scenario } = await params;
  const tree = getWizard(scenario);
  if (!tree) return {};
  return {
    title: `Guided Diagnosis: ${tree.title}`,
    description: `Interactive troubleshooting wizard for ${tree.title}. Answer questions, get guided diagnostic commands.`,
    alternates: {
      canonical: absoluteUrl(`/troubleshoot/wizard/${tree.slug}`),
    },
  };
}

export default async function WizardPage({
  params,
}: PageProps<"/troubleshoot/wizard/[scenario]">) {
  const { scenario } = await params;
  const tree = getWizard(scenario);
  if (!tree) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[
          { title: "Troubleshoot", href: "/troubleshoot" },
          { title: "Wizard", href: "/troubleshoot/wizard" },
          { title: tree.title },
        ]}
      />
      <header className="mt-6 mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          {tree.title}: Guided Diagnosis
        </h1>
        <p className="mt-3 text-muted-foreground">{tree.description}</p>
      </header>

      <Callout type="info" title="Decision support, not cluster diagnosis">
        This wizard guides you toward the right diagnostics based on your
        answers. It can't inspect your cluster — you run the commands, it
        helps you interpret what you find.
      </Callout>

      <div className="mt-6">
        <TroubleshootingWizard tree={tree} />
      </div>

      <p className="mt-6 text-sm">
        <Link
          href="/troubleshoot/wizard"
          className="inline-flex items-center gap-1.5 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-3.5" /> Choose a different scenario
        </Link>
      </p>
    </div>
  );
}

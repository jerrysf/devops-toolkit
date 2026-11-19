import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SimulatorTerminal } from "@/components/simulator-terminal";
import { getSimScenario, simScenarios } from "@/data/simulator";
import { absoluteUrl } from "@/lib/site";

export function generateStaticParams() {
  return simScenarios.map((s) => ({ scenario: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ scenario: string }>;
}): Promise<Metadata> {
  const { scenario } = await params;
  const s = getSimScenario(scenario);
  if (!s) return {};
  return {
    title: `${s.title} — Troubleshooting Simulator`,
    description: s.brief,
    alternates: { canonical: absoluteUrl(`/simulator/${s.slug}`) },
  };
}

export default async function SimulatorScenarioPage({
  params,
}: {
  params: Promise<{ scenario: string }>;
}) {
  const { scenario } = await params;
  const s = getSimScenario(scenario);
  if (!s) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[
          { title: "Simulator", href: "/simulator" },
          { title: s.title },
        ]}
      />
      <header className="mb-8 mt-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Simulate: {s.title}
        </h1>
      </header>
      <SimulatorTerminal scenario={s} />
    </div>
  );
}

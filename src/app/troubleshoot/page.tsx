import type { Metadata } from "next";
import Link from "next/link";
import { Wand2 } from "lucide-react";
import { TroubleshootingCenter } from "@/components/troubleshooting-center";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Troubleshooting Center — Search Kubernetes Failures",
  description:
    "Search Kubernetes failure modes by error message, symptom, or component. Filter by severity and difficulty, then follow structured guides.",
  alternates: { canonical: absoluteUrl("/troubleshoot") },
};

export default function TroubleshootPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">
          Troubleshooting Center
        </h1>
        <p className="mt-3 text-muted-foreground">
          Search the failure you're seeing — an error string, a symptom, or
          the component involved. Each guide walks from symptoms to verified
          resolution.
        </p>
        <Link
          href="/troubleshoot/wizard"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <Wand2 className="size-4" />
          Not sure where to start? Try the guided wizard
        </Link>
      </header>

      <TroubleshootingCenter />
    </div>
  );
}

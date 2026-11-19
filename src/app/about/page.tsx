import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "DevOps Toolkit is an independent project building practical troubleshooting resources for engineers who run production Kubernetes.",
  alternates: { canonical: absoluteUrl("/about") },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        About DevOps Toolkit
      </h1>
      <div className="prose prose-invert mt-6 max-w-none text-muted-foreground dark:prose-invert">
        <p>
          DevOps Toolkit is an independent project for engineers who operate
          production systems. It exists because most Kubernetes troubleshooting
          knowledge lives scattered across forum threads, outdated blog posts,
          and tribal memory — and during an incident none of that is fast enough.
        </p>
        <h2 className="text-foreground">What we build</h2>
        <ul>
          <li>
            <strong>Troubleshooting guides</strong> with a consistent structure:
            symptoms, ranked causes, diagnostics with expected output,
            resolution, and prevention. Every command is explained and marked
            read-only or mutating.
          </li>
          <li>
            <strong>Browser-native tools</strong> — validators and generators
            that run locally. Nothing you paste is uploaded anywhere.
          </li>
          <li>
            <strong>The Kubernetes Troubleshooting Toolkit</strong> — a paid,
            deeper collection of runbooks, checklists, and reference material
            for engineers who do this regularly.
          </li>
        </ul>
        <h2 className="text-foreground">Principles</h2>
        <ul>
          <li>Accuracy over volume — a few verified guides beat fifty generic ones.</li>
          <li>Production safety — destructive commands are always flagged, never recommended as a first response.</li>
          <li>Privacy by default — tools run client-side; we don't collect your configs.</li>
          <li>Honest marketing — no fake testimonials, no invented user counts, no artificial urgency.</li>
        </ul>
        <h2 className="text-foreground">Contact</h2>
        <p>
          Found an error in a guide? Have a scenario you'd like covered?{" "}
          <a href="/contact">Get in touch</a> — corrections from practitioners
          make the content better for everyone.
        </p>
      </div>
    </div>
  );
}

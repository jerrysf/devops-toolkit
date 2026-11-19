import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of DevOps Toolkit.",
  alternates: { canonical: absoluteUrl("/terms") },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: November 19, 2026
      </p>
      <div className="prose prose-invert mt-6 max-w-none text-muted-foreground dark:prose-invert">
        <h2 className="text-foreground">The service</h2>
        <p>
          DevOps Toolkit provides free troubleshooting guides, browser-based
          developer tools, and paid digital products (the Kubernetes
          Troubleshooting Toolkit). By using the site you agree to these terms.
        </p>

        <h2 className="text-foreground">Acceptable use</h2>
        <ul>
          <li>Use the tools and guides for lawful purposes.</li>
          <li>Don't scrape the site at abusive rates or misrepresent our content as your own.</li>
          <li>Commands in our guides can modify or delete resources — you're responsible for running them against the right cluster and understanding their effect.</li>
        </ul>

        <h2 className="text-foreground">Digital products</h2>
        <ul>
          <li>Purchases are one-time and licensed to a single user.</li>
          <li>You may use the toolkit materials for your own work, including at your employer.</li>
          <li>You may not redistribute, resell, or publicly post the paid materials.</li>
          <li>Updates to the edition you purchased are free; separate future editions or bundles may be sold separately.</li>
        </ul>

        <h2 className="text-foreground">No warranty</h2>
        <p>
          Content is provided "as is" for educational purposes. We work hard
          to keep commands correct and safe, but we can't guarantee every
          guide fits every cluster configuration. Always verify commands in a
          non-production environment where possible, and ensure you have
          working backups before destructive operations.
        </p>

        <h2 className="text-foreground">Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, DevOps Toolkit is not liable
          for damages arising from use of the site, tools, or purchased
          materials — including data loss, downtime, or incident outcomes.
        </p>

        <h2 className="text-foreground">Contact</h2>
        <p>
          Questions about these terms: <a href="/contact">contact us</a>.
        </p>
      </div>
    </div>
  );
}

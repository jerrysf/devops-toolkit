import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How DevOps Toolkit handles data and privacy.",
  alternates: { canonical: absoluteUrl("/privacy") },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: November 19, 2026
      </p>
      <div className="prose prose-invert mt-6 max-w-none text-muted-foreground dark:prose-invert">
        <h2 className="text-foreground">Summary</h2>
        <p>
          DevOps Toolkit is designed to collect as little data as possible.
          Our free tools run entirely in your browser — the YAML, cron
          expressions, and anything else you type are never sent to our
          servers.
        </p>

        <h2 className="text-foreground">Data we process</h2>
        <ul>
          <li>
            <strong>Tool input:</strong> processed locally in your browser
            only. It is not transmitted, logged, or stored by us.
          </li>
          <li>
            <strong>Newsletter signups:</strong> if you subscribe, we store
            your email address to send the newsletter. Unsubscribe anytime
            via the link in every email.
          </li>
          <li>
            <strong>Purchases:</strong> payment processing is handled by our
            hosted checkout provider. We receive your email and order
            confirmation to deliver the product; we never see or store your
            card details.
          </li>
          <li>
            <strong>Analytics:</strong> when enabled, we use privacy-respecting
            analytics to understand which pages and tools are used (page
            views, feature usage). We do not send tool input, file contents,
            or commands to analytics.
          </li>
          <li>
            <strong>Contact emails:</strong> retained as long as needed to
            respond to your request.
          </li>
        </ul>

        <h2 className="text-foreground">What we never collect</h2>
        <ul>
          <li>kubeconfig files, cluster credentials, or access keys</li>
          <li>YAML or file contents you paste into tools</li>
          <li>Payment card numbers or bank details</li>
        </ul>

        <h2 className="text-foreground">Cookies</h2>
        <p>
          The site itself uses no tracking cookies. If analytics is enabled,
          it may set a small number of cookies for anonymous usage
          measurement.
        </p>

        <h2 className="text-foreground">Your rights</h2>
        <p>
          You can request access to, correction of, or deletion of your
          personal data (typically just your email address) at any time via{" "}
          <a href="/contact">the contact page</a>.
        </p>

        <h2 className="text-foreground">Changes</h2>
        <p>
          If this policy changes materially, we'll note the update here with a
          new "last updated" date.
        </p>
      </div>
    </div>
  );
}

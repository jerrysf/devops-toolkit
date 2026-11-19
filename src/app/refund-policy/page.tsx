import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Refund policy for DevOps Toolkit digital products.",
  alternates: { canonical: absoluteUrl("/refund-policy") },
};

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Refund Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: November 19, 2026
      </p>
      <div className="prose prose-invert mt-6 max-w-none text-muted-foreground dark:prose-invert">
        <h2 className="text-foreground">14-day guarantee</h2>
        <p>
          If the Kubernetes Troubleshooting Toolkit isn't what you expected,
          email us within <strong>14 days of purchase</strong> for a full
          refund — no questions asked.
        </p>

        <h2 className="text-foreground">How to request a refund</h2>
        <ol>
          <li>
            Email <a href="/contact">our contact address</a> from (or
            including) the email used at checkout.
          </li>
          <li>Include your order reference from the purchase confirmation.</li>
          <li>
            Refunds are issued through the original payment method via our
            checkout provider, typically within 5–10 business days.
          </li>
        </ol>

        <h2 className="text-foreground">Notes</h2>
        <ul>
          <li>
            Because the product is a digital download, a refund doesn't
            require "returning" anything — but the license to use the
            materials ends when the refund is processed.
          </li>
          <li>
            If you have a problem that isn't about wanting a refund — a broken
            download, a corrupted file — contact us first; that's usually
            fixable in minutes.
          </li>
        </ul>
      </div>
    </div>
  );
}

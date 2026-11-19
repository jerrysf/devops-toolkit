import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the DevOps Toolkit team.",
  alternates: { canonical: absoluteUrl("/contact") },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Contact</h1>
      <p className="mt-4 text-muted-foreground">
        Questions about the toolkit, corrections to a guide, refund requests,
        or a troubleshooting scenario you'd like covered — email is the
        fastest way to reach us.
      </p>
      <a
        href={`mailto:${siteConfig.email}`}
        className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 font-mono text-sm transition-colors hover:border-primary/50"
      >
        <Mail className="size-4 text-primary" />
        {siteConfig.email}
      </a>
      <div className="prose prose-invert mt-8 max-w-none text-sm text-muted-foreground dark:prose-invert">
        <ul>
          <li>
            <strong>Refund requests:</strong> include the email used at
            checkout and your order reference. See the{" "}
            <a href="/refund-policy">refund policy</a>.
          </li>
          <li>
            <strong>Content corrections:</strong> link the guide and describe
            what's wrong — a corrected command or better explanation helps
            every reader.
          </li>
          <li>
            <strong>Support:</strong> we aim to reply within 2 business days.
          </li>
        </ul>
      </div>
    </div>
  );
}

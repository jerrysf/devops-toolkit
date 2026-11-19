import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Purchase Complete",
  robots: { index: false, follow: false },
};

/**
 * Redirect target after a successful hosted checkout.
 *
 * NOTE: arriving here is not proof of payment — the URL is publicly
 * guessable. Product delivery/access must only be granted via the
 * payment provider's verified webhook (see docs/PAYMENTS.md). This page
 * tells the customer what to expect, honestly.
 */
export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center sm:px-6">
      <CheckCircle2 className="size-12 text-emerald-400" />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">
        Thank you for your purchase
      </h1>
      <p className="mt-3 text-muted-foreground">
        Your order is being processed by our checkout provider. You'll
        receive an email with your download link shortly — it can take a
        minute or two to arrive.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        If the email doesn't arrive, check spam, then{" "}
        <Link href="/contact" className="text-primary underline-offset-4 hover:underline">
          contact us
        </Link>{" "}
        with your order reference.
      </p>
      <Button render={<Link href="/" />} variant="secondary" className="mt-8">
        Back to DevOps Toolkit
      </Button>
    </div>
  );
}

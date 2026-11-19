import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Checkout Cancelled",
  robots: { index: false, follow: false },
};

export default function CheckoutCancelPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Checkout cancelled
      </h1>
      <p className="mt-3 text-muted-foreground">
        No charge was made. The toolkit will still be here whenever you're
        ready — and the free guides and tools always will be.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button
          render={<Link href="/products/kubernetes-toolkit" />}
          variant="secondary"
        >
          <ArrowLeft /> Back to the toolkit
        </Button>
        <Button render={<Link href="/kubernetes" />} variant="ghost">
          Read the free guides
        </Button>
      </div>
    </div>
  );
}

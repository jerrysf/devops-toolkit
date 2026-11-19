import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="font-mono text-sm text-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="mt-3 text-muted-foreground">
        The page you're looking for doesn't exist or hasn't been published
        yet.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button render={<Link href="/" />}>Go home</Button>
        <Button render={<Link href="/kubernetes" />} variant="secondary">
          Troubleshooting guides
        </Button>
      </div>
    </div>
  );
}

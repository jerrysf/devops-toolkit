"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

const endpoint = process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT;

/**
 * Newsletter signup.
 *
 * When NEXT_PUBLIC_NEWSLETTER_ENDPOINT is configured the form POSTs the
 * address there (e.g. Buttondown/ConvertKit form URL). Until then it
 * shows an honest "coming soon" acknowledgement instead of silently
 * discarding the email.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "error" | "done">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) {
      setState("error");
      return;
    }
    trackEvent("newsletter_signup", { configured: Boolean(endpoint) });
    if (!endpoint) {
      setState("done");
      return;
    }
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="text-sm text-emerald-400">
        {endpoint
          ? "Thanks — check your inbox to confirm your subscription."
          : "Thanks for your interest. The newsletter is launching soon — we'll announce it here."}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-md gap-2">
      <Input
        type="email"
        required
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setState("idle");
        }}
        placeholder="you@company.com"
        aria-label="Email address"
        aria-invalid={state === "error"}
      />
      <Button type="submit" variant="secondary">
        Subscribe
      </Button>
      {state === "error" && (
        <p className="sr-only" role="alert">
          Please enter a valid email address.
        </p>
      )}
    </form>
  );
}

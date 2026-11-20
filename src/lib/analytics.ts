/**
 * Lightweight analytics event layer.
 *
 * Events are forwarded to Google Analytics 4 (gtag) when
 * NEXT_PUBLIC_GA_ID is configured, and to Vercel Analytics when
 * installed. Otherwise they are silently dropped — analytics must
 * never break the product or run in development noise.
 *
 * Never send user input (YAML, commands, file contents) or
 * credentials to analytics. Event params must be coarse labels only.
 */

import { track } from "@vercel/analytics";

export type AnalyticsEvent =
  | "tool_opened"
  | "tool_used"
  | "product_viewed"
  | "purchase_cta_clicked"
  | "checkout_started"
  | "purchase_completed"
  | "newsletter_signup"
  | "simulator_started"
  | "simulator_completed";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(
  event: AnalyticsEvent,
  params?: Record<string, string | number | boolean | null>,
) {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", event, params);
    track(event, params);
  } catch {
    // Analytics is best-effort; never throw into the UI.
  }
}

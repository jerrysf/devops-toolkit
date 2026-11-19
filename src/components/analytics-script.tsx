import Script from "next/script";

const gaId = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Google Analytics 4 bootstrap. Rendered only when NEXT_PUBLIC_GA_ID
 * is configured — no placeholder tracking, no wasted requests.
 * Vercel Analytics can be added later via @vercel/analytics.
 */
export function AnalyticsScript() {
  if (!gaId) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}

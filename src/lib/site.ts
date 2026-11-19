export const siteConfig = {
  name: "DevOps Toolkit",
  description:
    "Practical troubleshooting workflows, production-ready runbooks, and developer tools built for DevOps and SRE engineers.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: "hello@devopstoolkit.dev",
  nav: [
    { title: "Troubleshoot", href: "/troubleshoot" },
    { title: "Guides", href: "/kubernetes" },
    { title: "Tools", href: "/tools" },
    { title: "Simulator", href: "/simulator" },
    { title: "Learn", href: "/kb" },
    { title: "Resources", href: "/resources" },
    { title: "Pricing", href: "/pricing" },
  ],
} as const;

export function absoluteUrl(path = "") {
  return `${siteConfig.url}${path}`;
}

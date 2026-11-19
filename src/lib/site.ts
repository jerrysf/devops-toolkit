export const siteConfig = {
  name: "DevOps Toolkit",
  description:
    "Practical troubleshooting workflows, production-ready runbooks, and developer tools built for DevOps and SRE engineers.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: "hello@devopstoolkit.dev",
  nav: [
    { title: "Kubernetes", href: "/kubernetes" },
    { title: "Tools", href: "/tools" },
    { title: "Toolkit", href: "/products/kubernetes-toolkit" },
    { title: "Pricing", href: "/pricing" },
    { title: "Blog", href: "/blog" },
  ],
} as const;

export function absoluteUrl(path = "") {
  return `${siteConfig.url}${path}`;
}

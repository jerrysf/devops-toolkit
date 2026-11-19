import Link from "next/link";
import { Terminal } from "lucide-react";
import { siteConfig } from "@/lib/site";

// Cached at prerender — the year updates on each deploy, which is all a
// copyright line needs.
async function copyrightYear() {
  "use cache";
  return new Date().getFullYear();
}

const footerNav = [
  {
    heading: "Product",
    links: [
      { title: "Kubernetes Toolkit", href: "/products/kubernetes-toolkit" },
      { title: "Pricing", href: "/pricing" },
      { title: "Free Tools", href: "/tools" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { title: "Troubleshooting Guides", href: "/kubernetes" },
      { title: "kubectl Commands", href: "/kubernetes/kubectl-commands" },
      { title: "Incident Checklist", href: "/kubernetes/checklist" },
      { title: "Blog", href: "/blog" },
    ],
  },
  {
    heading: "Company",
    links: [
      { title: "About", href: "/about" },
      { title: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { title: "Privacy", href: "/privacy" },
      { title: "Terms", href: "/terms" },
      { title: "Refund Policy", href: "/refund-policy" },
    ],
  },
];

export async function SiteFooter() {
  const year = await copyrightYear();
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="flex size-7 items-center justify-center rounded-md bg-primary/15 text-primary">
                <Terminal className="size-4" />
              </span>
              DevOps Toolkit
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Practical troubleshooting workflows and tools for engineers who
              run production Kubernetes.
            </p>
          </div>
          {footerNav.map((group) => (
            <nav key={group.heading} aria-label={group.heading}>
              <h2 className="text-sm font-medium">{group.heading}</h2>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <p>Built for engineers. No tracking without consent — see Privacy.</p>
        </div>
      </div>
    </footer>
  );
}

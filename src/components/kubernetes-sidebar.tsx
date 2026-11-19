"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { kubernetesArticles } from "@/data/articles";

const referenceLinks = [
  { title: "kubectl Command Reference", href: "/kubernetes/kubectl-commands" },
  { title: "Incident Checklist", href: "/kubernetes/checklist" },
];

export function KubernetesSidebar() {
  const pathname = usePathname();

  const itemClass = (href: string, disabled = false) =>
    cn(
      "block rounded-md px-3 py-1.5 text-sm transition-colors",
      pathname === href
        ? "bg-muted font-medium text-foreground"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      disabled && "pointer-events-none opacity-50",
    );

  return (
    <nav aria-label="Kubernetes guides" className="space-y-6">
      <div>
        <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Troubleshooting
        </h2>
        <ul className="space-y-0.5">
          {kubernetesArticles.map((a) => (
            <li key={a.slug}>
              {a.published ? (
                <Link
                  href={`/kubernetes/${a.slug}`}
                  className={itemClass(`/kubernetes/${a.slug}`)}
                >
                  {a.shortTitle}
                </Link>
              ) : (
                <span
                  className={itemClass(`/kubernetes/${a.slug}`, true)}
                  title="Guide in progress"
                >
                  {a.shortTitle}
                  <span className="ml-2 text-[10px] uppercase tracking-wider opacity-70">
                    soon
                  </span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Reference
        </h2>
        <ul className="space-y-0.5">
          {referenceLinks.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={itemClass(l.href)}>
                {l.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

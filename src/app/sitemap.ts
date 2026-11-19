import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { publishedArticles } from "@/data/articles";
import { tools } from "@/data/tools";
import { wizardTrees } from "@/data/wizards";
import { simScenarios } from "@/data/simulator";
import { kbCategories, kbItemsFor } from "@/data/kb";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/kubernetes",
    "/kubernetes/kubectl-commands",
    "/kubernetes/checklist",
    "/troubleshoot",
    "/troubleshoot/wizard",
    "/simulator",
    "/kb",
    "/resources",
    "/tools",
    "/products/kubernetes-toolkit",
    "/pricing",
    "/blog",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/refund-policy",
  ].map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date(),
  }));

  const articleRoutes = publishedArticles.map((a) => ({
    url: `${siteConfig.url}/kubernetes/${a.slug}`,
    lastModified: new Date(a.lastReviewed),
  }));

  const toolRoutes = tools
    .filter((t) => t.published)
    .map((t) => ({ url: `${siteConfig.url}/tools/${t.slug}` }));

  const wizardRoutes = wizardTrees.map((w) => ({
    url: `${siteConfig.url}/troubleshoot/wizard/${w.slug}`,
  }));

  const simRoutes = simScenarios.map((s) => ({
    url: `${siteConfig.url}/simulator/${s.slug}`,
  }));

  const kbRoutes = kbCategories
    .filter((c) => kbItemsFor(c.slug).length > 0)
    .map((c) => ({ url: `${siteConfig.url}/kb/${c.slug}` }));

  return [
    ...staticRoutes,
    ...articleRoutes,
    ...toolRoutes,
    ...wizardRoutes,
    ...simRoutes,
    ...kbRoutes,
  ];
}

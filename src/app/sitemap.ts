import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { publishedArticles } from "@/data/articles";
import { tools } from "@/data/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/kubernetes",
    "/kubernetes/kubectl-commands",
    "/kubernetes/checklist",
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

  return [...staticRoutes, ...articleRoutes, ...toolRoutes];
}

import type { ComponentType } from "react";

/**
 * Explicit slug → MDX module map. Deliberately static (no dynamic
 * import expressions) so Turbopack can resolve each file at build time
 * and unpublished routes simply don't exist.
 */
export const mdxArticles: Record<
  string,
  () => Promise<{ default: ComponentType }>
> = {
  crashloopbackoff: () => import("../../content/kubernetes/crashloopbackoff.mdx"),
  imagepullbackoff: () => import("../../content/kubernetes/imagepullbackoff.mdx"),
  "node-not-ready": () => import("../../content/kubernetes/node-not-ready.mdx"),
};

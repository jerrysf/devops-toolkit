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
  "pod-pending": () => import("../../content/kubernetes/pod-pending.mdx"),
  oomkilled: () => import("../../content/kubernetes/oomkilled.mdx"),
  "dns-resolution": () => import("../../content/kubernetes/dns-resolution.mdx"),
  "pvc-pending": () => import("../../content/kubernetes/pvc-pending.mdx"),
  "ingress-502": () => import("../../content/kubernetes/ingress-502.mdx"),
  "rbac-forbidden": () => import("../../content/kubernetes/rbac-forbidden.mdx"),
  "rollout-stuck": () => import("../../content/kubernetes/rollout-stuck.mdx"),
};

import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  Clock,
  FileCheck2,
  Gauge,
  Terminal,
} from "lucide-react";

export interface ToolMeta {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  published: boolean;
  /** Shown as a badge on the tool card. */
  tag?: string;
}

export const tools: ToolMeta[] = [
  {
    slug: "manifest-validator",
    title: "Manifest Validator",
    description:
      "Structural validation for Kubernetes manifests — required fields, selector mismatches, deprecated APIs. Multi-document, fully local.",
    icon: FileCheck2,
    published: true,
  },
  {
    slug: "kubectl-builder",
    title: "kubectl Command Builder",
    description:
      "Assemble kubectl commands from structured options — get, describe, logs, exec, rollout, events. Every flag explained, safety clearly marked.",
    icon: Terminal,
    published: true,
  },
  {
    slug: "resource-calculator",
    title: "Resource Calculator",
    description:
      "Sum CPU/memory requests and limits across containers and replicas. Unit conversion and sanity checks included.",
    icon: Gauge,
    published: true,
  },
  {
    slug: "yaml-validator",
    title: "YAML Validator",
    description:
      "Validate and format YAML in your browser. Syntax checking with precise error locations — nothing leaves your machine.",
    icon: Boxes,
    published: true,
  },
  {
    slug: "cron-generator",
    title: "Cron Expression Builder",
    description:
      "Build and validate 5-field cron expressions with plain-English explanations, next run times, and common presets.",
    icon: Clock,
    published: true,
  },
];

export function getTool(slug: string): ToolMeta | undefined {
  return tools.find((t) => t.slug === slug && t.published);
}

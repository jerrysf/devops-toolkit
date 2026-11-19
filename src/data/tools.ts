import type { LucideIcon } from "lucide-react";
import { FileCheck2, Clock } from "lucide-react";

export interface ToolMeta {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  published: boolean;
}

export const tools: ToolMeta[] = [
  {
    slug: "yaml-validator",
    title: "YAML Validator",
    description:
      "Validate and format YAML in your browser. Syntax checking with precise error locations — nothing leaves your machine.",
    icon: FileCheck2,
    published: true,
  },
  {
    slug: "cron-generator",
    title: "Cron Expression Generator",
    description:
      "Build and validate 5-field cron expressions with plain-English explanations, next run times, and common presets.",
    icon: Clock,
    published: true,
  },
];

export function getTool(slug: string): ToolMeta | undefined {
  return tools.find((t) => t.slug === slug && t.published);
}

import type { MDXComponents } from "mdx/types";
import { CodeBlock } from "@/components/code-block";
import { Callout } from "@/components/callout";
import { SafetyBadge } from "@/components/safety-badge";

/**
 * Global MDX component mapping (required by @next/mdx in App Router).
 * Custom tags usable inside .mdx files: <Callout>, <Safety>.
 */
export function useMDXComponents(): MDXComponents {
  return {
    pre: (props) => <CodeBlock {...props} />,
    Callout: (props) => <Callout {...props} />,
    Safety: (props) => <SafetyBadge {...props} />,
  };
}

"use client";

import { isValidElement, useRef } from "react";
import { CopyButton } from "@/components/copy-button";

/**
 * Wraps <pre> output from rehype-pretty-code with a header showing the
 * language and a copy button. Registered as the `pre` component in
 * mdx-components.tsx.
 */
export function CodeBlock({
  children,
  ...props
}: React.ComponentProps<"pre">) {
  const ref = useRef<HTMLPreElement>(null);

  let language = (props as Record<string, unknown>)["data-language"] as
    | string
    | undefined;
  if (!language && isValidElement(children)) {
    const cls = (children.props as { className?: string }).className ?? "";
    language = /language-(\w+)/.exec(cls)?.[1];
  }

  return (
    <div className="group/code relative my-4 overflow-hidden rounded-lg border border-border/60">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0e1830] px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
          {language ?? "text"}
        </span>
        <CopyButton targetRef={ref} />
      </div>
      <pre
        ref={ref}
        className="!my-0 overflow-x-auto p-4 text-[13px] leading-relaxed"
        {...props}
      >
        {children}
      </pre>
    </div>
  );
}

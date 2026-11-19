/**
 * Browser-side YAML validation and formatting via js-yaml.
 *
 * This checks YAML *syntax* only. It does not and cannot validate
 * Kubernetes resource semantics (schema, required fields, API
 * versions) — the UI must say exactly that.
 */

import { loadAll, dump, YAMLException } from "js-yaml";

export interface YamlError {
  message: string;
  line?: number;
  column?: number;
  snippet?: string;
}

export interface YamlResult {
  valid: boolean;
  errors: YamlError[];
  /** Number of documents successfully parsed (multi-doc YAML). */
  documentCount: number;
  /** Canonical re-formatted YAML, when parsing succeeded. */
  formatted?: string;
}

interface JsYamlMark {
  line: number;
  column: number;
  snippet?: string;
}

export function validateYaml(input: string): YamlResult {
  if (input.trim() === "") {
    return { valid: false, errors: [{ message: "Input is empty" }], documentCount: 0 };
  }

  try {
    const docs: unknown[] = [];
    loadAll(input, (doc) => docs.push(doc));
    const formatted = docs
      .map((doc) => (doc === undefined ? "null" : dump(doc, { noRefs: true })))
      .join("---\n");
    return { valid: true, errors: [], documentCount: docs.length, formatted };
  } catch (err) {
    if (err instanceof YAMLException) {
      const mark = (err as InstanceType<typeof YAMLException> & { mark?: JsYamlMark }).mark;
      return {
        valid: false,
        documentCount: 0,
        errors: [
          {
            message: err.reason ?? err.message,
            line: mark ? mark.line + 1 : undefined,
            column: mark ? mark.column + 1 : undefined,
            snippet: mark?.snippet,
          },
        ],
      };
    }
    return {
      valid: false,
      documentCount: 0,
      errors: [{ message: err instanceof Error ? err.message : "Unknown parse error" }],
    };
  }
}

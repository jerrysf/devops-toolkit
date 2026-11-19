import { describe, expect, it } from "vitest";
import { validateYaml } from "@/lib/yaml";

describe("validateYaml", () => {
  it("accepts a valid Kubernetes manifest", () => {
    const r = validateYaml(`apiVersion: v1
kind: Pod
metadata:
  name: web
spec:
  containers:
    - name: web
      image: nginx:1.27
`);
    expect(r.valid).toBe(true);
    expect(r.documentCount).toBe(1);
    expect(r.formatted).toContain("kind: Pod");
  });

  it("accepts multi-document YAML", () => {
    const r = validateYaml(`a: 1
---
b: 2
`);
    expect(r.valid).toBe(true);
    expect(r.documentCount).toBe(2);
  });

  it("rejects tab indentation with line info", () => {
    const r = validateYaml("a:\n\tb: 1\n");
    expect(r.valid).toBe(false);
    expect(r.errors[0].line).toBeGreaterThan(0);
  });

  it("rejects unbalanced structures", () => {
    const r = validateYaml("a: [1, 2\n");
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.errors[0].message).toBeTruthy();
  });

  it("rejects empty input", () => {
    const r = validateYaml("   ");
    expect(r.valid).toBe(false);
    expect(r.errors[0].message).toBe("Input is empty");
  });

  it("reports duplicate keys", () => {
    const r = validateYaml("a: 1\na: 2\n");
    expect(r.valid).toBe(false);
  });
});

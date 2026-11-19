import { describe, expect, it } from "vitest";
import { analyzeManifests } from "@/lib/k8s-manifest";

const GOOD_DEPLOYMENT = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx:1.25
`;

describe("analyzeManifests", () => {
  it("passes a well-formed Deployment", () => {
    const r = analyzeManifests(GOOD_DEPLOYMENT);
    expect(r.syntaxValid).toBe(true);
    expect(r.documentCount).toBe(1);
    expect(r.resources).toEqual([
      { docIndex: 0, apiVersion: "apps/v1", kind: "Deployment", name: "web" },
    ]);
    expect(r.issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });

  it("reports YAML syntax errors with line numbers", () => {
    const r = analyzeManifests("foo: [unclosed\nbar: 1\n");
    expect(r.syntaxValid).toBe(false);
    expect(r.syntaxError?.message).toBeTruthy();
    expect(r.syntaxError?.line).toBeTypeOf("number");
  });

  it("rejects empty input", () => {
    const r = analyzeManifests("   \n");
    expect(r.syntaxValid).toBe(false);
  });

  it("flags missing required fields on a Deployment", () => {
    const r = analyzeManifests(`apiVersion: apps/v1
kind: Deployment
metadata:
  name: broken
spec:
  replicas: 1
`);
    const paths = r.issues.filter((i) => i.severity === "error").map((i) => i.path);
    expect(paths).toContain("spec.selector.matchLabels");
    expect(paths).toContain("spec.template");
  });

  it("flags selector/template label mismatch", () => {
    const r = analyzeManifests(`apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: web
          image: nginx
`);
    expect(
      r.issues.some((i) => i.severity === "error" && i.path === "spec.template.metadata.labels"),
    ).toBe(true);
  });

  it("flags deprecated apiVersions", () => {
    const r = analyzeManifests(`apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  name: old
spec: {}
`);
    expect(
      r.issues.some(
        (i) => i.severity === "warning" && i.message.includes("removed"),
      ),
    ).toBe(true);
  });

  it("warns on kind/apiVersion mismatch", () => {
    const r = analyzeManifests(`apiVersion: v1
kind: Deployment
metadata:
  name: wrong
`);
    expect(
      r.issues.some(
        (i) => i.severity === "warning" && i.message.includes("apps/v1"),
      ),
    ).toBe(true);
  });

  it("flags containers missing name or image", () => {
    const r = analyzeManifests(`apiVersion: v1
kind: Pod
metadata:
  name: p
spec:
  containers:
    - name: ok
      image: nginx
    - name: noimg
`);
    const messages = r.issues.filter((i) => i.severity === "error").map((i) => i.message);
    expect(messages.some((m) => m.includes("image"))).toBe(true);
  });

  it("handles multi-document input", () => {
    const r = analyzeManifests(`apiVersion: v1
kind: ConfigMap
metadata:
  name: cfg
data:
  k: v
---
apiVersion: v1
kind: Service
metadata:
  name: svc
spec:
  ports: []
`);
    expect(r.documentCount).toBe(2);
    expect(r.resources).toHaveLength(2);
    // Service with empty ports array → error
    expect(
      r.issues.some((i) => i.docIndex === 1 && i.severity === "error" && i.path === "spec.ports"),
    ).toBe(true);
  });

  it("flags missing metadata.name", () => {
    const r = analyzeManifests(`apiVersion: v1
kind: ConfigMap
metadata: {}
`);
    expect(
      r.issues.some((i) => i.severity === "error" && i.path === "metadata.name"),
    ).toBe(true);
  });

  it("treats non-K8s documents as info, not errors", () => {
    const r = analyzeManifests(`key: value
list:
  - a
`);
    expect(r.syntaxValid).toBe(true);
    // apiVersion + kind + metadata.name all missing → 3 errors
    expect(r.issues.filter((i) => i.severity === "error")).toHaveLength(3);
    expect(r.issues.some((i) => i.severity === "info")).toBe(true);
  });

  it("notes unknown kinds as info (possibly CRDs)", () => {
    const r = analyzeManifests(`apiVersion: example.io/v1
kind: Widget
metadata:
  name: w
spec:
  size: large
`);
    expect(r.issues.filter((i) => i.severity === "error")).toHaveLength(0);
    expect(r.issues.some((i) => i.severity === "info" && i.message.includes("Widget"))).toBe(true);
  });
});

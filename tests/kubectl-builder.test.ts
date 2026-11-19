import { describe, expect, it } from "vitest";
import { buildKubectl } from "@/lib/kubectl-builder";

describe("buildKubectl", () => {
  it("builds a simple get", () => {
    const r = buildKubectl({ action: "get", resource: "pods" });
    expect(r.command).toBe("kubectl get pods");
    expect(r.safety).toBe("readonly");
  });

  it("builds get with name, namespace, selector, output", () => {
    const r = buildKubectl({
      action: "get",
      resource: "deployments",
      name: "web",
      namespace: "prod",
      selector: "app=web",
      output: "wide",
    });
    expect(r.command).toBe(
      "kubectl get deployments/web -n prod -l app=web -o wide",
    );
  });

  it("uses -A instead of -n for all namespaces", () => {
    const r = buildKubectl({
      action: "get",
      resource: "pods",
      allNamespaces: true,
      namespace: "prod", // ignored
    });
    expect(r.command).toBe("kubectl get pods -A");
    expect(r.command).not.toContain("-n prod");
  });

  it("builds logs with previous + container + tail", () => {
    const r = buildKubectl({
      action: "logs",
      resource: "pods",
      name: "web-123",
      namespace: "prod",
      container: "app",
      previous: true,
      tail: 50,
    });
    expect(r.command).toBe(
      "kubectl logs pods/web-123 -n prod -c app --previous --tail=50",
    );
  });

  it("builds exec with interactive flag and command", () => {
    const r = buildKubectl({
      action: "exec",
      resource: "pods",
      name: "web-123",
      interactive: true,
      execCommand: "sh",
    });
    expect(r.command).toBe("kubectl exec web-123 -it -- sh");
    expect(r.safety).toBe("modify");
  });

  it("marks rollout-restart as modifying", () => {
    const r = buildKubectl({
      action: "rollout-restart",
      resource: "deployments",
      name: "web",
      namespace: "prod",
    });
    expect(r.command).toBe("kubectl rollout restart deployments/web -n prod");
    expect(r.safety).toBe("modify");
  });

  it("marks rollout-status as readonly", () => {
    const r = buildKubectl({
      action: "rollout-status",
      resource: "deployments",
      name: "web",
    });
    expect(r.command).toBe("kubectl rollout status deployments/web");
    expect(r.safety).toBe("readonly");
  });

  it("builds events command with field selector", () => {
    const r = buildKubectl({
      action: "events",
      resource: "events",
      namespace: "prod",
      selector: "web-123",
    });
    expect(r.command).toBe(
      "kubectl get events -n prod --field-selector involvedObject.name=web-123 --sort-by=.lastTimestamp",
    );
    expect(r.safety).toBe("readonly");
  });

  it("builds describe with type/name", () => {
    const r = buildKubectl({
      action: "describe",
      resource: "nodes",
      name: "node-1",
    });
    expect(r.command).toBe("kubectl describe nodes/node-1");
  });

  it("every part contributes to the command string", () => {
    const r = buildKubectl({
      action: "logs",
      resource: "deployments",
      name: "web",
      namespace: "prod",
      tail: 100,
      follow: true,
    });
    expect(r.command).toBe(r.parts.map((p) => p.text).join(" "));
    expect(r.command).toContain("-f");
  });
});

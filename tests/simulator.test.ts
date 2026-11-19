import { describe, expect, it } from "vitest";
import { execute, parseCommand, tokenize } from "@/lib/simulator";
import { simScenarios } from "@/data/simulator";

const cluster = simScenarios[0].cluster; // crashloopbackoff

function run(raw: string, c = cluster) {
  return execute(parseCommand(raw), c);
}

describe("tokenize", () => {
  it("splits on whitespace and respects quotes", () => {
    expect(tokenize("kubectl logs foo --tail=5")).toEqual([
      "kubectl", "logs", "foo", "--tail=5",
    ]);
    // Shell concatenates mid-token quotes: jsonpath='{...}' → one token
    expect(tokenize(`kubectl get pods -o jsonpath='{.items[0]}'`)).toEqual([
      "kubectl", "get", "pods", "-o", "jsonpath={.items[0]}",
    ]);
  });
});

describe("parseCommand", () => {
  it("parses get with resource/name", () => {
    const p = parseCommand("kubectl get pods/web-1 -n prod -o wide");
    expect(p.kind).toBe("get");
    expect(p.resource).toBe("pods");
    expect(p.name).toBe("web-1");
    expect(p.namespace).toBe("prod");
    expect(p.output).toBe("wide");
  });

  it("defaults namespace to default", () => {
    expect(parseCommand("kubectl get pods").namespace).toBe("default");
  });

  it("handles -A flag", () => {
    const p = parseCommand("kubectl get pods -A");
    expect(p.allNamespaces).toBe(true);
  });

  it("parses type/name split", () => {
    const p = parseCommand("kubectl describe deploy/web");
    expect(p.resource).toBe("deploy");
    expect(p.name).toBe("web");
  });

  it("parses logs flags", () => {
    const p = parseCommand("kubectl logs web -c app --previous --tail=50");
    expect(p.kind).toBe("logs");
    expect(p.container).toBe("app");
    expect(p.previous).toBe(true);
    expect(p.tail).toBe(50);
  });

  it("rejects non-kubectl commands", () => {
    expect(parseCommand("rm -rf /").kind).toBe("error");
    expect(parseCommand("curl example.com").kind).toBe("error");
  });

  it("marks write verbs as unsupported-write", () => {
    for (const v of ["delete", "apply", "edit", "scale", "drain"]) {
      expect(parseCommand(`kubectl ${v} pods x`).kind).toBe("unsupported-write");
    }
  });

  it("rejects streaming flags", () => {
    expect(parseCommand("kubectl logs x -f").kind).toBe("unsupported");
    expect(parseCommand("kubectl get pods -w").kind).toBe("unsupported");
  });

  it("rejects exec/port-forward", () => {
    expect(parseCommand("kubectl exec -it x -- sh").kind).toBe("unsupported");
    expect(parseCommand("kubectl port-forward x 8080").kind).toBe("unsupported");
  });

  it("accepts k alias", () => {
    expect(parseCommand("k get pods").kind).toBe("get");
  });
});

describe("execute", () => {
  it("get pods returns a table", () => {
    const out = run("kubectl get pods");
    expect(out).toContain("NAME");
    expect(out).toContain("READY");
    expect(out).toContain("payments-7d9c4f-2xklp");
    expect(out).toContain("CrashLoopBackOff");
  });

  it("get pods <name> returns single row", () => {
    const out = run("kubectl get pods payments-7d9c4f-2xklp");
    expect(out).toContain("payments-7d9c4f-2xklp");
    expect(out).not.toContain("payments-7d9c4f-9mqwt");
  });

  it("get pods <missing> → NotFound", () => {
    expect(run("kubectl get pods nope")).toContain("NotFound");
  });

  it("respects namespace", () => {
    expect(run("kubectl get pods -n kube-system")).toContain("No resources found");
    expect(run("kubectl get pods -A")).toContain("payments");
  });

  it("describe pod shows state + events", () => {
    const out = run("kubectl describe pod payments-7d9c4f-2xklp");
    expect(out).toContain("CrashLoopBackOff");
    expect(out).toContain("Exit Code: 1".replace("E", "E")); // contains exit code line
    expect(out).toContain("Back-off restarting failed container");
  });

  it("logs returns current logs", () => {
    const out = run("kubectl logs payments-7d9c4f-2xklp");
    expect(out).toContain("PAYMENTS_API_KEY");
  });

  it("logs --previous returns previous logs", () => {
    const out = run("kubectl logs payments-7d9c4f-2xklp --previous");
    expect(out).toContain("FATAL");
  });

  it("logs --tail truncates", () => {
    const out = run("kubectl logs payments-7d9c4f-2xklp --tail=1");
    expect(out.split("\n")).toHaveLength(1);
  });

  it("logs bad container name → BadRequest", () => {
    expect(run("kubectl logs payments-7d9c4f-2xklp -c nope")).toContain("BadRequest");
  });

  it("write commands are rejected with explanation", () => {
    const out = run("kubectl delete pod payments-7d9c4f-2xklp");
    expect(out).toContain("read-only");
  });

  it("get nodes works", () => {
    const out = run("kubectl get nodes");
    expect(out).toContain("node-1");
    expect(out).toContain("Ready");
  });

  it("unknown resource type errors like kubectl", () => {
    expect(run("kubectl get frobnicate")).toContain("doesn't have a resource type");
  });

  it("secrets generic resources work", () => {
    const out = run("kubectl get secrets");
    expect(out).toContain("payments-api-key");
    const d = run("kubectl describe secret payments-api-key");
    expect(d).toContain("0 keys");
  });

  it("top pod/nodes work", () => {
    expect(run("kubectl top nodes")).toContain("node-1");
  });
});

describe("scenario data integrity", () => {
  it("every scenario has 1+ correct diagnosis and ≥3 hints", () => {
    for (const s of simScenarios) {
      expect(s.diagnosis.filter((d) => d.correct).length).toBeGreaterThanOrEqual(1);
      expect(s.hints.length).toBeGreaterThanOrEqual(3);
      expect(s.cluster.pods.length + s.cluster.nodes.length).toBeGreaterThan(0);
    }
  });

  it("every scenario slugs are unique", () => {
    const slugs = simScenarios.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

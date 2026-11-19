import { describe, expect, it } from "vitest";
import { stepAt, validateTree } from "@/lib/wizard";
import { wizardTrees } from "@/data/wizards";

describe("wizard tree integrity", () => {
  it.each(wizardTrees.map((t) => [t.slug, t] as const))(
    "%s: all option targets exist",
    (_slug, tree) => {
      expect(validateTree(tree)).toEqual([]);
    },
  );

  it.each(wizardTrees.map((t) => [t.slug, t] as const))(
    "%s: every node is reachable, no cycles, paths terminate in results",
    (_slug, tree) => {
      // Walk every path. Diamonds (same node via different paths) are
      // fine; a node revisited WITHIN one path is a cycle.
      const reached = new Set<string>();
      const finished = new Set<string>();
      const queue: { hops: { nodeId: string; optionIndex: number }[] }[] = [
        { hops: [] },
      ];
      while (queue.length > 0) {
        const { hops } = queue.shift()!;
        const step = stepAt(tree, hops);
        if (step.kind === "result") {
          finished.add(step.result.id);
          continue;
        }
        reached.add(step.node.id);
        const idsInPath = hops.map((h) => h.nodeId);
        step.node.options.forEach((_, optionIndex) => {
          expect(idsInPath).not.toContain(step.node.id);
          queue.push({ hops: [...hops, { nodeId: step.node.id, optionIndex }] });
        });
      }
      expect(reached.size).toBe(Object.keys(tree.nodes).length);
    },
  );
});

describe("stepAt traversal", () => {
  const tree = wizardTrees.find((t) => t.slug === "crashloopbackoff")!;

  it("starts at the first question", () => {
    const step = stepAt(tree, []);
    expect(step.kind).toBe("question");
    if (step.kind === "question") {
      expect(step.node.id).toBe(tree.start);
      expect(step.depth).toBe(0);
    }
  });

  it("follows answers to the OOM result", () => {
    // q-restarting option 0 → q-exitcode, option 0 → r-oom
    const step = stepAt(tree, [
      { nodeId: "q-restarting", optionIndex: 0 },
      { nodeId: "q-exitcode", optionIndex: 0 },
    ]);
    expect(step.kind).toBe("result");
    if (step.kind === "result") {
      expect(step.result.id).toBe("r-oom");
      expect(step.result.commands.length).toBeGreaterThan(0);
      expect(step.result.commands.every((c) => c.safety)).toBe(true);
    }
  });

  it("reaches probe result via app-logs path", () => {
    const step = stepAt(tree, [
      { nodeId: "q-restarting", optionIndex: 0 },
      { nodeId: "q-exitcode", optionIndex: 1 }, // exit 1
      { nodeId: "q-app-logs", optionIndex: 2 }, // logs healthy
      { nodeId: "q-probes", optionIndex: 0 },   // probe failures
    ]);
    expect(step.kind).toBe("result");
    if (step.kind === "result") expect(step.result.id).toBe("r-probe");
  });

  it("rejects invalid paths", () => {
    expect(() => stepAt(tree, [{ nodeId: "q-exitcode", optionIndex: 0 }])).toThrow();
    expect(() =>
      stepAt(tree, [{ nodeId: "q-restarting", optionIndex: 99 }]),
    ).toThrow();
  });

  it("all results have commands with valid safety levels", () => {
    for (const t of wizardTrees) {
      for (const r of Object.values(t.results)) {
        expect(r.title.length).toBeGreaterThan(0);
        for (const c of r.commands) {
          expect(["readonly", "modify", "destructive"]).toContain(c.safety);
          expect(c.command.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

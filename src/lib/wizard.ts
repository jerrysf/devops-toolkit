/**
 * Guided Troubleshooting Wizard — pure tree logic.
 *
 * A wizard is a decision tree of question nodes ending in result nodes.
 * The engine is deliberately stateless: the UI keeps a history of node
 * ids so Back/Restart are trivial and every step is testable.
 *
 * This is a decision-SUPPORT tool. It guides users toward relevant
 * diagnostics — it cannot inspect a real cluster.
 */

export interface WizardOption {
  label: string;
  /** Node id of the next question, or a key into `results`. */
  next: string;
}

export interface WizardQuestion {
  id: string;
  question: string;
  /** Optional guidance on how to determine the answer. */
  hint?: string;
  options: WizardOption[];
}

export interface WizardCommand {
  command: string;
  description: string;
  safety: "readonly" | "modify" | "destructive";
}

export interface WizardResult {
  id: string;
  title: string;
  /** What this diagnosis means and why the answers point here. */
  explanation: string;
  /** Confidence phrasing — always honest, e.g. "most likely". */
  confidence: "high" | "medium" | "low";
  commands: WizardCommand[];
  /** Slug of the full troubleshooting guide, when one exists. */
  guideSlug?: string;
  /** When the result is a hypothesis, what to check next. */
  nextSteps?: string;
}

export interface WizardTree {
  slug: string;
  title: string;
  description: string;
  /** Id of the first question node. */
  start: string;
  nodes: Record<string, WizardQuestion>;
  results: Record<string, WizardResult>;
}

export type WizardStep =
  | { kind: "question"; node: WizardQuestion; depth: number }
  | { kind: "result"; result: WizardResult; depth: number };

/** Integrity check: every option target must exist; used by tests. */
export function validateTree(tree: WizardTree): string[] {
  const problems: string[] = [];
  if (!tree.nodes[tree.start]) {
    problems.push(`start node "${tree.start}" missing`);
  }
  for (const node of Object.values(tree.nodes)) {
    for (const opt of node.options) {
      if (!tree.nodes[opt.next] && !tree.results[opt.next]) {
        problems.push(`node "${node.id}" option "${opt.label}" → missing target "${opt.next}"`);
      }
    }
    if (node.options.length === 0) {
      problems.push(`node "${node.id}" has no options`);
    }
  }
  return problems;
}

/**
 * Resolve the step at a given history path. History is the list of node
 * ids visited; the last entry is the current node unless it resolved to
 * a result, which is stored as `result:<id>` in the UI — this function
 * instead takes a path of node ids plus the chosen option indices.
 */
export function stepAt(
  tree: WizardTree,
  path: { nodeId: string; optionIndex: number }[],
): WizardStep {
  let nodeId = tree.start;
  let depth = 0;

  for (const hop of path) {
    const node = tree.nodes[nodeId];
    if (!node || node.id !== hop.nodeId) {
      throw new Error(`Invalid wizard path at depth ${depth}`);
    }
    const opt = node.options[hop.optionIndex];
    if (!opt) throw new Error(`Invalid option ${hop.optionIndex} at "${nodeId}"`);
    nodeId = opt.next;
    depth++;
  }

  const result = tree.results[nodeId];
  if (result) return { kind: "result", result, depth };
  const node = tree.nodes[nodeId];
  if (!node) throw new Error(`Unknown wizard node "${nodeId}"`);
  return { kind: "question", node, depth };
}

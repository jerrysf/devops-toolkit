/**
 * HPA helper — explains autoscaling/v2 semantics and computes the
 * basic scaling math. Estimates only, clearly labeled.
 */

export interface HpaInput {
  targetUtilization: number; // percent
  cpuRequestM: number; // millicores per pod
  observedAvgM: number; // observed average millicores
  observedPeakM: number;
  minReplicas: number;
  maxReplicas: number;
}

export interface HpaOutput {
  currentUtilization: number | null;
  desiredReplicasNow: number;
  desiredReplicasPeak: number;
  effectiveCpuPerPodM: number;
  warnings: string[];
  explanations: string[];
  yaml: string;
}

export function calcHpa(input: HpaInput): HpaOutput {
  const warnings: string[] = [];
  const explanations: string[] = [];
  const { targetUtilization, cpuRequestM, observedAvgM, observedPeakM, minReplicas, maxReplicas } = input;

  if (cpuRequestM <= 0) {
    warnings.push("CPU request must be > 0 — the HPA computes utilization against requests, not usage.");
  }
  if (targetUtilization <= 0 || targetUtilization > 100) {
    warnings.push("Target utilization should be between 1 and 100.");
  }
  if (minReplicas < 1) warnings.push("minReplicas should be ≥1 (0 is allowed but scales to zero).");
  if (maxReplicas < minReplicas) warnings.push("maxReplicas must be ≥ minReplicas.");
  if (observedAvgM > cpuRequestM) {
    warnings.push(`Observed avg usage (${observedAvgM}m) already exceeds the request (${cpuRequestM}m) — utilization is >100%; raise the request before tuning the HPA.`);
  }

  const currentUtilization =
    cpuRequestM > 0 ? Math.round((observedAvgM / cpuRequestM) * 100) : null;
  // HPA formula: desired = ceil(currentReplicas × currentUtil / targetUtil)
  // For planning we model replicas needed so each pod sits at targetUtil.
  const effectivePerPod = cpuRequestM * (targetUtilization / 100);
  const desiredNow = Math.max(
    minReplicas,
    Math.min(maxReplicas, Math.ceil(observedAvgM / Math.max(1, effectivePerPod))),
  );
  const desiredPeak = Math.max(
    minReplicas,
    Math.min(maxReplicas, Math.ceil(observedPeakM / Math.max(1, effectivePerPod))),
  );

  explanations.push(
    `At ${targetUtilization}% target, each pod "costs" ${Math.round(effectivePerPod)}m of measured CPU before the HPA adds another.`,
    `Model says ~${desiredNow} replicas for your average load, ~${desiredPeak} for the observed peak — set maxReplicas with the peak in mind.`,
    "These are arithmetic estimates. Real sizing needs workload metrics over time — scale-up lag, burst patterns, and non-CPU bottlenecks (memory, connections, queues) aren't modeled.",
  );
  if (desiredPeak >= maxReplicas) {
    warnings.push(`Your observed peak needs ~${desiredPeak} replicas but maxReplicas is ${maxReplicas} — the HPA will saturate during peaks.`);
  }

  const yaml = `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: example-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: example-deployment
  minReplicas: ${minReplicas}
  maxReplicas: ${maxReplicas}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: ${targetUtilization}
`;

  return {
    currentUtilization,
    desiredReplicasNow: desiredNow,
    desiredReplicasPeak: desiredPeak,
    effectiveCpuPerPodM: effectivePerPod,
    warnings,
    explanations,
    yaml,
  };
}

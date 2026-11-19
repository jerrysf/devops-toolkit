# Runbook: Pod Stuck in Pending

Severity: high · Blast radius: one workload to cluster-wide capacity ·
Typical MTTR: 10–30 min

A Pending pod was accepted by the API server but never started — the
scheduler can't place it on any node. Unlike crash failures, nothing is
"broken" in the workload itself: it's a capacity or constraint problem.

## Symptoms

- `kubectl get pods` shows `STATUS: Pending`, `RESTARTS: 0`, and `-o wide`
  shows no NODE assigned.
- Pods stay Pending for minutes+; new replicas never become Ready.
- Deployment shows `N-1/N` ready with the unscheduled pod stuck.

## Ranked causes (most common first)

1. **Insufficient node resources** — pod requests more CPU/memory than
   any node has free. The scheduler is honest about this in events.
2. **Untolerated taints** — control-plane `NoSchedule` taint, dedicated
   node pools, or taints added by ops that the pod doesn't tolerate.
3. **Node selector / affinity with no matching nodes** — labels the
   scheduler can't satisfy (wrong key, AZ that doesn't exist, GPU label
   on a CPU-only pool).
4. **Unbound PVC** — `pod has unbound immediate PersistentVolumeClaims`;
   the volume can't be provisioned or doesn't exist.
5. **Namespace ResourceQuota** — quota full; note this usually rejects at
   admission with `forbidden: exceeded quota` before Pending even appears.
6. **Scheduler itself unhealthy** — rare; check if ANY pods schedule
   cluster-wide.

## Diagnostic workflow

### Step 1 — Read the scheduling failure [READ-ONLY]

    kubectl describe pod <pod> -n <ns>

Scroll to **Events** — `FailedScheduling` tells you exactly why, and
often lists per-node reasons:

    0/3 nodes are available: 1 Insufficient cpu, 1 Insufficient memory,
    1 node(s) had untolerated taint {dedicated=batch:NoSchedule}.

Each node's reason is listed separately — a pod must clear ALL of them
on ONE node.

### Step 2 — Check what the pod asks for [READ-ONLY]

    kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.containers[*].resources}{"\n"}{.spec.nodeSelector}{"\n"}{.spec.tolerations}'

Compare requests against what nodes can offer:

    kubectl describe node <node> | grep -A6 "Allocated resources"

### Step 3 — Check PVC binding if volumes are involved [READ-ONLY]

    kubectl get pvc -n <ns>

`Pending` PVC = provisioner can't satisfy it (no StorageClass, no
capacity, wrong access mode).

### Step 4 — Check quota [READ-ONLY]

    kubectl get resourcequota -n <ns>
    kubectl describe resourcequota -n <ns>

### Step 5 — Verify the scheduler works at all [READ-ONLY]

    kubectl get pods -n kube-system | grep scheduler

## Root cause identification

| Event text | Root cause |
|---|---|
| `Insufficient cpu` / `Insufficient memory` | Requests exceed free capacity |
| `untolerated taint` | Taints without matching tolerations |
| `didn't match Pod's node affinity/selector` | Selector names a label no node has |
| `unbound immediate PersistentVolumeClaims` | PVC stuck Pending |
| `exceeded quota` at admission | ResourceQuota full |

## Safe resolution

- **Insufficient resources:** right-size requests down (if inflated), or
  add capacity. Check actual usage with `kubectl top pod` on siblings —
  requests are often 3–5x observed use.
- **Taints:** add the correct toleration ONLY if the workload belongs on
  those nodes. Don't tolerate control-plane taints to fix scheduling —
  that's masking a capacity problem.
- **Node selector:** fix the selector to match a real label, or label a
  node: `kubectl label node <node> <key>=<value>` [MODIFYING].
- **PVC:** fix the PVC spec or the StorageClass; a bound PVC lets the
  pod schedule immediately.
- **Quota:** raise the quota or delete idle workloads — confirm with the
  namespace owner first.

## Verification

    kubectl get pod <pod> -n <ns> -o wide    # STATUS: Running, NODE assigned
    kubectl get events -n <ns> --sort-by=.lastTimestamp | tail -5
    # Normal  Scheduled  Successfully assigned <ns>/<pod> to <node>

## Prevention

- Set requests from measured usage, not guesses — oversized requests are
  the #1 cause of Pending in busy clusters.
- Use PodDisruptionBudgets + cluster autoscaler so capacity follows demand.
- Add a `kubectl describe` check for Pending pods to your deploy pipeline
  — a rollout that produces Pending pods should fail fast.

## Tested / validated

- Commands verified by static review against Kubernetes 1.28–1.34 output
  formats; `FailedScheduling` message strings checked against upstream
  scheduler source (v1.31).
- Known limitation: scheduler error text varies slightly across minor
  versions; match on keywords, not exact strings.

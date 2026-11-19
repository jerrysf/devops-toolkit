# Runbook: OOMKilled

Severity: high · Blast radius: single container to workload availability ·
Typical MTTR: 15–45 min

OOMKilled means the container exceeded its memory limit and the kernel's
OOM killer terminated it — exit code 137. The restart pattern looks like
CrashLoopBackOff, but the cause is memory pressure, not app logic.

## Symptoms

- Pod cycles `Running` → `OOMKilled` → restart, or shows `OOMKilled` as
  the last state in `describe`.
- Exit code 137 (= 128 + SIGKILL 9).
- App works under light load, dies under traffic or during a specific
  operation (batch job, large file, cache warmup).

## Ranked causes

1. **Memory limit set below real usage** — the app needs more than the
   limit; the limit is doing its job.
2. **Memory leak** — usage climbs steadily until the limit, restarts
   reset it, repeat. Characteristic sawtooth on metrics.
3. **Limit set but request wildly wrong** — pod lands on a node without
   enough real memory; node-level pressure can also kill containers.
4. **Language runtime heap larger than the limit** — JVM/Node defaults
   don't respect cgroup limits on old versions; heap + native memory
   exceeds the limit.
5. **Sidecar/container summing** — multiple containers in the pod each
   under their own limit but jointly exhausting node memory.

## Diagnostic workflow

### Step 1 — Confirm it's really OOM [READ-ONLY]

    kubectl describe pod <pod> -n <ns>

Look for:

    State:          Waiting
    Reason:         CrashLoopBackOff
    Last State:     Terminated
    Reason:         OOMKilled
    Exit Code:      137

`OOMKilled` + 137 is definitive. `Error` + 1 is an app crash, not OOM.

### Step 2 — Check the configured limit vs. observed usage [READ-ONLY]

    kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.containers[*].resources.limits.memory}'
    kubectl top pod <pod> -n <ns> --containers

If `top` shows usage near the limit before death → genuine demand.
If usage was low → sudden spike (leak, batch operation).

### Step 3 — Check the crash pattern over time [READ-ONLY]

    kubectl get pod <pod> -n <ns> -o jsonpath='{.status.containerStatuses[*].restartCount}'

High restart count + periodic crashes = leak. First crash after a
deploy/config change = new demand.

### Step 4 — Check logs just before death [READ-ONLY]

    kubectl logs <pod> -n <ns> --previous --tail=50

OOM kills are abrupt — logs may end mid-line with no error. A clean
`OutOfMemoryError` (Java) or `heap out of memory` (Node) confirms the
runtime hit its own limit first — set runtime flags, not just cgroup.

## Root cause identification

| Evidence | Root cause |
|---|---|
| Steady memory growth over hours | Leak — raising the limit delays, doesn't fix |
| Dies under load at the same threshold | Limit below real peak demand |
| JVM/Node heap error in logs | Runtime limit < container limit — fix flags |
| Node has MemoryPressure + many victims | Node-level exhaustion, not just this pod |

## Safe resolution

- **Under-provisioned limit:** raise `resources.limits.memory` to observed
  peak + ~25% headroom [MODIFYING]. Keep `requests` at typical usage —
  requests schedule, limits kill.
- **Leak:** raising the limit is a stopgap; profile the app
  (heap dump, pprof). Note the restart pattern in the incident timeline.
- **Runtime mismatch:** for JVM, set `-XX:MaxRAMPercentage=75` (JDK 10+)
  or explicit `-Xmx` ≈ 75% of the limit; for Node, `--max-old-space-size`.
- **Node pressure:** reduce limits across noisy neighbors or move the
  workload — `kubectl describe node` shows MemoryPressure conditions.

## Verification

    watch kubectl get pod <pod> -n <ns>     # restarts stop incrementing
    kubectl top pod <pod> -n <ns>           # usage stable below limit
    kubectl describe pod <pod> -n <ns> | grep "Last State"   # not OOMKilled

## Prevention

- Always set both request AND limit; a pod with no memory limit is a
  node-killer under load.
- Alert on restart count and on memory usage >80% of limit — OOM is
  visible before it kills.
- Load-test with representative memory profiles before launch; sizing
  by guess is how most OOMKilled incidents are born.
- For JVM workloads, container-aware flags are non-optional.

## Tested / validated

- Commands verified by static review against Kubernetes 1.28–1.34;
  exit-code semantics (137 = 128+9) per POSIX convention.
- Known limitation: `kubectl top` requires metrics-server; without it,
  use `kubectl describe node` allocatable/allocated output instead.

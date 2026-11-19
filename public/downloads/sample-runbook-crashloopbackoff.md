---
title: CrashLoopBackOff
severity: high
time_to_resolve: 5–30 min
safety: contains destructive operations (flagged)
---

# Runbook: CrashLoopBackOff

## Detection

- `kubectl get pods` shows `CrashLoopBackOff` with rising `RESTARTS`.
- Alert: `increase(kube_pod_container_status_restarts_total[15m]) > 0`.

## Immediate actions

1. **[read-only]** `kubectl describe pod <pod> -n <ns>` — read Events.
2. **[read-only]** `kubectl logs <pod> -n <ns> --previous` — last crash's logs.
3. **[read-only]** `kubectl get pod <pod> -n <ns> -o jsonpath='{.status.containerStatuses[*].lastState}'` — exit code.

## Exit-code decision table

| Code | Meaning | Go to |
|------|---------|-------|
| 0 | Clean exit, wrong workload type | §A |
| 1 | App error | §B |
| 126 | Not executable | §C |
| 127 | Command not found | §C |
| 137 | OOMKilled / SIGKILL | §D |
| 139 | Segfault | §E |
| 143 | SIGTERM | §F |

## §A — exit 0: process completes, restarts forever

A Deployment has `restartPolicy: Always`. A process that finishes exits 0
and is restarted. Fix: make it long-running, or move it to a `Job` /
`CronJob`.

## §B — exit 1: application error

Read `--previous` logs. Missing env/config is the top cause:

- Check every `env`/`valueFrom` key exists: `kubectl get configmap,secret -n <ns>`
- Fix the reference or create the object, then:
- **[modify]** `kubectl rollout restart deploy/<name> -n <ns>`

## §C — exit 126/127: bad entrypoint

Verify `command`/`args` against the image. Run locally:
`docker run --rm <image>` or inspect `docker image inspect <image>` entrypoint.

## §D — exit 137: OOMKilled

Check `lastState.terminated.reason == OOMKilled`. Raise the memory limit or
find the leak (see OOMKilled runbook).

## §E — exit 139: segfault

Usually an application bug or architecture mismatch (amd64 image on arm64
node). Check `kubectl get node <node> -o jsonpath='{.status.nodeInfo.architecture}'`.

## §F — exit 143: SIGTERM

Probe killed the container, or pod was evicted. For slow apps replace
`livenessProbe` with `startupProbe` (see examples/startup-probe.yaml).

## Escalate when

- Exit code doesn't match any row and logs are empty → check
  `kubectl get events` for `FailedCreate`/`FailedMount`.
- Multiple unrelated pods crash-loop on the same node → node problem, see
  Node NotReady runbook.

## ⚠️ Destructive operations in this runbook

- `kubectl delete pod` — only after the root cause is fixed; it restarts
  the symptom otherwise.
- `kubectl rollout undo` — reverts to a previous revision; confirm the
  target revision is actually healthy.

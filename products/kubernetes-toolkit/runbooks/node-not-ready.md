---
title: Node NotReady
severity: critical
time_to_resolve: 10–60 min
safety: contains destructive operations (flagged)
---

# Runbook: Node NotReady

## Detection

- `kubectl get nodes` → `NotReady`.
- Pods on the node `Unknown`/`Terminating`; possible `Pending` elsewhere.

## Diagnosis

1. **[read-only]** `kubectl describe node <node>` — Conditions table:
   - `DiskPressure=True` → §A
   - `MemoryPressure=True` → §B
   - `PIDPressure=True` → §C
   - `Ready=False` `KubeletNotReady` → §D
   - `NetworkReady=false` → §E
2. **[read-only]** `kubectl get pods -A -o wide --field-selector spec.nodeName=<node>` — blast radius.
3. **On the node** (SSH/console — outside K8s RBAC):
   - `sudo systemctl status kubelet`
   - `sudo journalctl -u kubelet -n 200 --no-pager`
   - `df -h` / `free -m` / `dmesg | grep -i oom`
4. **Cloud check** — does the underlying VM still exist?

## §A — DiskPressure

Find consumers: `sudo du -xh /var/lib/containerd /var/log /var/lib/kubelet | sort -h | tail -20`.
Free space; kubelet re-evaluates automatically.

## §B — MemoryPressure

Find the consumer: `kubectl top pod -A --sort-by=memory`.
Fix: bound the pod's limits; consider dedicated node for offenders.

## §C — PIDPressure

Rare; a fork-bombing pod. Identify and constrain with pod-level PID limits.

## §D — Kubelet down

`sudo systemctl restart kubelet`, then read the journal for *why* it
stopped (cert expiry, failed dependency, OOM). Restart without reading the
journal and it will crash again.

## §E — Network/CNI

CNI DaemonSet unhealthy on the node, or runtime network init failure.
Check `systemctl status containerd` and CNI agent logs.

## Node replacement (planned)

1. **[destructive]** `kubectl drain <node> --ignore-daemonsets --delete-emptydir-data`
   — honors PodDisruptionBudgets; `--delete-emptydir-data` permanently
   deletes emptyDir contents.
2. Replace/repair the node.
3. **[modify]** `kubectl uncordon <node>` when healthy again.

## Stale node object (VM gone, object remains)

- **[modify]** `kubectl delete node <node>` — removes the API object only;
  provisioner adds a replacement if needed.

## Escalate when

- Multiple nodes NotReady simultaneously → control plane or cloud-level
  event; check provider status before draining anything.

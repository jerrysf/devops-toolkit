---
title: ImagePullBackOff / ErrImagePull
severity: medium
time_to_resolve: 5–20 min
safety: read-only diagnostics; modifying fixes flagged
---

# Runbook: ImagePullBackOff

## Detection

- Pod stuck in `ErrImagePull` / `ImagePullBackOff`, never `Running`.
- Events: `Failed to pull image`.

## Decision tree

1. **[read-only]** `kubectl describe pod <pod> -n <ns>` → match the error:
   - `not found` / `manifest unknown` → bad name/tag → §A
   - `pull access denied` / `401` / `403` → auth → §B
   - `toomanyrequests` → rate limit → §C
   - `dial tcp` / `lookup` / `timeout` → node network → §D
2. **[read-only]** `kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.imagePullSecrets}'` — is a secret referenced?
3. **[read-only]** `kubectl get secrets -n <ns> --field-selector type=kubernetes.io/dockerconfigjson` — does it exist **in this namespace**?

## §A — Bad name/tag

- Verify existence: `docker manifest inspect <image>:<tag>` (or `crane manifest`).
- **[modify]** `kubectl set image deploy/<name> <container>=<correct-image> -n <ns>`

## §B — Missing/invalid credentials

- **[modify]** Create the pull secret:
  `kubectl create secret docker-registry regcred --docker-server=<registry> --docker-username=<user> --docker-password=<token> -n <ns>`
- Reference via `spec.template.spec.imagePullSecrets` or the namespace's
  ServiceAccount.
- Use read-only registry credentials only. Prefer cloud workload identity
  (ECR/GAR/ACR) over stored passwords.
- **[modify]** `kubectl rollout restart deploy/<name> -n <ns>`

## §C — Registry rate limit

- Authenticate pulls (higher limits) or mirror to your own registry.
- Long-term: keep critical public images in a registry you control.

## §D — Node network/DNS

- Pull happens on the node before pod networking exists — check node DNS
  (`/etc/resolv.conf`), egress firewall, and runtime proxy config.
- If only some nodes fail: per-node egress/subnet difference.

## Verify

- **[read-only]** `kubectl get pods -n <ns> -w` → `Running`
- **[read-only]** `kubectl get events -n <ns> --field-selector reason=Failed` — no new entries.

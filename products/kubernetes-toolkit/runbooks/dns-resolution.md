# Runbook: DNS Resolution Failure

Severity: medium–high · Blast radius: service-to-service calls ·
Typical MTTR: 10–40 min

DNS failures in Kubernetes present as `name or service not known`,
NXDOMAIN, or timeouts on ClusterIP hostnames. The subtlety: DNS can be
working perfectly while the *record* is missing — different problem,
different fix.

## Symptoms

- App logs: `ENOTFOUND`, `NXDOMAIN`, `Temporary failure in name resolution`.
- Direct ClusterIP requests work; hostname requests fail.
- All pods fail (CoreDNS problem) OR one service name fails (endpoints
  problem) — the first diagnostic decision.

## Ranked causes

1. **Service has no endpoints** — selector matches zero pods; the
   Service exists, its DNS record effectively doesn't. Most common.
2. **CoreDNS pods down or crashlooping** — cluster-wide resolution fails.
3. **Wrong name being queried** — service is in another namespace;
   `svc` resolves only within the same namespace, `svc.other-ns` needs
   the namespace qualifier.
4. **NetworkPolicy blocking UDP/TCP 53** — queries time out rather
   than NXDOMAIN.
5. **ndots/search-domain weirdness** — short names expand wrong;
   FQDN still works.
6. **Node DNS config broken** (rare) — systemd-resolved, custom
   kubelet resolvConf.

## Diagnostic workflow

### Step 1 — Test from inside a pod [READ-ONLY]

    kubectl run dns-test --rm -it --image=busybox:1.36 --restart=Never -- nslookup kubernetes.default

Expected:

    Server:    10.96.0.10
    Address 1: 10.96.0.10 kube-dns.kube-system.svc.cluster.local
    Name:      kubernetes.default
    Address 1: 10.96.0.1 kubernetes.default.svc.cluster.local

If the built-in name resolves → CoreDNS is up; the problem is the
specific record.

### Step 2 — Test the failing name, short and FQDN [READ-ONLY]

    kubectl run dns-test --rm -it --image=busybox:1.36 --restart=Never -- nslookup backend
    kubectl run dns-test --rm -it --image=busybox:1.36 --restart=Never -- nslookup backend.default.svc.cluster.local

- FQDN resolves, short doesn't → search-domain/ndots or wrong namespace.
- Both NXDOMAIN → record doesn't exist: check endpoints (step 3).
- Both timeout → query isn't reaching CoreDNS: NetworkPolicy or CoreDNS down.

### Step 3 — Check the Service's endpoints [READ-ONLY]

    kubectl get endpoints <svc> -n <ns>

Empty (`<none>`) endpoints = the selector matches nothing:

    kubectl get pods -n <ns> -l <key>=<value>   # the selector's labels
    kubectl get svc <svc> -n <ns> -o jsonpath='{.spec.selector}'

Compare against actual pod labels — a renamed label key is the classic
cause.

### Step 4 — Check CoreDNS health [READ-ONLY]

    kubectl get pods -n kube-system -l k8s-app=kube-dns
    kubectl logs -n kube-system -l k8s-app=kube-dns --tail=20

CoreDNS answering with NXDOMAIN is *informative* — it means queries
arrive and the record genuinely doesn't exist.

### Step 5 — If timeouts: check NetworkPolicy [READ-ONLY]

    kubectl get networkpolicy -n <ns>
    kubectl describe networkpolicy <name> -n <ns>

A policy that selects the pod and lacks an egress rule for kube-dns
blocks resolution silently.

## Root cause identification

| Evidence | Root cause |
|---|---|
| FQDN NXDOMAIN + endpoints `<none>` | Selector/pod label mismatch |
| Everything NXDOMAIN cluster-wide | CoreDNS down |
| FQDN works, short name doesn't | ndots/search-domain or namespace |
| Timeouts (not NXDOMAIN) | NetworkPolicy or kube-dns endpoints empty |
| Works in `default`, fails in another ns | Queried unqualified name cross-namespace |

## Safe resolution

- **Selector mismatch:** update `svc.spec.selector` to match the pods'
  current labels (or relabel the pods). Endpoints populate within
  seconds of the match being restored.
- **CoreDNS down:** `kubectl rollout restart deployment coredns -n
  kube-system` [MODIFYING — brief cluster-wide DNS blip during restart].
- **Namespace issue:** use `svc.ns` or the FQDN in app config; don't
  rely on short names for cross-namespace calls.
- **NetworkPolicy:** add an egress rule allowing port 53 to
  `kube-system` / `kube-dns` labels [MODIFYING].

## Verification

    kubectl get endpoints <svc> -n <ns>        # populated
    # from the app pod:
    kubectl exec <app-pod> -n <ns> -- nslookup <svc>   # resolves
    # then the real check — the app's health call succeeds

## Prevention

- Add an endpoint-count check to deploy verification — a Service with
  zero endpoints is almost always a bug.
- Keep pod label renames and Service selectors in the same PR; drifting
  them apart is the #1 cause.
- Standardize on FQDN in app configs for cross-namespace calls.

## Tested / validated

- Commands verified by static review against Kubernetes 1.28–1.34;
  busybox nslookup output format from BusyBox 1.36.
- Known limitation: `nslookup` inside busybox uses the pod's DNS policy;
  pods with `dnsPolicy: Default` resolve via node DNS, not cluster DNS —
  check `dnsPolicy` in the pod spec if a pod behaves oddly.

# kubectl Incident Command Reference

Organized by symptom. Every command marked:
[READ-ONLY] reads state · [MODIFYING] changes resources ·
[DESTRUCTIVE] deletes or disrupts.

Namespaces: replace `<ns>`; omit `-n` for `default`. `-A` = all namespaces.

## First response — what's on fire?

    kubectl get pods -A | grep -v Running          # [READ-ONLY] all abnormal pods
    kubectl get nodes                               # [READ-ONLY] node health at a glance
    kubectl get events -A --sort-by=.lastTimestamp | tail -20   # [READ-ONLY] newest events
    kubectl config current-context                  # [READ-ONLY] VERIFY cluster before anything else

## Pod crashes (CrashLoopBackOff / Error / OOMKilled)

    kubectl describe pod <pod> -n <ns>              # [READ-ONLY] state, exit code, events
    kubectl logs <pod> -n <ns> --previous           # [READ-ONLY] why the LAST container died
    kubectl logs <pod> -n <ns> --tail=100 -f        # [READ-ONLY] stream current container
    kubectl top pod <pod> -n <ns> --containers      # [READ-ONLY] memory near the limit?

Exit codes: 1 = app error · 137 = OOMKilled · 143 = SIGTERM (probe/scale
down) · 255 = exit -1.

## Image pull failures

    kubectl describe pod <pod> -n <ns> | grep -A10 Events   # [READ-ONLY] exact pull error
    kubectl get secrets -n <ns>                     # [READ-ONLY] does the pull secret exist?
    kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.imagePullSecrets}'   # [READ-ONLY] referenced?

`not found` = tag/registry issue · `unauthorized` = credentials ·
timeout/`no such host` = network/DNS.

## Scheduling failures (Pending)

    kubectl describe pod <pod> -n <ns>              # [READ-ONLY] FailedScheduling reasons
    kubectl describe node <node>                    # [READ-ONLY] taints, allocatable, pressure
    kubectl top nodes                               # [READ-ONLY] real usage vs allocatable
    kubectl get pvc -n <ns>                         # [READ-ONLY] unbound volumes?
    kubectl get resourcequota -n <ns>               # [READ-ONLY] quota exhausted?

## Node problems

    kubectl describe node <node>                    # [READ-ONLY] conditions + last events
    kubectl get pods -A -o wide --field-selector spec.nodeName=<node>   # [READ-ONLY] what ran there
    kubectl cordon <node>                           # [MODIFYING] stop new scheduling
    kubectl drain <node> --ignore-daemonsets --delete-emptydir-data    # [DESTRUCTIVE] evicts pods

Drain = PDB-respecting evictions. On single-node clusters it will not
complete — expected, not a bug.

## Networking / DNS / Services

    kubectl get endpoints <svc> -n <ns>             # [READ-ONLY] zero endpoints = selector mismatch
    kubectl get svc <svc> -n <ns> -o wide           # [READ-ONLY] ClusterIP, ports
    kubectl exec <pod> -n <ns> -- nslookup <svc>    # [READ-ONLY] resolution from inside
    kubectl get networkpolicy -n <ns>               # [READ-ONLY] what's isolating traffic

## Rollouts

    kubectl rollout status deployment/<name> -n <ns>        # [READ-ONLY] watch progress
    kubectl rollout history deployment/<name> -n <ns>       # [READ-ONLY] revisions
    kubectl rollout undo deployment/<name> -n <ns>          # [MODIFYING] revert to previous
    kubectl rollout restart deployment/<name> -n <ns>       # [MODIFYING] recreate all pods

## Evidence capture (before you change anything)

    kubectl get pod <pod> -n <ns> -o yaml > /tmp/pod.yaml    # [READ-ONLY] snapshot spec+status
    kubectl describe pod <pod> -n <ns> > /tmp/describe.txt   # [READ-ONLY] snapshot events
    kubectl logs <pod> -n <ns> --previous > /tmp/logs.txt    # [READ-ONLY] preserve crash logs

Capture before deleting or restarting — evidence disappears fast.

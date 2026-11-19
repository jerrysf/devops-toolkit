# Post-Incident Verification Checklist

Run after mitigation, before closing the incident. Every check is
read-only kubectl unless marked.

## Workload health

- [ ] All pods Ready and restarts stable:

      kubectl get pods -A | grep -v Running

- [ ] Deployments fully available:

      kubectl get deployments -A | awk '$2 != $4'

- [ ] Restart counts stopped incrementing (wait 2× the old crash period):

      kubectl get pods -n <ns>   # watch RESTARTS column

## Platform health

- [ ] All nodes Ready, no pressure conditions:

      kubectl get nodes
      kubectl describe nodes | grep -E "MemoryPressure|DiskPressure" | grep -v False

- [ ] No fresh Warning events in affected namespaces:

      kubectl get events -n <ns> --sort-by=.lastTimestamp | tail -15

## Service-level verification

- [ ] The original user-facing symptom is gone — verified by an actual
      request or synthetic check, not just green pods.
- [ ] Service endpoints populated:

      kubectl get endpoints -n <ns>

- [ ] Critical-path dependencies healthy (DB, queues, DNS):

      kubectl get pods -n kube-system -l k8s-app=kube-dns

## Root cause documented

- [ ] Timeline complete: detection → diagnosis → mitigation → fix
- [ ] Root cause stated with evidence (the command output that proved it)
- [ ] Fix is permanent or a follow-up is tracked — "restarted it" is a
      mitigation, not a fix

## Prevention actions

- [ ] Monitoring/alerting would catch this earlier — or a gap is filed
- [ ] Runbook updated with anything this incident taught you
- [ ] Blameless review scheduled if blast radius warrants it

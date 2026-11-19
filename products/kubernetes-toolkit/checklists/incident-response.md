# Incident Response Checklist (Printable)

## Orient

- [ ] Cluster + context confirmed (`kubectl config current-context`)
- [ ] Symptom written down: error, status, start time, what changed
- [ ] Recent deploys/config changes checked
- [ ] Blast radius noted: pod / service / node / namespace

## Localize

- [ ] `kubectl get nodes` — any NotReady?
- [ ] `kubectl get pods -A | grep -vE "Running|Completed"`
- [ ] `kubectl get events -n <ns> --sort-by=.lastTimestamp | tail -20`
- [ ] `kubectl describe pod <pod> -n <ns>`
- [ ] `kubectl logs <pod> -n <ns> --previous`
- [ ] `kubectl get endpoints <svc> -n <ns>` (if connectivity)
- [ ] Failing layer named: node / scheduler / pull / runtime / app / network

## Decide

- [ ] One-sentence suspected root cause
- [ ] Chosen action: config / rollout / scale / node op
- [ ] If draining/deleting: replicas checked, PDBs checked, team notified
- [ ] Faster mitigation identified (rollback / scale / failover)

## Act

- [ ] ONE change → verify → next change
- [ ] Controller-managed recovery preferred (rollout over delete)
- [ ] Namespace + resource name double-checked before mutating commands
- [ ] Every command logged for postmortem

## Verify & close

- [ ] Stable Ready; restart counts not climbing
- [ ] `kubectl rollout status` clean
- [ ] Verified from user side (endpoint/dashboard/alerts)
- [ ] No new warnings: `kubectl get events --field-selector type=Warning`
- [ ] Root cause + fix + discovery path documented
- [ ] Follow-ups filed: alerts, runbook gaps, config fixes

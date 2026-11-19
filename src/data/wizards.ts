import type { WizardTree } from "@/lib/wizard";

/**
 * Guided diagnostic trees. Content mirrors the published guides but as
 * branching questions. Each result is a hypothesis with evidence —
 * never a claim to have inspected a real cluster.
 */

export const wizardTrees: WizardTree[] = [
  {
    slug: "crashloopbackoff",
    title: "CrashLoopBackOff",
    description: "Pod starts, exits, restarts in a loop.",
    start: "q-restarting",
    nodes: {
      "q-restarting": {
        id: "q-restarting",
        question: "Is the container actually restarting on a loop?",
        hint: "kubectl get pods — look for CrashLoopBackOff status with a RESTARTS count that keeps climbing.",
        options: [
          { label: "Yes — restarts keep climbing", next: "q-exitcode" },
          { label: "It's Pending or ImagePullBackOff instead", next: "r-wrong-scenario" },
          { label: "I can't tell yet", next: "r-check-status" },
        ],
      },
      "q-exitcode": {
        id: "q-exitcode",
        question: "What exit code did the last termination produce?",
        hint: "kubectl get pod <pod> -n <ns> -o jsonpath='{.status.containerStatuses[*].lastState}' — look for exitCode and reason.",
        options: [
          { label: "137 — OOMKilled or SIGKILL", next: "r-oom" },
          { label: "1 — generic application error", next: "q-app-logs" },
          { label: "0 — clean exit", next: "r-exit0" },
          { label: "126 or 127 — not executable / not found", next: "r-entrypoint" },
          { label: "Something else / can't tell", next: "r-read-logs" },
        ],
      },
      "q-app-logs": {
        id: "q-app-logs",
        question: "Do the previous container's logs show a startup error?",
        hint: "kubectl logs <pod> -n <ns> --previous — the last crashed container's output usually names the problem.",
        options: [
          { label: "Yes — missing config/env/dependency", next: "r-app-config" },
          { label: "Yes — unhandled exception / bug", next: "r-app-bug" },
          { label: "Logs look healthy or are empty", next: "q-probes" },
        ],
      },
      "q-probes": {
        id: "q-probes",
        question: "Are liveness or readiness probes failing?",
        hint: "kubectl describe pod — Events show 'Liveness probe failed' or 'Readiness probe failed' messages.",
        options: [
          { label: "Yes — probe failures in events", next: "r-probe" },
          { label: "No probe failures", next: "r-recheck-logs" },
        ],
      },
    },
    results: {
      "r-oom": {
        id: "r-oom",
        title: "OOMKilled — memory limit exceeded",
        explanation:
          "Exit code 137 means the kernel OOM-killer terminated the container for exceeding its memory limit (or the node evicted it). This is a resource problem, not a scheduling one.",
        confidence: "high",
        commands: [
          {
            command: "kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.containers[0].resources}'",
            description: "Check current memory request/limit",
            safety: "readonly",
          },
          {
            command: "kubectl top pod <pod> -n <ns>",
            description: "See live memory usage (needs metrics-server)",
            safety: "readonly",
          },
          {
            command: "kubectl set resources deployment/<name> -n <ns> --limits=memory=1Gi --requests=memory=512Mi",
            description: "Example: raise the memory ceiling (adjust values to your workload)",
            safety: "modify",
          },
        ],
        nextSteps:
          "If raising the limit only delays the crash, you're chasing a leak — profile the app's memory growth over time.",
      },
      "r-exit0": {
        id: "r-exit0",
        title: "Container exits cleanly — wrong workload type",
        explanation:
          "Exit 0 means the process finished successfully. A Deployment has restartPolicy: Always, so Kubernetes restarts it forever — the classic 'job running as a Deployment' pattern.",
        confidence: "high",
        commands: [
          {
            command: "kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.containers[0].command} {.spec.containers[0].args}'",
            description: "Check what the container is actually running",
            safety: "readonly",
          },
          {
            command: "kubectl logs <pod> -n <ns> --previous",
            description: "Confirm it completed its work before exiting",
            safety: "readonly",
          },
        ],
        nextSteps:
          "Either make the process long-running (a server), or move the task to a Job/CronJob which expects completion.",
      },
      "r-entrypoint": {
        id: "r-entrypoint",
        title: "Bad entrypoint — command not executable or not found",
        explanation:
          "Exit 126/127 means the container's command doesn't exist or isn't executable — a typo in command/args, a missing binary, or a script without a shebang.",
        confidence: "high",
        commands: [
          {
            command: "kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.containers[0].command} {.spec.containers[0].args}'",
            description: "Read the exact command the pod runs",
            safety: "readonly",
          },
          {
            command: "docker run --rm --entrypoint '' <image> sh -c 'which <binary>'",
            description: "Verify the binary exists inside the image locally",
            safety: "readonly",
          },
        ],
        nextSteps:
          "Fix the command/args in the pod spec or the entrypoint in the image, then redeploy.",
      },
      "r-app-config": {
        id: "r-app-config",
        title: "Missing configuration — env var, ConfigMap, or Secret",
        explanation:
          "The app crashes at startup because required configuration is absent — a missing env var, a ConfigMap key that doesn't exist, or a Secret reference that was never created.",
        confidence: "high",
        commands: [
          {
            command: "kubectl get pod <pod> -n <ns> -o yaml | grep -A20 'env:'",
            description: "List every env var and valueFrom reference the pod expects",
            safety: "readonly",
          },
          {
            command: "kubectl get configmap,secret -n <ns>",
            description: "Check which referenced objects actually exist (names only — never values)",
            safety: "readonly",
          },
          {
            command: "kubectl describe pod <pod> -n <ns>",
            description: "Events report 'secret not found' / 'key not found' without exposing values",
            safety: "readonly",
          },
        ],
        guideSlug: "crashloopbackoff",
        nextSteps:
          "Create the missing ConfigMap/Secret or fix the key name, then `kubectl rollout restart deployment/<name>` (modifies resources).",
      },
      "r-app-bug": {
        id: "r-app-bug",
        title: "Application bug — crashes with an exception",
        explanation:
          "The container starts and immediately throws — this is an application defect, not a Kubernetes problem. The cluster is doing its job.",
        confidence: "high",
        commands: [
          {
            command: "kubectl logs <pod> -n <ns> --previous --tail=100",
            description: "Capture the full stack trace",
            safety: "readonly",
          },
          {
            command: "kubectl rollout history deployment/<name> -n <ns>",
            description: "Check if this started with a recent deploy",
            safety: "readonly",
          },
          {
            command: "kubectl rollout undo deployment/<name> -n <ns>",
            description: "If a bad release caused it: revert to the previous revision",
            safety: "modify",
          },
        ],
        nextSteps:
          "Fix the code. If the crash correlates with a deploy, rollback restores service while you debug.",
      },
      "r-probe": {
        id: "r-probe",
        title: "Probe misconfiguration — killed before ready",
        explanation:
          "The app runs but a liveness probe fails, so kubelet restarts it. Common with slow-starting apps where liveness fires before boot finishes — the fix is a startupProbe.",
        confidence: "high",
        commands: [
          {
            command: "kubectl get pod <pod> -n <ns> -o yaml | grep -A12 'livenessProbe\\|startupProbe'",
            description: "Inspect probe timing: period, threshold, delay",
            safety: "readonly",
          },
          {
            command: "kubectl exec <pod> -n <ns> -- curl -s localhost:<port><probe-path>",
            description: "Test the probe endpoint from inside the container",
            safety: "readonly",
          },
        ],
        guideSlug: "crashloopbackoff",
        nextSteps:
          "Add a startupProbe with generous failureThreshold (e.g. 30 × 10s), or fix the probe path/port if it points at the wrong endpoint.",
      },
      "r-check-status": {
        id: "r-check-status",
        title: "First, capture the pod's actual state",
        explanation:
          "Before diagnosing, get the exact status, restart count, and last termination reason — the pod's status fields narrow the cause immediately.",
        confidence: "medium",
        commands: [
          {
            command: "kubectl get pods -n <ns> -o wide",
            description: "Status, restarts, node for all pods",
            safety: "readonly",
          },
          {
            command: "kubectl get pod <pod> -n <ns> -o jsonpath='{.status.containerStatuses[*].lastState}'",
            description: "Exit code + reason of last termination",
            safety: "readonly",
          },
          {
            command: "kubectl describe pod <pod> -n <ns>",
            description: "Events timeline — the fastest first signal",
            safety: "readonly",
          },
        ],
        guideSlug: "crashloopbackoff",
      },
      "r-read-logs": {
        id: "r-read-logs",
        title: "Read the previous container's logs",
        explanation:
          "When the exit code isn't conclusive, the last crashed container's own output is the primary evidence — the crash reason is almost always in it.",
        confidence: "medium",
        commands: [
          {
            command: "kubectl logs <pod> -n <ns> --previous",
            description: "Logs from the last terminated container",
            safety: "readonly",
          },
          {
            command: "kubectl get events -n <ns> --sort-by=.lastTimestamp | tail -10",
            description: "Recent cluster events for context",
            safety: "readonly",
          },
        ],
        guideSlug: "crashloopbackoff",
      },
      "r-recheck-logs": {
        id: "r-recheck-logs",
        title: "Healthy logs + no probe failures — dig deeper",
        explanation:
          "If logs look clean and no probe fired, look at what changed: a recent deploy, node pressure, or resource limits hitting between probe checks.",
        confidence: "low",
        commands: [
          {
            command: "kubectl get events -n <ns> --field-selector type=Warning",
            description: "All warning events — evictions, probe kills, failed mounts",
            safety: "readonly",
          },
          {
            command: "kubectl top pod <pod> -n <ns>",
            description: "Check for memory climbing toward the limit",
            safety: "readonly",
          },
          {
            command: "kubectl describe node <node> | grep -A8 Conditions",
            description: "Node pressure conditions (from pod's -o wide node)",
            safety: "readonly",
          },
        ],
        guideSlug: "crashloopbackoff",
      },
      "r-wrong-scenario": {
        id: "r-wrong-scenario",
        title: "Different failure mode — Pending or image pull",
        explanation:
          "Pending means the scheduler can't place the pod (resources/taints/volumes). ImagePullBackOff means the node can't fetch the image. Different cause, different playbook.",
        confidence: "high",
        commands: [
          {
            command: "kubectl describe pod <pod> -n <ns>",
            description: "Events will say FailedScheduling or Failed to pull — that tells you which tree to follow",
            safety: "readonly",
          },
        ],
        guideSlug: "imagepullbackoff",
        nextSteps:
          "Restart the wizard and pick Pod Pending or ImagePullBackOff.",
      },
    },
  },
  {
    slug: "imagepullbackoff",
    title: "ImagePullBackOff",
    description: "Pod can't start — the node can't fetch the image.",
    start: "q-error",
    nodes: {
      "q-error": {
        id: "q-error",
        question: "What does the pull failure event actually say?",
        hint: "kubectl describe pod <pod> -n <ns> — the Events section has a 'Failed to pull image' line with the exact reason.",
        options: [
          { label: "not found / manifest unknown", next: "r-tag" },
          { label: "pull access denied / 401 / 403", next: "q-secret" },
          { label: "toomanyrequests / rate limit", next: "r-ratelimit" },
          { label: "dial tcp / lookup / timeout", next: "r-network" },
          { label: "I don't see a Failed event", next: "r-describe" },
        ],
      },
      "q-secret": {
        id: "q-secret",
        question: "Is an imagePullSecret referenced and present in this namespace?",
        hint: "kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.imagePullSecrets}' and kubectl get secrets -n <ns> --field-selector type=kubernetes.io/dockerconfigjson",
        options: [
          { label: "No secret referenced at all", next: "r-add-secret" },
          { label: "Referenced, but it doesn't exist", next: "r-create-secret" },
          { label: "Exists and is referenced", next: "r-expired-secret" },
        ],
      },
    },
    results: {
      "r-tag": {
        id: "r-tag",
        title: "Image or tag doesn't exist",
        explanation:
          "'manifest unknown' / 'not found' means the registry has no such name:tag — a typo, a tag that was never pushed, or the image went to a different registry.",
        confidence: "high",
        commands: [
          {
            command: "kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.containers[*].image}'",
            description: "Copy the exact image reference Kubernetes is using",
            safety: "readonly",
          },
          {
            command: "docker manifest inspect <image>:<tag>",
            description: "Verify the tag exists from a machine with registry access",
            safety: "readonly",
          },
          {
            command: "kubectl set image deployment/<name> <container>=<image>:<tag> -n <ns>",
            description: "Fix the reference once you confirm the right tag",
            safety: "modify",
          },
        ],
        guideSlug: "imagepullbackoff",
      },
      "r-add-secret": {
        id: "r-add-secret",
        title: "Private registry — no credentials attached",
        explanation:
          "The pod pulls anonymously. Private registries need an imagePullSecret on the pod spec or the namespace's ServiceAccount.",
        confidence: "high",
        commands: [
          {
            command: "kubectl create secret docker-registry regcred --docker-server=<registry> --docker-username=<user> --docker-password='<token>' -n <ns>",
            description: "Create the pull secret in the pod's namespace (read-only registry account)",
            safety: "modify",
          },
          {
            command: "kubectl get serviceaccount default -n <ns> -o yaml",
            description: "Check the SA before attaching imagePullSecrets to it",
            safety: "readonly",
          },
          {
            command: "kubectl rollout restart deployment/<name> -n <ns>",
            description: "Recreate pods so they pull with the new credentials",
            safety: "modify",
          },
        ],
        guideSlug: "imagepullbackoff",
      },
      "r-create-secret": {
        id: "r-create-secret",
        title: "Referenced secret is missing",
        explanation:
          "The pod spec names a pull secret that doesn't exist in this namespace — secrets don't cross namespaces. Create it here or fix the name.",
        confidence: "high",
        commands: [
          {
            command: "kubectl get secrets -n <ns> --field-selector type=kubernetes.io/dockerconfigjson",
            description: "List pull secrets that exist in THIS namespace",
            safety: "readonly",
          },
          {
            command: "kubectl create secret docker-registry regcred --docker-server=<registry> --docker-username=<user> --docker-password='<token>' -n <ns>",
            description: "Create the missing secret",
            safety: "modify",
          },
        ],
        guideSlug: "imagepullbackoff",
      },
      "r-expired-secret": {
        id: "r-expired-secret",
        title: "Secret exists but credentials are stale",
        explanation:
          "A referenced, existing secret still gets 401/403 — the token expired or was rotated. Cloud registries are notorious: ECR tokens live 12 hours.",
        confidence: "medium",
        commands: [
          {
            command: "kubectl get secret regcred -n <ns> -o jsonpath='{.metadata.creationTimestamp}'",
            description: "Check when the secret was created (age hints at expiry)",
            safety: "readonly",
          },
          {
            command: "kubectl create secret docker-registry regcred --docker-server=<registry> --docker-username=<user> --docker-password='<new-token>' -n <ns> --dry-run=client -o yaml | kubectl apply -f -",
            description: "Rotate the secret in place",
            safety: "modify",
          },
        ],
        guideSlug: "imagepullbackoff",
        nextSteps:
          "Long-term: use workload identity (ECR/GAR/ACR node-native credentials) instead of stored tokens.",
      },
      "r-ratelimit": {
        id: "r-ratelimit",
        title: "Registry rate limit (usually Docker Hub)",
        explanation:
          "'toomanyrequests' means the registry throttled you — Docker Hub's anonymous pull limits are per-IP, so shared NAT egress hits them fast.",
        confidence: "high",
        commands: [
          {
            command: "kubectl describe pod <pod> -n <ns> | grep 'Failed to pull'",
            description: "Confirm the rate-limit message and which image",
            safety: "readonly",
          },
        ],
        guideSlug: "imagepullbackoff",
        nextSteps:
          "Authenticate pulls (higher limit), mirror public images to your own registry, or use a pull-through cache.",
      },
      "r-network": {
        id: "r-network",
        title: "Node can't reach the registry",
        explanation:
          "dial tcp / DNS lookup failures happen on the node before pod networking exists — node DNS, egress firewall, security groups, or runtime proxy config.",
        confidence: "high",
        commands: [
          {
            command: "kubectl get pod <pod> -n <ns> -o wide",
            description: "Which node is failing the pull",
            safety: "readonly",
          },
          {
            command: "kubectl get pods -n <ns> -o wide | grep ImagePull",
            description: "Do pods on OTHER nodes pull fine? Isolates node vs cluster",
            safety: "readonly",
          },
        ],
        nextSteps:
          "If only some nodes fail: compare their subnets/egress/security groups and node DNS (/etc/resolv.conf). If all fail: cluster egress or registry outage.",
      },
      "r-describe": {
        id: "r-describe",
        title: "Get the exact pull error first",
        explanation:
          "The Events section names the failure precisely — every fix depends on which of the five error families you're seeing.",
        confidence: "medium",
        commands: [
          {
            command: "kubectl describe pod <pod> -n <ns>",
            description: "Events section has the 'Failed to pull image' reason",
            safety: "readonly",
          },
          {
            command: "kubectl get events -n <ns> --field-selector reason=Failed --sort-by=.lastTimestamp",
            description: "All recent pull failures in the namespace",
            safety: "readonly",
          },
        ],
        guideSlug: "imagepullbackoff",
      },
    },
  },
  {
    slug: "pod-pending",
    title: "Pod Pending",
    description: "Scheduler can't place the pod on any node.",
    start: "q-event",
    nodes: {
      "q-event": {
        id: "q-event",
        question: "What does the FailedScheduling event say?",
        hint: "kubectl describe pod <pod> -n <ns> — the Warning FailedScheduling message names the blocker.",
        options: [
          { label: "Insufficient cpu / memory", next: "r-capacity" },
          { label: "untolerated taint", next: "r-taint" },
          { label: "didn't match node selector / affinity", next: "r-affinity" },
          { label: "unbound PVC / waiting for volume", next: "r-pvc" },
          { label: "No FailedScheduling event / other", next: "r-other" },
        ],
      },
    },
    results: {
      "r-capacity": {
        id: "r-capacity",
        title: "No node has enough allocatable resources",
        explanation:
          "The pod's CPU/memory requests exceed what any node has free. Either the request is oversized, or the cluster is genuinely full.",
        confidence: "high",
        commands: [
          {
            command: "kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.containers[*].resources.requests}'",
            description: "How much the pod is actually requesting",
            safety: "readonly",
          },
          {
            command: "kubectl describe nodes | grep -A5 'Allocated resources'",
            description: "Free capacity across all nodes",
            safety: "readonly",
          },
          {
            command: "kubectl top nodes",
            description: "Live usage vs capacity (needs metrics-server)",
            safety: "readonly",
          },
        ],
        nextSteps:
          "Lower the request to reality, scale the node group, or evict lower-priority workloads. Check the request isn't a copy-paste of another workload's.",
      },
      "r-taint": {
        id: "r-taint",
        title: "Tainted nodes — no toleration on the pod",
        explanation:
          "Nodes carry taints (dedicated, maintenance, spot) and the pod doesn't tolerate any of them. '0/N nodes available: N untolerated taint'.",
        confidence: "high",
        commands: [
          {
            command: "kubectl describe nodes | grep -i taint",
            description: "What taints exist and on which nodes",
            safety: "readonly",
          },
          {
            command: "kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.tolerations}'",
            description: "What the pod currently tolerates",
            safety: "readonly",
          },
        ],
        nextSteps:
          "Add a matching toleration to the pod spec (modify), or schedule onto an untainted pool. Don't remove taints to force scheduling — they exist for a reason.",
      },
      "r-affinity": {
        id: "r-affinity",
        title: "Node selector / affinity excludes every node",
        explanation:
          "nodeSelector or required affinity rules match zero nodes — a label typo, a pool that was renamed, or rules that can never co-satisfy.",
        confidence: "high",
        commands: [
          {
            command: "kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.nodeSelector} {.spec.affinity}'",
            description: "What constraints the pod demands",
            safety: "readonly",
          },
          {
            command: "kubectl get nodes --show-labels",
            description: "What labels actually exist on nodes",
            safety: "readonly",
          },
        ],
        nextSteps:
          "Fix the label or relax to preferred affinity. Anti-affinity on a single-node cluster is a classic self-inflicted Pending.",
      },
      "r-pvc": {
        id: "r-pvc",
        title: "Unbound PVC blocking scheduling",
        explanation:
          "The pod mounts a PVC that isn't Bound — no provisioner created a volume, or the StorageClass/provisioner failed.",
        confidence: "high",
        commands: [
          {
            command: "kubectl get pvc -n <ns>",
            description: "Is the claim Pending?",
            safety: "readonly",
          },
          {
            command: "kubectl describe pvc <claim> -n <ns>",
            description: "Provisioning events: 'waiting for a volume', 'failed to provision'",
            safety: "readonly",
          },
          {
            command: "kubectl get storageclass",
            description: "Does the requested class exist and is it the default?",
            safety: "readonly",
          },
        ],
        nextSteps:
          "Fix the StorageClass name, check the provisioner's controller logs, or create a matching PV for static binding.",
      },
      "r-other": {
        id: "r-other",
        title: "No scheduling event — look wider",
        explanation:
          "If there's no FailedScheduling, the pod may be Pending for another reason: init container running, image still pulling, or the pod was just created.",
        confidence: "medium",
        commands: [
          {
            command: "kubectl describe pod <pod> -n <ns>",
            description: "Full event timeline",
            safety: "readonly",
          },
          {
            command: "kubectl get pod <pod> -n <ns> -o jsonpath='{.status.initContainerStatuses}'",
            description: "Init container states — a stuck init keeps the pod Pending-like",
            safety: "readonly",
          },
        ],
        nextSteps:
          "Init containers run before app containers and appear as Init:x/y rather than Pending — check them first.",
      },
    },
  },
  {
    slug: "node-not-ready",
    title: "Node NotReady",
    description: "A worker node stopped reporting to the control plane.",
    start: "q-conditions",
    nodes: {
      "q-conditions": {
        id: "q-conditions",
        question: "What do the node's Conditions show?",
        hint: "kubectl describe node <node> — the Conditions table lists MemoryPressure/DiskPressure/PIDPressure/Ready with reasons.",
        options: [
          { label: "DiskPressure=True", next: "r-disk" },
          { label: "MemoryPressure=True", next: "r-mem" },
          { label: "Ready=False, KubeletNotReady", next: "q-kubelet" },
          { label: "NetworkReady / runtime network not ready", next: "r-cni" },
          { label: "All conditions look fine but still NotReady", next: "r-flaky" },
        ],
      },
      "q-kubelet": {
        id: "q-kubelet",
        question: "Can you get onto the node (SSH / cloud console / SSM)?",
        hint: "KubeletNotReady means heartbeats stopped — the answer usually lives in the node's own logs, not in kubectl.",
        options: [
          { label: "Yes — I have node access", next: "r-journal" },
          { label: "No / managed node I can't reach", next: "r-cloud-check" },
        ],
      },
    },
    results: {
      "r-disk": {
        id: "r-disk",
        title: "DiskPressure — node disk nearly full",
        explanation:
          "Kubelet evicts pods to protect the node when disk crosses its threshold. Usual suspects: container logs, image garbage, pods writing to emptyDir/hostPath.",
        confidence: "high",
        commands: [
          {
            command: "kubectl get pods -A -o wide --field-selector spec.nodeName=<node>",
            description: "What's running on the pressured node",
            safety: "readonly",
          },
          {
            command: "sudo du -xh /var/lib/containerd /var/log /var/lib/kubelet | sort -h | tail -20",
            description: "On the node: find the disk consumer",
            safety: "readonly",
          },
        ],
        guideSlug: "node-not-ready",
        nextSteps:
          "Free space (truncate oversized logs, prune images), then kubelet clears the condition itself. Find WHICH pod wrote the data or it recurs.",
      },
      "r-mem": {
        id: "r-mem",
        title: "MemoryPressure — node out of memory",
        explanation:
          "Pods are consuming the node's memory, usually a workload without a limit growing unbounded.",
        confidence: "high",
        commands: [
          {
            command: "kubectl top pod -A --sort-by=memory | head -15",
            description: "The biggest memory consumers cluster-wide",
            safety: "readonly",
          },
          {
            command: "kubectl get pods -A -o wide --field-selector spec.nodeName=<node>",
            description: "What's colocated on the pressured node",
            safety: "readonly",
          },
        ],
        guideSlug: "node-not-ready",
        nextSteps:
          "Bound the offender's memory limit; consider a dedicated node/taint for memory-hungry workloads.",
      },
      "r-journal": {
        id: "r-journal",
        title: "Read the kubelet journal on the node",
        explanation:
          "The kubelet's own logs say why it stopped — crash, certificate expiry, containerd dependency, or OOM of the kubelet itself.",
        confidence: "high",
        commands: [
          {
            command: "sudo systemctl status kubelet",
            description: "Is the service active or failed?",
            safety: "readonly",
          },
          {
            command: "sudo journalctl -u kubelet -n 200 --no-pager",
            description: "The last 200 lines — crash reason lives here",
            safety: "readonly",
          },
          {
            command: "sudo systemctl restart kubelet",
            description: "Restart AFTER reading the journal — restarting blind loses the cause",
            safety: "modify",
          },
        ],
        guideSlug: "node-not-ready",
      },
      "r-cloud-check": {
        id: "r-cloud-check",
        title: "Check the cloud layer first",
        explanation:
          "Without node access, verify the instance still exists: terminated spot instances and autoscaler removals leave ghost NotReady node objects.",
        confidence: "high",
        commands: [
          {
            command: "kubectl get node <node> -o jsonpath='{.spec.providerID} {.metadata.labels}'",
            description: "The cloud instance ID behind the node",
            safety: "readonly",
          },
          {
            command: "kubectl get events -A --sort-by=.lastTimestamp | grep -i node | tail -10",
            description: "Node lifecycle events — termination, heartbeat loss timing",
            safety: "readonly",
          },
          {
            command: "kubectl delete node <node>",
            description: "Only if the VM is confirmed gone: removes the stale object (VM untouched)",
            safety: "modify",
          },
        ],
        guideSlug: "node-not-ready",
      },
      "r-cni": {
        id: "r-cni",
        title: "CNI / container runtime network down",
        explanation:
          "'runtime network not ready' means the CNI plugin failed — the node is up but can't configure pod networking, so kubelet reports NotReady.",
        confidence: "high",
        commands: [
          {
            command: "kubectl get pods -n kube-system -o wide --field-selector spec.nodeName=<node>",
            description: "Is the CNI DaemonSet pod healthy on that node?",
            safety: "readonly",
          },
          {
            command: "kubectl logs -n kube-system <cni-pod> --previous",
            description: "CNI agent's crash logs",
            safety: "readonly",
          },
        ],
        guideSlug: "node-not-ready",
      },
      "r-flaky": {
        id: "r-flaky",
        title: "Intermittent heartbeat loss — network partition",
        explanation:
          "Clean conditions but NotReady = the kubelet can't reach the API server: security group, route, NACL, or a dead NIC.",
        confidence: "medium",
        commands: [
          {
            command: "kubectl get nodes -o wide",
            description: "Internal IP of the failing node — test reachability",
            safety: "readonly",
          },
          {
            command: "kubectl get events -A --field-selector reason=NodeNotReady --sort-by=.lastTimestamp",
            description: "When heartbeats stopped and whether they flap",
            safety: "readonly",
          },
        ],
        guideSlug: "node-not-ready",
        nextSteps:
          "Fix the network path (SG/routes/firewall). The node re-registers itself once the API server is reachable — no kubectl action needed.",
      },
    },
  },
  {
    slug: "dns-resolution",
    title: "DNS Resolution Failure",
    description: "Pods can't resolve service or external names.",
    start: "q-error",
    nodes: {
      "q-error": {
        id: "q-error",
        question: "What's the actual resolution error?",
        hint: "Application logs or a test pod: 'NXDOMAIN', 'no such host', 'temporary failure in name resolution', or timeouts.",
        options: [
          { label: "NXDOMAIN / name not found", next: "q-fqdn" },
          { label: "Timeout / no response", next: "q-coredns" },
          { label: "Intermittent failures", next: "q-coredns" },
        ],
      },
      "q-fqdn": {
        id: "q-fqdn",
        question: "Does the name resolve with its full FQDN?",
        hint: "From a test pod: nslookup <service>.<ns>.svc.cluster.local — the fully-qualified form bypasses search-domain expansion.",
        options: [
          { label: "Yes — FQDN resolves", next: "r-ndots" },
          { label: "No — even FQDN fails", next: "q-coredns" },
        ],
      },
      "q-coredns": {
        id: "q-coredns",
        question: "Are the CoreDNS pods healthy with endpoints?",
        hint: "kubectl get pods -n kube-system -l k8s-app=kube-dns and kubectl get endpoints kube-dns -n kube-system",
        options: [
          { label: "CoreDNS pods down / no endpoints", next: "r-coredns-down" },
          { label: "CoreDNS looks healthy", next: "r-upstream" },
        ],
      },
    },
    results: {
      "r-ndots": {
        id: "r-ndots",
        title: "Search-domain expansion (ndots) behavior",
        explanation:
          "FQDN works but the short name fails — the resolver is walking search domains. Names with fewer than `ndots` dots (default 5) get expanded through svc/ns search paths first; external names like 'api.example.com' hit cluster DNS before the real DNS.",
        confidence: "high",
        commands: [
          {
            command: "kubectl exec <pod> -n <ns> -- cat /etc/resolv.conf",
            description: "See the pod's nameserver, search domains, and ndots",
            safety: "readonly",
          },
          {
            command: "kubectl run tmp-dns --rm -it --image=busybox:1.36 --restart=Never -- nslookup <name>",
            description: "Watch which name is actually queried",
            safety: "readonly",
          },
        ],
        nextSteps:
          "Use the full FQDN for in-cluster names, or set dnsConfig with a lower ndots for pods that mostly resolve external names.",
      },
      "r-coredns-down": {
        id: "r-coredns-down",
        title: "CoreDNS itself is unhealthy",
        explanation:
          "Cluster DNS is down — every name resolution fails cluster-wide, not just one service. Check whether coredns pods are running and the kube-dns Service has endpoints.",
        confidence: "high",
        commands: [
          {
            command: "kubectl get pods -n kube-system -l k8s-app=kube-dns -o wide",
            description: "CoreDNS pod status and which nodes they're on",
            safety: "readonly",
          },
          {
            command: "kubectl logs -n kube-system -l k8s-app=kube-dns --tail=50",
            description: "CoreDNS errors — plugin failures, upstream issues",
            safety: "readonly",
          },
          {
            command: "kubectl rollout restart deployment/coredns -n kube-system",
            description: "Restart CoreDNS if pods are stuck (core service — plan for brief resolution gaps)",
            safety: "modify",
          },
        ],
      },
      "r-upstream": {
        id: "r-upstream",
        title: "CoreDNS up but upstream resolution failing",
        explanation:
          "In-cluster names work but external names fail — CoreDNS's forwarders (upstream DNS) are unreachable, or a stubDomain/forward rule is wrong.",
        confidence: "medium",
        commands: [
          {
            command: "kubectl get configmap coredns -n kube-system -o yaml",
            description: "Read the Corefile — forward targets, stub domains",
            safety: "readonly",
          },
          {
            command: "kubectl exec -n kube-system <coredns-pod> -- nslookup example.com 127.0.0.1",
            description: "Test external resolution from inside CoreDNS",
            safety: "readonly",
          },
        ],
        nextSteps:
          "Verify the forward IPs in the Corefile are reachable from nodes — node-level DNS servers are usually the upstream.",
      },
    },
  },
];

export function getWizard(slug: string): WizardTree | undefined {
  return wizardTrees.find((t) => t.slug === slug);
}

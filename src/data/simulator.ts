import type { SimScenario } from "@/lib/simulator";

const SHARED_POD = {
  namespace: "default",
  node: "node-1",
  ip: "10.244.1.7",
  age: "26m",
};

export const simScenarios: SimScenario[] = [
  {
    slug: "crashloopbackoff",
    title: "CrashLoopBackOff",
    difficulty: "beginner",
    brief:
      "The 'payments' deployment rolled out 20 minutes ago. Pods keep restarting and users report 502s. Find the root cause.",
    welcome: [
      "Connected to simulated-cluster (educational environment).",
      "ALERT: deployment 'payments' — 0/3 ready, pods restarting.",
      "Diagnose the root cause, then submit your diagnosis.",
      "Type 'help' for supported commands, 'hint' for a nudge.",
    ],
    cluster: {
      context: "simulated-cluster",
      nodes: [
        {
          name: "node-1",
          status: "Ready",
          roles: "control-plane",
          age: "47d",
          version: "v1.31.0",
          conditions: [
            "Ready            True    kubelet is posting ready status",
            "MemoryPressure   False   no memory pressure",
            "DiskPressure     False   no disk pressure",
          ],
          events: [],
        },
      ],
      deployments: [
        {
          name: "payments",
          namespace: "default",
          ready: "0/3",
          upToDate: 3,
          available: 0,
          age: "14d",
          images: "registry.internal/payments:2.4.1",
          events: [
            "Normal   ScalingReplicaSet  Scaled up replica set payments-7d9c4f to 3",
          ],
        },
      ],
      pods: [
        {
          ...SHARED_POD,
          name: "payments-7d9c4f-2xklp",
          status: "CrashLoopBackOff",
          ready: "0/1",
          restarts: 8,
          labels: { app: "payments", "pod-template-hash": "7d9c4f" },
          containers: [
            {
              name: "payments",
              image: "registry.internal/payments:2.4.1",
              ready: false,
              state: "Waiting",
              reason: "CrashLoopBackOff",
              exitCode: 1,
              restartCount: 8,
            },
          ],
          spec: {
            "env": "DATABASE_URL=<set>, PAYMENTS_API_KEY=<set from Secret>",
            "resources.requests": "cpu: 100m, memory: 128Mi",
          },
          events: [
            "Warning  BackOff     Back-off restarting failed container",
            "Normal   Pulled      Successfully pulled image (8 times)",
            "Normal   Started     Started container payments",
          ],
          logs: {
            current: `payments v2.4.1 starting...
connecting to database at postgres://db.internal:5432/payments
Error: connect ECONNREFUSED db.internal:5432
FATAL: required environment variable PAYMENTS_API_KEY is empty
exiting with code 1`,
            previous: `payments v2.4.1 starting...
FATAL: required environment variable PAYMENTS_API_KEY is empty
exiting with code 1`,
          },
        },
        {
          ...SHARED_POD,
          name: "payments-7d9c4f-9mqwt",
          status: "CrashLoopBackOff",
          ready: "0/1",
          restarts: 8,
          ip: "10.244.1.8",
          labels: { app: "payments", "pod-template-hash": "7d9c4f" },
          containers: [
            {
              name: "payments",
              image: "registry.internal/payments:2.4.1",
              ready: false,
              state: "Waiting",
              reason: "CrashLoopBackOff",
              exitCode: 1,
              restartCount: 8,
            },
          ],
          events: ["Warning  BackOff     Back-off restarting failed container"],
          logs: {
            current: "FATAL: required environment variable PAYMENTS_API_KEY is empty\nexiting with code 1",
            previous: "FATAL: required environment variable PAYMENTS_API_KEY is empty\nexiting with code 1",
          },
        },
      ],
      services: [
        {
          name: "payments",
          namespace: "default",
          type: "ClusterIP",
          clusterIp: "10.96.4.12",
          ports: "8080/TCP",
          endpoints: [],
        },
      ],
      generic: [
        {
          kind: "secrets",
          singular: "secret",
          header: ["NAME", "TYPE", "DATA", "AGE"],
          items: [
            {
              name: "payments-api-key",
              namespace: "default",
              columns: [
                ["TYPE", "Opaque"],
                ["DATA", "0"],
                ["AGE", "14d"],
              ],
            },
          ],
          describe: {
            "payments-api-key":
              "Name:         payments-api-key\nNamespace:    default\nType:         Opaque\n\nData\n====\n(empty — 0 keys)\n\nNote: the deployment expects key 'api-key', but this secret contains no keys.",
          },
        },
      ],
      events: {
        namespace: "default",
        lines: [
          "8m        Warning   BackOff             pod/payments-7d9c4f-2xklp   Back-off restarting failed container payments",
          "8m        Warning   BackOff             pod/payments-7d9c4f-9mqwt   Back-off restarting failed container payments",
        ],
      },
    },
    hints: [
      "Start with `kubectl get pods` — note STATUS and RESTARTS.",
      "`kubectl describe pod <name>` shows the exit code and events. Exit code 1 = app error, not OOM (137) or probe (143).",
      "Check the logs: `kubectl logs <pod> --previous` shows why the last container died.",
      "The log says PAYMENTS_API_KEY is empty. Check the Secret it references: `kubectl get secrets` then `kubectl describe secret payments-api-key`.",
    ],
    diagnosis: [
      {
        id: "oom",
        label: "Container is OOMKilled — memory limit too low",
        correct: false,
        explanation:
          "OOMKilled shows exit code 137 and reason OOMKilled in describe. Here the exit code is 1 and the log shows a config error, not memory pressure.",
      },
      {
        id: "bad-secret",
        label: "PAYMENTS_API_KEY secret is missing/empty — app exits on startup",
        correct: true,
        explanation:
          "Correct. The logs show 'required environment variable PAYMENTS_API_KEY is empty', and `describe secret payments-api-key` shows the secret contains 0 keys. The app validates config at boot and exits 1; kubelet restarts it → CrashLoopBackOff.",
      },
      {
        id: "probe",
        label: "Liveness probe is failing and restarting the container",
        correct: false,
        explanation:
          "Probe failures appear as 'Liveness probe failed' events and Unhealthy warnings. The events here only show BackOff after crashes, and logs show a clean FATAL exit.",
      },
      {
        id: "image",
        label: "Image pull is failing",
        correct: false,
        explanation:
          "ImagePullBackOff would show as STATUS and as ImagePull events. The image pulled successfully 8 times — the container starts, then crashes.",
      },
    ],
    walkthrough: [
      { command: "kubectl get pods", why: "See STATUS=CrashLoopBackOff and rising RESTARTS" },
      { command: "kubectl describe pod payments-7d9c4f-2xklp", why: "Exit code 1 — an app-level failure, not OOM (137)" },
      { command: "kubectl logs payments-7d9c4f-2xklp --previous", why: "Shows why the last container exited" },
      { command: "kubectl describe secret payments-api-key", why: "The env var source is empty — root cause" },
    ],
  },

  {
    slug: "imagepullbackoff",
    title: "ImagePullBackOff",
    difficulty: "beginner",
    brief:
      "A new 'inventory' deployment was just rolled out. Pods are stuck before they even start. Find the root cause.",
    welcome: [
      "Connected to simulated-cluster.",
      "ALERT: deployment 'inventory' — 0/2 ready, pods not starting.",
      "Type 'help' for commands, 'hint' for a nudge.",
    ],
    cluster: {
      context: "simulated-cluster",
      nodes: [
        {
          name: "node-1",
          status: "Ready",
          roles: "control-plane",
          age: "47d",
          version: "v1.31.0",
          conditions: ["Ready            True"],
          events: [],
        },
      ],
      deployments: [
        {
          name: "inventory",
          namespace: "default",
          ready: "0/2",
          upToDate: 2,
          available: 0,
          age: "3d",
          images: "registry.internal/inventory:v1.9.2",
          events: ["Normal   ScalingReplicaSet  Scaled up replica set inventory-5f8b7d to 2"],
        },
      ],
      pods: [
        {
          ...SHARED_POD,
          name: "inventory-5f8b7d-j4qxz",
          status: "ImagePullBackOff",
          ready: "0/1",
          restarts: 0,
          ip: undefined,
          labels: { app: "inventory" },
          containers: [
            {
              name: "inventory",
              image: "registry.internal/inventory:v1.9.2",
              ready: false,
              state: "Waiting",
              reason: "ImagePullBackOff",
              restartCount: 0,
            },
          ],
          spec: {
            "image": "registry.internal/inventory:v1.9.2",
            "imagePullSecrets": "(none)",
          },
          events: [
            "Normal   Scheduled   Successfully assigned default/inventory-5f8b7d-j4qxz to node-1",
            "Warning  Failed      Failed to pull image \"registry.internal/inventory:v1.9.2\": rpc error: code = NotFound desc = failed to pull and unpack image: registry.internal/inventory:v1.9.2: not found",
            "Warning  Failed      Error: ErrImagePull",
            "Warning  Failed      Error: ImagePullBackOff",
          ],
          logs: { current: "(container never started — no logs)" },
        },
        {
          ...SHARED_POD,
          name: "inventory-5f8b7d-8twnm",
          status: "ImagePullBackOff",
          ready: "0/1",
          restarts: 0,
          ip: undefined,
          labels: { app: "inventory" },
          containers: [
            {
              name: "inventory",
              image: "registry.internal/inventory:v1.9.2",
              ready: false,
              state: "Waiting",
              reason: "ImagePullBackOff",
              restartCount: 0,
            },
          ],
          events: [
            "Warning  Failed      Failed to pull image \"registry.internal/inventory:v1.9.2\": not found",
          ],
          logs: { current: "(container never started — no logs)" },
        },
      ],
      services: [],
      generic: [
        {
          kind: "secrets",
          singular: "secret",
          header: ["NAME", "TYPE", "DATA", "AGE"],
          items: [],
        },
      ],
      events: {
        namespace: "default",
        lines: [
          "6m        Warning   Failed     pod/inventory-5f8b7d-j4qxz   Failed to pull image \"registry.internal/inventory:v1.9.2\": not found",
          "6m        Warning   Failed     pod/inventory-5f8b7d-8twnm   Error: ImagePullBackOff",
        ],
      },
    },
    hints: [
      "`kubectl get pods` — the container never started (RESTARTS=0, status ImagePullBackOff).",
      "`kubectl describe pod <name>` and read the Events section — the exact pull error is there.",
      "The error says 'not found', not 'unauthorized'. That means the image:tag doesn't exist in the registry — a bad tag, not a credential problem.",
      "Check what tag the deployment actually wants vs. what exists. A typo'd or never-pushed tag is the usual cause.",
    ],
    diagnosis: [
      {
        id: "auth",
        label: "Registry authentication is missing (no imagePullSecret)",
        correct: false,
        explanation:
          "Auth failures show 'unauthorized' or '401' in pull errors. This one says 'not found' — the registry was reached and answered, the tag just doesn't exist.",
      },
      {
        id: "tag",
        label: "The image tag doesn't exist in the registry (bad/typo'd tag)",
        correct: true,
        explanation:
          "Correct. 'not found' from the registry means it served the request but has no such tag — v1.9.2 was never pushed or the tag is mistyped. Fix: correct the tag or push the image.",
      },
      {
        id: "net",
        label: "Node can't reach the registry (network/DNS)",
        correct: false,
        explanation:
          "Network failures show timeouts or 'no such host'. Here the registry responded with a concrete 'not found' — connectivity is fine.",
      },
      {
        id: "space",
        label: "Node out of disk space",
        correct: false,
        explanation:
          "Disk pressure shows as node DiskPressure condition and eviction events — node-1 is Ready with no pressure conditions.",
      },
    ],
    walkthrough: [
      { command: "kubectl get pods", why: "ImagePullBackOff status, restarts 0 — pull fails before start" },
      { command: "kubectl describe pod inventory-5f8b7d-j4qxz", why: "Events show the exact pull error: 'not found'" },
      { command: "kubectl get events --sort-by=.lastTimestamp", why: "Confirm same error on both pods" },
    ],
  },

  {
    slug: "pod-pending",
    title: "Pod Pending",
    difficulty: "intermediate",
    brief:
      "The 'report-worker' deployment scaled to 4 replicas, but one pod has been Pending for 40 minutes. Find out why the scheduler can't place it.",
    welcome: [
      "Connected to simulated-cluster.",
      "ALERT: pod report-worker-9f6d2-px7qk Pending for 40m.",
      "Type 'help' for commands, 'hint' for a nudge.",
    ],
    cluster: {
      context: "simulated-cluster",
      nodes: [
        {
          name: "node-1",
          status: "Ready",
          roles: "control-plane",
          age: "47d",
          version: "v1.31.0",
          conditions: [
            "Ready            True",
            "MemoryPressure   False",
            "DiskPressure     False",
          ],
          allocatable: "cpu: 2, memory: 3Gi (4Gi capacity minus kube-reserved)",
          taints: ["node-role.kubernetes.io/control-plane:NoSchedule"],
          events: [],
        },
        {
          name: "node-2",
          status: "Ready",
          roles: "worker",
          age: "47d",
          version: "v1.31.0",
          conditions: ["Ready            True"],
          allocatable: "cpu: 2, memory: 4Gi — currently 1.95Gi/2 CPU already requested by other pods",
          events: [],
        },
      ],
      deployments: [
        {
          name: "report-worker",
          namespace: "default",
          ready: "3/4",
          upToDate: 4,
          available: 3,
          age: "6d",
          images: "registry.internal/report-worker:1.3.0",
          events: ["Normal   ScalingReplicaSet  Scaled up replica set report-worker-9f6d2 to 4"],
        },
      ],
      pods: [
        {
          ...SHARED_POD,
          name: "report-worker-9f6d2-px7qk",
          status: "Pending",
          ready: "0/1",
          restarts: 0,
          node: undefined,
          ip: undefined,
          labels: { app: "report-worker" },
          containers: [
            {
              name: "worker",
              image: "registry.internal/report-worker:1.3.0",
              ready: false,
              state: "Waiting",
              reason: "PodScheduled=False",
              restartCount: 0,
            },
          ],
          spec: {
            "resources.requests": "cpu: 1500m, memory: 2Gi",
            "nodeSelector": "kubernetes.io/os=linux",
            "tolerations": "(none)",
          },
          events: [
            "Warning  FailedScheduling   0/2 nodes are available: 1 Insufficient cpu, 1 node(s) had untolerated taint {node-role.kubernetes.io/control-plane:NoSchedule}. preemption: 0/2 nodes are available: 2 No preemption victims found for incoming pod.",
          ],
          logs: { current: "(pod not scheduled — no containers, no logs)" },
        },
        {
          ...SHARED_POD,
          name: "report-worker-9f6d2-a1b2c",
          status: "Running",
          ready: "1/1",
          restarts: 0,
          node: "node-2",
          labels: { app: "report-worker" },
          containers: [
            {
              name: "worker",
              image: "registry.internal/report-worker:1.3.0",
              ready: true,
              state: "Running",
              restartCount: 0,
            },
          ],
          events: [],
          logs: { current: "worker processing job queue..." },
        },
        {
          ...SHARED_POD,
          name: "report-worker-9f6d2-d3e4f",
          status: "Running",
          ready: "1/1",
          restarts: 0,
          node: "node-2",
          ip: "10.244.1.9",
          labels: { app: "report-worker" },
          containers: [
            {
              name: "worker",
              image: "registry.internal/report-worker:1.3.0",
              ready: true,
              state: "Running",
              restartCount: 0,
            },
          ],
          events: [],
          logs: { current: "worker processing job queue..." },
        },
      ],
      services: [],
      generic: [],
      events: {
        namespace: "default",
        lines: [
          "40m       Warning   FailedScheduling   pod/report-worker-9f6d2-px7qk   0/2 nodes are available: 1 Insufficient cpu, 1 node(s) had untolerated taint {node-role.kubernetes.io/control-plane:NoSchedule}.",
        ],
      },
    },
    hints: [
      "Pending pods have no node — `kubectl describe pod <name>` and check Events for FailedScheduling.",
      "The event lists two distinct reasons — one per node. Both must be satisfied.",
      "node-1 is control-plane: it has a NoSchedule taint the pod can't tolerate. So it can't go there.",
      "node-2 reports 'Insufficient cpu' — the pod requests 1500m and node-2 has almost no CPU left. The scheduler needs the request to fit.",
    ],
    diagnosis: [
      {
        id: "pvc",
        label: "A PVC is unbound",
        correct: false,
        explanation:
          "PVC issues show 'pod has unbound immediate PersistentVolumeClaims' in FailedScheduling events — not present here.",
      },
      {
        id: "cpu+taint",
        label: "Pod requests more CPU than the only schedulable node has free (control-plane is tainted NoSchedule)",
        correct: true,
        explanation:
          "Correct. node-1 is control-plane with a NoSchedule taint; node-2 has insufficient free CPU for the 1500m request. Fixes: reduce the request, add capacity, or remove the taint. Scaling the deployment doesn't help — each pod needs its own resources.",
      },
      {
        id: "image",
        label: "Image pull failure",
        correct: false,
        explanation:
          "ImagePull issues appear after scheduling — this pod has no node yet. Pending ≠ pull failure.",
      },
      {
        id: "quota",
        label: "Namespace ResourceQuota is exceeded",
        correct: false,
        explanation:
          "Quota rejections happen at admission with a 'forbidden: exceeded quota' error and the pod wouldn't be created at all — this pod exists and fails at scheduling.",
      },
    ],
    walkthrough: [
      { command: "kubectl get pods -o wide", why: "Pending pod has no NODE — never scheduled" },
      { command: "kubectl describe pod report-worker-9f6d2-px7qk", why: "FailedScheduling event names both blockers" },
      { command: "kubectl describe node node-1", why: "Confirm the NoSchedule taint" },
      { command: "kubectl get nodes", why: "Only 2 nodes — no other candidates" },
    ],
  },

  {
    slug: "node-not-ready",
    title: "Node NotReady",
    difficulty: "intermediate",
    brief:
      "node-2 went NotReady 15 minutes ago. Pods on it are unreachable and the cluster is running degraded. Find why the node went down.",
    welcome: [
      "Connected to simulated-cluster.",
      "ALERT: node-2 NotReady — 4 pods unreachable.",
      "Type 'help' for commands, 'hint' for a nudge.",
    ],
    cluster: {
      context: "simulated-cluster",
      nodes: [
        {
          name: "node-1",
          status: "Ready",
          roles: "control-plane",
          age: "47d",
          version: "v1.31.0",
          conditions: ["Ready            True"],
          events: [],
        },
        {
          name: "node-2",
          status: "NotReady",
          roles: "worker",
          age: "47d",
          version: "v1.31.0",
          conditions: [
            "Ready            Unknown   Kubelet stopped posting node status (last heartbeat 15m ago)",
            "MemoryPressure   Unknown   Condition never probed",
            "DiskPressure     Unknown   Condition never probed",
            "PIDPressure      Unknown   Condition never probed",
            "NetworkUnavailable  False",
          ],
          events: [
            "Warning  NodeNotReady      Node node-2 status is now: NodeNotReady",
            "Normal   NodeHasSufficientMemory  (15m ago, before going NotReady)",
            "Warning  KubeletNotReady   container runtime is down",
          ],
        },
      ],
      deployments: [
        {
          name: "frontend",
          namespace: "default",
          ready: "1/3",
          upToDate: 3,
          available: 1,
          age: "12d",
          images: "registry.internal/frontend:3.1.0",
          events: [],
        },
      ],
      pods: [
        {
          ...SHARED_POD,
          name: "frontend-8d4c6-a1",
          status: "Running",
          ready: "1/1",
          restarts: 0,
          node: "node-1",
          labels: { app: "frontend" },
          containers: [
            {
              name: "web",
              image: "registry.internal/frontend:3.1.0",
              ready: true,
              state: "Running",
              restartCount: 0,
            },
          ],
          events: [],
          logs: { current: "serving requests on :3000" },
        },
        {
          ...SHARED_POD,
          name: "frontend-8d4c6-b2",
          status: "Unknown",
          ready: "1/1",
          restarts: 0,
          node: "node-2",
          labels: { app: "frontend" },
          containers: [
            {
              name: "web",
              image: "registry.internal/frontend:3.1.0",
              ready: false,
              state: "Unknown",
              reason: "NodeLost",
              restartCount: 0,
            },
          ],
          events: ["Warning  NodeLost    Node node-2 which was running pod is not responding"],
          logs: { current: "(node unreachable — logs unavailable)" },
        },
        {
          ...SHARED_POD,
          name: "frontend-8d4c6-c3",
          status: "Unknown",
          ready: "1/1",
          restarts: 0,
          node: "node-2",
          ip: "10.244.2.4",
          labels: { app: "frontend" },
          containers: [
            {
              name: "web",
              image: "registry.internal/frontend:3.1.0",
              ready: false,
              state: "Unknown",
              reason: "NodeLost",
              restartCount: 0,
            },
          ],
          events: ["Warning  NodeLost    Node node-2 which was running pod is not responding"],
          logs: { current: "(node unreachable — logs unavailable)" },
        },
      ],
      services: [
        {
          name: "frontend",
          namespace: "default",
          type: "ClusterIP",
          clusterIp: "10.96.9.40",
          ports: "80/TCP",
          endpoints: ["10.244.1.7:3000"],
        },
      ],
      generic: [],
      events: {
        namespace: "default",
        lines: [
          "15m       Warning   NodeNotReady   node/node-2   Node node-2 status is now: NodeNotReady",
          "14m       Warning   NodeLost       pod/frontend-8d4c6-b2   Node node-2 which was running pod is not responding",
        ],
      },
    },
    hints: [
      "`kubectl get nodes` first — which node, and what's its status.",
      "`kubectl describe node node-2` — the Conditions section tells you how it died.",
      "'Kubelet stopped posting node status' means the control plane lost contact — the kubelet process or the node itself is down. That's different from MemoryPressure/DiskPressure staying False.",
      "Look at the last event before it went dark: 'container runtime is down'. The kubelet reported its container runtime (containerd) died — that takes the node's heartbeats with it.",
    ],
    diagnosis: [
      {
        id: "runtime",
        label: "The kubelet/container runtime on node-2 died — node lost its heartbeat",
        correct: true,
        explanation:
          "Correct. 'Kubelet stopped posting node status' + 'container runtime is down' event = the kubelet can no longer report. Common causes: containerd crash, OOM of the kubelet process, or the VM itself dying. Pods show Unknown/NodeLost because their state can't be verified.",
      },
      {
        id: "disk",
        label: "Node ran out of disk — DiskPressure evictions",
        correct: false,
        explanation:
          "DiskPressure would show as a True condition and 'evicted' pod events. Here conditions are Unknown (not False or True) — the kubelet simply stopped reporting.",
      },
      {
        id: "network-cni",
        label: "CNI plugin misconfiguration",
        correct: false,
        explanation:
          "CNI failures block pod networking but the node typically stays Ready with NetworkUnavailable issues. This node reports NetworkUnavailable=False — networking config isn't the story.",
      },
      {
        id: "sched",
        label: "Scheduler is broken",
        correct: false,
        explanation:
          "A broken scheduler leaves pods Pending — it doesn't make a node NotReady. Existing pods on node-1 are still running fine.",
      },
    ],
    walkthrough: [
      { command: "kubectl get nodes", why: "node-2 is NotReady" },
      { command: "kubectl describe node node-2", why: "Conditions all Unknown → kubelet stopped heartbeating; event shows container runtime down" },
      { command: "kubectl get pods -o wide", why: "Pods on node-2 show Unknown/NodeLost — unreachable" },
    ],
  },

  {
    slug: "dns-resolution",
    title: "DNS Resolution Failure",
    difficulty: "advanced",
    brief:
      "The 'api-client' pod can't reach the 'backend' service — every request fails with DNS errors. Other services seem fine. Find the root cause.",
    welcome: [
      "Connected to simulated-cluster.",
      "ALERT: api-client requests failing — 'name or service not known'.",
      "Type 'help' for commands, 'hint' for a nudge.",
    ],
    cluster: {
      context: "simulated-cluster",
      nodes: [
        {
          name: "node-1",
          status: "Ready",
          roles: "control-plane",
          age: "47d",
          version: "v1.31.0",
          conditions: ["Ready            True"],
          events: [],
        },
      ],
      deployments: [
        {
          name: "coredns",
          namespace: "kube-system",
          ready: "2/2",
          upToDate: 2,
          available: 2,
          age: "47d",
          images: "registry.k8s.io/coredns/coredns:v1.11.1",
          events: [],
        },
      ],
      pods: [
        {
          ...SHARED_POD,
          name: "api-client-7c9f5-x1",
          status: "Running",
          ready: "1/1",
          restarts: 0,
          labels: { app: "api-client" },
          containers: [
            {
              name: "client",
              image: "registry.internal/api-client:1.1.0",
              ready: true,
              state: "Running",
              restartCount: 0,
            },
          ],
          events: [],
          logs: {
            current: `GET http://backend:8080/health
Error: getaddrinfo ENOTFOUND backend
GET http://backend.default.svc.cluster.local:8080/health
Error: getaddrinfo ENOTFOUND backend.default.svc.cluster.local
GET http://10.96.5.20:8080/health   ← direct ClusterIP works!
response: 200 OK`,
          },
        },
        {
          ...SHARED_POD,
          name: "coredns-66d4f5-aa",
          namespace: "kube-system",
          status: "Running",
          ready: "1/1",
          restarts: 0,
          labels: { "k8s-app": "kube-dns" },
          containers: [
            {
              name: "coredns",
              image: "registry.k8s.io/coredns/coredns:v1.11.1",
              ready: true,
              state: "Running",
              restartCount: 0,
            },
          ],
          events: [],
          logs: {
            current: `[INFO] plugin/ready: Still waiting on: "kubernetes"
[INFO] .:53 - 47216 "A IN backend.default.svc.cluster.local. udp 57 false 512" NXDOMAIN qr,aa,rd 124 0.001s
[INFO] CoreDNS-1.11.1 linux/amd64
[WARN] plugin/kubernetes: no matching records for backend.default.svc.cluster.local.`,
          },
        },
      ],
      services: [
        {
          name: "backend",
          namespace: "default",
          type: "ClusterIP",
          clusterIp: "10.96.5.20",
          ports: "8080/TCP",
          endpoints: [],
        },
        {
          name: "kube-dns",
          namespace: "kube-system",
          type: "ClusterIP",
          clusterIp: "10.96.0.10",
          ports: "53/UDP,53/TCP",
          endpoints: ["10.244.1.10:53", "10.244.1.11:53"],
        },
      ],
      generic: [
        {
          kind: "endpoints",
          singular: "endpoints",
          header: ["NAME", "ENDPOINTS", "AGE"],
          items: [
            {
              name: "backend",
              namespace: "default",
              columns: [
                ["ENDPOINTS", "<none>"],
                ["AGE", "10d"],
              ],
            },
            {
              name: "kube-dns",
              namespace: "kube-system",
              columns: [
                ["ENDPOINTS", "10.244.1.10:53,10.244.1.11:53"],
                ["AGE", "47d"],
              ],
            },
          ],
          describe: {
            backend:
              "Name:         backend\nNamespace:    default\nEndpoints:    <none>\n\nThe Service's selector (app=backend) matches NO pods.\nPod labels in this namespace: app=api-client.\nThe backend pods were relabeled to app=backend-v2 by a recent manifest change — the Service selector wasn't updated.\n\nNote: CoreDNS returns NXDOMAIN because the Service has no endpoints — the DNS record only exists when the Service is backed by at least one pod.",
          },
        },
      ],
      events: {
        namespace: "default",
        lines: ["(no Warning events in default)"],
      },
    },
    hints: [
      "The pod's logs are gold: FQDN AND short name fail, but the direct ClusterIP works. Networking is fine — it's DNS/registration.",
      "CoreDNS is up (2/2 in kube-system) and its log shows NXDOMAIN for backend.default.svc.cluster.local — DNS is answering, the record just doesn't exist.",
      "A ClusterIP Service's DNS record only resolves when the Service has endpoints. Check `kubectl get endpoints backend` — or describe it.",
      "`kubectl describe endpoints backend` reveals selector app=backend matches no pods — the pods were relabeled app=backend-v2. The Service selector is stale.",
    ],
    diagnosis: [
      {
        id: "endpoints",
        label: "Service selector matches no pods → no endpoints → NXDOMAIN",
        correct: true,
        explanation:
          "Correct. The 'backend' Service selects app=backend but the pods were relabeled app=backend-v2. Zero endpoints → CoreDNS has no record → NXDOMAIN. Direct ClusterIP access bypasses DNS entirely, which is why it worked. Fix: update the Service selector (or the pod labels).",
      },
      {
        id: "coredns-down",
        label: "CoreDNS is down",
        correct: false,
        explanation:
          "CoreDNS is Running 2/2 and its logs show it answering queries (with NXDOMAIN). DNS is functioning — the record is missing, not the server.",
      },
      {
        id: "netpol",
        label: "A NetworkPolicy blocks DNS traffic",
        correct: false,
        explanation:
          "A NetworkPolicy on port 53 would cause timeouts, not instant NXDOMAIN — and the NXDOMAIN log proves the query reached CoreDNS.",
      },
      {
        id: "ndots",
        label: "Wrong ndots/search-domain config in resolv.conf",
        correct: false,
        explanation:
          "ndots issues break short-name lookups but the FQDN would still resolve. Here the full FQDN also returns NXDOMAIN — the record genuinely doesn't exist.",
      },
    ],
    walkthrough: [
      { command: "kubectl logs api-client-7c9f5-x1", why: "Short name AND FQDN fail, but ClusterIP works → not app config, not network" },
      { command: "kubectl get pods -n kube-system", why: "CoreDNS is Running — DNS server is healthy" },
      { command: "kubectl get endpoints backend", why: "No endpoints — the smoking gun" },
      { command: "kubectl describe endpoints backend", why: "Selector app=backend matches nothing; pods are labeled app=backend-v2" },
    ],
  },
];

export const simScenariosPart2: SimScenario[] = [
  {
    slug: "oomkilled",
    title: "OOMKilled",
    difficulty: "intermediate",
    brief:
      "The 'image-processor' pod keeps dying under load — it was fine in staging. Pods restart, serve briefly, then die again. Find the root cause.",
    welcome: [
      "Connected to simulated-cluster.",
      "ALERT: image-processor restarting under traffic — intermittent 502s.",
      "Type 'help' for commands, 'hint' for a nudge.",
    ],
    cluster: {
      context: "simulated-cluster",
      nodes: [
        {
          name: "node-1",
          status: "Ready",
          roles: "worker",
          age: "47d",
          version: "v1.31.0",
          conditions: ["Ready            True", "MemoryPressure   False"],
          allocatable: "cpu: 4, memory: 8Gi",
          events: [],
        },
      ],
      deployments: [
        {
          name: "image-processor",
          namespace: "default",
          ready: "1/1",
          upToDate: 1,
          available: 1,
          age: "9d",
          images: "registry.internal/image-processor:2.0.1",
          events: [],
        },
      ],
      pods: [
        {
          ...SHARED_POD,
          name: "image-processor-6f9b8-k2mnx",
          status: "CrashLoopBackOff",
          ready: "0/1",
          restarts: 14,
          labels: { app: "image-processor" },
          containers: [
            {
              name: "processor",
              image: "registry.internal/image-processor:2.0.1",
              ready: false,
              state: "Waiting",
              reason: "CrashLoopBackOff",
              exitCode: 137,
              restartCount: 14,
            },
          ],
          spec: {
            "resources.requests": "cpu: 250m, memory: 512Mi",
            "resources.limits": "memory: 512Mi",
            "env": "BATCH_SIZE=64, JVM_HEAP not set",
          },
          events: [
            "Warning  BackOff     Back-off restarting failed container",
            "Normal   Killing     Container processor failed liveness probe, will be restarted",
          ],
          logs: {
            current: `image-processor 2.0.1 (OpenJDK 17) starting...
heap: default ergonomics — max heap = 25% of container limit
processing batch 7/64 ... allocating tile buffers
java.lang.OutOfMemoryError: Java heap space
    at com.app.TileCache.put(TileCache.java:118)
Killed (exit 137)`,
            previous: `processing batch 3/64 ...
java.lang.OutOfMemoryError: Java heap space
Killed (exit 137)`,
          },
        },
      ],
      services: [
        {
          name: "image-processor",
          namespace: "default",
          type: "ClusterIP",
          clusterIp: "10.96.7.31",
          ports: "8080/TCP",
          endpoints: [],
        },
      ],
      generic: [],
      events: {
        namespace: "default",
        lines: [
          "3m        Warning   BackOff   pod/image-processor-6f9b8-k2mnx   Back-off restarting failed container processor",
          "3m        Normal    Killing   pod/image-processor-6f9b8-k2mnx   Container processor failed liveness probe, will be restarted",
        ],
      },
    },
    hints: [
      "`kubectl describe pod <name>` — check the Last State reason and Exit Code. 137 is a specific signature.",
      "Exit code 137 = 128 + SIGKILL = OOMKilled. The container was killed by the OOM killer, not the app.",
      "The logs show OutOfMemoryError at ~512Mi. Check `resources.limits` in describe vs observed usage.",
      "Two separate problems: limit is at 512Mi AND a memory leak/heavy batch. Raising the limit buys time; the leak (or BATCH_SIZE) is the real fix.",
    ],
    diagnosis: [
      {
        id: "oom-limit",
        label: "Memory limit (512Mi) too low for the workload — container OOMKilled (exit 137)",
        correct: true,
        explanation:
          "Correct. Exit code 137 + 'Killed' in logs = OOMKilled. The 512Mi limit is below what batch-64 processing needs — OutOfMemoryError at ~500Mi proves the app demands more. Fix: raise the limit (and request) AND investigate whether BATCH_SIZE=64 is the real driver.",
      },
      {
        id: "liveness",
        label: "Liveness probe misconfiguration is killing the pod",
        correct: false,
        explanation:
          "The 'failed liveness probe' event is a symptom — the probe fails because the process is already being OOM-killed. Exit 137, not a probe config issue.",
      },
      {
        id: "node-pressure",
        label: "Node is under memory pressure and evicting pods",
        correct: false,
        explanation:
          "node-1 shows MemoryPressure=False and the pod hits its own limit — this is container-limit OOM, not node-level eviction (which shows as 'evicted' events and Reason: Evicted).",
      },
      {
        id: "image",
        label: "Bad image — the app crashes on startup",
        correct: false,
        explanation:
          "The app runs and processes batches before dying — it works until memory is exhausted. A bad image would fail immediately at boot.",
      },
    ],
    walkthrough: [
      { command: "kubectl describe pod image-processor-6f9b8-k2mnx", why: "Last State: OOMKilled, exit 137 — definitive" },
      { command: "kubectl logs image-processor-6f9b8-k2mnx --previous", why: "OutOfMemoryError right before death" },
      { command: "kubectl get pod image-processor-6f9b8-k2mnx -o yaml", why: "limits.memory: 512Mi vs observed usage" },
      { command: "kubectl top pod image-processor-6f9b8-k2mnx", why: "Confirm usage approaching the limit before death" },
    ],
  },

  {
    slug: "pvc-pending",
    title: "PVC Pending",
    difficulty: "intermediate",
    brief:
      "A 'database' StatefulSet pod is Pending. The PVC it needs won't bind. Find why the volume can't be provisioned.",
    welcome: [
      "Connected to simulated-cluster.",
      "ALERT: database-0 Pending 25m — PersistentVolumeClaim unbound.",
      "Type 'help' for commands, 'hint' for a nudge.",
    ],
    cluster: {
      context: "simulated-cluster",
      nodes: [
        {
          name: "node-1",
          status: "Ready",
          roles: "worker",
          age: "47d",
          version: "v1.31.0",
          conditions: ["Ready            True"],
          events: [],
        },
      ],
      deployments: [],
      pods: [
        {
          ...SHARED_POD,
          name: "database-0",
          status: "Pending",
          ready: "0/1",
          restarts: 0,
          node: undefined,
          ip: undefined,
          labels: { app: "database" },
          containers: [
            {
              name: "postgres",
              image: "postgres:16",
              ready: false,
              state: "Waiting",
              reason: "PodScheduled=False",
              restartCount: 0,
            },
          ],
          spec: {
            "volumes": "data → pvc/database-data-database-0",
          },
          events: [
            "Warning  FailedScheduling   pod has unbound immediate PersistentVolumeClaims",
          ],
          logs: { current: "(pod not scheduled — no logs)" },
        },
      ],
      services: [],
      generic: [
        {
          kind: "persistentvolumeclaims",
          singular: "pvc",
          header: ["NAME", "STATUS", "VOLUME", "CAPACITY", "STORAGECLASS", "AGE"],
          items: [
            {
              name: "database-data-database-0",
              namespace: "default",
              columns: [
                ["STATUS", "Pending"],
                ["VOLUME", ""],
                ["CAPACITY", ""],
                ["STORAGECLASS", "fast-ssd"],
                ["AGE", "25m"],
              ],
            },
          ],
          describe: {
            "database-data-database-0":
              "Name:         database-data-database-0\nNamespace:    default\nStatus:       Pending\nStorageClass: fast-ssd\nEvents:\n  Warning  ProvisioningFailed  failed to provision volume with StorageClass \"fast-ssd\": storageclasses.storage.k8s.io \"fast-ssd\" not found\n\nThe PVC requests storage class \"fast-ssd\" — no such StorageClass exists on this cluster.",
          },
        },
        {
          kind: "storageclasses",
          singular: "storageclass",
          header: ["NAME", "PROVISIONER", "RECLAIMPOLICY", "DEFAULT", "AGE"],
          items: [
            {
              name: "standard",
              namespace: "",
              columns: [
                ["PROVISIONER", "ebs.csi.aws.com"],
                ["RECLAIMPOLICY", "Delete"],
                ["DEFAULT", "(default)"],
                ["AGE", "47d"],
              ],
            },
            {
              name: "slow-hdd",
              namespace: "",
              columns: [
                ["PROVISIONER", "ebs.csi.aws.com"],
                ["RECLAIMPOLICY", "Delete"],
                ["DEFAULT", ""],
                ["AGE", "47d"],
              ],
            },
          ],
          describe: {
            standard:
              "Name:         standard\nProvisioner:  ebs.csi.aws.com\nIsDefaultClass: Yes\n\nThis is the cluster's default StorageClass.",
          },
        },
      ],
      events: {
        namespace: "default",
        lines: [
          "25m       Warning   ProvisioningFailed   persistentvolumeclaim/database-data-database-0   failed to provision volume with StorageClass \"fast-ssd\": storageclasses.storage.k8s.io \"fast-ssd\" not found",
          "25m       Warning   FailedScheduling     pod/database-0   pod has unbound immediate PersistentVolumeClaims",
        ],
      },
    },
    hints: [
      "The pod's FailedScheduling event names the blocker: unbound PVC.",
      "`kubectl get pvc` shows the claim Pending; `kubectl describe pvc` has the provisioning error.",
      "The error says StorageClass \"fast-ssd\" not found — check `kubectl get storageclass` for what actually exists.",
      "The cluster has 'standard' (default) and 'slow-hdd' — 'fast-ssd' was probably referenced by a copy-pasted manifest.",
    ],
    diagnosis: [
      {
        id: "sc-missing",
        label: "PVC references a StorageClass that doesn't exist (fast-ssd)",
        correct: true,
        explanation:
          "Correct. The PVC requests storageClassName: fast-ssd but the cluster only has 'standard' and 'slow-hdd'. The provisioner can't create the volume → PVC Pending → pod unschedulable. Fix: change the StatefulSet's volumeClaimTemplate to an existing class, or create the StorageClass.",
      },
      {
        id: "quota",
        label: "Storage quota exhausted in the namespace",
        correct: false,
        explanation:
          "A quota issue would show 'exceeded quota' in events, not a StorageClass 'not found' provisioning error.",
      },
      {
        id: "provisioner-down",
        label: "The CSI provisioner is down",
        correct: false,
        explanation:
          "If the provisioner were down, the error would be a timeout or connection error — not 'storageclasses... not found'. The class itself is missing.",
      },
      {
        id: "pvc-size",
        label: "Requested capacity exceeds available storage",
        correct: false,
        explanation:
          "Capacity errors show as 'insufficient storage' — the error here explicitly says the StorageClass doesn't exist.",
      },
    ],
    walkthrough: [
      { command: "kubectl describe pod database-0", why: "unbound PVC is the only blocker" },
      { command: "kubectl get pvc", why: "claim is Pending, class is fast-ssd" },
      { command: "kubectl describe pvc database-data-database-0", why: "ProvisioningFailed: StorageClass not found" },
      { command: "kubectl get storageclass", why: "fast-ssd doesn't exist — standard (default) and slow-hdd do" },
    ],
  },

  {
    slug: "ingress-502",
    title: "Ingress 502",
    difficulty: "advanced",
    brief:
      "External traffic hits the ingress and gets 502 Bad Gateway. The pods are Running. Find where the request path breaks.",
    welcome: [
      "Connected to simulated-cluster.",
      "ALERT: https://api.example.com returns 502 to all external callers.",
      "Type 'help' for commands, 'hint' for a nudge.",
    ],
    cluster: {
      context: "simulated-cluster",
      nodes: [
        {
          name: "node-1",
          status: "Ready",
          roles: "worker",
          age: "47d",
          version: "v1.31.0",
          conditions: ["Ready            True"],
          events: [],
        },
      ],
      deployments: [
        {
          name: "api",
          namespace: "default",
          ready: "2/2",
          upToDate: 2,
          available: 2,
          age: "30d",
          images: "registry.internal/api:3.2.0",
          events: [],
        },
        {
          name: "ingress-nginx-controller",
          namespace: "kube-system",
          ready: "1/1",
          upToDate: 1,
          available: 1,
          age: "47d",
          images: "registry.k8s.io/ingress-nginx/controller:v1.11.0",
          events: [],
        },
      ],
      pods: [
        {
          ...SHARED_POD,
          name: "api-7d5c9-a1",
          status: "Running",
          ready: "1/1",
          restarts: 0,
          labels: { app: "api" },
          containers: [
            {
              name: "api",
              image: "registry.internal/api:3.2.0",
              ready: true,
              state: "Running",
              restartCount: 0,
            },
          ],
          spec: { "ports": "containerPort: 3000" },
          events: [],
          logs: {
            current: `api 3.2.0 listening on :3000
GET /health → 200 (from kubelet)
(no requests from ingress — nothing arrives)`,
          },
        },
        {
          ...SHARED_POD,
          name: "api-7d5c9-b2",
          status: "Running",
          ready: "1/1",
          restarts: 0,
          ip: "10.244.1.9",
          labels: { app: "api" },
          containers: [
            {
              name: "api",
              image: "registry.internal/api:3.2.0",
              ready: true,
              state: "Running",
              restartCount: 0,
            },
          ],
          events: [],
          logs: { current: "api 3.2.0 listening on :3000\n(no requests from ingress)" },
        },
      ],
      services: [
        {
          name: "api",
          namespace: "default",
          type: "ClusterIP",
          clusterIp: "10.96.8.44",
          ports: "80/TCP→8080",
          endpoints: ["10.244.1.7:8080", "10.244.1.9:8080"],
        },
      ],
      generic: [
        {
          kind: "ingresses",
          singular: "ingress",
          header: ["NAME", "CLASS", "HOSTS", "ADDRESS", "AGE"],
          items: [
            {
              name: "api-ingress",
              namespace: "default",
              columns: [
                ["CLASS", "nginx"],
                ["HOSTS", "api.example.com"],
                ["ADDRESS", "34.120.10.5"],
                ["AGE", "30d"],
              ],
            },
          ],
          describe: {
            "api-ingress":
              "Name:             api-ingress\nClass:            nginx\nHost:             api.example.com\nRules:\n  api.example.com  / → Service: api  port: 8080\n\nNote: the Service 'api' listens on port 80 and targets port 8080 — but the pods' containerPort is 3000. The Service's targetPort 8080 doesn't match anything the container listens on.",
          },
        },
      ],
      events: {
        namespace: "default",
        lines: ["(no Warning events in default)"],
      },
    },
    hints: [
      "Pods are Running and Ready — the break is between ingress and container.",
      "`kubectl describe ingress api-ingress` — check which service:port the rule forwards to.",
      "The service's targetPort is 8080. Check what the pod actually listens on in its logs and spec.",
      "The container listens on 3000 but the Service targets 8080 — the endpoints exist but point at the wrong port.",
    ],
    diagnosis: [
      {
        id: "port-mismatch",
        label: "Service targetPort (8080) doesn't match the container's port (3000)",
        correct: true,
        explanation:
          "Correct. The Service is healthy with endpoints, but targetPort 8080 ≠ containerPort 3000 — kube-proxy forwards to a dead port → ingress gets connection refused → 502. Fix: align service.spec.ports[].targetPort to 3000.",
      },
      {
        id: "ingress-down",
        label: "The ingress controller itself is down",
        correct: false,
        explanation:
          "ingress-nginx-controller is Running 1/1 in kube-system — it serves the 502, meaning it's alive and receiving traffic.",
      },
      {
        id: "pod-crash",
        label: "Application pods are crashing",
        correct: false,
        explanation:
          "Both api pods are Running 1/1 with 0 restarts and clean logs — the app is healthy, just unreachable on the expected port.",
      },
      {
        id: "tls",
        label: "TLS certificate problem",
        correct: false,
        explanation:
          "TLS issues produce SSL errors or certificate warnings at the ingress layer, not a 502 Bad Gateway which means the upstream responded badly (refused connection).",
      },
    ],
    walkthrough: [
      { command: "kubectl get pods -o wide", why: "Pods healthy — problem is upstream of the app" },
      { command: "kubectl describe ingress api-ingress", why: "Rule forwards to svc api:8080" },
      { command: "kubectl get svc api", why: "Service port mapping: 80→8080" },
      { command: "kubectl logs api-7d5c9-a1", why: "App listens on :3000 — targetPort mismatch" },
      { command: "kubectl get endpoints api", why: "Endpoints exist but point at :8080" },
    ],
  },

  {
    slug: "rbac-forbidden",
    title: "RBAC Forbidden",
    difficulty: "advanced",
    brief:
      "A 'deployer' job that updates deployments fails with 'Forbidden'. The job runs as a dedicated ServiceAccount. Find the permission gap.",
    welcome: [
      "Connected to simulated-cluster.",
      "ALERT: deployer job failing — 'deployments.apps is forbidden'.",
      "Type 'help' for commands, 'hint' for a nudge.",
    ],
    cluster: {
      context: "simulated-cluster",
      nodes: [
        {
          name: "node-1",
          status: "Ready",
          roles: "worker",
          age: "47d",
          version: "v1.31.0",
          conditions: ["Ready            True"],
          events: [],
        },
      ],
      deployments: [],
      pods: [
        {
          ...SHARED_POD,
          name: "deployer-job-x7k2",
          status: "Error",
          ready: "0/1",
          restarts: 1,
          labels: { job: "deployer" },
          containers: [
            {
              name: "deployer",
              image: "bitnami/kubectl:1.31",
              ready: false,
              state: "Terminated",
              reason: "Error",
              exitCode: 1,
              restartCount: 1,
            },
          ],
          spec: { "serviceAccountName": "deployer-sa" },
          events: [],
          logs: {
            current: `$ kubectl rollout status deployment/web -n default
Error from server (Forbidden): deployments.apps "web" is forbidden: User "system:serviceaccount:default:deployer-sa" cannot get resource "deployments" in API group "apps" in the namespace "default"
$ kubectl apply -f /manifests/web.yaml
Error from server (Forbidden): error when retrieving current configuration: deployments.apps "web" is forbidden: User "system:serviceaccount:default:deployer-sa" cannot get resource "deployments" in API group "apps" in the namespace "default"`,
          },
        },
      ],
      services: [],
      generic: [
        {
          kind: "serviceaccounts",
          singular: "serviceaccount",
          header: ["NAME", "SECRETS", "AGE"],
          items: [
            { name: "deployer-sa", namespace: "default", columns: [["SECRETS", "0"], ["AGE", "10d"]] },
          ],
        },
        {
          kind: "roles",
          singular: "role",
          header: ["NAME", "AGE"],
          items: [
            { name: "deployer-role", namespace: "default", columns: [["AGE", "10d"]] },
          ],
          describe: {
            "deployer-role":
              "Name:         deployer-role\nNamespace:    default\nRules:\n  apiGroups: [\"\"]\n  resources: [\"pods\", \"configmaps\"]\n  verbs:     [\"get\", \"list\"]\n\nNote: the Role grants read on pods/configmaps only — it does NOT include deployments or the apps API group.",
          },
        },
        {
          kind: "rolebindings",
          singular: "rolebinding",
          header: ["NAME", "ROLE", "AGE"],
          items: [
            {
              name: "deployer-binding",
              namespace: "default",
              columns: [
                ["ROLE", "Role/deployer-role"],
                ["AGE", "10d"],
              ],
            },
          ],
          describe: {
            "deployer-binding":
              "Name:         deployer-binding\nRole:         Role/deployer-role\nSubjects:\n  - kind: ServiceAccount\n    name: deployer-sa\n    namespace: default\n\nThe binding exists and points at the right SA — the problem is the Role's rules don't include deployments.",
          },
        },
      ],
      events: {
        namespace: "default",
        lines: ["(no Warning events in default)"],
      },
    },
    hints: [
      "The pod logs show the exact error: 'cannot get resource deployments in API group apps'.",
      "Check the ServiceAccount's Role: `kubectl describe role deployer-role`.",
      "The Role grants get/list on pods and configmaps only — deployments (apps group) isn't in the rules.",
      "The RoleBinding is fine — it binds the right SA to the role. The role itself is missing the permission.",
    ],
    diagnosis: [
      {
        id: "role-missing",
        label: "The Role lacks the apps/deployments permission — RoleBinding is correct",
        correct: true,
        explanation:
          "Correct. deployer-role only allows get/list on pods+configmaps in the core API group. The job needs get+list+patch on deployments in the apps group. Fix: extend the Role's rules (least-privilege — only the verbs needed) — not bind to cluster-admin.",
      },
      {
        id: "binding-missing",
        label: "The ServiceAccount isn't bound to any role",
        correct: false,
        explanation:
          "deployer-binding exists and correctly binds deployer-sa → deployer-role. The binding isn't the problem.",
      },
      {
        id: "ns",
        label: "The job is running in the wrong namespace",
        correct: false,
        explanation:
          "The error is namespace-scoped permission denial ('in the namespace default'), not a namespace mismatch — the SA exists in default and the job targets default.",
      },
      {
        id: "api",
        label: "The API server is rejecting valid requests",
        correct: false,
        explanation:
          "The API server is working — it's correctly enforcing RBAC. 'Forbidden' is RBAC doing its job, not an API error.",
      },
    ],
    walkthrough: [
      { command: "kubectl logs deployer-job-x7k2", why: "Exact forbidden error names resource + API group" },
      { command: "kubectl describe role deployer-role", why: "Rules cover pods/configmaps only" },
      { command: "kubectl describe rolebinding deployer-binding", why: "Binding is correct — SA and role both right" },
      { command: "kubectl get serviceaccounts", why: "deployer-sa exists as expected" },
    ],
  },

  {
    slug: "rollout-stuck",
    title: "Deployment Rollout Failure",
    difficulty: "advanced",
    brief:
      "A deployment update is stuck — new pods won't go ready and the rollout deadline keeps approaching. Find why the new ReplicaSet can't come up.",
    welcome: [
      "Connected to simulated-cluster.",
      "ALERT: checkout rollout stuck at 1/4 new pods ready, progress deadline exceeded.",
      "Type 'help' for commands, 'hint' for a nudge.",
    ],
    cluster: {
      context: "simulated-cluster",
      nodes: [
        {
          name: "node-1",
          status: "Ready",
          roles: "worker",
          age: "47d",
          version: "v1.31.0",
          conditions: ["Ready            True"],
          events: [],
        },
      ],
      deployments: [
        {
          name: "checkout",
          namespace: "default",
          ready: "3/4",
          upToDate: 4,
          available: 3,
          age: "20d",
          images: "registry.internal/checkout:4.0.0 (new RS) / 3.9.2 (old)",
          events: [
            "Normal   ScalingReplicaSet  Scaled up replica set checkout-8new to 4",
            "Warning  ProgressDeadlineExceeded  ReplicaSet \"checkout-8new\" has timed out progressing",
          ],
        },
      ],
      pods: [
        {
          ...SHARED_POD,
          name: "checkout-8new-x1",
          status: "Running",
          ready: "0/1",
          restarts: 0,
          labels: { app: "checkout", "pod-template-hash": "8new" },
          containers: [
            {
              name: "checkout",
              image: "registry.internal/checkout:4.0.0",
              ready: false,
              state: "Running",
              restartCount: 0,
            },
          ],
          spec: {
            "readinessProbe": "httpGet :8081/ready — path does not exist in v4.0.0",
            "livenessProbe": "httpGet :8080/healthz",
          },
          events: [
            "Warning  Unhealthy   Readiness probe failed: Get \"http://10.244.1.7:8081/ready\": dial tcp 10.244.1.7:8081: connect: connection refused",
          ],
          logs: {
            current: `checkout 4.0.0 starting on :8080
listening on :8080
(ready endpoint moved from /ready to /healthz in 4.0.0 — no route at :8081)`,
          },
        },
        {
          ...SHARED_POD,
          name: "checkout-old-y2",
          status: "Running",
          ready: "1/1",
          restarts: 0,
          labels: { app: "checkout", "pod-template-hash": "old" },
          containers: [
            {
              name: "checkout",
              image: "registry.internal/checkout:3.9.2",
              ready: true,
              state: "Running",
              restartCount: 0,
            },
          ],
          events: [],
          logs: { current: "checkout 3.9.2 serving" },
        },
      ],
      services: [
        {
          name: "checkout",
          namespace: "default",
          type: "ClusterIP",
          clusterIp: "10.96.11.9",
          ports: "80/TCP→8080",
          endpoints: ["10.244.1.8:8080"],
        },
      ],
      generic: [],
      events: {
        namespace: "default",
        lines: [
          "12m       Warning   Unhealthy                  pod/checkout-8new-x1   Readiness probe failed: connect: connection refused",
          "5m        Warning   ProgressDeadlineExceeded   deployment/checkout   ReplicaSet \"checkout-8new\" has timed out progressing",
        ],
      },
    },
    hints: [
      "`kubectl rollout status` shows the rollout stalled — but the pods are Running, not crashing.",
      "Running but Ready=0/1 with 'connection refused' readiness failures — the probe is checking something that doesn't exist.",
      "`kubectl describe pod checkout-8new-x1` — readiness probe hits :8081/ready but the app listens on :8080.",
      "v4.0.0 changed the readiness endpoint from :8081/ready to /healthz — the deployment's probe config wasn't updated.",
    ],
    diagnosis: [
      {
        id: "probe-port",
        label: "Readiness probe targets the wrong port/path — new pods never become Ready",
        correct: true,
        explanation:
          "Correct. The probe hits :8081/ready but v4.0.0 serves readiness at :8080/healthz. Connection refused = nothing listens there → pods never Ready → new ReplicaSet stalls → old pods stay (safe). Fix: update the readiness probe to :8080/healthz.",
      },
      {
        id: "bad-image",
        label: "The new image is broken",
        correct: false,
        explanation:
          "The app starts fine and listens on :8080 — logs show a clean boot. The image works; the probe config is wrong.",
      },
      {
        id: "resources",
        label: "Insufficient node capacity for new pods",
        correct: false,
        explanation:
          "The new pods are Running — they scheduled and started. If resources were the issue they'd be Pending.",
      },
      {
        id: "netpol",
        label: "A NetworkPolicy blocks the readiness probe",
        correct: false,
        explanation:
          "Kubelet probes come from the node, not through NetworkPolicy — and 'connection refused' means nothing listens on :8081, not blocked traffic.",
      },
    ],
    walkthrough: [
      { command: "kubectl rollout status deployment/checkout", why: "Rollout stuck — pods not readying" },
      { command: "kubectl get pods -l app=checkout", why: "New pods Running but 0/1 Ready" },
      { command: "kubectl describe pod checkout-8new-x1", why: "Readiness probe failing connection refused on :8081" },
      { command: "kubectl logs checkout-8new-x1", why: "App listens on :8080, readiness moved to /healthz" },
      { command: "kubectl rollout history deployment/checkout", why: "Confirm which revision introduced the bad probe" },
    ],
  },
];

export const allSimScenarios: SimScenario[] = [...simScenarios, ...simScenariosPart2];

export function getSimScenario(slug: string): SimScenario | undefined {
  return allSimScenarios.find((s) => s.slug === slug);
}

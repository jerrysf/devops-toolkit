import { describe, expect, it } from "vitest";
import {
  formatCpu,
  formatMemory,
  parseCpu,
  parseMemory,
  summarizeWorkload,
} from "@/lib/resources";

describe("parseCpu", () => {
  it("parses millicores", () => {
    expect(parseCpu("250m")).toEqual({ ok: true, value: 250 });
  });
  it("parses whole and fractional cores", () => {
    expect(parseCpu("2")).toEqual({ ok: true, value: 2000 });
    expect(parseCpu("0.5")).toEqual({ ok: true, value: 500 });
  });
  it("rejects garbage", () => {
    expect(parseCpu("abc").ok).toBe(false);
    expect(parseCpu("").ok).toBe(false);
    expect(parseCpu("-1").ok).toBe(false);
  });
});

describe("formatCpu", () => {
  it("formats millicores", () => {
    expect(formatCpu(250)).toBe("250m");
    expect(formatCpu(1000)).toBe("1");
    expect(formatCpu(1500)).toBe("1.5");
  });
});

describe("parseMemory", () => {
  it("parses binary units", () => {
    expect(parseMemory("128Mi")).toEqual({ ok: true, value: 128 * 1024 ** 2 });
    expect(parseMemory("1Gi")).toEqual({ ok: true, value: 1024 ** 3 });
    expect(parseMemory("512Ki")).toEqual({ ok: true, value: 512 * 1024 });
  });
  it("parses decimal units distinctly from binary", () => {
    expect(parseMemory("1G").value).toBe(1000 ** 3);
    expect(parseMemory("1G").value).not.toBe(parseMemory("1Gi").value);
  });
  it("parses plain bytes", () => {
    expect(parseMemory("1048576")).toEqual({ ok: true, value: 1048576 });
  });
  it("rejects invalid input", () => {
    expect(parseMemory("lots").ok).toBe(false);
    expect(parseMemory("12XB").ok).toBe(false);
  });
});

describe("formatMemory", () => {
  it("formats clean units", () => {
    expect(formatMemory(128 * 1024 ** 2)).toBe("128Mi");
    expect(formatMemory(1024 ** 3)).toBe("1Gi");
  });
  it("falls back to decimals for non-round values", () => {
    expect(formatMemory(1536 * 1024 ** 2)).toBe("1536Mi");
  });
});

describe("summarizeWorkload", () => {
  it("sums requests across containers and replicas", () => {
    const s = summarizeWorkload(
      [
        { name: "app", cpuRequest: "100m", memoryRequest: "128Mi" },
        { name: "sidecar", cpuRequest: "50m", memoryRequest: "64Mi" },
      ],
      3,
    );
    expect(s.totals.cpuRequest).toBe(450);
    // (128Mi + 64Mi) × 3 replicas = 576Mi
    expect(s.totals.memoryRequest).toBe(576 * 1024 ** 2);
    expect(s.errors).toHaveLength(0);
  });

  it("errors when memory limit < request", () => {
    const s = summarizeWorkload(
      [{ name: "app", memoryRequest: "1Gi", memoryLimit: "512Mi" }],
      1,
    );
    expect(s.errors.some((e) => e.includes("below request"))).toBe(true);
  });

  it("warns on missing requests/limits", () => {
    const s = summarizeWorkload([{ name: "bare" }], 1);
    expect(s.warnings.length).toBeGreaterThan(0);
    expect(s.warnings.some((w) => w.includes("memory"))).toBe(true);
  });

  it("surfaces parse errors per container", () => {
    const s = summarizeWorkload(
      [{ name: "bad", cpuRequest: "lots" }],
      1,
    );
    expect(s.errors.some((e) => e.includes("bad"))).toBe(true);
  });

  it("warns on replicas>1 with no limits", () => {
    const s = summarizeWorkload(
      [{ name: "app", cpuRequest: "100m", memoryRequest: "128Mi" }],
      5,
    );
    expect(s.warnings.some((w) => w.includes("replicas > 1"))).toBe(true);
  });
});

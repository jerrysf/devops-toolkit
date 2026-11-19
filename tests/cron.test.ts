import { describe, expect, it } from "vitest";
import {
  describeCron,
  nextRuns,
  parseCronExpression,
} from "@/lib/cron";

describe("parseCronExpression", () => {
  it("accepts wildcard", () => {
    const r = parseCronExpression("* * * * *");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.fields).toHaveLength(5);
  });

  it("accepts step expressions", () => {
    const r = parseCronExpression("*/15 * * * *");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.fields[0].values).toEqual([0, 15, 30, 45]);
      expect(r.fields[0].unrestricted).toBe(false);
    }
  });

  it("accepts lists and ranges", () => {
    const r = parseCronExpression("0,30 9-17 1,15 * 1-5");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.fields[0].values).toEqual([0, 30]);
      expect(r.fields[1].values).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17]);
      expect(r.fields[2].values).toEqual([1, 15]);
      expect(r.fields[4].values).toEqual([1, 2, 3, 4, 5]);
    }
  });

  it("accepts month and weekday names case-insensitively", () => {
    const r = parseCronExpression("0 0 * jan Mon");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.fields[3].values).toEqual([1]);
      expect(r.fields[4].values).toEqual([1]);
    }
  });

  it("accepts Sunday as both 0 and 7", () => {
    for (const dow of ["0", "7", "sun"]) {
      const r = parseCronExpression(`0 0 * * ${dow}`);
      expect(r.ok).toBe(true);
    }
  });

  it("supports ranged steps", () => {
    const r = parseCronExpression("0-30/10 * * * *");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.fields[0].values).toEqual([0, 10, 20, 30]);
  });

  it("supports a/n as 'every n starting at a'", () => {
    const r = parseCronExpression("5/15 * * * *");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.fields[0].values).toEqual([5, 20, 35, 50]);
  });

  it("rejects wrong field count", () => {
    const r = parseCronExpression("0 9 * *");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0].message).toContain("5 fields");
    expect(parseCronExpression("").ok).toBe(false);
    expect(parseCronExpression("0 9 * * * *").ok).toBe(false);
  });

  it("rejects out-of-range values with field context", () => {
    const r = parseCronExpression("99 * * * *");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors[0].field).toBe("minute");
      expect(r.errors[0].message).toContain("out of range");
    }
    expect(parseCronExpression("0 25 * * *").ok).toBe(false);
    expect(parseCronExpression("0 0 32 * *").ok).toBe(false);
    expect(parseCronExpression("0 0 * 13 *").ok).toBe(false);
  });

  it("rejects reversed ranges", () => {
    const r = parseCronExpression("0 17-9 * * *");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0].message).toContain("reversed");
  });

  it("rejects zero and non-numeric steps", () => {
    expect(parseCronExpression("*/0 * * * *").ok).toBe(false);
    expect(parseCronExpression("*/x * * * *").ok).toBe(false);
  });

  it("rejects garbage tokens", () => {
    expect(parseCronExpression("foo * * * *").ok).toBe(false);
    expect(parseCronExpression("0 * * * monday").ok).toBe(false);
    expect(parseCronExpression("1--5 * * * *").ok).toBe(false);
  });

  it("rejects ? outside day fields", () => {
    expect(parseCronExpression("? * * * *").ok).toBe(false);
    expect(parseCronExpression("0 0 ? * *").ok).toBe(true);
  });
});

describe("nextRuns", () => {
  const from = new Date("2026-11-19T00:00:00"); // Thursday

  it("computes every-minute runs", () => {
    const r = parseCronExpression("* * * * *");
    if (!r.ok) throw new Error("parse failed");
    const runs = nextRuns(r.fields, 3, from);
    expect(runs).toHaveLength(3);
    expect(runs[0].getTime()).toBe(from.getTime() + 60_000);
    expect(runs[2].getTime()).toBe(from.getTime() + 3 * 60_000);
  });

  it("computes daily schedule", () => {
    const r = parseCronExpression("30 9 * * *");
    if (!r.ok) throw new Error("parse failed");
    const runs = nextRuns(r.fields, 2, from);
    expect(runs[0].getHours()).toBe(9);
    expect(runs[0].getMinutes()).toBe(30);
    expect(runs[1].getDate()).toBe(runs[0].getDate() + 1);
  });

  it("handles weekday-only schedules", () => {
    const r = parseCronExpression("0 9 * * 1-5");
    if (!r.ok) throw new Error("parse failed");
    // From Thursday: next runs Thu, Fri, then skips Sat/Sun to Monday.
    const runs = nextRuns(r.fields, 4, from);
    const days = runs.map((d) => d.getDay());
    expect(days).toEqual([4, 5, 1, 2]);
  });

  it("handles leap-day schedules within bound", () => {
    const r = parseCronExpression("0 0 29 2 *");
    if (!r.ok) throw new Error("parse failed");
    const runs = nextRuns(r.fields, 1, from); // Nov 2026 → Feb 2028 (leap year)
    expect(runs).toHaveLength(1);
    expect(runs[0].getFullYear()).toBe(2028);
    expect(runs[0].getMonth()).toBe(1);
    expect(runs[0].getDate()).toBe(29);
  });

  it("uses OR semantics for restricted dom+dow", () => {
    // "1st of month OR Monday" — POSIX behavior
    const r = parseCronExpression("0 0 1 * 1");
    if (!r.ok) throw new Error("parse failed");
    const runs = nextRuns(r.fields, 3, from); // Thu Nov 19
    const descriptions = runs.map(
      (d) => `day=${d.getDate()} dow=${d.getDay()}`,
    );
    // Should include next Monday (Nov 23) AND Dec 1st — not only days that are both.
    expect(descriptions[0]).toBe("day=23 dow=1");
  });
});

describe("describeCron", () => {
  it("summarizes a fixed-time schedule", () => {
    const r = parseCronExpression("30 8 * * 1-5");
    if (!r.ok) throw new Error();
    expect(describeCron(r.fields)).toContain("08:30");
  });

  it("summarizes every-minute schedules", () => {
    const r = parseCronExpression("* * * * *");
    if (!r.ok) throw new Error();
    expect(describeCron(r.fields)).toContain("every minute");
  });
});

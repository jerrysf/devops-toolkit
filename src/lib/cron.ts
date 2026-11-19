// Standard 5-field cron parser, validator, and explainer.
//
// Field order: minute hour day-of-month month day-of-week
//
// Supported syntax per field: `*`, `*/n`, `a`, `a-b`, `a-b/n`, `a/n`,
// comma-separated lists, and month/day names (JAN–DEC, SUN–SAT,
// case-insensitive). `?` is accepted as an alias for `*` in the
// day-of-month and day-of-week fields, matching Quartz-style usage.
//
// Day-of-week accepts 0–7 where both 0 and 7 mean Sunday, matching
// POSIX crontab behavior.

export interface CronFieldSpec {
  name: string;
  label: string;
  min: number;
  max: number;
  names?: Record<string, number>;
}

const MONTHS: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};

const WEEKDAYS: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
};

export const CRON_FIELDS: CronFieldSpec[] = [
  { name: "minute", label: "Minute", min: 0, max: 59 },
  { name: "hour", label: "Hour", min: 0, max: 23 },
  { name: "day-of-month", label: "Day of month", min: 1, max: 31 },
  { name: "month", label: "Month", min: 1, max: 12, names: MONTHS },
  { name: "day-of-week", label: "Day of week", min: 0, max: 7, names: WEEKDAYS },
];

export interface ParsedField {
  spec: CronFieldSpec;
  raw: string;
  /** Whether the field is `*` (unrestricted). */
  unrestricted: boolean;
  /** Sorted, de-duplicated list of matched values. */
  values: number[];
}

export interface CronParseError {
  field: string;
  fieldIndex: number;
  token: string;
  message: string;
}

export type CronParseResult =
  | { ok: true; fields: ParsedField[]; normalized: string }
  | { ok: false; errors: CronParseError[] };

const VALUE_RE = /^([0-9]+|[A-Za-z]{3})$/;
const ITEM_RE = /^([^-/]+)(?:-([^-/]+))?(?:\/(\d+))?$/;

function resolveValue(token: string, spec: CronFieldSpec): number | null {
  if (VALUE_RE.test(token)) {
    if (spec.names) {
      const named = spec.names[token.toUpperCase()];
      if (named !== undefined) return named;
    }
    if (/^[0-9]+$/.test(token)) {
      const n = Number.parseInt(token, 10);
      return Number.isSafeInteger(n) ? n : null;
    }
    return null;
  }
  return null;
}

function expandRange(start: number, end: number, step: number): number[] {
  const out: number[] = [];
  for (let v = start; v <= end; v += step) out.push(v);
  return out;
}

export function parseCronField(
  raw: string,
  spec: CronFieldSpec,
  fieldIndex: number,
): { field?: ParsedField; errors: CronParseError[] } {
  const errors: CronParseError[] = [];
  const fail = (token: string, message: string) =>
    errors.push({ field: spec.name, fieldIndex, token, message });

  const values = new Set<number>();
  const items = raw.split(",");

  for (const item of items) {
    const trimmed = item.trim();
    if (trimmed === "" || trimmed === "?") {
      if (trimmed === "?" && spec.name !== "day-of-month" && spec.name !== "day-of-week") {
        fail(item, `? is only allowed in day-of-month and day-of-week fields`);
        continue;
      }
      if (trimmed === "?") {
        // Quartz-style "no specific value" — equivalent to *.
        for (let v = spec.min; v <= spec.max; v++) values.add(v);
        continue;
      }
      fail(item, `Empty list item in ${spec.name} field`);
      continue;
    }

    const m = ITEM_RE.exec(trimmed);
    if (!m) {
      fail(item, `Cannot parse "${trimmed}"`);
      continue;
    }
    const [, lo, hi, stepStr] = m;
    const step = stepStr !== undefined ? Number.parseInt(stepStr, 10) : 1;
    if (stepStr !== undefined && (!Number.isInteger(step) || step <= 0)) {
      fail(item, `Step must be a positive integer, got "${stepStr}"`);
      continue;
    }

    if (lo === "*") {
      if (hi !== undefined) {
        fail(item, `Range start cannot be "*"`);
        continue;
      }
      expandRange(spec.min, spec.max, step).forEach((v) => values.add(v));
      continue;
    }

    const loV = resolveValue(lo, spec);
    if (loV === null) {
      fail(item, `"${lo}" is not a valid ${spec.name} value`);
      continue;
    }
    if (loV < spec.min || loV > spec.max) {
      fail(item, `${loV} is out of range for ${spec.name} (${spec.min}–${spec.max})`);
      continue;
    }

    if (hi === undefined) {
      if (stepStr !== undefined) {
        // a/n means every n units starting at a through the field max.
        expandRange(loV, spec.max, step).forEach((v) => values.add(v));
      } else {
        values.add(loV);
      }
      continue;
    }

    const hiV = resolveValue(hi, spec);
    if (hiV === null) {
      fail(item, `"${hi}" is not a valid ${spec.name} value`);
      continue;
    }
    if (hiV < spec.min || hiV > spec.max) {
      fail(item, `${hiV} is out of range for ${spec.name} (${spec.min}–${spec.max})`);
      continue;
    }
    if (loV > hiV) {
      fail(item, `Range ${loV}-${hiV} is reversed (start must not exceed end)`);
      continue;
    }
    expandRange(loV, hiV, step).forEach((v) => values.add(v));
  }

  if (errors.length > 0) return { errors };

  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) {
    fail(raw, `Field produced no values`);
    return { errors };
  }
  return {
    errors,
    field: {
      spec,
      raw,
      unrestricted: sorted.length === spec.max - spec.min + 1,
      values: sorted,
    },
  };
}

export function parseCronExpression(input: string): CronParseResult {
  const trimmed = input.trim().replace(/\s+/g, " ");
  const parts = trimmed === "" ? [] : trimmed.split(" ");
  const errors: CronParseError[] = [];

  if (parts.length !== 5) {
    errors.push({
      field: "expression",
      fieldIndex: -1,
      token: trimmed,
      message: `Expected 5 fields (minute hour day-of-month month day-of-week), got ${parts.length}`,
    });
    return { ok: false, errors };
  }

  const fields: ParsedField[] = [];
  parts.forEach((part, i) => {
    const { field, errors: fieldErrors } = parseCronField(part, CRON_FIELDS[i], i);
    if (field) fields.push(field);
    errors.push(...fieldErrors);
  });

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, fields, normalized: parts.join(" ") };
}

/**
 * Standard cron day-matching semantics: when both day-of-month and
 * day-of-week are restricted, a day matches if EITHER matches. When one
 * is `*`, the other alone decides. (Vixie/POSIX cron behavior.)
 */
function dayMatches(date: Date, dom: ParsedField, dow: ParsedField): boolean {
  const domHit = dom.values.includes(date.getDate());
  const dowRaw = date.getDay(); // 0=Sunday
  const dowHit = dow.values.includes(dowRaw) || (dowRaw === 0 && dow.values.includes(7));
  if (dom.unrestricted && dow.unrestricted) return true;
  if (dom.unrestricted) return dowHit;
  if (dow.unrestricted) return domHit;
  return domHit || dowHit;
}

/**
 * Compute the next `count` run times for a parsed expression, starting
 * strictly after `from`. Iterates by day (not by minute) so even rare
 * expressions like `0 0 29 2 *` resolve quickly. Bounded to ~8 years.
 */
export function nextRuns(fields: ParsedField[], count: number, from = new Date()): Date[] {
  const [minuteF, hourF, domF, monthF, dowF] = fields;
  const results: Date[] = [];
  const cursor = new Date(from);
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1); // strictly after "from"

  const maxDays = 366 * 8;
  for (let d = 0; d < maxDays && results.length < count; d++) {
    const day = new Date(cursor);
    day.setDate(day.getDate() + d);
    day.setHours(0, 0, 0, 0);

    if (!monthF.values.includes(day.getMonth() + 1)) continue;
    if (!dayMatches(day, domF, dowF)) continue;

    for (const h of hourF.values) {
      for (const m of minuteF.values) {
        const run = new Date(day);
        run.setHours(h, m, 0, 0);
        if (run >= cursor) results.push(run);
        if (results.length >= count) break;
      }
      if (results.length >= count) break;
    }
  }
  return results;
}

/** Human-readable description of a single parsed field. */
export function describeField(field: ParsedField): string {
  const { spec, raw, values, unrestricted } = field;
  const unit =
    spec.name === "minute" ? "minute"
    : spec.name === "hour" ? "hour"
    : spec.name === "day-of-month" ? "day of the month"
    : spec.name === "month" ? "month"
    : "day of the week";

  if (unrestricted) return `every ${unit}`;

  const nameOf = (v: number): string => {
    if (spec.name === "month") {
      return Object.keys(MONTHS).find((k) => MONTHS[k] === v) ?? String(v);
    }
    if (spec.name === "day-of-week") {
      const n = v === 7 ? 0 : v;
      return Object.keys(WEEKDAYS).find((k) => WEEKDAYS[k] === n) ?? String(v);
    }
    return String(v);
  };

  if (raw.startsWith("*/")) return `every ${raw.slice(2)} ${unit}s`;
  if (values.length <= 8) {
    const list = values.map(nameOf);
    const joined = list.length === 1 ? list[0] : `${list.slice(0, -1).join(", ")} and ${list.at(-1)}`;
    return `${unit} ${joined}`;
  }
  return `${values.length} ${unit}s (${raw})`;
}

/** One-line plain-English summary of the whole expression. */
export function describeCron(fields: ParsedField[]): string {
  const [minuteF, hourF] = fields;
  if (minuteF.unrestricted && hourF.unrestricted) {
    return `Runs every minute (${describeField(fields[3])}, ${describeField(fields[4])})`;
  }
  if (minuteF.unrestricted) {
    return `Runs every minute during ${describeField(hourF)}`;
  }
  const time =
    !minuteF.unrestricted && !hourF.unrestricted && minuteF.values.length === 1 && hourF.values.length === 1
      ? `at ${String(hourF.values[0]).padStart(2, "0")}:${String(minuteF.values[0]).padStart(2, "0")}`
      : `at ${describeField(minuteF)}, ${describeField(hourF)}`;
  return `Runs ${time} — ${describeField(fields[2])}, ${describeField(fields[3])}, ${describeField(fields[4])}`;
}

export const CRON_PRESETS: { label: string; expression: string }[] = [
  { label: "Every minute", expression: "* * * * *" },
  { label: "Every 5 minutes", expression: "*/5 * * * *" },
  { label: "Every 15 minutes", expression: "*/15 * * * *" },
  { label: "Hourly (at minute 0)", expression: "0 * * * *" },
  { label: "Daily at midnight", expression: "0 0 * * *" },
  { label: "Daily at 09:00", expression: "0 9 * * *" },
  { label: "Weekdays at 08:30", expression: "30 8 * * 1-5" },
  { label: "Every Sunday at 02:00", expression: "0 2 * * 0" },
  { label: "First of month at 00:00", expression: "0 0 1 * *" },
  { label: "Quarterly (Jan/Apr/Jul/Oct 1st)", expression: "0 0 1 1,4,7,10 *" },
];

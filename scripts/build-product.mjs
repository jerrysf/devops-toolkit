#!/usr/bin/env node
/**
 * Packages the Kubernetes Troubleshooting Toolkit into a customer ZIP.
 *
 *   node scripts/build-product.mjs
 *
 * Produces dist/kubernetes-toolkit-v<version>.zip containing every file
 * in products/kubernetes-toolkit/ plus a compiled printable
 * handbook.html. The ZIP encoder is dependency-free (stored entries) —
 * any extractor handles it. Re-run whenever product content changes.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "products/kubernetes-toolkit");
const DIST = join(ROOT, "dist");
const manifest = JSON.parse(readFileSync(join(SRC, "RELEASE-MANIFEST.json"), "utf8"));
const outName = `kubernetes-toolkit-v${manifest.version}.zip`;

// ── File inventory ────────────────────────────────────────────────

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const files = walk(SRC)
  .filter((f) => !f.endsWith("RELEASE-MANIFEST.json"))
  .sort();
console.log(`Packing ${files.length} files from ${relative(ROOT, SRC)}`);

// ── handbook.html — compiled printable doc ────────────────────────

function mdToHtml(md) {
  const lines = md.split("\n");
  const html = [];
  let inCode = false, inList = false, inTable = false;
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s) =>
    esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  for (const line of lines) {
    if (/^```/.test(line)) {
      if (!inCode) { html.push("<pre><code>"); inCode = true; }
      else { html.push("</code></pre>"); inCode = false; }
      continue;
    }
    if (inCode) { html.push(esc(line)); continue; }
    if (/^\|.*\|$/.test(line.trim())) {
      const cells = line.trim().slice(1, -1).split("|").map((c) => c.trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; // separator
      if (!inTable) { html.push("<table>"); inTable = true; }
      html.push(`<tr>${cells.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`);
      continue;
    }
    if (inTable) { html.push("</table>"); inTable = false; }
    if (/^- \[/.test(line) || /^- /.test(line) || /^\d+\. /.test(line)) {
      if (!inList) { html.push("<ul>"); inList = true; }
      html.push(`<li>${inline(line.replace(/^(- \[[ x]\]|-|\d+\.)\s*/, ""))}</li>`);
      continue;
    }
    if (inList) { html.push("</ul>"); inList = false; }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) html.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);
    else if (line.trim() === "") html.push("");
    else html.push(`<p>${inline(line)}</p>`);
  }
  if (inCode) html.push("</code></pre>");
  if (inList) html.push("</ul>");
  if (inTable) html.push("</table>");
  return html.join("\n");
}

const hbSections = files
  .filter((f) => f.endsWith(".md") && !/LICENSE|CHANGELOG|README/.test(f))
  .map((f) => {
    const rel = relative(SRC, f);
    return `<section><p class="src">${rel}</p>${mdToHtml(readFileSync(f, "utf8"))}</section>`;
  });

const handbook = `<!doctype html>
<html><head><meta charset="utf-8"><title>${manifest.product} — ${manifest.edition} v${manifest.version}</title>
<style>
  body{font:14px/1.6 system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;color:#1a1a2e}
  h1{font-size:26px} h2{font-size:20px;margin-top:1.6em;border-bottom:1px solid #ddd;padding-bottom:4px}
  h3{font-size:16px;margin-top:1.4em}
  code,pre{font:12.5px/1.5 "SF Mono",Menlo,Consolas,monospace;background:#f4f4f8;border-radius:4px}
  code{padding:1px 4px} pre{padding:12px;overflow-x:auto;white-space:pre-wrap}
  table{border-collapse:collapse;width:100%;font-size:13px}
  td{border:1px solid #ddd;padding:6px 10px}
  ul{padding-left:22px} li{margin:3px 0}
  .src{font:11px Menlo,monospace;color:#888;margin-top:3em;border-top:1px dashed #ccc;padding-top:8px}
  .cover{text-align:center;margin:4em 0}
  @media print{.cover{page-break-after:always}section{page-break-inside:auto}}
</style></head><body>
<div class="cover">
<h1>${manifest.product}</h1>
<p>${manifest.edition} · Version ${manifest.version} · Released ${manifest.releaseDate}</p>
<p>Compatibility: Kubernetes ${manifest.compatibility.kubernetes}, kubectl ${manifest.compatibility.kubectl}</p>
<p style="font-size:12px;color:#666">Printable handbook — use your browser's Print → Save as PDF.</p>
</div>
${hbSections.join("\n")}
</body></html>`;

// ── Minimal stored-entry ZIP writer ───────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

function zip(entries) {
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nb = Buffer.from(name, "utf8");
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8 flag
    local.writeUInt16LE(0, 8);      // stored
    local.writeUInt16LE(0, 10); local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nb.length, 26);
    local.writeUInt16LE(0, 28);
    chunks.push(local, nb, data);

    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(0x0800, 8); cen.writeUInt16LE(0, 10);
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(data.length, 20); cen.writeUInt32LE(data.length, 24);
    cen.writeUInt16LE(nb.length, 28);
    cen.writeUInt32LE(offset, 42);
    central.push(Buffer.concat([cen, nb]));
    offset += 30 + nb.length + data.length;
  }
  const cd = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8); eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cd.length, 12); eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, cd, eocd]);
}

// ── Build ─────────────────────────────────────────────────────────

mkdirSync(DIST, { recursive: true });
const entries = files.map((f) => ({
  name: `kubernetes-toolkit/${relative(SRC, f)}`,
  data: readFileSync(f),
}));
entries.push({ name: "kubernetes-toolkit/handbook.html", data: Buffer.from(handbook) });
entries.push({ name: "kubernetes-toolkit/RELEASE-MANIFEST.json", data: readFileSync(join(SRC, "RELEASE-MANIFEST.json")) });

const zipBuf = zip(entries);
const outPath = join(DIST, outName);
writeFileSync(outPath, zipBuf);
const sha = createHash("sha256").update(zipBuf).digest("hex");
console.log(`Wrote ${relative(ROOT, outPath)} (${(zipBuf.length / 1024).toFixed(0)} KB, ${entries.length} entries)`);
console.log(`SHA-256: ${sha}`);
if (!existsSync(outPath)) process.exit(1);

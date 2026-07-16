#!/usr/bin/env node
// ============================================================================
// scripts/export-protective-patterns.mjs
// ----------------------------------------------------------------------------
// Repeatable export of the Atlas of Protective Patterns from Notion into the two
// data files the runtime uses:
//
//   functions/mira/patterns-index.js  — small, always loaded. One row per
//       canonical pattern: id, name, recognition sentence (Core Logic), the
//       parsed Trigger Phrases array, and the crosswalk Aliases/Merges that
//       point at it.
//   functions/mira/patterns-full.js   — large, imported on demand only. Every
//       non-empty property plus the page-body markdown, keyed by Pattern ID.
//
// This is NOT a one-time snapshot: source data is still being filled in (the
// content-side ledger entries were pending at build time). Re-run this whenever
// Notion changes to regenerate both files.
//
// Usage:
//   NOTION_TOKEN=secret_xxx node scripts/export-protective-patterns.mjs
//   (needs:  npm i @notionhq/client)
//
// The two Notion databases (IDs are stable):
//   Canonical Patterns   — 638b9b2e-3341-4cbd-b650-84a10a5016c2
//   Terms/Crosswalk      — d4e19169-595f-45d8-8f52-5626ac009f72
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CANONICAL_DB = "638b9b2e-3341-4cbd-b650-84a10a5016c2";
const CROSSWALK_DB = "d4e19169-595f-45d8-8f52-5626ac009f72";

// Crosswalk rows we import as extra recognition terms. Two ways in:
//   1. Disposition is an outright Alias or Merge — always imported (any review state,
//      matching how these were reconciled originally).
//   2. It's a VERIFIED recognition-bearing surface form — a manifestation of a pattern
//      or a colloquial/search-language term (e.g. "Workaholism", "Workaholic"). These
//      carry a noncanonical/search disposition, but they are exactly what a person
//      types about themselves, so a verified one with a canonical destination is
//      promoted to a live alias. Gated to "Verified" to keep unreviewed rows out.
const ALIAS_DISPOSITIONS = new Set(["Alias", "Merged into Canonical Pattern"]);
const RECOGNITION_TAXONOMY = new Set([
  "Manifestation of a pattern",
  "Compound / colloquial / search-language term",
]);
// ...but never these taxonomy types — they must not be trigger-matched like an
// ordinary pattern (safety/clinical terms, traits, healthy behaviors, wounds).
const EXCLUDED_TAXONOMY = new Set([
  "Safety-framework term",
  "Symptom or diagnostic indicator",
  "Defense mechanism or clinical concept",
  "Trait or temperament",
  "Healthy behavior or contextual adaptation",
  "Core wound or learned expectation",
]);

// Does this crosswalk row become a live recognition alias? (See sets above.)
function isRecognitionAlias(p) {
  if (EXCLUDED_TAXONOMY.has(p["Taxonomy Detail"])) return false;
  if (ALIAS_DISPOSITIONS.has(p["Disposition"])) return true;
  if (p["Review Status"] === "Verified" && RECOGNITION_TAXONOMY.has(p["Taxonomy Detail"])) return true;
  return false;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "functions", "mira");

// ---- Notion property extraction -------------------------------------------
const rich = (arr) => (Array.isArray(arr) ? arr.map((t) => t.plain_text).join("") : "");
function extractProp(p) {
  if (!p) return "";
  switch (p.type) {
    case "title": return rich(p.title);
    case "rich_text": return rich(p.rich_text);
    case "url": return p.url || "";
    case "number": return p.number == null ? "" : p.number;
    case "select": return p.select ? p.select.name : "";
    case "multi_select": return (p.multi_select || []).map((o) => o.name);
    case "relation": return (p.relation || []).map((r) => r.id);
    default: return "";
  }
}
function pageProps(page) {
  const out = {};
  for (const [name, prop] of Object.entries(page.properties || {})) out[name] = extractProp(prop);
  return out;
}

// ---- Page body -> markdown -------------------------------------------------
const HEAD = { heading_1: "# ", heading_2: "## ", heading_3: "### " };
// One block's OWN text line, or "" when it carries none — e.g. a layout wrapper
// (column_list, column, synced_block, divider). Children are not read here; the
// recursive walk in blockMarkdown descends into them.
function blockLine(b) {
  const t = b.type;
  if (HEAD[t]) return HEAD[t] + rich(b[t].rich_text);
  if (t === "paragraph") return rich(b.paragraph.rich_text);
  if (t === "bulleted_list_item") return "- " + rich(b.bulleted_list_item.rich_text);
  if (t === "numbered_list_item") return "1. " + rich(b.numbered_list_item.rich_text);
  if (t === "quote") return "> " + rich(b.quote.rich_text);
  if (t === "toggle") return rich(b.toggle.rich_text);
  if (t === "callout") return rich(b.callout.rich_text);
  return "";
}
// Walk a block subtree to markdown. Recurses into EVERY block that reports
// children, so content nested under toggle-headings, columns, or synced blocks
// is captured — not only flat top-level blocks. The pattern pages nest their
// body this way, which is why the old non-recursive walk returned "" for all of
// them (every top-level block was a wrapper it emitted nothing for and never
// descended into).
export async function blockMarkdown(notion, blockId) {
  const lines = [];
  let cursor;
  do {
    const res = await notion.blocks.children.list({ block_id: blockId, start_cursor: cursor, page_size: 100 });
    for (const b of res.results) {
      const line = blockLine(b);
      if (line !== "") lines.push(line);
      if (b.has_children) {
        const inner = await blockMarkdown(notion, b.id);
        if (inner) lines.push(inner);
      }
    }
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return lines.join("\n").trim();
}

async function queryAll(notion, database_id, filter) {
  const rows = [];
  let cursor;
  do {
    const res = await notion.databases.query({ database_id, start_cursor: cursor, page_size: 100, ...(filter ? { filter } : {}) });
    rows.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return rows;
}

const parseTriggers = (s) => String(s || "").split(";").map((x) => x.trim()).filter(Boolean);
const nonEmpty = (v) => !(v === "" || v == null || (Array.isArray(v) && v.length === 0));

function writeIndex(index) {
  const body = index
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((e) => "  " + JSON.stringify(e))
    .join(",\n");
  const out =
    "// GENERATED by scripts/export-protective-patterns.mjs from Notion — do not edit by hand.\n" +
    "// Small index: always loaded. One row per canonical protective pattern.\n" +
    "export const PATTERN_INDEX = [\n" + body + "\n];\n";
  fs.writeFileSync(path.join(OUT_DIR, "patterns-index.js"), out);
}
function writeFull(full) {
  const keys = Object.keys(full).sort();
  const body = keys.map((k) => "  " + JSON.stringify(k) + ": " + JSON.stringify(full[k])).join(",\n");
  const out =
    "// GENERATED by scripts/export-protective-patterns.mjs from Notion — do not edit by hand.\n" +
    "// Large; imported dynamically on demand only. Every non-empty property plus the\n" +
    "// page-body markdown, keyed by Pattern ID.\n" +
    "export const PATTERN_FULL = {\n" + body + "\n};\n";
  fs.writeFileSync(path.join(OUT_DIR, "patterns-full.js"), out);
}

async function main() {
  const token = process.env.NOTION_TOKEN;
  if (!token) { console.error("Set NOTION_TOKEN."); process.exit(1); }
  const { Client } = await import("@notionhq/client");
  const notion = new Client({ auth: token });

  // Canonical patterns
  const patternPages = await queryAll(notion, CANONICAL_DB);
  const byPageId = {}; // notion page id -> Pattern ID
  const index = [];
  const full = {};
  for (const page of patternPages) {
    const props = pageProps(page);
    const id = props["Pattern ID"];
    const name = props["Canonical Name"];
    if (!id || !name) continue;
    byPageId[page.id] = id;
    index.push({ id, name, recognition: props["Core Logic"] || "", triggers: parseTriggers(props["Trigger Phrases"]), aliases: [] });
    const kept = {};
    for (const [k, v] of Object.entries(props)) if (k !== "url" && nonEmpty(v)) kept[k] = v;
    full[id] = { name, properties: kept, body: await blockMarkdown(notion, page.id) };
  }
  const indexById = Object.fromEntries(index.map((e) => [e.id, e]));

  // Crosswalk aliases / merges -> attach as aliases on their canonical destination
  const crossRows = await queryAll(notion, CROSSWALK_DB);
  for (const row of crossRows) {
    const p = pageProps(row);
    if (!isRecognitionAlias(p)) continue;
    const term = p["Term"];
    if (!term) continue;
    for (const destPageId of (p["Canonical Destination"] || [])) {
      const patternId = byPageId[destPageId];
      const entry = patternId && indexById[patternId];
      if (entry && !entry.aliases.includes(term)) entry.aliases.push(term);
    }
  }

  writeIndex(index);
  writeFull(full);
  const aliasCount = index.reduce((n, e) => n + e.aliases.length, 0);
  console.log(`Wrote ${index.length} patterns · ${index.reduce((n, e) => n + e.triggers.length, 0)} triggers · ${aliasCount} aliases`);
}
// Run only when invoked directly (not when imported, e.g. by a test).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => { console.error(e); process.exit(1); });
}

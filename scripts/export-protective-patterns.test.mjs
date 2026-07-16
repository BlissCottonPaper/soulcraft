#!/usr/bin/env node
// Regression test for blockMarkdown's recursion (run: node scripts/export-protective-patterns.test.mjs).
// The pattern pages nest their body under wrappers (columns / toggle-headings), so a
// non-recursive walk returned "" for all 166. These mocks prove the recursive walk
// reaches nested content while leaving flat pages unchanged. No network / token needed.

import { blockMarkdown } from "./export-protective-patterns.mjs";

function mockNotion(tree) {
  return { blocks: { children: { list: async ({ block_id }) => ({ results: tree[block_id] || [], has_more: false, next_cursor: null }) } } };
}
const rt = (s) => ({ rich_text: [{ plain_text: s }] });
const blk = (id, type, text, hasChildren) => ({ id, type, has_children: !!hasChildren, [type]: text != null ? rt(text) : {} });

// Body nested under a column_list > column layout wrapper (old walk => "").
const nested = mockNotion({
  page1: [blk("cl", "column_list", null, true)],
  cl: [blk("col", "column", null, true)],
  col: [blk("h", "heading_2", "User Reflection Prompt", false),
        blk("p", "paragraph", "Am I creating because I am alive?", false)],
});
// Toggle-heading: content nested as the heading's children.
const toggleHeading = mockNotion({
  page2: [blk("h2", "heading_2", "Skillful Response — From Within", true)],
  h2: [blk("p2", "paragraph", "Notice when output has become evidence for existence.", false)],
});
// Flat page: unchanged behavior.
const flat = mockNotion({
  page3: [blk("hh", "heading_2", "Domain", false), blk("pp", "paragraph", "Worth and Belonging", false),
          blk("b1", "bulleted_list_item", "one", false)],
});

const r1 = await blockMarkdown(nested, "page1");
const r2 = await blockMarkdown(toggleHeading, "page2");
const r3 = await blockMarkdown(flat, "page3");

let pass = true;
const check = (name, cond) => { console.log((cond ? "PASS" : "FAIL") + " — " + name); if (!cond) pass = false; };
check("nested heading captured", r1.includes("## User Reflection Prompt"));
check("nested paragraph captured", r1.includes("Am I creating because I am alive?"));
check("toggle-heading child captured", r2.includes("Notice when output"));
check("flat page unchanged", r3.includes("## Domain") && r3.includes("- one"));
console.log(pass ? "\nALL PASS" : "\nFAILURES");
process.exit(pass ? 0 : 1);

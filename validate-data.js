#!/usr/bin/env node
/* Validates data.json before it can be merged. No dependencies. Usage: node scripts/validate-data.js [path] */
const fs = require("fs"), path = require("path");
const file = process.argv[2] || "data.json", root = path.dirname(path.resolve(file));
const RE_ID = /^[A-Za-z0-9_-]{1,40}$/, RE_HEX = /^#[0-9a-fA-F]{6}$/, RE_DATE = /^\d{4}-\d{2}-\d{2}$/;
const RE_IMG = /^[A-Za-z0-9_-][A-Za-z0-9._-]{0,80}\.(?:jpe?g|png|webp)$/i;
const BLOCKS = ["note", "h3", "ul", "ol", "formula", "table", "facts"];
const errs = [], err = (m) => errs.push(m);
const isStr = (v, max = 4000) => typeof v === "string" && v.length <= max;
let d;
try {
  if (fs.statSync(file).size > 1_000_000) throw new Error("file is larger than 1 MB");
  d = JSON.parse(fs.readFileSync(file, "utf8"));
} catch (e) { console.error("FAIL: cannot read " + file + ": " + e.message); process.exit(1); }
for (const k of ["wool", "studies", "concentrates"]) if (!Array.isArray(d[k])) err(k + " must be an array");
const ids = new Set();
(d.wool || []).forEach((p, i) => {
  const n = "wool[" + i + "] " + (p && p.id);
  if (!p || !RE_ID.test(p.id)) return err(n + ": bad id");
  if (ids.has(p.id)) err(n + ": duplicate id");
  ids.add(p.id);
  ["common", "sci", "part", "mordant", "notes"].forEach((f) => { if (!isStr(p[f], 300)) err(n + ": " + f + " must be a short string"); });
  if (!Array.isArray(p.tests)) return err(n + ": tests must be an array");
  p.tests.forEach((t, j) => {
    const m = n + " test " + j;
    if (!isStr(t.aspect, 60) || !t.aspect) err(m + ": aspect required");
    if (!Number.isInteger(t.texture) || t.texture < 1 || t.texture > 7) err(m + ": texture must be an integer 1 to 7");
    if (t.date !== "" && !(isStr(t.date, 10) && RE_DATE.test(t.date))) err(m + ": date must be empty or YYYY-MM-DD");
    if (!isStr(t.notes, 500)) err(m + ": notes must be a string");
    if (!Array.isArray(t.colors) || !t.colors.length) return err(m + ": needs at least one color");
    t.colors.forEach((c, k) => {
      if (!isStr(c.l, 20) || !c.l) err(m + " color " + k + ": label required");
      if (!isStr(c.h, 7) || !RE_HEX.test(c.h)) err(m + " color " + k + ": bad hex " + JSON.stringify(c.h));
    });
  });
});
const sids = new Set();
function block(b, m) {
  if (typeof b === "string") return isStr(b) || err(m + ": text too long");
  const keys = b && typeof b === "object" ? Object.keys(b) : [];
  if (keys.length !== 1 || !BLOCKS.includes(keys[0])) return err(m + ": unknown block " + JSON.stringify(keys));
  const v = b[keys[0]];
  if (["note", "h3", "formula"].includes(keys[0])) isStr(v) || err(m + ": " + keys[0] + " must be a string");
  else if (["ul", "ol"].includes(keys[0])) (Array.isArray(v) && v.every((x) => isStr(x))) || err(m + ": " + keys[0] + " must be an array of strings");
  else if (keys[0] === "facts") (Array.isArray(v) && v.every((r) => Array.isArray(r) && r.length === 2 && r.every((x) => isStr(x)))) || err(m + ": facts must be [label, value] pairs");
  else if (!v || !Array.isArray(v.rows) || !v.rows.every((r) => Array.isArray(r) && r.every((x) => isStr(x))) || (v.head && !(Array.isArray(v.head) && v.head.every((x) => isStr(x))))) err(m + ": table needs rows (and optional head) of strings");
}
(d.studies || []).forEach((s, i) => {
  const n = "studies[" + i + "] " + (s && s.id);
  if (!s || !RE_ID.test(s.id)) return err(n + ": bad id");
  if (sids.has(s.id)) err(n + ": duplicate id");
  sids.add(s.id);
  if (s.plant && !ids.has(s.plant)) err(n + ": plant " + s.plant + " not found");
  if (!isStr(s.title, 200) || !s.title) err(n + ": title required");
  if (s.image) {
    if (!isStr(s.image, 90) || !RE_IMG.test(s.image)) err(n + ": image must be a plain file name ending in .jpg, .png or .webp");
    else if (!fs.existsSync(path.join(root, s.image))) err(n + ": image file " + s.image + " does not exist next to data.json");
  }
  if (!Array.isArray(s.sections)) return err(n + ": sections must be an array");
  s.sections.forEach((sec, j) => {
    const m = n + " section " + j;
    if (!isStr(sec.h, 200) || !sec.h) err(m + ": heading required");
    if (!Array.isArray(sec.body)) return err(m + ": body must be an array");
    sec.body.forEach((b, k) => block(b, m + " block " + k));
  });
});
if (errs.length) { console.error("FAIL: " + errs.length + " problem(s) in " + file + "\n - " + errs.join("\n - ")); process.exit(1); }
console.log("OK: " + file + " (" + d.wool.length + " plants, " + d.studies.length + " studies)");

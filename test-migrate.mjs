/* Self-check for the one-time habit migration, run with: node test-migrate.mjs
   It writes into the owner's own list, so it must add exactly what was asked,
   never duplicate, and never resurrect something they deleted. */
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
const script = html.split("<script>")[1].split("</script>")[0];
const src = script.match(/function addRequestedHabits\(text\)\{[\s\S]*?\n\}/);
if (!src) throw new Error("couldn't find addRequestedHabits in index.html");
const addRequestedHabits = new Function(src[0] + "\nreturn addRequestedHabits;")();

const current = `Read affirmations
Journal
  Brain dump
  10 ideas on one topic
Read my wins
Take vitamins
  Vitamin D
  Omega-3
  Creatine`;

const out = addRequestedHabits(current);
const lines = out.split("\n");

// the vitamins become a course, and only that line changes in place
assert.ok(lines.includes("Take vitamins @30/30"), "vitamins get the 30/30 course");
assert.equal(lines.filter(l => /^\S/.test(l) && /vitamin/i.test(l)).length, 1, "the vitamins line is changed, not duplicated");
assert.deepEqual(lines.slice(0, 9).map(l => l.replace(" @30/30", "")), current.split("\n"),
  "everything already there stays, in order");

// the new ones are appended
assert.ok(lines.includes("Пополнить список достижений"), "daily achievements");
assert.ok(lines.includes("Аскеза @30d"), "abstinence as a 30-day run");
for (const k of ["  Без кальяна", "  Без порно", "  Без лишних трат"]) assert.ok(lines.includes(k), k.trim());

// idempotent: running it on its own output changes nothing
assert.equal(addRequestedHabits(out), out, "a second pass adds nothing");

// already typed in by hand, in any wording: left alone
const typed = "Take vitamins @30/30\n  D\nAdd to my achievements\nAbstinence @30d\n  No hookah";
assert.equal(addRequestedHabits(typed), typed, "lines the owner already wrote are not added again");

// a vitamins line that already has its own schedule is not overridden
assert.ok(addRequestedHabits("Vitamins @mon,thu").startsWith("Vitamins @mon,thu\n"), "an existing schedule wins");

// sub-items named after vitamins are not mistaken for the parent
assert.ok(!addRequestedHabits("Supplements\n  Vitamin D").includes("Vitamin D @30/30"),
  "only a top-level vitamins line gets the course");

console.log("migrate: 12 checks passed");

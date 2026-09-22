/* Self-check for the 30-day focus, run with: node test-focus.mjs
   Pulls the real functions out of index.html so this can't drift from what ships. */
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
const script = html.split("<script>")[1].split("</script>")[0];
const grab = (re, what) => { const m = script.match(re); if (!m) throw new Error("couldn't find " + what); return m[0]; };
const { focusStats } = new Function([
  grab(/const iso=[^\n]+/, "iso"),
  grab(/const parseDate=[^\n]+/, "parseDate"),
  grab(/const shift=[^\n]+/, "shift"),
  grab(/const FOCUS_DAYS=[^\n]+/, "FOCUS_DAYS"),
  grab(/function focusStats\([^)]*\)\{[\s\S]*?\n\}/, "focusStats"),
].join("\n") + "\nreturn {focusStats};")();

const f = { habit: "Gym", start: "2026-09-01" };
const no = () => false, yes = () => true;
const tickedOn = (...ds) => k => ds.includes(k);

let st = focusStats(f, "2026-09-03", tickedOn("2026-09-01"), no, yes);
assert.deepEqual(st.days, ["won", "lost", "open"], "today stays open until it is ticked");
assert.equal(st.won, 1); assert.equal(st.n, 3); assert.equal(st.over, false);

st = focusStats(f, "2026-09-03", tickedOn("2026-09-01", "2026-09-03"), k => k === "2026-09-02", yes);
assert.deepEqual(st.days, ["won", "skip", "won"], "a skipped day sits out; a ticked today is won");

st = focusStats(f, "2026-09-02", no, no, k => k !== "2026-09-01");
assert.deepEqual(st.days, ["skip", "open"], "a day the habit wasn't due is not a loss");

st = focusStats(f, "2026-08-30", no, no, yes);
assert.equal(st.n, 0, "a start in the future has no days yet");

st = focusStats(f, "2026-10-15", yes, no, yes);
assert.equal(st.n, 30, "capped at thirty days"); assert.equal(st.over, true); assert.equal(st.won, 30);

console.log("focus: 5 checks passed");

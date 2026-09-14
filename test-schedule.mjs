/* Self-check for habit schedules, run with: node test-schedule.mjs
   Pulls the real functions out of index.html so this can't drift from what ships. */
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
const script = html.split("<script>")[1].split("</script>")[0];

const grab = (re, what) => {
  const m = script.match(re);
  if (!m) throw new Error("couldn't find " + what + " in index.html");
  return m[0];
};
const source = [
  grab(/const DOW=\[[^\]]+\];/, "DOW"),
  grab(/const iso=[^\n]+/, "iso"),
  grab(/const parseDate=[^\n]+/, "parseDate"),
  grab(/const shift=[^\n]+/, "shift"),
  grab(/const DOWKEY=\{[^}]+\};/, "DOWKEY"),
  grab(/function parseSched\(name\)\{[\s\S]*?\n\}/, "parseSched"),
  grab(/function parseTree\(raw,scheduled\)\{[\s\S]*?\n\}/, "parseTree"),
  grab(/const leavesOf=tree=>[\s\S]*?\n  : \[h\]\);/, "leavesOf"),
  grab(/function weekDays\(s\)\{[\s\S]*?\n\}/, "weekDays"),
  grab(/function dueOn\(it,s,habitsFor\)\{[\s\S]*?\n\}/, "dueOn"),
].join("\n");

const { parseSched, parseTree, leavesOf, dueOn, weekDays } =
  new Function(source + "\nreturn {parseSched,parseTree,leavesOf,dueOn,weekDays};")();

// 2026-09-14 is a Monday
const MON = "2026-09-14", TUE = "2026-09-15", WED = "2026-09-16", SUN = "2026-09-20";
const none = () => ({});

// --- parsing: the schedule leaves the name, so history keys stay stable ---
assert.deepEqual(parseSched("Sauna @mon,thu"), { name: "Sauna", sched: { type: "days", days: [1, 4] } });
assert.deepEqual(parseSched("Long run @2x"), { name: "Long run", sched: { type: "week", n: 2 } });
assert.deepEqual(parseSched("Read affirmations"), { name: "Read affirmations", sched: null });
assert.deepEqual(parseSched("Email @home stuff"), { name: "Email @home stuff", sched: null }, "only a trailing @token is a schedule");
assert.equal(parseSched("Sauna @mon,thu").name, parseSched("Sauna @tue").name, "changing the schedule must not change the key");

// --- fixed days ---
const sauna = leavesOf(parseTree("Sauna @mon,thu", true))[0];
assert.equal(sauna.key, "Sauna", "key excludes the schedule");
assert.equal(dueOn(sauna, MON, none), true, "due on Monday");
assert.equal(dueOn(sauna, TUE, none), false, "not due on Tuesday");
assert.equal(dueOn(sauna, TUE, d => (d === TUE ? { Sauna: true } : {})), true,
  "a habit ticked off-schedule still shows, so it can be un-ticked");

// --- weekly quota ---
const run = leavesOf(parseTree("Long run @2x", true))[0];
assert.equal(dueOn(run, MON, none), true, "nothing done yet this week");
assert.equal(dueOn(run, WED, d => (d === MON ? { "Long run": true } : {})), true, "one of two done");
const twice = d => (d === MON || d === TUE ? { "Long run": true } : {});
assert.equal(dueOn(run, WED, twice), false, "quota met — stops asking for the rest of the week");
assert.equal(dueOn(run, "2026-09-21", twice), true, "next Monday starts a fresh week");

// --- weeks run Monday to Sunday ---
assert.deepEqual(weekDays(SUN)[0], MON, "Sunday belongs to the week that began Monday");
assert.deepEqual(weekDays(MON)[6], SUN);
assert.equal(dueOn(run, SUN, twice), false, "Sunday is inside the week whose quota is met");

// --- sub-items inherit the parent's schedule, but can override it ---
const tree = parseTree("Gym @mon,wed\n  Squats\n  Bench @tue", true);
const kids = leavesOf(tree);
assert.deepEqual(kids.map(k => k.key), ["Gym/Squats", "Gym/Bench"]);
assert.equal(dueOn(kids[0], MON, none), true, "inherited: due Monday");
assert.equal(dueOn(kids[0], TUE, none), false, "inherited: not due Tuesday");
assert.equal(dueOn(kids[1], TUE, none), true, "own schedule wins over the parent's");
assert.equal(dueOn(kids[1], MON, none), false);

// --- an unscheduled habit is simply daily ---
const daily = leavesOf(parseTree("Read affirmations", true))[0];
for (const d of [MON, TUE, WED, SUN]) assert.equal(dueOn(daily, d, none), true);

// --- workout lines are not schedule-parsed; an @ there is just text ---
assert.equal(parseTree("Ride @zone2", false)[0].name, "Ride @zone2");

console.log("schedule: 20 checks passed");

/* --- a day only counts toward the streak if something was actually done --- */
const isKept = new Function(
  (html.split("<script>")[1].split("</script>")[0]).match(/const isKept=[^\n]+/)[0] + "\nreturn isKept;"
)();
assert.equal(isKept(7, 6, 1), true, "one miss inside the allowance");
assert.equal(isKept(7, 5, 1), false, "two misses is a break");
assert.equal(isKept(1, 0, 1), false, "a blank day never counts, even when the allowance covers it");
assert.equal(isKept(0, 0, 1), false, "no habits due is not a kept day");
assert.equal(isKept(3, 3, 0), true, "a perfect day with no allowance");
console.log("streak: 5 checks passed");

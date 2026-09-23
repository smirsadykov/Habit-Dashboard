# Day Desk

A personal daily dashboard: habits, tasks, training and projects, one day at a time.
Static files, no build step, no dependencies. Installable as a PWA and works offline.

## What's in it

| Block | What it does |
|---|---|
| Affirmation | A standing line across the top of every day |
| Focus | One habit for thirty days: a strip of the days so far, won or lost |
| Habits | Nested checkboxes, per-habit schedules, skippable days, a streak that tolerates N misses |
| Tasks | Written on a day, carried until ticked; every task belongs to a project |
| Workout | Today's items from a weekly plan |
| Projects | Status (Active / On hold / Done), open count, last touched |
| Month | Habit completion and training days at a glance; click a day to open it |

## Habits

One per line in Setup; indent two spaces for a sub-item, and the parent ticks itself
once its sub-items are done.

```
Read affirmations           every day
Sauna @mon,thu              only those weekdays
Long run @2x                twice a week, any days
Take vitamins @30/30        a course: 30 days on, 30 days off, repeating
  Vitamin D
  Omega-3
Abstinence @30d             a run: 30 days held without a break
  No hookah                 each sub-item keeps its own run
Gym @mon,wed                a schedule on a parent is inherited by its sub-items
  Squats
  Bench @tue                unless the sub-item sets its own
```

A habit that isn't wanted today still shows, greyed and out of the count, with the
reason beside it (`mon thu`, `1 left this week`, `break · 27 days left`). Weeks run
Monday to Sunday.

A **run** (`@30d`) is for abstinence: it asks every day and counts the days held
without a break, shown as `day 12 of 30`. One slip and the count starts again;
a day marked **Skip this day** bridges the run instead of ending it. Sub-items
inherit the length but each keeps its own count, so breaking one doesn't reset
the others.

A **course** (`@30/30`, or any on/off pair) counts from the first day you ticked it,
so it starts when you actually start. Sub-items share their parent's course — three
vitamins first ticked on three different days still run as one course, off the
earliest of them. To move the start, tick the habit on the day you want it to begin.

**Focus** picks one habit and a start date in Setup. It sits under the affirmation
with a strip of the thirty days: green when ticked, red when it was due and missed,
grey when the day was skipped or the habit wasn't due. When the strip fills, pick
the next one. `node test-focus.mjs` checks the counting.

**Skip this day** marks a day neutral — ill, travelling. The streak passes straight
through it: it costs nothing and earns nothing.

**Rewording** a habit carries its history with it, as long as you don't add or
remove lines in the same edit. Change the wording, save, then add new habits.

## Tasks

A task belongs to the day you wrote it on and stays on the list every day after
that until you tick it — nothing is stranded on a day you skipped past. Carried
tasks show their age (`5d`) so a stale one is obvious.

Ticking records the day you finished it: that is the day it stops carrying
forward, and the last day it appears on, so it doesn't vanish under your finger.

## Running it

Any static file server. Locally:

```bash
python3 -m http.server 8080
```

Then <http://localhost:8080>. A service worker needs `http://` or `https://` —
opening `index.html` as a `file://` URL works, but without offline caching or install.

## Installing

- **iOS** — open in Safari, Share → *Add to Home Screen*
- **Android / desktop Chrome** — the install prompt in the address bar

## Where the data lives

`localStorage`, in the browser you're using. **Nothing you tick is in this
repository and nothing is sent anywhere** — this repo is the app, not your
history. It works offline, with no account and no server.

Setup → **Backup** exports everything as one JSON file and imports it back. That
is how you move to a new phone, switch browsers, or keep a copy somewhere safe.

### Optional: syncing across devices

If you'd rather not move a file by hand, Setup → *Sync via GitHub* points the app at
a repository of your own. Every device holding that repository and a token shares one
`data/daydesk.json`, read on load and written a few seconds after any change.

It **must be a private repository — not this public one.** The app checks on every
sync and refuses to write to a public repo, because that file is your whole history.

1. Create a separate **private** repo.
2. Create a **fine-grained personal access token** scoped to that repo only, with
   **Contents: Read and write** and nothing else.
3. Paste the repo (`owner/name`), branch, and token into Setup.

The token is held in that browser's `localStorage`, never in this repository and
never in the page. Treat each device as holding a key to that private repo, and
revoke the token if you lose the device.

**Merging** is per document. The file carries the time each document was last
written; on each sync the newer side wins that document. Two devices editing
different days both survive; two devices editing the *same* day is
last-writer-wins on that day. `node test-merge.mjs` checks this against the
shipped code, as `node test-schedule.mjs` does for schedules. Both read the
functions straight out of `index.html`, so they can't drift from what ships.

Setup → Backup also exports and imports everything as JSON, with no GitHub involved.

The same `index.html` runs as a Claude artifact too, where it uses the artifact's own
store and skips GitHub entirely. It picks whichever is available at load.

## Shipping a change

Edit `index.html`, then bump `CACHE` in `sw.js`. The page is fetched network-first,
so an online device gets the new version on its next open; the cache is only the
offline fallback. Bumping `CACHE` is what refreshes the icons, manifest and fonts,
and a device that picks up a new worker reloads itself once to apply it.

A copy installed before this behaviour existed is still serving its old cache. Open
the site in the browser (not the installed app), reload twice, and it will catch up.

## Layout

```
index.html              the whole app: markup, styles, logic
manifest.webmanifest    name, icons, standalone display
sw.js                   offline cache for the app shell + fonts
icon-*.png              generated app icons
test-merge.mjs          self-check for the sync merge
test-schedule.mjs       self-check for habit schedules
data/                   only if you turn sync on, and never in this repo
```

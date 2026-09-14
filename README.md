# Day Desk

A personal daily dashboard: habits, tasks, training and projects, one day at a time.
Static files, no build step, no dependencies. Installable as a PWA and works offline.

## What's in it

| Block | What it does |
|---|---|
| Affirmation | A standing line across the top of every day |
| Habits | Nested checkboxes, per-habit schedules, skippable days, a streak that tolerates N misses |
| Tasks | Per-day list; every task belongs to a project; open tasks can be moved forward |
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
Gym @mon,wed                a schedule on a parent is inherited by its sub-items
  Squats
  Bench @tue                unless the sub-item sets its own
```

A habit that isn't wanted today still shows, greyed and out of the count, with the
reason beside it (`mon thu`, `1 left this week`). Weeks run Monday to Sunday.

**Skip this day** marks a day neutral — ill, travelling. The streak passes straight
through it: it costs nothing and earns nothing.

**Rewording** a habit carries its history with it, as long as you don't add or
remove lines in the same edit. Change the wording, save, then add new habits.

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

`localStorage`, on the device you're using — the app works fully offline with no
account and no server.

### Syncing across devices

Setup → *Sync via GitHub* points the app at this repo. Every device holding the repo
and a token shares one file, `data/daydesk.json`, which the app reads on load and
writes a few seconds after any change.

1. Create a **fine-grained personal access token** scoped to this repository only,
   with **Contents: Read and write** and nothing else.
2. Paste the repo (`owner/name`), branch, and token into Setup.

The token is held in that browser's `localStorage` and never committed — treat each
device as holding a key to this repo, and revoke the token if you lose the device.

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

Edit `index.html`, then bump `CACHE` in `sw.js` — installed copies keep serving the
old shell from cache until that version string changes.

## Layout

```
index.html              the whole app: markup, styles, logic
manifest.webmanifest    name, icons, standalone display
sw.js                   offline cache for the app shell + fonts
icon-*.png              generated app icons
test-merge.mjs          self-check for the sync merge
test-schedule.mjs       self-check for habit schedules
data/daydesk.json       created by the first sync
```

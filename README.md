# Day Desk

A personal daily dashboard: habits, tasks, training and projects, one day at a time.
Static files, no build step, no dependencies. Installable as a PWA and works offline.

## What's in it

| Block | What it does |
|---|---|
| Affirmation | A standing line across the top of every day |
| Habits | Nested daily checkboxes with a streak that tolerates N misses |
| Tasks | Per-day list; every task belongs to a project; open tasks can be moved forward |
| Workout | Today's items from a weekly plan |
| Projects | Status (Active / On hold / Done), open count, last touched |
| Month | Habit completion and training days at a glance; click a day to open it |

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

`localStorage`, on the device you're using. Nothing leaves the browser and there is
no server, which also means **no sync between devices**. Setup → Backup exports the
whole thing as JSON and imports it back, which is how you move to a new phone.

The same `index.html` also runs as a Claude artifact, where it uses the artifact's
own store instead and does sync. It picks whichever is available at load.

## Shipping a change

Edit `index.html`, then bump `CACHE` in `sw.js` — installed copies keep serving the
old shell from cache until that version string changes.

## Layout

```
index.html              the whole app: markup, styles, logic
manifest.webmanifest    name, icons, standalone display
sw.js                   offline cache for the app shell + fonts
icon-*.png              generated app icons
```

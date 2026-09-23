# Day Desk — moved

Day Desk is now the **«День»** tab of Гиря:

- App: <https://smirsadykov.github.io/KB-daily/>
- Code: <https://github.com/smirsadykov/KB-daily> — `day/` holds this app, its tests, and its old README.

Nothing needs moving: both apps are served from smirsadykov.github.io and share one
localStorage, so everything ticked here shows up in «День» as it is.

This repository now only redirects. `index.html` sends visitors on; `sw.js` retires an
installed copy's worker and offline cache (this app's only) the next time it checks for
an update. The full history of Day Desk is in this repository's git log.

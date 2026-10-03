# Embedded dinosaur runner

Vendored from https://github.com/devfolioco/t-rex-runner-game at commit
`5c438cf67ce26ea4ef355545c5d1d700067b9863` (Chromium 2024 extraction).

Only the core JavaScript modules, two sprite sheets, and the three game sounds
are included. Audio was decoded from the upstream HTML into Ogg assets.
The upstream demo, custom font, configuration UI, and site styles are excluded.

Local adaptations in `resources/dino_game/offline.js`:

- Inject preloaded sprite and sound URLs instead of requiring global resource IDs.
- Select sprite density consistently with engine coordinates across display changes.
- Keep shared engine state in an ES module instead of `window.Runner`.
- Bind controls to the game viewport and keep layout and night mode inside it.
- Skip the stylesheet-inserting intro; remove unused fullscreen, enterprise,
  Chromium profile, global resource and gamepad branches.
- Track event handlers and dispose animation frames, touch overlays,
  pending audio fetches and audio contexts when exiting.
- Report both the raw high score and the completed run's visible score through
  the adapter; no Chromium globals.
- Report score changes, including the reset on restart, so the adapter can
  reveal a small black cube after the current run passes the memory threshold.
- Detect Safari/iPad touch devices in `constants.js`.

`src/games/createDinoRunner.ts` loads and tints sprites for the active homepage
color, observes the available width, and saves the high score locally.
The adapter's ResizeObserver is the only resize listener; the engine does not
also poll the window size.
Only one session is active. The entire adapter is loaded on demand.

The BSD 3-Clause license and original source notices are retained. A copy of
`LICENSE` is distributed at `public/licenses/dino-BSD-3-Clause.txt`.

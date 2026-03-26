# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Formula Visualization ("公式可视化") — a client-side math equation visualizer built with vanilla JS + HTML5 Canvas, packaged as an Electron desktop app. No backend, no database, no external APIs. See `docs/README.md` and `docs/DEVELOPMENT.md` for full feature docs.

### Running the application

- **Electron (desktop):** `npm start` (requires a display; use `Xvfb :99 -screen 0 1280x1024x24 &` and `export DISPLAY=:99` in headless environments). GPU/bus errors in logs are expected and harmless in headless mode.
- **Web version:** Serve `src/` with any static HTTP server, e.g. `python3 -m http.server 8080 --directory src`, then open `http://localhost:8080`.
- The web version is the easiest way to manually test UI changes in a Cloud Agent environment.

### Tests

- `npm test` runs `scripts/test/test.js`, which is a browser-only test harness — it exits silently under Node.js because the `parseFormula` function is defined in `src/script.js` (browser context).
- To run formula-parsing tests end-to-end, open `scripts/test/test.html` in a browser or use the Electron app's dev console.

### Lint / Build

- No linter is configured in this project.
- `npm run build` runs `scripts/build/build.js` (packaging script).
- `npm run build:linux` builds a Linux distributable via `electron-builder`.

### Key gotchas

- The Electron `BrowserWindow` is created with `show: false` and only shown on `ready-to-show`, so screenshots taken too early may show a blank window.
- `src/script.js` is a single ~4300-line file containing all core logic; there is no module bundler.

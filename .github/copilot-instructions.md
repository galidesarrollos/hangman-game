# Copilot / AI Agent Instructions for hangman-game

This Ionic + Angular app (output: `www/`) uses Capacitor for native builds and AdMob for ads. Follow these focused guidelines to be productive quickly.

- **Big picture:** Single-page Ionic Angular app. Core logic lives in `src/app/services` and UI in `src/app/components`. Build artifacts target `www/` (see `angular.json` -> `projects.app.architect.build.options.outputPath`).

- **Key files to inspect:**
  - [src/app/services/game.service.ts](src/app/services/game.service.ts#L1-L120) — central game state (`BehaviorSubject<GameState>`), public `GameState$` observable.
  - [src/app/services/words.service.ts](src/app/services/words.service.ts#L1-L120) — in-memory word lists keyed by `${theme}-${level}`; returns uppercase words.
  - [src/app/services/admob.service.ts](src/app/services/admob.service.ts#L1-L200) — AdMob wrapper; `initialize()` is called from `AppComponent`.
  - [src/app/services/audio.service.ts](src/app/services/audio.service.ts#L1-L200) — preloads `assets/sounds/*.mp3` and exposes `playSound()` and volume control.

- **Architecture / patterns:**
  - Services are provided in root and used by components via DI. Prefer updating behavior through service APIs (e.g., `GameService.iniciarNuevoJuego()`), not manipulating component state directly.
  - Game state uses `Set<string>` for guessed/failed letters — templates convert to arrays via `Array.from()` (see `GameComponent.obtenerLetrasArray`).
  - Spanish naming is used widely (variables, methods). Expect method names like `iniciarNuevoJuego`, `adivinarLetra`.

- **Build / run / test commands:**
  - Local dev: `npm run start` (runs `ng serve`, default dev config).
  - Build production: `npm run build` (outputs to `www/`).
  - Watch build: `npm run watch`.
  - Tests: `npm test` (Karma).
  - Lint: `npm run lint`.
  - Capacitor native workflows: project contains `android/` and `ios/` folders. Use standard Capacitor commands (`npx cap sync`, `npx cap open android`) after `npm run build`.

- **Project-specific conventions:**
  - Word lists live in `WordsService` (not externalized). Add or modify word pools by editing `src/app/services/words.service.ts` and watch for accented characters — the code uppercases them.
  - Audio assets expected at `src/assets/sounds/` and referenced directly by `new Audio('assets/sounds/...)`.
  - AdMob IDs are hard-coded in `AdmobService`; `isTesting` flags may be toggled in that file.
  - UI components are grouped under `src/app/components` by feature (`game`, `level`, `start`, etc.). Use existing patterns when adding new components (Ionic + standalone imports in components).

- **Integration & runtime notes:**
  - `AppComponent.initializeApp()` awaits `Platform.ready()` and calls `AdmobService.initialize()` — initialization order matters on devices.
  - `GameService` triggers ads in game lifecycle methods (`showBannerBottomCenter`, `showInterstitial`) — be cautious when changing those calls.

- **When you edit code:**
  - Run `npm run build` to produce `www/`. If testing on device/emulator, run `npx cap sync` then `npx cap open android`.
  - Preserve Spanish identifiers and existing API shapes (`GameService` public methods and `GameState` interface) to avoid breaking multiple components.

If any area above is unclear or you want more detail (routing, a specific component, or adding new themes/levels), tell me which section to expand. I'll adjust the instructions accordingly.

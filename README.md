# Bowl

Fishbowl-style party game built with Expo, React Native, and TypeScript.
The app is local-first (no backend/auth) and optimized for maintainability with clear game-domain boundaries.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npm start
   ```

Then open in iOS simulator, Android emulator, or Expo Go.

## Quality checks

- `npm run lint` - ESLint for app source (`src/**/*.{ts,tsx}`)
- `npm run typecheck` - TypeScript `--noEmit`
- `npm run test:unit` - game-domain unit tests (Node test runner)
- `npm run format` - Prettier

## Project structure

Expo Router uses the `src/` layout for routes.

- `src/app/` - route entry files and root layout only
- `src/screens/` - screen orchestration
- `src/screens/game/` - Game screen subcomponents/hooks (`GamePlayView`, modals, timers, particles)
- `src/components/` - reusable UI primitives
- `src/game/models.ts` - domain types
- `src/game/engine.ts` - pure helpers, selectors, and migration logic
- `src/game/commands/` - pure state transition commands
- `src/game/selectors/` - pure derived-state selectors
- `src/state/gameStore.ts` - Zustand store orchestration and persistence wiring
- `src/storage/` - AsyncStorage adapters
- `src/theme/` - design tokens/motion values
- `src/navigation/` - route constants (`ROUTES`)
- `src/utils/` - shared utilities
- `tests/unit/` - domain unit tests
- `.github/workflows/quality.yml` - CI (lint + typecheck + unit tests)

See [ARCHITECTURE.md](./ARCHITECTURE.md) for boundaries, invariants, and change guidance.

## Debug logging

The app uses `[Bowl]` logs for lifecycle and key actions:

- Root layout mount/hydration
- Route mount/unmount
- Screen-level actions (home/settings/new game/game)
- Store actions (session lifecycle and turn actions)

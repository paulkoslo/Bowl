# src – Application code

All Bowl app code lives under `src/`. Expo Router uses **src/app/** as the route directory (file-based routing). See [Expo Router: Top-level src directory](https://docs.expo.dev/router/reference/src-directory/).

- **app/** – Routes and root layout only. Every file here is a route or layout; do not put non-route code here.
- **screens/** – Screen components used by route files in `app/`.
- **components/** – Reusable UI.
- **game/** – Domain models and game logic.
- **state/** – Global state (Zustand).
- **storage/** – Persistence (stub).
- **theme/** – Spacing, typography, colors.
- **navigation/** – Route path constants (`ROUTES`).
- **utils/** – Shared helpers.
- **assets/** – Local assets.

Path alias: `@/` → `src/` (e.g. `import { HomeScreen } from '@/screens'`).

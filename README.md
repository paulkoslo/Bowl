# Bowl

Fishbowl-style party game. Built with Expo, React Native, and TypeScript. Local-first (no backend or auth for now).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

Then open in iOS simulator, Android emulator, or Expo Go.

## Project structure

Expo Router supports two layouts: **app at project root** or **everything under src with src/app for routes**. Bowl uses the **src** layout so all app code lives in one place. See [Expo Router: Top-level src directory](https://docs.expo.dev/router/reference/src-directory/).

- **src/app/** – **Only** Expo Router routes and layout (file-based routing)
  - `_layout.tsx` – root layout and stack
  - `index.tsx` – Home route (`/`)
  - `new-game.tsx`, `game.tsx`, `settings.tsx` – other routes
- **src/screens/** – Screen components (HomeScreen, NewGameScreen, etc.); imported by route files
- **src/components/** – Reusable UI (ScreenContainer, PrimaryButton, SecondaryButton)
- **src/game/** – Domain models (Team, Player, Card, GameSession, etc.)
- **src/state/** – Zustand game store
- **src/storage/** – Persistence stub (for resume later)
- **src/theme/** – Spacing, typography, colors
- **src/navigation/** – Route path constants (e.g. `ROUTES.HOME`)
- **src/utils/** – Shared utilities
- **src/assets/** – Local assets (placeholder)

Config files (`app.json`, `package.json`, `tsconfig.json`) stay in the **project root**. There is no top-level `app/` folder; routes live only in `src/app/`.

## Debugging

The app logs `[Bowl]` messages at important steps so you can see where things run or break:

- **RootLayout** – when the navigation stack mounts
- **Route: index / new-game / game / settings** – when each route screen mounts/unmounts
- **HomeScreen, NewGameScreen, GameScreen, SettingsScreen** – when each screen component mounts and when you tap buttons (e.g. “New Game pressed”, “Start Game pressed”)
- **gameStore** – when `createGame()` or `resetGame()` is called (with game id when relevant)

In the Metro/Expo terminal or your device’s dev tools, filter or search for `[Bowl]` to see only these logs.

## Scripts

- `npm start` – Start dev server
- `npm run lint` – Run ESLint
- `npm run format` – Format with Prettier

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)

# src - Application code

All Bowl app code lives under `src/`.
Expo Router uses `src/app/` as the route directory.

## Top-level folders

- `app/` - routes and layout only (no domain/business logic)
- `screens/` - route-facing screen orchestration
- `components/` - reusable UI building blocks
- `game/` - domain types, rules, migration, commands, selectors
- `state/` - Zustand orchestration and side-effect wiring
- `storage/` - persistence adapters
- `theme/` - design tokens and motion constants
- `navigation/` - route constants
- `utils/` - shared helpers

## Game domain split

- `game/models.ts` - canonical data model
- `game/engine.ts` - pure helpers + migration
- `game/commands/` - pure game-state transitions
- `game/selectors/` - pure derived-state reads

This separation keeps UI, persistence, and game rules independently editable.

## Path alias

`@/` maps to `src/`.

Example:

```ts
import { useGameStore } from '@/state';
```

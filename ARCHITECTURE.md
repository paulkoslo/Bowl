# Architecture

This document defines module boundaries, game-state invariants, and where to make changes safely.

## Layered boundaries

1. `src/app` (routing)
- Owns Expo Router files only.
- Must not contain business logic.

2. `src/screens` (screen orchestration)
- Coordinates UI components and store actions.
- Can call selectors from `src/game/selectors`.
- Should avoid embedding game-rule logic.

3. `src/state` (app orchestration)
- Owns Zustand state and persistence side effects.
- Delegates game transitions to pure commands in `src/game/commands`.

4. `src/game` (pure domain)
- `models.ts`: canonical game types.
- `commands/`: pure transitions (`GameSession -> GameSession`).
- `selectors/`: pure derived reads.
- `engine.ts`: migration and helper functions.
- Must not import UI, router, or storage.

5. `src/storage` (I/O boundary)
- AsyncStorage adapters only.
- Hydration always passes through `migrateSession`.

## Key invariants

1. `GameSession` has exactly two teams in normal play.
- Team IDs are used as map keys in `phaseState` and scores.

2. Phase completion is determined by `mainBowl` emptiness.
- `isPhaseComplete` is the single rule for phase completion.

3. Pass behavior is deterministic.
- `pass` credits the other team's bowl (`scoredByTeam[otherTeamId]`).

4. Phase results are snapshotted when a phase completes.
- `phaseResults[phase]` stores finalized counts.
- If missing in legacy data, migration backfills from phase state.

5. Undo operates only on in-turn action history.
- `turn.history` stores actionable transitions.
- Undo must fail safely if state/history drift is detected.

6. Migration is defensive.
- Older schemas (`drawPileByTeam`, legacy fields) are normalized in `migrateSession`.

## Change map

1. Change game rules (pass/got-it/undo/phase transitions)
- Edit `src/game/commands/turnCommands.ts`.
- Add/update tests in `tests/unit/game-commands.test.cjs`.

2. Change new-session setup defaults
- Edit `src/game/commands/sessionCommands.ts`.

3. Change derived scoreboard/turn read behavior
- Edit `src/game/selectors/*`.

4. Change storage keying or persistence behavior
- Edit `src/storage/gameStorage.ts`.
- Keep migration compatibility in `src/game/engine.ts`.

5. Change Game screen layout/UX
- Edit `src/screens/game/*` first.
- Keep `src/screens/GameScreen.tsx` as orchestration shell.

6. Change navigation paths
- Edit `src/navigation/index.ts` (`ROUTES`).
- Avoid hard-coded route strings in screens.

## Testing strategy

- Unit tests focus on pure domain logic (commands/selectors/migration).
- CI workflow (`.github/workflows/quality.yml`) runs:
  1. `npm run lint`
  2. `npm run typecheck`
  3. `npm run test:unit`

## AI-agent guidance

1. Start with this order when debugging:
- `src/game/models.ts`
- `src/game/commands/*`
- `src/state/gameStore.ts`
- `src/screens/GameScreen.tsx` and `src/screens/game/*`

2. Prefer pure command changes over in-screen logic patches.

3. Add/adjust unit tests for every rule change before touching UI behavior.

4. Keep side effects (`router`, `Alert`, storage writes) out of `src/game/*`.

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  advancePhaseIfCompleteCommand,
  dismissPhaseCompleteModalCommand,
  gotItCommand,
  passCommand,
  startTurnCommand,
  undoCommand,
} = require('../../.tmp/unit/src/game/commands/turnCommands.js');
const { migrateSession } = require('../../.tmp/unit/src/game/engine.js');
const {
  selectCanUndo,
  selectCurrentCard,
  selectIsTurnRunning,
} = require('../../.tmp/unit/src/game/selectors/turnSelectors.js');

function buildSession(overrides = {}) {
  const teamA = 'team-a';
  const teamB = 'team-b';

  return {
    id: 'session-1',
    createdAt: 1,
    teams: [
      { id: teamA, name: 'A', score: 0 },
      { id: teamB, name: 'B', score: 0 },
    ],
    players: [
      { id: 'player-a', name: 'Player A', teamId: teamA },
      { id: 'player-b', name: 'Player B', teamId: teamB },
    ],
    deck: [
      { id: 'c1', text: 'Alpha' },
      { id: 'c2', text: 'Beta' },
    ],
    phase: 'describe',
    turn: null,
    settings: { turnSeconds: 60 },
    phaseState: {
      describe: {
        mainBowl: ['c1', 'c2'],
        passedToTeam: { [teamA]: [], [teamB]: [] },
        scoredByTeam: { [teamA]: [], [teamB]: [] },
      },
      oneWord: {
        mainBowl: ['c1', 'c2'],
        passedToTeam: { [teamA]: [], [teamB]: [] },
        scoredByTeam: { [teamA]: [], [teamB]: [] },
      },
      charades: {
        mainBowl: ['c1', 'c2'],
        passedToTeam: { [teamA]: [], [teamB]: [] },
        scoredByTeam: { [teamA]: [], [teamB]: [] },
      },
    },
    phaseResults: {
      describe: null,
      oneWord: null,
      charades: null,
    },
    gameStatus: 'playing',
    ...overrides,
  };
}

test('start -> gotIt -> undo roundtrip keeps state consistent', () => {
  const initial = buildSession();
  const started = startTurnCommand(initial, 1000);

  assert.equal(started.changed, true);
  assert.equal(started.session.turn.activeTeamId, 'team-a');
  assert.equal(started.session.turn.currentCardId, 'c1');
  assert.deepEqual(started.session.phaseState.describe.mainBowl, ['c2']);

  const scored = gotItCommand(started.session);
  assert.equal(scored.changed, true);
  assert.equal(scored.session.turn.currentCardId, 'c2');
  assert.deepEqual(scored.session.phaseState.describe.scoredByTeam['team-a'], ['c1']);

  const undone = undoCommand(scored.session);
  assert.equal(undone.changed, true);
  assert.equal(undone.session.turn.currentCardId, 'c1');
  assert.deepEqual(undone.session.phaseState.describe.mainBowl, ['c2']);
  assert.deepEqual(undone.session.phaseState.describe.scoredByTeam['team-a'], []);
});

test('pass credits the other team and updates undo availability', () => {
  const initial = buildSession();
  const started = startTurnCommand(initial, 1000);
  const passed = passCommand(started.session);

  assert.equal(passed.changed, true);
  assert.deepEqual(passed.session.phaseState.describe.scoredByTeam['team-b'], ['c1']);
  assert.equal(selectCanUndo(passed.session), true);
  assert.equal(selectIsTurnRunning(passed.session), true);
});

test('advancePhaseIfComplete snapshots results and opens phase modal', () => {
  const ready = buildSession({
    phaseState: {
      describe: {
        mainBowl: [],
        passedToTeam: { 'team-a': [], 'team-b': [] },
        scoredByTeam: { 'team-a': ['c1'], 'team-b': ['c2'] },
      },
      oneWord: {
        mainBowl: ['c1', 'c2'],
        passedToTeam: { 'team-a': [], 'team-b': [] },
        scoredByTeam: { 'team-a': [], 'team-b': [] },
      },
      charades: {
        mainBowl: ['c1', 'c2'],
        passedToTeam: { 'team-a': [], 'team-b': [] },
        scoredByTeam: { 'team-a': [], 'team-b': [] },
      },
    },
  });

  const advanced = advancePhaseIfCompleteCommand(ready);
  assert.equal(advanced.changed, true);
  assert.equal(advanced.session.phaseCompleteModal, 'describe');
  assert.deepEqual(advanced.session.phaseResults.describe, {
    'team-a': 1,
    'team-b': 1,
  });

  const dismissed = dismissPhaseCompleteModalCommand(advanced.session);
  assert.equal(dismissed.changed, true);
  assert.equal(dismissed.session.phase, 'oneWord');
  assert.equal(dismissed.session.phaseCompleteModal, undefined);
});

test('advancePhaseIfComplete ends game on final phase', () => {
  const finalPhase = buildSession({
    phase: 'charades',
    phaseState: {
      describe: {
        mainBowl: [],
        passedToTeam: { 'team-a': [], 'team-b': [] },
        scoredByTeam: { 'team-a': ['c1'], 'team-b': ['c2'] },
      },
      oneWord: {
        mainBowl: [],
        passedToTeam: { 'team-a': [], 'team-b': [] },
        scoredByTeam: { 'team-a': ['c1'], 'team-b': ['c2'] },
      },
      charades: {
        mainBowl: [],
        passedToTeam: { 'team-a': [], 'team-b': [] },
        scoredByTeam: { 'team-a': ['c1'], 'team-b': [] },
      },
    },
  });

  const advanced = advancePhaseIfCompleteCommand(finalPhase);
  assert.equal(advanced.changed, true);
  assert.equal(advanced.session.gameStatus, 'finished');
  assert.equal(advanced.session.gameOverModal, true);
});

test('selectors resolve current card and running state', () => {
  const started = startTurnCommand(buildSession(), 1000).session;
  const card = selectCurrentCard(started);
  assert.equal(card?.id, 'c1');
  assert.equal(selectIsTurnRunning(started), true);
});

test('migrateSession handles legacy drawPileByTeam shape and phase snapshots', () => {
  const raw = {
    id: 'legacy-1',
    createdAt: 100,
    teams: [
      { id: 'team-a', name: 'A', score: 0 },
      { id: 'team-b', name: 'B', score: 0 },
    ],
    players: [],
    deck: [
      { id: 'c1', text: 'Alpha' },
      { id: 'c2', text: 'Beta' },
    ],
    phase: 'describe',
    gameStatus: 'playing',
    phaseState: {
      describe: {
        drawPileByTeam: {
          'team-a': [],
          'team-b': [],
        },
        scoredByTeam: {
          'team-a': ['c1'],
          'team-b': ['c2'],
        },
      },
      oneWord: {
        drawPileByTeam: {
          'team-a': ['c1'],
          'team-b': ['c2'],
        },
        scoredByTeam: {
          'team-a': [],
          'team-b': [],
        },
      },
      charades: {
        drawPileByTeam: {
          'team-a': ['c1'],
          'team-b': ['c2'],
        },
        scoredByTeam: {
          'team-a': [],
          'team-b': [],
        },
      },
    },
  };

  const migrated = migrateSession(raw);

  assert.deepEqual(migrated.phaseState.describe.mainBowl, []);
  assert.deepEqual(migrated.phaseState.describe.scoredByTeam['team-a'], ['c1']);
  assert.deepEqual(migrated.phaseResults.describe, {
    'team-a': 1,
    'team-b': 1,
  });
});

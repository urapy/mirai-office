import assert from 'node:assert/strict';

import { test } from 'vitest';

import type { OfficeActor } from '../src/miraiOffice/demoOffice.ts';
import { selectVisibleOfficeActors, syncOfficeActors } from '../src/miraiOffice/officeActorSync.ts';
import { OfficeState } from '../src/office/engine/officeState.ts';

const actors: OfficeActor[] = [
  { id: 1, label: 'せかい係', palette: 0, activity: 'working' },
  { id: 2, label: 'くらし係', palette: 2, activity: 'working' },
  { id: 3, label: 'みらい係', palette: 4, activity: 'working' },
];

test('unlocks one actor for each purchase', () => {
  assert.deepEqual(selectVisibleOfficeActors(actors, 0), []);
  assert.deepEqual(
    selectVisibleOfficeActors(actors, 1).map((actor) => actor.label),
    ['せかい係'],
  );
  assert.deepEqual(
    selectVisibleOfficeActors(actors, 2).map((actor) => actor.label),
    ['せかい係', 'くらし係'],
  );
});

test('caps the visible team at the available three actors', () => {
  assert.equal(selectVisibleOfficeActors(actors, 3).length, 3);
  assert.equal(selectVisibleOfficeActors(actors, 10).length, 3);
});

test('adds, removes, and revives only the unlocked Mirai Office actors', () => {
  const officeState = new OfficeState();

  syncOfficeActors(officeState, actors, 1);
  assert.equal(officeState.characters.size, 1);
  assert.equal(officeState.characters.get(1)?.agentName, 'せかい係');

  syncOfficeActors(officeState, actors, 0);
  assert.equal(officeState.characters.get(1)?.matrixEffect, 'despawn');

  syncOfficeActors(officeState, actors, 1);
  assert.equal(officeState.characters.get(1)?.matrixEffect, 'spawn');

  syncOfficeActors(officeState, actors, 3);
  assert.equal(officeState.characters.size, 3);
});

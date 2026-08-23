import assert from 'node:assert/strict';

import { test } from 'vitest';

import type { OfficeActor } from '../src/miraiOffice/demoOffice.ts';
import { selectVisibleOfficeActors, syncOfficeActors } from '../src/miraiOffice/officeActorSync.ts';
import { OfficeState } from '../src/office/engine/officeState.ts';

const actors: OfficeActor[] = [
  { id: 1, label: 'せかい成長ファンド', palette: 0, activity: 'working' },
  { id: 2, label: 'くらし安心ファンド', palette: 2, activity: 'working' },
  { id: 3, label: 'みらい技術ファンド', palette: 4, activity: 'working' },
];

test('shows the actors belonging to purchased products', () => {
  assert.deepEqual(selectVisibleOfficeActors(actors, []), []);
  assert.deepEqual(
    selectVisibleOfficeActors(actors, [2]).map((actor) => actor.label),
    ['くらし安心ファンド'],
  );
  assert.deepEqual(
    selectVisibleOfficeActors(actors, [1, 3]).map((actor) => actor.label),
    ['せかい成長ファンド', 'みらい技術ファンド'],
  );
});

test('adds, removes, and revives only the unlocked Mirai Office actors', () => {
  const officeState = new OfficeState();

  syncOfficeActors(officeState, actors, [1]);
  assert.equal(officeState.characters.size, 1);
  assert.equal(officeState.characters.get(1)?.agentName, 'せかい成長ファンド');

  syncOfficeActors(officeState, actors, []);
  assert.equal(officeState.characters.get(1)?.matrixEffect, 'despawn');

  syncOfficeActors(officeState, actors, [1]);
  assert.equal(officeState.characters.get(1)?.matrixEffect, 'spawn');

  syncOfficeActors(officeState, actors, [1, 2, 3]);
  assert.equal(officeState.characters.size, 3);
});

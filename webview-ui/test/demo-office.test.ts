import assert from 'node:assert/strict';

import { test } from 'vitest';

import { parseOfficeActorSnapshot } from '../src/miraiOffice/demoOffice.ts';

test('parses the fixed three-character office snapshot', () => {
  const snapshot = parseOfficeActorSnapshot({
    version: 1,
    actors: [
      { id: 1, label: 'せかい成長ファンド', palette: 0, activity: 'working' },
      { id: 2, label: 'くらし安心ファンド', palette: 2, activity: 'working' },
      { id: 3, label: 'みらい技術ファンド', palette: 4, hueShift: 45, activity: 'resting' },
    ],
  });

  assert.equal(snapshot.actors.length, 3);
  assert.deepEqual(
    snapshot.actors.map((actor) => actor.label),
    ['せかい成長ファンド', 'くらし安心ファンド', 'みらい技術ファンド'],
  );
});

test('rejects duplicate actor IDs', () => {
  assert.throws(() =>
    parseOfficeActorSnapshot({
      version: 1,
      actors: [
        { id: 1, label: 'せかい成長ファンド', palette: 0, activity: 'working' },
        { id: 1, label: 'くらし安心ファンド', palette: 2, activity: 'working' },
      ],
    }),
  );
});

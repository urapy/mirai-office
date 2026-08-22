import assert from 'node:assert/strict';

import { test } from 'vitest';

import { parseOfficeActorSnapshot } from '../src/miraiOffice/demoOffice.ts';

test('parses the fixed three-character office snapshot', () => {
  const snapshot = parseOfficeActorSnapshot({
    version: 1,
    actors: [
      { id: 1, label: 'せかい係', palette: 0, activity: 'working' },
      { id: 2, label: 'くらし係', palette: 2, activity: 'working' },
      { id: 3, label: 'みらい係', palette: 4, hueShift: 45, activity: 'resting' },
    ],
  });

  assert.equal(snapshot.actors.length, 3);
  assert.deepEqual(
    snapshot.actors.map((actor) => actor.label),
    ['せかい係', 'くらし係', 'みらい係'],
  );
});

test('rejects duplicate actor IDs', () => {
  assert.throws(() =>
    parseOfficeActorSnapshot({
      version: 1,
      actors: [
        { id: 1, label: 'せかい係', palette: 0, activity: 'working' },
        { id: 1, label: 'くらし係', palette: 2, activity: 'working' },
      ],
    }),
  );
});

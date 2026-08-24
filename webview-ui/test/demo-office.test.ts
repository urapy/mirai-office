import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { test } from 'vitest';

import { parseOfficeActorSnapshot } from '../src/miraiOffice/demoOffice.ts';
import { FUND_ROOMS } from '../src/miraiOffice/fundRooms.ts';

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

test('provides every company, employee, and customer used by the three rooms', () => {
  const snapshot = parseOfficeActorSnapshot(
    JSON.parse(
      readFileSync(new URL('../public/mirai-office/demo-office.json', import.meta.url), 'utf8'),
    ),
  );
  const snapshotIds = new Set(snapshot.actors.map((actor) => actor.id));
  const roomActorIds = FUND_ROOMS.flatMap((room) => Object.keys(room.actorSeatUids).map(Number));

  assert.equal(snapshot.actors.length, 24);
  assert.equal(new Set(roomActorIds).size, 24);
  assert.equal(
    roomActorIds.every((actorId) => snapshotIds.has(actorId)),
    true,
  );
});

import assert from 'node:assert/strict';

import { test } from 'vitest';

import type { OfficeActor } from '../src/miraiOffice/demoOffice.ts';
import { selectVisibleOfficeActors, syncOfficeActors } from '../src/miraiOffice/officeActorSync.ts';
import { OfficeState } from '../src/office/engine/officeState.ts';
import { Direction } from '../src/office/types.ts';

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
  const seatTile = officeState.walkableTiles.at(-1)!;
  officeState.seats.set('mirai-seat', {
    uid: 'mirai-seat',
    seatCol: seatTile.col,
    seatRow: seatTile.row,
    facingDir: Direction.UP,
    assigned: false,
  });
  officeState.blockedTiles.add(`${seatTile.col},${seatTile.row}`);

  syncOfficeActors(officeState, actors, [1]);
  assert.equal(officeState.characters.size, 1);
  assert.equal(officeState.characters.get(1)?.agentName, 'せかい成長ファンド');
  assert.equal(officeState.characters.get(1)?.interactionOnlyLabel, true);
  const arriving = officeState.characters.get(1)!;
  const assignedSeat = officeState.seats.get(arriving.seatId!)!;
  assert.notDeepEqual(
    { col: arriving.tileCol, row: arriving.tileRow },
    { col: assignedSeat.seatCol, row: assignedSeat.seatRow },
  );
  assert.deepEqual(arriving.path.at(-1), {
    col: assignedSeat.seatCol,
    row: assignedSeat.seatRow,
  });

  syncOfficeActors(officeState, actors, []);
  assert.equal(officeState.characters.get(1)?.matrixEffect, 'despawn');

  syncOfficeActors(officeState, actors, [1]);
  assert.equal(officeState.characters.get(1)?.matrixEffect, 'spawn');

  syncOfficeActors(officeState, actors, [1, 2, 3]);
  assert.equal(officeState.characters.size, 3);
});

test('places room actors at their role-specific seats', () => {
  const officeState = new OfficeState();
  const seatTiles = officeState.walkableTiles.slice(-2);
  for (const [index, tile] of seatTiles.entries()) {
    officeState.seats.set(`role-seat-${index + 1}`, {
      uid: `role-seat-${index + 1}`,
      seatCol: tile.col,
      seatRow: tile.row,
      facingDir: Direction.UP,
      assigned: false,
    });
  }

  syncOfficeActors(officeState, actors, [1, 2], {
    1: 'role-seat-1',
    2: 'role-seat-2',
  });

  assert.equal(officeState.characters.get(1)?.seatId, 'role-seat-1');
  assert.equal(officeState.characters.get(2)?.seatId, 'role-seat-2');
});

test('sends a working product character on a short routine excursion', () => {
  const officeState = new OfficeState();
  officeState.addAgent(9, 0, 0, undefined, true);
  const character = officeState.characters.get(9)!;
  const target = officeState.walkableTiles.find(
    (tile) => Math.abs(tile.col - character.tileCol) + Math.abs(tile.row - character.tileRow) >= 3,
  )!;

  assert.equal(officeState.startRoutineExcursion(9, target), true);
  assert.equal(character.isActive, false);
  assert.equal(character.state, 'walk');

  officeState.setAgentActive(9, true);
  assert.equal(character.isActive, true);
});

test('shows temporary story cues independently of profit and loss', () => {
  const officeState = new OfficeState();
  officeState.addAgent(9, 0, 0, undefined, true);
  const character = officeState.characters.get(9)!;

  officeState.showStoryCueBubble(9, 'music');
  assert.equal(character.bubbleType, 'music');
  officeState.update(4);
  assert.equal(character.bubbleType, null);

  officeState.showStoryCueBubble(9, 'sweat');
  assert.equal(character.bubbleType, 'sweat');
});

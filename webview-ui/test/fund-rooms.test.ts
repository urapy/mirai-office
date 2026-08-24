import assert from 'node:assert/strict';

import { test } from 'vitest';

import {
  FUND_ROOMS,
  getFundRoom,
  getVisibleActorIdsForRoom,
} from '../src/miraiOffice/fundRooms.ts';
import { TileType } from '../src/office/types.ts';

test('defines one distinct room for each fictional fund', () => {
  assert.deepEqual(
    FUND_ROOMS.map((room) => room.productId),
    ['world-growth', 'daily-life', 'future-tech'],
  );

  const furnitureSignatures = new Set<string>();
  const floorTypes = new Set<TileType>();

  for (const room of FUND_ROOMS) {
    const { layout } = room;
    assert.equal(layout.cols, 21);
    assert.equal(layout.rows, 22);
    assert.equal(layout.tiles.length, layout.cols * layout.rows);
    assert.equal(layout.tileColors?.length, layout.cols * layout.rows);
    assert.equal(layout.tiles[20 * layout.cols + 1] === TileType.VOID, false);
    assert.equal(
      layout.furniture.some((item) => item.type.includes('CHAIR')),
      true,
    );
    assert.equal(
      layout.furniture.some((item) => item.type.includes('PC_')),
      true,
    );
    assert.equal(new Set(layout.furniture.map((item) => item.uid)).size, layout.furniture.length);

    floorTypes.add(layout.tiles[10 * layout.cols + 1]);
    furnitureSignatures.add(
      layout.furniture
        .map((item) => item.type)
        .sort()
        .join(','),
    );
  }

  assert.equal(floorTypes.size, FUND_ROOMS.length);
  assert.equal(furnitureSignatures.size, FUND_ROOMS.length);
});

test('returns only the purchased actor assigned to the selected room', () => {
  const purchasedActorIds = [1001, 1003];

  assert.deepEqual(getVisibleActorIdsForRoom('world-growth', purchasedActorIds), [1001]);
  assert.deepEqual(getVisibleActorIdsForRoom('daily-life', purchasedActorIds), []);
  assert.deepEqual(getVisibleActorIdsForRoom('future-tech', purchasedActorIds), [1003]);
});

test('rejects unknown fund rooms', () => {
  assert.equal(getFundRoom('daily-life').name, 'くらしラウンジ');
  assert.throws(() => getFundRoom('unknown-fund'));
});

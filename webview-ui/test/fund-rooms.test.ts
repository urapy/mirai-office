import assert from 'node:assert/strict';

import { test } from 'vitest';

import {
  FUND_ROOMS,
  getFundRoom,
  getVisibleActorIdsForRoom,
} from '../src/miraiOffice/fundRooms.ts';
import { getFictionalProduct } from '../src/miraiOffice/productCatalog.ts';
import { TileType } from '../src/office/types.ts';

test('defines one distinct room for each fictional fund', () => {
  assert.deepEqual(
    FUND_ROOMS.map((room) => room.productId),
    ['world-growth', 'daily-life', 'future-tech'],
  );

  const furnitureSignatures = new Set<string>();
  const floorTypes = new Set<TileType>();

  for (const room of FUND_ROOMS) {
    assert.equal(room.name, getFictionalProduct(room.productId).officeRoomName);
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
    assert.equal(
      layout.furniture.filter((item) => item.type.includes('CHAIR') || item.type.includes('SOFA'))
        .length >= 8,
      true,
    );
    for (const [actorId, seatUid] of Object.entries(room.actorSeatUids)) {
      assert.equal(Number.isInteger(Number(actorId)), true);
      assert.equal(
        layout.furniture.some((item) => seatUid === item.uid || seatUid.startsWith(`${item.uid}:`)),
        true,
      );
    }
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

  assert.deepEqual(
    getVisibleActorIdsForRoom('world-growth', purchasedActorIds),
    [1001, 1004, 1007, 1101, 1102, 1103, 1104, 1105],
  );
  assert.deepEqual(getVisibleActorIdsForRoom('daily-life', purchasedActorIds), []);
  assert.deepEqual(
    getVisibleActorIdsForRoom('future-tech', purchasedActorIds),
    [1003, 1006, 1009, 1301, 1302, 1303, 1304, 1305],
  );
});

test('presents the finance room as counters, customer seating, and a loan meeting area', () => {
  const financeRoom = getFundRoom('world-growth');
  const furnitureTypes = financeRoom.layout.furniture.map((item) => item.type);

  assert.match(financeRoom.concept, /お客さま.*銀行窓口.*執務.*融資相談/);
  assert.equal(furnitureTypes.filter((type) => type === 'DESK_FRONT').length, 3);
  assert.equal(furnitureTypes.filter((type) => type === 'SOFA_FRONT').length, 1);
  assert.equal(furnitureTypes.filter((type) => type === 'SOFA_BACK').length, 1);
  assert.equal(Object.keys(financeRoom.actorSeatUids).length, 8);
});

test('presents the IT room as a computer-filled development floor', () => {
  const itRoom = getFundRoom('daily-life');
  const furnitureTypes = itRoom.layout.furniture.map((item) => item.type);

  assert.match(itRoom.concept, /たくさんのコンピュータ.*開発チーム.*もくもく/);
  assert.equal(furnitureTypes.filter((type) => type === 'DESK_FRONT').length, 8);
  assert.equal(furnitureTypes.filter((type) => type.startsWith('PC_FRONT_ON_')).length, 8);
  assert.equal(Object.keys(itRoom.actorSeatUids).length, 8);
});

test('presents the industry room as a manufacturing floor', () => {
  const industryRoom = getFundRoom('future-tech');
  const furnitureTypes = industryRoom.layout.furniture.map((item) => item.type);

  assert.equal(industryRoom.name, 'ものづくり工場');
  assert.match(industryRoom.concept, /機械.*作業台.*たくさんの社員.*工程.*つくる/);
  assert.equal(furnitureTypes.filter((type) => type === 'TABLE_FRONT').length, 4);
  assert.equal(furnitureTypes.filter((type) => type === 'DOUBLE_BOOKSHELF').length, 2);
  assert.equal(furnitureTypes.filter((type) => type === 'DESK_FRONT').length, 0);
  assert.equal(Object.keys(industryRoom.actorSeatUids).length, 8);
});

test('rejects unknown fund rooms', () => {
  assert.equal(getFundRoom('daily-life').name, 'ITクリエイティブスタジオ');
  assert.throws(() => getFundRoom('unknown-fund'));
});

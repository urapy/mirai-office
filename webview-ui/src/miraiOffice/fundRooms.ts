import type { ColorValue } from '../components/ui/types.js';
import { type OfficeLayout, type PlacedFurniture, TileType } from '../office/types.js';
import { getFictionalProduct } from './productCatalog.js';

export interface FundRoomDefinition {
  productId: string;
  name: string;
  shortName: string;
  concept: string;
  layout: OfficeLayout;
}

const COLS = 21;
const ROWS = 22;
const ROOM_TOP = 9;
const ROOM_RIGHT = 19;

function furniture(room: string, items: Array<Omit<PlacedFurniture, 'uid'>>): PlacedFurniture[] {
  return items.map((item, index) => ({ ...item, uid: `${room}-${index + 1}` }));
}

function createRoomLayout(
  floorType: OfficeLayout['tiles'][number],
  floorColor: ColorValue,
  roomFurniture: PlacedFurniture[],
): OfficeLayout {
  const tiles: OfficeLayout['tiles'] = [];
  const tileColors: NonNullable<OfficeLayout['tileColors']> = [];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const isOutside = row < ROOM_TOP || col > ROOM_RIGHT;
      const isWall =
        !isOutside && (row === ROOM_TOP || row === ROWS - 1 || col === 0 || col === ROOM_RIGHT);
      if (isOutside) {
        tiles.push(TileType.VOID);
        tileColors.push(null);
      } else if (isWall) {
        tiles.push(TileType.WALL);
        tileColors.push(null);
      } else {
        tiles.push(floorType);
        tileColors.push({ ...floorColor });
      }
    }
  }

  return {
    version: 1,
    cols: COLS,
    rows: ROWS,
    layoutRevision: 2,
    tiles,
    tileColors,
    furniture: roomFurniture,
    pets: [],
  };
}

const WORLD_ROOM_FURNITURE = furniture('world', [
  { type: 'DOUBLE_BOOKSHELF', col: 2, row: 9 },
  { type: 'LARGE_PAINTING', col: 8, row: 9 },
  { type: 'WHITEBOARD', col: 15, row: 9 },
  { type: 'HANGING_PLANT', col: 1, row: 9 },
  { type: 'DESK_FRONT', col: 8, row: 12 },
  { type: 'PC_FRONT_ON_1', col: 9, row: 12 },
  { type: 'CUSHIONED_CHAIR_BACK', col: 9, row: 14 },
  { type: 'SOFA_FRONT', col: 3, row: 18 },
  { type: 'COFFEE_TABLE', col: 6, row: 17 },
  { type: 'PLANT', col: 17, row: 18 },
  { type: 'SMALL_PAINTING_2', col: 13, row: 9 },
]);

const DAILY_LIFE_ROOM_FURNITURE = furniture('daily', [
  { type: 'CLOCK', col: 2, row: 9 },
  { type: 'BOOKSHELF', col: 5, row: 9 },
  { type: 'SMALL_PAINTING', col: 12, row: 9 },
  { type: 'HANGING_PLANT', col: 17, row: 9 },
  { type: 'DESK_FRONT', col: 8, row: 12 },
  { type: 'PC_FRONT_ON_1', col: 9, row: 12 },
  { type: 'WOODEN_CHAIR_BACK', col: 9, row: 14 },
  { type: 'SOFA_FRONT', col: 3, row: 18 },
  { type: 'COFFEE_TABLE', col: 6, row: 17 },
  { type: 'COFFEE', col: 6, row: 17 },
  { type: 'LARGE_PLANT', col: 15, row: 17 },
  { type: 'PLANT_2', col: 2, row: 16 },
  { type: 'POT', col: 13, row: 19 },
]);

const FUTURE_TECH_ROOM_FURNITURE = furniture('future', [
  { type: 'WHITEBOARD', col: 2, row: 9 },
  { type: 'LARGE_PAINTING', col: 8, row: 9 },
  { type: 'CLOCK', col: 17, row: 9 },
  { type: 'DESK_FRONT', col: 8, row: 12 },
  { type: 'PC_FRONT_ON_1', col: 9, row: 12 },
  { type: 'CUSHIONED_CHAIR_BACK', col: 9, row: 14 },
  { type: 'DESK_SIDE', col: 3, row: 13 },
  { type: 'PC_SIDE', col: 3, row: 14 },
  { type: 'SMALL_TABLE_SIDE', col: 16, row: 14 },
  { type: 'PC_SIDE:left', col: 16, row: 15 },
  { type: 'CACTUS', col: 13, row: 18 },
  { type: 'BIN', col: 17, row: 19 },
]);

export const FUND_ROOMS: readonly FundRoomDefinition[] = [
  {
    productId: 'world-growth',
    name: '世界コラボルーム',
    shortName: 'せかい',
    concept: '世界の仲間と情報を持ち寄る、青い交流オフィス',
    layout: createRoomLayout(
      TileType.FLOOR_7,
      { h: 214, s: 40, b: -30, c: -42 },
      WORLD_ROOM_FURNITURE,
    ),
  },
  {
    productId: 'daily-life',
    name: 'くらしラウンジ',
    shortName: 'くらし',
    concept: '毎日の生活を支える、植物と木のぬくもりがある部屋',
    layout: createRoomLayout(
      TileType.FLOOR_4,
      { h: 118, s: 30, b: -18, c: -28 },
      DAILY_LIFE_ROOM_FURNITURE,
    ),
  },
  {
    productId: 'future-tech',
    name: '未来テックラボ',
    shortName: 'みらい',
    concept: '新しい技術を試す、紫と青の実験ラボ',
    layout: createRoomLayout(
      TileType.FLOOR_9,
      { h: 258, s: 46, b: -34, c: -34 },
      FUTURE_TECH_ROOM_FURNITURE,
    ),
  },
] as const;

export function getFundRoom(productId: string): FundRoomDefinition {
  const room = FUND_ROOMS.find((candidate) => candidate.productId === productId);
  if (!room) throw new Error(`Unknown fund room: ${productId}`);
  return room;
}

export function getVisibleActorIdsForRoom(
  productId: string,
  purchasedActorIds: readonly number[],
): number[] {
  const actorId = getFictionalProduct(productId).actorId;
  return purchasedActorIds.includes(actorId) ? [actorId] : [];
}

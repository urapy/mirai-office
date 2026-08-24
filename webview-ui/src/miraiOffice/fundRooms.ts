import type { ColorValue } from '../components/ui/types.js';
import { type OfficeLayout, type PlacedFurniture, TileType } from '../office/types.js';
import { getProductActorIds } from './productCatalog.js';

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

const FINANCE_ROOM_FURNITURE = furniture('finance', [
  { type: 'CLOCK', col: 2, row: 9 },
  { type: 'DOUBLE_BOOKSHELF', col: 5, row: 9 },
  { type: 'LARGE_PAINTING', col: 11, row: 9 },
  { type: 'WHITEBOARD', col: 15, row: 9 },
  { type: 'DESK_FRONT', col: 2, row: 12 },
  { type: 'PC_FRONT_ON_1', col: 3, row: 12 },
  { type: 'CUSHIONED_CHAIR_BACK', col: 3, row: 14 },
  { type: 'DESK_FRONT', col: 8, row: 12 },
  { type: 'PC_FRONT_ON_2', col: 9, row: 12 },
  { type: 'CUSHIONED_CHAIR_BACK', col: 9, row: 14 },
  { type: 'DESK_FRONT', col: 14, row: 12 },
  { type: 'PC_FRONT_ON_3', col: 15, row: 12 },
  { type: 'CUSHIONED_CHAIR_BACK', col: 15, row: 14 },
  { type: 'SOFA_FRONT', col: 3, row: 18 },
  { type: 'COFFEE_TABLE', col: 6, row: 17 },
  { type: 'PLANT', col: 17, row: 18 },
]);

const IT_ROOM_FURNITURE = furniture('it', [
  { type: 'WHITEBOARD', col: 2, row: 9 },
  { type: 'LARGE_PAINTING', col: 8, row: 9 },
  { type: 'CLOCK', col: 17, row: 9 },
  { type: 'DESK_FRONT', col: 2, row: 12 },
  { type: 'PC_FRONT_ON_1', col: 3, row: 12 },
  { type: 'CUSHIONED_CHAIR_BACK', col: 3, row: 14 },
  { type: 'DESK_FRONT', col: 8, row: 12 },
  { type: 'PC_FRONT_ON_2', col: 9, row: 12 },
  { type: 'CUSHIONED_CHAIR_BACK', col: 9, row: 14 },
  { type: 'DESK_FRONT', col: 14, row: 12 },
  { type: 'PC_FRONT_ON_3', col: 15, row: 12 },
  { type: 'CUSHIONED_CHAIR_BACK', col: 15, row: 14 },
  { type: 'SOFA_FRONT', col: 3, row: 18 },
  { type: 'COFFEE_TABLE', col: 6, row: 17 },
  { type: 'CACTUS', col: 17, row: 18 },
]);

const INDUSTRY_ROOM_FURNITURE = furniture('industry', [
  { type: 'WHITEBOARD', col: 2, row: 9 },
  { type: 'CLOCK', col: 9, row: 9 },
  { type: 'SMALL_PAINTING_2', col: 15, row: 9 },
  { type: 'DESK_FRONT', col: 2, row: 12 },
  { type: 'PC_FRONT_ON_1', col: 3, row: 12 },
  { type: 'WOODEN_CHAIR_BACK', col: 3, row: 14 },
  { type: 'DESK_FRONT', col: 8, row: 12 },
  { type: 'PC_FRONT_ON_2', col: 9, row: 12 },
  { type: 'WOODEN_CHAIR_BACK', col: 9, row: 14 },
  { type: 'DESK_FRONT', col: 14, row: 12 },
  { type: 'PC_FRONT_ON_3', col: 15, row: 12 },
  { type: 'WOODEN_CHAIR_BACK', col: 15, row: 14 },
  { type: 'TABLE_FRONT', col: 4, row: 18 },
  { type: 'TABLE_FRONT', col: 10, row: 18 },
  { type: 'BIN', col: 17, row: 19 },
  { type: 'POT', col: 2, row: 19 },
]);

export const FUND_ROOMS: readonly FundRoomDefinition[] = [
  {
    productId: 'world-growth',
    name: '金融サービスフロア',
    shortName: '金融',
    concept: '銀行・保険・支払いの会社が、お金の流れを支えるオフィス',
    layout: createRoomLayout(
      TileType.FLOOR_7,
      { h: 214, s: 40, b: -30, c: -42 },
      FINANCE_ROOM_FURNITURE,
    ),
  },
  {
    productId: 'daily-life',
    name: 'ITクリエイティブスタジオ',
    shortName: 'IT',
    concept: 'アプリ・ネット・クラウドの会社が、便利なしくみをつくる部屋',
    layout: createRoomLayout(
      TileType.FLOOR_4,
      { h: 118, s: 30, b: -18, c: -28 },
      IT_ROOM_FURNITURE,
    ),
  },
  {
    productId: 'future-tech',
    name: 'ものづくり産業ラボ',
    shortName: '産業',
    concept: '工場・部品・エネルギーの会社が、社会に必要なものをつくる現場',
    layout: createRoomLayout(
      TileType.FLOOR_9,
      { h: 258, s: 46, b: -34, c: -34 },
      INDUSTRY_ROOM_FURNITURE,
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
  const actorIds = getProductActorIds(productId);
  return actorIds.some((actorId) => purchasedActorIds.includes(actorId)) ? actorIds : [];
}

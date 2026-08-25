import type { ColorValue } from '../components/ui/types.js';
import { type OfficeLayout, type PlacedFurniture, TileType } from '../office/types.js';
import { getFictionalProduct, getProductActorIds } from './productCatalog.js';

export interface FundRoomDefinition {
  productId: string;
  name: string;
  shortName: string;
  concept: string;
  actorSeatUids: Readonly<Record<number, string>>;
  layout: OfficeLayout;
}

const COLS = 21;
const ROWS = 22;
const ROOM_TOP = 9;
const ROOM_RIGHT = 19;

type RoomFurniture = Omit<PlacedFurniture, 'uid'> & { uid?: string };

function furniture(room: string, items: RoomFurniture[]): PlacedFurniture[] {
  return items.map((item, index) => ({ ...item, uid: item.uid ?? `${room}-${index + 1}` }));
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
  { type: 'LARGE_PAINTING', col: 7, row: 9 },
  { type: 'DOUBLE_BOOKSHELF', col: 13, row: 10 },
  { type: 'WHITEBOARD', col: 16, row: 9 },
  { type: 'DESK_FRONT', col: 1, row: 12 },
  { type: 'PC_FRONT_ON_1', col: 2, row: 12 },
  { type: 'CUSHIONED_CHAIR_BACK', col: 2, row: 14, uid: 'finance-window-staff-1' },
  { type: 'CUSHIONED_CHAIR_BACK', col: 2, row: 17, uid: 'finance-window-customer-1' },
  { type: 'DESK_FRONT', col: 5, row: 12 },
  { type: 'PC_FRONT_ON_2', col: 6, row: 12 },
  { type: 'CUSHIONED_CHAIR_BACK', col: 6, row: 14, uid: 'finance-window-staff-2' },
  { type: 'CUSHIONED_CHAIR_BACK', col: 6, row: 17, uid: 'finance-window-customer-2' },
  { type: 'DESK_FRONT', col: 9, row: 12 },
  { type: 'PC_FRONT_ON_3', col: 10, row: 12 },
  { type: 'CUSHIONED_CHAIR_BACK', col: 10, row: 14, uid: 'finance-window-staff-3' },
  { type: 'CUSHIONED_CHAIR_BACK', col: 10, row: 17, uid: 'finance-window-customer-3' },
  { type: 'SOFA_FRONT', col: 16, row: 11, uid: 'finance-meeting-staff' },
  { type: 'COFFEE_TABLE', col: 16, row: 14 },
  { type: 'SOFA_BACK', col: 16, row: 17, uid: 'finance-meeting-customer' },
  { type: 'PLANT', col: 18, row: 18 },
]);

const IT_ROOM_FURNITURE = furniture('it', [
  { type: 'WHITEBOARD', col: 1, row: 9 },
  { type: 'DOUBLE_BOOKSHELF', col: 7, row: 9 },
  { type: 'CLOCK', col: 17, row: 9 },
  ...[1, 5, 9, 13].flatMap((col, index) => [
    { type: 'DESK_FRONT', col, row: 11 } as RoomFurniture,
    { type: `PC_FRONT_ON_${(index % 3) + 1}`, col: col + 1, row: 11 } as RoomFurniture,
    {
      type: 'CUSHIONED_CHAIR_BACK',
      col: col + 1,
      row: 13,
      uid: `it-developer-${index + 1}`,
    } as RoomFurniture,
  ]),
  ...[1, 5, 9, 13].flatMap((col, index) => [
    { type: 'DESK_FRONT', col, row: 16 } as RoomFurniture,
    { type: `PC_FRONT_ON_${((index + 1) % 3) + 1}`, col: col + 1, row: 16 } as RoomFurniture,
    {
      type: 'CUSHIONED_CHAIR_BACK',
      col: col + 1,
      row: 18,
      uid: `it-developer-${index + 5}`,
    } as RoomFurniture,
  ]),
  { type: 'CACTUS', col: 18, row: 18 },
]);

const INDUSTRY_ROOM_FURNITURE = furniture('industry', [
  { type: 'WHITEBOARD', col: 1, row: 9 },
  { type: 'DOUBLE_BOOKSHELF', col: 6, row: 9 },
  { type: 'CLOCK', col: 12, row: 9 },
  { type: 'DOUBLE_BOOKSHELF', col: 16, row: 9 },
  ...[1, 5, 9, 13].flatMap((col, index) => [
    {
      type: 'WOODEN_CHAIR_FRONT',
      col: col + 1,
      row: 10,
      uid: `industry-line-${index + 1}-front`,
    } as RoomFurniture,
    {
      type: 'TABLE_FRONT',
      col,
      row: 12,
      color: { h: 210, s: 18, b: -24, c: 18 },
    } as RoomFurniture,
    {
      type: `PC_FRONT_ON_${(index % 3) + 1}`,
      col: col + 1,
      row: 12,
      color: { h: 28, s: 34, b: 2, c: 12 },
    } as RoomFurniture,
    {
      type: 'WOODEN_CHAIR_BACK',
      col: col + 1,
      row: 16,
      uid: `industry-line-${index + 1}-back`,
    } as RoomFurniture,
  ]),
  { type: 'POT', col: 3, row: 19, color: { h: 36, s: 44, b: 4, c: 16 } },
  { type: 'BIN', col: 8, row: 19, color: { h: 36, s: 44, b: 4, c: 16 } },
  { type: 'POT', col: 13, row: 19, color: { h: 36, s: 44, b: 4, c: 16 } },
  { type: 'BIN', col: 18, row: 19 },
]);

const NVIDIA_ROOM_FURNITURE = furniture('nvidia', [
  { type: 'WHITEBOARD', col: 1, row: 9 },
  { type: 'CLOCK', col: 17, row: 9 },
  { type: 'DOUBLE_BOOKSHELF', col: 7, row: 9, color: { h: 104, s: 52, b: -30, c: 12 } },
  { type: 'DOUBLE_BOOKSHELF', col: 12, row: 9, color: { h: 104, s: 52, b: -30, c: 12 } },
  ...[1, 5, 9, 13].flatMap((col, index) => [
    {
      type: 'DESK_FRONT',
      col,
      row: 11,
      color: { h: 104, s: 38, b: -24, c: 18 },
    } as RoomFurniture,
    { type: `PC_FRONT_ON_${(index % 3) + 1}`, col: col + 1, row: 11 } as RoomFurniture,
    {
      type: 'CUSHIONED_CHAIR_BACK',
      col: col + 1,
      row: 13,
      uid: `nvidia-lab-${index + 1}`,
    } as RoomFurniture,
  ]),
  ...[1, 5, 9, 13].flatMap((col, index) => [
    {
      type: 'TABLE_FRONT',
      col,
      row: 16,
      color: { h: 104, s: 42, b: -30, c: 16 },
    } as RoomFurniture,
    { type: `PC_FRONT_ON_${((index + 1) % 3) + 1}`, col: col + 1, row: 16 } as RoomFurniture,
    {
      type: 'CUSHIONED_CHAIR_BACK',
      col: col + 1,
      row: 18,
      uid: `nvidia-lab-${index + 5}`,
    } as RoomFurniture,
  ]),
  { type: 'CACTUS', col: 18, row: 18, color: { h: 104, s: 54, b: 2, c: 10 } },
]);

export const FUND_ROOMS: readonly FundRoomDefinition[] = [
  {
    productId: 'world-growth',
    name: getFictionalProduct('world-growth').officeRoomName,
    shortName: '金融',
    concept: 'お客さまを迎える銀行窓口と、社員の執務・融資相談が見えるフロア',
    actorSeatUids: {
      1001: 'finance-window-staff-1',
      1004: 'finance-window-staff-2',
      1007: 'finance-window-staff-3',
      1101: 'finance-window-customer-1',
      1102: 'finance-window-customer-2',
      1103: 'finance-window-customer-3',
      1104: 'finance-meeting-staff',
      1105: 'finance-meeting-customer',
    },
    layout: createRoomLayout(
      TileType.FLOOR_7,
      { h: 214, s: 40, b: -30, c: -42 },
      FINANCE_ROOM_FURNITURE,
    ),
  },
  {
    productId: 'daily-life',
    name: getFictionalProduct('daily-life').officeRoomName,
    shortName: 'IT',
    concept: 'たくさんのコンピュータに向かい、開発チームがもくもくと働くフロア',
    actorSeatUids: Object.fromEntries(
      [1002, 1005, 1008, 1201, 1202, 1203, 1204, 1205].map((actorId, index) => [
        actorId,
        `it-developer-${index + 1}`,
      ]),
    ),
    layout: createRoomLayout(
      TileType.FLOOR_4,
      { h: 118, s: 30, b: -18, c: -28 },
      IT_ROOM_FURNITURE,
    ),
  },
  {
    productId: 'future-tech',
    name: getFictionalProduct('future-tech').officeRoomName,
    shortName: '産業',
    concept: '機械と作業台を囲み、たくさんの社員が工程をつないでものをつくる工場',
    actorSeatUids: Object.fromEntries(
      [1003, 1006, 1009, 1301, 1302, 1303, 1304, 1305].map((actorId, index) => [
        actorId,
        `industry-line-${(index % 4) + 1}-${index < 4 ? 'front' : 'back'}`,
      ]),
    ),
    layout: createRoomLayout(
      TileType.FLOOR_9,
      { h: 258, s: 46, b: -34, c: -34 },
      INDUSTRY_ROOM_FURNITURE,
    ),
  },
  {
    productId: 'nvidia-watch',
    name: getFictionalProduct('nvidia-watch').officeRoomName,
    shortName: 'AI基盤',
    concept: 'AIを動かす半導体、サーバー、ネットワーク、ソフトウェアを研究する実在企業ウォッチ',
    actorSeatUids: Object.fromEntries(
      [1401, 1402, 1403, 1404, 1405, 1406, 1407, 1408].map((actorId, index) => [
        actorId,
        `nvidia-lab-${index + 1}`,
      ]),
    ),
    layout: createRoomLayout(
      TileType.FLOOR_6,
      { h: 112, s: 36, b: -38, c: -18 },
      NVIDIA_ROOM_FURNITURE,
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
  const product = getFictionalProduct(productId);
  const productActorIds = getProductActorIds(productId);
  const roomActorIds = Object.keys(getFundRoom(productId).actorSeatUids).map(Number);
  if (product.kind === 'company-watch') return roomActorIds;
  return productActorIds.some((actorId) => purchasedActorIds.includes(actorId)) ? roomActorIds : [];
}

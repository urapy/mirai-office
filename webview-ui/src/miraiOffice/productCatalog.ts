export interface FictionalProduct {
  id: string;
  kind: 'fund' | 'company-watch';
  name: string;
  shortName: string;
  sector: string;
  description: string;
  officeRoomName: string;
  companies: readonly FictionalCompany[];
}

export interface FictionalCompany {
  actorId: number;
  name: string;
}

export const FICTIONAL_PRODUCTS: readonly FictionalProduct[] = [
  {
    id: 'world-growth',
    kind: 'fund',
    name: 'おかねを支える金融ファンド',
    shortName: '金融ファンド',
    sector: '金融',
    description: '銀行、保険、支払いのしくみで、みんなのお金を支える架空の商品',
    officeRoomName: '銀行サービスフロア',
    companies: [
      { actorId: 1001, name: 'にじいろ銀行' },
      { actorId: 1004, name: 'こつこつ保険' },
      { actorId: 1007, name: 'まちの決済サービス' },
    ],
  },
  {
    id: 'daily-life',
    kind: 'fund',
    name: 'くらしを便利にするITファンド',
    shortName: 'ITファンド',
    sector: 'IT',
    description: 'アプリやインターネットの技術で、毎日のくらしを便利にする架空の商品',
    officeRoomName: 'ITクリエイティブスタジオ',
    companies: [
      { actorId: 1002, name: 'わくわくアプリ社' },
      { actorId: 1005, name: 'まもるネット社' },
      { actorId: 1008, name: 'つながるクラウド社' },
    ],
  },
  {
    id: 'future-tech',
    kind: 'fund',
    name: 'ものづくり産業ファンド',
    shortName: '産業ファンド',
    sector: '産業',
    description: '工場、部品、エネルギーの仕事で、社会に必要なものをつくる架空の商品',
    officeRoomName: 'ものづくり工場',
    companies: [
      { actorId: 1003, name: 'はこぶロボット工場' },
      { actorId: 1006, name: 'みらい部品社' },
      { actorId: 1009, name: 'エコエネルギー社' },
    ],
  },
  {
    id: 'nvidia-watch',
    kind: 'company-watch',
    name: 'NVIDIA 企業ウォッチ',
    shortName: 'NVIDIA',
    sector: 'AI・半導体',
    description: 'NVIDIAの公式発表をAIが見守り、会社の動きを子ども向けに伝える学習機能',
    officeRoomName: 'AIコンピューティングラボ',
    companies: [
      { actorId: 1401, name: '半導体設計チーム' },
      { actorId: 1402, name: 'AIソフトウェアチーム' },
      { actorId: 1403, name: 'データセンターチーム' },
      { actorId: 1404, name: 'ネットワークチーム' },
      { actorId: 1405, name: 'ロボット研究チーム' },
      { actorId: 1406, name: '製品テストチーム' },
      { actorId: 1407, name: '省エネ研究チーム' },
      { actorId: 1408, name: '公式情報確認チーム' },
    ],
  },
];

export function getFictionalProduct(productId: string): FictionalProduct {
  const product = FICTIONAL_PRODUCTS.find((candidate) => candidate.id === productId);
  if (!product) throw new Error(`Unknown fictional product: ${productId}`);
  return product;
}

export function getProductActorIds(productId: string): number[] {
  return getFictionalProduct(productId).companies.map((company) => company.actorId);
}

export function getWorkEventActorId(productId: string, tick: number): number {
  const actorIds = getProductActorIds(productId);
  return actorIds[Math.floor(Math.abs(tick) / 9) % actorIds.length];
}

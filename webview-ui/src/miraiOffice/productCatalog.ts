export interface FictionalProduct {
  id: string;
  name: string;
  shortName: string;
  sector: string;
  description: string;
  companies: readonly FictionalCompany[];
}

export interface FictionalCompany {
  actorId: number;
  name: string;
}

export const FICTIONAL_PRODUCTS: readonly FictionalProduct[] = [
  {
    id: 'world-growth',
    name: 'おかねを支える金融ファンド',
    shortName: '金融ファンド',
    sector: '金融',
    description: '銀行、保険、支払いのしくみで、みんなのお金を支える架空の商品',
    companies: [
      { actorId: 1001, name: 'にじいろ銀行' },
      { actorId: 1004, name: 'こつこつ保険' },
      { actorId: 1007, name: 'まちの決済サービス' },
    ],
  },
  {
    id: 'daily-life',
    name: 'くらしを便利にするITファンド',
    shortName: 'ITファンド',
    sector: 'IT',
    description: 'アプリやインターネットの技術で、毎日のくらしを便利にする架空の商品',
    companies: [
      { actorId: 1002, name: 'わくわくアプリ社' },
      { actorId: 1005, name: 'まもるネット社' },
      { actorId: 1008, name: 'つながるクラウド社' },
    ],
  },
  {
    id: 'future-tech',
    name: 'ものづくり産業ファンド',
    shortName: '産業ファンド',
    sector: '産業',
    description: '工場、部品、エネルギーの仕事で、社会に必要なものをつくる架空の商品',
    companies: [
      { actorId: 1003, name: 'はこぶロボット工場' },
      { actorId: 1006, name: 'みらい部品社' },
      { actorId: 1009, name: 'エコエネルギー社' },
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

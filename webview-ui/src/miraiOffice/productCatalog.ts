export interface FictionalProduct {
  id: string;
  name: string;
  description: string;
  actorId: number;
}

export const FICTIONAL_PRODUCTS: readonly FictionalProduct[] = [
  {
    id: 'world-growth',
    name: 'せかい成長ファンド',
    description: '世界のいろいろな地域や会社を応援する架空の商品',
    actorId: 1001,
  },
  {
    id: 'daily-life',
    name: 'くらし安心ファンド',
    description: '食べものや住まいなど、毎日のくらしを支える会社を応援する架空の商品',
    actorId: 1002,
  },
  {
    id: 'future-tech',
    name: 'みらい技術ファンド',
    description: '新しい技術で未来の課題に取り組む会社を応援する架空の商品',
    actorId: 1003,
  },
];

export function getFictionalProduct(productId: string): FictionalProduct {
  const product = FICTIONAL_PRODUCTS.find((candidate) => candidate.id === productId);
  if (!product) throw new Error(`Unknown fictional product: ${productId}`);
  return product;
}

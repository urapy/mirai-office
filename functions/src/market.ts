export interface CloudProduct {
  id: string;
  name: string;
  shortName: string;
  description: string;
  theme: string;
  initialPrice: number;
}

export interface CloudQuote {
  productId: string;
  price: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  tick: number;
  updatedAt: string;
}

export interface CloudWorkEvent {
  id: string;
  productId: string;
  kind: 'progress' | 'challenge';
  cue: 'music' | 'sweat';
  headline: string;
  childMessage: string;
  tick: number;
  createdAt: string;
}

export const CLOUD_PRODUCTS: readonly CloudProduct[] = [
  {
    id: 'world-growth',
    name: 'おかねを支える金融ファンド',
    shortName: '金融ファンド',
    description: '銀行、保険、支払いのしくみで、みんなのお金を支える架空の商品',
    theme: '金融',
    initialPrice: 10_000,
  },
  {
    id: 'daily-life',
    name: 'くらしを便利にするITファンド',
    shortName: 'ITファンド',
    description: 'アプリやインターネットの技術で、毎日のくらしを便利にする架空の商品',
    theme: 'IT',
    initialPrice: 10_000,
  },
  {
    id: 'future-tech',
    name: 'ものづくり産業ファンド',
    shortName: '産業ファンド',
    description: '工場、部品、エネルギーの仕事で、社会に必要なものをつくる架空の商品',
    theme: '産業',
    initialPrice: 10_000,
  },
];

const WORK_EVENTS: Readonly<
  Record<string, readonly Omit<CloudWorkEvent, 'id' | 'productId' | 'tick' | 'createdAt'>[]>
> = {
  'world-growth': [
    {
      kind: 'progress',
      cue: 'music',
      headline: 'にじいろ銀行の新しいサービスが始まりました',
      childMessage: 'お金を安全に預けたり送ったりするしくみを、使いやすくできました。',
    },
    {
      kind: 'challenge',
      cue: 'sweat',
      headline: 'こつこつ保険が相談内容を確認しています',
      childMessage: '困った人をきちんと助けられるように、保険の相談をていねいに確認しています。',
    },
  ],
  'daily-life': [
    {
      kind: 'progress',
      cue: 'music',
      headline: 'わくわくアプリ社が便利な機能を完成させました',
      childMessage: '毎日の予定をわかりやすくする、新しいアプリの機能ができました。',
    },
    {
      kind: 'challenge',
      cue: 'sweat',
      headline: 'まもるネット社が安全を確認しています',
      childMessage: '大切な情報を守るため、インターネットのしくみに問題がないか調べています。',
    },
  ],
  'future-tech': [
    {
      kind: 'progress',
      cue: 'music',
      headline: 'はこぶロボット工場の試運転が進みました',
      childMessage: '重い荷物を安全に運ぶロボットが、工場の中をうまく動きました。',
    },
    {
      kind: 'challenge',
      cue: 'sweat',
      headline: 'みらい部品社が作り方を見直しています',
      childMessage: '丈夫な部品をつくるため、材料と作り方をもう一度たしかめています。',
    },
  ],
};

const CLOUD_EPOCH_MS = Date.UTC(2026, 7, 24, 0, 0, 0);

export function marketTick(nowMs = Date.now()): number {
  return Math.max(0, Math.floor((nowMs - CLOUD_EPOCH_MS) / 1_000));
}

function deterministicNoise(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43_758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

function priceAt(productIndex: number, tick: number): number {
  const initialPrice = CLOUD_PRODUCTS[productIndex]?.initialPrice ?? 10_000;
  const amplitudes = [0.025, 0.016, 0.032];
  const slowCycle = Math.sin((tick + productIndex * 53) / (240 + productIndex * 55));
  const fastCycle = Math.sin((tick + productIndex * 17) / (31 + productIndex * 7));
  const noise = deterministicNoise(20_260_824 + tick * 17 + productIndex * 101);
  const movement =
    slowCycle * amplitudes[productIndex] +
    fastCycle * amplitudes[productIndex] * 0.16 +
    noise * amplitudes[productIndex] * 0.035;
  return Math.max(1_000, Math.round(initialPrice * (1 + movement)));
}

export function getCloudQuote(productId: string, nowMs = Date.now()): CloudQuote {
  const productIndex = CLOUD_PRODUCTS.findIndex((product) => product.id === productId);
  if (productIndex < 0) throw new Error(`Unknown cloud product: ${productId}`);
  const tick = marketTick(nowMs);
  const price = priceAt(productIndex, tick);
  const previousPrice = priceAt(productIndex, Math.max(0, tick - 1));
  const change = price - previousPrice;
  return {
    productId,
    price,
    previousPrice,
    change,
    changePercent: previousPrice === 0 ? 0 : change / previousPrice,
    tick,
    updatedAt: new Date(nowMs).toISOString(),
  };
}

export function getCloudQuotes(nowMs = Date.now()): CloudQuote[] {
  return CLOUD_PRODUCTS.map((product) => getCloudQuote(product.id, nowMs));
}

export function getCloudHistory(productId: string, limit = 120, nowMs = Date.now()): CloudQuote[] {
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 600));
  return Array.from({ length: safeLimit }, (_, index) =>
    getCloudQuote(productId, nowMs - (safeLimit - index - 1) * 1_000),
  );
}

export function getCloudWorkEvents(limit = 20, nowMs = Date.now()): CloudWorkEvent[] {
  const currentTick = marketTick(nowMs);
  const events: CloudWorkEvent[] = [];
  for (let tick = Math.max(0, currentTick - 300); tick <= currentTick; tick++) {
    CLOUD_PRODUCTS.forEach((product, productIndex) => {
      const firstEventTick = (productIndex + 1) * 3;
      if (tick < firstEventTick || (tick - firstEventTick) % 9 !== 0) return;
      const eventIndex = Math.floor((tick - firstEventTick) / 9);
      const templates = WORK_EVENTS[product.id];
      const template = templates[eventIndex % templates.length];
      events.push({
        id: `work-${product.id}-${tick}`,
        productId: product.id,
        ...template,
        tick,
        createdAt: new Date(CLOUD_EPOCH_MS + tick * 1_000).toISOString(),
      });
    });
  }
  return events.slice(-Math.max(1, Math.min(Math.floor(limit), 100)));
}

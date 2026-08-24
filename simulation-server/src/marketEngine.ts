import type { SimulatedProduct, SimulatedQuote, SimulatedWorkEvent } from './types.js';

export const SIMULATED_PRODUCTS: readonly SimulatedProduct[] = [
  {
    id: 'world-growth',
    name: 'せかい成長ファンド',
    shortName: 'せかい成長',
    description: '世界のいろいろな地域や会社を応援する架空の商品',
    theme: 'グローバル分散',
    initialPrice: 10_000,
  },
  {
    id: 'daily-life',
    name: 'くらし安心ファンド',
    shortName: 'くらし安心',
    description: '毎日のくらしを支える会社を応援する架空の商品',
    theme: '生活インフラ',
    initialPrice: 10_000,
  },
  {
    id: 'future-tech',
    name: 'みらい技術ファンド',
    shortName: 'みらい技術',
    description: '新しい技術で未来の課題に取り組む会社を応援する架空の商品',
    theme: '未来技術',
    initialPrice: 10_000,
  },
];

type MarketListener = (quotes: SimulatedQuote[], workEvents: SimulatedWorkEvent[]) => void;

interface WorkEventTemplate {
  kind: SimulatedWorkEvent['kind'];
  cue: SimulatedWorkEvent['cue'];
  headline: string;
  childMessage: string;
}

const WORK_EVENT_TEMPLATES: Readonly<Record<string, readonly WorkEventTemplate[]>> = {
  'world-growth': [
    {
      kind: 'progress',
      cue: 'music',
      headline: '海外チームとの相談がまとまりました',
      childMessage: '世界の仲間とアイデアを出し合い、次の仕事の進め方が決まりました。',
    },
    {
      kind: 'challenge',
      cue: 'sweat',
      headline: '輸送の遅れを調べています',
      childMessage: '商品を届ける方法に課題が見つかり、チームで原因を調べています。',
    },
  ],
  'daily-life': [
    {
      kind: 'progress',
      cue: 'music',
      headline: 'くらしを助ける改善ができました',
      childMessage: '毎日のサービスを使いやすくする工夫がひとつ完成しました。',
    },
    {
      kind: 'challenge',
      cue: 'sweat',
      headline: '設備の点検に取り組んでいます',
      childMessage: '安全にサービスを続けるため、チームが設備をくわしく確認しています。',
    },
  ],
  'future-tech': [
    {
      kind: 'progress',
      cue: 'music',
      headline: '新しい実験が一歩進みました',
      childMessage: '試していた技術がうまく動き、次の実験へ進めることになりました。',
    },
    {
      kind: 'challenge',
      cue: 'sweat',
      headline: '実験データを見直しています',
      childMessage: '予想と違う結果が出たため、チームがデータを確かめ直しています。',
    },
  ],
};

function deterministicNoise(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43_758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

export class MarketEngine {
  private readonly quotes = new Map<string, SimulatedQuote>();
  private readonly histories = new Map<string, SimulatedQuote[]>();
  private readonly listeners = new Set<MarketListener>();
  private readonly workEventHistory: SimulatedWorkEvent[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private tick = 0;

  constructor(private readonly seed = 20_260_823) {
    const updatedAt = new Date().toISOString();
    for (const product of SIMULATED_PRODUCTS) {
      const quote: SimulatedQuote = {
        productId: product.id,
        price: product.initialPrice,
        previousPrice: product.initialPrice,
        change: 0,
        changePercent: 0,
        tick: 0,
        updatedAt,
      };
      this.quotes.set(product.id, quote);
      this.histories.set(product.id, [quote]);
    }
  }

  getProducts(): SimulatedProduct[] {
    return SIMULATED_PRODUCTS.map((product) => ({ ...product }));
  }

  getQuotes(): SimulatedQuote[] {
    return SIMULATED_PRODUCTS.map((product) => ({ ...this.getQuote(product.id) }));
  }

  getQuote(productId: string): SimulatedQuote {
    const quote = this.quotes.get(productId);
    if (!quote) throw new Error(`Unknown simulated product: ${productId}`);
    return quote;
  }

  getHistory(productId: string, limit = 120): SimulatedQuote[] {
    const history = this.histories.get(productId);
    if (!history) throw new Error(`Unknown simulated product: ${productId}`);
    return history
      .slice(-Math.max(1, Math.min(Math.floor(limit), 600)))
      .map((quote) => ({ ...quote }));
  }

  getWorkEvents(limit = 20): SimulatedWorkEvent[] {
    return this.workEventHistory
      .slice(-Math.max(1, Math.min(Math.floor(limit), 100)))
      .map((event) => ({ ...event }));
  }

  advance(updatedAt = new Date().toISOString()): SimulatedQuote[] {
    this.tick++;
    SIMULATED_PRODUCTS.forEach((product, index) => {
      const previous = this.getQuote(product.id);
      const volatility = [0.0007, 0.00045, 0.001][index] ?? 0.0007;
      const drift = [0.000018, 0.000009, 0.000025][index] ?? 0;
      const cycle = Math.sin((this.tick + index * 5) / (13 + index * 4)) * volatility * 0.22;
      const noise = deterministicNoise(this.seed + this.tick * 17 + index * 101) * volatility;
      const price = Math.max(1_000, Math.round(previous.price * (1 + drift + cycle + noise)));
      const change = price - previous.price;
      const quote: SimulatedQuote = {
        productId: product.id,
        price,
        previousPrice: previous.price,
        change,
        changePercent: previous.price === 0 ? 0 : change / previous.price,
        tick: this.tick,
        updatedAt,
      };
      this.quotes.set(product.id, quote);
      const history = this.histories.get(product.id)!;
      history.push(quote);
      if (history.length > 600) history.shift();
    });
    const workEvents = this.createWorkEvents(updatedAt);
    const snapshot = this.getQuotes();
    for (const listener of this.listeners) listener(snapshot, workEvents);
    return snapshot;
  }

  subscribe(listener: MarketListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  start(intervalMs = 1_000): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.advance(), intervalMs);
  }

  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  private createWorkEvents(createdAt: string): SimulatedWorkEvent[] {
    const events: SimulatedWorkEvent[] = [];
    SIMULATED_PRODUCTS.forEach((product, productIndex) => {
      const firstEventTick = (productIndex + 1) * 3;
      if (this.tick < firstEventTick || (this.tick - firstEventTick) % 9 !== 0) return;
      const eventIndex = Math.floor((this.tick - firstEventTick) / 9);
      const templates = WORK_EVENT_TEMPLATES[product.id];
      const template = templates?.[eventIndex % templates.length];
      if (!template) return;
      events.push({
        id: `work-${product.id}-${this.tick}`,
        productId: product.id,
        ...template,
        tick: this.tick,
        createdAt,
      });
    });
    this.workEventHistory.push(...events);
    if (this.workEventHistory.length > 100) {
      this.workEventHistory.splice(0, this.workEventHistory.length - 100);
    }
    return events.map((event) => ({ ...event }));
  }
}

import { baselinePerformance, PERFORMANCE_SCENARIOS } from './performance.js';
import type {
  PerformanceScenarioId,
  PerformanceState,
  SimulatedProduct,
  SimulatedQuote,
  SimulatedWorkEvent,
} from './types.js';

export const SIMULATED_PRODUCTS: readonly SimulatedProduct[] = [
  {
    id: 'world-growth',
    name: 'おかねを支える金融ファンド',
    shortName: '金融ファンド',
    description: '銀行、保険、支払いのしくみで、みんなのお金を支える架空の商品',
    theme: '金融',
    officeRoomName: '銀行サービスフロア',
    initialPrice: 10_000,
  },
  {
    id: 'daily-life',
    name: 'くらしを便利にするITファンド',
    shortName: 'ITファンド',
    description: 'アプリやインターネットの技術で、毎日のくらしを便利にする架空の商品',
    theme: 'IT',
    officeRoomName: 'ITクリエイティブスタジオ',
    initialPrice: 10_000,
  },
  {
    id: 'future-tech',
    name: 'ものづくり産業ファンド',
    shortName: '産業ファンド',
    description: '工場、部品、エネルギーの仕事で、社会に必要なものをつくる架空の商品',
    theme: '産業',
    officeRoomName: 'ものづくり工場',
    initialPrice: 10_000,
  },
];

type MarketListener = (
  quotes: SimulatedQuote[],
  workEvents: SimulatedWorkEvent[],
  performanceStates: PerformanceState[],
) => void;

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

function deterministicNoise(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43_758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

export class MarketEngine {
  private readonly quotes = new Map<string, SimulatedQuote>();
  private readonly histories = new Map<string, SimulatedQuote[]>();
  private readonly listeners = new Set<MarketListener>();
  private readonly workEventHistory: SimulatedWorkEvent[] = [];
  private readonly performanceStates = new Map<string, PerformanceState>();
  private performanceSequence = 0;
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
      this.performanceStates.set(product.id, baselinePerformance(product.id));
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

  getPerformanceStates(nowMs = Date.now()): PerformanceState[] {
    return SIMULATED_PRODUCTS.map((product) => {
      const state = this.performanceStates.get(product.id) ?? baselinePerformance(product.id);
      if (state.expiresAt && Date.parse(state.expiresAt) <= nowMs)
        return baselinePerformance(product.id);
      return { ...state };
    });
  }

  triggerPerformanceEvent(
    productId: string,
    scenarioId: PerformanceScenarioId,
    nowMs = Date.now(),
  ): PerformanceState {
    const scenario = PERFORMANCE_SCENARIOS[scenarioId];
    const previous = this.getQuote(productId);
    this.tick++;
    const price = Math.max(1_000, Math.round(previous.price * scenario.priceMultiplier));
    const quote: SimulatedQuote = {
      ...previous,
      price,
      previousPrice: previous.price,
      change: price - previous.price,
      changePercent: (price - previous.price) / previous.price,
      tick: this.tick,
      updatedAt: new Date(nowMs).toISOString(),
    };
    this.quotes.set(productId, quote);
    this.histories.get(productId)?.push(quote);
    const eventId = `performance-${productId}-${++this.performanceSequence}`;
    const state: PerformanceState = {
      productId,
      eventId,
      scenario: scenarioId,
      label: scenario.label,
      score: scenario.score,
      reactionLevel: scenario.reactionLevel,
      cue: scenario.cue,
      headline: scenario.headline,
      childMessage: scenario.childMessage,
      startedAt: new Date(nowMs).toISOString(),
      expiresAt: new Date(nowMs + 60_000).toISOString(),
    };
    this.performanceStates.set(productId, state);
    const workEvents: SimulatedWorkEvent[] = scenario.cue
      ? [
          {
            id: eventId,
            productId,
            kind: scenario.cue === 'sweat' ? 'challenge' : 'progress',
            cue: scenario.cue,
            source: 'guardian',
            intensity: Math.max(1, scenario.reactionLevel) as 1 | 2 | 3,
            scenario: scenarioId,
            headline: scenario.headline,
            childMessage: scenario.childMessage,
            tick: this.tick,
            createdAt: state.startedAt,
          },
        ]
      : [];
    this.workEventHistory.push(...workEvents);
    for (const listener of this.listeners) {
      listener(this.getQuotes(), workEvents, this.getPerformanceStates(nowMs));
    }
    return { ...state };
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
    for (const listener of this.listeners) {
      listener(snapshot, workEvents, this.getPerformanceStates(Date.parse(updatedAt)));
    }
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
        source: 'automatic',
        intensity: 1,
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

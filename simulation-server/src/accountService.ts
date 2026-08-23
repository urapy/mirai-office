import type { MarketEngine } from './marketEngine.js';
import type { AccountEvent, AccountSnapshot } from './types.js';

interface HoldingState {
  quantity: number;
  cost: number;
}

export class AccountService {
  private readonly holdings = new Map<string, HoldingState>();
  private events: AccountEvent[] = [];
  private principal = 0;
  private eventSequence = 0;

  constructor(private readonly market: MarketEngine) {}

  contribute(
    productId: string,
    amount: number,
    createdAt = new Date().toISOString(),
  ): AccountSnapshot {
    if (!Number.isInteger(amount) || amount <= 0 || amount > 1_000_000) {
      throw new Error('Contribution amount must be an integer from 1 to 1,000,000 yen');
    }
    const quote = this.market.getQuote(productId);
    const quantity = amount / quote.price;
    const current = this.holdings.get(productId) ?? { quantity: 0, cost: 0 };
    this.holdings.set(productId, {
      quantity: current.quantity + quantity,
      cost: current.cost + amount,
    });
    this.principal += amount;
    this.events.push(
      {
        id: this.nextEventId(),
        type: 'contribution',
        productId,
        amount,
        createdAt,
      },
      {
        id: this.nextEventId(),
        type: 'purchase',
        productId,
        amount,
        price: quote.price,
        quantity,
        createdAt,
      },
    );
    return this.getSnapshot();
  }

  getSnapshot(): AccountSnapshot {
    const holdings = [...this.holdings.entries()].map(([productId, holding]) => {
      const currentPrice = this.market.getQuote(productId).price;
      const valuation = Math.round(holding.quantity * currentPrice);
      return {
        productId,
        quantity: holding.quantity,
        averageCost: holding.cost / holding.quantity,
        currentPrice,
        valuation,
        profitLoss: valuation - holding.cost,
      };
    });
    const valuation = holdings.reduce((sum, holding) => sum + holding.valuation, 0);
    return {
      accountId: 'demo',
      principal: this.principal,
      valuation,
      profitLoss: valuation - this.principal,
      holdings,
      updatedAt: new Date().toISOString(),
    };
  }

  getHistory(): AccountEvent[] {
    return this.events.map((event) => ({ ...event }));
  }

  reset(): AccountSnapshot {
    this.holdings.clear();
    this.events = [];
    this.principal = 0;
    this.eventSequence = 0;
    return this.getSnapshot();
  }

  private nextEventId(): string {
    this.eventSequence++;
    return `event-${this.eventSequence}`;
  }
}

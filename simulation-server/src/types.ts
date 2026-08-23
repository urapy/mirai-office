export interface SimulatedProduct {
  id: string;
  name: string;
  shortName: string;
  description: string;
  theme: string;
  initialPrice: number;
}

export interface SimulatedQuote {
  productId: string;
  price: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  tick: number;
  updatedAt: string;
}

export interface AccountHolding {
  productId: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  valuation: number;
  profitLoss: number;
}

export interface AccountSnapshot {
  accountId: 'demo';
  principal: number;
  valuation: number;
  profitLoss: number;
  holdings: AccountHolding[];
  updatedAt: string;
}

export interface AccountEvent {
  id: string;
  type: 'contribution' | 'purchase';
  productId: string;
  amount: number;
  price?: number;
  quantity?: number;
  createdAt: string;
}

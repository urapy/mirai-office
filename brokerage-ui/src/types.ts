export interface Product {
  id: string;
  name: string;
  shortName: string;
  description: string;
  theme: string;
  officeRoomName: string;
  initialPrice: number;
}

export interface Quote {
  productId: string;
  price: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  tick: number;
  updatedAt: string;
}

export type PerformanceScenarioId = 'rapid-growth' | 'growth' | 'steady' | 'slump' | 'major-loss';

export interface PerformanceState {
  productId: string;
  eventId: string;
  scenario: PerformanceScenarioId;
  label: string;
  score: number;
  reactionLevel: 0 | 1 | 2 | 3;
  cue: 'music' | 'sweat' | null;
  headline: string;
  childMessage: string;
  startedAt: string;
  expiresAt: string | null;
}

export interface Holding {
  productId: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  valuation: number;
  profitLoss: number;
}

export interface Account {
  accountId: 'demo';
  principal: number;
  valuation: number;
  profitLoss: number;
  holdings: Holding[];
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

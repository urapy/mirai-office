export interface SimulatedProduct {
  id: string;
  name: string;
  shortName: string;
  description: string;
  theme: string;
  officeRoomName: string;
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

export interface SimulatedWorkEvent {
  id: string;
  productId: string;
  kind: 'progress' | 'challenge';
  cue: 'music' | 'sweat';
  source: 'automatic' | 'guardian';
  intensity: 1 | 2 | 3;
  scenario?: PerformanceScenarioId;
  headline: string;
  childMessage: string;
  tick: number;
  createdAt: string;
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

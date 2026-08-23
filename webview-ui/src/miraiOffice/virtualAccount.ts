import type { PriceScenario } from './marketScenario.js';

export type InvestmentEvent =
  | { type: 'deposit'; day: number; amount: number }
  | {
      type: 'purchase';
      day: number;
      productId: string;
      amount: number;
      price: number;
      quantity: number;
    }
  | { type: 'priceUpdated'; day: number; price: number };

export interface VirtualAccountState {
  scenarioId: string;
  day: number;
  cash: number;
  principal: number;
  quantity: number;
  holdings: Record<string, number>;
  events: InvestmentEvent[];
}

export interface VirtualAccountView {
  day: number;
  price: number;
  cash: number;
  principal: number;
  quantity: number;
  valuation: number;
  profitLoss: number;
  hasInvestment: boolean;
}

function assertScenarioMatches(state: VirtualAccountState, scenario: PriceScenario): void {
  if (state.scenarioId !== scenario.id) {
    throw new Error('The account and price scenario do not match');
  }
}

function assertPositiveYen(value: number): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error('The amount must be a positive integer in yen');
  }
}

export function createVirtualAccount(scenarioId: string): VirtualAccountState {
  if (scenarioId.length === 0) throw new Error('A scenario ID is required');
  return {
    scenarioId,
    day: 1,
    cash: 0,
    principal: 0,
    quantity: 0,
    holdings: {},
    events: [],
  };
}

export function countPurchases(state: VirtualAccountState): number {
  return state.events.filter((event) => event.type === 'purchase').length;
}

export function getPurchasedProductIds(state: VirtualAccountState): string[] {
  return Object.entries(state.holdings)
    .filter(([, quantity]) => quantity > 0)
    .map(([productId]) => productId);
}

/**
 * MVP convenience transaction: deposit an amount and immediately purchase the
 * selected fictional product at the current day's fixed price.
 */
export function contributeAndPurchase(
  state: VirtualAccountState,
  scenario: PriceScenario,
  amount = 10_000,
  productId = 'world-growth',
): VirtualAccountState {
  assertScenarioMatches(state, scenario);
  assertPositiveYen(amount);
  if (productId.length === 0) throw new Error('A product ID is required');

  const price = scenario.prices[state.day - 1];
  if (price === undefined) throw new Error('The account day is outside the scenario');
  const purchasedQuantity = amount / price;

  return {
    ...state,
    principal: state.principal + amount,
    quantity: state.quantity + purchasedQuantity,
    holdings: {
      ...state.holdings,
      [productId]: (state.holdings[productId] ?? 0) + purchasedQuantity,
    },
    events: [
      ...state.events,
      { type: 'deposit', day: state.day, amount },
      {
        type: 'purchase',
        day: state.day,
        productId,
        amount,
        price,
        quantity: purchasedQuantity,
      },
    ],
  };
}

export function advanceVirtualAccountDay(
  state: VirtualAccountState,
  scenario: PriceScenario,
): VirtualAccountState {
  assertScenarioMatches(state, scenario);
  if (state.day >= scenario.prices.length) {
    throw new Error('The scenario is already on its final day');
  }

  const nextDay = state.day + 1;
  return {
    ...state,
    day: nextDay,
    events: [
      ...state.events,
      { type: 'priceUpdated', day: nextDay, price: scenario.prices[nextDay - 1] },
    ],
  };
}

export function getVirtualAccountView(
  state: VirtualAccountState,
  scenario: PriceScenario,
): VirtualAccountView {
  assertScenarioMatches(state, scenario);
  const dayIndex = state.day - 1;
  const price = scenario.prices[dayIndex];
  if (price === undefined) throw new Error('The account day is outside the scenario');
  const valuation = Math.round(state.cash + state.quantity * price);

  return {
    day: state.day,
    price,
    cash: state.cash,
    principal: state.principal,
    quantity: state.quantity,
    valuation,
    profitLoss: valuation - state.principal,
    hasInvestment: state.principal > 0,
  };
}

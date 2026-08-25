import { getFirestore } from 'firebase-admin/firestore';

import {
  CLOUD_PERFORMANCE_SCENARIOS,
  CLOUD_PRODUCTS,
  type CloudPerformanceScenarioId,
  type CloudPerformanceState,
  getCloudQuote,
} from './market.js';

interface StoredHolding {
  quantity: number;
  cost: number;
}

interface StoredEvent {
  id: string;
  type: 'contribution' | 'purchase';
  productId: string;
  amount: number;
  price?: number;
  quantity?: number;
  createdAt: string;
}

interface StoredAccount {
  principal: number;
  holdings: Record<string, StoredHolding>;
  events: StoredEvent[];
  sequence: number;
  performance: Record<string, CloudPerformanceState>;
}

const ACCOUNT_PATH = 'miraiAccounts/demo';
const EMPTY_ACCOUNT: StoredAccount = {
  principal: 0,
  holdings: {},
  events: [],
  sequence: 0,
  performance: {},
};

function normalizeAccount(value: FirebaseFirestore.DocumentData | undefined): StoredAccount {
  if (!value) return structuredClone(EMPTY_ACCOUNT);
  return {
    principal: Number(value.principal ?? 0),
    holdings: (value.holdings ?? {}) as Record<string, StoredHolding>,
    events: Array.isArray(value.events) ? (value.events as StoredEvent[]) : [],
    sequence: Number(value.sequence ?? 0),
    performance: (value.performance ?? {}) as Record<string, CloudPerformanceState>,
  };
}

function baselinePerformance(productId: string): CloudPerformanceState {
  const scenario = CLOUD_PERFORMANCE_SCENARIOS.steady;
  return {
    productId,
    eventId: `baseline-${productId}`,
    scenario: 'steady',
    label: scenario.label,
    score: scenario.score,
    reactionLevel: scenario.reactionLevel,
    cue: scenario.cue,
    headline: scenario.headline,
    childMessage: scenario.childMessage,
    startedAt: new Date(0).toISOString(),
    expiresAt: null,
  };
}

function activePerformance(
  account: StoredAccount,
  productId: string,
  nowMs: number,
): CloudPerformanceState {
  const state = account.performance[productId];
  if (!state || (state.expiresAt && Date.parse(state.expiresAt) <= nowMs)) {
    return baselinePerformance(productId);
  }
  return state;
}

export function accountSnapshot(account: StoredAccount, nowMs = Date.now()) {
  const holdings = Object.entries(account.holdings).map(([productId, holding]) => {
    const state = activePerformance(account, productId, nowMs);
    const multiplier = CLOUD_PERFORMANCE_SCENARIOS[state.scenario].multiplier;
    const currentPrice = getCloudQuote(productId, nowMs, multiplier).price;
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
    accountId: 'demo' as const,
    principal: account.principal,
    valuation,
    profitLoss: valuation - account.principal,
    holdings,
    updatedAt: new Date(nowMs).toISOString(),
  };
}

export async function getAccount(nowMs = Date.now()) {
  const snapshot = await getFirestore().doc(ACCOUNT_PATH).get();
  return accountSnapshot(normalizeAccount(snapshot.data()), nowMs);
}

export async function getAccountHistory(): Promise<StoredEvent[]> {
  const snapshot = await getFirestore().doc(ACCOUNT_PATH).get();
  return normalizeAccount(snapshot.data()).events;
}

export async function getPerformanceStates(nowMs = Date.now()): Promise<CloudPerformanceState[]> {
  const snapshot = await getFirestore().doc(ACCOUNT_PATH).get();
  const account = normalizeAccount(snapshot.data());
  return CLOUD_PRODUCTS.map((product) => activePerformance(account, product.id, nowMs));
}

export async function triggerPerformanceEvent(
  productId: string,
  scenarioId: CloudPerformanceScenarioId,
  nowMs = Date.now(),
): Promise<CloudPerformanceState> {
  const scenario = CLOUD_PERFORMANCE_SCENARIOS[scenarioId];
  if (!scenario || !CLOUD_PRODUCTS.some((product) => product.id === productId)) {
    throw new Error('Unknown performance scenario or product');
  }
  const state: CloudPerformanceState = {
    productId,
    eventId: `performance-${productId}-${nowMs}`,
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
  await getFirestore().runTransaction(async (transaction) => {
    const reference = getFirestore().doc(ACCOUNT_PATH);
    const snapshot = await transaction.get(reference);
    const current = normalizeAccount(snapshot.data());
    transaction.set(reference, {
      ...current,
      performance: { ...current.performance, [productId]: state },
    });
  });
  return state;
}

export async function getPerformanceMultipliers(nowMs = Date.now()) {
  const states = await getPerformanceStates(nowMs);
  return Object.fromEntries(
    states.map((state) => [
      state.productId,
      CLOUD_PERFORMANCE_SCENARIOS[state.scenario].multiplier,
    ]),
  );
}

export async function contribute(productId: string, amount: number, nowMs = Date.now()) {
  if (!Number.isInteger(amount) || amount <= 0 || amount > 1_000_000) {
    throw new Error('Contribution amount must be an integer from 1 to 1,000,000 yen');
  }
  const quote = getCloudQuote(productId, nowMs);
  const quantity = amount / quote.price;
  const createdAt = new Date(nowMs).toISOString();
  let result = structuredClone(EMPTY_ACCOUNT);

  await getFirestore().runTransaction(async (transaction) => {
    const reference = getFirestore().doc(ACCOUNT_PATH);
    const snapshot = await transaction.get(reference);
    const current = normalizeAccount(snapshot.data());
    const holding = current.holdings[productId] ?? { quantity: 0, cost: 0 };
    const sequence = current.sequence + 2;
    result = {
      principal: current.principal + amount,
      holdings: {
        ...current.holdings,
        [productId]: {
          quantity: holding.quantity + quantity,
          cost: holding.cost + amount,
        },
      },
      events: [
        ...current.events.slice(-198),
        {
          id: `event-${sequence - 1}`,
          type: 'contribution',
          productId,
          amount,
          createdAt,
        },
        {
          id: `event-${sequence}`,
          type: 'purchase',
          productId,
          amount,
          price: quote.price,
          quantity,
          createdAt,
        },
      ],
      sequence,
      performance: current.performance,
    };
    transaction.set(reference, result);
  });

  return accountSnapshot(result, nowMs);
}

export async function resetAccount(nowMs = Date.now()) {
  await getFirestore().doc(ACCOUNT_PATH).set(EMPTY_ACCOUNT);
  return accountSnapshot(structuredClone(EMPTY_ACCOUNT), nowMs);
}

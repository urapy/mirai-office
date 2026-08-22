export type MarketWeather = 'sunny' | 'cloudy' | 'rainy';

export interface PriceScenario {
  id: string;
  name: string;
  purpose: string;
  initialPrice: number;
  prices: number[];
}

export interface PriceScenarioCatalog {
  version: 1;
  scenarios: PriceScenario[];
}

export interface VirtualAccountSnapshot {
  day: number;
  price: number;
  principal: number;
  quantity: number;
  valuation: number;
  profitLoss: number;
  weather: MarketWeather;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0;
}

export function parsePriceScenarioCatalog(value: unknown): PriceScenarioCatalog {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.scenarios)) {
    throw new Error('Invalid price scenario catalog');
  }

  const ids = new Set<string>();
  const scenarios: PriceScenario[] = value.scenarios.map((candidate) => {
    if (!isRecord(candidate)) throw new Error('Invalid price scenario');
    const { id, name, purpose, initialPrice, prices } = candidate;
    if (typeof id !== 'string' || id.length === 0 || ids.has(id)) {
      throw new Error('Price scenario IDs must be unique non-empty strings');
    }
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Price scenario names must not be empty');
    }
    if (typeof purpose !== 'string' || purpose.trim().length === 0) {
      throw new Error('Price scenario purposes must not be empty');
    }
    if (!isPositiveInteger(initialPrice)) {
      throw new Error('Initial prices must be positive integers');
    }
    if (!Array.isArray(prices) || prices.length !== 30 || !prices.every(isPositiveInteger)) {
      throw new Error('Each scenario must contain 30 positive integer prices');
    }
    if (prices[0] !== initialPrice) {
      throw new Error('The first price must match the initial price');
    }

    ids.add(id);
    return {
      id,
      name: name.trim(),
      purpose: purpose.trim(),
      initialPrice,
      prices: [...prices],
    };
  });

  return { version: 1, scenarios };
}

/**
 * Weather describes the recent market environment, not a character's mood.
 * It uses a five-day return and average daily movement so one down day alone
 * never flips the office to rain.
 */
export function calculateMarketWeather(prices: readonly number[], dayIndex: number): MarketWeather {
  if (dayIndex < 4) return 'cloudy';

  const start = dayIndex - 4;
  const windowReturn = prices[dayIndex] / prices[start] - 1;
  let absoluteMovement = 0;
  for (let index = start + 1; index <= dayIndex; index++) {
    absoluteMovement += Math.abs(prices[index] / prices[index - 1] - 1);
  }
  const averageDailyMovement = absoluteMovement / 4;

  if (windowReturn <= -0.03 || averageDailyMovement >= 0.025) return 'rainy';
  if (windowReturn >= 0.02) return 'sunny';
  return 'cloudy';
}

export function calculateVirtualAccountSnapshot(
  scenario: PriceScenario,
  day: number,
  contribution = 10_000,
): VirtualAccountSnapshot {
  if (!Number.isInteger(day) || day < 1 || day > scenario.prices.length) {
    throw new Error('Day is outside the scenario');
  }
  if (!isPositiveInteger(contribution)) {
    throw new Error('Contribution must be a positive integer');
  }

  const dayIndex = day - 1;
  const quantity = contribution / scenario.initialPrice;
  const valuation = Math.round(quantity * scenario.prices[dayIndex]);
  return {
    day,
    price: scenario.prices[dayIndex],
    principal: contribution,
    quantity,
    valuation,
    profitLoss: valuation - contribution,
    weather: calculateMarketWeather(scenario.prices, dayIndex),
  };
}

export interface ScenarioStory {
  day: number;
  headline: string;
  explanation: string;
}

export interface PriceScenario {
  id: string;
  name: string;
  purpose: string;
  initialPrice: number;
  prices: number[];
  stories: ScenarioStory[];
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
    const { id, name, purpose, initialPrice, prices, stories } = candidate;
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
    if (stories !== undefined && !Array.isArray(stories)) {
      throw new Error('Scenario stories must be an array');
    }

    const storyDays = new Set<number>();
    const parsedStories: ScenarioStory[] = (stories ?? []).map((story) => {
      if (!isRecord(story)) throw new Error('Invalid scenario story');
      const { day, headline, explanation } = story;
      if (!Number.isInteger(day) || (day as number) < 1 || (day as number) > prices.length) {
        throw new Error('Scenario story days must be inside the price scenario');
      }
      if (storyDays.has(day as number)) {
        throw new Error('Scenario story days must be unique');
      }
      if (typeof headline !== 'string' || headline.trim().length === 0) {
        throw new Error('Scenario story headlines must not be empty');
      }
      if (typeof explanation !== 'string' || explanation.trim().length === 0) {
        throw new Error('Scenario story explanations must not be empty');
      }
      storyDays.add(day as number);
      return {
        day: day as number,
        headline: headline.trim(),
        explanation: explanation.trim(),
      };
    });

    ids.add(id);
    return {
      id,
      name: name.trim(),
      purpose: purpose.trim(),
      initialPrice,
      prices: [...prices],
      stories: parsedStories,
    };
  });

  return { version: 1, scenarios };
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
  };
}

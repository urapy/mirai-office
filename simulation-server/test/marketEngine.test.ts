import assert from 'node:assert/strict';

import { test } from 'vitest';

import { MarketEngine } from '../src/marketEngine.js';

test('generates the same quote sequence from the same seed', () => {
  const first = new MarketEngine(42);
  const second = new MarketEngine(42);
  for (let tick = 1; tick <= 20; tick++) {
    first.advance(`tick-${tick}`);
    second.advance(`tick-${tick}`);
  }
  assert.deepEqual(first.getQuotes(), second.getQuotes());
});

test('keeps a bounded quote history', () => {
  const market = new MarketEngine();
  for (let tick = 1; tick <= 700; tick++) market.advance(`tick-${tick}`);
  assert.equal(market.getHistory('world-growth', 1_000).length, 600);
});

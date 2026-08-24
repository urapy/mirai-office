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

test('creates meaningful work events independently of quote direction', () => {
  const market = new MarketEngine(42);
  market.advance('tick-1');
  market.advance('tick-2');
  market.advance('tick-3');
  assert.deepEqual(market.getWorkEvents(), [
    {
      id: 'work-world-growth-3',
      productId: 'world-growth',
      kind: 'progress',
      cue: 'music',
      headline: '海外チームとの相談がまとまりました',
      childMessage: '世界の仲間とアイデアを出し合い、次の仕事の進め方が決まりました。',
      tick: 3,
      createdAt: 'tick-3',
    },
  ]);

  for (let tick = 4; tick <= 12; tick++) market.advance(`tick-${tick}`);
  const latest = market.getWorkEvents(1)[0];
  assert.equal(latest.productId, 'world-growth');
  assert.equal(latest.kind, 'challenge');
  assert.equal(latest.cue, 'sweat');
});

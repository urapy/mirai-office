import assert from 'node:assert/strict';

import { test } from 'vitest';

import { createSimulationApp } from '../src/app.js';
import { MarketEngine } from '../src/marketEngine.js';

test('serves products, quotes, and a demo account', async () => {
  const app = await createSimulationApp();
  const products = await app.inject({ method: 'GET', url: '/api/products' });
  const quotes = await app.inject({ method: 'GET', url: '/api/quotes' });
  const account = await app.inject({ method: 'GET', url: '/api/accounts/demo' });

  assert.equal(products.statusCode, 200);
  assert.equal(products.json().products.length, 3);
  assert.equal(quotes.json().quotes.length, 3);
  assert.equal(account.json().principal, 0);
  await app.close();
});

test('accepts a valid contribution and rejects invalid input', async () => {
  const app = await createSimulationApp();
  const valid = await app.inject({
    method: 'POST',
    url: '/api/accounts/demo/contributions',
    payload: { productId: 'world-growth', amount: 5_000 },
  });
  const invalid = await app.inject({
    method: 'POST',
    url: '/api/accounts/demo/contributions',
    payload: { productId: 'world-growth', amount: -1 },
  });

  assert.equal(valid.statusCode, 200);
  assert.equal(valid.json().principal, 5_000);
  assert.equal(invalid.statusCode, 400);
  await app.close();
});

test('serves simulated work events with their character cue', async () => {
  const market = new MarketEngine();
  market.advance('tick-1');
  market.advance('tick-2');
  market.advance('tick-3');
  const app = await createSimulationApp(market);
  const response = await app.inject({ method: 'GET', url: '/api/work-events?limit=1' });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().workEvents[0].productId, 'world-growth');
  assert.equal(response.json().workEvents[0].cue, 'music');
  await app.close();
});

test('resets the accumulated contribution through the account API', async () => {
  const app = await createSimulationApp();
  await app.inject({
    method: 'POST',
    url: '/api/accounts/demo/contributions',
    payload: { productId: 'world-growth', amount: 30_000 },
  });

  const response = await app.inject({ method: 'POST', url: '/api/accounts/demo/reset' });
  const history = await app.inject({ method: 'GET', url: '/api/accounts/demo/history' });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().principal, 0);
  assert.deepEqual(response.json().holdings, []);
  assert.deepEqual(history.json().events, []);
  await app.close();
});

test('triggers and serves a guardian-controlled performance event', async () => {
  const app = await createSimulationApp();
  const triggered = await app.inject({
    method: 'POST',
    url: '/api/products/daily-life/performance-events',
    payload: { scenario: 'major-loss' },
  });
  const performance = await app.inject({ method: 'GET', url: '/api/performance' });

  assert.equal(triggered.statusCode, 200);
  assert.equal(triggered.json().reactionLevel, 3);
  assert.equal(triggered.json().cue, 'sweat');
  assert.equal(
    performance
      .json()
      .performanceStates.find((state: { productId: string }) => state.productId === 'daily-life')
      .scenario,
    'major-loss',
  );
  await app.close();
});

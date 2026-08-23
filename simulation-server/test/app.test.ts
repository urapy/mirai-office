import assert from 'node:assert/strict';

import { test } from 'vitest';

import { createSimulationApp } from '../src/app.js';

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

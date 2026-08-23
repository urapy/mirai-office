import assert from 'node:assert/strict';

import { test } from 'vitest';

import { AccountService } from '../src/accountService.js';
import { MarketEngine } from '../src/marketEngine.js';

test('contributes and immediately purchases the selected product', () => {
  const market = new MarketEngine();
  const account = new AccountService(market);
  const snapshot = account.contribute('daily-life', 10_000, 'test-time');

  assert.equal(snapshot.principal, 10_000);
  assert.equal(snapshot.valuation, 10_000);
  assert.equal(snapshot.holdings[0]?.productId, 'daily-life');
  assert.equal(snapshot.holdings[0]?.quantity, 1);
  assert.deepEqual(
    account.getHistory().map((event) => event.type),
    ['contribution', 'purchase'],
  );
});

test('revalues holdings when market quotes move', () => {
  const market = new MarketEngine(42);
  const account = new AccountService(market);
  account.contribute('future-tech', 10_000);
  market.advance('next-tick');
  const snapshot = account.getSnapshot();

  assert.equal(snapshot.holdings[0]?.currentPrice, market.getQuote('future-tech').price);
  assert.equal(snapshot.profitLoss, snapshot.valuation - snapshot.principal);
});

test('rejects invalid amounts and unknown products', () => {
  const account = new AccountService(new MarketEngine());
  assert.throws(() => account.contribute('world-growth', 0));
  assert.throws(() => account.contribute('unknown', 10_000));
});

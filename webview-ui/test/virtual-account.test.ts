import assert from 'node:assert/strict';

import { test } from 'vitest';

import type { PriceScenario } from '../src/miraiOffice/marketScenario.ts';
import {
  advanceVirtualAccountDay,
  contributeAndPurchase,
  createVirtualAccount,
  getVirtualAccountView,
} from '../src/miraiOffice/virtualAccount.ts';

const scenario: PriceScenario = {
  id: 'test-scenario',
  name: 'テスト',
  purpose: '状態遷移の確認',
  initialPrice: 10_000,
  prices: [10_000, 9_500, 10_500],
};

test('starts with no investment and no profit or loss', () => {
  const state = createVirtualAccount(scenario.id);
  const view = getVirtualAccountView(state, scenario);

  assert.equal(view.day, 1);
  assert.equal(view.principal, 0);
  assert.equal(view.valuation, 0);
  assert.equal(view.profitLoss, 0);
  assert.equal(view.hasInvestment, false);
});

test('deposits 10,000 yen and buys one unit on the first day', () => {
  const state = contributeAndPurchase(createVirtualAccount(scenario.id), scenario);
  const view = getVirtualAccountView(state, scenario);

  assert.equal(view.principal, 10_000);
  assert.equal(view.quantity, 1);
  assert.equal(view.valuation, 10_000);
  assert.equal(state.events.length, 2);
  assert.deepEqual(
    state.events.map((event) => event.type),
    ['deposit', 'purchase'],
  );
});

test('advances through fixed prices without changing the holding quantity', () => {
  const invested = contributeAndPurchase(createVirtualAccount(scenario.id), scenario);
  const day2 = advanceVirtualAccountDay(invested, scenario);
  const day3 = advanceVirtualAccountDay(day2, scenario);

  assert.equal(getVirtualAccountView(day2, scenario).profitLoss, -500);
  assert.equal(getVirtualAccountView(day3, scenario).profitLoss, 500);
  assert.equal(day3.quantity, 1);
  assert.deepEqual(
    day3.events.map((event) => event.type),
    ['deposit', 'purchase', 'priceUpdated', 'priceUpdated'],
  );
});

test('allows another contribution at the current price', () => {
  const invested = contributeAndPurchase(createVirtualAccount(scenario.id), scenario);
  const day2 = advanceVirtualAccountDay(invested, scenario);
  const added = contributeAndPurchase(day2, scenario, 9_500);
  const view = getVirtualAccountView(added, scenario);

  assert.equal(view.principal, 19_500);
  assert.equal(view.quantity, 2);
  assert.equal(view.valuation, 19_000);
  assert.equal(view.profitLoss, -500);
});

test('refuses to advance beyond the final day', () => {
  const state = { ...createVirtualAccount(scenario.id), day: 3 };
  assert.throws(() => advanceVirtualAccountDay(state, scenario));
});

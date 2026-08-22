import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { test } from 'vitest';

import {
  calculateVirtualAccountSnapshot,
  parsePriceScenarioCatalog,
} from '../src/miraiOffice/marketScenario.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function loadCatalog() {
  const json = await readFile(path.join(root, 'public/mirai-office/price-scenarios.json'), 'utf8');
  return parsePriceScenarioCatalog(JSON.parse(json) as unknown);
}

test('loads three reproducible 30-day scenarios', async () => {
  const catalog = await loadCatalog();

  assert.equal(catalog.scenarios.length, 3);
  for (const scenario of catalog.scenarios) {
    assert.equal(scenario.initialPrice, 10_000);
    assert.equal(scenario.prices.length, 30);
    assert.ok(scenario.stories.length > 0);
  }
});

test('bumpy growth ends about five percent above principal', async () => {
  const catalog = await loadCatalog();
  const scenario = catalog.scenarios.find((item) => item.id === 'bumpy-growth')!;
  const result = calculateVirtualAccountSnapshot(scenario, 30);

  assert.equal(result.quantity, 1);
  assert.equal(result.valuation, 10_500);
  assert.equal(result.profitLoss, 500);
});

test('rain then clear falls about ten percent and only partly recovers', async () => {
  const catalog = await loadCatalog();
  const scenario = catalog.scenarios.find((item) => item.id === 'down-then-partial-recovery')!;
  const minimum = Math.min(...scenario.prices);
  const result = calculateVirtualAccountSnapshot(scenario, 30);

  assert.equal(minimum, 9_000);
  assert.equal(result.valuation, 9_700);
  assert.equal(result.profitLoss, -300);
});

test('long cloudy finishes slightly below its initial price', async () => {
  const catalog = await loadCatalog();
  const scenario = catalog.scenarios.find((item) => item.id === 'mostly-flat')!;
  const result = calculateVirtualAccountSnapshot(scenario, 30);

  assert.equal(result.valuation, 9_900);
  assert.equal(result.profitLoss, -100);
});

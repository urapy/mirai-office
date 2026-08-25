import assert from 'node:assert/strict';

import { test } from 'vitest';

import {
  CLOUD_PRODUCTS,
  getCloudHistory,
  getCloudQuote,
  getCloudWorkEvents,
} from '../src/market.js';

test('keeps the cloud fund and office-room mapping in the product API', () => {
  assert.deepEqual(
    CLOUD_PRODUCTS.map((product) => product.officeRoomName),
    ['銀行サービスフロア', 'ITクリエイティブスタジオ', 'ものづくり工場'],
  );
});

test('produces deterministic one-second quotes without an in-memory timer', () => {
  const now = Date.UTC(2026, 7, 24, 1, 0, 0);
  assert.deepEqual(getCloudQuote('world-growth', now), getCloudQuote('world-growth', now));
  assert.notEqual(
    getCloudQuote('world-growth', now).tick,
    getCloudQuote('world-growth', now + 1_000).tick,
  );
});

test('builds bounded history and meaningful work events from time', () => {
  const now = Date.UTC(2026, 7, 24, 1, 0, 0);
  assert.equal(getCloudHistory('daily-life', 1_000, now).length, 600);
  assert.equal(getCloudWorkEvents(20, now).length, 20);
});

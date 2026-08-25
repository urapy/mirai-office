import assert from 'node:assert/strict';

import { test } from 'vitest';

import {
  FICTIONAL_PRODUCTS,
  getProductActorIds,
  getWorkEventActorId,
} from '../src/miraiOffice/productCatalog.ts';

test('keeps three fictional sector funds and one real-company watch subject separate', () => {
  assert.deepEqual(
    FICTIONAL_PRODUCTS.map((product) => product.sector),
    ['金融', 'IT', '産業', 'AI・半導体'],
  );
  assert.equal(
    FICTIONAL_PRODUCTS.filter((product) => product.kind === 'fund').every(
      (product) => product.companies.length === 3,
    ),
    true,
  );

  const companies = FICTIONAL_PRODUCTS.filter((product) => product.kind === 'fund').flatMap(
    (product) => product.companies,
  );
  assert.equal(new Set(companies.map((company) => company.actorId)).size, 9);
  assert.equal(new Set(companies.map((company) => company.name)).size, 9);
  assert.deepEqual(
    FICTIONAL_PRODUCTS.map((product) => product.officeRoomName),
    [
      '銀行サービスフロア',
      'ITクリエイティブスタジオ',
      'ものづくり工場',
      'AIコンピューティングラボ',
    ],
  );
  assert.equal(FICTIONAL_PRODUCTS.at(-1)?.kind, 'company-watch');
});

test('assigns work events across the companies in a fund', () => {
  const actorIds = getProductActorIds('daily-life');
  const selected = [0, 9, 18].map((tick) => getWorkEventActorId('daily-life', tick));

  assert.deepEqual(selected, actorIds);
});

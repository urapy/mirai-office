import assert from 'node:assert/strict';

import { test } from 'vitest';

import {
  FICTIONAL_PRODUCTS,
  getProductActorIds,
  getWorkEventActorId,
} from '../src/miraiOffice/productCatalog.ts';

test('groups three child-friendly fictional companies into each sector fund', () => {
  assert.deepEqual(
    FICTIONAL_PRODUCTS.map((product) => product.sector),
    ['金融', 'IT', '産業'],
  );
  assert.equal(
    FICTIONAL_PRODUCTS.every((product) => product.companies.length === 3),
    true,
  );

  const companies = FICTIONAL_PRODUCTS.flatMap((product) => product.companies);
  assert.equal(new Set(companies.map((company) => company.actorId)).size, 9);
  assert.equal(new Set(companies.map((company) => company.name)).size, 9);
});

test('assigns work events across the companies in a fund', () => {
  const actorIds = getProductActorIds('daily-life');
  const selected = [0, 9, 18].map((tick) => getWorkEventActorId('daily-life', tick));

  assert.deepEqual(selected, actorIds);
});

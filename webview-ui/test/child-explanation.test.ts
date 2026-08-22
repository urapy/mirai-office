import assert from 'node:assert/strict';

import { test } from 'vitest';

import { getChildExplanation } from '../src/miraiOffice/childExplanation.ts';
import type { PriceScenario } from '../src/miraiOffice/marketScenario.ts';

const scenario: PriceScenario = {
  id: 'story-test',
  name: '説明テスト',
  purpose: '子ども向け説明の確認',
  initialPrice: 10_000,
  prices: [10_000, 10_100, 9_900, 9_900],
  stories: [
    {
      day: 3,
      headline: '材料費への心配が増えました',
      explanation: '商品を作る費用が増えています。',
    },
  ],
};

test('uses the fixed fictional story when one exists for the day', () => {
  const result = getChildExplanation(scenario, 3);
  assert.equal(result.source, 'story');
  assert.equal(result.headline, '材料費への心配が増えました');
});

test('uses neutral summaries without claiming a single cause', () => {
  assert.equal(getChildExplanation(scenario, 2).headline, 'チーム全体の値段が上がりました');
  assert.equal(getChildExplanation(scenario, 4).headline, 'チーム全体の値段は同じでした');
});

test('explains diversification on the first day', () => {
  const result = getChildExplanation(scenario, 1);
  assert.match(result.explanation, /分けて投資/);
});

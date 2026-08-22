import type { PriceScenario } from './marketScenario.js';

export interface ChildExplanation {
  headline: string;
  explanation: string;
  source: 'story' | 'market-summary';
}

export function getChildExplanation(scenario: PriceScenario, day: number): ChildExplanation {
  if (!Number.isInteger(day) || day < 1 || day > scenario.prices.length) {
    throw new Error('Day is outside the scenario');
  }

  const story = scenario.stories?.find((item) => item.day === day);
  if (story) {
    return {
      headline: story.headline,
      explanation: story.explanation,
      source: 'story',
    };
  }

  if (day === 1) {
    return {
      headline: '世界の会社を応援するチームです',
      explanation:
        '「みらい世界チーム」は、世界のいろいろな会社へ少しずつ分けて投資する架空の商品です。',
      source: 'market-summary',
    };
  }

  const currentPrice = scenario.prices[day - 1];
  const previousPrice = scenario.prices[day - 2];
  if (currentPrice > previousPrice) {
    return {
      headline: 'チーム全体の値段が上がりました',
      explanation:
        '会社の成長やこれからに期待する人が増えると、投資商品の値段が上がることがあります。',
      source: 'market-summary',
    };
  }
  if (currentPrice < previousPrice) {
    return {
      headline: 'チーム全体の値段が下がりました',
      explanation:
        '景気や会社のこれからを心配する人が増えると、投資商品の値段が下がることがあります。会社の仕事は今日も続いています。',
      source: 'market-summary',
    };
  }
  return {
    headline: 'チーム全体の値段は同じでした',
    explanation: '投資商品の値段は、会社の仕事や社会の動きを見ながら、上がったり下がったりします。',
    source: 'market-summary',
  };
}

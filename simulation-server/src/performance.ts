import type { PerformanceScenarioId, PerformanceState } from './types.js';

interface PerformanceScenario {
  label: string;
  score: number;
  reactionLevel: 0 | 1 | 2 | 3;
  cue: 'music' | 'sweat' | null;
  priceMultiplier: number;
  headline: string;
  childMessage: string;
}

export const PERFORMANCE_SCENARIOS: Readonly<Record<PerformanceScenarioId, PerformanceScenario>> = {
  'rapid-growth': {
    label: '急成長',
    score: 95,
    reactionLevel: 3,
    cue: 'music',
    priceMultiplier: 1.08,
    headline: '大きな仕事が一気に進みました',
    childMessage: '会社の取り組みがうまく進み、期待が大きく高まった架空イベントです。',
  },
  growth: {
    label: '好調',
    score: 76,
    reactionLevel: 1,
    cue: 'music',
    priceMultiplier: 1.03,
    headline: '仕事が順調に進んでいます',
    childMessage: '会社の仕事が計画より順調に進んだ架空イベントです。',
  },
  steady: {
    label: '通常',
    score: 55,
    reactionLevel: 0,
    cue: null,
    priceMultiplier: 1,
    headline: 'いつもの仕事を続けています',
    childMessage: '特別な変化はなく、会社が日々の仕事を続けている状態です。',
  },
  slump: {
    label: '苦戦',
    score: 30,
    reactionLevel: 2,
    cue: 'sweat',
    priceMultiplier: 0.97,
    headline: '計画の見直しが必要になりました',
    childMessage: '仕事に課題が見つかり、会社が対策を考えている架空イベントです。',
  },
  'major-loss': {
    label: '大赤字',
    score: 8,
    reactionLevel: 3,
    cue: 'sweat',
    priceMultiplier: 0.92,
    headline: '大きな損失への対応を進めています',
    childMessage: '大きな費用や失敗が重なり、会社全体で立て直しに取り組む架空イベントです。',
  },
};

export function baselinePerformance(productId: string): PerformanceState {
  const scenario = PERFORMANCE_SCENARIOS.steady;
  return {
    productId,
    eventId: `baseline-${productId}`,
    scenario: 'steady',
    label: scenario.label,
    score: scenario.score,
    reactionLevel: scenario.reactionLevel,
    cue: scenario.cue,
    headline: scenario.headline,
    childMessage: scenario.childMessage,
    startedAt: new Date(0).toISOString(),
    expiresAt: null,
  };
}

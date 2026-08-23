import { useEffect, useMemo, useState } from 'react';

import { Button } from '../components/ui/Button.js';
import { getChildExplanation } from './childExplanation.js';
import { parsePriceScenarioCatalog, type PriceScenarioCatalog } from './marketScenario.js';
import { FICTIONAL_PRODUCTS } from './productCatalog.js';
import {
  advanceVirtualAccountDay,
  contributeAndPurchase,
  createVirtualAccount,
  getPurchasedProductIds,
  getVirtualAccountView,
  type VirtualAccountState,
} from './virtualAccount.js';

interface VirtualAccountPanelProps {
  onVisibleActorIdsChange?: (actorIds: number[]) => void;
}

function formatYen(value: number): string {
  return `${new Intl.NumberFormat('ja-JP').format(value)}円`;
}

function formatSignedYen(value: number): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${formatYen(value)}`;
}

export function VirtualAccountPanel({ onVisibleActorIdsChange }: VirtualAccountPanelProps) {
  const [catalog, setCatalog] = useState<PriceScenarioCatalog | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [screen, setScreen] = useState<'child' | 'guardian'>('child');
  const [account, setAccount] = useState<VirtualAccountState | null>(null);
  const [selectedProductId, setSelectedProductId] = useState(FICTIONAL_PRODUCTS[0].id);
  const [contributionAmount, setContributionAmount] = useState(10_000);

  useEffect(() => {
    const controller = new AbortController();
    const url = `${import.meta.env.BASE_URL}mirai-office/price-scenarios.json`;
    void fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`価格データを読み込めませんでした (${response.status})`);
        return response.json() as Promise<unknown>;
      })
      .then((value) => {
        const loaded = parsePriceScenarioCatalog(value);
        const firstScenario = loaded.scenarios[0];
        if (!firstScenario) throw new Error('価格シナリオがありません');
        setCatalog(loaded);
        setAccount(createVirtualAccount(firstScenario.id));
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(error instanceof Error ? error.message : String(error));
      });
    return () => controller.abort();
  }, []);

  const scenario = useMemo(
    () => catalog?.scenarios.find((item) => item.id === account?.scenarioId) ?? null,
    [account?.scenarioId, catalog],
  );
  const view = account && scenario ? getVirtualAccountView(account, scenario) : null;
  const purchasedProductIds = useMemo(
    () => (account ? getPurchasedProductIds(account) : []),
    [account],
  );
  const purchasedProducts = useMemo(
    () => FICTIONAL_PRODUCTS.filter((product) => purchasedProductIds.includes(product.id)),
    [purchasedProductIds],
  );
  const visibleActorIds = useMemo(
    () => purchasedProducts.map((product) => product.actorId),
    [purchasedProducts],
  );

  useEffect(() => {
    onVisibleActorIdsChange?.(visibleActorIds);
  }, [onVisibleActorIdsChange, visibleActorIds]);

  const resetForScenario = (scenarioId: string) => {
    setAccount(createVirtualAccount(scenarioId));
  };

  if (loadError) {
    return (
      <div role="alert" className="absolute top-8 right-8 z-30 pixel-panel p-12 text-sm max-w-3xs">
        {loadError}
      </div>
    );
  }

  if (!catalog || !account || !scenario || !view) {
    return (
      <div role="status" className="absolute top-8 right-8 z-30 pixel-panel p-12 text-sm">
        仮想口座を準備しています…
      </div>
    );
  }

  if (screen === 'child') {
    const childExplanation = getChildExplanation(scenario, view.day);
    return (
      <section className="absolute top-8 right-8 z-30 pixel-panel p-12 w-320 max-h-[calc(100vh-16px)] overflow-y-auto flex flex-col gap-10">
        <div className="flex items-start justify-between gap-8">
          <div>
            <p className="m-0 text-xs text-text-muted">子ども画面</p>
            <h2 className="m-0 text-lg">わたしの投資チーム</h2>
          </div>
          <div className="text-right text-sm text-text-muted">
            <div>{view.day}日目 / 30日</div>
            <div>
              商品 {purchasedProducts.length} / {FICTIONAL_PRODUCTS.length}こ
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          <div className="bg-bg-dark border-2 border-border p-8">
            <p className="m-0 text-xs text-text-muted">投資したお金（元本）</p>
            <p className="m-0 text-lg">{formatYen(view.principal)}</p>
          </div>
          <div className="bg-bg-dark border-2 border-border p-8">
            <p className="m-0 text-xs text-text-muted">いまの価値（評価額）</p>
            <p className="m-0 text-lg">{formatYen(view.valuation)}</p>
          </div>
          <div className="bg-bg-dark border-2 border-border p-8">
            <p className="m-0 text-xs text-text-muted">増えた・減った金額（損益）</p>
            <p className="m-0 text-lg">{formatSignedYen(view.profitLoss)}</p>
          </div>
        </div>

        <div className="border-2 border-border p-8 flex flex-col gap-4">
          <h3 className="m-0 text-base">{childExplanation.headline}</h3>
          <p className="m-0 text-sm leading-snug">{childExplanation.explanation}</p>
        </div>

        {purchasedProducts.length > 0 && (
          <div className="flex flex-col gap-4">
            <p className="m-0 text-xs text-text-muted">積み立てている商品</p>
            {purchasedProducts.map((product) => (
              <div key={product.id} className="bg-bg-dark border-2 border-border p-6">
                <p className="m-0 text-sm">{product.name}</p>
                <p className="m-0 mt-2 text-xs text-text-muted leading-snug">
                  {product.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {!view.hasInvestment && (
          <p className="m-0 text-sm leading-snug">
            おうちの人といっしょに、最初の積み立てを始めましょう。
          </p>
        )}
        {purchasedProducts.length >= FICTIONAL_PRODUCTS.length && (
          <p className="m-0 text-sm leading-snug">
            3つの商品がそろいました。これからも選んだ商品へ積み立てを続けられます。
          </p>
        )}
        <Button size="md" onClick={() => setScreen('guardian')}>
          保護者画面へ
        </Button>
      </section>
    );
  }

  const isFinalDay = view.day >= scenario.prices.length;
  return (
    <section className="absolute top-8 right-8 z-30 pixel-panel p-12 w-320 max-h-[calc(100vh-16px)] overflow-y-auto flex flex-col gap-10">
      <div className="flex items-start justify-between gap-8">
        <div>
          <p className="m-0 text-xs text-text-muted">保護者用・仮想口座</p>
          <h2 className="m-0 text-lg">商品の選択と積み立て</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setScreen('child')}>
          子ども画面へ
        </Button>
      </div>

      <fieldset className="m-0 p-0 border-0 flex flex-col gap-5">
        <legend className="mb-3 text-xs text-text-muted">積み立てる架空の商品</legend>
        {FICTIONAL_PRODUCTS.map((product) => {
          const isSelected = product.id === selectedProductId;
          const isOwned = purchasedProductIds.includes(product.id);
          return (
            <label
              key={product.id}
              className={`border-2 p-7 cursor-pointer ${
                isSelected ? 'border-accent bg-bg-dark' : 'border-border'
              }`}
            >
              <input
                type="radio"
                name="fictional-product"
                value={product.id}
                checked={isSelected}
                onChange={() => setSelectedProductId(product.id)}
                className="mr-5"
              />
              <span className="text-sm">{product.name}</span>
              {isOwned && <span className="ml-4 text-xs text-text-muted">積立中</span>}
              <span className="block mt-3 text-xs text-text-muted leading-snug">
                {product.description}
              </span>
            </label>
          );
        })}
      </fieldset>

      <label className="flex flex-col gap-3 text-xs text-text-muted">
        積立額
        <select
          value={contributionAmount}
          onChange={(event) => setContributionAmount(Number(event.target.value))}
          className="bg-bg-dark text-text border-2 border-border p-5 text-sm"
        >
          {[1_000, 5_000, 10_000].map((amount) => (
            <option key={amount} value={amount}>
              {formatYen(amount)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-3 text-xs text-text-muted">
        シミュレーション設定（商品の選択とは別）
        <select
          value={scenario.id}
          onChange={(event) => resetForScenario(event.target.value)}
          className="bg-bg-dark text-text border-2 border-border p-5 text-sm"
        >
          {catalog.scenarios.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <p className="m-0 text-xs text-text-muted leading-snug">{scenario.purpose}</p>

      <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
        <span className="text-text-muted">日付</span>
        <span className="text-right">{view.day}日目 / 30日</span>
        <span className="text-text-muted">現在価格</span>
        <span className="text-right">{formatYen(view.price)}</span>
        <span className="text-text-muted">元本</span>
        <span className="text-right">{formatYen(view.principal)}</span>
        <span className="text-text-muted">評価額</span>
        <span className="text-right">{formatYen(view.valuation)}</span>
        <span className="text-text-muted">損益</span>
        <span className="text-right">{formatYen(view.profitLoss)}</span>
        <span className="text-text-muted">保有数量</span>
        <span className="text-right">{view.quantity.toFixed(4)}口</span>
        <span className="text-text-muted">積立中の商品</span>
        <span className="text-right">
          {purchasedProducts.length} / {FICTIONAL_PRODUCTS.length}こ
        </span>
      </div>

      <div className="flex flex-wrap gap-5">
        <Button
          variant="accent"
          size="md"
          onClick={() =>
            setAccount(
              contributeAndPurchase(account, scenario, contributionAmount, selectedProductId),
            )
          }
        >
          {formatYen(contributionAmount)}を積み立てる
        </Button>
        <Button
          size="md"
          disabled={!view.hasInvestment || isFinalDay}
          onClick={() => setAccount(advanceVirtualAccountDay(account, scenario))}
          className="disabled:cursor-default disabled:opacity-(--btn-disabled-opacity)"
        >
          1日進める
        </Button>
        <Button size="md" variant="ghost" onClick={() => resetForScenario(scenario.id)}>
          はじめから
        </Button>
      </div>

      <p className="m-0 text-xs text-text-muted leading-snug">
        学習用の完全な仮想口座です。実在する金融商品や将来の利益を示すものではありません。
      </p>
    </section>
  );
}

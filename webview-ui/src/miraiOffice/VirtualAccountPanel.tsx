import { useEffect, useMemo, useState } from 'react';

import { Button } from '../components/ui/Button.js';
import { getChildExplanation } from './childExplanation.js';
import { parsePriceScenarioCatalog, type PriceScenarioCatalog } from './marketScenario.js';
import { FICTIONAL_PRODUCTS } from './productCatalog.js';
import {
  contributeRealtime,
  loadRealtimeSnapshot,
  type RealtimeSnapshot,
  resetRealtimeAccount,
  subscribeRealtimeQuotes,
} from './realtimeApi.js';
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
  onStoryCue?: (cue: 'music' | 'sweat', day: number) => void;
}

function formatYen(value: number): string {
  return `${new Intl.NumberFormat('ja-JP').format(value)}円`;
}

function formatSignedYen(value: number): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${formatYen(value)}`;
}

export function VirtualAccountPanel({
  onVisibleActorIdsChange,
  onStoryCue,
}: VirtualAccountPanelProps) {
  const [catalog, setCatalog] = useState<PriceScenarioCatalog | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [screen, setScreen] = useState<'child' | 'guardian'>('child');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [account, setAccount] = useState<VirtualAccountState | null>(null);
  const [selectedProductId, setSelectedProductId] = useState(FICTIONAL_PRODUCTS[0].id);
  const [contributionAmount, setContributionAmount] = useState(10_000);
  const [realtimeSnapshot, setRealtimeSnapshot] = useState<RealtimeSnapshot | null>(null);
  const [realtimeConnection, setRealtimeConnection] = useState<'connecting' | 'live' | 'stopped'>(
    'connecting',
  );
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    const controller = new AbortController();
    void loadRealtimeSnapshot(controller.signal)
      .then((snapshot) => {
        setRealtimeSnapshot(snapshot);
        setRealtimeConnection('live');
        setRealtimeError(null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setRealtimeConnection('stopped');
        setRealtimeError(error instanceof Error ? error.message : String(error));
      });
    const unsubscribe = subscribeRealtimeQuotes(
      (snapshot) => {
        setRealtimeSnapshot(snapshot);
        setRealtimeError(null);
      },
      (connected) => setRealtimeConnection(connected ? 'live' : 'stopped'),
    );
    return () => {
      controller.abort();
      unsubscribe();
    };
  }, []);

  const scenario = useMemo(
    () => catalog?.scenarios.find((item) => item.id === account?.scenarioId) ?? null,
    [account?.scenarioId, catalog],
  );
  const view = account && scenario ? getVirtualAccountView(account, scenario) : null;
  const isRealtime = realtimeSnapshot !== null;
  const selectedRealtimeQuote = realtimeSnapshot?.quotes.find(
    (quote) => quote.productId === selectedProductId,
  );
  const selectedRealtimeHolding = realtimeSnapshot?.account.holdings.find(
    (holding) => holding.productId === selectedProductId,
  );
  const displayView = realtimeSnapshot
    ? {
        day: 1,
        price: selectedRealtimeQuote?.price ?? 0,
        principal: realtimeSnapshot.account.principal,
        quantity: selectedRealtimeHolding?.quantity ?? 0,
        valuation: realtimeSnapshot.account.valuation,
        profitLoss: realtimeSnapshot.account.profitLoss,
        hasInvestment: realtimeSnapshot.account.principal > 0,
      }
    : view;
  const purchasedProductIds = useMemo(
    () =>
      realtimeSnapshot
        ? realtimeSnapshot.account.holdings.map((holding) => holding.productId)
        : account
          ? getPurchasedProductIds(account)
          : [],
    [account, realtimeSnapshot],
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

  const advanceDay = () => {
    const nextAccount = advanceVirtualAccountDay(account!, scenario!);
    setAccount(nextAccount);
    const story = scenario!.stories.find((candidate) => candidate.day === nextAccount.day);
    if (story?.tone === 'positive') onStoryCue?.('music', nextAccount.day);
    if (story?.tone === 'challenge') onStoryCue?.('sweat', nextAccount.day);
  };

  const handleContribution = async () => {
    if (!isRealtime) {
      setAccount(contributeAndPurchase(account!, scenario!, contributionAmount, selectedProductId));
      return;
    }
    setIsSubmitting(true);
    try {
      const nextAccount = await contributeRealtime(selectedProductId, contributionAmount);
      setRealtimeSnapshot((current) => (current ? { ...current, account: nextAccount } : current));
      setRealtimeError(null);
    } catch (error) {
      setRealtimeError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!isRealtime) {
      resetForScenario(scenario!.id);
      return;
    }
    try {
      const nextAccount = await resetRealtimeAccount();
      setRealtimeSnapshot((current) => (current ? { ...current, account: nextAccount } : current));
      setRealtimeError(null);
    } catch (error) {
      setRealtimeError(error instanceof Error ? error.message : String(error));
    }
  };

  if (loadError) {
    return (
      <div role="alert" className="absolute top-8 right-8 z-30 pixel-panel p-12 text-sm max-w-3xs">
        {loadError}
      </div>
    );
  }

  if (!catalog || !account || !scenario || !view || !displayView) {
    return (
      <div role="status" className="absolute top-8 right-8 z-30 pixel-panel p-12 text-sm">
        仮想口座を準備しています…
      </div>
    );
  }

  if (!isPanelOpen) {
    return (
      <Button
        size="sm"
        className="absolute top-8 right-8 z-30 shadow-pixel"
        aria-expanded="false"
        onClick={() => setIsPanelOpen(true)}
      >
        口座パネルを表示
      </Button>
    );
  }

  if (screen === 'child') {
    const childExplanation = isRealtime
      ? {
          headline:
            realtimeConnection === 'live'
              ? '商品の値段をリアルタイムで受け取っています'
              : '商品の値段は、いま更新を待っています',
          explanation:
            '架空の市場では、いろいろな人の考えや会社への期待によって、商品の値段が少しずつ動いています。',
        }
      : getChildExplanation(scenario, view.day);
    return (
      <section className="absolute top-8 right-8 z-30 pixel-panel p-12 w-320 max-h-[calc(100vh-16px)] overflow-y-auto flex flex-col gap-10">
        <div className="flex items-start justify-between gap-8">
          <div>
            <p className="m-0 text-xs text-text-muted">子ども画面</p>
            <h2 className="m-0 text-lg">わたしの投資チーム</h2>
          </div>
          <div className="flex flex-col items-end gap-3 text-right text-sm text-text-muted">
            <div>{isRealtime ? 'リアルタイム' : `${view.day}日目 / 30日`}</div>
            <div>
              商品 {purchasedProducts.length} / {FICTIONAL_PRODUCTS.length}こ
            </div>
            <Button
              variant="ghost"
              size="sm"
              aria-expanded="true"
              onClick={() => setIsPanelOpen(false)}
            >
              閉じる
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          <div className="bg-bg-dark border-2 border-border p-8">
            <p className="m-0 text-xs text-text-muted">投資したお金（元本）</p>
            <p className="m-0 text-lg">{formatYen(displayView.principal)}</p>
          </div>
          <div className="bg-bg-dark border-2 border-border p-8">
            <p className="m-0 text-xs text-text-muted">いまの価値（評価額）</p>
            <p className="m-0 text-lg">{formatYen(displayView.valuation)}</p>
          </div>
          <div className="bg-bg-dark border-2 border-border p-8">
            <p className="m-0 text-xs text-text-muted">増えた・減った金額（損益）</p>
            <p className="m-0 text-lg">{formatSignedYen(displayView.profitLoss)}</p>
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

        {!displayView.hasInvestment && (
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
        <div className="flex flex-col items-end gap-3">
          <Button variant="ghost" size="sm" onClick={() => setScreen('child')}>
            子ども画面へ
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-expanded="true"
            onClick={() => setIsPanelOpen(false)}
          >
            閉じる
          </Button>
        </div>
      </div>

      <div
        className={`border-2 p-6 text-xs ${
          realtimeConnection === 'live'
            ? 'border-status-success text-status-success'
            : 'border-status-permission text-text-muted'
        }`}
      >
        {isRealtime
          ? realtimeConnection === 'live'
            ? '仮想市場APIからリアルタイム更新中'
            : '更新停止：最後に受信した金額を表示しています'
          : 'ローカルデモモード：仮想市場APIは停止しています'}
      </div>
      {realtimeError && <p className="m-0 text-xs text-status-error">{realtimeError}</p>}

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

      {!isRealtime && (
        <>
          <label className="flex flex-col gap-3 text-xs text-text-muted">
            ローカルデモのシナリオ設定
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
        </>
      )}

      <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
        <span className="text-text-muted">更新</span>
        <span className="text-right">
          {isRealtime ? `ティック ${selectedRealtimeQuote?.tick ?? 0}` : `${view.day}日目 / 30日`}
        </span>
        <span className="text-text-muted">現在価格</span>
        <span className="text-right">{formatYen(displayView.price)}</span>
        <span className="text-text-muted">元本</span>
        <span className="text-right">{formatYen(displayView.principal)}</span>
        <span className="text-text-muted">評価額</span>
        <span className="text-right">{formatYen(displayView.valuation)}</span>
        <span className="text-text-muted">損益</span>
        <span className="text-right">{formatYen(displayView.profitLoss)}</span>
        <span className="text-text-muted">{isRealtime ? '選択商品の保有数量' : '保有数量'}</span>
        <span className="text-right">{displayView.quantity.toFixed(4)}口</span>
        <span className="text-text-muted">積立中の商品</span>
        <span className="text-right">
          {purchasedProducts.length} / {FICTIONAL_PRODUCTS.length}こ
        </span>
      </div>

      <div className="flex flex-wrap gap-5">
        <Button
          variant="accent"
          size="md"
          disabled={isSubmitting || (isRealtime && realtimeConnection !== 'live')}
          onClick={() => void handleContribution()}
        >
          {isSubmitting ? '処理中…' : `${formatYen(contributionAmount)}を積み立てる`}
        </Button>
        {!isRealtime && (
          <Button
            size="md"
            disabled={!view.hasInvestment || isFinalDay}
            onClick={advanceDay}
            className="disabled:cursor-default disabled:opacity-(--btn-disabled-opacity)"
          >
            1日進める
          </Button>
        )}
        <Button
          size="md"
          variant="ghost"
          disabled={isSubmitting || (isRealtime && realtimeConnection !== 'live')}
          onClick={() => void handleReset()}
        >
          はじめから
        </Button>
      </div>

      <p className="m-0 text-xs text-text-muted leading-snug">
        学習用の完全な仮想口座です。実在する金融商品や将来の利益を示すものではありません。
      </p>
    </section>
  );
}

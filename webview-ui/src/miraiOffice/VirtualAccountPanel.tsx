import { useEffect, useMemo, useRef, useState } from 'react';

import { FICTIONAL_PRODUCTS } from './productCatalog.js';
import {
  BROKERAGE_UI_URL,
  loadRealtimeSnapshot,
  type RealtimeHolding,
  type RealtimeSnapshot,
  type RealtimeWorkEvent,
  subscribeRealtimeQuotes,
} from './realtimeApi.js';

interface VirtualAccountPanelProps {
  onVisibleActorIdsChange?: (actorIds: number[]) => void;
  onWorkEvent?: (event: RealtimeWorkEvent) => void;
}

function formatYen(value: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatSignedYen(value: number): string {
  return `${value > 0 ? '+' : ''}${formatYen(value)}`;
}

function getProduct(productId: string) {
  return FICTIONAL_PRODUCTS.find((product) => product.id === productId);
}

function HoldingRow({ holding }: { holding: RealtimeHolding }) {
  const product = getProduct(holding.productId);
  const isPositive = holding.profitLoss >= 0;

  return (
    <div className="mirai-holding-row">
      <span className={`mirai-product-mark mirai-product-mark--${holding.productId}`} />
      <div className="mirai-holding-name">
        <strong>{product?.name ?? holding.productId}</strong>
        <span>{holding.quantity.toFixed(4)}口</span>
      </div>
      <div className="mirai-holding-value">
        <strong>{formatYen(holding.valuation)}</strong>
        <span className={isPositive ? 'is-positive' : 'is-negative'}>
          {formatSignedYen(holding.profitLoss)}
        </span>
      </div>
    </div>
  );
}

export function VirtualAccountPanel({
  onVisibleActorIdsChange,
  onWorkEvent,
}: VirtualAccountPanelProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [snapshot, setSnapshot] = useState<RealtimeSnapshot | null>(null);
  const [connection, setConnection] = useState<'connecting' | 'live' | 'stopped'>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [latestWorkEvent, setLatestWorkEvent] = useState<RealtimeWorkEvent | null>(null);
  const handledWorkEventIds = useRef(new Set<string>());

  useEffect(() => {
    const controller = new AbortController();
    void loadRealtimeSnapshot(controller.signal)
      .then((nextSnapshot) => {
        setSnapshot(nextSnapshot);
        const ownedProductIds = new Set(
          nextSnapshot.account.holdings.map((holding) => holding.productId),
        );
        for (const workEvent of nextSnapshot.workEvents) {
          handledWorkEventIds.current.add(workEvent.id);
        }
        const recentEvent = [...nextSnapshot.workEvents]
          .reverse()
          .find((workEvent) => ownedProductIds.has(workEvent.productId));
        if (recentEvent) {
          setLatestWorkEvent(recentEvent);
        }
        setConnection('live');
        setError(null);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setConnection('stopped');
        setError(reason instanceof Error ? reason.message : String(reason));
      });

    const unsubscribe = subscribeRealtimeQuotes(
      (nextSnapshot) => {
        setSnapshot(nextSnapshot);
        const ownedProductIds = new Set(
          nextSnapshot.account.holdings.map((holding) => holding.productId),
        );
        for (const workEvent of nextSnapshot.workEvents) {
          if (handledWorkEventIds.current.has(workEvent.id)) continue;
          handledWorkEventIds.current.add(workEvent.id);
          if (!ownedProductIds.has(workEvent.productId)) continue;
          setLatestWorkEvent(workEvent);
          onWorkEvent?.(workEvent);
        }
        setError(null);
      },
      (connected) => setConnection(connected ? 'live' : 'stopped'),
    );

    return () => {
      controller.abort();
      unsubscribe();
    };
  }, [onWorkEvent]);

  const holdings = useMemo(() => snapshot?.account.holdings ?? [], [snapshot]);
  const visibleActorIds = useMemo(
    () =>
      FICTIONAL_PRODUCTS.filter((product) =>
        holdings.some((holding) => holding.productId === product.id),
      ).map((product) => product.actorId),
    [holdings],
  );

  useEffect(() => {
    onVisibleActorIdsChange?.(visibleActorIds);
  }, [onVisibleActorIdsChange, visibleActorIds]);

  const account = snapshot?.account;
  const profitLoss = account?.profitLoss ?? 0;
  const isPositive = profitLoss >= 0;
  const connectionLabel =
    connection === 'live' ? 'ライブ更新' : connection === 'connecting' ? '接続中' : '更新停止';

  if (!isPanelOpen) {
    return (
      <button
        type="button"
        className="mirai-panel-launcher"
        aria-label="口座サマリーを表示"
        aria-expanded="false"
        onClick={() => setIsPanelOpen(true)}
      >
        <span className={`mirai-status-dot mirai-status-dot--${connection}`} />
        <span>口座サマリー</span>
      </button>
    );
  }

  return (
    <section className="mirai-dashboard" aria-label="みらいオフィス口座サマリー">
      <header className="mirai-dashboard-header">
        <div className="mirai-brand">
          <span className="mirai-brand-mark">M</span>
          <div>
            <strong>みらいオフィス</strong>
            <span>わたしの投資チーム</span>
          </div>
        </div>
        <div className="mirai-header-actions">
          <span className={`mirai-live-status mirai-live-status--${connection}`}>
            <span className={`mirai-status-dot mirai-status-dot--${connection}`} />
            {connectionLabel}
          </span>
          <button
            type="button"
            className="mirai-close-button"
            aria-label="口座サマリーを閉じる"
            aria-expanded="true"
            onClick={() => setIsPanelOpen(false)}
          >
            ×
          </button>
        </div>
      </header>

      <div className="mirai-balance-block">
        <span>いまの価値</span>
        <strong>{account ? formatYen(account.valuation) : '—'}</strong>
        <span className={`mirai-pnl-pill ${isPositive ? 'is-positive' : 'is-negative'}`}>
          {account ? `損益 ${formatSignedYen(profitLoss)}` : '口座を読み込み中'}
        </span>
      </div>

      <div className="mirai-metric-grid">
        <div>
          <span>投資したお金</span>
          <strong>{account ? formatYen(account.principal) : '—'}</strong>
        </div>
        <div>
          <span>チームの商品</span>
          <strong>
            {holdings.length}
            <small> / 3</small>
          </strong>
        </div>
      </div>

      <div className="mirai-section-heading">
        <span>投資チーム</span>
        <small>
          {holdings.length > 0 ? `${holdings.length}商品が活動中` : 'まだ仲間はいません'}
        </small>
      </div>

      <div className="mirai-holdings">
        {holdings.length > 0 ? (
          holdings.map((holding) => <HoldingRow key={holding.productId} holding={holding} />)
        ) : (
          <div className="mirai-empty-state">
            <span className="mirai-empty-icon">＋</span>
            <div>
              <strong>最初の仲間を迎えよう</strong>
              <span>保護者用の仮想証券口座で積み立てると、仲間が出勤します。</span>
            </div>
          </div>
        )}
      </div>

      <div className="mirai-learning-note">
        <span>{latestWorkEvent?.headline ?? '学びのメモ'}</span>
        <p>
          {latestWorkEvent
            ? latestWorkEvent.childMessage
            : connection === 'live'
              ? '商品の値段は、会社や社会のさまざまな動きによって少しずつ変わります。'
              : snapshot
                ? 'いまは価格の更新を待っています。最後に受け取った金額を表示しています。'
                : '仮想市場APIとの接続を待っています。積み立ては保護者用の仮想証券口座で行います。'}
        </p>
      </div>

      {error && <p className="mirai-api-error">仮想市場APIに接続できません。</p>}

      <footer className="mirai-dashboard-footer">
        <span>学習用の架空口座です</span>
        <a href={BROKERAGE_UI_URL} target="_blank" rel="noreferrer">
          保護者用の仮想証券口座を開く <span aria-hidden="true">↗</span>
        </a>
      </footer>
    </section>
  );
}

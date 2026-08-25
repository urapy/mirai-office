import { useEffect, useMemo, useState } from 'react';

import {
  contribute,
  loadHistory,
  resetAccount,
  subscribeDashboard,
  triggerPerformanceEvent,
} from './api.js';
import {
  cloudAuthEnabled,
  type GuardianUser,
  observeGuardian,
  signInGuardian,
  signOutGuardian,
} from './auth.js';
import { PriceChart } from './PriceChart.js';
import type {
  Account,
  AccountEvent,
  PerformanceScenarioId,
  PerformanceState,
  Product,
  Quote,
} from './types.js';

const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' });
const number = new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 4 });
const PERFORMANCE_OPTIONS: readonly { id: PerformanceScenarioId; label: string }[] = [
  { id: 'rapid-growth', label: '急成長' },
  { id: 'growth', label: '好調' },
  { id: 'steady', label: '通常' },
  { id: 'slump', label: '苦戦' },
  { id: 'major-loss', label: '大赤字' },
];

function signedYen(value: number): string {
  return `${value > 0 ? '+' : ''}${yen.format(value)}`;
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [events, setEvents] = useState<AccountEvent[]>([]);
  const [performanceStates, setPerformanceStates] = useState<PerformanceState[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('world-growth');
  const [amount, setAmount] = useState(10_000);
  const [priceHistory, setPriceHistory] = useState<Record<string, Quote[]>>({});
  const [connection, setConnection] = useState<'connecting' | 'live' | 'stopped'>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [guardian, setGuardian] = useState<GuardianUser | null>(null);
  const [authReady, setAuthReady] = useState(!cloudAuthEnabled);

  useEffect(() => {
    const unsubscribe = subscribeDashboard(
      (dashboard) => {
        setProducts(dashboard.products);
        setQuotes(dashboard.quotes);
        setAccount(dashboard.account);
        setEvents(dashboard.events);
        setPerformanceStates(dashboard.performanceStates);
        setPriceHistory((current) => {
          const next = { ...current };
          for (const quote of dashboard.quotes) {
            const history = next[quote.productId] ?? [];
            if (history.at(-1)?.tick === quote.tick) continue;
            next[quote.productId] = [...history, quote].slice(-120);
          }
          return next;
        });
        setConnection('live');
        setError(null);
      },
      (reason: unknown) => {
        setConnection('stopped');
        setError(reason instanceof Error ? reason.message : String(reason));
      },
    );
    return unsubscribe;
  }, []);

  useEffect(
    () =>
      observeGuardian((user) => {
        setGuardian(user);
        setAuthReady(true);
      }),
    [],
  );

  const liveAccount = useMemo(() => {
    if (!account) return null;
    const holdings = account.holdings.map((holding) => {
      const price = quotes.find((quote) => quote.productId === holding.productId)?.price;
      if (price === undefined) return holding;
      const valuation = Math.round(holding.quantity * price);
      return {
        ...holding,
        currentPrice: price,
        valuation,
        profitLoss: valuation - holding.quantity * holding.averageCost,
      };
    });
    const valuation = holdings.reduce((sum, holding) => sum + holding.valuation, 0);
    return { ...account, holdings, valuation, profitLoss: valuation - account.principal };
  }, [account, quotes]);

  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const selectedQuote = quotes.find((quote) => quote.productId === selectedProductId);
  const canManage = !cloudAuthEnabled || guardian !== null;

  const handleSignIn = async () => {
    try {
      await signInGuardian();
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const handleContribution = async () => {
    setSubmitting(true);
    try {
      setAccount(await contribute(selectedProductId, amount));
      setEvents((await loadHistory()).events);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    setSubmitting(true);
    try {
      setAccount(await resetAccount());
      setEvents([]);
      setIsResetOpen(false);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePerformanceEvent = async (scenario: PerformanceScenarioId) => {
    setSubmitting(true);
    try {
      const state = await triggerPerformanceEvent(selectedProductId, scenario);
      setPerformanceStates((current) => [
        ...current.filter((item) => item.productId !== state.productId),
        state,
      ]);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">M</span>
          <div>
            <strong>みらい証券</strong>
            <small>SIMULATION</small>
          </div>
        </div>
        <div className="topbar-actions">
          <div className={`connection ${connection}`}>
            <span />
            {connection === 'live'
              ? 'リアルタイム更新中'
              : connection === 'connecting'
                ? '接続中'
                : '更新停止'}
          </div>
          {cloudAuthEnabled &&
            authReady &&
            (guardian ? (
              <button className="auth-button" onClick={() => void signOutGuardian()}>
                ログアウト
              </button>
            ) : (
              <button className="auth-button is-primary" onClick={() => void handleSignIn()}>
                保護者ログイン
              </button>
            ))}
        </div>
      </header>

      <main>
        <section className="hero">
          <div>
            <p className="eyebrow">仮想資産サマリー</p>
            <h1>{liveAccount ? yen.format(liveAccount.valuation) : '—'}</h1>
            <p className={`pnl ${(liveAccount?.profitLoss ?? 0) >= 0 ? 'positive' : 'negative'}`}>
              損益 {liveAccount ? signedYen(liveAccount.profitLoss) : '—'}
            </p>
          </div>
          <div className="hero-metrics">
            <div>
              <span>投資した金額</span>
              <strong>{liveAccount ? yen.format(liveAccount.principal) : '—'}</strong>
            </div>
            <div>
              <span>保有商品</span>
              <strong>{liveAccount?.holdings.length ?? 0}商品</strong>
            </div>
          </div>
        </section>

        {error && <div className="error-banner">APIに接続できません：{error}</div>}

        <section className="product-grid">
          {products.map((product) => {
            const quote = quotes.find((item) => item.productId === product.id);
            return (
              <button
                key={product.id}
                className={`product-card ${selectedProductId === product.id ? 'selected' : ''}`}
                onClick={() => setSelectedProductId(product.id)}
              >
                <span className="theme">{product.theme}</span>
                <strong>{product.name}</strong>
                <span className="office-room-link">みらいオフィス：{product.officeRoomName}</span>
                <div
                  className="performance-mini"
                  aria-label={`${product.name}の仕事コンディション`}
                >
                  <span
                    style={{
                      width: `${performanceStates.find((state) => state.productId === product.id)?.score ?? 55}%`,
                    }}
                  />
                </div>
                <span className="price">{quote ? yen.format(quote.price) : '—'}</span>
                <span className={`change ${(quote?.change ?? 0) >= 0 ? 'positive' : 'negative'}`}>
                  {quote
                    ? `${quote.change >= 0 ? '+' : ''}${quote.change}円 (${(quote.changePercent * 100).toFixed(2)}%)`
                    : '—'}
                </span>
              </button>
            );
          })}
        </section>

        <div className="content-grid">
          <section className="panel chart-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">リアルタイム価格</p>
                <h2>{selectedProduct?.name ?? '商品を選択'}</h2>
                {selectedProduct && (
                  <span className="selected-office-room">
                    対応する部屋：{selectedProduct.officeRoomName}
                  </span>
                )}
              </div>
              <strong>{selectedQuote ? yen.format(selectedQuote.price) : '—'}</strong>
            </div>
            <PriceChart quotes={priceHistory[selectedProductId] ?? []} />
          </section>

          <section className="panel contribution-panel">
            <p className="eyebrow">積立シミュレーション</p>
            <h2>選んだ商品へ積み立てる</h2>
            <label>
              商品
              <select
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              積立額
              <select value={amount} onChange={(event) => setAmount(Number(event.target.value))}>
                {[1_000, 5_000, 10_000, 30_000].map((value) => (
                  <option key={value} value={value}>
                    {yen.format(value)}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="primary-button"
              disabled={submitting || connection !== 'live' || !canManage}
              onClick={() => void handleContribution()}
            >
              {submitting ? '処理中…' : `${yen.format(amount)}を積み立てる`}
            </button>
            <button
              className="reset-button"
              disabled={
                submitting ||
                connection !== 'live' ||
                !canManage ||
                (liveAccount?.principal ?? 0) === 0
              }
              onClick={() => setIsResetOpen(true)}
            >
              積立額を0円にリセット
            </button>
            <p className="disclaimer">
              {cloudAuthEnabled && !guardian
                ? '積立とリセットには、保護者のGoogleログインが必要です。'
                : '学習用の架空商品です。実在する金融商品や将来の利益を示すものではありません。'}
            </p>
          </section>
        </div>

        <section className="panel performance-control-panel">
          <p className="eyebrow">LEARNING EVENT</p>
          <h2>架空の業績イベントを発生させる</h2>
          <p>
            {selectedProduct?.name ?? '選択中の商品'}の価格と、
            {selectedProduct?.officeRoomName ?? '対応する部屋'}の反応を約1分間変化させます。
          </p>
          <div className="performance-actions">
            {PERFORMANCE_OPTIONS.map((option) => (
              <button
                key={option.id}
                className={`performance-button performance-button--${option.id}`}
                disabled={submitting || connection !== 'live' || !canManage}
                onClick={() => void handlePerformanceEvent(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <small>
            学習用の架空シナリオです。実在企業の業績や将来の値動きを表すものではありません。
          </small>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">PORTFOLIO</p>
              <h2>保有商品</h2>
            </div>
            <button
              className="text-button"
              disabled={
                submitting ||
                connection !== 'live' ||
                !canManage ||
                (liveAccount?.principal ?? 0) === 0
              }
              onClick={() => setIsResetOpen(true)}
            >
              積立記録をリセット
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>商品</th>
                  <th>保有数量</th>
                  <th>平均取得価格</th>
                  <th>現在価格</th>
                  <th>評価額</th>
                  <th>損益</th>
                </tr>
              </thead>
              <tbody>
                {liveAccount?.holdings.length ? (
                  liveAccount.holdings.map((holding) => (
                    <tr key={holding.productId}>
                      <td data-label="商品">
                        {products.find((product) => product.id === holding.productId)?.name}
                      </td>
                      <td data-label="保有数量">{number.format(holding.quantity)}口</td>
                      <td data-label="平均取得価格">{yen.format(holding.averageCost)}</td>
                      <td data-label="現在価格">{yen.format(holding.currentPrice)}</td>
                      <td data-label="評価額">{yen.format(holding.valuation)}</td>
                      <td
                        data-label="損益"
                        className={holding.profitLoss >= 0 ? 'positive' : 'negative'}
                      >
                        {signedYen(holding.profitLoss)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="empty-cell">
                      まだ積み立てはありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">ACTIVITY</p>
          <h2>最近の履歴</h2>
          <div className="event-list">
            {events
              .slice(-8)
              .reverse()
              .map((event) => (
                <div key={event.id}>
                  <span className="event-icon">{event.type === 'purchase' ? '買' : '入'}</span>
                  <div>
                    <strong>
                      {event.type === 'purchase' ? '商品を買い付けました' : '積立金を入金しました'}
                    </strong>
                    <small>
                      {products.find((product) => product.id === event.productId)?.name}
                    </small>
                  </div>
                  <span>{yen.format(event.amount)}</span>
                </div>
              ))}
            {events.length === 0 && <p className="empty-cell">履歴はありません</p>}
          </div>
        </section>
      </main>

      {isResetOpen && (
        <div className="reset-dialog-backdrop" role="presentation">
          <section
            className="reset-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-dialog-title"
          >
            <p className="eyebrow">RESET SIMULATION</p>
            <h2 id="reset-dialog-title">積立額を0円に戻しますか？</h2>
            <p>
              投資した金額、保有商品、損益、これまでの積立履歴をすべて消して、最初の状態に戻します。
            </p>
            <div className="reset-dialog-actions">
              <button
                className="text-button"
                disabled={submitting}
                onClick={() => setIsResetOpen(false)}
              >
                キャンセル
              </button>
              <button
                className="danger-button"
                disabled={submitting}
                onClick={() => void handleReset()}
              >
                {submitting ? 'リセット中…' : '0円にリセットする'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

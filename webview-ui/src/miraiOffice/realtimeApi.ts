export interface RealtimeQuote {
  productId: string;
  price: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  tick: number;
  updatedAt: string;
}

export interface RealtimeHolding {
  productId: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  valuation: number;
  profitLoss: number;
}

export interface RealtimeAccount {
  accountId: 'demo';
  principal: number;
  valuation: number;
  profitLoss: number;
  holdings: RealtimeHolding[];
  updatedAt: string;
}

export interface RealtimeSnapshot {
  quotes: RealtimeQuote[];
  account: RealtimeAccount;
}

export const SIMULATION_API_BASE = import.meta.env.VITE_SIMULATION_API ?? 'http://127.0.0.1:4310';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${SIMULATION_API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) throw new Error(`仮想市場APIに接続できませんでした (${response.status})`);
  return response.json() as Promise<T>;
}

export async function loadRealtimeSnapshot(signal?: AbortSignal): Promise<RealtimeSnapshot> {
  const [quoteResponse, account] = await Promise.all([
    request<{ quotes: RealtimeQuote[] }>('/api/quotes', { signal }),
    request<RealtimeAccount>('/api/accounts/demo', { signal }),
  ]);
  return { quotes: quoteResponse.quotes, account };
}

export function contributeRealtime(productId: string, amount: number): Promise<RealtimeAccount> {
  return request('/api/accounts/demo/contributions', {
    method: 'POST',
    body: JSON.stringify({ productId, amount }),
  });
}

export function resetRealtimeAccount(): Promise<RealtimeAccount> {
  return request('/api/accounts/demo/reset', { method: 'POST', body: '{}' });
}

export function subscribeRealtimeQuotes(
  onSnapshot: (snapshot: RealtimeSnapshot) => void,
  onConnectionChange: (connected: boolean) => void,
): () => void {
  const source = new EventSource(`${SIMULATION_API_BASE}/api/stream/quotes`);
  source.addEventListener('quotes', (event) => {
    const snapshot = JSON.parse((event as MessageEvent<string>).data) as RealtimeSnapshot;
    onSnapshot(snapshot);
    onConnectionChange(true);
  });
  source.onerror = () => onConnectionChange(false);
  return () => source.close();
}

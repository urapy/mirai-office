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

export interface RealtimeWorkEvent {
  id: string;
  productId: string;
  kind: 'progress' | 'challenge';
  cue: 'music' | 'sweat';
  source: 'automatic' | 'guardian';
  intensity: 1 | 2 | 3;
  headline: string;
  childMessage: string;
  tick: number;
  createdAt: string;
}

export interface RealtimePerformanceState {
  productId: string;
  eventId: string;
  scenario: 'rapid-growth' | 'growth' | 'steady' | 'slump' | 'major-loss';
  label: string;
  score: number;
  reactionLevel: 0 | 1 | 2 | 3;
  cue: 'music' | 'sweat' | null;
  headline: string;
  childMessage: string;
  startedAt: string;
  expiresAt: string | null;
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
  workEvents: RealtimeWorkEvent[];
  performanceStates: RealtimePerformanceState[];
}

export const SIMULATION_API_BASE = import.meta.env.VITE_SIMULATION_API ?? 'http://127.0.0.1:4310';
export const BROKERAGE_UI_URL = import.meta.env.VITE_BROKERAGE_UI ?? 'http://127.0.0.1:5174';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${SIMULATION_API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) throw new Error(`仮想市場APIに接続できませんでした (${response.status})`);
  return response.json() as Promise<T>;
}

export async function loadRealtimeSnapshot(signal?: AbortSignal): Promise<RealtimeSnapshot> {
  const [quoteResponse, account, workEventResponse, performanceResponse] = await Promise.all([
    request<{ quotes: RealtimeQuote[] }>('/api/quotes', { signal }),
    request<RealtimeAccount>('/api/accounts/demo', { signal }),
    request<{ workEvents: RealtimeWorkEvent[] }>('/api/work-events?limit=20', { signal }),
    request<{ performanceStates: RealtimePerformanceState[] }>('/api/performance', { signal }),
  ]);
  return {
    quotes: quoteResponse.quotes,
    account,
    workEvents: workEventResponse.workEvents,
    performanceStates: performanceResponse.performanceStates,
  };
}

export function subscribeRealtimeQuotes(
  onSnapshot: (snapshot: RealtimeSnapshot) => void,
  onConnectionChange: (connected: boolean) => void,
): () => void {
  if (import.meta.env.VITE_REALTIME_MODE === 'poll') {
    let stopped = false;
    let running = false;
    const poll = async () => {
      if (stopped || running) return;
      running = true;
      try {
        const snapshot = await loadRealtimeSnapshot();
        if (!stopped) {
          onSnapshot(snapshot);
          onConnectionChange(true);
        }
      } catch {
        if (!stopped) onConnectionChange(false);
      } finally {
        running = false;
      }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 1_000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }

  const source = new EventSource(`${SIMULATION_API_BASE}/api/stream/quotes`);
  source.addEventListener('quotes', (event) => {
    const payload = JSON.parse((event as MessageEvent<string>).data) as RealtimeSnapshot;
    const snapshot: RealtimeSnapshot = {
      ...payload,
      workEvents: payload.workEvents ?? [],
      performanceStates: payload.performanceStates ?? [],
    };
    onSnapshot(snapshot);
    onConnectionChange(true);
  });
  source.onerror = () => onConnectionChange(false);
  return () => source.close();
}

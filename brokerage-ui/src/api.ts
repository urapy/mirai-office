import { cloudAuthEnabled, getGuardianToken } from './auth.js';
import type {
  Account,
  AccountEvent,
  PerformanceScenarioId,
  PerformanceState,
  Product,
  Quote,
} from './types.js';

export const API_BASE = import.meta.env.VITE_SIMULATION_API ?? 'http://127.0.0.1:4310';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = init?.method && init.method !== 'GET' ? await getGuardianToken() : null;
  if (cloudAuthEnabled && init?.method && init.method !== 'GET' && !token) {
    throw new Error('保護者のGoogleログインが必要です');
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `API request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function subscribeDashboard(
  onDashboard: (dashboard: Awaited<ReturnType<typeof loadDashboard>>) => void,
  onError: (error: unknown) => void,
): () => void {
  let stopped = false;
  let running = false;
  const poll = async () => {
    if (stopped || running) return;
    running = true;
    try {
      const dashboard = await loadDashboard();
      if (!stopped) onDashboard(dashboard);
    } catch (error) {
      if (!stopped) onError(error);
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

export async function loadDashboard(): Promise<{
  products: Product[];
  quotes: Quote[];
  account: Account;
  events: AccountEvent[];
  performanceStates: PerformanceState[];
}> {
  const [products, quotes, account, history, performance] = await Promise.all([
    request<{ products: Product[] }>('/api/products'),
    request<{ quotes: Quote[] }>('/api/quotes'),
    request<Account>('/api/accounts/demo'),
    request<{ events: AccountEvent[] }>('/api/accounts/demo/history'),
    request<{ performanceStates: PerformanceState[] }>('/api/performance'),
  ]);
  return {
    products: products.products,
    quotes: quotes.quotes,
    account,
    events: history.events,
    performanceStates: performance.performanceStates,
  };
}

export function triggerPerformanceEvent(
  productId: string,
  scenario: PerformanceScenarioId,
): Promise<PerformanceState> {
  return request(`/api/products/${productId}/performance-events`, {
    method: 'POST',
    body: JSON.stringify({ scenario }),
  });
}

export function contribute(productId: string, amount: number): Promise<Account> {
  return request<Account>('/api/accounts/demo/contributions', {
    method: 'POST',
    body: JSON.stringify({ productId, amount }),
  });
}

export function resetAccount(): Promise<Account> {
  return request<Account>('/api/accounts/demo/reset', { method: 'POST', body: '{}' });
}

export function loadHistory(): Promise<{ events: AccountEvent[] }> {
  return request('/api/accounts/demo/history');
}

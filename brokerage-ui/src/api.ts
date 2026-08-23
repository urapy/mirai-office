import type { Account, AccountEvent, Product, Quote } from './types.js';

export const API_BASE = import.meta.env.VITE_SIMULATION_API ?? 'http://127.0.0.1:4310';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `API request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function loadDashboard(): Promise<{
  products: Product[];
  quotes: Quote[];
  account: Account;
  events: AccountEvent[];
}> {
  const [products, quotes, account, history] = await Promise.all([
    request<{ products: Product[] }>('/api/products'),
    request<{ quotes: Quote[] }>('/api/quotes'),
    request<Account>('/api/accounts/demo'),
    request<{ events: AccountEvent[] }>('/api/accounts/demo/history'),
  ]);
  return { products: products.products, quotes: quotes.quotes, account, events: history.events };
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

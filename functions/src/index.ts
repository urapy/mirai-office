import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { onRequest } from 'firebase-functions/v2/https';

import {
  contribute,
  getAccount,
  getAccountHistory,
  getPerformanceMultipliers,
  getPerformanceStates,
  resetAccount,
  triggerPerformanceEvent,
} from './account.js';
import { CLOUD_PRODUCTS, getCloudHistory, getCloudQuotes, getCloudWorkEvents } from './market.js';

if (getApps().length === 0) initializeApp();

function pathOf(requestPath: string): string {
  const normalized = requestPath.replace(/^\/api(?=\/|$)/, '');
  return normalized.length > 0 ? normalized : '/';
}

async function requireGuardian(authorization: string | undefined): Promise<void> {
  const token = authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new Error('AUTH_REQUIRED');
  const decoded = await getAuth().verifyIdToken(token);
  if (!decoded.email || decoded.email_verified !== true) throw new Error('AUTH_REQUIRED');
}

export const api = onRequest(
  {
    region: 'asia-northeast1',
    timeoutSeconds: 60,
    memory: '256MiB',
    maxInstances: 3,
    cors: false,
  },
  async (request, response) => {
    response.set('Cache-Control', 'no-store');
    const path = pathOf(request.path);
    const nowMs = Date.now();

    try {
      if (request.method === 'GET' && path === '/health') {
        response.json({ status: 'ok', service: 'mirai-cloud-simulation' });
        return;
      }
      if (request.method === 'GET' && path === '/products') {
        response.json({ products: CLOUD_PRODUCTS });
        return;
      }
      if (request.method === 'GET' && path === '/quotes') {
        response.json({ quotes: getCloudQuotes(nowMs, await getPerformanceMultipliers(nowMs)) });
        return;
      }
      if (request.method === 'GET' && path === '/quotes/history') {
        const productId = String(request.query.productId ?? '');
        const limit = Number(request.query.limit ?? 120);
        response.json({ productId, quotes: getCloudHistory(productId, limit, nowMs) });
        return;
      }
      if (request.method === 'GET' && path === '/work-events') {
        response.json({ workEvents: getCloudWorkEvents(Number(request.query.limit ?? 20), nowMs) });
        return;
      }
      if (request.method === 'GET' && path === '/performance') {
        response.json({ performanceStates: await getPerformanceStates(nowMs) });
        return;
      }
      if (request.method === 'GET' && path === '/accounts/demo') {
        response.json(await getAccount(nowMs));
        return;
      }
      if (request.method === 'GET' && path === '/accounts/demo/history') {
        response.json({ events: await getAccountHistory() });
        return;
      }
      if (request.method === 'POST' && path === '/accounts/demo/contributions') {
        await requireGuardian(request.headers.authorization);
        const { productId, amount } = request.body as { productId?: unknown; amount?: unknown };
        if (typeof productId !== 'string' || typeof amount !== 'number') {
          response.status(400).json({ error: 'productId and amount are required' });
          return;
        }
        response.json(await contribute(productId, amount, nowMs));
        return;
      }
      if (request.method === 'POST' && path === '/accounts/demo/reset') {
        await requireGuardian(request.headers.authorization);
        response.json(await resetAccount(nowMs));
        return;
      }
      const performanceMatch = path.match(/^\/products\/([^/]+)\/performance-events$/);
      if (request.method === 'POST' && performanceMatch) {
        await requireGuardian(request.headers.authorization);
        const { scenario } = request.body as { scenario?: unknown };
        if (typeof scenario !== 'string') {
          response.status(400).json({ error: 'scenario is required' });
          return;
        }
        response.json(
          await triggerPerformanceEvent(
            performanceMatch[1],
            scenario as Parameters<typeof triggerPerformanceEvent>[1],
            nowMs,
          ),
        );
        return;
      }
      response.status(404).json({ error: `Route ${request.method}:${path} not found` });
    } catch (error) {
      if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
        response.status(401).json({ error: '保護者のGoogleログインが必要です' });
        return;
      }
      response.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  },
);

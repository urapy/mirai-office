import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';

import { AccountService } from './accountService.js';
import { MarketEngine } from './marketEngine.js';

const ALLOWED_UI_ORIGINS = new Set(['http://127.0.0.1:5173', 'http://127.0.0.1:5174']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function createSimulationApp(
  market = new MarketEngine(),
  account = new AccountService(market),
): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(cors, {
    origin: [...ALLOWED_UI_ORIGINS],
    methods: ['GET', 'POST'],
  });

  app.get('/api/health', async () => ({ status: 'ok', service: 'mirai-simulation' }));
  app.get('/api/products', async () => ({ products: market.getProducts() }));
  app.get('/api/quotes', async () => ({ quotes: market.getQuotes() }));
  app.get('/api/work-events', async (request) => {
    const query = request.query as { limit?: string };
    return { workEvents: market.getWorkEvents(Number(query.limit ?? 20)) };
  });
  app.get('/api/quotes/history', async (request, reply) => {
    const query = request.query as { productId?: string; limit?: string };
    if (!query.productId) return reply.code(400).send({ error: 'productId is required' });
    try {
      return {
        productId: query.productId,
        quotes: market.getHistory(query.productId, Number(query.limit ?? 120)),
      };
    } catch (error) {
      return reply
        .code(404)
        .send({ error: error instanceof Error ? error.message : String(error) });
    }
  });
  app.get('/api/accounts/demo', async () => account.getSnapshot());
  app.get('/api/accounts/demo/history', async () => ({ events: account.getHistory() }));
  app.post('/api/accounts/demo/contributions', async (request, reply) => {
    if (!isRecord(request.body)) return reply.code(400).send({ error: 'JSON body is required' });
    const { productId, amount } = request.body;
    if (typeof productId !== 'string' || typeof amount !== 'number') {
      return reply.code(400).send({ error: 'productId and amount are required' });
    }
    try {
      return account.contribute(productId, amount);
    } catch (error) {
      return reply
        .code(400)
        .send({ error: error instanceof Error ? error.message : String(error) });
    }
  });
  app.post('/api/accounts/demo/reset', async () => account.reset());
  app.get('/api/stream/quotes', (request, reply) => {
    const requestOrigin = request.headers.origin;
    const allowedOrigin =
      requestOrigin && ALLOWED_UI_ORIGINS.has(requestOrigin) ? requestOrigin : null;
    reply.hijack();
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {}),
    });
    const writeQuotes = (
      quotes: ReturnType<MarketEngine['getQuotes']>,
      workEvents: ReturnType<MarketEngine['getWorkEvents']> = [],
    ) => {
      reply.raw.write(
        `event: quotes\ndata: ${JSON.stringify({
          quotes,
          account: account.getSnapshot(),
          events: account.getHistory(),
          workEvents,
        })}\n\n`,
      );
    };
    writeQuotes(market.getQuotes());
    const unsubscribe = market.subscribe(writeQuotes);
    request.raw.on('close', unsubscribe);
  });

  return app;
}

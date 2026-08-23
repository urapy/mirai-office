import { AccountService } from './accountService.js';
import { createSimulationApp } from './app.js';
import { MarketEngine } from './marketEngine.js';

const market = new MarketEngine();
const account = new AccountService(market);
const app = await createSimulationApp(market, account);

market.start(1_000);
await app.listen({ host: '127.0.0.1', port: 4310 });
console.log('みらい仮想市場API: http://127.0.0.1:4310');

const shutdown = async () => {
  market.stop();
  await app.close();
};
process.once('SIGINT', () => void shutdown());
process.once('SIGTERM', () => void shutdown());

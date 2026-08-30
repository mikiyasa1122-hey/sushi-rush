import { SUSHI } from './sushi';
import { assignSushi, createOrder } from './order-manager';
import { GameEngine } from './game-engine';

describe('sushi catalog and orders', () => {
  it('defines 12 unique sushi and creates 1-3 item orders', () => {
    expect(SUSHI).toHaveLength(12);
    expect(new Set(SUSHI.map((s) => s.id)).size).toBe(12);
    expect(createOrder(() => 0, 1_000, 1).items).toHaveLength(1);
    expect(createOrder(() => 0.999, 1_000, 3).items).toHaveLength(3);
  });

  it('assigns to the earliest matching expiry and supports duplicate items', () => {
    const orders = [
      { id: 'late', items: ['maguro'] as const, filled: [] as string[], expiresAt: 5_000 },
      { id: 'early', items: ['maguro', 'maguro'] as const, filled: [] as string[], expiresAt: 2_000 },
    ];
    const first = assignSushi(orders, 'maguro');
    expect(first.matchedOrderId).toBe('early');
    expect(first.orders[1].filled).toEqual(['maguro']);
    const second = assignSushi(first.orders, 'maguro');
    expect(second.completedOrderId).toBe('early');
  });

  it('reports a wrong tap without changing orders', () => {
    const orders = [{ id: 'one', items: ['ebi'] as const, filled: [] as string[], expiresAt: 2_000 }];
    expect(assignSushi(orders, 'maguro').matchedOrderId).toBeNull();
  });
});

describe('GameEngine', () => {
  it('runs for 60 seconds, pauses, and ends', () => {
    const engine = new GameEngine(() => 0);
    engine.start();
    engine.tick(10_000);
    expect(engine.snapshot().remainingMs).toBe(50_000);
    engine.pause();
    engine.tick(10_000);
    expect(engine.snapshot().remainingMs).toBe(50_000);
    engine.resume();
    engine.tick(50_000);
    expect(engine.snapshot().status).toBe('finished');
  });

  it('scores completed orders and wrong taps reset combo only', () => {
    const engine = new GameEngine(() => 0);
    engine.start();
    engine.replaceOrders([{ id: 'test', items: ['maguro'], filled: [], expiresAt: 12_000 }]);
    engine.tap('maguro');
    expect(engine.snapshot().score).toBeGreaterThan(0);
    expect(engine.snapshot().combo).toBe(1);
    const score = engine.snapshot().score;
    engine.tap('uni');
    expect(engine.snapshot().combo).toBe(0);
    expect(engine.snapshot().score).toBe(score);
  });

  it('applies rush scoring during the final 10 seconds', () => {
    const normal = new GameEngine(() => 0);
    normal.start();
    normal.replaceOrders([{ id: 'a', items: ['maguro'], filled: [], expiresAt: 12_000 }]);
    normal.tap('maguro');
    const base = normal.snapshot().score;

    const rush = new GameEngine(() => 0);
    rush.start();
    rush.tick(51_000);
    rush.replaceOrders([{ id: 'b', items: ['maguro'], filled: [], expiresAt: 60_000 }]);
    rush.tap('maguro');
    expect(rush.snapshot().score).toBeGreaterThan(base);
  });
});

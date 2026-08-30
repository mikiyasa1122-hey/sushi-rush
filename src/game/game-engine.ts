import { assignSushi, createOrder } from './order-manager';
import { calculateOrderScore } from './scoring';
import type { GameSnapshot, Order, SushiId } from './types';

const GAME_MS = 60_000;

export class GameEngine {
  private state: GameSnapshot = { status: 'idle', remainingMs: GAME_MS, score: 0, combo: 0, maxCombo: 0, served: 0, orders: [], lastEvent: 'none' };
  private elapsed = 0;
  constructor(private readonly random = Math.random) {}

  start() {
    this.elapsed = 0;
    this.state = { status: 'playing', remainingMs: GAME_MS, score: 0, combo: 0, maxCombo: 0, served: 0, orders: [], lastEvent: 'none' };
    this.fillOrders();
  }

  tick(ms: number) {
    if (this.state.status !== 'playing') return;
    this.elapsed = Math.min(GAME_MS, this.elapsed + Math.max(0, ms));
    this.state.remainingMs = GAME_MS - this.elapsed;
    const expired = this.state.orders.some((order) => order.expiresAt <= this.elapsed);
    if (expired) {
      this.state.orders = this.state.orders.filter((order) => order.expiresAt > this.elapsed);
      this.state.combo = 0;
      this.state.lastEvent = 'expired';
      this.fillOrders();
    }
    if (this.elapsed >= GAME_MS) this.state.status = 'finished';
  }

  tap(id: SushiId) {
    if (this.state.status !== 'playing') return;
    const result = assignSushi(this.state.orders, id);
    this.state.orders = result.orders;
    if (!result.matchedOrderId) {
      this.state.combo = 0;
      this.state.lastEvent = 'miss';
      return;
    }
    if (result.completedOrderId) {
      const completed = this.state.orders.find((order) => order.id === result.completedOrderId)!;
      const totalWindow = Math.max(1, completed.expiresAt - this.elapsed);
      this.state.combo += 1;
      this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);
      this.state.score += calculateOrderScore(completed.items.length, totalWindow / 12_000, this.state.combo, this.state.remainingMs <= 10_000);
      this.state.served += 1;
      this.state.lastEvent = 'served';
      this.state.orders = this.state.orders.filter((order) => order.id !== completed.id);
      this.fillOrders();
    } else {
      this.state.lastEvent = 'none';
    }
  }

  pause() { if (this.state.status === 'playing') this.state.status = 'paused'; }
  resume() { if (this.state.status === 'paused') this.state.status = 'playing'; }
  replaceOrders(orders: Order[]) { this.state.orders = orders.map((o) => ({ ...o, items: [...o.items], filled: [...o.filled] })); }
  snapshot(): GameSnapshot { return { ...this.state, orders: this.state.orders.map((o) => ({ ...o, items: [...o.items], filled: [...o.filled] })) }; }

  private fillOrders() {
    while (this.state.orders.length < 3 && this.state.status === 'playing') {
      const max = this.elapsed < 20_000 ? 2 : 3;
      const duration = this.elapsed < 20_000 ? 12_000 : this.elapsed < 40_000 ? 10_000 : 8_000;
      this.state.orders.push(createOrder(this.random, this.elapsed + duration, max));
    }
  }
}

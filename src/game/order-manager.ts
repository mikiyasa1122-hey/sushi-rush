import { SUSHI } from './sushi';
import type { Order, SushiId } from './types';

let orderSequence = 0;

export function createOrder(random = Math.random, expiresAt = 12_000, maxItems = 3): Order {
  const count = Math.min(maxItems, Math.max(1, Math.floor(random() * maxItems) + 1));
  const items = Array.from({ length: count }, () => SUSHI[Math.min(SUSHI.length - 1, Math.floor(random() * SUSHI.length))].id);
  return { id: `order-${++orderSequence}`, items, filled: [], expiresAt };
}

export function assignSushi(input: readonly Order[], sushiId: SushiId) {
  const orders = input.map((order) => ({ ...order, items: [...order.items], filled: [...order.filled] }));
  const candidates = orders
    .filter((order) => order.items.filter((item) => item === sushiId).length > order.filled.filter((item) => item === sushiId).length)
    .sort((a, b) => a.expiresAt - b.expiresAt);
  const target = candidates[0];
  if (!target) return { orders, matchedOrderId: null, completedOrderId: null };
  target.filled.push(sushiId);
  const complete = target.filled.length === target.items.length;
  return { orders, matchedOrderId: target.id, completedOrderId: complete ? target.id : null };
}

/**
 * WebSocket Handlers — Market Channel Subscription + Broadcast
 *
 * Clients subscribe to market channels. Event handlers call broadcast()
 * to push real-time updates to subscribed clients.
 */

import type { WebSocket } from 'ws';

import { logger } from '../config/logger.js';

// ---------- Subscription Registry ----------

/** marketId -> Set of subscribed WebSocket connections */
const subscriptions = new Map<string, Set<WebSocket>>();

/** All connected clients */
const clients = new Set<WebSocket>();

// ---------- Public API ----------

export function registerClient(ws: WebSocket): void {
  clients.add(ws);
}

export function unregisterClient(ws: WebSocket): void {
  clients.delete(ws);
  // Remove from all subscriptions
  for (const [, subs] of subscriptions) {
    subs.delete(ws);
  }
}

export function subscribe(ws: WebSocket, marketId: string): void {
  let subs = subscriptions.get(marketId);
  if (!subs) {
    subs = new Set();
    subscriptions.set(marketId, subs);
  }
  subs.add(ws);
}

export function unsubscribe(ws: WebSocket, marketId: string): void {
  subscriptions.get(marketId)?.delete(ws);
}

/**
 * Broadcast a payload to all clients subscribed to a market.
 * Called by event handlers after DB writes.
 */
export function broadcast(marketId: string, payload: Record<string, unknown>): void {
  const subs = subscriptions.get(marketId);
  if (!subs || subs.size === 0) return;

  const message = JSON.stringify(payload, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );

  for (const ws of subs) {
    try {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    } catch (error) {
      logger.warn(
        { error: error instanceof Error ? error.message : String(error) },
        '[WS] Send error'
      );
    }
  }
}

export function getClientCount(): number {
  return clients.size;
}

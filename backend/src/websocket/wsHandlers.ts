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

/** ws -> set of marketIds it is subscribed to (bounds memory + O(1) cleanup on disconnect) */
const clientSubscriptions = new WeakMap<WebSocket, Set<string>>();

const MAX_SUBSCRIPTIONS_PER_CLIENT = 100;
// Market IDs are on-chain identifiers (bytes32 hex) or short indexed ids — bound the shape so a
// client can't stuff arbitrary/huge strings into the subscription maps.
const MARKET_ID_PATTERN = /^(0x[0-9a-fA-F]{1,64}|[A-Za-z0-9_:-]{1,80})$/;

// ---------- Public API ----------

export function registerClient(ws: WebSocket): void {
  clients.add(ws);
  clientSubscriptions.set(ws, new Set());
}

export function unregisterClient(ws: WebSocket): void {
  clients.delete(ws);
  const owned = clientSubscriptions.get(ws);
  if (owned) {
    for (const marketId of owned) {
      subscriptions.get(marketId)?.delete(ws);
    }
    clientSubscriptions.delete(ws);
  }
}

export function subscribe(ws: WebSocket, marketId: string): void {
  if (!MARKET_ID_PATTERN.test(marketId)) return;

  const owned = clientSubscriptions.get(ws);
  if (!owned) return; // client not registered
  if (owned.has(marketId)) return;
  if (owned.size >= MAX_SUBSCRIPTIONS_PER_CLIENT) return; // cap per-socket subscriptions

  let subs = subscriptions.get(marketId);
  if (!subs) {
    subs = new Set();
    subscriptions.set(marketId, subs);
  }
  subs.add(ws);
  owned.add(marketId);
}

export function unsubscribe(ws: WebSocket, marketId: string): void {
  const subs = subscriptions.get(marketId);
  if (subs) {
    subs.delete(ws);
    if (subs.size === 0) subscriptions.delete(marketId);
  }
  clientSubscriptions.get(ws)?.delete(marketId);
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

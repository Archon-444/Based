/**
 * WebSocket Server — Attaches to existing HTTP server
 *
 * Clients connect and send subscribe/unsubscribe messages for market channels.
 * Heartbeat ping/pong every 30s to detect stale connections.
 */

import type { Server } from 'http';
import { type WebSocket, WebSocketServer } from 'ws';

import { logger } from '../config/logger.js';
import { setWsConnections } from '../monitoring/metrics.js';
import {
  getClientCount,
  registerClient,
  subscribe,
  unregisterClient,
  unsubscribe,
} from './wsHandlers.js';

const HEARTBEAT_INTERVAL = 30_000;

interface WebSocketWithHeartbeat extends WebSocket {
  isAlive: boolean;
}

interface ClientMessage {
  type: 'subscribe' | 'unsubscribe';
  marketId: string;
}

export function attachWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  logger.info('[WS] WebSocket server attached at /ws');

  wss.on('connection', (ws: WebSocket) => {
    registerClient(ws);
    setWsConnections(getClientCount());

    // Mark as alive for heartbeat
    (ws as WebSocketWithHeartbeat).isAlive = true;
    ws.on('pong', () => {
      (ws as WebSocketWithHeartbeat).isAlive = true;
    });

    ws.on('message', (data: Buffer) => {
      try {
        const msg: ClientMessage = JSON.parse(data.toString());
        if (msg.type === 'subscribe' && msg.marketId) {
          subscribe(ws, msg.marketId);
        } else if (msg.type === 'unsubscribe' && msg.marketId) {
          unsubscribe(ws, msg.marketId);
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on('close', () => {
      unregisterClient(ws);
      setWsConnections(getClientCount());
    });

    ws.on('error', (error) => {
      logger.warn({ error: error.message }, '[WS] Client error');
      unregisterClient(ws);
      setWsConnections(getClientCount());
    });
  });

  // Heartbeat: ping every 30s, terminate stale connections
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if ((ws as WebSocketWithHeartbeat).isAlive === false) {
        unregisterClient(ws);
        ws.terminate();
        continue;
      }
      (ws as WebSocketWithHeartbeat).isAlive = false;
      ws.ping();
    }
    setWsConnections(getClientCount());
  }, HEARTBEAT_INTERVAL);

  wss.on('close', () => {
    clearInterval(heartbeat);
  });

  return wss;
}

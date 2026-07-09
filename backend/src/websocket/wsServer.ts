/**
 * WebSocket Server — Attaches to existing HTTP server
 *
 * Clients connect and send subscribe/unsubscribe messages for market channels.
 * Heartbeat ping/pong every 30s to detect stale connections.
 */

import type { IncomingMessage, Server } from 'http';
import { type WebSocket, WebSocketServer } from 'ws';

import { env } from '../config/env.js';
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
const MAX_PAYLOAD_BYTES = 16 * 1024; // messages are tiny subscribe frames
const MAX_CONNECTIONS_PER_IP = 20;

interface WebSocketWithHeartbeat extends WebSocket {
  isAlive: boolean;
}

interface ClientMessage {
  type: 'subscribe' | 'unsubscribe';
  marketId: string;
}

const allowedOrigins = new Set(
  [
    ...env.CORS_ORIGIN.split(','),
    ...(env.WS_ALLOWED_ORIGINS ? env.WS_ALLOWED_ORIGINS.split(',') : []),
  ]
    .map((o) => o.trim())
    .filter(Boolean)
);

function isOriginAllowed(origin: string | undefined): boolean {
  // Non-browser clients (no Origin header) are allowed; browsers always send one, so a
  // present-but-unlisted Origin is a cross-site attempt and is rejected.
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;
  return /^https:\/\/based[a-z0-9-]*\.vercel\.app$/.test(origin);
}

const connectionsByIp = new Map<string, number>();

function remoteIp(req: IncomingMessage): string {
  return req.socket.remoteAddress ?? 'unknown';
}

export function attachWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: MAX_PAYLOAD_BYTES,
    verifyClient: (info, done) => {
      if (!isOriginAllowed(info.origin)) {
        logger.warn({ origin: info.origin }, '[WS] Rejected connection from disallowed origin');
        return done(false, 403, 'Forbidden origin');
      }
      const ip = remoteIp(info.req);
      if ((connectionsByIp.get(ip) ?? 0) >= MAX_CONNECTIONS_PER_IP) {
        logger.warn({ ip }, '[WS] Rejected connection: per-IP limit reached');
        return done(false, 429, 'Too many connections');
      }
      return done(true);
    },
  });

  logger.info('[WS] WebSocket server attached at /ws');

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const ip = remoteIp(req);
    connectionsByIp.set(ip, (connectionsByIp.get(ip) ?? 0) + 1);
    const releaseIp = () => {
      const n = (connectionsByIp.get(ip) ?? 1) - 1;
      if (n <= 0) connectionsByIp.delete(ip);
      else connectionsByIp.set(ip, n);
    };

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
      releaseIp();
      unregisterClient(ws);
      setWsConnections(getClientCount());
    });

    ws.on('error', (error) => {
      logger.warn({ error: error.message }, '[WS] Client error');
      releaseIp();
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

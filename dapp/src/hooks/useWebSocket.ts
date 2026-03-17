import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { env } from '../config/env';

interface WSMessage {
  type: string;
  marketId?: string;
  [key: string]: unknown;
}

const WS_URL = env.wsUrl || env.apiUrl.replace(/^http/, 'ws').replace(/\/api$/, '/ws');

export function useMarketWebSocket(marketId: string | undefined) {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  const [lastTrade, setLastTrade] = useState<unknown>(null);
  const [lastCommentary, setLastCommentary] = useState<unknown>(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    if (!marketId) return;

    try {
      const socket = new WebSocket(WS_URL);
      ws.current = socket;

      socket.onopen = () => {
        setConnected(true);
        socket.send(JSON.stringify({ type: 'subscribe', marketId }));
      };

      socket.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);

          switch (msg.type) {
            case 'trade':
            case 'buy':
            case 'sell':
              setLastTrade(msg);
              // Invalidate related queries
              queryClient.invalidateQueries({ queryKey: ['trades', marketId] });
              queryClient.invalidateQueries({ queryKey: ['market', marketId] });
              break;
            case 'commentary':
              setLastCommentary(msg);
              break;
            case 'status_change':
            case 'outcome_asserted':
            case 'assertion_settled':
            case 'assertion_disputed':
              queryClient.invalidateQueries({ queryKey: ['market', marketId] });
              break;
          }
        } catch {
          // Ignore non-JSON messages (pings, etc.)
        }
      };

      socket.onclose = () => {
        setConnected(false);
        // Reconnect after 3 seconds
        reconnectTimeout.current = setTimeout(connect, 3000);
      };

      socket.onerror = () => {
        socket.close();
      };
    } catch {
      // WebSocket constructor can throw if URL is invalid
      setConnected(false);
    }
  }, [marketId, queryClient]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) {
        if (ws.current.readyState === WebSocket.OPEN && marketId) {
          ws.current.send(JSON.stringify({ type: 'unsubscribe', marketId }));
        }
        ws.current.close();
        ws.current = null;
      }
    };
  }, [connect]);

  return { lastTrade, lastCommentary, connected };
}

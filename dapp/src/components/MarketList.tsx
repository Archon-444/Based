import React, { useState, useEffect, useCallback } from 'react';
import { useAptos } from '../contexts/WalletContext';
import { sanitizeMarketQuestion, sanitizeText } from '../utils/sanitize';
import { env } from '../config/env';

interface Market {
  id: number;
  question: string;
  outcomes: string[];
  endTime: number;
  resolved: boolean;
  winningOutcome: number;
  outcomeStakes: number[];
  creator: string;
}

const MarketList: React.FC = () => {
  const { getClient } = useAptos();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMarkets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get market count
      const moduleAddress = env.aptosModuleAddress;
      const aptos = await getClient();
      const countResponse = await aptos.view({
        payload: {
          function: `${moduleAddress}::market_manager::get_market_count`,
          typeArguments: [],
          functionArguments: []
        }
      } as any);

      const marketCount = Number(countResponse[0]);
      const marketPromises = [];

      // Load each market
      for (let i = 0; i < marketCount; i++) {
        marketPromises.push(
          aptos.view({
            payload: {
              function: `${moduleAddress}::market_manager::get_market_full`,
              typeArguments: [],
              functionArguments: [i]
            }
          } as any).then(response => {
            // Use browser-safe hex to UTF-8 decoding
            const hexToUtf8 = (hex: string): string => {
              const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
              return new TextDecoder().decode(bytes);
            };

            const rawQuestion = hexToUtf8(response[0] as string);
            const rawOutcomes = (response[1] as string[]).map(outcome => hexToUtf8(outcome));

            return {
              id: i,
              question: sanitizeMarketQuestion(rawQuestion),
              outcomes: rawOutcomes.map(outcome => sanitizeText(outcome)),
              endTime: Number(response[2]),
              resolved: response[3] as boolean,
              winningOutcome: Number(response[4]),
              outcomeStakes: (response[5] as number[]).map(Number),
              creator: response[6] as string
            };
          })
        );
      }

      const marketData = await Promise.all(marketPromises);
      setMarkets(marketData);
    } catch (err) {
      console.error('Failed to load markets:', err);
      setError('Failed to load markets. Make sure the contract is deployed.');
    } finally {
      setLoading(false);
    }
  }, [getClient]);

  useEffect(() => {
    loadMarkets();
  }, [loadMarkets]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const getTimeRemaining = (endTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = endTime - now;

    if (remaining <= 0) return 'Expired';

    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);

    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-400">
        <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-[#00D4FF] animate-spin mb-4"></div>
        <p>Loading markets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-error-500/10 border border-error-500/20 rounded-2xl">
        <p className="text-error-400 mb-4">{error}</p>
        <button
          onClick={loadMarkets}
          className="px-4 py-2 bg-error-500/20 text-error-400 border border-error-500/30 rounded-lg hover:bg-error-500/30 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-display font-bold text-white">Prediction Markets</h2>
        <button
          onClick={loadMarkets}
          className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-lg hover:bg-white/10 hover:text-white transition-all shadow-sm"
        >
          Refresh
        </button>
      </div>

      {markets.length === 0 ? (
        <div className="text-center p-12 text-gray-500 bg-white/5 border border-white/10 rounded-2xl">
          <p>No markets found. Create the first market!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {markets.map((market) => (
            <div
              key={market.id}
              className="card-hover relative overflow-hidden bg-[#141B3D]/70 p-6 flex flex-col justify-between h-full"
            >
              {/* Optional: Cyberpunk accent line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00D4FF] to-[#6B4CE6] opacity-50"></div>

              <div className="mb-4">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-mono text-gray-400 bg-black/30 px-2 py-0.5 rounded border border-white/5">
                    ID: {market.id}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${market.resolved ? 'bg-success-500/20 text-success-400' : 'bg-primary-500/20 text-primary-400'}`}>
                    {market.resolved ? 'Resolved' : getTimeRemaining(market.endTime)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white leading-snug mb-2">
                  {market.question}
                </h3>
                <div className="text-sm text-gray-500">
                  Ends: {formatTime(market.endTime)}
                </div>
              </div>

              <div className="mb-6 mt-4">
                <div className="flex flex-col gap-2">
                  {market.outcomes.map((outcome, index) => {
                    const isWinner = market.resolved && market.winningOutcome === index;
                    return (
                      <div
                        key={index}
                        className={`flex justify-between items-center rounded-lg px-3 py-2 text-sm border transition-colors ${isWinner
                            ? 'bg-success-500/20 border-success-500/50 text-success-300'
                            : 'bg-black/20 border-white/5 text-gray-300'
                          }`}
                      >
                        <span className="font-medium">{outcome}</span>
                        <span className={`font-mono ${isWinner ? 'text-success-400' : 'text-gray-400'}`}>
                          {market.outcomeStakes[index]} APT
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 mt-auto pt-4 border-t border-white/10">
                <button
                  className="flex-1 py-2 px-4 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/10 hover:text-white transition-all text-center"
                >
                  Details
                </button>
                {!market.resolved && (
                  <button
                    className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-[#00D4FF] to-[#6B4CE6] border-none text-white text-sm font-medium hover:shadow-[0_0_15px_rgba(0,212,255,0.4)] transition-all text-center"
                  >
                    Bet Now
                  </button>
                )}
                {market.resolved && (
                  <button
                    className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-success-500 to-success-600 border-none text-white text-sm font-medium hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all text-center"
                  >
                    Redeem
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketList;

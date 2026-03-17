import React from 'react';
import { useMarkets, Market } from '../hooks/useMarkets';
import { sanitizeMarketQuestion, sanitizeText } from '../utils/sanitize';

const MarketList: React.FC = () => {
  const { markets, isLoading, error, refetch } = useMarkets();

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  const getTimeRemaining = (endDate: string | null) => {
    if (!endDate) return 'No deadline';
    const now = Date.now();
    const remaining = new Date(endDate).getTime() - now;

    if (remaining <= 0) return 'Expired';

    const hours = Math.floor(remaining / 3_600_000);
    const minutes = Math.floor((remaining % 3_600_000) / 60_000);

    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-[#00D4FF] animate-spin mb-4"></div>
        <p>Loading markets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-error-500/10 border border-error-500/20 rounded-2xl">
        <p className="text-error-400 mb-4">{error.message}</p>
        <button
          onClick={() => refetch()}
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
          onClick={() => refetch()}
          className="px-4 py-2 bg-white/5 border border-white/10 text-slate-500 rounded-lg hover:bg-white/10 hover:text-white transition-all shadow-sm"
        >
          Refresh
        </button>
      </div>

      {markets.length === 0 ? (
        <div className="text-center p-12 text-slate-500 bg-white/5 border border-white/10 rounded-2xl">
          <p>No markets found. Create the first market!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {markets.map((market) => {
            const isResolved = market.status === 'resolved' || market.resolvedAt != null;
            return (
              <div
                key={market.id}
                className="card-hover relative overflow-hidden bg-[#141B3D]/70 p-6 flex flex-col justify-between h-full"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00D4FF] to-[#6B4CE6] opacity-50"></div>

                <div className="mb-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-mono text-slate-500 bg-black/30 px-2 py-0.5 rounded border border-white/5">
                      ID: {market.id}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isResolved ? 'bg-success-500/20 text-success-400' : 'bg-primary-500/20 text-primary-400'}`}>
                      {isResolved ? 'Resolved' : getTimeRemaining(market.endDate)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white leading-snug mb-2">
                    {sanitizeMarketQuestion(market.question)}
                  </h3>
                  <div className="text-sm text-slate-500">
                    Ends: {formatTime(market.endDate)}
                  </div>
                </div>

                <div className="mb-6 mt-4">
                  <div className="flex flex-col gap-2">
                    {market.outcomes.map((outcome, index) => {
                      const isWinner = isResolved && market.resolvedOutcome === index;
                      return (
                        <div
                          key={index}
                          className={`flex justify-between items-center rounded-lg px-3 py-2 text-sm border transition-colors ${isWinner
                              ? 'bg-success-500/20 border-success-500/50 text-success-300'
                              : 'bg-black/20 border-white/5 text-slate-500'
                            }`}
                        >
                          <span className="font-medium">{sanitizeText(outcome)}</span>
                          <span className={`font-mono ${isWinner ? 'text-success-400' : 'text-slate-500'}`}>
                            {market.outcomePools[index] ?? '0'} USDC
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2 mt-auto pt-4 border-t border-white/10">
                  <button
                    className="flex-1 py-2 px-4 rounded-lg bg-white/5 border border-white/10 text-slate-500 text-sm font-medium hover:bg-white/10 hover:text-white transition-all text-center"
                  >
                    Details
                  </button>
                  {!isResolved && (
                    <button
                      className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-[#00D4FF] to-[#6B4CE6] border-none text-white text-sm font-medium hover:shadow-[0_0_15px_rgba(0,212,255,0.4)] transition-all text-center"
                    >
                      Bet Now
                    </button>
                  )}
                  {isResolved && (
                    <button
                      className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-success-500 to-success-600 border-none text-white text-sm font-medium hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all text-center"
                    >
                      Redeem
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MarketList;

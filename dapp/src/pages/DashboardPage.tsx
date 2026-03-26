import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  FiTrendingUp,
  FiDollarSign,
  FiCheckCircle,
  FiArrowRight,
  FiInbox,
  FiCheck,
  FiX,
  FiLoader,
} from 'react-icons/fi';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { useUnifiedWallet } from '../hooks/useUnifiedWallet';
import { useMarkets } from '../hooks/useMarkets';
import { useUserPositions } from '../hooks/useUserPosition';
import { useClaimWinnings } from '../hooks/useTransactions';
import { fromMicroUSDC } from '../utils/validation';
import { sanitizeMarketQuestion } from '../utils/sanitize';
import { getCategoryFromQuestion, getCategoryInfo } from '../types/categories';

const formatUSDC = (micro: number) => {
  const v = fromMicroUSDC(micro);
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const DashboardPage: React.FC = () => {
  const { connected, address } = useUnifiedWallet();
  const { markets, isLoading: marketsLoading } = useMarkets();
  const { positions, isLoading: positionsLoading, refetch: refetchPositions } = useUserPositions(
    address,
    markets.length,
  );
  const { claimWinnings, isLoading: isClaiming } = useClaimWinnings();

  // Build enriched position list
  const positionList = useMemo(() => {
    const list: {
      marketId: number;
      question: string;
      category: ReturnType<typeof getCategoryInfo>;
      outcomeLabel: string;
      outcomeIndex: number;
      stake: number;
      shares: number;
      claimed: boolean;
      resolved: boolean;
      isWinner: boolean;
      winningOutcome: number;
      endTime: number;
      yesPct: number;
    }[] = [];

    positions.forEach((pos, marketId) => {
      const market = markets.find((m) => String(m.id) === String(marketId));
      if (!market) return;

      const total = parseFloat(market.totalVolume) || 0;
      const pools = market.outcomePools.map((p) => parseFloat(p) || 0);
      const yesPct =
        total > 0 ? Math.round(((pools[0] ?? 0) / total) * 100) : 0;

      const cat = getCategoryFromQuestion(market.question);
      const isResolved = market.status === 'resolved' || market.resolvedAt != null;
      const endTimestamp = market.endDate ? Math.floor(new Date(market.endDate).getTime() / 1000) : 0;

      list.push({
        marketId,
        question: sanitizeMarketQuestion(market.question),
        category: cat ? getCategoryInfo(cat) : null,
        outcomeLabel: market.outcomes[pos.outcome] ?? `Outcome ${pos.outcome}`,
        outcomeIndex: pos.outcome,
        stake: pos.stake,
        shares: pos.shares,
        claimed: pos.claimed,
        resolved: isResolved,
        isWinner: isResolved && market.resolvedOutcome === pos.outcome,
        winningOutcome: market.resolvedOutcome ?? 0,
        endTime: endTimestamp,
        yesPct,
      });
    });

    // Sort: claimable first → active → resolved
    return list.sort((a, b) => {
      const aClaimable = a.resolved && a.isWinner && !a.claimed ? 0 : 1;
      const bClaimable = b.resolved && b.isWinner && !b.claimed ? 0 : 1;
      if (aClaimable !== bClaimable) return aClaimable - bClaimable;
      return b.marketId - a.marketId; // newest first
    });
  }, [positions, markets]);

  // Summary stats
  const stats = useMemo(() => {
    let totalWagered = 0;
    let totalWon = 0;
    let activeCount = 0;
    let claimableCount = 0;
    let resolvedCount = 0;
    let winCount = 0;

    positionList.forEach((p) => {
      totalWagered += fromMicroUSDC(p.stake);
      if (!p.resolved) {
        activeCount++;
      } else {
        resolvedCount++;
        if (p.isWinner) {
          winCount++;
          if (!p.claimed) claimableCount++;
          totalWon += fromMicroUSDC(p.shares);
        }
      }
    });

    const netPnl = totalWon - totalWagered;
    const winRate = resolvedCount > 0 ? Math.round((winCount / resolvedCount) * 100) : null;
    return { totalWagered, totalWon, netPnl, activeCount, claimableCount, winRate, resolvedCount };
  }, [positionList]);

  const isLoading = marketsLoading || positionsLoading;

  const handleClaim = async (marketId: number) => {
    // Find the market to get its conditionId
    const market = markets.find((m) => String(m.id) === String(marketId));
    if (!market?.conditionId) {
      console.error('Market or conditionId not found for claim');
      return;
    }
    const tx = await claimWinnings(market.conditionId, [1n]); // default index set
    if (tx) refetchPositions();
  };

  // ── Not connected ─────────────────────────────────────────────────────────
  if (!connected) {
    return (
      <div className="min-h-screen bg-[#080B18] text-white flex items-center justify-center">
        <Container>
          <div className="max-w-md mx-auto text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mx-auto mb-6">
              <FiInbox className="w-8 h-8 text-primary-400" />
            </div>
            <h1 className="text-3xl font-black text-white mb-3">My Bets</h1>
            <p className="text-slate-400 mb-8">
              Connect your wallet to see your prediction history, active positions, and claimable winnings.
            </p>
            <Button
              variant="primary"
              size="lg"
              className="rounded-xl border-0 !bg-gradient-to-r from-primary-500 to-secondary-600 shadow-[0_0_24px_rgba(59,130,246,0.3)]"
            >
              Connect Wallet
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080B18] text-white selection:bg-primary-500/30">
      <Container className="py-8 md:py-12">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-2">Portfolio</p>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">My Bets</h1>
          </div>
          <Link
            to="/markets"
            className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors group"
          >
            Find markets
            <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* ── Stats strip ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {/* Total Wagered */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[#1C2537] bg-[#0D1224] p-4 flex items-start gap-3"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
          >
            <div className="flex-shrink-0 p-2.5 rounded-xl bg-primary-500/10">
              <FiDollarSign className="w-4 h-4 text-primary-400" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium mb-0.5 uppercase tracking-wider">Total Wagered</div>
              <div className="text-xl font-black tabular-nums text-white">
                {isLoading ? '…' : `$${stats.totalWagered.toFixed(2)}`}
              </div>
            </div>
          </motion.div>

          {/* Net P&L */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`rounded-2xl border p-4 flex items-start gap-3 ${
              !isLoading && stats.netPnl >= 0
                ? 'border-success-500/25 bg-success-500/[0.05]'
                : !isLoading && stats.netPnl < 0
                ? 'border-error-500/25 bg-error-500/[0.04]'
                : 'border-[#1C2537] bg-[#0D1224]'
            }`}
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
          >
            <div className={`flex-shrink-0 p-2.5 rounded-xl ${!isLoading && stats.netPnl >= 0 ? 'bg-success-500/10' : !isLoading && stats.netPnl < 0 ? 'bg-error-500/10' : 'bg-primary-500/10'}`}>
              <FiTrendingUp className={`w-4 h-4 ${!isLoading && stats.netPnl >= 0 ? 'text-success-400' : !isLoading && stats.netPnl < 0 ? 'text-error-400' : 'text-primary-400'}`} />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium mb-0.5 uppercase tracking-wider">Net P&L</div>
              <div className={`text-xl font-black tabular-nums ${
                isLoading ? 'text-white' :
                stats.netPnl >= 0 ? 'text-success-400' : 'text-error-400'
              }`}>
                {isLoading ? '…' : `${stats.netPnl >= 0 ? '+' : ''}$${stats.netPnl.toFixed(2)}`}
              </div>
            </div>
          </motion.div>

          {/* Win Rate */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-[#1C2537] bg-[#0D1224] p-4 flex items-start gap-3"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
          >
            <div className="flex-shrink-0 p-2.5 rounded-xl bg-warning-500/10">
              <FiCheckCircle className="w-4 h-4 text-warning-400" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium mb-0.5 uppercase tracking-wider">Win Rate</div>
              <div className="text-xl font-black tabular-nums text-white">
                {isLoading ? '…' : stats.winRate !== null ? `${stats.winRate}%` : '—'}
              </div>
              {!isLoading && stats.resolvedCount > 0 && (
                <div className="text-[10px] text-slate-600 mt-0.5">{stats.resolvedCount} resolved</div>
              )}
            </div>
          </motion.div>

          {/* Claimable */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`rounded-2xl border p-4 flex items-start gap-3 ${
              stats.claimableCount > 0
                ? 'border-secondary-500/30 bg-secondary-500/[0.06]'
                : 'border-[#1C2537] bg-[#0D1224]'
            }`}
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
          >
            <div className="flex-shrink-0 p-2.5 rounded-xl bg-secondary-500/10">
              <FiCheckCircle className="w-4 h-4 text-secondary-400" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium mb-0.5 uppercase tracking-wider">Claimable</div>
              <div className={`text-xl font-black tabular-nums ${stats.claimableCount > 0 ? 'text-secondary-300' : 'text-white'}`}>
                {isLoading ? '…' : stats.claimableCount.toString()}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Positions list ───────────────────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : positionList.length === 0 ? (
          <div className="rounded-2xl border border-[#1C2537] bg-[#0D1224] p-16 text-center"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
          >
            <div className="text-5xl mb-5">🎯</div>
            <h2 className="text-xl font-bold text-white mb-3">No bets yet</h2>
            <p className="text-slate-400 mb-8 max-w-xs mx-auto">
              You haven't placed any predictions yet. Browse active markets to get started.
            </p>
            <Button
              variant="primary"
              to="/markets"
              rightIcon={<FiArrowRight />}
              className="rounded-xl border-0 !bg-gradient-to-r from-primary-500 to-secondary-600"
            >
              Browse Markets
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {positionList.map((pos, i) => {
              const isClaimable = pos.resolved && pos.isWinner && !pos.claimed;
              const isClosed = pos.resolved && !pos.isWinner;
              const isActive = !pos.resolved;

              return (
                <motion.div
                  key={pos.marketId}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className={`rounded-2xl border p-5 transition-all ${
                    isClaimable
                      ? 'border-success-500/30 bg-success-500/[0.04]'
                      : isClosed
                      ? 'border-[#1C2537] bg-[#0D1224] opacity-70'
                      : 'border-[#1C2537] bg-[#0D1224]'
                  }`}
                  style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
                >
                  <div className="flex items-start gap-4">
                    {/* Status icon */}
                    <div className={`flex-shrink-0 mt-0.5 w-9 h-9 rounded-full flex items-center justify-center ${
                      isClaimable ? 'bg-success-500/20 text-success-400' :
                      isClosed ? 'bg-error-500/10 text-error-400' :
                      'bg-primary-500/10 text-primary-400'
                    }`}>
                      {isClaimable ? <FiCheckCircle className="w-4.5 h-4.5" /> :
                       isClosed ? <FiX className="w-4 h-4" /> :
                       <FiLoader className="w-4 h-4 animate-spin" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start gap-2 mb-2">
                        {pos.category && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
                            {pos.category.icon && <pos.category.icon className="w-3 h-3 inline-block mr-1" />}{pos.category.label}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isClaimable ? 'text-success-400 bg-success-500/10 border-success-500/20' :
                          isClosed ? 'text-error-400 bg-error-500/10 border-error-500/20' :
                          'text-primary-400 bg-primary-500/10 border-primary-500/20'
                        }`}>
                          {isClaimable ? 'Won — Claimable' : isClosed ? 'Lost' : pos.claimed ? 'Claimed' : 'Active'}
                        </span>
                      </div>

                      <Link to={`/market/${pos.marketId}`} className="group">
                        <h3 className="font-bold text-white text-sm leading-snug group-hover:text-primary-300 transition-colors line-clamp-2 mb-3">
                          {pos.question}
                        </h3>
                      </Link>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        <span className="text-slate-500">
                          Bet on:{' '}
                          <span className={`font-semibold ${isClaimable ? 'text-success-400' : isClosed ? 'text-error-400' : 'text-primary-400'}`}>
                            {pos.outcomeLabel}
                          </span>
                        </span>
                        <span className="text-slate-500">
                          Staked:{' '}
                          <span className="font-semibold text-white">{formatUSDC(pos.stake)}</span>
                        </span>
                        <span className="text-slate-500">
                          Shares:{' '}
                          <span className="font-semibold text-white">{fromMicroUSDC(pos.shares).toFixed(2)}</span>
                        </span>
                        {!isActive && (
                          <span className="text-slate-500">
                            Ended{' '}
                            <span className="font-semibold text-slate-400">
                              {format(pos.endTime * 1000, 'MMM d, yyyy')}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Claim / View action */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                      {isClaimable && (
                        <Button
                          variant="primary"
                          size="sm"
                          loading={isClaiming}
                          onClick={() => handleClaim(pos.marketId)}
                          className="rounded-xl border-0 !bg-gradient-to-r from-success-500 to-success-600 text-xs font-bold shadow-[0_0_16px_rgba(16,185,129,0.3)] hover:shadow-[0_0_24px_rgba(16,185,129,0.45)]"
                        >
                          <FiCheck className="w-3.5 h-3.5 mr-1" />
                          Claim
                        </Button>
                      )}
                      <Link
                        to={`/market/${pos.marketId}`}
                        className="text-xs text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1"
                      >
                        View market <FiArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
};

export default DashboardPage;

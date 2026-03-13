import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiBarChart2, FiAward } from 'react-icons/fi';
import { useLeaderboard } from '../hooks/useLeaderboard';
import type { LeaderboardMetric, LeaderboardPeriod } from '../services/api/types';
import { useUnifiedWallet } from '../hooks/useUnifiedWallet';
import { Container } from '../components/layout/Container';

const METRIC_OPTIONS: { id: LeaderboardMetric; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'profit', label: 'Profit', Icon: FiTrendingUp },
  { id: 'volume', label: 'Volume', Icon: FiBarChart2 },
];

const PERIOD_OPTIONS: { id: LeaderboardPeriod; label: string }[] = [
  { id: 'daily', label: '24h' },
  { id: 'weekly', label: '7d' },
  { id: 'monthly', label: '30d' },
  { id: 'all_time', label: 'All Time' },
];

const CHAIN_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'aptos', label: 'Aptos' },
  { id: 'sui', label: 'Sui' },
];

const CHAIN_COLORS: Record<'aptos' | 'sui' | 'movement', { bg: string; text: string }> = {
  aptos: { bg: 'bg-primary-500/15', text: 'text-primary-300' },
  sui: { bg: 'bg-secondary-500/15', text: 'text-secondary-300' },
  movement: { bg: 'bg-white/[0.07]', text: 'text-slate-400' },
};

const CHAIN_LABELS: Record<'aptos' | 'sui' | 'movement', string> = {
  aptos: 'Aptos',
  sui: 'Sui',
  movement: 'Movement',
};

const MEDAL_STYLES = [
  { rank: '🥇', border: 'border-yellow-500/40', bg: 'bg-yellow-500/[0.06]', glow: '0 0 24px rgba(234,179,8,0.15)', value: 'text-yellow-400' },
  { rank: '🥈', border: 'border-slate-400/30', bg: 'bg-white/[0.04]', glow: '0 0 24px rgba(148,163,184,0.1)', value: 'text-slate-300' },
  { rank: '🥉', border: 'border-orange-500/30', bg: 'bg-orange-500/[0.04]', glow: '0 0 24px rgba(249,115,22,0.1)', value: 'text-orange-400' },
];

const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const formatCurrency = (v: number) => formatter.format(v);

const getDisplayValue = (
  metric: LeaderboardMetric,
  entry: { value: string; totalProfit: string; totalVolume: string },
) =>
  metric === 'profit'
    ? formatCurrency(Number(entry.totalProfit ?? entry.value))
    : formatCurrency(Number(entry.totalVolume ?? entry.value));

const shortAddress = (addr: string) =>
  addr.length <= 12 ? addr : `${addr.slice(0, 6)}…${addr.slice(-4)}`;

const ChainBadge: React.FC<{ chain: 'aptos' | 'sui' | 'movement' }> = ({ chain }) => {
  const colors = CHAIN_COLORS[chain] ?? CHAIN_COLORS.movement;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-white/[0.07] ${colors.bg} ${colors.text}`}>
      {CHAIN_LABELS[chain]}
    </span>
  );
};

const LeaderboardPage = () => {
  const [metric, setMetric] = useState<LeaderboardMetric>('profit');
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const [chain, setChain] = useState<'aptos' | 'sui' | 'movement' | 'all'>('all');
  const { leaders, isLoading, error } = useLeaderboard({ metric, period, chain });
  const { address } = useUnifiedWallet();

  const podium = useMemo(() => leaders.slice(0, 3), [leaders]);
  const rest = useMemo(() => leaders.slice(3), [leaders]);

  // Find user's rank
  const userRank = useMemo(
    () => address ? leaders.find((e) => e.walletAddress.toLowerCase() === address.toLowerCase()) : null,
    [leaders, address],
  );

  return (
    <div className="min-h-screen bg-[#080B18] text-white selection:bg-primary-500/30">
      <Container className="py-8 md:py-12">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-2">Rankings</p>
          <div className="flex items-end justify-between">
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Leaderboard</h1>
            {userRank && (
              <div className="hidden md:flex items-center gap-2 text-sm text-slate-400">
                <FiAward className="w-4 h-4 text-primary-400" />
                You're ranked <span className="font-bold text-white">#{userRank.rank}</span>
              </div>
            )}
          </div>
          <p className="text-slate-500 mt-2 text-sm">Top performers across profit and volume. Place accurate predictions to climb the ranks.</p>
        </div>

        {/* ── Filters ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-8">
          {/* Metric toggle */}
          <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.03] p-1">
            {METRIC_OPTIONS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setMetric(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  metric === id
                    ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Period */}
          <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.03] p-1">
            {PERIOD_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setPeriod(id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  period === id
                    ? 'bg-white/[0.09] text-white border border-white/[0.12]'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Chain */}
          <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.03] p-1">
            {CHAIN_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setChain(id as typeof chain)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  chain === id
                    ? 'bg-secondary-500/20 text-secondary-300 border border-secondary-500/30'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Loading ───────────────────────────────────────────────────── */}
        {isLoading && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
            </div>
            <div className="skeleton h-64 rounded-2xl" />
          </div>
        )}

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {error && !isLoading && (
          <div className="rounded-2xl border border-error-500/30 bg-error-500/[0.06] p-8 text-center">
            <p className="text-error-400 font-semibold">Failed to load leaderboard</p>
            <p className="text-slate-500 text-sm mt-1">{error.message}</p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* ── Podium ──────────────────────────────────────────────── */}
            {podium.length > 0 && (
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {podium.map((entry, i) => {
                  const style = MEDAL_STYLES[i] ?? MEDAL_STYLES[2];
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.08 }}
                      className={`rounded-2xl border p-6 text-center ${style.border} ${style.bg}`}
                      style={{ boxShadow: style.glow }}
                    >
                      <div className="text-3xl mb-2">{style.rank}</div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        #{entry.rank}
                      </div>
                      <div className="font-bold text-white text-sm mb-3 truncate px-2">
                        {entry.displayName ?? shortAddress(entry.walletAddress)}
                      </div>
                      <div className={`text-2xl font-black tabular-nums mb-3 ${style.value}`}>
                        {getDisplayValue(metric, entry)}
                      </div>
                      <div className="flex items-center justify-center gap-3 text-xs text-slate-500">
                        <span><span className="text-white font-semibold">{entry.winRate.toFixed(0)}%</span> win rate</span>
                        <span className="text-slate-700">·</span>
                        <span><span className="text-white font-semibold">{entry.totalBets}</span> bets</span>
                      </div>
                      <div className="mt-3">
                        <ChainBadge chain={entry.chain as 'aptos' | 'sui' | 'movement'} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* ── Rankings table ──────────────────────────────────────── */}
            {(rest.length > 0 || podium.length === 0) && (
              <div
                className="rounded-2xl border border-[#1C2537] bg-[#0D1224] overflow-hidden"
                style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
              >
                {/* Table header */}
                <div className="px-6 py-4 border-b border-white/[0.05]">
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                    {metric === 'profit' ? 'Top Profit' : 'Top Volume'} · {period.replace('_', ' ')}
                  </h2>
                </div>

                {rest.length === 0 && podium.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="text-4xl mb-4">🏆</div>
                    <p className="text-slate-400 font-semibold">No data yet</p>
                    <p className="text-slate-600 text-sm mt-1">Place predictions to appear on the leaderboard.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-white/[0.04]">
                          {['Rank', 'Trader', metric === 'profit' ? 'Profit' : 'Volume', 'Win Rate', 'Bets', 'Chain'].map((h) => (
                            <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rest.map((entry, i) => {
                          const isMe = address && entry.walletAddress.toLowerCase() === address.toLowerCase();
                          return (
                            <motion.tr
                              key={entry.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.05 + i * 0.03 }}
                              className={`border-b border-white/[0.03] transition-colors ${
                                isMe ? 'bg-primary-500/[0.06]' : 'hover:bg-white/[0.025]'
                              }`}
                            >
                              <td className="px-5 py-3.5 text-sm font-bold text-slate-400">
                                #{entry.rank}
                              </td>
                              <td className="px-5 py-3.5">
                                <span className={`text-sm font-semibold ${isMe ? 'text-primary-300' : 'text-white'}`}>
                                  {entry.displayName ?? shortAddress(entry.walletAddress)}
                                  {isMe && <span className="ml-2 text-[10px] text-primary-500 font-bold uppercase tracking-wider">(you)</span>}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-sm font-black text-primary-400 tabular-nums">
                                {getDisplayValue(metric, entry)}
                              </td>
                              <td className="px-5 py-3.5 text-sm text-slate-400 tabular-nums">
                                {entry.winRate.toFixed(1)}%
                              </td>
                              <td className="px-5 py-3.5 text-sm text-slate-400 tabular-nums">
                                {entry.totalBets}
                              </td>
                              <td className="px-5 py-3.5">
                                <ChainBadge chain={entry.chain as 'aptos' | 'sui' | 'movement'} />
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
};

export default LeaderboardPage;

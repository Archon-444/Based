import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiTwitter } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import {
  FiArrowLeft,
  FiCheck,
  FiShare2,
  FiClock,
  FiDollarSign,
  FiLayers,
  FiTrendingUp,
  FiAlertCircle,
  FiZap,
  FiRefreshCw,
} from 'react-icons/fi';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { useCountdown } from '../hooks/useCountdown';
import { useMarket } from '../hooks/useMarkets';
import MarketResolutionPanel from '../components/MarketResolutionPanel';
import { fromMicroUSDC, VALIDATION_CONSTANTS } from '../utils/validation';
import { sanitizeMarketQuestion } from '../utils/sanitize';
import { usePlaceBet } from '../hooks/useTransactions';
import { getCategoryFromQuestion, getCategoryInfo } from '../types/categories';
import { useChainCurrency } from '../hooks/useChainCurrency';
import { useDebounce } from '../hooks/useDebounce';
import { useSDKContext } from '../contexts/SDKContext';
import { fetchPayoutQuote, type PayoutQuote } from '../services/payoutApi';
import { usePriceHistory } from '../hooks/usePriceHistory';

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatNumber = (v: number, d = 2): string =>
  v.toLocaleString('en-US', { maximumFractionDigits: d });

const formatAddress = (addr: string): string =>
  addr.length <= 10 ? addr : `${addr.slice(0, 6)}…${addr.slice(-4)}`;

const formatVolume = (micro: number): string => {
  const v = fromMicroUSDC(micro);
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
};

const getTimeLabel = (isExpired: boolean, countdown: ReturnType<typeof useCountdown>): string => {
  if (isExpired) return 'Market Closed';
  const { days, hours, minutes, seconds } = countdown;
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m ${seconds}s left`;
};


// ── Custom Tooltip ─────────────────────────────────────────────────────────

const ChartTooltip: React.FC<{ active?: boolean; payload?: any[]; label?: string }> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/[0.1] bg-[#0D1224] px-3 py-2 shadow-xl text-xs">
      <p className="text-slate-500 mb-1">{label}</p>
      <p className="font-bold text-primary-300">{payload[0]?.value}%</p>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const MarketDetailPage: React.FC = () => {
  const { id } = useParams();
  const marketId = useMemo(() => {
    if (!id) return null;
    return id;
  }, [id]);

  const { market, isLoading, error, refetch } = useMarket(marketId);
  const { placeBet, isLoading: isPlacingBet } = usePlaceBet();
  const { chain } = useSDKContext();
  const currency = useChainCurrency();

  // UI state
  const [selectedOutcomeIndex, setSelectedOutcomeIndex] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState('');
  const [payoutData, setPayoutData] = useState<PayoutQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [betSuccess, setBetSuccess] = useState(false);

  const debouncedAmount = useDebounce(parseFloat(betAmount) || 0, 400);
  const countdown = useCountdown(market?.endDate ? new Date(market.endDate).getTime() : Date.now());
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── 10-second polling for live odds ──────────────────────────────────────
  useEffect(() => {
    const isResolved = market?.status === 'resolved' || market?.resolvedAt != null;
    if (!market || isResolved || countdown.isExpired) return;
    pollingRef.current = setInterval(() => { refetch(); }, 10_000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [market?.id, market?.status, market?.resolvedAt, countdown.isExpired, refetch]);

  // ── Payout quote ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!market || selectedOutcomeIndex === null || debouncedAmount <= 0) {
      setPayoutData(null);
      setQuoteError(null);
      return;
    }
    const ctrl = new AbortController();
    setQuoteLoading(true);
    setQuoteError(null);

    fetchPayoutQuote(
      { chain: chain as any, onChainId: market.onChainId ?? market.id.toString(), outcomeIndex: selectedOutcomeIndex, amount: debouncedAmount },
      { signal: ctrl.signal },
    )
      .then(setPayoutData)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setQuoteError(err instanceof Error ? err.message : 'Unable to calculate payout');
        setPayoutData(null);
      })
      .finally(() => setQuoteLoading(false));

    return () => ctrl.abort();
  }, [chain, debouncedAmount, selectedOutcomeIndex, market?.id]);

  // Reset bet form when outcome changes
  useEffect(() => {
    setBetAmount('');
    setPayoutData(null);
    setQuoteError(null);
  }, [selectedOutcomeIndex]);

  const totalVolume = market ? parseFloat(market.totalVolume) || 0 : 0;
  const totalStakes = totalVolume;
  const question = market ? sanitizeMarketQuestion(market.question) : '';
  const category = market ? getCategoryFromQuestion(market.question) : null;
  const categoryInfo = category ? getCategoryInfo(category) : null;

  const outcomeData = useMemo(() => {
    if (!market) return [];
    const pools = market.outcomePools.map((p) => parseFloat(p) || 0);
    const total = pools.reduce((s, v) => s + v, 0) || totalVolume;
    return market.outcomes.map((label, index) => {
      const stake = fromMicroUSDC(pools[index] ?? 0);
      const pct = total > 0 ? Math.round(((pools[index] ?? 0) / total) * 100) : 0;
      return { label, stake, pct };
    });
  }, [market, totalVolume]);

  const numericMarketId = market?.id ? parseInt(market.id, 10) || null : null;
  const { data: priceHistory, isLive: priceIsLive } = usePriceHistory(
    numericMarketId,
    outcomeData[0]?.pct ?? 50,
    chain,
  );
  // Map hook output shape to recharts dataKey
  const chartData = useMemo(
    () => priceHistory.map((p) => ({ time: p.time, yes: p.pct })),
    [priceHistory],
  );

  const selectedOutcome = useMemo(() => {
    if (selectedOutcomeIndex === null || !market) return null;
    const { label, pct, stake } = outcomeData[selectedOutcomeIndex];
    return { label, odds: pct, pool: `$${formatNumber(stake)}` };
  }, [selectedOutcomeIndex, market, outcomeData]);

  const numAmount = parseFloat(betAmount) || 0;
  const fallbackPayout = numAmount > 0 && (selectedOutcome?.odds ?? 0) > 0
    ? (numAmount / (selectedOutcome!.odds / 100))
    : 0;
  const estimatedPayout = payoutData?.estimatedPayout ?? fallbackPayout;
  const potentialProfit = payoutData?.potentialProfit ?? (estimatedPayout - numAmount);

  // OG meta tags — update per market
  useEffect(() => {
    if (!market) return;
    const title = `${question} | Prophecy`;
    const desc = `Predict the outcome on Prophecy. ${outcomeData.map((o) => `${o.label} ${o.pct}%`).join(' · ')}`;
    document.title = title;
    const setMeta = (prop: string, val: string, attr = 'property') => {
      let el = document.querySelector(`meta[${attr}="${prop}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, prop); document.head.appendChild(el); }
      el.setAttribute('content', val);
    };
    setMeta('og:title', title);
    setMeta('og:description', desc);
    setMeta('og:url', window.location.href);
    setMeta('twitter:title', title);
    setMeta('twitter:description', desc);
    setMeta('twitter:card', 'summary', 'name');
    return () => { document.title = 'Prophecy — Prediction Markets'; };
  }, [market, question, outcomeData]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    if (!market) return;
    const topOutcome = outcomeData[0];
    const text = encodeURIComponent(
      `I'm predicting on Prophecy: "${question}"\n${topOutcome ? `${topOutcome.label} is at ${topOutcome.pct}%` : ''}\n\nWhat do you think?`
    );
    const url = encodeURIComponent(window.location.href);
    window.open(`https://x.com/intent/post?text=${text}&url=${url}`, '_blank', 'noopener');
  };

  const handleSubmit = useCallback(async () => {
    if (selectedOutcomeIndex === null || numAmount <= 0 || !market) return;
    const txHash = await placeBet(market.onChainId ?? market.id, selectedOutcomeIndex, numAmount);
    if (txHash) {
      setBetAmount('');
      setPayoutData(null);
      setBetSuccess(true);
      setTimeout(() => setBetSuccess(false), 3000);
      refetch();
    }
  }, [selectedOutcomeIndex, numAmount, market, placeBet, refetch]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080B18]">
        <Container className="py-10">
          <div className="space-y-4">
            <div className="skeleton h-8 w-32 rounded-xl" />
            <div className="skeleton h-48 w-full rounded-2xl" />
            <div className="skeleton h-40 w-full rounded-2xl" />
          </div>
        </Container>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || (!isLoading && !market)) {
    return (
      <div className="min-h-screen bg-[#080B18]">
        <Container className="py-10">
          <div className="rounded-2xl border border-error-500/30 bg-error-500/[0.06] p-8 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">
              {error ? 'Failed to load market' : 'Market not found'}
            </h2>
            <p className="text-slate-400 mb-6 text-sm">
              {error?.message ?? 'This market may have been removed.'}
            </p>
            <Button variant="ghost" to="/markets" leftIcon={<FiArrowLeft />} className="border border-white/10 text-slate-300">
              Back to Markets
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  const isMarketResolved = market!.status === 'resolved' || market!.resolvedAt != null;
  const marketEndTimestamp = market!.endDate ? Math.floor(new Date(market!.endDate).getTime() / 1000) : 0;
  const marketWinningOutcome = market!.resolvedOutcome ?? -1;
  const marketCreator = market!.creatorWallet ?? '';
  const marketCreatedTimestamp = market!.createdAt ? new Date(market!.createdAt).getTime() : 0;

  const isExpired = countdown.isExpired || isMarketResolved;
  const timeLabel = getTimeLabel(countdown.isExpired, countdown);
  const statusIsActive = !isMarketResolved && !countdown.isExpired;
  const canBet = statusIsActive && selectedOutcomeIndex !== null;

  return (
    <div className="min-h-screen bg-[#080B18] text-white selection:bg-primary-500/30">
      <Container className="py-8 md:py-12">

        {/* ── Breadcrumb ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/markets"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            All Markets
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors"
            >
              {copied ? (
                <><FiCheck className="w-4 h-4 text-success-400" /><span className="text-success-400">Copied!</span></>
              ) : (
                <><FiShare2 className="w-4 h-4" />Copy link</>
              )}
            </button>
            <button
              onClick={handleShareTwitter}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-200 transition-colors"
              aria-label="Share on X"
            >
              <FiTwitter className="w-4 h-4" />
              <span className="hidden sm:inline">Post</span>
            </button>
          </div>
        </div>

        {/* ── Admin resolution panel ───────────────────────────────────── */}
        <MarketResolutionPanel marketId={marketId} />

        <div className="grid lg:grid-cols-[1fr_380px] gap-6 mt-4">

          {/* ── Left column ─────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Market header card */}
            <div
              className="rounded-2xl border border-[#1C2537] bg-[#0D1224] p-6"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)' }}
            >
              {/* Tags row */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-white/[0.05] px-3 py-1 rounded-full border border-white/[0.07]">
                  Market #{market!.id}
                </span>
                {categoryInfo && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-white/[0.05] px-3 py-1 rounded-full border border-white/[0.07]">
                    <span>{categoryInfo.icon}</span>
                    {categoryInfo.label}
                  </span>
                )}
                <div className="inline-flex items-center gap-1.5 ml-auto">
                  <span className="relative flex h-2 w-2">
                    {statusIsActive && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
                    )}
                    <span className={`relative inline-flex h-2 w-2 rounded-full ${
                      isMarketResolved ? 'bg-slate-500' :
                      countdown.isExpired ? 'bg-warning-400' : 'bg-success-400'
                    }`} />
                  </span>
                  <span className={`text-sm font-semibold ${
                    isMarketResolved ? 'text-slate-400' :
                    countdown.isExpired ? 'text-warning-400' : 'text-success-400'
                  }`}>
                    {isMarketResolved ? 'Resolved' : countdown.isExpired ? 'Pending Resolution' : 'Live'}
                  </span>
                </div>
              </div>

              {/* Question */}
              <h1 className="text-2xl md:text-3xl font-black text-white leading-snug tracking-tight mb-4">
                {question}
              </h1>

              {/* Creator + time */}
              <p className="text-sm text-slate-500 mb-6">
                Created by{' '}
                <span className="font-mono text-slate-400">{formatAddress(marketCreator)}</span>
                {' · '}
                {format(marketCreatedTimestamp, 'MMM d, yyyy')}
              </p>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: FiDollarSign, iconColor: 'text-primary-400', bg: 'bg-primary-500/10', label: 'Total Volume', value: formatVolume(totalStakes) },
                  { icon: FiLayers, iconColor: 'text-secondary-400', bg: 'bg-secondary-500/10', label: 'Outcomes', value: market!.outcomes.length.toString() },
                  { icon: FiClock, iconColor: 'text-warning-400', bg: 'bg-warning-500/10', label: isMarketResolved ? 'Ended' : 'Time Left', value: isMarketResolved ? format(marketEndTimestamp * 1000, 'MMM d') : timeLabel },
                  { icon: FiTrendingUp, iconColor: 'text-success-400', bg: 'bg-success-500/10', label: 'Status', value: isMarketResolved ? `Winner: ${market!.outcomes[marketWinningOutcome] ?? '?'}` : statusIsActive ? 'Active' : 'Pending' },
                ].map(({ icon: Icon, iconColor, bg, label, value }) => (
                  <div key={label} className="flex items-start gap-3 rounded-xl bg-white/[0.025] border border-white/[0.05] p-3">
                    <div className={`flex-shrink-0 p-2 rounded-lg ${bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] text-slate-500 font-medium mb-0.5">{label}</div>
                      <div className="text-sm font-bold text-white truncate">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Price History Chart (binary markets only) ───────── */}
            {chartData.length > 0 && market!.outcomes.length === 2 && (
              <div
                className="rounded-2xl border border-[#1C2537] bg-[#0D1224] p-6"
                style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)' }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-bold text-white">Probability History</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {outcomeData[0]?.label ?? 'YES'} · 30-day trend
                      {priceIsLive && (
                        <span className="ml-1.5 text-success-400 font-semibold">· live</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#60A5FA' }} />
                      <span className="text-slate-400">{outcomeData[0]?.label ?? 'YES'} {outcomeData[0]?.pct ?? 0}%</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                      <span className="text-slate-500">{outcomeData[1]?.label ?? 'NO'} {outcomeData[1]?.pct ?? 0}%</span>
                    </span>
                  </div>
                </div>

                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id={`yesGrad-${market!.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="time"
                        tick={{ fill: '#475569', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: '#475569', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}%`}
                        ticks={[0, 25, 50, 75, 100]}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
                      <Area
                        type="monotone"
                        dataKey="yes"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        fill={`url(#yesGrad-${market!.id})`}
                        dot={false}
                        activeDot={{ r: 4, fill: '#60A5FA', stroke: '#0D1224', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ── Outcomes card ────────────────────────────────────── */}
            <div
              className="rounded-2xl border border-[#1C2537] bg-[#0D1224] p-6"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)' }}
            >
              <h2 className="text-lg font-bold text-white mb-1">Outcomes</h2>
              <p className="text-sm text-slate-500 mb-5">
                {isMarketResolved
                  ? 'This market has been resolved.'
                  : 'Select an outcome to place your prediction.'}
              </p>

              <div className="space-y-3">
                {outcomeData.map((outcome, index) => {
                  const isSelected = selectedOutcomeIndex === index;
                  const isWinner = isMarketResolved && marketWinningOutcome === index;
                  const isLoser = isMarketResolved && marketWinningOutcome !== index;

                  return (
                    <motion.button
                      key={`${outcome.label}-${index}`}
                      type="button"
                      whileTap={{ scale: 0.99 }}
                      onClick={() => { if (!isExpired) setSelectedOutcomeIndex(index); }}
                      disabled={isExpired}
                      className={[
                        'w-full flex items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-all duration-150',
                        isWinner ? 'border-success-500/50 bg-success-500/[0.08]' :
                        isLoser  ? 'border-white/[0.04] bg-white/[0.01] opacity-50' :
                        isSelected ? 'border-primary-500/60 bg-primary-500/[0.08] shadow-[0_0_20px_rgba(59,130,246,0.1)]' :
                        'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]',
                      ].join(' ')}
                    >
                      <div className={[
                        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                        isWinner ? 'bg-success-500 text-white' :
                        isSelected ? 'bg-primary-500 text-white' :
                        'bg-white/[0.06] text-slate-400',
                      ].join(' ')}>
                        {isWinner ? <FiCheck className="w-4 h-4" /> : String.fromCharCode(65 + index)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className={`font-semibold text-sm ${isLoser ? 'text-slate-500' : 'text-white'}`}>
                            {outcome.label}
                          </span>
                          <span className={`text-sm font-bold tabular-nums ${
                            isWinner ? 'text-success-400' :
                            isSelected ? 'text-primary-400' : 'text-slate-400'
                          }`}>
                            {outcome.pct}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/[0.06]">
                          <motion.div
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${outcome.pct}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            style={{
                              background: isWinner
                                ? 'linear-gradient(90deg, #34D399, #10B981)'
                                : isSelected
                                ? 'linear-gradient(90deg, #60A5FA, #3B82F6)'
                                : 'rgba(148,163,184,0.25)',
                            }}
                          />
                        </div>
                      </div>

                      <div className="text-right text-xs text-slate-500 flex-shrink-0">
                        ${formatNumber(outcome.stake)}
                      </div>
                    </motion.button>
                  );
                })}

                {outcomeData.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">
                    Outcomes will appear once this market is fully initialized.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Right column: Inline Trade Panel ────────────────────── */}
          <div className="lg:sticky lg:top-24 h-fit space-y-4">
            <div
              className="rounded-2xl border border-[#1C2537] bg-[#0D1224] overflow-hidden"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)' }}
            >
              {/* Panel header */}
              <div className="px-6 pt-6 pb-5 border-b border-white/[0.05]">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">Place Prediction</h2>
                  {statusIsActive && (
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <FiRefreshCw className="w-3 h-3" />
                      Live odds
                    </span>
                  )}
                </div>
                {isMarketResolved ? (
                  <p className="text-sm text-slate-500 mt-1">This market has been resolved.</p>
                ) : isExpired ? (
                  <p className="text-sm text-warning-400 mt-1">Market has closed. Awaiting resolution.</p>
                ) : (
                  <p className="text-sm text-slate-500 mt-1">
                    Closes {format(marketEndTimestamp * 1000, 'MMM d, HH:mm')}
                    {' · '}
                    <span className={countdown.isExpired ? 'text-error-400' : 'text-white font-medium'}>
                      {timeLabel}
                    </span>
                  </p>
                )}
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Bet success flash */}
                <AnimatePresence>
                  {betSuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center gap-3 rounded-xl border border-success-500/30 bg-success-500/[0.08] px-4 py-3"
                    >
                      <FiCheck className="w-5 h-5 text-success-400 flex-shrink-0" />
                      <span className="text-sm font-semibold text-success-300">Bet placed successfully!</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Selected outcome */}
                <AnimatePresence mode="wait">
                  {selectedOutcome ? (
                    <motion.div
                      key={`outcome-${selectedOutcomeIndex}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-xl border border-primary-500/30 bg-primary-500/[0.07] p-4"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary-400">Selected outcome</span>
                        <motion.span
                          key={selectedOutcome.odds}
                          initial={{ scale: 1.2, color: '#93C5FD' }}
                          animate={{ scale: 1, color: '#60A5FA' }}
                          className="text-2xl font-black text-primary-400 tabular-nums"
                        >
                          {selectedOutcome.odds}%
                        </motion.span>
                      </div>
                      <div className="text-base font-bold text-white">{selectedOutcome.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Pool: {selectedOutcome.pool}</div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="no-outcome"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center"
                    >
                      <p className="text-sm text-slate-500">
                        {isExpired ? 'Market is closed' : '← Select an outcome to continue'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bet amount input */}
                {canBet && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Amount ({currency.unitLabel})
                      </label>
                      {/* Preset buttons */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {currency.presetAmounts.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setBetAmount(preset.toString())}
                            className={`py-2 rounded-lg text-xs font-bold transition-all ${
                              betAmount === preset.toString()
                                ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40'
                                : 'bg-white/[0.04] text-slate-400 border border-white/[0.07] hover:bg-white/[0.07] hover:text-white'
                            }`}
                          >
                            {currency.symbolPrefix}{preset}
                          </button>
                        ))}
                      </div>
                      {/* Input */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                          {(currency.chain as string) === 'sui'
                            ? <span className="text-slate-400 font-bold text-sm">◊</span>
                            : <FiDollarSign className="w-4 h-4 text-slate-400" />
                          }
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={betAmount}
                          onChange={(e) => setBetAmount(e.target.value)}
                          className="w-full rounded-xl border border-[#1C2537] bg-[#080B18] text-white placeholder-slate-600 pl-9 pr-4 py-3 text-base font-semibold focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-colors"
                        />
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5">
                        Min bet: {currency.symbolPrefix}{VALIDATION_CONSTANTS.MIN_BET_USDC} {currency.unitLabel}
                      </p>
                    </div>

                    {/* Payout preview */}
                    <AnimatePresence>
                      {numAmount > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden"
                        >
                          <div className="p-4 space-y-2.5">
                            {quoteLoading && (
                              <div className="flex items-center gap-2 text-xs text-primary-400">
                                <FiZap className="w-3 h-3 animate-pulse" />
                                Calculating…
                              </div>
                            )}
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Your stake</span>
                              <span className="font-semibold text-white">{currency.formatDisplay(numAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Est. payout</span>
                              <span className="font-semibold text-white">{currency.formatDisplay(estimatedPayout)}</span>
                            </div>
                            {payoutData?.shares && (
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Shares</span>
                                <span className="font-semibold text-white">
                                  {formatNumber(Math.max(payoutData.shares.decimal, 0))}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between text-xs text-slate-600">
                              <span>Fees (~2%)</span>
                              <span>{currency.formatDisplay(Math.max((payoutData?.fees.total ?? numAmount * 0.02), 0))}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-2.5 border-t border-white/[0.06]">
                              <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                                <FiTrendingUp className="w-3.5 h-3.5" />
                                Potential profit
                              </span>
                              <span className={`font-black text-base ${potentialProfit >= 0 ? 'text-success-400' : 'text-error-400'}`}>
                                {potentialProfit >= 0 ? '+' : ''}{currency.formatDisplay(potentialProfit)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {quoteError && (
                      <div className="flex items-center gap-2 text-xs text-warning-400">
                        <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{quoteError}</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* CTA button */}
                <Button
                  variant="primary"
                  className={`w-full py-3.5 text-base font-bold rounded-xl border-0 transition-all ${
                    canBet && numAmount >= VALIDATION_CONSTANTS.MIN_BET_USDC
                      ? '!bg-gradient-to-r from-primary-500 to-secondary-600 shadow-[0_0_24px_rgba(59,130,246,0.3)] hover:shadow-[0_0_36px_rgba(59,130,246,0.45)]'
                      : ''
                  }`}
                  disabled={!canBet || numAmount < VALIDATION_CONSTANTS.MIN_BET_USDC || isPlacingBet}
                  loading={isPlacingBet}
                  onClick={handleSubmit}
                >
                  {isMarketResolved
                    ? 'Market Resolved'
                    : isExpired
                    ? 'Market Closed'
                    : isPlacingBet
                    ? 'Confirming…'
                    : canBet && numAmount >= VALIDATION_CONSTANTS.MIN_BET_USDC
                    ? `Confirm Bet on "${selectedOutcome!.label}"`
                    : selectedOutcome
                    ? `Enter amount to bet`
                    : 'Select an Outcome'}
                </Button>

                {!isExpired && (
                  <p className="text-center text-[11px] text-slate-600 leading-relaxed">
                    Bets are non-withdrawable and subject to smart contract terms.
                    Odds may shift before confirmation.
                  </p>
                )}
              </div>
            </div>

            {/* ── Market info sidebar card ─────────────────────────── */}
            {!isMarketResolved && (
              <div
                className="rounded-2xl border border-[#1C2537] bg-[#0D1224] p-5"
                style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)' }}
              >
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Market Info</h3>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total volume</span>
                    <span className="font-semibold text-white">{formatVolume(totalStakes)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Outcomes</span>
                    <span className="font-semibold text-white">{market!.outcomes.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Resolution</span>
                    <span className="font-semibold text-white">Oracle</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Created</span>
                    <span className="font-semibold text-white">{format(marketCreatedTimestamp, 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default MarketDetailPage;

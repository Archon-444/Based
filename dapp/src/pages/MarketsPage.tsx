import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiX, FiClock, FiTrendingUp, FiDollarSign, FiActivity } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { useDebounce } from '../hooks/useDebounce';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { PullToRefresh } from '../components/mobile/PullToRefresh';
import CategoryFilter from '../components/CategoryFilter';
import AdvancedFilters, { SortOption, StatusFilter } from '../components/AdvancedFilters';
import { MarketCategory, getCategoryFromQuestion, getCategoryInfo } from '../types/categories';
import { useMarkets } from '../hooks/useMarkets';
import { fromMicroUSDC } from '../utils/validation';
import { sanitizeMarketQuestion } from '../utils/sanitize';
import { useChain } from '../contexts/ChainContext';

interface DisplayMarket {
  id: number;
  question: string;
  category: MarketCategory;
  totalStakes: number;
  outcomeStakes: number[];
  outcomes: string[];
  endTime: number;
  resolved: boolean;
  winningOutcome: number;
  status: 'active' | 'ending_soon' | 'closed';
  isTrending: boolean;
}

const formatVolume = (micro: number): string => {
  const val = fromMicroUSDC(micro);
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toFixed(0)}`;
};

const formatEndsIn = (endTime: number, resolved: boolean): string => {
  if (resolved) return 'Resolved';
  const diff = endTime * 1000 - Date.now();
  if (diff <= 0) return 'Closing soon';
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const getOdds = (market: DisplayMarket): { yesOdds: number; noOdds: number; hasOdds: boolean } => {
  const total = market.totalStakes;
  if (total <= 0 || market.outcomes.length < 2) return { yesOdds: 50, noOdds: 50, hasOdds: false };
  const yesStake = market.outcomeStakes[0] ?? 0;
  const yesOdds = Math.round((yesStake / total) * 100);
  return { yesOdds, noOdds: 100 - yesOdds, hasOdds: true };
};

// ── Market Card ────────────────────────────────────────────
const MarketCard: React.FC<{ market: DisplayMarket; index: number }> = ({
  market,
  index,
}) => {
  const { isTrending } = market;
  const categoryInfo = getCategoryInfo(market.category);
  const { yesOdds, noOdds, hasOdds } = getOdds(market);
  const isBinary = market.outcomes.length === 2;
  const yesLabel = market.outcomes[0] ?? 'Yes';
  const noLabel = market.outcomes[1] ?? 'No';

  const statusConfig = {
    active: { dot: 'bg-success-400', text: 'text-success-400', label: 'Active' },
    ending_soon: { dot: 'bg-warning-400', text: 'text-warning-400', label: 'Ending Soon' },
    closed: { dot: 'bg-slate-500', text: 'text-slate-500', label: 'Closed' },
  }[market.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.035 }}
    >
      <Link to={`/market/${market.id}`} className="block h-full group">
        <div className={`relative h-full flex flex-col gap-4 rounded-2xl border bg-[#0D1224] p-5 transition-all duration-200 group-hover:-translate-y-0.5 ${
            isTrending
              ? 'border-warning-500/30 group-hover:border-warning-500/50 group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.45),0_0_0_1px_rgba(245,158,11,0.15)]'
              : 'border-[#1C2537] group-hover:border-primary-500/30 group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.45),0_0_0_1px_rgba(59,130,246,0.12)]'
          }`}
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)' }}
        >
          {/* Top row: category + status */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-white/[0.05] px-2.5 py-1 rounded-full border border-white/[0.07]">
                <span className="text-sm">{categoryInfo.icon}</span>
                {categoryInfo.label}
              </span>
              {isTrending && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-warning-300 bg-warning-500/10 px-2 py-1 rounded-full border border-warning-500/25">
                  🔥 Hot
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`relative flex h-1.5 w-1.5`}>
                {market.status === 'active' && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
                )}
                <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
              </span>
              <span className={`text-[11px] font-semibold ${statusConfig.text}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Question */}
          <h3 className="text-base font-semibold text-white leading-snug line-clamp-2 flex-1">
            {market.question}
          </h3>

          {/* Odds / probability */}
          {isBinary && (
            <div className="space-y-2">
              {/* Bar */}
              <div className="relative w-full h-2 rounded-full overflow-hidden bg-white/[0.06]">
                {market.resolved && market.winningOutcome === 0 ? (
                  <div className="absolute left-0 top-0 h-full w-full rounded-full bg-success-500/60" />
                ) : market.resolved && market.winningOutcome === 1 ? (
                  <div className="absolute left-0 top-0 h-full w-full rounded-full bg-error-500/60" />
                ) : (
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${yesOdds}%`,
                      background: 'linear-gradient(90deg, #34D399, #10B981)',
                    }}
                  />
                )}
              </div>
              {/* Labels */}
              {!market.resolved && (
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-success-400">
                    {yesLabel} {hasOdds ? `${yesOdds}%` : '—'}
                  </span>
                  <span className="text-slate-500">
                    {noLabel} {hasOdds ? `${noOdds}%` : '—'}
                  </span>
                </div>
              )}
              {market.resolved && (
                <div className="text-xs font-semibold text-success-400">
                  Resolved: {market.outcomes[market.winningOutcome] ?? 'Unknown'}
                </div>
              )}
            </div>
          )}

          {/* Multi-outcome pill list */}
          {!isBinary && market.outcomes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {market.outcomes.slice(0, 4).map((outcome, i) => (
                <span
                  key={i}
                  className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${
                    market.resolved && market.winningOutcome === i
                      ? 'bg-success-500/15 border-success-500/30 text-success-300'
                      : 'bg-white/[0.05] border-white/[0.08] text-slate-400'
                  }`}
                >
                  {outcome}
                </span>
              ))}
              {market.outcomes.length > 4 && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-slate-500 font-medium">
                  +{market.outcomes.length - 4} more
                </span>
              )}
            </div>
          )}

          {/* Bottom row: volume + time */}
          <div className="flex items-center justify-between pt-1 border-t border-white/[0.05]">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <FiDollarSign className="w-3.5 h-3.5" />
              <span className="font-semibold text-slate-300">
                {formatVolume(market.totalStakes)}
              </span>
              <span>volume</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <FiClock className="w-3.5 h-3.5" />
              <span>{formatEndsIn(market.endTime, market.resolved)}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

// ── Loading skeleton ────────────────────────────────────────
const MarketSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-[#1C2537] bg-[#0D1224] p-5 space-y-4 h-52">
    <div className="flex justify-between">
      <div className="skeleton h-5 w-20 rounded-full" />
      <div className="skeleton h-5 w-16 rounded-full" />
    </div>
    <div className="skeleton h-4 w-full rounded" />
    <div className="skeleton h-3 w-3/4 rounded" />
    <div className="skeleton h-2 w-full rounded-full mt-4" />
    <div className="flex justify-between mt-4">
      <div className="skeleton h-4 w-20 rounded" />
      <div className="skeleton h-4 w-16 rounded" />
    </div>
  </div>
);

// ── Page ───────────────────────────────────────────────────
export const MarketsPage: React.FC = () => {
  const { activeChain } = useChain();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory>(MarketCategory.ALL);
  const [sortBy, setSortBy] = useState<SortOption>(SortOption.HIGHEST_VOLUME);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(StatusFilter.ALL);
  const { markets, isLoading, error, refetch } = useMarkets();

  const debouncedSearch = useDebounce(searchQuery, 300);
  const { isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh: refetch,
    threshold: 80,
    enabled: true,
  });

  const displayMarkets: DisplayMarket[] = useMemo(() => {
    const mapped = markets.map((market) => {
      const category = getCategoryFromQuestion(market.question);
      const diff = market.endTime * 1000 - Date.now();
      let status: DisplayMarket['status'] = 'active';
      if (market.resolved) {
        status = 'closed';
      } else if (diff <= 0 || diff < 3 * 86_400_000) {
        status = 'ending_soon';
      }
      return {
        id: market.id,
        question: sanitizeMarketQuestion(market.question),
        category,
        totalStakes: market.totalStakes,
        outcomeStakes: market.outcomeStakes ?? [],
        outcomes: market.outcomes ?? [],
        endTime: market.endTime,
        resolved: market.resolved,
        winningOutcome: market.winningOutcome ?? 0,
        status,
        isTrending: false,
      };
    });

    // Mark top-3 active markets by volume as trending
    const activeByVolume = [...mapped]
      .filter((m) => m.status === 'active' && m.totalStakes > 0)
      .sort((a, b) => b.totalStakes - a.totalStakes)
      .slice(0, 3)
      .map((m) => m.id);

    return mapped.map((m) => ({ ...m, isTrending: activeByVolume.includes(m.id) }));
  }, [markets]);

  const filteredMarkets = useMemo(() => {
    const filtered = displayMarkets.filter((m) => {
      const matchSearch = m.question.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchCat = selectedCategory === MarketCategory.ALL || m.category === selectedCategory;
      const matchStatus =
        statusFilter === StatusFilter.ALL ||
        (statusFilter === StatusFilter.ACTIVE && m.status === 'active') ||
        (statusFilter === StatusFilter.RESOLVED && m.status === 'closed') ||
        (statusFilter === StatusFilter.ENDING_SOON && m.status === 'ending_soon');
      return matchSearch && matchCat && matchStatus;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case SortOption.TRENDING:
          // Trending: active + hot first, then by volume
          if (a.isTrending !== b.isTrending) return a.isTrending ? -1 : 1;
          return b.totalStakes - a.totalStakes;
        case SortOption.NEWEST: return b.id - a.id;
        case SortOption.ENDING_SOON: return a.endTime - b.endTime;
        case SortOption.HIGHEST_VOLUME:
        case SortOption.MOST_POPULAR:
        default: return b.totalStakes - a.totalStakes;
      }
    });
  }, [displayMarkets, debouncedSearch, selectedCategory, statusFilter, sortBy]);

  const categoryCounts = useMemo(() => {
    const counts: Record<MarketCategory, number> = Object.values(MarketCategory).reduce(
      (acc, k) => ({ ...acc, [k]: 0 }),
      {} as Record<MarketCategory, number>
    );
    counts[MarketCategory.ALL] = displayMarkets.length;
    displayMarkets.forEach((m) => { counts[m.category]++; });
    return counts;
  }, [displayMarkets]);

  // Aggregate stats
  const totalVolume = useMemo(
    () => displayMarkets.reduce((s, m) => s + m.totalStakes, 0),
    [displayMarkets]
  );
  const activeCount = useMemo(
    () => displayMarkets.filter((m) => m.status === 'active').length,
    [displayMarkets]
  );
  const endingSoonCount = useMemo(
    () => displayMarkets.filter((m) => m.status === 'ending_soon').length,
    [displayMarkets]
  );

  return (
    <div className="min-h-screen bg-[#080B18] text-white selection:bg-primary-500/30">
      <PullToRefresh isRefreshing={isRefreshing} pullDistance={pullDistance} />

      <Container className="py-10 space-y-8">

        {/* ── Page Header ─────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-2">
              {activeChain === 'aptos' ? 'Aptos' : 'Sui'} Network
            </p>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Prediction Markets
            </h1>
          </div>
          <Button variant="primary" size="md" to="/create" className="self-start md:self-auto rounded-xl">
            + Create Market
          </Button>
        </div>

        {/* ── Stats strip ─────────────────────────────────── */}
        {!isLoading && displayMarkets.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-[#1C2537] bg-[#0D1224] px-4 py-3">
              <div className="p-2 rounded-lg bg-primary-500/10">
                <FiActivity className="w-4 h-4 text-primary-400" />
              </div>
              <div>
                <div className="text-lg font-black text-white">{activeCount}</div>
                <div className="text-[11px] text-slate-500 font-medium">Active</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[#1C2537] bg-[#0D1224] px-4 py-3">
              <div className="p-2 rounded-lg bg-warning-500/10">
                <FiClock className="w-4 h-4 text-warning-400" />
              </div>
              <div>
                <div className="text-lg font-black text-white">{endingSoonCount}</div>
                <div className="text-[11px] text-slate-500 font-medium">Ending Soon</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[#1C2537] bg-[#0D1224] px-4 py-3">
              <div className="p-2 rounded-lg bg-success-500/10">
                <FiTrendingUp className="w-4 h-4 text-success-400" />
              </div>
              <div>
                <div className="text-lg font-black text-white">{formatVolume(totalVolume)}</div>
                <div className="text-[11px] text-slate-500 font-medium">Total Volume</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Category Filter ──────────────────────────────── */}
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          marketCounts={categoryCounts}
        />

        {/* ── Search + Sort ────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search markets…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#1C2537] bg-[#0D1224] text-sm text-slate-100 placeholder-slate-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Advanced filters (sort + status) */}
          <AdvancedFilters
            searchQuery=""
            onSearchChange={() => {}}
            sortBy={sortBy}
            onSortChange={setSortBy}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            totalResults={filteredMarkets.length}
          />
        </div>

        {/* ── Results count ────────────────────────────────── */}
        {!isLoading && (
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              {filteredMarkets.length}{' '}
              {filteredMarkets.length === 1 ? 'market' : 'markets'}
              {debouncedSearch && ` matching "${debouncedSearch}"`}
            </span>
            <button
              onClick={refetch}
              className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors"
            >
              Refresh
            </button>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────── */}
        {error && (
          <div className="rounded-xl border border-error-500/30 bg-error-500/[0.08] text-error-300 p-4 text-sm">
            {error.message}
          </div>
        )}

        {/* ── Grid ────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <MarketSkeleton key={i} />
            ))}
          </div>
        ) : filteredMarkets.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMarkets.map((market, index) => (
              <MarketCard key={market.id} market={market} index={index} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-white mb-2">No markets found</h3>
            <p className="text-slate-500 max-w-sm mb-6">
              Try adjusting your search or filters to discover more prediction markets.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(MarketCategory.ALL);
                setStatusFilter(StatusFilter.ALL);
              }}
              className="text-primary-400 border border-primary-500/30 hover:bg-primary-500/10"
            >
              Clear all filters
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
};

export default MarketsPage;

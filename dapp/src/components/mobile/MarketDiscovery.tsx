import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiFilter, FiTrendingUp, FiClock, FiDollarSign, FiX } from 'react-icons/fi';
// Legacy Move-based Market type for mobile components
interface Market {
  id: number;
  question: string;
  outcomes: string[];
  endTime: number;
  resolved: boolean;
  winningOutcome: number;
  totalStakes: number;
  outcomeStakes: number[];
}
import { MobileMarketCard } from './MobileMarketCard';

interface MarketDiscoveryProps {
  markets: Market[];
}

type SortOption = 'trending' | 'volume' | 'ending_soon' | 'newest';
type FilterCategory = 'all' | 'active' | 'resolved' | 'ending_soon';

const SORT_OPTIONS: { value: SortOption; label: string; icon: typeof FiTrendingUp }[] = [
  { value: 'trending', label: 'Trending', icon: FiTrendingUp },
  { value: 'volume', label: 'Volume', icon: FiDollarSign },
  { value: 'ending_soon', label: 'Ending Soon', icon: FiClock },
  { value: 'newest', label: 'Newest', icon: FiClock },
];

const FILTER_CATEGORIES: { value: FilterCategory; label: string }[] = [
  { value: 'all', label: 'All Markets' },
  { value: 'active', label: 'Active' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'ending_soon', label: 'Ending Soon' },
];

export function MarketDiscovery({ markets }: MarketDiscoveryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('trending');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Calculate trending score for each market
  const calculateTrendingScore = (market: Market) => {
    const now = Date.now();
    const timeLeft = market.endTime - now;
    const volumeScore = market.totalStakes / 1000000; // Normalize volume
    const recencyBonus = timeLeft > 0 ? 1 : 0.1; // Boost active markets
    const activityScore = market.outcomeStakes.reduce((sum, stake) => sum + stake, 0) / 1000000;

    return volumeScore * recencyBonus + activityScore * 0.5;
  };

  // Filter and sort markets
  const filteredMarkets = useMemo(() => {
    let filtered = [...markets];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((market) =>
        market.question.toLowerCase().includes(query) ||
        market.outcomes.some((outcome) => outcome.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    const now = Date.now();
    switch (filterCategory) {
      case 'active':
        filtered = filtered.filter((market) => !market.resolved && market.endTime > now);
        break;
      case 'resolved':
        filtered = filtered.filter((market) => market.resolved);
        break;
      case 'ending_soon':
        const twentyFourHours = 24 * 60 * 60 * 1000;
        filtered = filtered.filter(
          (market) => !market.resolved && market.endTime > now && market.endTime - now < twentyFourHours
        );
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'trending':
        filtered.sort((a, b) => calculateTrendingScore(b) - calculateTrendingScore(a));
        break;
      case 'volume':
        filtered.sort((a, b) => b.totalStakes - a.totalStakes);
        break;
      case 'ending_soon':
        filtered = filtered.filter((market) => !market.resolved);
        filtered.sort((a, b) => a.endTime - b.endTime);
        break;
      case 'newest':
        filtered.sort((a, b) => b.id - a.id);
        break;
    }

    return filtered;
  }, [markets, searchQuery, filterCategory, sortBy]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="sticky top-0 z-10 bg-[#080B18]/95 backdrop-blur-xl pb-4">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-4 text-base
              bg-white/[0.06]
              border border-white/[0.08]
              focus:border-primary-500
              rounded-2xl outline-none transition-colors
              text-white
              placeholder-slate-600"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/[0.1] rounded-full transition-colors"
            >
              <FiX className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>

        {/* Filter Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFilters(!showFilters)}
          className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
            showFilters
              ? 'bg-primary-500 text-white'
              : 'bg-white/[0.06] text-slate-300'
          }`}
        >
          <FiFilter className="w-4 h-4" />
          <span>Filters & Sort</span>
        </motion.button>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 pb-4 border-b border-white/[0.06]"
          >
            {/* Sort Options */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                Sort By
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SORT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = sortBy === option.value;

                  return (
                    <motion.button
                      key={option.value}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSortBy(option.value)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-primary-500 to-secondary-600 text-white'
                          : 'bg-white/[0.06] text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{option.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Category Filters */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FILTER_CATEGORIES.map((category) => {
                  const isSelected = filterCategory === category.value;

                  return (
                    <motion.button
                      key={category.value}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFilterCategory(category.value)}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-secondary-500 to-primary-500 text-white'
                          : 'bg-white/[0.06] text-slate-300'
                      }`}
                    >
                      <span className="text-sm">{category.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          {filteredMarkets.length} {filteredMarkets.length === 1 ? 'market' : 'markets'} found
        </span>
        {(searchQuery || filterCategory !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterCategory('all');
            }}
            className="text-primary-400 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Market Grid */}
      <div className="space-y-4">
        {filteredMarkets.length > 0 ? (
          filteredMarkets.map((market) => (
            <MobileMarketCard key={market.id} market={market} />
          ))
        ) : (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-white/[0.06] rounded-full flex items-center justify-center mx-auto mb-4">
              <FiSearch className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No markets found
            </h3>
            <p className="text-slate-400 mb-4">
              Try adjusting your search or filters
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('all');
              }}
              className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium"
            >
              Clear all filters
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MarketDiscovery;

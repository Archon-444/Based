import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiFilter,
  FiChevronDown,
  FiTrendingUp,
  FiClock,
  FiDollarSign,
  FiX,
} from 'react-icons/fi';

export enum SortOption {
  TRENDING = 'trending',
  NEWEST = 'newest',
  ENDING_SOON = 'ending_soon',
  HIGHEST_VOLUME = 'highest_volume',
  MOST_POPULAR = 'most_popular',
}

export enum StatusFilter {
  ALL = 'all',
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  ENDING_SOON = 'ending_soon',
}

interface AdvancedFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  statusFilter: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  totalResults?: number;
}

const SORT_OPTIONS = [
  { value: SortOption.TRENDING, label: 'Trending 🔥', icon: FiTrendingUp },
  { value: SortOption.NEWEST, label: 'Newest', icon: FiClock },
  { value: SortOption.ENDING_SOON, label: 'Ending Soon', icon: FiClock },
  { value: SortOption.HIGHEST_VOLUME, label: 'Highest Volume', icon: FiDollarSign },
  { value: SortOption.MOST_POPULAR, label: 'Most Popular', icon: FiTrendingUp },
];

const STATUS_OPTIONS = [
  { value: StatusFilter.ALL, label: 'All' },
  { value: StatusFilter.ACTIVE, label: 'Active' },
  { value: StatusFilter.RESOLVED, label: 'Resolved' },
  { value: StatusFilter.ENDING_SOON, label: 'Ending Soon' },
];

const DropdownMenu: React.FC<{
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ open, onClose, children }) => (
  <AnimatePresence>
    {open && (
      <>
        <div className="fixed inset-0 z-10" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="absolute top-full mt-1.5 left-0 min-w-[160px] rounded-xl border border-[#1C2537] bg-[#0D1224] shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-20 overflow-hidden py-1"
        >
          {children}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  sortBy,
  onSortChange,
  statusFilter,
  onStatusChange,
  totalResults = 0,
}) => {
  const [showSort, setShowSort] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const selectedSort = SORT_OPTIONS.find((o) => o.value === sortBy);
  const selectedStatus = STATUS_OPTIONS.find((o) => o.value === statusFilter);

  const btnBase =
    'flex items-center gap-2 rounded-xl border border-[#1C2537] bg-[#0D1224] px-3.5 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:border-white/20 hover:bg-white/[0.05] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500';

  const menuItem = (active: boolean) =>
    `w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 transition-colors ${
      active
        ? 'bg-primary-500/10 text-primary-300 font-semibold'
        : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
    }`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Status dropdown */}
      <div className="relative">
        <button
          onClick={() => { setShowStatus(!showStatus); setShowSort(false); }}
          aria-expanded={showStatus}
          className={btnBase}
        >
          <FiFilter className="w-3.5 h-3.5 text-slate-500" />
          <span>{selectedStatus?.label}</span>
          <FiChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showStatus ? 'rotate-180' : ''}`} />
        </button>
        <DropdownMenu open={showStatus} onClose={() => setShowStatus(false)}>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onStatusChange(opt.value); setShowStatus(false); }}
              className={menuItem(statusFilter === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </DropdownMenu>
      </div>

      {/* Sort dropdown */}
      <div className="relative">
        <button
          onClick={() => { setShowSort(!showSort); setShowStatus(false); }}
          aria-expanded={showSort}
          className={btnBase}
        >
          {selectedSort && <selectedSort.icon className="w-3.5 h-3.5 text-slate-500" />}
          <span>{selectedSort?.label}</span>
          <FiChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showSort ? 'rotate-180' : ''}`} />
        </button>
        <DropdownMenu open={showSort} onClose={() => setShowSort(false)}>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onSortChange(opt.value); setShowSort(false); }}
              className={menuItem(sortBy === opt.value)}
            >
              <opt.icon className="w-3.5 h-3.5" />
              {opt.label}
            </button>
          ))}
        </DropdownMenu>
      </div>

      {/* Active filter tags */}
      {statusFilter !== StatusFilter.ALL && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/25 text-xs font-semibold text-primary-300">
          {selectedStatus?.label}
          <button
            onClick={() => onStatusChange(StatusFilter.ALL)}
            className="hover:text-primary-100 transition-colors"
            aria-label="Clear status filter"
          >
            <FiX className="w-3 h-3" />
          </button>
        </span>
      )}
    </div>
  );
};

export default AdvancedFilters;

import React from 'react';
import { motion } from 'framer-motion';
import { MarketCategory, CATEGORY_INFO } from '../types/categories';

interface CategoryFilterProps {
  selectedCategory: MarketCategory;
  onCategoryChange: (category: MarketCategory) => void;
  marketCounts?: Record<MarketCategory, number>;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
  marketCounts = {},
}) => {
  const categories = Object.values(MarketCategory);

  return (
    <div className="w-full overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
      <div className="flex gap-2 min-w-max md:flex-wrap md:min-w-0 pb-1">
        {categories.map((category) => {
          const info = CATEGORY_INFO[category];
          const isSelected = selectedCategory === category;
          const count = marketCounts[category] ?? 0;

          return (
            <motion.div key={category} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <button
                onClick={() => onCategoryChange(category)}
                aria-label={`Filter by ${info.label}`}
                aria-pressed={isSelected}
                className={[
                  'relative flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                  isSelected
                    ? 'bg-primary-500/15 text-primary-300 border border-primary-500/30 shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                    : 'bg-white/[0.04] text-slate-400 border border-white/[0.07] hover:bg-white/[0.07] hover:text-slate-200 hover:border-white/[0.12]',
                ].join(' ')}
              >
                <span className="text-base leading-none" aria-label={info.label}>
                  <info.icon className="w-4 h-4" />
                </span>
                <span className="whitespace-nowrap">{info.label}</span>
                {count > 0 && (
                  <span
                    className={[
                      'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                      isSelected
                        ? 'bg-primary-500/25 text-primary-300'
                        : 'bg-white/[0.08] text-slate-500',
                    ].join(' ')}
                  >
                    {count}
                  </span>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryFilter;

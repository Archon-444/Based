import type { ComponentType } from 'react';
import {
  FiGrid,
  FiDollarSign,
  FiTarget,
  FiFlag,
  FiFilm,
  FiCpu,
  FiZap,
  FiTrendingUp,
  FiCloud,
  FiHelpCircle,
  FiClipboard,
} from 'react-icons/fi';

export enum MarketCategory {
  ALL = 'all',
  CRYPTO = 'crypto',
  SPORTS = 'sports',
  POLITICS = 'politics',
  ENTERTAINMENT = 'entertainment',
  TECHNOLOGY = 'technology',
  SCIENCE = 'science',
  BUSINESS = 'business',
  WEATHER = 'weather',
  OTHER = 'other',
}

export interface CategoryInfo {
  id: MarketCategory;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

export const CATEGORY_INFO: Record<MarketCategory, CategoryInfo> = {
  [MarketCategory.ALL]: {
    id: MarketCategory.ALL,
    label: 'All Markets',
    description: 'Browse all prediction markets',
    icon: FiGrid,
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
  [MarketCategory.CRYPTO]: {
    id: MarketCategory.CRYPTO,
    label: 'Crypto',
    description: 'Cryptocurrency and blockchain predictions',
    icon: FiDollarSign,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  [MarketCategory.SPORTS]: {
    id: MarketCategory.SPORTS,
    label: 'Sports',
    description: 'Sports events and competitions',
    icon: FiTarget,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  [MarketCategory.POLITICS]: {
    id: MarketCategory.POLITICS,
    label: 'Politics',
    description: 'Political events and elections',
    icon: FiFlag,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  [MarketCategory.ENTERTAINMENT]: {
    id: MarketCategory.ENTERTAINMENT,
    label: 'Entertainment',
    description: 'Movies, music, and pop culture',
    icon: FiFilm,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  [MarketCategory.TECHNOLOGY]: {
    id: MarketCategory.TECHNOLOGY,
    label: 'Technology',
    description: 'Tech trends and innovations',
    icon: FiCpu,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
  [MarketCategory.SCIENCE]: {
    id: MarketCategory.SCIENCE,
    label: 'Science',
    description: 'Scientific discoveries and research',
    icon: FiZap,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  [MarketCategory.BUSINESS]: {
    id: MarketCategory.BUSINESS,
    label: 'Business',
    description: 'Company performance and market trends',
    icon: FiTrendingUp,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  [MarketCategory.WEATHER]: {
    id: MarketCategory.WEATHER,
    label: 'Weather',
    description: 'Weather events and climate predictions',
    icon: FiCloud,
    color: 'text-sky-600 dark:text-sky-400',
    bgColor: 'bg-sky-100 dark:bg-sky-900/30',
  },
  [MarketCategory.OTHER]: {
    id: MarketCategory.OTHER,
    label: 'Other',
    description: 'Miscellaneous predictions',
    icon: FiHelpCircle,
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-900/30',
  },
};

export const CREATE_CATEGORY_OPTIONS = [
  { value: 'general', label: 'General', icon: FiClipboard },
  { value: 'crypto', label: 'Cryptocurrency', icon: FiDollarSign },
  { value: 'sports', label: 'Sports', icon: FiTarget },
  { value: 'politics', label: 'Politics', icon: FiFlag },
  { value: 'technology', label: 'Technology', icon: FiCpu },
  { value: 'entertainment', label: 'Entertainment', icon: FiFilm },
  { value: 'science', label: 'Science', icon: FiZap },
] as const;

export function getCategoryFromQuestion(question: string): MarketCategory {
  const lowerQuestion = question.toLowerCase();

  // Crypto keywords
  if (
    /\b(bitcoin|btc|ethereum|eth|crypto|blockchain|defi|nft|token|coin|ape|doge)\b/i.test(
      lowerQuestion
    )
  ) {
    return MarketCategory.CRYPTO;
  }

  // Sports keywords
  if (
    /\b(football|soccer|basketball|baseball|tennis|nfl|nba|fifa|world cup|olympics|championship|game|match|team|player)\b/i.test(
      lowerQuestion
    )
  ) {
    return MarketCategory.SPORTS;
  }

  // Politics keywords
  if (
    /\b(election|president|vote|congress|senate|government|policy|law|republican|democrat|political)\b/i.test(
      lowerQuestion
    )
  ) {
    return MarketCategory.POLITICS;
  }

  // Entertainment keywords
  if (
    /\b(movie|film|oscar|grammy|emmy|album|song|actor|actress|artist|netflix|disney|marvel)\b/i.test(
      lowerQuestion
    )
  ) {
    return MarketCategory.ENTERTAINMENT;
  }

  // Technology keywords
  if (
    /\b(apple|google|microsoft|tesla|ai|robot|tech|software|app|iphone|android|meta|twitter)\b/i.test(
      lowerQuestion
    )
  ) {
    return MarketCategory.TECHNOLOGY;
  }

  // Science keywords
  if (
    /\b(science|research|study|discovery|experiment|space|nasa|mars|vaccine|cure|climate)\b/i.test(
      lowerQuestion
    )
  ) {
    return MarketCategory.SCIENCE;
  }

  // Business keywords
  if (
    /\b(stock|market|company|revenue|profit|ipo|earnings|business|economy|gdp|inflation)\b/i.test(
      lowerQuestion
    )
  ) {
    return MarketCategory.BUSINESS;
  }

  // Weather keywords
  if (
    /\b(weather|rain|snow|temperature|hurricane|storm|forecast|climate|drought|flood)\b/i.test(
      lowerQuestion
    )
  ) {
    return MarketCategory.WEATHER;
  }

  return MarketCategory.OTHER;
}

export function getCategoryInfo(category: MarketCategory): CategoryInfo {
  return CATEGORY_INFO[category] || CATEGORY_INFO[MarketCategory.OTHER];
}

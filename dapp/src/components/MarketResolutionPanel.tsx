import React, { useMemo } from 'react';
import { FiActivity, FiAlertCircle, FiClock, FiDatabase, FiTrendingUp } from 'react-icons/fi';
import { Card, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Badge, BadgeVariant } from './ui/Badge';
import { useMarketResolution } from '../hooks/useMarketResolution';

interface MarketResolutionPanelProps {
  marketId: string | number | null;
}

const SOURCE_LABELS: Record<number, { label: string; variant: BadgeVariant }> = {
  0: { label: 'Manual', variant: 'neutral' },
  1: { label: 'Pyth Oracle', variant: 'primary' },
  2: { label: 'Optimistic', variant: 'info' },
};

const STRATEGY_LABELS: Record<number, string> = {
  0: 'Pyth only',
  1: 'Pyth with optimistic fallback',
  2: 'Optimistic only',
};

const formatTimestamp = (timestamp: number): string => {
  if (!timestamp) {
    return '—';
  }
  return new Date(timestamp * 1000).toLocaleString();
};

const addThousandsSeparator = (value: string): string =>
  value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const trimTrailingZeros = (value: string): string => value.replace(/\.?0+$/, '');

const formatBigDecimal = (
  magnitude: bigint,
  isNegative: boolean,
  exponent: number,
  exponentNegative: boolean,
  maxFractionDigits = 6
): string => {
  if (magnitude === 0n) {
    return '0';
  }

  const sign = isNegative ? '-' : '';
  const digits = magnitude.toString();

  if (!exponentNegative || exponent === 0) {
    const integer = exponent === 0 ? digits : `${digits}${'0'.repeat(exponent)}`;
    return `${sign}${addThousandsSeparator(integer)}`;
  }

  const decimalPlaces = exponent;
  const padded = digits.padStart(decimalPlaces + 1, '0'); // ensure at least one integer digit
  const splitIndex = padded.length - decimalPlaces;
  const integerPartRaw = padded.slice(0, splitIndex).replace(/^0+(?=\d)/, '');
  const integerPart = integerPartRaw.length > 0 ? integerPartRaw : '0';
  let fractionPart = padded.slice(splitIndex);

  if (fractionPart.length > maxFractionDigits) {
    fractionPart = fractionPart.slice(0, maxFractionDigits);
  }

  fractionPart = trimTrailingZeros(fractionPart);

  const formattedInteger = addThousandsSeparator(integerPart);
  return fractionPart.length > 0
    ? `${sign}${formattedInteger}.${fractionPart}`
    : `${sign}${formattedInteger}`;
};

const formatConfidence = (
  confidence: bigint,
  exponent: number,
  exponentNegative: boolean
): string => {
  if (confidence === 0n) {
    return '±0';
  }
  const value = formatBigDecimal(confidence, false, exponent, exponentNegative);
  return `±${value}`;
};

export const MarketResolutionPanel: React.FC<MarketResolutionPanelProps> = ({ marketId }) => {
  const { metadata, price, isLoading, error } = useMarketResolution(marketId);

  const sourceMeta = useMemo(() => {
    if (!metadata) {
      return { label: 'Unknown', variant: 'neutral' as const };
    }
    return (
      SOURCE_LABELS[metadata.source] ?? {
        label: `Source ${metadata.source}`,
        variant: 'neutral' as const,
      }
    );
  }, [metadata]);

  const strategyLabel = metadata ? STRATEGY_LABELS[metadata.strategy] ?? `Strategy ${metadata.strategy}` : 'Unknown';

  const formattedPrice = useMemo(() => {
    if (!price?.hasSnapshot) {
      return null;
    }
    const display = formatBigDecimal(price.price, price.priceNegative, price.expo, price.expoNegative);
    const confidence = formatConfidence(price.confidence, price.expo, price.expoNegative);
    return { display, confidence };
  }, [price]);

  return (
    <Card padding="lg" className="space-y-4">
      <CardHeader className="mb-0 pb-3">
        <CardTitle className="flex items-center gap-2">
          <FiActivity className="w-5 h-5 text-primary-500" />
          Oracle Resolution
        </CardTitle>
        <CardDescription>
          Live status of automated resolution flows and the latest cached Pyth price snapshot.
        </CardDescription>
      </CardHeader>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-white/[0.06] rounded w-1/3" />
          <div className="h-4 bg-white/[0.06] rounded w-2/3" />
          <div className="h-4 bg-white/[0.06] rounded w-1/2" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 p-4 bg-error-100 border border-error-200 text-error-800 rounded-lg">
          <FiAlertCircle className="w-5 h-5 mt-1 flex-shrink-0" />
          <div>
            <p className="font-semibold">Unable to load oracle data</p>
            <p className="text-sm opacity-80">{error.message}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                Resolution Path
              </h4>
              <div className="flex items-center gap-2">
                <Badge
                  variant={sourceMeta.variant}
                  title="Final data source used to settle this market"
                >
                  {sourceMeta.label}
                </Badge>
                <Badge
                  variant="info"
                  title="Configured resolution flow the market will attempt before falling back"
                >
                  {strategyLabel}
                </Badge>
              </div>
              {metadata?.resolved ? (
                <p className="text-sm text-success-400 flex items-center gap-2">
                  <FiActivity className="w-4 h-4" />
                  Resolved · winning outcome #{metadata.winningOutcome}
                </p>
              ) : (
                <p className="text-sm text-slate-400 flex items-center gap-2">
                  <FiClock className="w-4 h-4" />
                  Awaiting resolution
                </p>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                Latest Pyth Price
              </h4>
              {price?.hasSnapshot && formattedPrice ? (
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-white flex items-center gap-2">
                    <FiTrendingUp className="w-5 h-5 text-primary-500" />
                    {formattedPrice.display}
                  </p>
                  <p className="text-sm text-slate-400">
                    Confidence interval {formattedPrice.confidence}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <FiDatabase className="w-3 h-3" />
                      Publish: {formatTimestamp(price.publishTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      Cached: {formatTimestamp(price.receivedAt)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  No verified Pyth snapshot cached yet. The market will fall back to optimistic resolution if data remains stale.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default MarketResolutionPanel;

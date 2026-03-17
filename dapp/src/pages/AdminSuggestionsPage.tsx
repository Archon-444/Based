import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  FiThumbsUp,
  FiCheck,
  FiX,
  FiExternalLink,
  FiRefreshCw,
  FiChevronDown,
  FiClock,
  FiAlertCircle,
} from 'react-icons/fi';
import { useUnifiedWallet } from '../hooks/useUnifiedWallet';
import toast from '../components/ui/Toast';
import {
  MarketSuggestion,
  MarketSuggestionStatus,
  SuggestionEvent,
  fetchMarketSuggestions,
  fetchSuggestionEvents,
  reviewMarketSuggestion,
  voteOnSuggestion,
} from '../services/suggestionsApi';
import { useHasMarketCreatorRole, useIsAdmin } from '../hooks/useRoles';
import { useCreateMarket } from '../hooks/useTransactions';
import { useChain } from '../contexts/ChainContext';
import { Container } from '../components/layout/Container';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_TABS: { value: MarketSuggestionStatus | 'all'; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'published', label: 'Published' },
  { value: 'all', label: 'All' },
];

const STATUS_STYLES: Record<MarketSuggestionStatus, { pill: string; dot: string }> = {
  pending:   { pill: 'bg-warning-500/15 text-warning-300 border-warning-500/25',  dot: 'bg-warning-400' },
  approved:  { pill: 'bg-success-500/15 text-success-300 border-success-500/25',  dot: 'bg-success-400' },
  rejected:  { pill: 'bg-error-500/15 text-error-300 border-error-500/25',        dot: 'bg-error-400'   },
  published: { pill: 'bg-primary-500/15 text-primary-300 border-primary-500/25', dot: 'bg-primary-400' },
};

const CHAIN_STYLES: Record<string, string> = {
  aptos:    'bg-primary-500/15 text-primary-200 border-primary-500/20',
  sui:      'bg-secondary-500/15 text-secondary-200 border-secondary-500/20',
  movement: 'bg-white/[0.07] text-slate-300 border-white/10',
  base:     'bg-blue-500/15 text-blue-200 border-blue-500/20',
};

const CHAIN_LABELS: Record<string, string> = {
  aptos: 'Aptos (legacy)', sui: 'Sui (legacy)', movement: 'Movement (legacy)', base: 'Base',
};

const explorerUrl = (chain: string, txHash: string): string =>
  chain === 'base'
    ? `https://basescan.org/tx/${txHash}`
    : chain === 'sui'
    ? `https://explorer.sui.io/txblock/${txHash}?network=testnet`
    : `https://explorer.aptoslabs.com/txn/${txHash}?network=devnet`;

// ── Skeleton ───────────────────────────────────────────────────────────────────

const CardSkeleton = () => (
  <div className="rounded-2xl border border-[#1C2537] bg-[#0D1224] p-6 space-y-4"
    style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
    <div className="flex gap-2">
      <div className="skeleton h-5 w-24 rounded-full" />
      <div className="skeleton h-5 w-16 rounded-full" />
    </div>
    <div className="skeleton h-6 w-3/4 rounded-xl" />
    <div className="skeleton h-4 w-1/3 rounded-xl" />
    <div className="grid grid-cols-2 gap-3">
      <div className="skeleton h-20 rounded-xl" />
      <div className="skeleton h-20 rounded-xl" />
    </div>
  </div>
);

// ── Suggestion Card ────────────────────────────────────────────────────────────

interface SuggestionCardProps {
  suggestion: MarketSuggestion;
  events: SuggestionEvent[];
  activeChain: string;
  isCreatorMode: boolean;
  isVoting: boolean;
  isActing: boolean;
  rejectingId: string | null;
  rejectReason: string;
  onVote: (suggestion: MarketSuggestion) => void;
  onApprove: (suggestion: MarketSuggestion, publish: boolean) => void;
  onRejectClick: (id: string) => void;
  onRejectReasonChange: (v: string) => void;
  onRejectConfirm: (suggestion: MarketSuggestion) => void;
  onRejectCancel: () => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  events,
  activeChain,
  isCreatorMode,
  isVoting,
  isActing,
  rejectingId,
  rejectReason,
  onVote,
  onApprove,
  onRejectClick,
  onRejectReasonChange,
  onRejectConfirm,
  onRejectCancel,
}) => {
  const [timelineOpen, setTimelineOpen] = useState(false);
  const cardEvents = events.filter((e) => e.suggestionId === suggestion.id);
  const isRejecting = rejectingId === suggestion.id;
  const statusStyle = STATUS_STYLES[suggestion.status];
  const chainStyle = CHAIN_STYLES[suggestion.chain];
  const wrongChain = suggestion.chain !== activeChain;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-[#1C2537] bg-[#0D1224] overflow-hidden"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)' }}
    >
      <div className="p-6">
        {/* ── Header row ──────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
            {suggestion.status.charAt(0).toUpperCase() + suggestion.status.slice(1)}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${chainStyle}`}>
            {CHAIN_LABELS[suggestion.chain]}
          </span>
          <span className="ml-auto text-xs text-slate-600 font-mono">
            {suggestion.id.slice(0, 8)}…
          </span>
        </div>

        {/* ── Question ─────────────────────────────────────────────── */}
        <h2 className="text-lg font-bold text-white leading-snug mb-1">
          {suggestion.question}
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Submitted by{' '}
          <span className="font-mono text-slate-400">
            {suggestion.proposer.slice(0, 8)}…{suggestion.proposer.slice(-4)}
          </span>{' '}
          · {format(new Date(suggestion.createdAt), 'MMM d, yyyy HH:mm')}
        </p>

        {/* ── Cross-chain warning ───────────────────────────────────── */}
        {wrongChain && suggestion.status === 'pending' && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-warning-500/25 bg-warning-500/[0.07] px-4 py-2.5 text-xs text-warning-300">
            <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            Switch to {CHAIN_LABELS[suggestion.chain]} to publish this market on-chain.
          </div>
        )}

        {/* ── Details grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {/* Outcomes */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
              Outcomes ({suggestion.outcomes.length})
            </div>
            <div className="space-y-1.5">
              {suggestion.outcomes.map((outcome, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-white">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/[0.07] border border-white/[0.08] flex items-center justify-center text-[10px] font-bold text-slate-400">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {outcome}
                </div>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2.5">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Category</div>
              <span className="inline-flex items-center rounded-lg bg-primary-500/10 text-primary-200 px-2 py-0.5 text-xs font-semibold capitalize">
                {suggestion.category}
              </span>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Duration</div>
              <span className="text-sm text-slate-300">
                {suggestion.durationHours >= 24
                  ? `${Math.round(suggestion.durationHours / 24)} days`
                  : `${suggestion.durationHours}h`}
              </span>
            </div>
            {suggestion.resolutionSource && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Resolution</div>
                <p className="text-xs text-slate-400 break-all leading-relaxed">{suggestion.resolutionSource}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Reviewer note ────────────────────────────────────────── */}
        {suggestion.reviewReason && (
          <div className="mb-4 rounded-xl border border-error-500/20 bg-error-500/[0.06] px-4 py-3 text-sm text-error-200">
            <span className="font-semibold">Reviewer note: </span>{suggestion.reviewReason}
          </div>
        )}

        {/* ── Vote + actions ───────────────────────────────────────── */}
        {suggestion.status === 'pending' && (
          <div className="space-y-3">
            {/* Vote bar */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onVote(suggestion)}
                disabled={isVoting || isActing}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-success-500/40 hover:bg-success-500/[0.07] text-sm font-semibold text-slate-300 hover:text-success-300 transition-all disabled:opacity-40"
              >
                <FiThumbsUp className="w-3.5 h-3.5" />
                Upvote
              </button>
              <span className="text-sm font-bold text-white tabular-nums">
                {suggestion.votes ?? 0}
              </span>
              <span className="text-xs text-slate-600">vote{(suggestion.votes ?? 0) !== 1 ? 's' : ''}</span>
            </div>

            {/* Inline reject form */}
            <AnimatePresence>
              {isRejecting && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl border border-error-500/25 bg-error-500/[0.05] p-4 space-y-3">
                    <p className="text-sm font-semibold text-error-300">Rejection reason (optional)</p>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => onRejectReasonChange(e.target.value)}
                      rows={2}
                      placeholder="e.g. Ambiguous resolution criteria, duplicate market…"
                      className="w-full rounded-xl border border-[#1C2537] bg-[#080B18] px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:border-error-500/60 focus:ring-1 focus:ring-error-500/30 focus:outline-none resize-none transition-colors"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onRejectConfirm(suggestion)}
                        disabled={isActing}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-error-500 hover:bg-error-400 transition-colors disabled:opacity-50"
                      >
                        <FiX className="w-3.5 h-3.5" />
                        Confirm Rejection
                      </button>
                      <button
                        type="button"
                        onClick={onRejectCancel}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white border border-white/[0.07] hover:border-white/[0.15] bg-white/[0.02] transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            {!isRejecting && (
              <div className="flex flex-wrap gap-2">
                {isCreatorMode && (
                  <button
                    type="button"
                    onClick={() => onApprove(suggestion, true)}
                    disabled={isActing || wrongChain}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary-500 to-secondary-600 shadow-[0_0_16px_rgba(59,130,246,0.2)] hover:shadow-[0_0_24px_rgba(59,130,246,0.35)] transition-all disabled:opacity-40"
                  >
                    <FiCheck className="w-3.5 h-3.5" />
                    Approve & Publish
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onApprove(suggestion, false)}
                  disabled={isActing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-success-300 border border-success-500/30 bg-success-500/[0.07] hover:bg-success-500/[0.12] transition-all disabled:opacity-40"
                >
                  <FiCheck className="w-3.5 h-3.5" />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => onRejectClick(suggestion.id)}
                  disabled={isActing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-error-300 border border-error-500/25 bg-error-500/[0.06] hover:bg-error-500/[0.12] transition-all disabled:opacity-40"
                >
                  <FiX className="w-3.5 h-3.5" />
                  Reject
                </button>
              </div>
            )}
          </div>
        )}

        {/* Published tx link */}
        {suggestion.status !== 'pending' && suggestion.txHash && (
          <a
            href={explorerUrl(suggestion.chain, suggestion.txHash)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors mt-2"
          >
            <FiExternalLink className="w-3.5 h-3.5" />
            View transaction
          </a>
        )}
      </div>

      {/* ── Activity timeline (collapsible) ─────────────────────────── */}
      {cardEvents.length > 0 && (
        <div className="border-t border-white/[0.05]">
          <button
            type="button"
            onClick={() => setTimelineOpen((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-3 text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <FiClock className="w-3 h-3" />
              Activity ({cardEvents.length})
            </span>
            <FiChevronDown className={`w-3.5 h-3.5 transition-transform ${timelineOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {timelineOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-5 space-y-3">
                  {cardEvents
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                    .map((event, i) => (
                      <div key={event.id} className="flex items-start gap-3">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5" />
                          {i < cardEvents.length - 1 && <div className="w-px flex-1 bg-white/[0.06] mt-1 mb-[-4px]" style={{ minHeight: 12 }} />}
                        </div>
                        <div>
                          <p className="text-sm text-slate-300">
                            <span className="font-semibold capitalize">{event.type}</span>
                            {' '}by{' '}
                            <span className="font-mono text-xs text-slate-400">
                              {event.actor === 'community' ? 'Community' : `${event.actor.slice(0, 6)}…`}
                            </span>
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {format(new Date(event.timestamp), 'MMM d, HH:mm')}
                          </p>
                          {event.metadata?.reason && (
                            <p className="text-xs text-slate-500 mt-0.5 italic">"{event.metadata.reason}"</p>
                          )}
                          {event.metadata?.txHash && (
                            <a
                              href={`https://explorer.aptoslabs.com/txn/${event.metadata.txHash}?network=devnet`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary-400 hover:underline"
                            >
                              View tx
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────

const AdminSuggestionsPage: React.FC = () => {
  const { connected, address, publicKey, signMessage } = useUnifiedWallet();
  const { hasRole: isAdmin, loading: adminLoading } = useIsAdmin();
  const { hasRole: hasCreatorRole } = useHasMarketCreatorRole();
  const { createMarket, isLoading: creatingMarket } = useCreateMarket();
  const { activeChain } = useChain();

  const [suggestions, setSuggestions] = useState<MarketSuggestion[]>([]);
  const [statusFilter, setStatusFilter] = useState<MarketSuggestionStatus | 'all'>('pending');
  const [isFetching, setIsFetching] = useState(false);
  const [events, setEvents] = useState<SuggestionEvent[]>([]);

  // Inline reject state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Per-card action loading
  const [votingId, setVotingId] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const canModerate = connected && (isAdmin || hasCreatorRole);
  const isCreatorMode = hasCreatorRole;

  const filteredSuggestions = useMemo(() => {
    if (statusFilter === 'all') return suggestions;
    return suggestions.filter((s) => s.status === statusFilter);
  }, [suggestions, statusFilter]);

  const pendingCount = useMemo(
    () => suggestions.filter((s) => s.status === 'pending').length,
    [suggestions]
  );

  const refreshSuggestions = useCallback(async () => {
    try {
      setIsFetching(true);
      const results = await fetchMarketSuggestions(
        statusFilter === 'all' ? undefined : statusFilter,
        activeChain
      );
      setSuggestions(results);

      if (address && publicKey && signMessage) {
        const eventResponses = await Promise.all(
          results.map(async (item) => {
            try {
              return await fetchSuggestionEvents(
                { address, publicKey, chain: activeChain, signMessage },
                item.id,
                activeChain
              );
            } catch {
              return [];
            }
          })
        );
        setEvents(eventResponses.flat());
      } else {
        setEvents([]);
      }
    } catch (error: any) {
      toast.error(error?.message ?? 'Unable to load suggestions');
    } finally {
      setIsFetching(false);
    }
  }, [statusFilter, address, activeChain, publicKey, signMessage]);

  useEffect(() => { refreshSuggestions(); }, [refreshSuggestions]);

  const updateSuggestionLocally = (updated: MarketSuggestion) => {
    setSuggestions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    if (!address || !publicKey || !signMessage) return;
    fetchSuggestionEvents({ address, publicKey, chain: activeChain, signMessage }, updated.id, activeChain)
      .then((history) => {
        setEvents((prev) => [...prev.filter((e) => e.suggestionId !== updated.id), ...history]);
      })
      .catch(() => {});
  };

  const handleVote = async (suggestion: MarketSuggestion) => {
    if (!address || !publicKey || !signMessage) { toast.error('Wallet not connected'); return; }
    setVotingId(suggestion.id);
    try {
      const updated = await voteOnSuggestion(
        { address, publicKey, chain: activeChain, signMessage },
        suggestion.id, 1, activeChain
      );
      if (updated) updateSuggestionLocally(updated);
    } catch (err: any) {
      toast.error(err?.message ?? 'Unable to record vote');
    } finally {
      setVotingId(null);
    }
  };

  const handleApprove = async (suggestion: MarketSuggestion, publishOnchain: boolean) => {
    if (!address || !publicKey || !signMessage) { toast.error('Wallet not connected'); return; }
    if (publishOnchain && activeChain !== suggestion.chain) {
      toast.error(`Switch to the ${suggestion.chain.toUpperCase()} network to publish on-chain.`);
      return;
    }
    setActingId(suggestion.id);
    try {
      let txHash: string | undefined;
      if (publishOnchain) {
        const hash = await createMarket(suggestion.question, suggestion.outcomes, suggestion.durationHours);
        if (!hash) { toast.error('Transaction cancelled'); return; }
        txHash = hash;
      }
      const updated = await reviewMarketSuggestion(
        { address, publicKey, chain: activeChain, signMessage },
        suggestion.id,
        { status: 'approved', txHash, publishOnChain: publishOnchain, chain: activeChain }
      );
      if (updated) { updateSuggestionLocally(updated); toast.success('Suggestion approved'); }
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to approve suggestion');
    } finally {
      setActingId(null);
    }
  };

  const handleRejectConfirm = async (suggestion: MarketSuggestion) => {
    if (!address || !publicKey || !signMessage) { toast.error('Wallet not connected'); return; }
    setActingId(suggestion.id);
    try {
      const updated = await reviewMarketSuggestion(
        { address, publicKey, chain: activeChain, signMessage },
        suggestion.id,
        { status: 'rejected', reason: rejectReason.trim() || undefined, chain: activeChain }
      );
      if (updated) {
        updateSuggestionLocally(updated);
        toast.success('Suggestion rejected');
        setRejectingId(null);
        setRejectReason('');
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to reject suggestion');
    } finally {
      setActingId(null);
    }
  };

  // ── Gate: not connected ──────────────────────────────────────────────────────

  if (!connected) {
    return (
      <div className="min-h-screen bg-[#080B18] text-white">
        <Container className="py-10">
          <div className="max-w-lg mx-auto rounded-2xl border border-warning-500/30 bg-warning-500/[0.06] p-8 text-center">
            <div className="text-3xl mb-3">🔐</div>
            <h2 className="text-xl font-bold text-warning-300 mb-2">Wallet Connection Required</h2>
            <p className="text-warning-200/70 text-sm">
              Connect a wallet with DAO permissions to review market suggestions.
            </p>
          </div>
        </Container>
      </div>
    );
  }

  if (!canModerate && !adminLoading) {
    return (
      <div className="min-h-screen bg-[#080B18] text-white">
        <Container className="py-10">
          <div className="max-w-lg mx-auto rounded-2xl border border-error-500/30 bg-error-500/[0.06] p-8 text-center">
            <div className="text-3xl mb-3">⛔</div>
            <h2 className="text-xl font-bold text-error-300 mb-2">Insufficient Permissions</h2>
            <p className="text-error-200/70 text-sm">
              This page is restricted to DAO admins and Market Creators.
            </p>
          </div>
        </Container>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#080B18] text-white selection:bg-primary-500/30">
      <Container className="py-8 md:py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-1.5">
                DAO Governance
              </p>
              <h1 className="text-3xl font-black text-white tracking-tight">
                Suggestion Review Queue
              </h1>
              <p className="text-sm text-slate-500 mt-1.5">
                Review and curate community proposals before publishing as on-chain markets.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {pendingCount > 0 && (
                <span className="px-3 py-1.5 rounded-xl bg-warning-500/15 border border-warning-500/25 text-warning-300 text-xs font-bold">
                  {pendingCount} pending
                </span>
              )}
              <button
                type="button"
                onClick={refreshSuggestions}
                disabled={isFetching}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-slate-400 hover:text-white hover:border-white/[0.15] transition-all disabled:opacity-40"
              >
                <FiRefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                {isFetching ? 'Loading…' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 mb-6 p-1 rounded-xl border border-white/[0.07] bg-white/[0.02] w-fit">
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    active
                      ? 'bg-primary-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          {isFetching && suggestions.length === 0 ? (
            <div className="space-y-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : filteredSuggestions.length === 0 ? (
            <div
              className="rounded-2xl border border-[#1C2537] bg-[#0D1224] p-12 text-center"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
            >
              <div className="text-4xl mb-3">📭</div>
              <h3 className="text-lg font-bold text-white mb-2">No suggestions found</h3>
              <p className="text-sm text-slate-500">
                {statusFilter === 'pending'
                  ? 'New market ideas will appear here as the community submits them.'
                  : 'No suggestions match this filter. Try another status.'}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-4">
                {filteredSuggestions.map((suggestion) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    events={events}
                    activeChain={activeChain}
                    isCreatorMode={isCreatorMode}
                    isVoting={votingId === suggestion.id}
                    isActing={actingId === suggestion.id || creatingMarket}
                    rejectingId={rejectingId}
                    rejectReason={rejectReason}
                    onVote={handleVote}
                    onApprove={handleApprove}
                    onRejectClick={(id) => { setRejectingId(id); setRejectReason(''); }}
                    onRejectReasonChange={setRejectReason}
                    onRejectConfirm={handleRejectConfirm}
                    onRejectCancel={() => { setRejectingId(null); setRejectReason(''); }}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </motion.div>
      </Container>
    </div>
  );
};

export default AdminSuggestionsPage;

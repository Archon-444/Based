import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiPlus,
  FiX,
} from 'react-icons/fi';
import toast from '../components/ui/Toast';
import { useCreateMarket } from '../hooks/useTransactions';
import { submitMarketSuggestion } from '../services/suggestionsApi';
import { useHasMarketCreatorRole } from '../hooks/useRoles';
import { Select } from '../components/ui/Select';
import { useUnifiedWallet } from '../hooks/useUnifiedWallet';
import { useChain } from '../contexts/ChainContext';
import { Container } from '../components/layout/Container';

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General', icon: '📋' },
  { value: 'crypto', label: 'Cryptocurrency', icon: '₿' },
  { value: 'sports', label: 'Sports', icon: '⚽' },
  { value: 'politics', label: 'Politics', icon: '🏛️' },
  { value: 'technology', label: 'Technology', icon: '💻' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { value: 'science', label: 'Science', icon: '🔬' },
];

const creatorChains = ['aptos', 'sui'] as const;

const HOURS_IN_MS = 60 * 60 * 1000;
const DEFAULT_DURATION_HOURS = 24 * 7;

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);
const toTimeInputValue = (date: Date) => date.toISOString().slice(11, 16);

const STEPS = ['Question', 'Outcomes', 'Details', 'Review'] as const;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 40 : -40, opacity: 0 }),
};

const inputClass =
  'w-full rounded-xl border border-[#1C2537] bg-[#080B18] px-3.5 py-2.5 text-sm text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 placeholder-slate-600 transition-colors';

export default function CreateMarketPage() {
  const navigate = useNavigate();
  const { activeChain } = useChain();
  const { connected, address, publicKey, signMessage } = useUnifiedWallet();
  const { createMarket, isLoading } = useCreateMarket();
  const { hasRole: hasCreatorRole, loading: roleLoading } = useHasMarketCreatorRole();

  // Form state
  const [question, setQuestion] = useState('');
  const [marketType, setMarketType] = useState<'binary' | 'multi'>('binary');
  const [outcomes, setOutcomes] = useState(['Yes', 'No']);
  const [endDate, setEndDate] = useState(() =>
    toDateInputValue(new Date(Date.now() + DEFAULT_DURATION_HOURS * HOURS_IN_MS))
  );
  const [endTime, setEndTime] = useState(() =>
    toTimeInputValue(new Date(Date.now() + DEFAULT_DURATION_HOURS * HOURS_IN_MS))
  );
  const [category, setCategory] = useState('general');
  const [resolutionSource, setResolutionSource] = useState('');
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const chainLabel =
    'Base';
  const isCreatorMode =
    hasCreatorRole && !roleLoading && (creatorChains as readonly string[]).includes(activeChain);

  // Outcome handlers
  const setBinaryOutcomes = () => {
    setMarketType('binary');
    setOutcomes(['Yes', 'No']);
  };
  const handleAddOutcome = () => {
    if (outcomes.length < 10) setOutcomes([...outcomes, '']);
  };
  const handleRemoveOutcome = (i: number) => {
    if (outcomes.length > 2) setOutcomes(outcomes.filter((_, idx) => idx !== i));
  };
  const handleOutcomeChange = (i: number, val: string) => {
    const next = [...outcomes];
    next[i] = val;
    setOutcomes(next);
  };

  // Duration helpers
  const applyDurationPreset = (hours: number) => {
    const t = new Date(Date.now() + hours * HOURS_IN_MS);
    setEndDate(toDateInputValue(t));
    setEndTime(toTimeInputValue(t));
  };
  const calculateDurationHours = () => {
    if (!endDate || !endTime) return 0;
    const delta = new Date(`${endDate}T${endTime}`).getTime() - Date.now();
    return Number.isNaN(delta) || delta <= 0 ? 0 : Math.ceil(delta / HOURS_IN_MS);
  };

  // Step validation
  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!question.trim() || question.trim().length < 5) {
        toast.error('Please enter a valid question (min 5 characters)');
        return false;
      }
    }
    if (step === 2) {
      const filled = outcomes.filter((o) => o.trim());
      if (filled.length < 2) {
        toast.error('Please provide at least 2 outcomes');
        return false;
      }
    }
    if (step === 3) {
      if (calculateDurationHours() <= 0) {
        toast.error('Please pick a future settlement time');
        return false;
      }
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(currentStep)) return;
    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, 4));
  };

  const goBack = () => {
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  // Submit
  const handleSubmit = async () => {
    if (!connected) { toast.error('Please connect your wallet first'); return; }
    if (!address) { toast.error('Unable to detect your wallet address'); return; }

    const filledOutcomes = outcomes.map((o) => o.trim()).filter(Boolean);
    const durationHours = calculateDurationHours();

    if (isCreatorMode) {
      if (!(creatorChains as readonly string[]).includes(activeChain)) {
        toast.error('Direct on-chain publication is only available on Base');
        return;
      }
      const hash = await createMarket(question, filledOutcomes, durationHours);
      if (hash) setTimeout(() => navigate('/markets'), 2000);
    } else {
      try {
        setIsSubmittingSuggestion(true);
        if (!signMessage || !publicKey) throw new Error('Wallet does not support message signing');
        await submitMarketSuggestion(
          { address, publicKey, chain: activeChain, signMessage },
          {
            question: question.trim(),
            outcomes: filledOutcomes,
            category,
            durationHours,
            resolutionSource: resolutionSource.trim() || undefined,
            chain: activeChain,
          }
        );
        toast.success('Market suggestion submitted for review! The DAO will review your proposal.');
        setTimeout(() => navigate('/markets'), 1500);
      } catch (err: any) {
        toast.error(err?.message ?? 'Failed to submit suggestion. Please try again.');
      } finally {
        setIsSubmittingSuggestion(false);
      }
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-[#080B18] text-white">
        <Container className="py-8">
          <div className="max-w-lg mx-auto rounded-2xl border border-warning-500/30 bg-warning-500/[0.06] p-8 text-center">
            <h2 className="text-xl font-bold text-warning-300 mb-2">Wallet Connection Required</h2>
            <p className="text-warning-200/70">
              Connect your wallet to {isCreatorMode ? 'create' : 'suggest'} a market.
            </p>
          </div>
        </Container>
      </div>
    );
  }

  const filledOutcomes = outcomes.filter((o) => o.trim());
  const durationHours = calculateDurationHours();
  const categoryLabel = CATEGORY_OPTIONS.find((c) => c.value === category);
  const isSubmitting = isLoading || isSubmittingSuggestion;

  return (
    <div className="min-h-screen bg-[#080B18] text-white selection:bg-primary-500/30">
      <Container className="py-8 md:py-12 max-w-2xl">

        {/* Header */}
        <div className="mb-8">
          <Link
            to="/markets"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-5"
          >
            <FiArrowLeft className="w-4 h-4" /> All Markets
          </Link>
          <p className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-1.5">New Market</p>
          <h1 className="text-3xl font-black text-white tracking-tight">
            {isCreatorMode ? 'Create Market' : 'Suggest a Market'}
          </h1>
          {isCreatorMode && (
            <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-500/15 text-success-300 text-xs font-semibold">
              <FiCheck className="w-3 h-3" /> Creator Mode Active
            </span>
          )}
          {!isCreatorMode && !roleLoading && (
            <p className="mt-2 text-sm text-slate-500">
              Your suggestion will be reviewed by the DAO before publishing.
            </p>
          )}
          {roleLoading && (
            <p className="mt-2 text-sm text-slate-500">Checking creator permissions…</p>
          )}
        </div>

        {/* Step Indicator */}
        <div className="flex items-center mb-8">
          {STEPS.map((label, i) => {
            const stepNum = i + 1;
            const isDone = currentStep > stepNum;
            const isActive = currentStep === stepNum;
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                      isDone
                        ? 'bg-success-500 text-white'
                        : isActive
                        ? 'bg-primary-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                        : 'bg-white/[0.06] text-slate-500 border border-white/[0.08]'
                    }`}
                  >
                    {isDone ? <FiCheck className="w-3.5 h-3.5" /> : stepNum}
                  </div>
                  <span
                    className={`text-[11px] font-semibold hidden sm:block ${
                      isActive ? 'text-white' : isDone ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-2 mb-4 transition-all duration-300 ${
                      isDone ? 'bg-success-500/40' : 'bg-white/[0.07]'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* ── Step 1: Question ────────────────────────────────── */}
              {currentStep === 1 && (
                <div
                  className="rounded-2xl border border-[#1C2537] bg-[#0D1224] p-6"
                  style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)' }}
                >
                  <h2 className="text-base font-bold text-white mb-0.5">What would you like to predict?</h2>
                  <p className="text-sm text-slate-500 mb-5">
                    Write a clear, unambiguous question with a definitive outcome.
                  </p>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Question
                      </label>
                      <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        rows={3}
                        className={inputClass + ' resize-none'}
                        placeholder="e.g. Will BTC close above $80k on 31 Dec 2025?"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                        Market Type
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={setBinaryOutcomes}
                          className={`relative flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all ${
                            marketType === 'binary'
                              ? 'border-primary-500/60 bg-primary-500/[0.08] shadow-[0_0_16px_rgba(59,130,246,0.1)]'
                              : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14]'
                          }`}
                        >
                          {marketType === 'binary' && (
                            <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                              <FiCheck className="w-3 h-3 text-white" />
                            </span>
                          )}
                          <span className="text-lg">⚖️</span>
                          <span className="font-bold text-sm text-white">Binary</span>
                          <span className="text-xs text-slate-500">Yes / No outcome</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMarketType('multi');
                            if (marketType === 'binary') setOutcomes(['', '']);
                          }}
                          className={`relative flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all ${
                            marketType === 'multi'
                              ? 'border-primary-500/60 bg-primary-500/[0.08] shadow-[0_0_16px_rgba(59,130,246,0.1)]'
                              : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14]'
                          }`}
                        >
                          {marketType === 'multi' && (
                            <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                              <FiCheck className="w-3 h-3 text-white" />
                            </span>
                          )}
                          <span className="text-lg">📊</span>
                          <span className="font-bold text-sm text-white">Multiple Choice</span>
                          <span className="text-xs text-slate-500">2–10 custom outcomes</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 2: Outcomes ─────────────────────────────────── */}
              {currentStep === 2 && (
                <div
                  className="rounded-2xl border border-[#1C2537] bg-[#0D1224] p-6"
                  style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)' }}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h2 className="text-base font-bold text-white mb-0.5">Define the outcomes</h2>
                      <p className="text-sm text-slate-500">
                        {marketType === 'binary'
                          ? 'Binary markets use Yes and No outcomes.'
                          : 'Add 2–10 mutually exclusive outcomes.'}
                      </p>
                    </div>
                    {marketType === 'multi' && (
                      <button
                        type="button"
                        onClick={setBinaryOutcomes}
                        className="text-xs text-primary-400 hover:text-primary-300 font-medium transition-colors flex-shrink-0 ml-4"
                      >
                        Reset to Yes/No
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {outcomes.map((outcome, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, delay: idx * 0.04 }}
                        className="flex items-center gap-3"
                      >
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-xs font-bold text-slate-400">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <input
                          type="text"
                          value={outcome}
                          onChange={(e) => handleOutcomeChange(idx, e.target.value)}
                          className={inputClass}
                          placeholder={`Outcome ${idx + 1}`}
                          readOnly={marketType === 'binary'}
                        />
                        {marketType === 'multi' && outcomes.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOutcome(idx)}
                            className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-error-500/15 border border-white/[0.07] hover:border-error-500/30 flex items-center justify-center transition-all"
                            aria-label="Remove outcome"
                          >
                            <FiX className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {marketType === 'multi' && outcomes.length < 10 && (
                    <button
                      type="button"
                      onClick={handleAddOutcome}
                      className="mt-4 inline-flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors"
                    >
                      <FiPlus className="w-4 h-4" /> Add outcome
                      <span className="text-slate-600 text-xs">({outcomes.length}/10)</span>
                    </button>
                  )}
                </div>
              )}

              {/* ── Step 3: Details ──────────────────────────────────── */}
              {currentStep === 3 && (
                <div
                  className="rounded-2xl border border-[#1C2537] bg-[#0D1224] p-6"
                  style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)' }}
                >
                  <h2 className="text-base font-bold text-white mb-0.5">Settlement & Details</h2>
                  <p className="text-sm text-slate-500 mb-5">
                    Set when this market closes and how it will be resolved.
                  </p>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Settlement Deadline
                      </label>
                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className={inputClass + ' [color-scheme:dark]'}
                        />
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className={inputClass + ' [color-scheme:dark]'}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-600">Quick:</span>
                        {[
                          { h: 24, l: '1d' },
                          { h: 72, l: '3d' },
                          { h: 168, l: '1w' },
                          { h: 720, l: '30d' },
                        ].map(({ h, l }) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => applyDurationPreset(h)}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium border border-white/[0.08] text-slate-400 hover:border-primary-500/50 hover:text-primary-300 transition-all"
                          >
                            +{l}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Category
                      </label>
                      <Select
                        options={CATEGORY_OPTIONS}
                        value={category}
                        onChange={setCategory}
                        placeholder="Select a category"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Resolution Source{' '}
                        <span className="ml-1 text-slate-600 font-normal normal-case tracking-normal">
                          optional
                        </span>
                      </label>
                      <input
                        type="text"
                        value={resolutionSource}
                        onChange={(e) => setResolutionSource(e.target.value)}
                        className={inputClass}
                        placeholder="e.g. CoinGecko API, Reuters, official announcements…"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 4: Review ───────────────────────────────────── */}
              {currentStep === 4 && (
                <div
                  className="rounded-2xl border border-[#1C2537] bg-[#0D1224] p-6 space-y-5"
                  style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)' }}
                >
                  <div>
                    <h2 className="text-base font-bold text-white mb-0.5">Review your market</h2>
                    <p className="text-sm text-slate-500">
                      {isCreatorMode
                        ? 'This will be published on-chain immediately upon confirmation.'
                        : 'This will be sent to the DAO review queue for approval.'}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Question
                      </div>
                      <div className="text-sm font-semibold text-white leading-relaxed">
                        {question.trim()}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                        Outcomes ({filledOutcomes.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {filledOutcomes.map((o, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-sm text-white"
                          >
                            <span className="text-xs font-bold text-slate-400">
                              {String.fromCharCode(65 + i)}
                            </span>
                            {o}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Closes In
                        </div>
                        <div className="text-sm font-semibold text-white">
                          {durationHours >= 24
                            ? `${Math.round(durationHours / 24)}d`
                            : `${durationHours}h`}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Category
                        </div>
                        <div className="text-sm font-semibold text-white">
                          {categoryLabel?.icon} {categoryLabel?.label}
                        </div>
                      </div>
                    </div>

                    {resolutionSource && (
                      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Resolution Source
                        </div>
                        <div className="text-sm text-slate-300 break-all">{resolutionSource}</div>
                      </div>
                    )}

                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Network
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-primary-500/20 text-primary-200 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide">
                          {chainLabel}
                        </span>
                        {address && (
                          <span className="font-mono text-xs text-slate-500">
                            {address.slice(0, 6)}…{address.slice(-4)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between mt-5">
          <button
            type="button"
            onClick={goBack}
            disabled={currentStep === 1}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white border border-white/[0.07] hover:border-white/[0.15] bg-white/[0.02] hover:bg-white/[0.05] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FiArrowLeft className="w-4 h-4" /> Back
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary-500 to-secondary-600 shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:shadow-[0_0_28px_rgba(59,130,246,0.4)] transition-all"
            >
              Next <FiArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary-500 to-secondary-600 shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:shadow-[0_0_28px_rgba(59,130,246,0.4)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {isCreatorMode ? 'Publishing…' : 'Submitting…'}
                </>
              ) : (
                <>
                  <FiCheck className="w-4 h-4" />
                  {isCreatorMode ? 'Publish On-Chain' : 'Submit Suggestion'}
                </>
              )}
            </button>
          )}
        </div>
      </Container>
    </div>
  );
}

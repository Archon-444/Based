import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiX, FiCheck } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'prophecy-onboarding-done';

const STEPS = [
  {
    emoji: '🔮',
    title: 'Welcome to Prophecy',
    body: 'Prophecy is a decentralized prediction market on Base. You bet USDC on the outcome of real-world events — and win a share of the pool if you\'re right.',
    highlight: 'Powered by on-chain smart contracts. Non-custodial. Open to anyone.',
  },
  {
    emoji: '📊',
    title: 'How Odds Work',
    body: 'Probabilities shift in real-time as more bets flow in. Each outcome\'s percentage is determined by the ratio of money bet on it versus the total pool.',
    highlight: 'Bet on undervalued outcomes for higher returns. The crowd sets the odds.',
  },
  {
    emoji: '🏆',
    title: 'How to Win',
    body: 'Pick an outcome, enter your USDC amount, and confirm. If your outcome wins, your share of the losing pool is yours to claim — minus a small protocol fee.',
    highlight: 'Markets resolve by oracle. Winnings appear in My Bets, ready to claim.',
  },
  {
    emoji: '🚀',
    title: 'Ready to Predict',
    body: 'Connect your Coinbase Smart Wallet to get started. On testnet, use the faucet button in the header to receive free USDC for your first prediction.',
    highlight: 'No KYC. No minimums. Just your prediction and your edge.',
  },
];

export const OnboardingModal: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      // Small delay so the page renders first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  const goNext = () => {
    if (step < STEPS.length - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  };

  const goPrev = () => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const current = STEPS[step];

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-md rounded-2xl border border-[#1C2537] bg-[#0D1224] overflow-hidden pointer-events-auto"
              style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)' }}
            >
              {/* Close */}
              <button
                onClick={dismiss}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white transition-all z-10"
              >
                <FiX className="w-4 h-4" />
              </button>

              {/* Progress bar */}
              <div className="h-0.5 bg-white/[0.06]">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
                  animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Step content */}
              <div className="px-8 pt-8 pb-6 overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step}
                    custom={direction}
                    initial={{ x: direction > 0 ? 40 : -40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: direction < 0 ? 40 : -40, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-5xl mb-5">{current.emoji}</div>
                    <h2 className="text-2xl font-black text-white tracking-tight mb-3">
                      {current.title}
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                      {current.body}
                    </p>
                    <div className="rounded-xl border border-primary-500/20 bg-primary-500/[0.06] px-4 py-3">
                      <p className="text-xs text-primary-300 font-medium leading-relaxed">
                        {current.highlight}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-8 pb-7 flex items-center justify-between gap-4">
                {/* Step dots */}
                <div className="flex items-center gap-1.5">
                  {STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setDirection(i > step ? 1 : -1); setStep(i); }}
                      className={`rounded-full transition-all ${
                        i === step ? 'w-4 h-1.5 bg-primary-500' : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {step > 0 && (
                    <button
                      onClick={goPrev}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white border border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02] transition-all"
                    >
                      Back
                    </button>
                  )}
                  {step < STEPS.length - 1 ? (
                    <button
                      onClick={goNext}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary-500 to-secondary-600 shadow-[0_0_16px_rgba(59,130,246,0.25)] hover:shadow-[0_0_24px_rgba(59,130,246,0.4)] transition-all"
                    >
                      Next <FiArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <Link
                      to="/markets"
                      onClick={dismiss}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary-500 to-secondary-600 shadow-[0_0_16px_rgba(59,130,246,0.25)] hover:shadow-[0_0_24px_rgba(59,130,246,0.4)] transition-all"
                    >
                      <FiCheck className="w-3.5 h-3.5" /> Let's go
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OnboardingModal;

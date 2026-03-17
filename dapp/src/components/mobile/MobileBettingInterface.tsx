import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiTrendingUp, FiX } from 'react-icons/fi';
import { usePlaceBet } from '../../hooks/useTransactions';
// Legacy Move-based Market type for mobile components
interface Market {
  id: string;
  question: string;
  outcomes: string[];
  endTime: number;
  resolved: boolean;
  winningOutcome: number;
  totalStakes: number;
  outcomeStakes: number[];
}
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { hapticFeedback } from '../../utils/hapticFeedback';
import { QuickBetWidget } from './QuickBetWidget';

interface MobileBettingInterfaceProps {
  market: Market;
  onClose: () => void;
}

export const MobileBettingInterface: React.FC<MobileBettingInterfaceProps> = ({
  market,
  onClose,
}) => {
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const { placeBet, isLoading } = usePlaceBet();

  // Swipe down to dismiss
  const { swipeDistance } = useSwipeGesture({
    onSwipeDown: onClose,
    threshold: 100,
    enabled: true,
  });

  const handleAmountSelect = (value: number) => {
    hapticFeedback.buttonTap();
    setAmount(value);
  };

  const handleSelectOutcome = (index: number) => {
    hapticFeedback.selectOutcome();
    setSelectedOutcome(index);
  };

  const handlePlaceBet = async () => {
    if (selectedOutcome === null || !amount || amount <= 0) return;

    hapticFeedback.placeBet();
    try {
      await placeBet(market.id, selectedOutcome, amount);
      hapticFeedback.betConfirmed();
    } catch (error) {
      hapticFeedback.betFailed();
      throw error;
    }
    onClose();
  };

  const calculatePotentialWin = () => {
    if (selectedOutcome === null || !amount || amount <= 0) return 0;

    const totalStake = market.totalStakes || 1;
    const outcomeStake = market.outcomeStakes[selectedOutcome] || 0;
    const odds = (totalStake - outcomeStake) / (outcomeStake + amount * 1000000);

    return amount * (1 + odds);
  };

  const potentialWin = calculatePotentialWin();
  const potentialProfit = potentialWin - amount;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: Math.max(0, swipeDistance.y) }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-[#080B18] overflow-y-auto safe-top safe-bottom"
    >
      {/* Header with swipe indicator */}
      <div className="sticky top-0 bg-[#080B18]/95 backdrop-blur-xl border-b border-white/[0.05] px-4 py-4">
        {/* Swipe indicator */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-3" />

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            Place Bet
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/[0.08] rounded-lg transition-colors touch-manipulation"
          >
            <FiX className="w-6 h-6 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-32">
        {/* Market Question */}
        <div className="p-4 bg-white/[0.04] rounded-2xl border border-white/[0.06]">
          <p className="text-sm text-slate-500 mb-1">Market</p>
          <p className="text-base font-semibold text-white">
            {market.question}
          </p>
        </div>

        {/* Outcome Selection */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-white">
            Select Outcome
          </label>
          <div className="grid grid-cols-1 gap-3">
            {market.outcomes.map((outcome, index) => {
              const isSelected = selectedOutcome === index;
              const totalStake = market.totalStakes || 1;
              const probability = Math.round((market.outcomeStakes[index] / totalStake) * 100);

              return (
                <motion.button
                  key={index}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelectOutcome(index)}
                  className={`relative p-4 rounded-2xl border-2 transition-all touch-manipulation ${
                    isSelected
                      ? 'border-primary-500 bg-primary-500/[0.08]'
                      : 'border-white/[0.08] bg-white/[0.03]'
                  }`}
                >
                  {/* Check Mark */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center"
                    >
                      <FiCheck className="w-4 h-4 text-white" />
                    </motion.div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className={`text-base font-semibold ${
                      isSelected ? 'text-primary-300' : 'text-white'
                    }`}>
                      {outcome}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xl font-bold ${
                        isSelected ? 'text-primary-400' : 'text-slate-400'
                      }`}>
                        {probability}%
                      </span>
                      <FiTrendingUp className={`w-5 h-5 ${
                        isSelected ? 'text-primary-500' : 'text-slate-500'
                      }`} />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Amount Selection with QuickBetWidget */}
        <QuickBetWidget
          onAmountSelect={handleAmountSelect}
          selectedAmount={amount}
          minAmount={1}
          maxAmount={10000}
        />

        {/* Potential Win Display */}
        {selectedOutcome !== null && amount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gradient-to-br from-success-500/[0.07] to-success-600/[0.04] rounded-2xl border border-success-500/20"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-success-300">Bet Amount</span>
                <span className="text-sm font-semibold text-success-200">
                  ${amount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-success-300">Potential Profit</span>
                <span className="text-sm font-semibold text-success-200">
                  +${potentialProfit.toFixed(2)}
                </span>
              </div>
              <div className="pt-2 border-t border-success-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-success-300">
                    Potential Return
                  </span>
                  <span className="text-xl font-bold text-success-400">
                    ${potentialWin.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#080B18]/95 backdrop-blur-xl border-t border-white/[0.05] safe-bottom">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handlePlaceBet}
          disabled={selectedOutcome === null || !amount || amount <= 0 || isLoading}
          className={`w-full py-4 rounded-2xl font-bold text-lg touch-manipulation transition-all ${
            selectedOutcome === null || !amount || amount <= 0 || isLoading
              ? 'bg-white/[0.08] text-slate-500 cursor-not-allowed'
              : 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg'
          }`}
        >
          {isLoading ? 'Placing Bet...' : 'Place Bet'}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default MobileBettingInterface;

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiCheck, FiX, FiInfo, FiShield } from 'react-icons/fi';
import { useChainCurrency } from '../hooks/useChainCurrency';

interface TransactionDetails {
  type: 'place_bet' | 'create_market' | 'claim_winnings' | 'resolve_market';
  marketId?: number;
  marketQuestion?: string;
  outcome?: string;
  amount?: number;
  winningOutcome?: number;
  outcomes?: string[];
  duration?: number;
  estimatedGas?: number;
}

interface TransactionConfirmationProps {
  details: TransactionDetails;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TransactionConfirmation({
  details,
  onConfirm,
  onCancel,
  isLoading = false,
}: TransactionConfirmationProps) {
  const [understood, setUnderstood] = useState(false);
  const currency = useChainCurrency();
  const gasTicker = 'ETH';
  const formatAmount = (value?: number) =>
    typeof value === 'number' ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';

  const getTransactionTitle = () => {
    switch (details.type) {
      case 'place_bet':
        return 'Confirm Bet Placement';
      case 'create_market':
        return 'Confirm Market Creation';
      case 'claim_winnings':
        return 'Confirm Claim Winnings';
      case 'resolve_market':
        return 'Confirm Market Resolution';
      default:
        return 'Confirm Transaction';
    }
  };

  const getTransactionIcon = () => {
    switch (details.type) {
      case 'place_bet':
        return <FiAlertTriangle className="w-8 h-8 text-primary-500" />;
      case 'claim_winnings':
        return <FiCheck className="w-8 h-8 text-green-500" />;
      case 'resolve_market':
        return <FiShield className="w-8 h-8 text-secondary-500" />;
      default:
        return <FiInfo className="w-8 h-8 text-slate-500" />;
    }
  };

  const renderTransactionDetails = () => {
    switch (details.type) {
      case 'place_bet':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-white/[0.06] rounded-xl">
              <h4 className="text-sm font-semibold text-slate-300 mb-3">
                Bet Details
              </h4>
              <div className="space-y-2">
                <DetailRow label="Market" value={details.marketQuestion || `Market #${details.marketId}`} />
                <DetailRow label="Outcome" value={details.outcome || 'Unknown'} highlight />
                <DetailRow label="Amount" value={formatAmount(details.amount)} highlight />
                {details.estimatedGas && (
                  <DetailRow label="Estimated Gas" value={`~${details.estimatedGas} ${gasTicker}`} />
                )}
              </div>
            </div>

            <div className="p-4 bg-warning-500/[0.07] border border-warning-500/25 rounded-xl">
              <div className="flex items-start gap-3">
                <FiAlertTriangle className="w-5 h-5 text-warning-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-warning-200 mb-1">
                    Important Notice
                  </h4>
                  <ul className="text-sm text-warning-300 space-y-1">
                    <li>• This transaction is irreversible once confirmed</li>
                    <li>• Your funds will be locked until market resolution</li>
                    <li>• You may lose your entire bet if your prediction is wrong</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'create_market':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-white/[0.06] rounded-xl">
              <h4 className="text-sm font-semibold text-slate-300 mb-3">
                Market Details
              </h4>
              <div className="space-y-2">
                <DetailRow label="Question" value={details.marketQuestion || 'N/A'} />
                <DetailRow
                  label="Outcomes"
                  value={details.outcomes?.join(', ') || 'N/A'}
                />
                <DetailRow
                  label="Duration"
                  value={`${details.duration} hours`}
                />
                {details.estimatedGas && (
                  <DetailRow label="Estimated Gas" value={`~${details.estimatedGas} ${gasTicker}`} />
                )}
              </div>
            </div>

            <div className="p-4 bg-primary-500/[0.07] border border-primary-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <FiInfo className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-primary-200 mb-1">
                    Market Creator Responsibilities
                  </h4>
                  <ul className="text-sm text-primary-300 space-y-1">
                    <li>• You may be responsible for resolving this market</li>
                    <li>• Ensure the question is clear and unambiguous</li>
                    <li>• Market cannot be deleted once created</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'claim_winnings':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-white/[0.06] rounded-xl">
              <h4 className="text-sm font-semibold text-slate-300 mb-3">
                Claim Details
              </h4>
              <div className="space-y-2">
                <DetailRow label="Market" value={details.marketQuestion || `Market #${details.marketId}`} />
                <DetailRow label="Winning Outcome" value={details.outcome || 'N/A'} highlight />
                {details.amount && (
                  <DetailRow label="Estimated Payout" value={`~${formatAmount(details.amount)}`} highlight />
                )}
                {details.estimatedGas && (
                  <DetailRow label="Estimated Gas" value={`~${details.estimatedGas} ${gasTicker}`} />
                )}
              </div>
            </div>

            <div className="p-4 bg-success-500/[0.07] border border-success-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <FiCheck className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-success-200 mb-1">
                    Congratulations!
                  </h4>
                  <p className="text-sm text-success-300">
                    You predicted correctly and can claim your winnings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'resolve_market':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-white/[0.06] rounded-xl">
              <h4 className="text-sm font-semibold text-slate-300 mb-3">
                Resolution Details
              </h4>
              <div className="space-y-2">
                <DetailRow label="Market" value={details.marketQuestion || `Market #${details.marketId}`} />
                <DetailRow
                  label="Winning Outcome"
                  value={details.outcomes?.[details.winningOutcome || 0] || `Outcome #${details.winningOutcome}`}
                  highlight
                />
                {details.estimatedGas && (
                  <DetailRow label="Estimated Gas" value={`~${details.estimatedGas} APT`} />
                )}
              </div>
            </div>

            <div className="p-4 bg-error-500/[0.07] border border-error-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <FiAlertTriangle className="w-5 h-5 text-error-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-error-200 mb-1">
                    Resolution is Final
                  </h4>
                  <ul className="text-sm text-error-300 space-y-1">
                    <li>• Market resolution cannot be changed once confirmed</li>
                    <li>• Ensure you select the correct winning outcome</li>
                    <li>• Verify outcome is accurate and verifiable</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="max-w-lg w-full bg-[#0D1224] rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/[0.08]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/[0.06] rounded-full flex items-center justify-center">
                  {getTransactionIcon()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {getTransactionTitle()}
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Review transaction details carefully
                  </p>
                </div>
              </div>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
                disabled={isLoading}
              >
                <FiX className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {renderTransactionDetails()}

            {/* Confirmation Checkbox */}
            <div className="mt-6 p-4 bg-white/[0.06] rounded-xl">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={understood}
                  onChange={(e) => setUnderstood(e.target.checked)}
                  className="mt-1 w-5 h-5 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                  disabled={isLoading}
                />
                <span className="text-sm text-slate-300">
                  I understand the transaction details and confirm that I want to proceed with this action.
                </span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/[0.08] bg-white/[0.06]/50">
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-white/[0.06] hover:bg-white/[0.05] text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={!understood || isLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading ? 'Confirming...' : 'Confirm Transaction'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Helper component for detail rows
function DetailRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm font-semibold ${
        highlight
          ? 'text-primary-400'
          : 'text-white'
      }`}>
        {value}
      </span>
    </div>
  );
}

export default TransactionConfirmation;

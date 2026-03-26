import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiTrendingUp, FiZap, FiShield } from 'react-icons/fi';
import { Button } from './ui/Button';

interface StartAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartApp: () => void;
  onBrowseOnly: () => void;
}

/**
 * StartAppModal - First-time user education modal
 * 
 * Explains what happens when clicking "Start App" and gives users
 * choice between:
 * 1. Start App (load wallet, go to markets)
 * 2. Browse Only (skip wallet, just view markets)
 * 
 * Shows only once per user (localStorage flag)
 */
export const StartAppModal: React.FC<StartAppModalProps> = ({
  isOpen,
  onClose,
  onStartApp,
  onBrowseOnly
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, type: 'spring' }}
              className="bg-[#0D1224] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 px-6 py-8">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                  aria-label="Close modal"
                >
                  <FiX className="w-5 h-5" />
                </button>

                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <FiTrendingUp className="w-8 h-8 text-white" />
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-white text-center mb-2">
                  Welcome to Based!
                </h2>
                <p className="text-primary-100 text-center text-sm">
                  Your decentralized prediction market
                </p>
              </div>

              {/* Content */}
              <div className="px-6 py-6">
                <div className="space-y-4 mb-6">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary-100 /30 rounded-lg flex items-center justify-center">
                      <FiZap className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">
                        Connect Your Wallet
                      </h3>
                      <p className="text-sm text-slate-400">
                        Link your wallet to place bets and earn rewards
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-success-100 /30 rounded-lg flex items-center justify-center">
                      <FiShield className="w-5 h-5 text-success-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">
                        100% Secure & Transparent
                      </h3>
                      <p className="text-sm text-slate-400">
                        All transactions on Base, fully auditable
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={onStartApp}
                    rightIcon={<FiTrendingUp />}
                  >
                    Start App & Connect Wallet
                  </Button>

                  <Button
                    variant="outline"
                    size="md"
                    fullWidth
                    onClick={onBrowseOnly}
                  >
                    Just Browse Markets
                  </Button>
                </div>

                {/* Footer note */}
                <p className="text-xs text-slate-500 text-center mt-4">
                  No wallet? No problem! Browse markets first, connect later.
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StartAppModal;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiX, FiSmartphone } from 'react-icons/fi';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { hapticFeedback } from '../../utils/hapticFeedback';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Don't show if already installed or dismissed
    if (isInstalled || isDismissed) {
      setShowPrompt(false);
      return;
    }

    // Check if user has dismissed before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show prompt after 10 seconds on mobile
    if (isInstallable && window.innerWidth < 768) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, isDismissed]);

  const handleInstall = async () => {
    hapticFeedback.buttonPress();
    const accepted = await promptInstall();

    if (accepted) {
      hapticFeedback.success();
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    hapticFeedback.buttonTap();
    setShowPrompt(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleRemindLater = () => {
    hapticFeedback.buttonTap();
    setShowPrompt(false);
    // Don't set dismissed - will show again next session
  };

  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleRemindLater}
          />

          {/* Prompt Card */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-bottom"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 p-6 pb-8">
                <button
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
                >
                  <FiX className="w-5 h-5 text-white" />
                </button>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                    <FiSmartphone className="w-8 h-8 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      Install Based
                    </h3>
                    <p className="text-sm text-primary-100">
                      Access faster, works offline
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Launch from home screen
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Quick access like a native app
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Works offline
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Check your bets anytime, anywhere
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Push notifications
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Never miss a win or market update
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleInstall}
                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors touch-manipulation"
                  >
                    <FiDownload className="w-5 h-5" />
                    Install Now
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleRemindLater}
                    className="px-6 py-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors touch-manipulation"
                  >
                    Later
                  </motion.button>
                </div>

                <p className="text-xs text-center text-gray-500 dark:text-gray-500">
                  No app store required • Installs in seconds
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;

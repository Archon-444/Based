import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX } from 'react-icons/fi';
import { useAccount } from 'wagmi';
import {
  isPushSupported,
  getPermissionStatus,
  requestNotificationPermission,
  subscribeToPush,
  sendSubscriptionToServer,
} from '../../utils/pushNotifications';
import { hapticFeedback } from '../../utils/hapticFeedback';
import { VAPID_PUBLIC_KEY, isPushConfigured } from '../../config/push';

export const NotificationPrompt: React.FC = () => {
  const { address: accountAddress } = useAccount();
  const account = accountAddress ? { address: accountAddress } : null;
  const [showPrompt, setShowPrompt] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);

  useEffect(() => {
    // Don't show if notifications not supported
    if (!isPushSupported()) {
      return;
    }

    // Don't show if VAPID key not configured
    if (!isPushConfigured()) {
      console.warn('Push notifications not configured. Set VITE_VAPID_PUBLIC_KEY in .env');
      return;
    }

    // Don't show if already granted or denied
    const permission = getPermissionStatus();
    if (permission !== 'default') {
      return;
    }

    // Don't show if user dismissed before
    const dismissed = localStorage.getItem('notification-prompt-dismissed');
    if (dismissed) {
      return;
    }

    // Show prompt after 30 seconds
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const handleEnable = async () => {
    hapticFeedback.buttonPress();
    setIsEnabling(true);

    try {
      // Request permission
      const permission = await requestNotificationPermission();

      if (permission === 'granted') {
        // Subscribe to push notifications
        const subscription = await subscribeToPush(VAPID_PUBLIC_KEY);

        if (subscription) {
          // Send subscription to server with real wallet address
          const userAddress = account?.address || '';
          if (!userAddress) {
            console.warn('Cannot send subscription: wallet not connected');
            setShowPrompt(false);
            return;
          }

          await sendSubscriptionToServer(subscription, userAddress);

          hapticFeedback.success();
          setShowPrompt(false);
        } else {
          hapticFeedback.error();
        }
      } else {
        hapticFeedback.error();
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      hapticFeedback.error();
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDismiss = () => {
    hapticFeedback.buttonTap();
    setShowPrompt(false);
    localStorage.setItem('notification-prompt-dismissed', 'true');
  };

  const handleRemindLater = () => {
    hapticFeedback.buttonTap();
    setShowPrompt(false);
    // Will show again next session
  };

  if (!isPushSupported()) {
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
            <div className="bg-[#0D1224] rounded-2xl shadow-2xl border border-[#1C2537] overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-br from-primary-500 to-secondary-600 p-6 pb-8">
                <button
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
                >
                  <FiX className="w-5 h-5 text-white" />
                </button>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                    <FiBell className="w-8 h-8 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      Enable Notifications
                    </h3>
                    <p className="text-sm text-blue-100">
                      Never miss a win or important update
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-success-500/15 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-success-500 rounded-full" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        Win alerts
                      </p>
                      <p className="text-sm text-slate-400">
                        Get notified instantly when you win
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-success-500/15 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-success-500 rounded-full" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        Market updates
                      </p>
                      <p className="text-sm text-slate-400">
                        Track odds changes on markets you bet on
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-success-500/15 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-success-500 rounded-full" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        Closing reminders
                      </p>
                      <p className="text-sm text-slate-400">
                        Get alerts before markets close
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleEnable}
                    disabled={isEnabling}
                    className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-600 hover:from-primary-600 hover:to-secondary-700 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiBell className="w-5 h-5" />
                    {isEnabling ? 'Enabling...' : 'Enable Notifications'}
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleRemindLater}
                    className="px-6 py-4 bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 font-medium rounded-xl transition-colors touch-manipulation"
                  >
                    Later
                  </motion.button>
                </div>

                <p className="text-xs text-center text-slate-500">
                  You can change this anytime in settings
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationPrompt;

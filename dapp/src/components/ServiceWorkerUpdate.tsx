import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiX } from 'react-icons/fi';
import { skipWaiting } from '../utils/registerServiceWorker';

export const ServiceWorkerUpdate: React.FC = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready.then((reg) => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;

        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setShowUpdatePrompt(true);
          }
        });
      });
    });
  }, []);

  const handleUpdate = () => {
    skipWaiting();
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
  };

  return (
    <AnimatePresence>
      {showUpdatePrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
        >
          <div className="bg-[#0D1224] rounded-2xl shadow-2xl border border-white/[0.08] p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary-100 /30 rounded-full flex items-center justify-center flex-shrink-0">
                <FiRefreshCw className="w-5 h-5 text-primary-400" />
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">
                  Update Available
                </h3>
                <p className="text-sm text-slate-400 mb-3">
                  A new version of Prophecy is available with improvements and bug fixes.
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Update Now
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.05] rounded-lg transition-colors"
                  >
                    <FiX className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ServiceWorkerUpdate;

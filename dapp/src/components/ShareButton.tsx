import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareButtonProps {
  marketTitle: string;
  marketId: string;
  outcome?: string;
  winAmount?: number;
  prediction?: 'YES' | 'NO';
  odds?: number;
}

export function ShareButton({
  marketTitle,
  marketId,
  outcome: _outcome,
  winAmount,
  prediction,
  odds,
}: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const marketUrl = `${window.location.origin}/market/${marketId}`;

  // Generate share text based on context
  const getShareText = (platform: 'twitter' | 'copy') => {
    if (winAmount) {
      // Sharing a win
      return `🎉 Just won $${winAmount.toFixed(2)} on Prophecy!\n\nMarket: "${marketTitle}"\n\n${platform === 'twitter' ? 'Try your luck 👇' : ''}`;
    } else if (prediction && odds) {
      // Sharing a prediction
      return `🔮 I predict ${prediction} at ${odds}%!\n\n"${marketTitle}"\n\n${platform === 'twitter' ? 'What do you think? 👇' : ''}`;
    } else {
      // Sharing a market
      return `🎯 Check out this prediction market:\n\n"${marketTitle}"\n\n${platform === 'twitter' ? 'Cast your prediction 👇' : ''}`;
    }
  };

  const handleShare = async (platform: 'twitter' | 'native' | 'copy') => {
    const text = getShareText(platform === 'twitter' ? 'twitter' : 'copy');

    try {
      if (platform === 'twitter') {
        // Twitter/X share
        const twitterUrl = new URL('https://twitter.com/intent/tweet');
        twitterUrl.searchParams.set('text', text);
        twitterUrl.searchParams.set('url', marketUrl);
        twitterUrl.searchParams.set('hashtags', 'Prophecy,PredictionMarket,Crypto');

        window.open(twitterUrl.toString(), '_blank', 'width=550,height=420');
      } else if (platform === 'native' && navigator.share) {
        // Native share API (mobile)
        await navigator.share({
          title: 'Prophecy',
          text,
          url: marketUrl,
        });
      } else {
        // Copy to clipboard
        await navigator.clipboard.writeText(`${text}\n\n${marketUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }

      setShowMenu(false);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const isNativeShareSupported = typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowMenu(!showMenu)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.05] text-slate-300 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        <span>Share</span>
      </motion.button>

      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />

            {/* Share Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 mt-2 w-56 bg-[#0D1224] rounded-xl shadow-xl border border-white/[0.08] overflow-hidden z-50"
            >
              {/* Twitter/X */}
              <button
                onClick={() => handleShare('twitter')}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.05] transition-colors text-left"
              >
                <div className="w-10 h-10 bg-black  rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-white">Share to X</div>
                  <div className="text-xs text-slate-500">Post to your followers</div>
                </div>
              </button>

              {/* Native Share (Mobile only) */}
              {isNativeShareSupported && (
                <button
                  onClick={() => handleShare('native')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.05] transition-colors text-left border-t border-white/[0.08]"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-white">Share via...</div>
                    <div className="text-xs text-slate-500">Use native share sheet</div>
                  </div>
                </button>
              )}

              {/* Copy Link */}
              <button
                onClick={() => handleShare('copy')}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.05] transition-colors text-left border-t border-white/[0.08]"
              >
                <div className="w-10 h-10 bg-white/[0.06] rounded-lg flex items-center justify-center">
                  {copied ? (
                    <svg className="w-5 h-5 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-white">
                    {copied ? 'Copied!' : 'Copy Link'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {copied ? 'Link copied to clipboard' : 'Share anywhere'}
                  </div>
                </div>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

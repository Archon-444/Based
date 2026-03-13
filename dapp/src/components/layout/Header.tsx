import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiTrendingUp, FiDollarSign, FiAlertCircle } from 'react-icons/fi';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useSuiWallet } from '../../contexts/SuiWalletContext';
import { useChain } from '../../contexts/ChainContext';
import { Container } from './Container';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ThemeToggle';
import { ChainSwitcher } from '../ChainSwitcher';
import { ChainAwareWalletModal } from '../wallet/ChainAwareWalletModal';
import { useUSDCBalance } from '../../hooks/useUSDC';
import { useUSDCFaucet } from '../../hooks/useTransactions';
import { useChainCurrency } from '../../hooks/useChainCurrency';
import useWusdcWarning from '../../hooks/useWusdcWarning';
import { useIsAdmin } from '../../hooks/useRoles';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const { activeChain } = useChain();
  const navigate = useNavigate();

  // Aptos wallet state
  const {
    account: aptosAccount,
    disconnect: aptosDisconnect,
    connected: aptosConnected,
    wallet: aptosWallet,
  } = useWallet();

  // Sui wallet state
  const {
    account: suiAccount,
    disconnect: suiDisconnect,
    connected: suiConnected,
  } = useSuiWallet();

  // Determine active wallet based on chain
  const account = activeChain === 'aptos' ? aptosAccount : suiAccount;
  const connected = activeChain === 'aptos' ? aptosConnected : suiConnected;
  const activeWallet = activeChain === 'aptos' ? aptosWallet : null;

  const { formatted, isLoading: balanceLoading } = useUSDCBalance();
  const { claimFromFaucet, isLoading: faucetLoading, faucetAvailable } = useUSDCFaucet();
  const currency = useChainCurrency();
  const wusdcWarning = useWusdcWarning();
  const { hasRole: isAdmin } = useIsAdmin();

  // Debug logging for wallet state
  useEffect(() => {
    console.log('[Header] Wallet State Changed:', {
      activeChain,
      connected,
      hasAccount: !!account,
      address: account?.address,
      walletName: activeWallet?.name,
      aptosConnected,
      suiConnected,
    });
  }, [account, connected, activeWallet, activeChain, aptosConnected, suiConnected]);

  // Auto-disconnect wallet when chain switches
  useEffect(() => {
    const handleChainChange = async () => {
      try {
        // Disconnect Aptos wallet if it's connected but Sui is now active
        if (aptosConnected && activeChain === 'sui') {
          console.log('[Header] Chain switched to Sui, disconnecting Aptos wallet');
          await aptosDisconnect();
        }
        // Disconnect Sui wallet if it's connected but Aptos is now active
        if (suiConnected && activeChain === 'aptos') {
          console.log('[Header] Chain switched to Aptos, disconnecting Sui wallet');
          suiDisconnect();
        }
      } catch (error) {
        console.error('[Header] Error disconnecting wallet on chain switch:', error);
      }
    };

    handleChainChange();
  }, [activeChain, aptosConnected, suiConnected, aptosDisconnect, suiDisconnect]);

  // Close modal when wallet connects
  useEffect(() => {
    if (connected) {
      setWalletModalOpen(false);
    }
  }, [connected]);

  // Handle Escape key for mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const navItems = [
    { label: 'Markets', href: '/markets' },
    { label: 'Oracle', href: '/oracle' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Create', href: '/create' },
    { label: 'My Bets', href: '/dashboard' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'DAO', href: '/dao' },
    ...(isAdmin ? [
      { label: 'Admin Roles', href: '/admin/roles' },
      { label: 'Resolver', href: '/admin/resolver' },
    ] : []),
  ];

  const renderWalletButton = (context: 'desktop' | 'mobile' = 'desktop') => {
    if (connected) {
      return (
        <button
          onClick={() => setWalletModalOpen(true)}
          className={`group inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2 transition-all hover:bg-white/10 hover:shadow-[0_0_15px_rgba(0,212,255,0.2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${context === 'mobile' ? 'w-full justify-between' : ''
            }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[11px] uppercase tracking-wide text-gray-400">
                {currency.unitLabel}
              </span>
              <span className="text-sm font-bold text-white">
                {balanceLoading ? '...' : formatted}
              </span>
            </div>
            {account?.address && (
              <span className="rounded-lg bg-black/30 px-2 py-1 text-[11px] font-mono text-gray-300 border border-white/5">
                {account.address.slice(0, 6)}…{account.address.slice(-4)}
              </span>
            )}
          </div>
          <span className="hidden items-center text-xs font-medium text-primary-400 group-hover:text-primary-300 transition md:inline-flex">
            Manage
            <FiMenu className="ml-1 h-3.5 w-3.5" />
          </span>
        </button>
      );
    }

    return (
      <Button
        variant="primary"
        size={context === 'mobile' ? 'sm' : 'md'}
        onClick={() => setWalletModalOpen(true)}
        className={context === 'mobile' ? 'w-full' : ''}
      >
        Connect Wallet
      </Button>
    );
  };

  const handleDisconnect = useCallback(async () => {
    try {
      if (activeChain === 'aptos' && aptosConnected) {
        await aptosDisconnect();
      } else if (activeChain === 'sui' && suiConnected) {
        suiDisconnect();
      }
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  }, [activeChain, aptosConnected, suiConnected, aptosDisconnect, suiDisconnect]);

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#0A0E27]/80 backdrop-blur-xl border-b border-white/5 transition-colors">
        <Container>
          <div className="flex flex-col gap-4 py-4">
            {wusdcWarning.shouldShow && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                <FiAlertCircle className="mt-1 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <div className="space-y-1">
                  <p className="font-semibold">
                    Bridged wUSDC detected. Native Circle USDC is required on Sui.
                  </p>
                  <p className="opacity-80">
                    You currently hold approximately {wusdcWarning.balanceFormatted} wUSDC. Please migrate to native USDC using Circle&rsquo;s guide before trading.
                  </p>
                  <a
                    className="inline-flex items-center gap-1 font-medium text-amber-300 hover:text-amber-200 transition-colors"
                    href={wusdcWarning.migrationUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View migration guide
                    <FiTrendingUp className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-[#00D4FF] to-[#6B4CE6] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.3)] transition-all group-hover:shadow-[0_0_25px_rgba(0,212,255,0.5)] group-hover:-translate-y-0.5">
                  <FiTrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-xl font-display font-bold text-white tracking-tight">
                    MoveMarket
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#00D4FF]">
                    Prediction Protocol
                  </span>
                </div>
              </Link>

              <div className="flex items-center gap-2">
                <ChainSwitcher />
                <div className="hidden md:flex items-center gap-2">
                  {connected && (
                    <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-sm text-gray-400 hover:text-white">
                      Disconnect
                    </Button>
                  )}
                  {renderWalletButton('desktop')}
                </div>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition-colors focus:outline-none"
                  aria-label="Toggle menu"
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-navigation"
                >
                  {mobileMenuOpen ? (
                    <FiX className="w-5 h-5 text-white" />
                  ) : (
                    <FiMenu className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>

            <div className="hidden md:flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-[#141B3D]/50 px-5 py-3 backdrop-blur-md">
              <nav className="flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition-all hover:text-white hover:bg-white/5"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" to="/leaderboard" className="border-white/10 text-gray-300 hover:bg-white/10">
                  Leaderboard
                </Button>
                <Button variant="primary" size="sm" to="/create" className="bg-gradient-to-r from-[#00D4FF] to-[#6B4CE6] border-none shadow-[0_0_15px_rgba(0,212,255,0.3)] hover:shadow-[0_0_25px_rgba(0,212,255,0.5)]">
                  Create Market
                </Button>
              </div>
            </div>
          </div>
        </Container>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="mobile-navigation"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
            >
              <Container>
                <div className="py-4 space-y-4">
                  <div className="flex flex-col gap-3">
                    {renderWalletButton('mobile')}
                    {connected && (
                      <Button variant="ghost" size="sm" onClick={handleDisconnect}>
                        Disconnect
                      </Button>
                    )}
                    {faucetAvailable && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={claimFromFaucet}
                        loading={faucetLoading}
                        leftIcon={
                          currency.chain === 'sui'
                            ? <span className="text-sm font-semibold">◊</span>
                            : <FiDollarSign />
                        }
                      >
                        {currency.chain === 'sui' ? 'SUI Faucet' : 'Claim Testnet Funds'}
                      </Button>
                    )}
                  </div>

                  <nav className="space-y-2">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3 text-gray-700 dark:text-gray-300 font-medium hover:border-primary-500/70 hover:bg-primary-50/40 dark:hover:bg-primary-900/10 transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>

                  <div className="grid gap-2">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('/create');
                      }}
                    >
                      Create Market
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('/leaderboard');
                      }}
                    >
                      View Leaderboard
                    </Button>
                  </div>
                </div>
              </Container>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Wallet Connection Modal */}
      <ChainAwareWalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />
    </>
  );
};

export default Header;

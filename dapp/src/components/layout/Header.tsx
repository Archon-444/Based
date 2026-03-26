import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiTrendingUp, FiBell } from 'react-icons/fi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Container } from './Container';
import { Button } from '../ui/Button';
import { useUSDCBalance } from '../../hooks/useUSDC';
import { useMarkets } from '../../hooks/useMarkets';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationPanel } from './NotificationPanel';
import { useAccount } from 'wagmi';

const NAV_ITEMS = [
  { label: 'Markets', href: '/markets' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'My Bets', href: '/dashboard' },
  { label: 'Liquidity', href: '/liquidity' },
  { label: 'How It Works', href: '/how-it-works' },
];

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { address, isConnected } = useAccount();
  const { formatted, isLoading: balanceLoading } = useUSDCBalance();
  const { markets } = useMarkets();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(markets, new Map());

  const allNavItems = NAV_ITEMS;

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileMenuOpen]);

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.05] bg-[#080B18]/85 backdrop-blur-xl">
      <Container>
        <div className="flex flex-col gap-0">
          {/* Top bar */}
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center shadow-[0_0_16px_rgba(59,130,246,0.35)] group-hover:shadow-[0_0_24px_rgba(59,130,246,0.5)] transition-all group-hover:-translate-y-0.5">
                <FiTrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-black text-white tracking-tight">Based</span>
                <span className="block text-[9px] uppercase font-bold tracking-[0.15em] text-primary-400">
                  Prediction Protocol
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {allNavItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? 'text-white bg-white/[0.07]'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right: wallet + actions */}
            <div className="flex items-center gap-2">
              {/* Notification bell */}
              {isConnected && (
                <div className="relative">
                  <button
                    onClick={() => setNotifOpen((v) => !v)}
                    className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] transition-colors focus:outline-none"
                    aria-label="Notifications"
                  >
                    <FiBell className="w-4.5 h-4.5 text-slate-400" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white px-1 border-2 border-[#080B18]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <NotificationPanel
                    isOpen={notifOpen}
                    onClose={() => setNotifOpen(false)}
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onMarkRead={markRead}
                    onMarkAllRead={markAllRead}
                  />
                </div>
              )}

              {/* USDC Balance (desktop) */}
              {isConnected && address && (
                <div className="hidden md:flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-1.5">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">USDC</span>
                  <span className="text-sm font-bold text-white">
                    {balanceLoading ? '…' : formatted}
                  </span>
                </div>
              )}

              {/* Create Market (desktop) */}
              <Button
                variant="primary"
                size="sm"
                to="/create"
                className="hidden md:inline-flex rounded-xl border-0 !bg-gradient-to-r from-primary-500 to-secondary-600 shadow-[0_0_16px_rgba(59,130,246,0.25)] hover:shadow-[0_0_24px_rgba(59,130,246,0.4)] text-xs font-bold"
              >
                + Create
              </Button>

              {/* RainbowKit Connect Button */}
              <div className="hidden md:block">
                <ConnectButton
                  showBalance={false}
                  chainStatus="icon"
                  accountStatus="avatar"
                />
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] transition-colors focus:outline-none"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <FiX className="w-5 h-5 text-white" /> : <FiMenu className="w-5 h-5 text-white" />}
              </button>
            </div>
          </div>
        </div>
      </Container>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-white/[0.05] bg-[#080B18] overflow-hidden"
          >
            <Container>
              <div className="py-4 space-y-3">
                <div className="flex flex-col gap-2">
                  <ConnectButton
                    showBalance={false}
                    chainStatus="icon"
                    accountStatus="full"
                  />
                </div>

                <nav className="space-y-1">
                  {allNavItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'bg-white/[0.07] text-white'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <div className="grid gap-2 pt-1">
                  <Button variant="primary" size="md" onClick={() => { setMobileMenuOpen(false); navigate('/create'); }} className="rounded-xl border-0 !bg-gradient-to-r from-primary-500 to-secondary-600">
                    + Create Market
                  </Button>
                </div>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// WalletFacade removed — using wagmi/RainbowKit natively
const useWalletFacade = () => ({ loadWallet: () => {} });
import { motion } from 'framer-motion';
import {
  FiArrowRight,
  FiShield,
  FiZap,
  FiBarChart2,
  FiUsers,
  FiTrendingUp,
  FiLock,
} from 'react-icons/fi';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { useChain } from '../contexts/ChainContext';
import {
  BASE_TRENDING_MARKETS,
  PLATFORM_STATS,
} from '../data/mockMarkets';
import { FeaturedMarketCard } from '../components/FeaturedMarketCard';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: '🔍',
    iconBg: 'bg-primary-500/10 border border-primary-500/20',
    title: 'Browse Markets',
    description:
      'Explore prediction markets across crypto, sports, politics, and tech. Filter by category, volume, or time remaining.',
  },
  {
    step: '02',
    icon: '💰',
    iconBg: 'bg-secondary-500/10 border border-secondary-500/20',
    title: 'Place Your Prediction',
    description:
      'Buy YES or NO shares on any outcome. Our FPMM pricing engine provides instant quotes and fair prices every time.',
  },
  {
    step: '03',
    icon: '🏆',
    iconBg: 'bg-success-500/10 border border-success-500/20',
    title: 'Earn on Accuracy',
    description:
      'When the market resolves, correct predictions are worth $1 per share. Claim your winnings instantly on-chain.',
  },
];

const TRUST_FEATURES = [
  {
    Icon: FiShield,
    iconBg: 'bg-primary-500/10',
    iconColor: 'text-primary-400',
    title: 'Oracle-Powered Resolution',
    description:
      'Markets resolve automatically using Pyth Network price feeds and a multi-oracle consensus system with on-chain verification.',
  },
  {
    Icon: FiZap,
    iconBg: 'bg-success-500/10',
    iconColor: 'text-success-400',
    title: 'Sub-Second Settlement',
    description:
      'Built on Base for low-cost, fast transactions. Trades confirm in seconds with near-zero gas fees.',
  },
  {
    Icon: FiBarChart2,
    iconBg: 'bg-secondary-500/10',
    iconColor: 'text-secondary-400',
    title: 'Fully Transparent',
    description:
      'All market data lives on-chain. Every bet, resolution, and payout is publicly verifiable by anyone.',
  },
  {
    Icon: FiUsers,
    iconBg: 'bg-warning-500/10',
    iconColor: 'text-warning-400',
    title: 'Community Governed',
    description:
      'Market creation and protocol changes are governed by the community via on-chain DAO proposals and voting.',
  },
  {
    Icon: FiTrendingUp,
    iconBg: 'bg-error-500/10',
    iconColor: 'text-error-400',
    title: 'FPMM Pricing',
    description:
      'Fixed-product market maker ensures deep liquidity and fair pricing for every market from day one.',
  },
  {
    Icon: FiLock,
    iconBg: 'bg-cyan-500/10',
    iconColor: 'text-cyan-400',
    title: 'Non-Custodial',
    description:
      'Your funds stay in audited smart contracts. No third-party custody, no withdrawal delays, no KYC required.',
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { loadWallet } = useWalletFacade();
  const { activeChain } = useChain();
  const [isStarting, setIsStarting] = useState(false);

  const handleStartApp = async () => {
    setIsStarting(true);
    loadWallet();
    await new Promise((resolve) => setTimeout(resolve, 300));
    navigate('/markets');
  };

  const trendingMarkets = BASE_TRENDING_MARKETS;

  return (
    <div className="min-h-screen bg-[#080B18] text-white selection:bg-primary-500/30 overflow-x-hidden">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24">
        {/* Background atmosphere */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-60 left-1/2 -translate-x-1/2 w-[1000px] h-[700px] bg-gradient-radial from-primary-500/[0.07] via-secondary-500/[0.04] to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-64 w-[500px] h-[500px] bg-primary-600/[0.04] rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-64 w-[500px] h-[500px] bg-secondary-600/[0.04] rounded-full blur-3xl" />
        </div>

        <Container>
          <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Live indicator pill */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 backdrop-blur-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success-400" />
              </span>
              <span className="text-sm font-medium text-slate-300">
                Live on{' '}
                <span className="text-white font-semibold">
                  {'Base Network'}
                </span>
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              {...fadeUp}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="mb-6 text-5xl md:text-[72px] font-black tracking-tight text-white leading-[1.08]"
            >
              Predict Everything.
              <br />
              <span className="bg-gradient-to-r from-primary-400 via-secondary-400 to-primary-400 bg-clip-text text-transparent">
                Earn on Accuracy.
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              {...fadeUp}
              transition={{ duration: 0.55, delay: 0.18 }}
              className="mb-10 max-w-2xl text-lg md:text-xl text-slate-400 leading-relaxed"
            >
              The most transparent prediction market on Move. Trade on
              real-world events with instant settlement, oracle-powered
              resolution, and on-chain liquidity.
            </motion.p>

            {/* CTAs */}
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.55, delay: 0.26 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartApp}
                loading={isStarting}
                rightIcon={<FiArrowRight />}
                className="rounded-xl px-8 py-4 text-base font-semibold border-0 !bg-gradient-to-r from-primary-500 to-secondary-600 shadow-[0_0_32px_rgba(59,130,246,0.3)] hover:shadow-[0_0_44px_rgba(59,130,246,0.48)] transition-all duration-300"
              >
                {isStarting ? 'Launching…' : 'Explore Markets'}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                to="/how-it-works"
                className="rounded-xl px-8 py-4 text-base font-semibold text-slate-300 border border-white/[0.1] hover:bg-white/[0.05] hover:text-white hover:border-white/[0.18] transition-all"
              >
                How It Works
              </Button>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* ── Stats Bar ────────────────────────────────────── */}
      <section className="border-y border-white/[0.05] bg-white/[0.015] backdrop-blur-sm">
        <Container>
          <div className="py-5 grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.06]">
            {PLATFORM_STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="flex flex-col items-center gap-1 px-6 first:pl-0 last:pr-0"
              >
                <span className="text-2xl font-black text-white tracking-tight">
                  {stat.value}
                </span>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Featured Markets ─────────────────────────────── */}
      <section className="py-20 md:py-28">
        <Container>
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-2">
                Live Markets
              </p>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Trending Right Now
              </h2>
            </div>
            <Link
              to="/markets"
              className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors group"
            >
              View all markets
              <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {trendingMarkets.map((market, index) => (
              <motion.div
                key={market.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08 + index * 0.1 }}
              >
                <FeaturedMarketCard
                  index={index}
                  title={market.question}
                  category={market.category}
                  volume={market.volume}
                  odds={market.odds}
                  endsIn={market.endsIn}
                  participants={market.participants}
                  onClick={() => navigate(`/market/${market.id}`)}
                />
              </motion.div>
            ))}
          </div>

          <div className="mt-8 flex justify-center md:hidden">
            <Link
              to="/markets"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
            >
              View all markets <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Container>
      </section>

      {/* ── How It Works ─────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-white/[0.05]">
        <Container>
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-3">
              Simple by Design
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-10">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="relative flex flex-col gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-8 hover:border-white/[0.1] transition-colors"
              >
                {/* Step number watermark */}
                <div className="absolute top-6 right-7 text-6xl font-black text-white/[0.03] select-none leading-none">
                  {step.step}
                </div>

                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${step.iconBg}`}
                >
                  {step.icon}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Trust & Features ─────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-white/[0.05]">
        <Container>
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-3">
              Why Based
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Built for Serious Traders
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TRUST_FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="flex items-start gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-white/[0.1] hover:bg-white/[0.03] transition-all duration-200"
              >
                <div
                  className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl ${feature.iconBg}`}
                >
                  <feature.Icon className={`h-5 w-5 ${feature.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1 text-sm">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="py-24 md:py-32 border-t border-white/[0.05]">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-primary-500/[0.08] via-secondary-600/[0.06] to-transparent p-12 md:p-20 text-center">
            {/* Glow */}
            <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-primary-500/[0.1] to-transparent rounded-full blur-3xl" />

            <h2 className="relative text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
              Ready to start predicting?
            </h2>
            <p className="relative mb-10 text-lg text-slate-400 max-w-xl mx-auto">
              Join thousands of traders forecasting the future on the most
              transparent prediction market in DeFi.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={handleStartApp}
              rightIcon={<FiArrowRight />}
              className="rounded-xl px-10 py-4 text-base font-semibold border-0 !bg-gradient-to-r from-primary-500 to-secondary-600 shadow-[0_0_40px_rgba(59,130,246,0.35)] hover:shadow-[0_0_60px_rgba(59,130,246,0.5)] transition-all"
            >
              Launch App
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default LandingPage;

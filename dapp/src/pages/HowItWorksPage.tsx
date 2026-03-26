import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiCheckCircle,
  FiDollarSign,
  FiTrendingUp,
  FiShield,
  FiClock,
  FiUsers,
  FiArrowRight,
  FiBarChart2,
  FiAward,
  FiCreditCard,
} from 'react-icons/fi';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { PayoutCalculator } from '../components/docs/PayoutCalculator';

const STEPS = [
  {
    number: '01',
    Icon: FiCreditCard,
    title: 'Connect Wallet',
    description: 'Connect your Coinbase Smart Wallet to get started. No KYC required.',
    details: [
      'Install a compatible wallet extension for your selected chain',
      'Click "Connect Wallet" in the top right',
      'Approve the connection request',
      'Your wallet address will appear in the header',
    ],
    color: 'text-primary-400',
    bg: 'bg-primary-500/10',
    border: 'border-primary-500/20',
  },
  {
    number: '02',
    Icon: FiDollarSign,
    title: 'Get USDC',
    description: 'Fund your wallet with USDC on Base. Based supports stablecoin wagers with near-zero gas fees.',
    details: [
      'Bridge USDC using LayerZero, Wormhole, or another supported bridge',
      'Use a DEX to swap ETH into USDC on Base',
      'Minimum bet size is typically 1 USDC',
      'Keep some ETH for gas (typically < $0.01)',
    ],
    color: 'text-success-400',
    bg: 'bg-success-500/10',
    border: 'border-success-500/20',
  },
  {
    number: '03',
    Icon: FiBarChart2,
    title: 'Browse Markets',
    description: 'Explore active prediction markets across crypto, sports, politics, and technology.',
    details: [
      'Filter by category, end date, or volume',
      'View detailed market information and odds',
      'Check the resolution criteria',
      'Review trading volume and participant count',
    ],
    color: 'text-secondary-400',
    bg: 'bg-secondary-500/10',
    border: 'border-secondary-500/20',
  },
  {
    number: '04',
    Icon: FiTrendingUp,
    title: 'Place Prediction',
    description: 'Choose your outcome, enter your bet amount, and confirm the on-chain transaction.',
    details: [
      'Select YES or NO based on your prediction',
      'Enter the amount you want to bet',
      'Review the estimated payout and fees',
      'Confirm the transaction in your wallet',
    ],
    color: 'text-warning-400',
    bg: 'bg-warning-500/10',
    border: 'border-warning-500/20',
  },
  {
    number: '05',
    Icon: FiClock,
    title: 'Await Resolution',
    description: 'After the market end date, an oracle or admin resolves the market based on real-world outcomes.',
    details: [
      'Markets close at the specified end date',
      'Pyth Network price feeds and trusted oracles verify outcomes',
      'Resolution is transparent and verifiable on-chain',
      'Disputed outcomes can be escalated',
    ],
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
  {
    number: '06',
    Icon: FiAward,
    title: 'Claim Winnings',
    description: 'If your prediction was correct, claim your winnings directly to your wallet. Payouts are instant.',
    details: [
      'Winners are determined by market outcome',
      'Claim winnings from your My Bets dashboard',
      'Instant payout in USDC',
      'No withdrawal limits or delays',
    ],
    color: 'text-success-400',
    bg: 'bg-success-500/10',
    border: 'border-success-500/20',
  },
];

const ODDS_CARDS = [
  {
    Icon: FiBarChart2,
    iconColor: 'text-primary-400',
    iconBg: 'bg-primary-500/10',
    title: 'Dynamic Odds',
    description: 'Odds change based on the ratio of YES and NO bets. More popular outcomes have lower potential returns.',
  },
  {
    Icon: FiUsers,
    iconColor: 'text-secondary-400',
    iconBg: 'bg-secondary-500/10',
    title: 'Market-Driven',
    description: 'Prices reflect the collective wisdom of all participants, creating accurate probability estimates.',
  },
  {
    Icon: FiDollarSign,
    iconColor: 'text-success-400',
    iconBg: 'bg-success-500/10',
    title: 'Fair Payouts',
    description: 'Winners share the losing side pool proportionally to their bet size, minus a small platform fee.',
  },
];

const BENEFITS = [
  { Icon: FiShield, iconColor: 'text-primary-400', iconBg: 'bg-primary-500/10', title: 'Secure & Transparent', description: 'All bets are stored on-chain, ensuring complete transparency and immutability.' },
  { Icon: FiDollarSign, iconColor: 'text-success-400', iconBg: 'bg-success-500/10', title: 'Low Fees', description: 'Base offers near-zero transaction fees, typically less than $0.01 per transaction.' },
  { Icon: FiTrendingUp, iconColor: 'text-warning-400', iconBg: 'bg-warning-500/10', title: 'Instant Settlement', description: 'Fast block times mean your bets are confirmed in seconds, not minutes or hours.' },
  { Icon: FiCheckCircle, iconColor: 'text-secondary-400', iconBg: 'bg-secondary-500/10', title: 'Non-Custodial', description: 'Your funds remain in audited smart contracts. Winners can withdraw immediately after resolution.' },
];

const FAQS = [
  { q: 'What is a prediction market?', a: 'A prediction market is a platform where users bet on the outcomes of future events. Prices reflect the collective probability assessment of all participants.' },
  { q: 'How are markets resolved?', a: 'Markets are resolved by Pyth Network price feeds or trusted oracle managers who verify real-world outcomes. The process is transparent and auditable on-chain.' },
  { q: 'What happens if I bet on the losing side?', a: 'If you bet on the losing outcome, your stake is distributed among winners proportionally. You will lose your initial bet amount.' },
  { q: 'Can I sell my position before the market ends?', a: 'Currently positions are locked until market resolution. Secondary market trading is on our roadmap.' },
  { q: 'What fees do you charge?', a: 'We charge a 2% platform fee on winning payouts. No fees to place bets — only standard network gas (typically < $0.01).' },
  { q: 'Is my money safe?', a: 'All funds are held in audited smart contracts on Base. The platform cannot access user funds, and all transactions are transparent on-chain.' },
];

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#080B18] text-white selection:bg-primary-500/30">
      <Container className="py-8 md:py-14">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="text-center max-w-3xl mx-auto mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-3">Learn</p>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-5">How It Works</h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              Discover how to participate in decentralized prediction markets on Base.
              From connecting your wallet to claiming winnings — every step, explained.
            </p>
          </motion.div>
        </section>

        {/* ── 6 Steps ──────────────────────────────────────────────── */}
        <section className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3">6 Simple Steps</h2>
            <p className="text-slate-500">Follow these steps to make your first prediction and start earning</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="relative rounded-2xl border border-[#1C2537] bg-[#0D1224] p-6"
                style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
              >
                <div className="absolute top-5 right-6 text-5xl font-black text-white/[0.03] leading-none select-none">
                  {step.number}
                </div>
                <div className={`inline-flex w-11 h-11 items-center justify-center rounded-xl border mb-4 ${step.bg} ${step.border}`}>
                  <step.Icon className={`w-5 h-5 ${step.color}`} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">{step.description}</p>
                <ul className="space-y-2">
                  {step.details.map((d, di) => (
                    <li key={di} className="flex items-start gap-2 text-xs text-slate-500">
                      <FiCheckCircle className="w-3.5 h-3.5 text-success-400 flex-shrink-0 mt-0.5" />
                      {d}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Understanding Odds ───────────────────────────────────── */}
        <section className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3">Understanding Odds</h2>
            <p className="text-slate-500">Learn how prediction market odds work and how payouts are calculated</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {ODDS_CARDS.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex items-start gap-4 rounded-2xl border border-[#1C2537] bg-[#0D1224] p-5"
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                  <card.Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm mb-1">{card.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{card.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <PayoutCalculator />
          </motion.div>
        </section>

        {/* ── Why Choose Us ────────────────────────────────────────── */}
        <section className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3">Why Based</h2>
            <p className="text-slate-500">Built on Base for the best prediction market experience</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="rounded-2xl border border-[#1C2537] bg-[#0D1224] p-5 hover:border-white/[0.1] transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${b.iconBg}`}>
                  <b.Icon className={`w-4.5 h-4.5 ${b.iconColor}`} />
                </div>
                <h3 className="font-bold text-white text-sm mb-1">{b.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{b.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <section className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3">FAQ</h2>
            <p className="text-slate-500">Got questions? We have answers.</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="rounded-2xl border border-[#1C2537] bg-[#0D1224] p-5"
              >
                <h3 className="font-bold text-white text-sm mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-primary-500/[0.08] via-secondary-600/[0.06] to-transparent p-12 text-center">
            <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-primary-500/[0.12] to-transparent rounded-full blur-3xl" />
            <h2 className="relative text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
              Ready to make your first prediction?
            </h2>
            <p className="relative text-slate-400 mb-8 max-w-xl mx-auto">
              Join thousands of traders forecasting the future on the most transparent prediction market in DeFi.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="primary"
                size="lg"
                to="/markets"
                rightIcon={<FiArrowRight />}
                className="rounded-xl border-0 !bg-gradient-to-r from-primary-500 to-secondary-600 shadow-[0_0_32px_rgba(59,130,246,0.3)]"
              >
                Browse Markets
              </Button>
              <Button
                variant="ghost"
                size="lg"
                to="/create"
                className="rounded-xl border border-white/[0.1] text-slate-300 hover:bg-white/[0.05] hover:text-white"
              >
                + Create Market
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-slate-500">
              {['No KYC Required', '2% Platform Fee', 'Instant Payouts', '100% On-Chain'].map((feat) => (
                <span key={feat} className="flex items-center gap-1.5">
                  <FiCheckCircle className="w-4 h-4 text-success-400" />
                  {feat}
                </span>
              ))}
            </div>
          </div>
        </section>
      </Container>
    </div>
  );
};

export default HowItWorksPage;

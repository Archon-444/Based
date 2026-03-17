import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiChevronDown,
  FiChevronUp,
  FiHelpCircle,
  FiShield,
  FiDollarSign,
  FiTrendingUp,
  FiUsers,
  FiClock,
  FiAlertCircle,
  FiArrowRight,
} from 'react-icons/fi';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';

interface FAQItem {
  category: string;
  icon: React.ElementType;
  color: string;
  questions: { question: string; answer: string }[];
}

const FAQ_CATEGORIES: FAQItem[] = [
  {
    category: 'Getting Started',
    icon: FiHelpCircle,
    color: 'text-primary-400',
    questions: [
      {
        question: 'What is Prophecy?',
        answer:
          'Prophecy is a decentralized prediction market platform built on Base. It lets you trade on the outcomes of real-world events using USDC stablecoin. All transactions are transparent, non-custodial, and settled on-chain.',
      },
      {
        question: 'How do I get started?',
        answer:
          'Connect your Coinbase Smart Wallet to Prophecy, get USDC using our testnet faucet, then browse markets and place your first prediction. The whole process takes under 5 minutes.',
      },
      {
        question: 'Do I need to create an account?',
        answer:
          'No. Your wallet is your account — no email, no KYC, no sign-up. Just connect and predict.',
      },
      {
        question: 'What wallets are supported?',
        answer:
          'Prophecy supports Coinbase Smart Wallet for seamless onboarding on Base.',
      },
    ],
  },
  {
    category: 'Markets & Betting',
    icon: FiTrendingUp,
    color: 'text-secondary-400',
    questions: [
      {
        question: 'What is a prediction market?',
        answer:
          'A prediction market lets you buy and sell shares representing the probability of a future outcome. Market prices emerge from collective participant wisdom — 70% odds means participants collectively assign a 70% probability to that outcome.',
      },
      {
        question: 'What types of markets are available?',
        answer:
          'Markets cover crypto (price predictions, protocol upgrades), technology, sports, politics, and entertainment. New categories are added based on community governance.',
      },
      {
        question: 'How are market odds determined?',
        answer:
          'Odds are set dynamically by our Fixed-Product Market Maker (FPMM). As more capital enters one side, its odds shift. This creates a self-balancing market where prices always reflect current consensus probability.',
      },
      {
        question: 'Can I create my own market?',
        answer:
          'Market creation is currently limited to verified creators to maintain quality. A community governance system for open market creation is on the roadmap.',
      },
      {
        question: 'What is the minimum bet?',
        answer:
          '1 USDC minimum. No maximum, though large bets will move odds significantly.',
      },
    ],
  },
  {
    category: 'Payments & Fees',
    icon: FiDollarSign,
    color: 'text-success-400',
    questions: [
      {
        question: 'What currency do I use?',
        answer:
          'All bets use USDC (USD Coin), a 1:1 USD-pegged stablecoin. On testnet, get free test USDC from our in-app faucet.',
      },
      {
        question: 'What fees does Prophecy charge?',
        answer:
          'A 2% platform fee on winning payouts only. Losers pay nothing. Gas fees on Base are near-zero. No deposit, withdrawal, or maintenance fees.',
      },
      {
        question: 'How do I withdraw winnings?',
        answer:
          'After a market resolves, click "Claim Winnings" on your dashboard. USDC transfers directly to your wallet instantly — no delays, no review.',
      },
    ],
  },
  {
    category: 'Market Resolution',
    icon: FiClock,
    color: 'text-warning-400',
    questions: [
      {
        question: 'How are markets resolved?',
        answer:
          'Markets resolve using objective data from trusted oracle sources (e.g. Pyth Network). Each market specifies its resolution criteria upfront. Once the event occurs, the oracle submits the result and the smart contract auto-distributes winnings.',
      },
      {
        question: 'What happens if a result is disputed?',
        answer:
          'We use a multi-oracle system. Conflicting oracle results trigger a dispute process and delay payouts until consensus is reached. A decentralized arbitration system is on the roadmap.',
      },
      {
        question: 'Can a market be cancelled?',
        answer:
          'Only in exceptional cases: event cancelled, resolution criteria become unverifiable, or a critical contract bug. All bets are refunded in full if cancelled.',
      },
    ],
  },
  {
    category: 'Security & Safety',
    icon: FiShield,
    color: 'text-cyan-400',
    questions: [
      {
        question: 'Is my money safe?',
        answer:
          'Funds are secured by audited Move smart contracts — not held by Prophecy. The Move language has built-in safety features preventing common exploits. Professional audits are planned before mainnet.',
      },
      {
        question: 'Can Prophecy access my funds?',
        answer:
          'No. Prophecy cannot access, freeze, or control your funds. When you bet, funds go directly to the smart contract. Only you can claim winnings.',
      },
      {
        question: 'Has the smart contract been audited?',
        answer:
          'The testnet version has not yet been audited. Before mainnet launch, contracts will undergo comprehensive security audits. A bug bounty program will also launch.',
      },
    ],
  },
  {
    category: 'Legal & Compliance',
    icon: FiAlertCircle,
    color: 'text-error-400',
    questions: [
      {
        question: 'Is prediction market betting legal?',
        answer:
          'Legality varies by jurisdiction. Users are responsible for understanding and complying with local laws. Prophecy is currently for educational and entertainment purposes on testnet.',
      },
      {
        question: 'Do I pay taxes on winnings?',
        answer:
          'Most jurisdictions treat prediction market winnings as taxable income or capital gains. You are responsible for compliance. Prophecy does not provide tax advice.',
      },
      {
        question: 'What is your KYC policy?',
        answer:
          'No KYC on testnet. Mainnet KYC requirements will depend on the regulatory landscape at launch.',
      },
    ],
  },
];

export const FAQPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggle = (index: string) => setOpenIndex(openIndex === index ? null : index);

  return (
    <div className="min-h-screen bg-[#080B18] text-white">
      {/* Hero */}
      <section className="relative pt-20 pb-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-radial from-primary-500/[0.06] to-transparent rounded-full blur-3xl" />
        </div>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto relative z-10"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-400 mb-6">
              Help Center
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              Everything you need to know about Prophecy, prediction markets, and on-chain betting.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* FAQ Categories */}
      <section className="pb-24">
        <Container size="md">
          <div className="space-y-10">
            {FAQ_CATEGORIES.map((category, categoryIndex) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: categoryIndex * 0.06 }}
              >
                {/* Category header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.04] flex items-center justify-center">
                    <category.icon className={`w-4.5 h-4.5 ${category.color}`} />
                  </div>
                  <h2 className="text-lg font-bold text-white">{category.category}</h2>
                </div>

                {/* Questions */}
                <div className="space-y-2">
                  {category.questions.map((item, qi) => {
                    const key = `${categoryIndex}-${qi}`;
                    const isOpen = openIndex === key;

                    return (
                      <div
                        key={key}
                        className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                          isOpen
                            ? 'border-white/[0.1] bg-[#0D1224]'
                            : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.09] hover:bg-white/[0.03]'
                        }`}
                      >
                        <button
                          onClick={() => toggle(key)}
                          className="w-full text-left flex items-start justify-between gap-4 px-5 py-4 focus:outline-none"
                        >
                          <span className="text-sm font-semibold text-white leading-snug">
                            {item.question}
                          </span>
                          <span className="flex-shrink-0 mt-0.5">
                            {isOpen ? (
                              <FiChevronUp className="w-4 h-4 text-primary-400" />
                            ) : (
                              <FiChevronDown className="w-4 h-4 text-slate-500" />
                            )}
                          </span>
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                            >
                              <div className="px-5 pb-5 border-t border-white/[0.06]">
                                <p className="text-sm text-slate-400 leading-relaxed pt-4">
                                  {item.answer}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="border-t border-white/[0.05] py-20">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-primary-500/[0.07] via-secondary-600/[0.05] to-transparent p-12 text-center">
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-b from-primary-500/[0.08] to-transparent rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col items-center gap-6 mb-8">
              <div className="w-14 h-14 rounded-2xl border border-white/[0.08] bg-white/[0.05] flex items-center justify-center">
                <FiHelpCircle className="w-7 h-7 text-primary-400" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-3">Still have questions?</h2>
                <p className="text-slate-400 max-w-md mx-auto">
                  Read our full guide or join the community on Discord.
                </p>
              </div>
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="primary"
                size="md"
                to="/how-it-works"
                rightIcon={<FiArrowRight />}
                className="rounded-xl border-0 !bg-gradient-to-r from-primary-500 to-secondary-600"
              >
                How It Works
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => window.open('https://discord.gg/prophecy', '_blank')}
                className="rounded-xl border border-white/[0.1] text-slate-300 hover:bg-white/[0.05] hover:text-white hover:border-white/[0.18]"
              >
                Join Discord
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Quick links */}
      <section className="pb-24">
        <Container>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: FiHelpCircle, color: 'text-primary-400', bg: 'bg-primary-500/10', title: 'How It Works', desc: 'Learn the basics of prediction markets', href: '/how-it-works' },
              { icon: FiTrendingUp, color: 'text-success-400', bg: 'bg-success-500/10', title: 'Browse Markets', desc: 'Explore active markets and start trading', href: '/markets' },
              { icon: FiUsers, color: 'text-warning-400', bg: 'bg-warning-500/10', title: 'Your Dashboard', desc: 'Track your bets, positions, and winnings', href: '/dashboard' },
            ].map((card) => (
              <Link
                key={card.title}
                to={card.href}
                className="group flex items-start gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-white/[0.1] hover:bg-white/[0.04] transition-all"
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm mb-1 group-hover:text-primary-300 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500">{card.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
};

export default FAQPage;

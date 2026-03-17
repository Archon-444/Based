import React from 'react';
import { motion } from 'framer-motion';
import { FiLayers, FiTrendingUp, FiShield, FiGlobe } from 'react-icons/fi';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { useSDKContext } from '../contexts/SDKContext';
import { useMarkets } from '../hooks/useMarkets';
import { fromMicroUSDC } from '../utils/validation';

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatUSD = (v: number): string => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
};

// ── Protocol stat card ────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon, color, bg }) => (
  <div
    className="rounded-2xl border border-[#1C2537] bg-[#0D1224] p-5 flex items-start gap-4"
    style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)' }}
  >
    <div className={`flex-shrink-0 p-2.5 rounded-xl ${bg}`}>
      <div className={`w-5 h-5 ${color}`}>{icon}</div>
    </div>
    <div>
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">{label}</div>
      <div className="text-2xl font-black text-white tabular-nums">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  </div>
);

// ── Roadmap item ──────────────────────────────────────────────────────────────

interface RoadmapItemProps {
  phase: string;
  title: string;
  description: string;
  status: 'live' | 'building' | 'planned';
}

const STATUS_STYLE: Record<RoadmapItemProps['status'], string> = {
  live:     'bg-success-500/15 text-success-300 border-success-500/25',
  building: 'bg-warning-500/15 text-warning-300 border-warning-500/25',
  planned:  'bg-white/[0.06] text-slate-400 border-white/[0.08]',
};

const RoadmapItem: React.FC<RoadmapItemProps> = ({ phase, title, description, status }) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center flex-shrink-0">
      <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold ${STATUS_STYLE[status]}`}>
        {status === 'live' ? '✓' : phase}
      </div>
      <div className="w-px flex-1 bg-white/[0.06] mt-2" />
    </div>
    <div className="pb-6">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${STATUS_STYLE[status]}`}>
          {status === 'building' ? 'In Progress' : status}
        </span>
      </div>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  </div>
);

// ── Main Page ──────────────────────────────────────────────────────────────────

const LiquidityPage: React.FC = () => {
  const { chain } = useSDKContext();
  const { markets, isLoading } = useMarkets();

  const totalTVL = React.useMemo(() => {
    return markets.reduce((sum, m) => sum + fromMicroUSDC(parseFloat(m.totalVolume) || 0), 0);
  }, [markets]);

  const activeMarkets = markets.filter((m) => m.status !== 'resolved' && m.resolvedAt == null).length;
  const resolvedMarkets = markets.filter((m) => m.status === 'resolved' || m.resolvedAt != null).length;

  return (
    <div className="min-h-screen bg-[#080B18] text-white selection:bg-primary-500/30">
      <Container className="py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          {/* ── Header ──────────────────────────────────────────────── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-2">Protocol</p>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
              Liquidity & Pool Stats
            </h1>
            <p className="text-slate-400 text-base max-w-xl">
              Prediction market liquidity is provided by participants placing bets. The FPMM model automatically
              prices outcomes based on pool weights — no separate LP step required to earn.
            </p>
          </div>

          {/* ── Live stats ──────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Value Locked"
              value={isLoading ? '—' : formatUSD(totalTVL)}
              sub={`Across ${markets.length} markets`}
              icon={<FiLayers />}
              color="text-primary-400"
              bg="bg-primary-500/10"
            />
            <StatCard
              label="Active Markets"
              value={isLoading ? '—' : activeMarkets.toString()}
              sub="Open for predictions"
              icon={<FiTrendingUp />}
              color="text-success-400"
              bg="bg-success-500/10"
            />
            <StatCard
              label="Resolved Markets"
              value={isLoading ? '—' : resolvedMarkets.toString()}
              sub="Winnings claimed"
              icon={<FiShield />}
              color="text-secondary-400"
              bg="bg-secondary-500/10"
            />
            <StatCard
              label="Active Chain"
              value="Base"
              sub="USDC-denominated pools"
              icon={<FiGlobe />}
              color="text-warning-400"
              bg="bg-warning-500/10"
            />
          </div>

          {/* ── How it works ────────────────────────────────────────── */}
          <div className="grid md:grid-cols-2 gap-6">
            <div
              className="rounded-2xl border border-[#1C2537] bg-[#0D1224] p-6"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
            >
              <h2 className="text-lg font-bold text-white mb-4">How FPMM Pricing Works</h2>
              <div className="space-y-3 text-sm text-slate-400">
                <p>
                  Prophecy uses a <strong className="text-white">Fixed Product Market Maker (FPMM)</strong> to price
                  outcomes automatically. Each market starts with equal probability across all outcomes.
                </p>
                <p>
                  As bets flow in, outcome pools grow. The protocol prices each outcome by the ratio of its pool to the
                  total — so popular outcomes get shorter odds, and underdog bets offer higher returns.
                </p>
                <p>
                  Winners claim proportional payouts from the loser pool. A <strong className="text-white">2% protocol
                  fee</strong> is deducted at settlement, contributing to the DAO treasury.
                </p>
              </div>
            </div>

            <div
              className="rounded-2xl border border-[#1C2537] bg-[#0D1224] p-6"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
            >
              <h2 className="text-lg font-bold text-white mb-4">Your Participation = Your Liquidity</h2>
              <div className="space-y-3 text-sm text-slate-400">
                <p>
                  In a FPMM model, <strong className="text-white">every bet is a form of liquidity provision</strong>.
                  You're not just predicting — you're deepening the market and improving price discovery for other
                  participants.
                </p>
                <p>
                  Unlike traditional AMMs, you don't need to deposit matching tokens. Simply predict on outcomes you
                  believe in and earn from correct calls.
                </p>
              </div>
              <div className="mt-5 flex gap-3">
                <Button variant="primary" to="/markets" className="text-sm">
                  Browse Markets
                </Button>
                <Button variant="ghost" to="/dashboard" className="text-sm border border-white/[0.08] text-slate-300">
                  My Positions
                </Button>
              </div>
            </div>
          </div>

          {/* ── Liquidity roadmap ────────────────────────────────────── */}
          <div>
            <h2 className="text-xl font-bold text-white mb-6">LP Feature Roadmap</h2>
            <div
              className="rounded-2xl border border-[#1C2537] bg-[#0D1224] p-6"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
            >
              <div className="space-y-0">
                <RoadmapItem
                  phase="1"
                  title="Automated Market Making (FPMM)"
                  description="On-chain FPMM pricing active. All bet capital contributes to outcome pool liquidity. Odds update continuously with each new prediction."
                  status="live"
                />
                <RoadmapItem
                  phase="2"
                  title="Protocol Fee Treasury"
                  description="A 2% settlement fee accrues to the DAO treasury, funding reviewer incentives and future LP rewards. Fee accounting is on-chain and auditable."
                  status="live"
                />
                <RoadmapItem
                  phase="3"
                  title="Dedicated LP Token Contracts"
                  description="Passive liquidity providers will be able to deposit USDC into market pools and receive LP tokens representing their share of fee revenue, without picking sides."
                  status="building"
                />
                <RoadmapItem
                  phase="4"
                  title="Add / Remove Liquidity UI"
                  description="In-app interface to deposit or withdraw LP positions, view accrued fees, and track pool share percentage — once the LP token contracts are audited and deployed."
                  status="planned"
                />
                <RoadmapItem
                  phase="5"
                  title="LP Incentive Rewards"
                  description="Liquidity mining program: LP token holders earn governance points and token distributions proportional to pool depth and market activity."
                  status="planned"
                />
              </div>
            </div>
          </div>

          {/* ── CTA ─────────────────────────────────────────────────── */}
          <div
            className="rounded-2xl border border-primary-500/20 bg-primary-500/[0.05] p-8 text-center"
          >
            <h2 className="text-xl font-bold text-white mb-2">Ready to predict?</h2>
            <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
              Every prediction you place contributes to market depth and earns you a share of the payout pool
              when you're right.
            </p>
            <Button variant="primary" to="/markets" className="px-8">
              Explore Active Markets
            </Button>
          </div>
        </motion.div>
      </Container>
    </div>
  );
};

export default LiquidityPage;

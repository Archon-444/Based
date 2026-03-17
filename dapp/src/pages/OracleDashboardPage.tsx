import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    FiShield,
    FiTrendingUp,
    FiAward,
    FiCheckCircle,
    FiAlertCircle,
    FiLock,
    FiUsers,
    FiZap,
    FiClock,
    FiHash,
} from 'react-icons/fi';
import { Container } from '../components/layout/Container';

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_ORACLE_STATS = {
    totalOracles: 12,
    totalStaked: '1,240,000 ETH',
    resolvedMarkets: 87,
    pendingMarkets: 4,
};

const MOCK_LEADERBOARD = [
    { rank: 1, name: 'Oracle Prime', address: '0x1a2b3c4d', reputation: 980, accuracy: 98, stake: '100,000 ETH', status: 'active' },
    { rank: 2, name: 'Nexus Oracle', address: '0x5e6f7a8b', reputation: 950, accuracy: 96, stake: '85,000 ETH', status: 'active' },
    { rank: 3, name: 'DataSage', address: '0x9c0d1e2f', reputation: 920, accuracy: 95, stake: '72,000 ETH', status: 'active' },
    { rank: 4, name: 'TruthNode', address: '0x3a4b5c6d', reputation: 870, accuracy: 91, stake: '60,000 ETH', status: 'active' },
    { rank: 5, name: 'BlockOracle', address: '0x7e8f9a0b', reputation: 810, accuracy: 88, stake: '50,000 ETH', status: 'suspended' },
];

const MOCK_PENDING_MARKETS = [
    { id: 42, question: 'Will BTC exceed $100k before Q3 2026?', deadline: '23h 14m', submissions: 2, required: 3 },
    { id: 38, question: 'Will Ethereum 2.0 staking yield exceed 8% APY?', deadline: '5h 02m', submissions: 1, required: 3 },
    { id: 35, question: 'Will the Fed cut rates in 2026 Q2?', deadline: '1h 45m', submissions: 3, required: 3 },
    { id: 29, question: 'Will Base TVL surpass $5B?', deadline: '47m', submissions: 0, required: 3 },
];

// ─── Subcomponents ────────────────────────────────────────────────────────────

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; glow?: string }> = ({
    icon, label, value, glow = 'rgba(0,212,255,0.15)'
}) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-2xl border border-[#1C2537] bg-[#0D1224] p-6"
        style={{ boxShadow: `0 0 30px ${glow}` }}
    >
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm text-slate-400 mb-1">{label}</p>
                <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 text-[#00D4FF]">
                {icon}
            </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#00D4FF] to-[#6B4CE6] opacity-60" />
    </motion.div>
);

const ReputationBar: React.FC<{ value: number }> = ({ value }) => (
    <div className="flex items-center gap-3">
        <div className="flex-1 bg-black/30 rounded-full h-1.5 overflow-hidden border border-white/5">
            <div
                className="h-full rounded-full bg-gradient-to-r from-[#00D4FF] to-[#6B4CE6]"
                style={{ width: `${value / 10}%` }}
            />
        </div>
        <span className="text-xs font-mono text-slate-300 min-w-[36px] text-right">{value}</span>
    </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const OracleDashboardPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'pending' | 'register'>('leaderboard');
    const [voteModal, setVoteModal] = useState<number | null>(null);
    const [voteOutcome, setVoteOutcome] = useState<string>('');
    const [confidence, setConfidence] = useState<number>(80);

    const handleVoteSubmit = (marketId: number) => {
        // TODO: wire to submit_oracle_vote on-chain call
        alert(`Submitting vote for Market #${marketId}: ${voteOutcome} (${confidence}% confidence)`);
        setVoteModal(null);
        setVoteOutcome('');
        setConfidence(80);
    };

    return (
        <div className="min-h-screen bg-[#080B18] text-white">
            {/* Hero Banner */}
            <div className="relative overflow-hidden border-b border-white/[0.05]">
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        background:
                            'radial-gradient(ellipse at 70% 50%, rgba(107,76,230,0.4) 0%, transparent 60%), radial-gradient(ellipse at 30% 50%, rgba(0,212,255,0.3) 0%, transparent 60%)',
                    }}
                />
                <Container>
                    <div className="py-12 relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#6B4CE6] shadow-[0_0_20px_rgba(0,212,255,0.4)]">
                                <FiShield className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-[#00D4FF]">Oracle Network</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
                            Oracle Dashboard
                        </h1>
                        <p className="text-lg text-slate-400 max-w-2xl">
                            Multi-oracle consensus prevents market manipulation. Join the network of independent
                            truth providers securing Prophecy's prediction outcomes.
                        </p>
                    </div>
                </Container>
            </div>

            <Container className="py-10 space-y-10">
                {/* Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={<FiUsers className="w-6 h-6" />} label="Active Oracles" value={String(MOCK_ORACLE_STATS.totalOracles)} />
                    <StatCard icon={<FiLock className="w-6 h-6" />} label="Total Staked" value={MOCK_ORACLE_STATS.totalStaked} glow="rgba(107,76,230,0.2)" />
                    <StatCard icon={<FiCheckCircle className="w-6 h-6" />} label="Resolved Markets" value={String(MOCK_ORACLE_STATS.resolvedMarkets)} glow="rgba(16,185,129,0.2)" />
                    <StatCard icon={<FiClock className="w-6 h-6" />} label="Pending Consensus" value={String(MOCK_ORACLE_STATS.pendingMarkets)} glow="rgba(245,158,11,0.2)" />
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
                    {(['leaderboard', 'pending', 'register'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab
                                    ? 'bg-gradient-to-r from-[#00D4FF] to-[#6B4CE6] text-white shadow-[0_0_12px_rgba(0,212,255,0.3)]'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {tab === 'pending' ? 'Pending Votes' : tab === 'register' ? 'Become an Oracle' : 'Leaderboard'}
                        </button>
                    ))}
                </div>

                {/* ── LEADERBOARD TAB ── */}
                {activeTab === 'leaderboard' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0D1224]/80 backdrop-blur-md">
                            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <FiAward className="text-[#00D4FF]" /> Oracle Leaderboard
                                </h2>
                                <span className="text-xs text-slate-500">Updated live</span>
                            </div>
                            <table className="w-full">
                                <thead>
                                    <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-white/5">
                                        <th className="px-6 py-3 text-left">Rank</th>
                                        <th className="px-6 py-3 text-left">Oracle</th>
                                        <th className="px-6 py-3 text-left hidden md:table-cell">Reputation</th>
                                        <th className="px-6 py-3 text-left hidden lg:table-cell">Accuracy</th>
                                        <th className="px-6 py-3 text-left hidden lg:table-cell">Staked</th>
                                        <th className="px-6 py-3 text-left">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {MOCK_LEADERBOARD.map((oracle, i) => (
                                        <motion.tr
                                            key={oracle.rank}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="border-b border-white/5 hover:bg-white/3 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                {oracle.rank <= 3 ? (
                                                    <span className={`text-lg font-bold ${oracle.rank === 1 ? 'text-yellow-400' : oracle.rank === 2 ? 'text-slate-300' : 'text-orange-400'}`}>
                                                        #{oracle.rank}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-500">#{oracle.rank}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-white">{oracle.name}</div>
                                                <div className="text-xs font-mono text-slate-500">{oracle.address}</div>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell w-48">
                                                <ReputationBar value={oracle.reputation} />
                                            </td>
                                            <td className="px-6 py-4 hidden lg:table-cell">
                                                <span className="text-success-400 font-semibold">{oracle.accuracy}%</span>
                                            </td>
                                            <td className="px-6 py-4 hidden lg:table-cell text-slate-300 font-mono text-sm">
                                                {oracle.stake}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${oracle.status === 'active'
                                                        ? 'bg-success-500/20 text-success-400'
                                                        : 'bg-error-500/20 text-error-400'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${oracle.status === 'active' ? 'bg-success-400' : 'bg-error-400'} animate-pulse`} />
                                                    {oracle.status}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* ── PENDING VOTES TAB ── */}
                {activeTab === 'pending' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <p className="text-slate-400 text-sm">
                            Markets awaiting oracle consensus. Submit your vote with evidence to help resolve them.
                        </p>
                        {MOCK_PENDING_MARKETS.map((market, i) => {
                            const progressPct = Math.round((market.submissions / market.required) * 100);
                            const isUrgent = market.deadline.includes('m') && !market.deadline.includes('h');
                            return (
                                <motion.div
                                    key={market.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06 }}
                                    className="rounded-2xl border border-white/10 bg-[#0D1224] p-6 backdrop-blur-md hover:border-white/20 transition-all group"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-mono text-slate-500 bg-black/30 px-2 py-0.5 rounded border border-white/5">#{market.id}</span>
                                                {isUrgent && (
                                                    <span className="text-xs font-bold text-error-400 flex items-center gap-1">
                                                        <FiAlertCircle className="w-3 h-3" /> Urgent
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-white font-semibold mb-3 text-lg">{market.question}</h3>
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 max-w-[200px]">
                                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                                        <span>Consensus</span>
                                                        <span>{market.submissions}/{market.required}</span>
                                                    </div>
                                                    <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${progressPct >= 100 ? 'bg-success-500' : 'bg-gradient-to-r from-[#00D4FF] to-[#6B4CE6]'
                                                                }`}
                                                            style={{ width: `${Math.min(progressPct, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 text-sm text-slate-400">
                                                    <FiClock className="w-3.5 h-3.5" />
                                                    <span className={isUrgent ? 'text-error-400 font-semibold' : ''}>{market.deadline}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setVoteModal(market.id); setVoteOutcome(''); }}
                                            className="shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#6B4CE6] text-white text-sm font-semibold shadow-[0_0_12px_rgba(0,212,255,0.3)] hover:shadow-[0_0_20px_rgba(0,212,255,0.5)] transition-all"
                                        >
                                            Submit Vote
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {/* ── REGISTER TAB ── */}
                {activeTab === 'register' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl">
                        <div className="rounded-2xl border border-white/10 bg-[#0D1224] p-8 backdrop-blur-md">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#6B4CE6]">
                                    <FiZap className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-white">Become an Oracle</h2>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-black/20 border border-white/5">
                                    <FiCheckCircle className="w-5 h-5 text-[#00D4FF] mt-0.5 shrink-0" />
                                    <div>
                                        <div className="text-sm font-semibold text-white mb-0.5">Minimum Stake: 100 ETH</div>
                                        <div className="text-xs text-slate-400">Stake acts as collateral, slashed 20% for incorrect votes.</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-black/20 border border-white/5">
                                    <FiShield className="w-5 h-5 text-[#6B4CE6] mt-0.5 shrink-0" />
                                    <div>
                                        <div className="text-sm font-semibold text-white mb-0.5">Ed25519 Signature Required</div>
                                        <div className="text-xs text-slate-400">All submissions must be signed to prevent oracle impersonation.</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-black/20 border border-white/5">
                                    <FiTrendingUp className="w-5 h-5 text-success-400 mt-0.5 shrink-0" />
                                    <div>
                                        <div className="text-sm font-semibold text-white mb-0.5">Earn Reputation Rewards</div>
                                        <div className="text-xs text-slate-400">+10 reputation per correct vote. Higher rep = more voting weight.</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Stake Amount (ETH)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="100"
                                            defaultValue="100"
                                            placeholder="Min. 100 ETH"
                                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00D4FF]/50 focus:shadow-[0_0_10px_rgba(0,212,255,0.2)] transition-all"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">ETH</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Oracle Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. MyOracle"
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00D4FF]/50 focus:shadow-[0_0_10px_rgba(0,212,255,0.2)] transition-all"
                                    />
                                </div>
                                <button className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#6B4CE6] text-white font-bold shadow-[0_0_15px_rgba(0,212,255,0.3)] hover:shadow-[0_0_25px_rgba(0,212,255,0.5)] transition-all">
                                    Register as Oracle
                                </button>
                                <p className="text-xs text-slate-600 text-center">
                                    Requires connected wallet. Testnet only — mainnet oracle registration coming soon.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </Container>

            {/* ── Vote Submission Modal ── */}
            {voteModal !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0D1224] p-8 shadow-[0_0_50px_rgba(0,212,255,0.1)]"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#6B4CE6]">
                                <FiHash className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Submit Oracle Vote</h3>
                                <p className="text-xs text-slate-400">Market #{voteModal}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Select Outcome</label>
                                <div className="flex gap-3">
                                    {['Yes', 'No'].map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => setVoteOutcome(opt)}
                                            className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${voteOutcome === opt
                                                    ? 'bg-gradient-to-r from-[#00D4FF] to-[#6B4CE6] border-transparent text-white shadow-[0_0_12px_rgba(0,212,255,0.3)]'
                                                    : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">
                                    Confidence: <span className="text-[#00D4FF] font-bold">{confidence}%</span>
                                </label>
                                <input
                                    type="range"
                                    min={1}
                                    max={100}
                                    value={confidence}
                                    onChange={(e) => setConfidence(Number(e.target.value))}
                                    className="w-full accent-[#00D4FF]"
                                />
                                <div className="flex justify-between text-xs text-slate-600 mt-1">
                                    <span>Low (1%)</span>
                                    <span>High (100%)</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Evidence Hash (SHA-256)</label>
                                <input
                                    type="text"
                                    placeholder="0x..."
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm placeholder-gray-600 focus:outline-none focus:border-[#00D4FF]/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setVoteModal(null)}
                                className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={!voteOutcome}
                                onClick={() => voteModal !== null && handleVoteSubmit(voteModal)}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#6B4CE6] text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(0,212,255,0.3)] hover:shadow-[0_0_20px_rgba(0,212,255,0.5)] transition-all"
                            >
                                Submit Vote
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default OracleDashboardPage;

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Container } from '../components/layout/Container';

const incentiveItems = [
  {
    title: 'Market Innovators',
    description: 'Earn the Market Creator role after three approved suggestions and gain the ability to publish directly.',
  },
  {
    title: 'DAO Reviewers',
    description: 'Active reviewers accumulate reputation by approving accurate markets and flagging bad proposals.',
  },
  {
    title: 'Community Scouts',
    description: 'Suggest niche or high-signal markets. Highly-rated scouts receive boosted visibility and token rewards (roadmap).',
  },
];

const DaoOverviewPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#080B18] text-white selection:bg-primary-500/30">
      <Container className="py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          <header className="text-center max-w-3xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-3">Governance</p>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
              DAO Governance & Incentives
            </h1>
            <p className="text-lg text-slate-400">
              The Move Market DAO curates high-quality markets, manages protocol roles, and rewards contributors.
              This page outlines the lifecycle from suggestion to settlement and the incentives that keep the system
              aligned with the community.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button to="/create" variant="primary">
                Suggest a Market
              </Button>
              <Button to="/admin/suggestions" variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-transparent">
                Review Queue
              </Button>
              <Button to="/admin/roles" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Manage Roles
              </Button>
            </div>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-[#0D1224] border border-[#1C2537] rounded-2xl" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
              <h2 className="text-lg font-bold text-white mb-4">Governance Workflow</h2>
              <ol className="space-y-4 text-sm text-slate-400">
                <li>
                  <strong className="text-primary-400">1. Suggestion:</strong> Any wallet can submit a proposal with category, resolution source, and duration.
                </li>
                <li>
                  <strong className="text-primary-400">2. Review:</strong> DAO reviewers score suggestions, upvote promising ideas, and approve or reject.
                </li>
                <li>
                  <strong className="text-primary-400">3. Publication:</strong> Approved ideas are published by Market Creators or the DAO multisig.
                </li>
                <li>
                  <strong className="text-primary-400">4. Settlement:</strong> Resolver role holders finalize outcomes with on-chain proofs.
                </li>
                <li>
                  <strong className="text-primary-400">5. Recognition:</strong> Contributors earn reputation and eligibility for advanced roles and token rewards.
                </li>
              </ol>
            </div>

            <div className="p-6 bg-[#0D1224] border border-[#1C2537] rounded-2xl" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
              <h2 className="text-lg font-bold text-white mb-4">Role Hierarchy</h2>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><strong className="text-secondary-400">Admin:</strong> Oversees governance, manages roles, emergency controls.</li>
                <li><strong className="text-secondary-400">Market Creator:</strong> Publishes curated markets once trusted by the DAO.</li>
                <li><strong className="text-secondary-400">Resolver:</strong> Supplies verifiable outcomes, coordinating with oracle feeds.</li>
                <li><strong className="text-secondary-400">Oracle Manager:</strong> Maintains oracle configurations and redundancy.</li>
                <li><strong className="text-secondary-400">Pauser:</strong> Safeguards protocol during incidents.</li>
              </ul>
              <p className="mt-6 text-xs text-slate-600 border-t border-white/[0.06] pt-4">
                Role assignments require on-chain transactions. Use the Role Management console to grant or revoke access.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-6">Incentive Structure</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {incentiveItems.map((item) => (
                <div key={item.title} className="p-6 bg-[#0D1224] border border-[#1C2537] rounded-xl hover:border-white/[0.1] transition-colors">
                  <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-primary-500/[0.06] border border-primary-500/20 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4">Token Economics (Roadmap)</h2>
            <p className="text-slate-400 mb-4">
              The DAO treasury earmarks a portion of protocol fees for contributor rewards. On launch, approved markets
              and accurate resolutions earn governance points redeemable for token distributions and upgraded roles.
            </p>
            <ul className="list-disc ml-6 text-sm text-slate-500 space-y-2">
              <li>Reputation points convert to governance weight each epoch.</li>
              <li>Market creators share performance fees after successful settlement.</li>
              <li>Reviewers earn bonuses for identifying high-quality suggestions.</li>
              <li>Community voters receive seasonal airdrops proportional to participation.</li>
            </ul>
          </section>
        </motion.div>
      </Container>
    </div>
  );
};

export default DaoOverviewPage;

import { motion } from 'framer-motion';
import { FiFileText, FiAlertTriangle, FiShield, FiDollarSign, FiUsers, FiLock } from 'react-icons/fi';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#080B18] py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl mb-4">
            <FiFileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-slate-400">
            Last Updated: October 9, 2025
          </p>
        </div>

        {/* Content */}
        <div className="bg-[#0D1224] border border-[#1C2537] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.5)] p-8 space-y-8">

          {/* Introduction */}
          <Section icon={FiFileText} title="1. Acceptance of Terms">
            <p>
              Welcome to PROPHECY ("the Platform," "we," "us," or "our"). By accessing or using the Platform, you ("User," "you," or "your") agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Platform.
            </p>
            <p className="mt-4">
              These Terms constitute a legally binding agreement between you and PROPHECY. Please read them carefully before using the Platform.
            </p>
            <div className="mt-4 p-4 bg-error-500/[0.07] border border-error-500/25 rounded-xl">
              <p className="text-sm text-error-300">
                <strong>IMPORTANT:</strong> These Terms contain provisions that limit our liability and require you to resolve disputes through binding arbitration on an individual basis and not as part of any class or representative action.
              </p>
            </div>
          </Section>

          {/* Eligibility */}
          <Section icon={FiUsers} title="2. Eligibility">
            <p className="mb-4">To use the Platform, you must:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Be at least 18 years old (or the age of majority in your jurisdiction)</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Not be located in a jurisdiction where prediction markets or cryptocurrency are prohibited</li>
              <li>Comply with all applicable local, state, national, and international laws</li>
              <li>Not be on any sanctions list or restricted person list</li>
            </ul>
            <p className="mt-4 font-semibold text-error-400">
              By using the Platform, you represent and warrant that you meet all eligibility requirements.
            </p>
          </Section>

          {/* Platform Description */}
          <Section icon={FiShield} title="3. Platform Description">
            <h4 className="font-semibold text-white mb-3">3.1 Decentralized Application</h4>
            <p className="mb-4">
              PROPHECY is a decentralized prediction market platform built on the Base network. The Platform allows users to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Create prediction markets on future events</li>
              <li>Place bets on market outcomes using USDC</li>
              <li>Claim winnings when markets are resolved</li>
              <li>Participate in a decentralized oracle system</li>
            </ul>

            <h4 className="font-semibold text-white mb-3">3.2 Smart Contract Interaction</h4>
            <p>
              The Platform operates through smart contracts deployed on the Base network. By using the Platform, you interact directly with these smart contracts. We do not control the Base network or guarantee the security or functionality of smart contracts.
            </p>

            <h4 className="font-semibold text-white mt-6 mb-3">3.3 Non-Custodial Service</h4>
            <p>
              <strong>We do not custody your funds.</strong> All assets are held in smart contracts or your self-custodied wallet. You are solely responsible for the security of your wallet and private keys.
            </p>
          </Section>

          {/* User Responsibilities */}
          <Section icon={FiLock} title="4. User Responsibilities">
            <h4 className="font-semibold text-white mb-3">4.1 Wallet Security</h4>
            <p className="mb-4">You are responsible for:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Maintaining the confidentiality of your private keys and seed phrases</li>
              <li>All activities conducted through your wallet</li>
              <li>Ensuring your wallet is compatible with the Platform</li>
              <li>Protecting your account from unauthorized access</li>
            </ul>
            <p className="font-semibold text-error-400">
              NEVER share your private keys with anyone, including Platform administrators. We will NEVER ask for your private keys.
            </p>

            <h4 className="font-semibold text-white mt-6 mb-3">4.2 Transaction Responsibility</h4>
            <ul className="list-disc pl-6 space-y-2">
              <li>Review all transaction details before confirming</li>
              <li>Verify recipient addresses and amounts</li>
              <li>Understand that blockchain transactions are irreversible</li>
              <li>Pay all applicable gas fees and transaction costs</li>
            </ul>

            <h4 className="font-semibold text-white mt-6 mb-3">4.3 Prohibited Conduct</h4>
            <p className="mb-2">You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Platform for money laundering or other illegal activities</li>
              <li>Manipulate markets or engage in insider trading</li>
              <li>Create markets on illegal activities or unethical events</li>
              <li>Attempt to hack, exploit, or disrupt the Platform</li>
              <li>Use bots or automated systems to gain unfair advantages</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Impersonate others or provide false information</li>
              <li>Interfere with other users' access to the Platform</li>
            </ul>
          </Section>

          {/* Financial Risks */}
          <Section icon={FiDollarSign} title="5. Financial Risks and Disclaimers">
            <h4 className="font-semibold text-white mb-3">5.1 Risk of Loss</h4>
            <div className="bg-error-500/[0.07] border border-error-500/25 rounded-xl p-6 mb-4">
              <p className="font-bold text-error-300 mb-3">
                ⚠️ IMPORTANT RISK WARNINGS
              </p>
              <ul className="space-y-2 text-error-300">
                <li>• You may lose your entire investment</li>
                <li>• Prediction markets are speculative and high-risk</li>
                <li>• Past performance does not guarantee future results</li>
                <li>• Cryptocurrency values are volatile</li>
                <li>• Smart contract bugs could result in loss of funds</li>
                <li>• Oracle failures could lead to incorrect resolutions</li>
                <li>• No investment advice is provided</li>
              </ul>
            </div>

            <h4 className="font-semibold text-white mb-3">5.2 No Investment Advice</h4>
            <p>
              The Platform provides information and tools for prediction markets but does NOT provide investment, financial, legal, or tax advice. You should consult with qualified professionals before making any financial decisions.
            </p>

            <h4 className="font-semibold text-white mt-6 mb-3">5.3 Regulatory Uncertainty</h4>
            <p>
              Prediction markets and cryptocurrency regulations are evolving. You are responsible for understanding and complying with all applicable laws in your jurisdiction. We do not guarantee that the Platform complies with all jurisdictions' laws.
            </p>
          </Section>

          {/* Market Rules */}
          <Section icon={FiShield} title="6. Market Rules and Resolution">
            <h4 className="font-semibold text-white mb-3">6.1 Market Creation</h4>
            <p className="mb-4">When creating a market, you must:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide clear, unambiguous questions</li>
              <li>Define objective, verifiable outcomes</li>
              <li>Set reasonable resolution timeframes</li>
              <li>Not create markets on illegal or unethical events</li>
              <li>Specify resolution sources (oracles)</li>
            </ul>

            <h4 className="font-semibold text-white mt-6 mb-3">6.2 Market Resolution</h4>
            <p className="mb-4">
              Markets are resolved through a multi-oracle consensus mechanism. Resolution is based on:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Objective, verifiable data from oracles</li>
              <li>Majority consensus (typically 2-of-3 oracles)</li>
              <li>Manual fallback if oracle consensus fails</li>
            </ul>
            <p className="font-semibold text-white">
              Market resolutions are final and irreversible. We do not guarantee the accuracy of oracle data.
            </p>

            <h4 className="font-semibold text-white mt-6 mb-3">6.3 Disputes</h4>
            <p>
              Due to the decentralized nature of the Platform, we have limited ability to intervene in market disputes. Oracle consensus is the primary dispute resolution mechanism.
            </p>
          </Section>

          {/* Fees */}
          <Section icon={FiDollarSign} title="7. Fees and Payments">
            <h4 className="font-semibold text-white mb-3">7.1 Platform Fees</h4>
            <p className="mb-4">The Platform charges the following fees:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Trading Fee:</strong> 1.5-2% on winning bets (competitive with industry standards)</li>
              <li><strong>Market Creation:</strong> May require gas fees</li>
              <li><strong>Withdrawals:</strong> Blockchain gas fees apply</li>
            </ul>

            <h4 className="font-semibold text-white mb-3">7.2 Gas Fees</h4>
            <p>
              All blockchain transactions require gas fees (paid in ETH). Gas fees are set by the Base network and are subject to change based on network congestion. We do not control or profit from gas fees.
            </p>

            <h4 className="font-semibold text-white mt-6 mb-3">7.3 Fee Changes</h4>
            <p>
              We reserve the right to modify fees with 30 days' notice. Continued use of the Platform after fee changes constitutes acceptance of the new fees.
            </p>
          </Section>

          {/* Intellectual Property */}
          <Section icon={FiShield} title="8. Intellectual Property">
            <p className="mb-4">
              The Platform, including its design, code, logo, and content, is owned by PROPHECY and protected by intellectual property laws. You may not:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Copy, modify, or distribute Platform code without permission</li>
              <li>Use our trademarks or branding without authorization</li>
              <li>Reverse engineer or decompile the Platform</li>
              <li>Create derivative works without consent</li>
            </ul>
            <p className="mt-4">
              <strong>Open Source Components:</strong> Some Platform components may be open-source under specific licenses (see repository for details).
            </p>
          </Section>

          {/* Disclaimers */}
          <Section icon={FiAlertTriangle} title="9. Disclaimers and Limitation of Liability">
            <h4 className="font-semibold text-white mb-3">9.1 "AS IS" Disclaimer</h4>
            <p className="mb-4">
              THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Implied warranties of merchantability</li>
              <li>Fitness for a particular purpose</li>
              <li>Non-infringement</li>
              <li>Accuracy or reliability of information</li>
              <li>Uninterrupted or error-free operation</li>
            </ul>

            <h4 className="font-semibold text-white mt-6 mb-3">9.2 No Liability for Losses</h4>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2 mb-4">
              <li>Use or inability to use the Platform</li>
              <li>Lost profits or trading losses</li>
              <li>Smart contract bugs or exploits</li>
              <li>Oracle failures or incorrect resolutions</li>
              <li>Wallet security breaches</li>
              <li>Blockchain network issues</li>
              <li>Third-party actions or services</li>
            </ul>

            <h4 className="font-semibold text-white mb-3">9.3 Limitation Amount</h4>
            <p>
              IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE GREATER OF (A) $100 USD OR (B) THE FEES YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM.
            </p>
          </Section>

          {/* Indemnification */}
          <Section icon={FiShield} title="10. Indemnification">
            <p>
              You agree to indemnify, defend, and hold harmless PROPHECY, its affiliates, officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Your use of the Platform</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any laws or third-party rights</li>
              <li>Your market creations or bets</li>
              <li>Your wallet security breaches</li>
            </ul>
          </Section>

          {/* Termination */}
          <Section icon={FiLock} title="11. Termination">
            <h4 className="font-semibold text-white mb-3">11.1 Right to Terminate</h4>
            <p className="mb-4">
              We reserve the right to suspend or terminate your access to the Platform at any time, with or without cause, including if you violate these Terms.
            </p>

            <h4 className="font-semibold text-white mb-3">11.2 Effect of Termination</h4>
            <p>
              Upon termination:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Your right to access the Platform ceases immediately</li>
              <li>Active bets may remain locked until market resolution</li>
              <li>You remain responsible for all outstanding obligations</li>
              <li>Blockchain transactions cannot be reversed</li>
            </ul>
          </Section>

          {/* Dispute Resolution */}
          <Section icon={FiFileText} title="12. Dispute Resolution and Arbitration">
            <h4 className="font-semibold text-white mb-3">12.1 Informal Resolution</h4>
            <p className="mb-4">
              Before filing a claim, you agree to contact us at legal@prophecy.finance to attempt informal resolution of any dispute.
            </p>

            <h4 className="font-semibold text-white mb-3">12.2 Binding Arbitration</h4>
            <p className="mb-4">
              If informal resolution fails, disputes shall be resolved through binding arbitration, except where prohibited by law. Arbitration will be conducted by:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>A neutral arbitration service</li>
              <li>Under applicable arbitration rules</li>
              <li>In English language</li>
              <li>With costs shared equally unless otherwise determined</li>
            </ul>

            <h4 className="font-semibold text-white mt-6 mb-3">12.3 Class Action Waiver</h4>
            <p className="font-semibold text-white">
              YOU AGREE TO RESOLVE DISPUTES ON AN INDIVIDUAL BASIS ONLY. YOU WAIVE ANY RIGHT TO PARTICIPATE IN CLASS ACTIONS OR CLASS-WIDE ARBITRATION.
            </p>
          </Section>

          {/* Miscellaneous */}
          <Section icon={FiFileText} title="13. Miscellaneous">
            <h4 className="font-semibold text-white mb-3">13.1 Governing Law</h4>
            <p className="mb-4">
              These Terms are governed by the laws of [Jurisdiction], without regard to conflict of law principles.
            </p>

            <h4 className="font-semibold text-white mb-3">13.2 Severability</h4>
            <p className="mb-4">
              If any provision of these Terms is found unenforceable, the remaining provisions shall remain in full force and effect.
            </p>

            <h4 className="font-semibold text-white mb-3">13.3 No Waiver</h4>
            <p className="mb-4">
              Our failure to enforce any provision does not constitute a waiver of that provision.
            </p>

            <h4 className="font-semibold text-white mb-3">13.4 Entire Agreement</h4>
            <p className="mb-4">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and PROPHECY.
            </p>

            <h4 className="font-semibold text-white mb-3">13.5 Assignment</h4>
            <p>
              You may not assign these Terms. We may assign our rights and obligations without restriction.
            </p>
          </Section>

          {/* Contact */}
          <Section icon={FiFileText} title="14. Contact Information">
            <p className="mb-4">
              For questions about these Terms, please contact us:
            </p>
            <div className="bg-white/[0.04] rounded-xl p-6 space-y-2">
              <p><strong>Email:</strong> legal@prophecy.finance</p>
              <p><strong>Support:</strong> support@prophecy.finance</p>
              <p><strong>Security:</strong> security@prophecy.finance</p>
              <p><strong>Discord:</strong> Join our community server</p>
            </div>
          </Section>

          {/* Acknowledgment */}
          <div className="mt-12 p-6 bg-primary-500/[0.06] border border-primary-500/25 rounded-xl">
            <h3 className="font-bold text-primary-300 mb-3">
              📝 Acknowledgment
            </h3>
            <p className="text-sm text-primary-400">
              BY USING THE PLATFORM, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE. IF YOU DO NOT AGREE, YOU MUST NOT USE THE PLATFORM.
            </p>
          </div>

          {/* Effective Date */}
          <div className="mt-8 pt-6 border-t border-white/[0.06] text-center text-sm text-slate-400">
            <p>These Terms of Service are effective as of October 9, 2025</p>
            <p className="mt-2">Version 1.0</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Reusable Section Component
interface SectionProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}

function Section({ icon: Icon, title, children }: SectionProps) {
  return (
    <div className="border-l-4 border-primary-500 pl-6">
      <div className="flex items-center gap-3 mb-4">
        <Icon className="w-6 h-6 text-primary-500" />
        <h2 className="text-2xl font-bold text-white">
          {title}
        </h2>
      </div>
      <div className="text-slate-400 space-y-4">
        {children}
      </div>
    </div>
  );
}

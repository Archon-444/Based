import { motion } from 'framer-motion';
import { FiShield, FiLock, FiEye, FiDatabase, FiMail } from 'react-icons/fi';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#080B18] py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-2xl mb-4 shadow-[0_0_24px_rgba(59,130,246,0.3)]">
            <FiShield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-slate-500">
            Last Updated: October 9, 2025
          </p>
        </div>

        {/* Content */}
        <div className="bg-[#0D1224] rounded-2xl border border-[#1C2537] shadow-[0_24px_64px_rgba(0,0,0,0.5)] p-8 space-y-8">

          {/* Introduction */}
          <Section icon={FiShield} title="1. Introduction">
            <p>
              Welcome to BASED (the "Platform"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our decentralized prediction market platform built on the Base network.
            </p>
            <p className="mt-4">
              By using the Platform, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, please do not use the Platform.
            </p>
          </Section>

          {/* Information We Collect */}
          <Section icon={FiDatabase} title="2. Information We Collect">
            <h4 className="font-semibold text-white mb-3">2.1 Blockchain Information</h4>
            <p className="mb-4">
              As a decentralized application (dApp), we interact with the Base network. When you connect your wallet and use the Platform, the following blockchain data is publicly available:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Your wallet address</li>
              <li>Transaction history on the Platform</li>
              <li>Bet placements, amounts, and outcomes</li>
              <li>Market creations and resolutions</li>
              <li>Timestamps of all on-chain activities</li>
            </ul>
            <p className="text-sm text-slate-400 italic">
              Note: This information is stored on the Base network and is publicly accessible. We do not control blockchain data.
            </p>

            <h4 className="font-semibold text-white mt-6 mb-3">2.2 Technical Information</h4>
            <ul className="list-disc pl-6 space-y-2">
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Usage data and analytics (page views, time spent, interactions)</li>
              <li>Error logs and performance metrics</li>
            </ul>

            <h4 className="font-semibold text-white mt-6 mb-3">2.3 Local Storage</h4>
            <p>
              We use browser local storage to enhance your experience:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Theme preferences (dark/light mode)</li>
              <li>Wallet connection status</li>
              <li>Rate limiting data</li>
              <li>Application logs (for debugging)</li>
            </ul>
          </Section>

          {/* How We Use Your Information */}
          <Section icon={FiEye} title="3. How We Use Your Information">
            <p className="mb-4">We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Platform Operations:</strong> To facilitate betting, market creation, and settlement</li>
              <li><strong>Security:</strong> To detect and prevent fraud, abuse, and unauthorized access</li>
              <li><strong>Performance Monitoring:</strong> To analyze usage patterns and improve the Platform</li>
              <li><strong>Error Tracking:</strong> To identify and fix bugs and technical issues</li>
              <li><strong>User Experience:</strong> To remember your preferences and provide personalized features</li>
              <li><strong>Compliance:</strong> To comply with legal obligations and enforce our Terms of Service</li>
            </ul>
          </Section>

          {/* Data Storage and Security */}
          <Section icon={FiLock} title="4. Data Storage and Security">
            <h4 className="font-semibold text-white mb-3">4.1 Blockchain Data</h4>
            <p className="mb-4">
              All betting and market data is stored on the Base network, which is:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Immutable and permanent</li>
              <li>Publicly accessible</li>
              <li>Decentralized and censorship-resistant</li>
              <li>Not controlled or deletable by us</li>
            </ul>

            <h4 className="font-semibold text-white mb-3">4.2 Off-Chain Data</h4>
            <p className="mb-4">
              Technical and usage data is stored securely using:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encrypted connections (HTTPS/TLS)</li>
              <li>Secure cloud infrastructure</li>
              <li>Access controls and authentication</li>
              <li>Regular security audits</li>
            </ul>

            <h4 className="font-semibold text-white mt-6 mb-3">4.3 Wallet Security</h4>
            <p>
              <strong>IMPORTANT:</strong> We NEVER store, access, or request your private keys. Your wallet remains under your sole control. We only interact with your wallet through Coinbase Smart Wallet.
            </p>
          </Section>

          {/* Data Sharing */}
          <Section icon={FiDatabase} title="5. Data Sharing and Disclosure">
            <p className="mb-4">We do not sell your personal information. We may share information in the following circumstances:</p>

            <h4 className="font-semibold text-white mb-3">5.1 Service Providers</h4>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Error monitoring services (e.g., Sentry)</li>
              <li>Analytics providers (e.g., Google Analytics)</li>
              <li>Cloud hosting providers</li>
              <li>Oracle data providers</li>
            </ul>

            <h4 className="font-semibold text-white mb-3">5.2 Legal Requirements</h4>
            <p className="mb-4">We may disclose information if required by law, court order, or government regulation, or to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Comply with legal processes</li>
              <li>Enforce our Terms of Service</li>
              <li>Protect our rights, property, or safety</li>
              <li>Prevent fraud or illegal activities</li>
            </ul>

            <h4 className="font-semibold text-white mt-6 mb-3">5.3 Business Transfers</h4>
            <p>
              In the event of a merger, acquisition, or sale of assets, user information may be transferred to the acquiring entity.
            </p>
          </Section>

          {/* Your Rights */}
          <Section icon={FiShield} title="6. Your Rights and Choices">
            <h4 className="font-semibold text-white mb-3">6.1 Access and Control</h4>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Wallet Control:</strong> You can disconnect your wallet at any time</li>
              <li><strong>Local Storage:</strong> You can clear browser data to remove stored preferences</li>
              <li><strong>Cookies:</strong> You can disable cookies in your browser settings</li>
              <li><strong>Analytics:</strong> You can opt out of analytics tracking</li>
            </ul>

            <h4 className="font-semibold text-white mb-3">6.2 Data Deletion</h4>
            <p className="mb-4">
              <strong>Important Limitation:</strong> Blockchain data (transactions, bets, markets) cannot be deleted or modified as it is permanently stored on the Base network. However, you can request deletion of:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Off-chain usage data and logs</li>
              <li>Email communications (if any)</li>
              <li>Account preferences</li>
            </ul>

            <h4 className="font-semibold text-white mt-6 mb-3">6.3 GDPR Rights (EU Users)</h4>
            <p className="mb-2">If you are located in the European Union, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Rectify inaccurate data</li>
              <li>Request data deletion (subject to blockchain limitations)</li>
              <li>Object to data processing</li>
              <li>Data portability</li>
              <li>Withdraw consent</li>
            </ul>
          </Section>

          {/* Cookies and Tracking */}
          <Section icon={FiDatabase} title="7. Cookies and Tracking Technologies">
            <p className="mb-4">We use the following technologies:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for wallet connection and platform functionality</li>
              <li><strong>Analytics Cookies:</strong> To understand user behavior and improve the Platform</li>
              <li><strong>Local Storage:</strong> To save preferences and application state</li>
              <li><strong>Session Storage:</strong> For temporary data during your browsing session</li>
            </ul>
            <p className="mt-4 text-sm text-slate-400">
              You can control cookies through your browser settings, but disabling essential cookies may impair platform functionality.
            </p>
          </Section>

          {/* Third-Party Services */}
          <Section icon={FiDatabase} title="8. Third-Party Services">
            <p className="mb-4">The Platform integrates with third-party services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Wallet Providers:</strong> Coinbase Smart Wallet (see their privacy policy)</li>
              <li><strong>Oracle Networks:</strong> Pyth, Chainlink, and other data providers</li>
              <li><strong>Blockchain Infrastructure:</strong> Base Network</li>
              <li><strong>Analytics:</strong> Google Analytics, Mixpanel (if enabled)</li>
              <li><strong>Error Monitoring:</strong> Sentry (if enabled)</li>
            </ul>
            <p className="mt-4 text-sm text-slate-400">
              These third parties have their own privacy policies. We are not responsible for their data practices.
            </p>
          </Section>

          {/* Children's Privacy */}
          <Section icon={FiShield} title="9. Children's Privacy">
            <p>
              The Platform is not intended for users under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
            </p>
            <p className="mt-4 font-semibold text-error-400">
              You must be at least 18 years old to use this Platform.
            </p>
          </Section>

          {/* International Users */}
          <Section icon={FiDatabase} title="10. International Data Transfers">
            <p>
              The Platform may be accessed globally. If you access the Platform from outside the United States, your information may be transferred to, stored, and processed in the United States or other countries where our service providers operate.
            </p>
            <p className="mt-4">
              By using the Platform, you consent to the transfer of your information to countries that may have different data protection laws than your country of residence.
            </p>
          </Section>

          {/* Changes to Privacy Policy */}
          <Section icon={FiDatabase} title="11. Changes to This Privacy Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4 mb-4">
              <li>Posting the new Privacy Policy on this page</li>
              <li>Updating the "Last Updated" date</li>
              <li>Displaying a prominent notice on the Platform</li>
            </ul>
            <p>
              Your continued use of the Platform after changes become effective constitutes your acceptance of the revised Privacy Policy.
            </p>
          </Section>

          {/* Contact Us */}
          <Section icon={FiMail} title="12. Contact Us">
            <p className="mb-4">
              If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:
            </p>
            <div className="bg-white/[0.04] rounded-xl p-6 space-y-2">
              <p><strong>Email:</strong> privacy@based.app</p>
              <p><strong>Security Email:</strong> security@based.app</p>
              <p><strong>Discord:</strong> Join our server for support</p>
              <p><strong>GitHub:</strong> Report issues on our public repository</p>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              For security vulnerabilities, please use our bug bounty program or email security@based.app directly.
            </p>
          </Section>

          {/* Legal Disclaimer */}
          <div className="mt-12 p-6 bg-warning-500/[0.07] border border-warning-500/25 rounded-xl">
            <h3 className="font-bold text-warning-200 mb-3 flex items-center gap-2">
              <FiShield className="w-5 h-5" />
              Important Legal Disclaimer
            </h3>
            <ul className="text-sm text-warning-300 space-y-2">
              <li>• Blockchain transactions are permanent and publicly visible</li>
              <li>• We cannot delete or modify on-chain data</li>
              <li>• Your wallet address and transaction history are public</li>
              <li>• We never access or store your private keys</li>
              <li>• Use the Platform at your own risk</li>
              <li>• Prediction markets involve financial risk</li>
            </ul>
          </div>

          {/* Effective Date */}
          <div className="mt-8 pt-6 border-t border-white/[0.06] text-center text-sm text-slate-400">
            <p>This Privacy Policy is effective as of October 9, 2025</p>
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

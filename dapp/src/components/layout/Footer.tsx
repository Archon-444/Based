import React from 'react';
import { Link } from 'react-router-dom';
import { FiTwitter, FiGithub, FiMessageCircle, FiTrendingUp } from 'react-icons/fi';
import { Container } from './Container';

const FOOTER_LINKS = {
  product: [
    { label: 'Markets', href: '/markets' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Oracle', href: '/oracle' },
  ],
  resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'Smart Contracts', href: '/contracts' },
    { label: 'API', href: '/api' },
  ],
  community: [
    { label: 'DAO', href: '/dao' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ],
};

const SOCIAL_LINKS = [
  { icon: FiTwitter, href: 'https://twitter.com', label: 'Twitter' },
  { icon: FiGithub, href: 'https://github.com', label: 'GitHub' },
  { icon: FiMessageCircle, href: 'https://discord.com', label: 'Discord' },
];

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/[0.05] bg-[#080B18] mt-auto">
      <Container>
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-3 group mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center shadow-[0_0_16px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_24px_rgba(59,130,246,0.45)] transition-all">
                  <FiTrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-lg font-black text-white tracking-tight">Based</span>
                  <span className="block text-[9px] uppercase font-bold tracking-[0.15em] text-primary-400">
                    Prediction Protocol
                  </span>
                </div>
              </Link>
              <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                Transparent prediction markets on Move. Instant settlement, oracle-powered resolution.
              </p>
              <div className="flex gap-2">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.04] flex items-center justify-center text-slate-400 hover:text-white hover:border-white/[0.16] hover:bg-white/[0.08] transition-all"
                    aria-label={social.label}
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Product links */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Product</h3>
              <ul className="space-y-3">
                {FOOTER_LINKS.product.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources links */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Resources</h3>
              <ul className="space-y-3">
                {FOOTER_LINKS.resources.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Community links */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Community</h3>
              <ul className="space-y-3">
                {FOOTER_LINKS.community.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-8 border-t border-white/[0.05]">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-slate-600">
                © {new Date().getFullYear()} Based. All rights reserved.
              </p>
              <div className="flex gap-6">
                <Link to="/privacy" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;

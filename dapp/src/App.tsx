import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { config } from './config/wagmi';
import { SessionProvider } from './contexts/SessionContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { OnboardingModal } from './components/OnboardingModal';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { registerServiceWorker } from './utils/registerServiceWorker';
import PageTransition from './components/PageTransition';

// Retry dynamic imports to handle stale chunk hashes after deployments.
// On failure, reload the page once to fetch the latest asset manifest.
function lazyWithRetry(importFn: () => Promise<{ default: React.ComponentType }>) {
  return lazy(() =>
    importFn().catch((error: unknown) => {
      const key = 'chunk_reload_' + window.location.pathname;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
      }
      throw error;
    }),
  );
}

// Lazy load mobile-specific components
const PWAInstallPrompt = lazyWithRetry(() => import('./components/mobile/PWAInstallPrompt'));
const NotificationPrompt = lazyWithRetry(() => import('./components/mobile/NotificationPrompt'));
const BiometricPrompt = lazyWithRetry(() => import('./components/mobile/BiometricPrompt'));

// Lazy load utility components
const ServiceWorkerUpdate = lazyWithRetry(() => import('./components/ServiceWorkerUpdate'));
const OfflineIndicator = lazyWithRetry(() => import('./components/OfflineIndicator'));
const SessionTimeoutWarning = lazyWithRetry(() => import('./components/SessionTimeoutWarning'));

// Lazy load pages
const LandingPage = lazyWithRetry(() => import('./pages/LandingPage'));
const MarketsPage = lazyWithRetry(() => import('./pages/MarketsPage'));
const MarketDetailPage = lazyWithRetry(() => import('./pages/MarketDetailPage'));
const CreateMarketPage = lazyWithRetry(() => import('./pages/CreateMarketPage'));
const AdminSuggestionsPage = lazyWithRetry(() => import('./pages/AdminSuggestionsPage'));
const AdminRolesPage = lazyWithRetry(() => import('./pages/AdminRolesPage'));
const AdminResolverPage = lazyWithRetry(() => import('./pages/AdminResolverPage'));
const DaoOverviewPage = lazyWithRetry(() => import('./pages/DaoOverviewPage'));
const DashboardPage = lazyWithRetry(() => import('./pages/DashboardPage'));
const LeaderboardPage = lazyWithRetry(() => import('./pages/LeaderboardPage'));
const HowItWorksPage = lazyWithRetry(() => import('./pages/HowItWorksPage'));
const DeveloperDocsPage = lazyWithRetry(() => import('./pages/docs/DeveloperDocsPage'));
const FAQPage = lazyWithRetry(() => import('./pages/FAQPage'));
const ColorTestPage = lazyWithRetry(() => import('./pages/ColorTestPage'));
const PrivacyPolicyPage = lazyWithRetry(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazyWithRetry(() => import('./pages/TermsOfServicePage'));
const TikiDemo = lazyWithRetry(() => import('./pages/TikiDemo'));
const OracleDashboardPage = lazyWithRetry(() => import('./pages/OracleDashboardPage'));
const LiquidityPage = lazyWithRetry(() => import('./pages/LiquidityPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#080B18]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    registerServiceWorker({
      onSuccess: () => console.log('Service worker registered'),
      onUpdate: () => console.log('Service worker update available'),
    });
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider
              theme={darkTheme({
                accentColor: '#3B82F6',
                accentColorForeground: 'white',
                borderRadius: 'medium',
              })}
            >
              <SessionProvider>
                <Router>
                  <ToastProvider />
                  <Suspense fallback={null}>
                    <OfflineIndicator />
                    <ServiceWorkerUpdate />
                    <SessionTimeoutWarning />
                  </Suspense>
                  <div className="min-h-screen flex flex-col bg-[#080B18] pb-16 md:pb-0">
                    <OnboardingModal />
                    <Header />
                    <main className="flex-1">
                      <Suspense fallback={<LoadingFallback />}>
                        <AnimatePresence mode="wait">
                          <Routes>
                            <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
                            <Route path="/markets" element={<PageTransition><MarketsPage /></PageTransition>} />
                            <Route path="/market/:id" element={<PageTransition><MarketDetailPage /></PageTransition>} />
                            <Route path="/create" element={<PageTransition><CreateMarketPage /></PageTransition>} />
                            <Route path="/admin/suggestions" element={<PageTransition><AdminSuggestionsPage /></PageTransition>} />
                            <Route path="/admin/roles" element={<PageTransition><AdminRolesPage /></PageTransition>} />
                            <Route path="/admin/resolver" element={<PageTransition><AdminResolverPage /></PageTransition>} />
                            <Route path="/dao" element={<PageTransition><DaoOverviewPage /></PageTransition>} />
                            <Route path="/liquidity" element={<PageTransition><LiquidityPage /></PageTransition>} />
                            <Route path="/color-test" element={<PageTransition><ColorTestPage /></PageTransition>} />
                            <Route path="/tiki-demo" element={<PageTransition><TikiDemo /></PageTransition>} />
                            <Route path="/dashboard" element={<PageTransition><DashboardPage /></PageTransition>} />
                            <Route path="/leaderboard" element={<PageTransition><LeaderboardPage /></PageTransition>} />
                            <Route path="/how-it-works" element={<PageTransition><HowItWorksPage /></PageTransition>} />
                            <Route path="/docs/developer" element={<PageTransition><DeveloperDocsPage /></PageTransition>} />
                            <Route path="/faq" element={<PageTransition><FAQPage /></PageTransition>} />
                            <Route path="/privacy" element={<PageTransition><PrivacyPolicyPage /></PageTransition>} />
                            <Route path="/terms" element={<PageTransition><TermsOfServicePage /></PageTransition>} />
                            <Route path="/oracle" element={<PageTransition><OracleDashboardPage /></PageTransition>} />
                          </Routes>
                        </AnimatePresence>
                      </Suspense>
                    </main>
                    <Footer />
                    <MobileBottomNav />
                    <Suspense fallback={null}>
                      <PWAInstallPrompt />
                      <NotificationPrompt />
                      <BiometricPrompt />
                    </Suspense>
                  </div>
                </Router>
              </SessionProvider>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

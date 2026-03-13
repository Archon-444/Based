import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ChainProvider } from './contexts/ChainContext';
import { SessionProvider } from './contexts/SessionContext';
import { AptosWalletProvider } from './contexts/WalletContext';
import { SuiWalletProvider } from './contexts/SuiWalletContext';
import { SDKProvider } from './contexts/SDKContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { registerServiceWorker } from './utils/registerServiceWorker';
import PageTransition from './components/PageTransition';

// Lazy load mobile-specific components (not needed on desktop)
const PWAInstallPrompt = lazy(() => import('./components/mobile/PWAInstallPrompt'));
const NotificationPrompt = lazy(() => import('./components/mobile/NotificationPrompt'));
const BiometricPrompt = lazy(() => import('./components/mobile/BiometricPrompt'));

// Lazy load utility components
const ServiceWorkerUpdate = lazy(() => import('./components/ServiceWorkerUpdate'));
const OfflineIndicator = lazy(() => import('./components/OfflineIndicator'));
const SessionTimeoutWarning = lazy(() => import('./components/SessionTimeoutWarning'));

// Lazy load pages for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage'));
const MarketsPage = lazy(() => import('./pages/MarketsPage'));
const MarketDetailPage = lazy(() => import('./pages/MarketDetailPage'));
const CreateMarketPage = lazy(() => import('./pages/CreateMarketPage'));
const AdminSuggestionsPage = lazy(() => import('./pages/AdminSuggestionsPage'));
const AdminRolesPage = lazy(() => import('./pages/AdminRolesPage'));
const AdminResolverPage = lazy(() => import('./pages/AdminResolverPage'));
const DaoOverviewPage = lazy(() => import('./pages/DaoOverviewPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const DeveloperDocsPage = lazy(() => import('./pages/docs/DeveloperDocsPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const ColorTestPage = lazy(() => import('./pages/ColorTestPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const TikiDemo = lazy(() => import('./pages/TikiDemo'));
const OracleDashboardPage = lazy(() => import('./pages/OracleDashboardPage'));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0A0E27]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    // Register service worker for PWA offline support
    registerServiceWorker({
      onSuccess: (_registration) => {
        console.log('Service worker registered successfully');
      },
      onUpdate: (_registration) => {
        console.log('Service worker update available');
      },
    });
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ChainProvider>
          <SessionProvider>
            <AptosWalletProvider>
              <SuiWalletProvider>
                <SDKProvider>
                  <Router>
                    <ToastProvider />
                    <Suspense fallback={null}>
                      <OfflineIndicator />
                      <ServiceWorkerUpdate />
                      <SessionTimeoutWarning />
                    </Suspense>
                    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0A0E27] transition-colors pb-16 md:pb-0">
                      <Header />
                      <main className="flex-1">
                        <Suspense fallback={<LoadingFallback />}>
                          <AnimatePresence mode="wait">
                            <Routes>
                              <Route
                                path="/"
                                element={
                                  <PageTransition>
                                    <LandingPage />
                                  </PageTransition>
                                }
                              />
                              <Route
                                path="/markets"
                                element={
                                  <PageTransition>
                                    <MarketsPage />
                                  </PageTransition>
                                }
                              />
                              <Route
                                path="/market/:id"
                                element={
                                  <PageTransition>
                                    <MarketDetailPage />
                                  </PageTransition>
                                }
                              />
                              <Route
                                path="/create"
                                element={
                                  <PageTransition>
                                    <CreateMarketPage />
                                  </PageTransition>
                                }
                              />
                              <Route
                                path="/admin/suggestions"
                                element={
                                  <PageTransition>
                                    <AdminSuggestionsPage />
                                  </PageTransition>
                                }
                              />
                              <Route
                                path="/admin/roles"
                                element={
                                  <PageTransition>
                                    <AdminRolesPage />
                                  </PageTransition>
                                }
                              />
                              <Route
                                path="/admin/resolver"
                                element={
                                  <PageTransition>
                                    <AdminResolverPage />
                                  </PageTransition>
                                }
                              />
                              <Route
                                path="/dao"
                                element={
                                  <PageTransition>
                                    <DaoOverviewPage />
                                  </PageTransition>
                                }
                              />
                              <Route
                                path="/color-test"
                                element={
                                  <PageTransition>
                                    <ColorTestPage />
                                  </PageTransition>
                                }
                              />
                              <Route
                                path="/tiki-demo"
                                element={
                                  <PageTransition>
                                    <TikiDemo />
                                  </PageTransition>
                                }
                              />
                              <Route
                                path="/dashboard"
                                element={
                                  <PageTransition>
                                    <DashboardPage />
                                  </PageTransition>
                                }
                              />
                              <Route
                                path="/leaderboard"
                                element={
                                  <PageTransition>
                                    <LeaderboardPage />
                                  </PageTransition>
                                }
                              />
                              <Route
                                path="/how-it-works"
                                element={
                                  <PageTransition>
                                    <HowItWorksPage />
                                  </PageTransition>
                                }
                              />
                              <Route
                                path="/docs/developer"
                                element={
                                  <PageTransition>
                                    <DeveloperDocsPage />
                                  </PageTransition>
                                }
                              />
                              <Route
                                path="/faq"
                                element={
                                  <PageTransition>
                                    <FAQPage />
                                  </PageTransition>
                                }
                              />
                              <Route
                                path="/privacy"
                                element={
                                  <PageTransition>
                                    <PrivacyPolicyPage />
                                  </PageTransition>
                                }
                              />
                              <Route
                                path="/terms"
                                element={
                                  <PageTransition>
                                    <TermsOfServicePage />
                                  </PageTransition>
                                }
                              />
                              <Route
                                path="/oracle"
                                element={
                                  <PageTransition>
                                    <OracleDashboardPage />
                                  </PageTransition>
                                }
                              />
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
                </SDKProvider>
              </SuiWalletProvider>
            </AptosWalletProvider>
          </SessionProvider>
        </ChainProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

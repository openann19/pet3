import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/error/RouteErrorBoundary';
import { NotFoundPage } from '@/components/error/NotFoundPage';
import LoadingState from '@/components/LoadingState';
import { useNavigationErrorTracking } from '@/hooks/use-navigation-error-tracking';
import { useApp } from '@/contexts/AppContext';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useAppState } from '@/hooks/use-app-state';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAppModals } from '@/hooks/use-app-modals';
import { useAppAnimations } from '@/hooks/use-app-animations';
import { useAppStats } from '@/hooks/use-app-stats';
import { useStorage } from '@/hooks/use-storage';
import { createLogger } from '@/lib/logger';
import type { Playdate } from '@/lib/playdate-types';
import '@/lib/profile-generator-helper';
import HoloBackground from '@/components/chrome/HoloBackground';
import GlowTrail from '@/effects/cursor/GlowTrail';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppNavBar } from '@/components/layout/AppNavBar';
import { GenerateProfilesModal } from '@/components/modals/GenerateProfilesModal';
import { StatsModal } from '@/components/modals/StatsModal';
import { MapModal } from '@/components/modals/MapModal';
import { AdminModal } from '@/components/modals/AdminModal';
import { ThemeSettingsModal } from '@/components/modals/ThemeSettingsModal';
import { Toaster } from '@/components/ui/sonner';

const rootLogger = createLogger('App');

function createLazyNamed<T extends React.ComponentType<unknown>>(
  importFn: () => Promise<Record<string, T>>,
  exportName: string
) {
  return lazy(async () => {
    const module = await importFn();
    const Component = module[exportName];
    if (!Component) {
      throw new Error(`Component ${exportName} not found in module`);
    }
    return { default: Component };
  });
}

const DiscoverView = lazy(
  () => import(/* webpackPrefetch: true */ '@/components/views/DiscoverView')
);
const MatchesView = lazy(
  () => import(/* webpackPrefetch: true */ '@/components/views/MatchesView')
);
const ProfileView = lazy(
  () => import(/* webpackPrefetch: true */ '@/components/views/ProfileView')
);
const ChatView = lazy(() => import(/* webpackPrefetch: true */ '@/components/views/ChatView'));
const CommunityView = lazy(
  () => import(/* webpackPrefetch: true */ '@/components/views/CommunityView')
);
const AdoptionView = lazy(
  () => import(/* webpackPrefetch: true */ '@/components/views/AdoptionView')
);
const LostFoundView = lazy(
  () => import(/* webpackPrefetch: true */ '@/components/views/LostFoundView')
);

const AuthScreen = lazy(() => import('@/components/AuthScreen'));
const PetsDemoPage = lazy(() => import('@/components/demo/PetsDemoPage'));
const PremiumNotificationBell = createLazyNamed(
  () => import('@/components/notifications/PremiumNotificationBell'),
  'PremiumNotificationBell'
);
const SyncStatusIndicator = createLazyNamed(
  () => import('@/components/SyncStatusIndicator'),
  'SyncStatusIndicator'
);
const WelcomeScreen = lazy(() => import('@/components/WelcomeScreen'));
const QuickActionsMenu = lazy(() => import('@/components/QuickActionsMenu'));
const BottomNavBar = lazy(() => import('@/components/navigation/BottomNavBar'));
const BillingIssueBanner = createLazyNamed(
  () => import('@/components/payments/BillingIssueBanner'),
  'BillingIssueBanner'
);
const InstallPrompt = createLazyNamed(
  () => import('@/components/pwa/InstallPrompt'),
  'InstallPrompt'
);
const SeedDataInitializer = lazy(() => import('@/components/SeedDataInitializer'));
const OfflineIndicator = createLazyNamed(
  () => import('@/components/network/OfflineIndicator'),
  'OfflineIndicator'
);

function AppContent(): JSX.Element {
  const { t, theme, toggleTheme, language, toggleLanguage } = useApp();
  const { isOnline } = useNetworkStatus();
  const appState = useAppState();
  const navigation = useAppNavigation();
  const modals = useAppModals();
  const stats = useAppStats();
  const [playdates] = useStorage<Playdate[]>('playdates', []);

  const animations = useAppAnimations({
    currentView: navigation.currentView,
    language,
    showGenerateProfiles: modals.showGenerateProfiles,
    showStats: modals.showStats,
    showMap: modals.showMap,
    showAdminConsole: modals.showAdminConsole,
    showThemeSettings: modals.showThemeSettings,
  });

  useNavigationErrorTracking({
    enabled: true,
    onError: (error) => {
      rootLogger.error('Navigation error tracked', error.error, {
        type: error.type,
        fromPath: error.fromPath,
        toPath: error.toPath,
      });
    },
  });

  useEffect(() => {
    if (import.meta.env.NODE_ENV === 'production') {
      void (async () => {
        try {
          const [{ initPerformanceMonitoring }, { createLogger }] = await Promise.all([
            import('@/lib/monitoring/performance'),
            import('@/lib/logger'),
          ]);
          const logger = createLogger('PerformanceMonitoring');
          initPerformanceMonitoring((metric) => {
            if (metric.rating === 'poor') {
              logger.warn(`Poor ${metric.name}: ${metric.value}ms`, { metric });
            }
          });
        } catch {
          // Silently fail performance monitoring initialization
        }
      })();
    }
  }, []);

  return (
    <>
      {appState.appState === 'welcome' && (
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingState />}>
            <WelcomeScreen
              onGetStarted={appState.handleWelcomeGetStarted}
              onSignIn={appState.handleWelcomeSignIn}
              onExplore={appState.handleWelcomeExplore}
              isOnline={isOnline}
            />
          </Suspense>
        </RouteErrorBoundary>
      )}
      {appState.appState === 'auth' && (
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingState />}>
            <AuthScreen
              initialMode={appState.authMode}
              onBack={appState.handleAuthBack}
              onSuccess={appState.handleAuthSuccess}
            />
          </Suspense>
        </RouteErrorBoundary>
      )}
      {appState.appState === 'main' && (
        <div className="min-h-screen pb-20 sm:pb-24 bg-background text-foreground relative overflow-hidden">
          <HoloBackground intensity={0.6} />
          <GlowTrail />

          <Suspense fallback={null}>
            <SeedDataInitializer />
          </Suspense>

          <AppHeader
            title={t.app.title}
            language={language}
            theme={theme}
            animations={animations}
            onToggleLanguage={toggleLanguage}
            onToggleTheme={toggleTheme}
            onOpenAdminConsole={modals.openAdminConsole}
            onOpenThemeSettings={modals.openThemeSettings}
            SyncStatusIndicator={SyncStatusIndicator}
            PremiumNotificationBell={PremiumNotificationBell}
          />

          <Suspense fallback={null}>
            <BillingIssueBanner />
          </Suspense>

          <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8 relative z-10">
            <Suspense
              fallback={
                <AnimatedView style={animations.loadingTransition.style}>
                  <LoadingState />
                </AnimatedView>
              }
            >
              <AnimatedView key={navigation.currentView} style={animations.pageTransition.style}>
                {navigation.currentView === 'discover' && <DiscoverView />}
                {navigation.currentView === 'matches' && (
                  <MatchesView onNavigateToChat={navigation.navigateToChat} />
                )}
                {navigation.currentView === 'chat' && <ChatView />}
                {navigation.currentView === 'community' && <CommunityView />}
                {navigation.currentView === 'adoption' && <AdoptionView />}
                {navigation.currentView === 'lost-found' && <LostFoundView />}
                {navigation.currentView === 'profile' && <ProfileView />}
              </AnimatedView>
            </Suspense>
          </main>

          <AppNavBar
            currentView={navigation.currentView}
            translations={t}
            animations={animations}
            onViewChange={navigation.setCurrentView}
          />

          <Suspense fallback={null}>
            <QuickActionsMenu
              onCreatePet={() => navigation.setCurrentView('profile')}
              onViewHealth={() => navigation.setCurrentView('profile')}
              onSchedulePlaydate={() => navigation.setCurrentView('matches')}
              onSavedSearches={() => navigation.setCurrentView('discover')}
              onGenerateProfiles={modals.openGenerateProfiles}
              onViewStats={modals.openStats}
              onViewMap={modals.openMap}
            />
          </Suspense>

          <GenerateProfilesModal
            isVisible={modals.showGenerateProfiles}
            animations={animations}
            onClose={() => modals.setShowGenerateProfiles(false)}
          />

          <StatsModal
            isVisible={modals.showStats}
            totalMatches={stats.totalMatches}
            totalSwipes={stats.totalSwipes}
            successRate={stats.successRate}
            animations={animations}
            onClose={() => modals.setShowStats(false)}
          />

          <MapModal
            isVisible={modals.showMap}
            playdates={playdates}
            animations={animations}
            onClose={() => modals.setShowMap(false)}
          />

          <AdminModal
            isVisible={modals.showAdminConsole}
            animations={animations}
            onClose={() => modals.setShowAdminConsole(false)}
          />

          <ThemeSettingsModal
            isVisible={modals.showThemeSettings}
            animations={animations}
            onClose={() => modals.setShowThemeSettings(false)}
          />

          <Toaster />
          <Suspense fallback={null}>
            <BottomNavBar />
          </Suspense>
        </div>
      )}
    </>
  );
}

function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingState />}>
        <OfflineIndicator />
      </Suspense>
      <Suspense fallback={null}>
        <InstallPrompt />
      </Suspense>
      <Routes>
        <Route
          path="/demo/pets"
          element={
            <RouteErrorBoundary>
              <Suspense fallback={<LoadingState />}>
                <PetsDemoPage />
              </Suspense>
            </RouteErrorBoundary>
          }
        />
        <Route path="*" element={<AppContent />} />
        <Route
          path="/404"
          element={
            <RouteErrorBoundary>
              <NotFoundPage />
            </RouteErrorBoundary>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;

import { MotionView } from "@petspark/motion";
import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { 
  Heart, 
  ChatCircle, 
  Users, 
  Sparkle, 
  Sun, 
  Moon, 
  Palette, 
  ShieldCheck, 
  Translate,
  MapPin,
  User
} from '@phosphor-icons/react'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import LoadingState from '@/components/LoadingState'
import { useApp } from '@/contexts/AppContext'
import { useAuth } from '@/contexts/AuthContext'
import { ConsentManager, AgeVerification, isAgeVerified } from '@/components/compliance'
import { errorTracking } from '@/lib/error-tracking'
import { haptics } from '@/lib/haptics'
import type { Playdate } from '@/lib/playdate-types'
import '@/lib/profile-generator-helper'; // Expose generateProfiles to window
import HoloBackground from '@/components/chrome/HoloBackground'
import GlowTrail from '@/effects/cursor/GlowTrail'
// Ultra overlays (web-only, zero deps)
import { AmbientAuroraBackground, ScrollProgressBar, PageChangeFlash } from '@/effects/ultra-web-overlays'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Toaster } from '@/components/ui/sonner'
import { NavButton } from '@/components/navigation/NavButton'
import { useStorage } from '@/hooks/use-storage'
import { useAppAnimations } from '@/hooks/use-app-animations'
import { useAppModals } from '@/hooks/use-app-modals'
import { useAppState } from '@/hooks/use-app-state'
import { useAppStats } from '@/hooks/use-app-stats'
import { useAppNavigation } from '@/hooks/use-app-navigation'
import { useNavigation } from '@/hooks/use-navigation'

// Route components - lazy loaded
const DiscoverView = lazy(() => import(/* webpackPrefetch: true */ '@/components/views/DiscoverView'))
const MatchesView = lazy(() => import(/* webpackPrefetch: true */ '@/components/views/MatchesView'))
const ProfileView = lazy(() => import(/* webpackPrefetch: true */ '@/components/views/ProfileView'))
const ChatView = lazy(() => import(/* webpackPrefetch: true */ '@/components/views/ChatView'))
const CommunityView = lazy(() => import(/* webpackPrefetch: true */ '@/components/views/CommunityView'))
const AdoptionView = lazy(() => import(/* webpackPrefetch: true */ '@/components/views/AdoptionView'))
const LostFoundView = lazy(() => import(/* webpackPrefetch: true */ '@/components/views/LostFoundView'))
const PlaydateMap = lazy(() => import(/* webpackPrefetch: true */ '@/components/playdate/PlaydateMap'))

// Modal components - lazy loaded
const AdminConsole = lazy(() => import('@/components/AdminConsole'))
const AuthScreen = lazy(() => import('@/components/AuthScreen'))
const PetsDemoPage = lazy(() => import('@/components/demo/PetsDemoPage'))
const GenerateProfilesButton = lazy(() => import('@/components/GenerateProfilesButton'))
const PremiumNotificationBell = lazy(() => import('@/components/notifications/PremiumNotificationBell').then(module => ({ default: module.PremiumNotificationBell })))
const UltraThemeSettings = lazy(() => import('@/components/settings/UltraThemeSettings'))
const StatsCard = lazy(() => import('@/components/StatsCard'))
const SyncStatusIndicator = lazy(() => import('@/components/SyncStatusIndicator').then(module => ({ default: module.SyncStatusIndicator })))
const WelcomeScreen = lazy(() => import('@/components/WelcomeScreen'))
const QuickActionsMenu = lazy(() => import('@/components/QuickActionsMenu'))
const BottomNavBar = lazy(() => import('@/components/navigation/BottomNavBar'))
const BillingIssueBanner = lazy(() => import('@/components/payments/BillingIssueBanner').then(module => ({ default: module.BillingIssueBanner })))
const InstallPrompt = lazy(() => import('@/components/pwa/InstallPrompt').then(module => ({ default: module.InstallPrompt })))
const SeedDataInitializer = lazy(() => import('@/components/SeedDataInitializer'))
const OfflineIndicator = lazy(() => import('@/components/network/OfflineIndicator').then(module => ({ default: module.OfflineIndicator })))

function App() {
  const NAV_BUTTON_BASE_CLASSES = 'flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 min-w-[60px] sm:min-w-[70px]'
  
  // App state management hooks
  const { currentView, setCurrentView } = useAppNavigation()
  const navigation = useNavigation(setCurrentView)
  const { appState, authMode, handleWelcomeGetStarted, handleWelcomeSignIn, handleWelcomeExplore, handleAuthSuccess, handleAuthBack } = useAppState()
  const { t, theme, toggleTheme, language, toggleLanguage } = useApp()
  const { user } = useAuth()
  const [ageVerified, setAgeVerified] = useState(isAgeVerified())
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [playdates] = useStorage<Playdate[]>('playdates', [])
  
  // Modal state management
  const {
    showGenerateProfiles,
    showStats,
    showMap,
    showAdminConsole,
    showThemeSettings,
    setShowGenerateProfiles,
    setShowStats,
    setShowMap,
    setShowAdminConsole,
    setShowThemeSettings,
  } = useAppModals()
  
  // Statistics
  const { totalMatches, totalSwipes, successRate } = useAppStats()
  
  // Animations
  const animations = useAppAnimations({
    currentView,
    language,
    showGenerateProfiles,
    showStats,
    showMap,
    showAdminConsole,
    showThemeSettings,
  })
  
  // Initialize error tracking with user context
  useEffect(() => {
    if (user?.id) {
      errorTracking.setUserContext(user.id)
    }
  }, [user])

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); }
    const handleOffline = () => { setIsOnline(false); }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    // Initialize performance monitoring in production
    if (import.meta.env.NODE_ENV === 'production') {
      void Promise.all([
        import('@/lib/monitoring/performance'),
        import('@/lib/logger')
      ]).then(([{ initPerformanceMonitoring }, { createLogger }]) => {
        const logger = createLogger('PerformanceMonitoring');
        initPerformanceMonitoring((metric) => {
          // Log performance metrics (could send to analytics service)
          if (metric.rating === 'poor') {
            logger.warn(`Poor ${String(metric.name ?? '')}: ${String(metric.value ?? '')}ms`, { metric });
          }
        });
      });
    }
  }, [])


  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingState />}>
        <OfflineIndicator />
      </Suspense>
      <Suspense fallback={null}>
        <InstallPrompt />
      </Suspense>
      <Routes>
        <Route path="/demo/pets" element={
          <Suspense fallback={<LoadingState />}>
            <PetsDemoPage />
          </Suspense>
        } />
        <Route path="*" element={
          <>
            {appState === 'welcome' && (
            <Suspense fallback={<LoadingState />}>
              <WelcomeScreen 
                onGetStarted={handleWelcomeGetStarted}
                onSignIn={handleWelcomeSignIn}
                onExplore={handleWelcomeExplore}
                isOnline={isOnline} 
              />
            </Suspense>
          )}
          {appState === 'auth' && (
            <Suspense fallback={<LoadingState />}>
              <AuthScreen
                initialMode={authMode}
                onBack={handleAuthBack}
                onSuccess={handleAuthSuccess}
              />
            </Suspense>
          )}
                    {appState === 'main' && (
    <div className="min-h-screen pb-20 sm:pb-24 bg-background text-foreground relative overflow-hidden">                                                        
      {/* Ultra-premium ambient background with layered animated gradients */}
      <HoloBackground intensity={0.6} />
      <GlowTrail />
      {/* Ultra overlays: moving aurora backdrop, page flash, and scroll progress */}
      <AmbientAuroraBackground intensity={0.35} className="hidden md:block" />
      <PageChangeFlash key={currentView} />
      <ScrollProgressBar />
      
      <Suspense fallback={null}>
        <SeedDataInitializer />
      </Suspense>
      
      {/* Ultra-premium glassmorphic header with layered effects */}
      <MotionView 
        className="backdrop-blur-2xl bg-card/90 border-b border-border/50 sticky top-0 z-40 shadow-2xl shadow-primary/20"
        animatedStyle={animations.headerAnimation.headerStyle}
      >
        <div className="absolute inset-0 bg-linear-to-r from-primary/8 via-accent/8 to-secondary/8 pointer-events-none" />
        <MotionView 
          className="absolute inset-0 bg-linear-to-r from-transparent via-primary/5 to-transparent pointer-events-none"
          animatedStyle={animations.headerAnimation.shimmerStyle}
        >
          <div />
        </MotionView>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 relative">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <MotionView 
              className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
              animatedStyle={{ scale: animations.logoButtonHover.scale, y: animations.logoButtonHover.translateY }}
              onMouseEnter={animations.logoButtonHover.handleEnter}
              onMouseLeave={animations.logoButtonHover.handleLeave}
            >
              <MotionView className="relative" animatedStyle={animations.logoAnimation.style}>
                <MotionView
                  className="absolute inset-0 bg-linear-to-r from-primary/40 via-accent/40 to-primary/40 rounded-full blur-xl"
                  animatedStyle={animations.logoGlow.style}
                >
                  <div />
                </MotionView>
                <Heart className="text-primary drop-shadow-2xl relative z-10 group-hover:scale-125 transition-transform duration-300" size={24} weight="fill" />
              </MotionView>
              <h1 className="text-base sm:text-xl font-bold bg-linear-to-r from-primary via-accent to-secondary bg-clip-text text-transparent bg-size-[200%_auto] animate-gradient-x drop-shadow-sm">
                {t.app.title}
              </h1>
            </MotionView>
            <MotionView 
              className="flex items-center gap-1 sm:gap-2"
              animatedStyle={{ opacity: animations.headerButtonsContainer.opacity, x: animations.headerButtonsContainer.x }}
            >
              <MotionView 
                animatedStyle={animations.headerButton1.buttonStyle}
                onMouseEnter={animations.headerButton1.handleEnter}
                onMouseLeave={animations.headerButton1.handleLeave}
                onClick={animations.headerButton1.handleTap}
              >
                <Suspense fallback={<div className="w-9 h-9" />}>
                  <SyncStatusIndicator />
                </Suspense>
              </MotionView>
              <MotionView 
                animatedStyle={animations.headerButton2.buttonStyle}
                onMouseEnter={animations.headerButton2.handleEnter}
                onMouseLeave={animations.headerButton2.handleLeave}
                onClick={animations.headerButton2.handleTap}
              >
                <Suspense fallback={<div className="w-9 h-9" />}>
                  <PremiumNotificationBell />
                </Suspense>
              </MotionView>
              <MotionView 
                animatedStyle={animations.headerButton3.buttonStyle}
                onMouseEnter={animations.headerButton3.handleEnter}
                onMouseLeave={animations.headerButton3.handleLeave}
                onClick={animations.headerButton3.handleTap}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    haptics.trigger('selection')
                    toggleLanguage()
                  }}
                  className="rounded-full h-9 px-3 hover:bg-primary/15 active:bg-primary/25 transition-all duration-300 shadow-lg hover:shadow-primary/20 flex items-center gap-1.5"
                  aria-label={language === 'en' ? 'Switch to Bulgarian' : 'Превключи на English'}
                  aria-pressed={language === 'bg'}
                  title={language === 'en' ? 'Switch to Bulgarian' : 'Превключи на English'}
                >
                  <MotionView animatedStyle={animations.languageIconRotation.style}>
                    <Translate size={18} weight="bold" className="text-foreground" />
                  </MotionView>
                  <span className="text-xs font-semibold">
                    {language === 'en' ? 'БГ' : 'EN'}
                  </span>
                </Button>
              </MotionView>
              <MotionView 
                animatedStyle={animations.headerButton4.buttonStyle}
                onMouseEnter={animations.headerButton4.handleEnter}
                onMouseLeave={animations.headerButton4.handleLeave}
                onClick={animations.headerButton4.handleTap}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    haptics.impact('medium')
                    setShowAdminConsole(true)
                  }}
                  className="rounded-full hover:bg-primary/15 active:bg-primary/25 transition-all duration-300 shadow-lg hover:shadow-primary/20"
                  aria-label="Admin Console"
                  title="Admin Console"
                >
                  <ShieldCheck size={20} weight="bold" className="text-foreground" />
                </Button>
              </MotionView>
              <MotionView 
                animatedStyle={animations.headerButton5.buttonStyle}
                onMouseEnter={animations.headerButton5.handleEnter}
                onMouseLeave={animations.headerButton5.handleLeave}
                onClick={animations.headerButton5.handleTap}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    haptics.impact('light')
                    toggleTheme()
                  }}
                  className="rounded-full hover:bg-primary/15 active:bg-primary/25 transition-all duration-300 shadow-lg hover:shadow-primary/20"
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? (
                    <Sun size={20} weight="bold" className="text-foreground" />
                  ) : (
                    <Moon size={20} weight="bold" className="text-foreground" />
                  )}
                </Button>
              </MotionView>
              <MotionView 
                animatedStyle={animations.headerButton6.buttonStyle}
                onMouseEnter={animations.headerButton6.handleEnter}
                onMouseLeave={animations.headerButton6.handleLeave}
                onClick={animations.headerButton6.handleTap}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    haptics.impact('medium')
                    setShowThemeSettings(true)
                  }}
                  className="rounded-full hover:bg-primary/15 active:bg-primary/25 transition-all duration-300 shadow-lg hover:shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Theme Settings"
                  title="Ultra Theme Settings"
                >
                  <Palette size={20} weight="bold" className="text-foreground" />
                </Button>
              </MotionView>
            </MotionView>
          </div>
        </div>
      </MotionView>

      <Suspense fallback={null}>
        <BillingIssueBanner />
      </Suspense>

      {/* Enhanced main content with premium transitions */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8 relative z-10">
        <Suspense fallback={
          <MotionView animatedStyle={animations.loadingTransition.style}>
            <LoadingState />
          </MotionView>
        }>
          <MotionView
            key={currentView}
            animatedStyle={animations.pageTransition.style}
          >
            {currentView === 'discover' && <DiscoverView />}
            {currentView === 'matches' && <MatchesView onNavigateToChat={() => { navigation.navigateToView('chat'); }} />}
            {currentView === 'chat' && <ChatView />}
            {currentView === 'community' && <CommunityView />}
            {currentView === 'adoption' && <AdoptionView />}
            {currentView === 'lost-found' && <LostFoundView />}
            {currentView === 'profile' && <ProfileView />}
          </MotionView>
        </Suspense>
      </main>

            <MotionView 
        animatedStyle={animations.navBarAnimation.navStyle}
        className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-2xl border-t border-border/50 z-40 shadow-2xl shadow-primary/20 safe-area-inset-bottom"                                                                               
      >
        <div className="absolute inset-0 bg-linear-to-t from-primary/8 via-accent/4 to-transparent pointer-events-none" />                                      
        <MotionView 
          animatedStyle={animations.navBarAnimation.shimmerStyle}
          className="absolute inset-0 bg-linear-to-r from-transparent via-accent/5 to-transparent pointer-events-none"                                          
        >
          <div />
        </MotionView>
        <div className="max-w-7xl mx-auto px-1 sm:px-2 relative">
          <div className="flex items-center justify-around py-2 sm:py-3 gap-1">
                        <NavButton
              isActive={currentView === 'discover'}
              onClick={() => { setCurrentView('discover'); }}
              icon={<Sparkle size={22} weight={currentView === 'discover' ? 'fill' : 'regular'} />}
              label={t.nav.discover}
              enablePulse={currentView === 'discover'}
              enableIconAnimation={true}
            />

                        <NavButton
              isActive={currentView === 'matches'}
              onClick={() => { setCurrentView('matches'); }}
              icon={<Heart size={22} weight={currentView === 'matches' ? 'fill' : 'regular'} />}
              label={t.nav.matches}
              enablePulse={currentView === 'matches'}
            />

                        <NavButton
              isActive={currentView === 'chat'}
              onClick={() => { setCurrentView('chat'); }}
              icon={<ChatCircle size={22} weight={currentView === 'chat' ? 'fill' : 'regular'} />}
              label={t.nav.chat}
              enablePulse={currentView === 'chat'}
            />

                        <NavButton
              isActive={currentView === 'community'}
              onClick={() => { setCurrentView('community'); }}
              icon={<Users size={22} weight={currentView === 'community' ? 'fill' : 'regular'} />}
              label={t.nav.community ?? 'Community'}
              enablePulse={currentView === 'community'}
            />

                        <NavButton
              isActive={currentView === 'adoption'}
              onClick={() => { setCurrentView('adoption'); }}
              icon={<Heart size={22} weight={currentView === 'adoption' ? 'fill' : 'duotone'} />}
              label={t.nav.adoption ?? 'Adopt'}
              enablePulse={currentView === 'adoption'}
            />

            <MotionView
              className={`${String(NAV_BUTTON_BASE_CLASSES ?? '')} relative cursor-pointer ${
                String(currentView === 'lost-found'
                                                                    ? 'text-primary bg-linear-to-br from-primary/20 to-accent/15 shadow-lg shadow-primary/25'
                                                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60')
              }`}
              animatedStyle={{ scale: animations.lostFoundAnimation.scale, y: animations.lostFoundAnimation.translateY }}
              onMouseEnter={animations.lostFoundAnimation.handleHover}
              onMouseLeave={animations.lostFoundAnimation.handleLeave}
              onClick={() => {
                animations.lostFoundAnimation.handlePress()
                haptics.impact('light')
                setCurrentView('lost-found')
              }}
            >
              <MotionView animatedStyle={{ scale: animations.lostFoundAnimation.iconScale, rotate: animations.lostFoundAnimation.iconRotation }}>
                <MapPin size={22} weight={currentView === 'lost-found' ? 'fill' : 'regular'} />
              </MotionView>
              <span className="text-[10px] sm:text-xs font-semibold leading-tight">{t.nav['lost-found'] ?? 'Lost & Found'}</span>
              {currentView === 'lost-found' && (
                <MotionView
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 bg-linear-to-r from-primary via-accent to-secondary rounded-full shadow-lg shadow-primary/50"
                  animatedStyle={{ opacity: animations.lostFoundAnimation.indicatorOpacity, width: animations.lostFoundAnimation.indicatorWidth }}
                >
                  <div />
                </MotionView>
              )}
            </MotionView>

                        <NavButton
              isActive={currentView === 'profile'}
              onClick={() => { setCurrentView('profile'); }}
              icon={<User size={22} weight={currentView === 'profile' ? 'fill' : 'regular'} />}
              label={t.nav.profile}
              enablePulse={currentView === 'profile'}
            />
          </div>
        </div>
      </MotionView>

      <Suspense fallback={null}>
        <QuickActionsMenu
          onCreatePet={() => { setCurrentView('profile'); }}
          onViewHealth={() => { setCurrentView('profile'); }}
          onSchedulePlaydate={() => { setCurrentView('matches'); }}
          onSavedSearches={() => { setCurrentView('discover'); }}
          onGenerateProfiles={() => { setShowGenerateProfiles(true); }}
          onViewStats={() => { setShowStats(true); }}
          onViewMap={() => { setShowMap(true); }}
        />
      </Suspense>

      {showGenerateProfiles && (
        <MotionView
          animatedStyle={{ opacity: animations.generateProfilesModal.opacity, scale: animations.generateProfilesModal.scale, y: animations.generateProfilesModal.y }}
          className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => { setShowGenerateProfiles(false); }}
        >
          <MotionView
            animatedStyle={{ opacity: animations.generateProfilesContent.opacity, scale: animations.generateProfilesContent.scale, y: animations.generateProfilesContent.y }}
            onClick={(e?: React.MouseEvent) => e?.stopPropagation()}
            className="bg-card p-6 rounded-2xl shadow-2xl max-w-md w-full border border-border/50"
          >
            <Suspense fallback={<LoadingState />}>
              <GenerateProfilesButton />
            </Suspense>
            <MotionView animatedStyle={{ scale: animations.closeButtonBounce.scale }}>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => { setShowGenerateProfiles(false); }}
              >
                Close
              </Button>
            </MotionView>
          </MotionView>
        </MotionView>
      )}
      {showStats && totalSwipes > 0 && (
        <MotionView
          animatedStyle={{ opacity: animations.statsModal.opacity, scale: animations.statsModal.scale, y: animations.statsModal.y }}
          className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => { setShowStats(false); }}
        >
          <MotionView
            animatedStyle={{ opacity: animations.statsContent.opacity, scale: animations.statsContent.scale, y: animations.statsContent.y }}
            onClick={(e?: React.MouseEvent) => e?.stopPropagation()}
            className="max-w-2xl w-full"
          >
            <Suspense fallback={<LoadingState />}>
              <StatsCard
                totalMatches={totalMatches}
                totalSwipes={totalSwipes}
                successRate={successRate}
              />
            </Suspense>
            <MotionView animatedStyle={{ scale: animations.closeButtonBounce.scale }}>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => { setShowStats(false); }}
              >
                Close
              </Button>
            </MotionView>
          </MotionView>
        </MotionView>
      )}

      {showMap && (
        <MotionView
          animatedStyle={{ opacity: animations.mapModal.opacity, scale: animations.mapModal.scale, y: animations.mapModal.y }}
          className="fixed inset-0 z-50"
        >
          <Suspense fallback={<LoadingState />}>
            <MotionView
              animatedStyle={{ opacity: animations.mapContent.opacity, scale: animations.mapContent.scale, y: animations.mapContent.y }}
              className="h-full w-full"
            >
              <PlaydateMap
                playdates={playdates ?? []}
                onClose={() => { setShowMap(false); }}
              />
            </MotionView>
          </Suspense>
        </MotionView>
      )}

      {showAdminConsole && (
        <MotionView
          animatedStyle={{ opacity: animations.adminModal.opacity, scale: animations.adminModal.scale, y: animations.adminModal.y }}
          className="fixed inset-0 z-50 bg-background"
        >
          <MotionView
            animatedStyle={animations.adminContent.style}
            className="h-full w-full"
          >
            <Suspense fallback={<LoadingState />}>
              <AdminConsole onClose={() => { setShowAdminConsole(false); }} />
            </Suspense>
          </MotionView>
        </MotionView>
      )}

      {showThemeSettings && (
        <Dialog open={showThemeSettings} onOpenChange={setShowThemeSettings}>
          <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto p-0">
            <DialogTitle className="sr-only">Ultra Theme Settings</DialogTitle>
            <MotionView animatedStyle={animations.themeContent.style}>
              <Suspense fallback={<LoadingState />}>
                <UltraThemeSettings />
              </Suspense>
            </MotionView>
          </DialogContent>
        </Dialog>
      )}

      <Toaster />
      <Suspense fallback={null}>
        <BottomNavBar />
      </Suspense>
      
      {/* Worldwide Scale Compliance Components */}
      {!ageVerified && (
        <AgeVerification
          onVerified={(verified) => setAgeVerified(verified)}
          requiredAge={13}
        />
      )}
      <ConsentManager />
    </div>
                    )}
        </>
      } />
      </Routes>
    </ErrorBoundary>
  );
}

export default App
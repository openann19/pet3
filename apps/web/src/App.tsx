import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { ScreenErrorBoundary } from '@/components/error/ScreenErrorBoundary'
import LoadingState from '@/components/LoadingState'
import { useApp } from '@/contexts/AppContext'
import { useAuth } from '@/contexts/AuthContext'
import { ConsentManager, AgeVerification, isAgeVerified } from '@/components/compliance'
import { errorTracking } from '@/lib/error-tracking'
import { useBounceOnTap, useHeaderAnimation, useHeaderButtonAnimation, useHoverLift, useIconRotation, useLogoAnimation, useLogoGlow, useModalAnimation, useNavBarAnimation, usePageTransition, useStaggeredContainer } from '@/effects/reanimated'
import { motion } from 'framer-motion'
import { useNavButtonAnimation } from '@/hooks/use-nav-button-animation'
import { useStorage } from '@/hooks/use-storage'
import { haptics } from '@/lib/haptics'
import type { Playdate } from '@/lib/playdate-types'
import '@/lib/profile-generator-helper'; // Expose generateProfiles to window
import type { Match, Pet, SwipeAction } from '@/lib/types'
import HoloBackground from '@/components/chrome/HoloBackground'
import GlowTrail from '@/effects/cursor/GlowTrail'
// Ultra overlays (web-only, zero deps)
import { AmbientAuroraBackground, ScrollProgressBar, PageChangeFlash } from '@/effects/ultra-web-overlays'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Toaster } from '@/components/ui/sonner'
import { NavButton } from '@/components/navigation/NavButton'
import { isTruthy } from '@petspark/shared';
import type { View } from '@/lib/routes';
import { getDefaultView } from '@/lib/routes';
import { useNavigation } from '@/hooks/use-navigation';
import { Heart, Translate, Sun, Moon, ShieldCheck, Palette, Sparkle, ChatCircle, Users, MapPin, User } from 'phosphor-react'

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
const PremiumNotificationBell = lazy(() => 
  import('@/components/notifications/PremiumNotificationBell').then(
    (m): { default: React.ComponentType } => ({ default: m.PremiumNotificationBell })
  )
)
const UltraThemeSettings = lazy(() => 
  import('@/components/settings/UltraThemeSettings').then(
    (m): { default: React.ComponentType } => ({ default: m.UltraThemeSettings })
  )
)
const StatsCard = lazy(() => import('@/components/StatsCard'))
const SyncStatusIndicator = lazy(() => 
  import('@/components/SyncStatusIndicator').then(
    (m): { default: React.ComponentType } => ({ default: m.SyncStatusIndicator })
  )
)
const WelcomeScreen = lazy(() => import('@/components/WelcomeScreen'))
const QuickActionsMenu = lazy(() => import('@/components/QuickActionsMenu'))
const BottomNavBar = lazy(() => import('@/components/navigation/BottomNavBar'))
const BillingIssueBanner = lazy(() => 
  import('@/components/payments/BillingIssueBanner').then(
    (m): { default: React.ComponentType } => ({ default: m.BillingIssueBanner })
  )
)
const InstallPrompt = lazy(() => 
  import('@/components/pwa/InstallPrompt').then(
    (m): { default: React.ComponentType } => ({ default: m.InstallPrompt })
  )
)
const SeedDataInitializer = lazy(() => import('@/components/SeedDataInitializer'))
const OfflineIndicator = lazy(() => 
  import('@/components/network/OfflineIndicator').then(
    (m): { default: React.ComponentType } => ({ default: m.OfflineIndicator })
  )
)
type AppState = 'welcome' | 'auth' | 'main'

function App() {
  const NAV_BUTTON_BASE_CLASSES = 'flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 min-w-[60px] sm:min-w-[70px]'
  
  const [currentView, setCurrentView] = useState<View>(getDefaultView())
  const navigation = useNavigation(setCurrentView)
  const [appState, setAppState] = useState<AppState>('welcome')
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup')
  const { t, theme, toggleTheme, language, toggleLanguage } = useApp()
  const { isAuthenticated, user } = useAuth()
  const [hasSeenWelcome, setHasSeenWelcome] = useStorage<boolean>('has-seen-welcome-v2', false)
  const [ageVerified, setAgeVerified] = useState(isAgeVerified())
  
  // Initialize error tracking with user context
  useEffect(() => {
    if (user?.id) {
      errorTracking.setUserContext(user.id)
    }
  }, [user])
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [_userPets] = useStorage<Pet[]>('user-pets', [])
  const [matches] = useStorage<Match[]>('matches', [])
  const [swipeHistory] = useStorage<SwipeAction[]>('swipe-history', [])
  const [playdates] = useStorage<Playdate[]>('playdates', [])
  const [showGenerateProfiles, setShowGenerateProfiles] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [showAdminConsole, setShowAdminConsole] = useState(false)
  const [showThemeSettings, setShowThemeSettings] = useState(false)

  // Reanimated navigation button animation for Lost & Found
  const lostFoundAnimation = useNavButtonAnimation({
    isActive: currentView === 'lost-found',
    enablePulse: true,
    enableRotation: true,
    hapticFeedback: true
  })

  // Logo animations
  const logoAnimation = useLogoAnimation()
  const logoGlow = useLogoGlow()
  
  // Header button hover animations
  const logoButtonHover = useHoverLift({ scale: 1.06 })
  
  // Header button animations
  const headerButtonsContainer = useStaggeredContainer({ delay: 0.2 })
  const headerButton1 = useHeaderButtonAnimation({ delay: 0.3, scale: 1.12, translateY: -3, rotation: -5 })
  const headerButton2 = useHeaderButtonAnimation({ delay: 0.35, scale: 1.12, translateY: -3, rotation: -5 })
  const headerButton3 = useHeaderButtonAnimation({ delay: 0.4, scale: 1.1, translateY: -2, rotation: -3 })
  const headerButton4 = useHeaderButtonAnimation({ delay: 0.45, scale: 1.12, translateY: -3, rotation: -5 })
  const headerButton5 = useHeaderButtonAnimation({ delay: 0.5, scale: 1.12, translateY: -3, rotation: -5 })
  const headerButton6 = useHeaderButtonAnimation({ delay: 0.55, scale: 1.12, translateY: -3, rotation: -5 })
  
  // Language button icon rotation
  const languageIconRotation = useIconRotation({ enabled: language === 'bg', targetRotation: 360 })
  
  // Page transition animation
  const pageTransition = usePageTransition({ 
    isVisible: true, 
    direction: 'up' 
  })
  const loadingTransition = usePageTransition({ isVisible: true, direction: 'fade', duration: 300 })
  
  // Modal animations
  const generateProfilesModal = useModalAnimation({ isVisible: showGenerateProfiles, duration: 200 })
  const generateProfilesContent = useModalAnimation({ isVisible: showGenerateProfiles, duration: 300 })
  const statsModal = useModalAnimation({ isVisible: showStats, duration: 200 })
  const statsContent = useModalAnimation({ isVisible: showStats, duration: 300 })
  const mapModal = useModalAnimation({ isVisible: showMap, duration: 200 })
  const mapContent = useModalAnimation({ isVisible: showMap, duration: 300 })
  const adminModal = useModalAnimation({ isVisible: showAdminConsole, duration: 200 })
  const adminContent = useModalAnimation({ isVisible: showAdminConsole, duration: 300 })
  const themeContent = useModalAnimation({ isVisible: showThemeSettings, duration: 300 })
  
  // Reanimated animations for main app
  const headerAnimation = useHeaderAnimation({ delay: 0.1 })
  const navBarAnimation = useNavBarAnimation({ delay: 0.2 })
  
  // Button animations
  const closeButtonBounce = useBounceOnTap({ hapticFeedback: true })

  // These hooks already return CSSProperties, no need to convert
  const headerStyle = headerAnimation.headerStyle
  const headerShimmerStyle = headerAnimation.shimmerStyle
  const logoAnimationStyle = logoAnimation.style
  const logoGlowStyle = logoGlow.style
  const headerButton1Style = headerButton1.buttonStyle
  const headerButton2Style = headerButton2.buttonStyle
  const headerButton3Style = headerButton3.buttonStyle
  const headerButton4Style = headerButton4.buttonStyle
  const headerButton5Style = headerButton5.buttonStyle
  const headerButton6Style = headerButton6.buttonStyle
  const languageIconRotationStyle = languageIconRotation.style
  const loadingTransitionStyle = loadingTransition.style
  const pageTransitionStyle = pageTransition.style
  const navBarStyle = navBarAnimation.navStyle
  const navBarShimmerStyle = navBarAnimation.shimmerStyle
  // Lost & Found button uses motion values directly via motion.div
  // Modal animations use variants directly via motion.div variants prop
  // closeButtonBounce returns motion values directly - use scale in style prop

  // Memoize computed values to prevent unnecessary re-renders
  const totalMatches = useMemo(() => 
    Array.isArray(matches) ? matches.filter(m => m.status === 'active').length : 0,
    [matches]
  )
  const totalSwipes = useMemo(() => 
    Array.isArray(swipeHistory) ? swipeHistory.length : 0,
    [swipeHistory]
  )
  const likeCount = useMemo(() => 
    Array.isArray(swipeHistory) ? swipeHistory.filter(s => s.action === 'like').length : 0,
    [swipeHistory]
  )
  const successRate = useMemo(() => 
    likeCount > 0 ? Math.round((totalMatches / likeCount) * 100) : 0,
    [likeCount, totalMatches]
  )

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

  useEffect(() => {
    if (hasSeenWelcome && isAuthenticated) {
      setAppState('main')
    } else if (isTruthy(hasSeenWelcome)) {
      setAppState('auth')
    } else {
      setAppState('welcome')
    }
  }, [hasSeenWelcome, isAuthenticated])

  const handleWelcomeGetStarted = () => {
    void setHasSeenWelcome(true).catch((error) => {
      console.error('Failed to save has-seen-welcome state:', error)
    })
    setAuthMode('signup')
    setAppState('auth')
  }

  const handleWelcomeSignIn = () => {
    void setHasSeenWelcome(true).catch((error) => {
      console.error('Failed to save has-seen-welcome state:', error)
    })
    setAuthMode('signin')
    setAppState('auth')
  }

  const handleWelcomeExplore = () => {
    void setHasSeenWelcome(true).catch((error) => {
      console.error('Failed to save has-seen-welcome state:', error)
    })
    setAppState('main')
  }

  const handleAuthSuccess = () => {
    setAppState('main')
  }

  const handleAuthBack = () => {
    setAppState('welcome')
  }

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
      <motion.div 
        className="backdrop-blur-2xl bg-card/90 border-b border-border/50 sticky top-0 z-40 shadow-2xl shadow-primary/20"
        style={headerStyle}
      >
        <div className="absolute inset-0 bg-linear-to-r from-primary/8 via-accent/8 to-secondary/8 pointer-events-none" />
        <motion.div 
          className="absolute inset-0 bg-linear-to-r from-transparent via-primary/5 to-transparent pointer-events-none"
          style={headerShimmerStyle}
        >
          <div />
        </motion.div>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 relative">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <motion.div 
              className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
              style={{
                scale: logoButtonHover.scale,
                y: logoButtonHover.translateY,
              }}
              onMouseEnter={logoButtonHover.handleEnter}
              onMouseLeave={logoButtonHover.handleLeave}
            >
              <motion.div className="relative" style={logoAnimationStyle}>
                <motion.div
                  className="absolute inset-0 bg-linear-to-r from-primary/40 via-accent/40 to-primary/40 rounded-full blur-xl"
                  style={logoGlowStyle}
                >
                  <div />
                </motion.div>
                <Heart className="text-primary drop-shadow-2xl relative z-10 group-hover:scale-125 transition-transform duration-300" size={24} weight="fill" />
              </motion.div>
              <h1 className="text-base sm:text-xl font-bold bg-linear-to-r from-primary via-accent to-secondary bg-clip-text text-transparent bg-size-[200%_auto] animate-gradient-x drop-shadow-sm">
                {t.app.title}
              </h1>
            </motion.div>
            <motion.div 
              className="flex items-center gap-1 sm:gap-2"
              style={{
                opacity: headerButtonsContainer.opacity,
                x: headerButtonsContainer.x,
              }}
            >
              <motion.div 
                style={headerButton1Style}
                onMouseEnter={headerButton1.handleEnter}
                onMouseLeave={headerButton1.handleLeave}
                onClick={headerButton1.handleTap}
              >
                <Suspense fallback={<div className="w-9 h-9" />}>
                  <SyncStatusIndicator />
                </Suspense>
              </motion.div>
              <motion.div 
                style={headerButton2Style}
                onMouseEnter={headerButton2.handleEnter}
                onMouseLeave={headerButton2.handleLeave}
                onClick={headerButton2.handleTap}
              >
                <Suspense fallback={<div className="w-9 h-9" />}>
                  <PremiumNotificationBell />
                </Suspense>
              </motion.div>
              <motion.div 
                style={headerButton3Style}
                onMouseEnter={headerButton3.handleEnter}
                onMouseLeave={headerButton3.handleLeave}
                onClick={headerButton3.handleTap}
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
                  <motion.div style={languageIconRotationStyle}>
                    <Translate size={18} weight="bold" className="text-foreground" />
                  </motion.div>
                  <span className="text-xs font-semibold">
                    {language === 'en' ? 'БГ' : 'EN'}
                  </span>
                </Button>
              </motion.div>
              <motion.div 
                style={headerButton4Style}
                onMouseEnter={headerButton4.handleEnter}
                onMouseLeave={headerButton4.handleLeave}
                onClick={headerButton4.handleTap}
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
              </motion.div>
              <motion.div 
                style={headerButton5Style}
                onMouseEnter={headerButton5.handleEnter}
                onMouseLeave={headerButton5.handleLeave}
                onClick={headerButton5.handleTap}
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
              </motion.div>
              <motion.div 
                style={headerButton6Style}
                onMouseEnter={headerButton6.handleEnter}
                onMouseLeave={headerButton6.handleLeave}
                onClick={headerButton6.handleTap}
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
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <Suspense fallback={null}>
        <BillingIssueBanner />
      </Suspense>

      {/* Enhanced main content with premium transitions */}
      <main aria-label={t.app.title || 'PetSpark'} className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8 relative z-10">
        <Suspense fallback={
          <motion.div style={loadingTransitionStyle}>
            <LoadingState />
          </motion.div>
        }>
          <motion.div
            key={currentView}
            style={pageTransitionStyle}
          >
            {currentView === 'discover' && (
              <ScreenErrorBoundary screenName="DiscoverView">
                <DiscoverView />
              </ScreenErrorBoundary>
            )}
            {currentView === 'matches' && (
              <ScreenErrorBoundary screenName="MatchesView">
                <MatchesView onNavigateToChat={() => { navigation.navigateToView('chat'); }} />
              </ScreenErrorBoundary>
            )}
            {currentView === 'chat' && (
              <ScreenErrorBoundary screenName="ChatView">
                <ChatView />
              </ScreenErrorBoundary>
            )}
            {currentView === 'community' && (
              <ScreenErrorBoundary screenName="CommunityView">
                <CommunityView />
              </ScreenErrorBoundary>
            )}
            {currentView === 'adoption' && (
              <ScreenErrorBoundary screenName="AdoptionView">
                <AdoptionView />
              </ScreenErrorBoundary>
            )}
            {currentView === 'lost-found' && (
              <ScreenErrorBoundary screenName="LostFoundView">
                <LostFoundView />
              </ScreenErrorBoundary>
            )}
            {currentView === 'profile' && (
              <ScreenErrorBoundary screenName="ProfileView">
                <ProfileView />
              </ScreenErrorBoundary>
            )}
          </motion.div>
        </Suspense>
      </main>

            <motion.div 
        style={navBarStyle}
        className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-2xl border-t border-border/50 z-40 shadow-2xl shadow-primary/20 safe-area-inset-bottom"                                                                               
      >
        <div className="absolute inset-0 bg-linear-to-t from-primary/8 via-accent/4 to-transparent pointer-events-none" />                                      
        <motion.div 
          style={navBarShimmerStyle}
          className="absolute inset-0 bg-linear-to-r from-transparent via-accent/5 to-transparent pointer-events-none"                                          
        >
          <div />
        </motion.div>
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
              label={t.nav.community || 'Community'}
              enablePulse={currentView === 'community'}
            />

                        <NavButton
              isActive={currentView === 'adoption'}
              onClick={() => { setCurrentView('adoption'); }}
              icon={<Heart size={22} weight={currentView === 'adoption' ? 'fill' : 'duotone'} />}
              label={t.nav.adoption || 'Adopt'}
              enablePulse={currentView === 'adoption'}
            />

            <motion.div
              className={`${NAV_BUTTON_BASE_CLASSES} relative cursor-pointer ${
                currentView === 'lost-found'
                  ? 'text-primary bg-linear-to-br from-primary/20 to-accent/15 shadow-lg shadow-primary/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
              style={{
                scale: lostFoundAnimation.scale,
                y: lostFoundAnimation.translateY,
                rotate: lostFoundAnimation.rotation,
              }}
              onMouseEnter={lostFoundAnimation.handleHover}
              onMouseLeave={lostFoundAnimation.handleLeave}
              onClick={() => {
                lostFoundAnimation.handlePress()
                haptics.impact('light')
                setCurrentView('lost-found')
              }}
            >
              <motion.div
                style={{
                  scale: lostFoundAnimation.iconScale,
                  rotate: lostFoundAnimation.iconRotation,
                }}
              >
                <MapPin size={22} weight={currentView === 'lost-found' ? 'fill' : 'regular'} />
              </motion.div>
              <span className="text-[10px] sm:text-xs font-semibold leading-tight">{t.nav['lost-found'] || 'Lost & Found'}</span>
              {currentView === 'lost-found' && (
                <motion.div
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 bg-linear-to-r from-primary via-accent to-secondary rounded-full shadow-lg shadow-primary/50"
                  style={{
                    opacity: lostFoundAnimation.indicatorOpacity,
                    width: lostFoundAnimation.indicatorWidth,
                  }}
                >
                  <div />
                </motion.div>
              )}
            </motion.div>

                        <NavButton
              isActive={currentView === 'profile'}
              onClick={() => { setCurrentView('profile'); }}
              icon={<User size={22} weight={currentView === 'profile' ? 'fill' : 'regular'} />}
              label={t.nav.profile}
              enablePulse={currentView === 'profile'}
            />
          </div>
        </div>
      </motion.div>

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
        <motion.div
          variants={generateProfilesModal.variants}
          initial="hidden"
          animate={showGenerateProfiles ? 'visible' : 'hidden'}
          exit="hidden"
          style={{
            opacity: generateProfilesModal.opacity,
          }}
          className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => { setShowGenerateProfiles(false); }}
        >
          <motion.div
            variants={generateProfilesContent.variants}
            initial="hidden"
            animate={showGenerateProfiles ? 'visible' : 'hidden'}
            exit="hidden"
            style={{
              opacity: generateProfilesContent.opacity,
              scale: generateProfilesContent.scale,
              y: generateProfilesContent.y,
            }}
            onClick={(e?: React.MouseEvent) => e?.stopPropagation()}
            className="bg-card p-6 rounded-2xl shadow-2xl max-w-md w-full border border-border/50"
          >
            <Suspense fallback={<LoadingState />}>
              <GenerateProfilesButton />
            </Suspense>
            <motion.div
              style={{ scale: closeButtonBounce.scale }}
              variants={closeButtonBounce.variants}
              whileTap="tap"
            >
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => {
                  closeButtonBounce.handlePress();
                  setShowGenerateProfiles(false);
                }}
              >
                Close
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
      {showStats && totalSwipes > 0 && (
        <motion.div
          variants={statsModal.variants}
          initial="hidden"
          animate={showStats ? 'visible' : 'hidden'}
          exit="hidden"
          style={{
            opacity: statsModal.opacity,
          }}
          className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => { setShowStats(false); }}
        >
          <motion.div
            variants={statsContent.variants}
            initial="hidden"
            animate={showStats ? 'visible' : 'hidden'}
            exit="hidden"
            style={{
              opacity: statsContent.opacity,
              scale: statsContent.scale,
              y: statsContent.y,
            }}
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
            <motion.div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => { setShowStats(false); }}
              >
                Close
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {showMap && (
        <motion.div
          variants={mapModal.variants}
          initial="hidden"
          animate={showMap ? 'visible' : 'hidden'}
          exit="hidden"
          style={{
            opacity: mapModal.opacity,
          }}
          className="fixed inset-0 z-50"
        >
          <Suspense fallback={<LoadingState />}>
            <motion.div
              variants={mapContent.variants}
              initial="hidden"
              animate={showMap ? 'visible' : 'hidden'}
              exit="hidden"
              style={{
                opacity: mapContent.opacity,
                scale: mapContent.scale,
                y: mapContent.y,
              }}
              className="h-full w-full"
            >
              <PlaydateMap
                playdates={playdates || []}
                onClose={() => { setShowMap(false); }}
              />
            </motion.div>
          </Suspense>
        </motion.div>
      )}

      {showAdminConsole && (
        <motion.div
          variants={adminModal.variants}
          initial="hidden"
          animate={showAdminConsole ? 'visible' : 'hidden'}
          exit="hidden"
          style={{
            opacity: adminModal.opacity,
          }}
          className="fixed inset-0 z-50 bg-background"
        >
          <motion.div
            variants={adminContent.variants}
            initial="hidden"
            animate={showAdminConsole ? 'visible' : 'hidden'}
            exit="hidden"
            style={{
              opacity: adminContent.opacity,
              scale: adminContent.scale,
              y: adminContent.y,
            }}
            className="h-full w-full"
          >
            <Suspense fallback={<LoadingState />}>
              <AdminConsole onClose={() => { setShowAdminConsole(false); }} />
            </Suspense>
          </motion.div>
        </motion.div>
      )}

      {showThemeSettings && (
        <Dialog open={showThemeSettings} onOpenChange={setShowThemeSettings}>
          <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto p-0">
            <DialogTitle className="sr-only">Ultra Theme Settings</DialogTitle>
            <motion.div
              variants={themeContent.variants}
              initial="hidden"
              animate={showThemeSettings ? 'visible' : 'hidden'}
              exit="hidden"
              style={{
                opacity: themeContent.opacity,
                scale: themeContent.scale,
                y: themeContent.y,
              }}
            >
              <Suspense fallback={<LoadingState />}>
                <UltraThemeSettings />
              </Suspense>
            </motion.div>
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
  )
}

export default App
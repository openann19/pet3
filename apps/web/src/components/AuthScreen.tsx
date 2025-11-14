import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Translate } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { haptics } from '@/lib/haptics';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useAnimatePresence } from '@/effects/reanimated/use-animate-presence';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming, cancelAnimation } from 'react-native-reanimated';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { RouteErrorBoundary } from '@/components/error/RouteErrorBoundary';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import SignInForm from './auth/SignInForm';
import SignUpForm from './auth/SignUpForm';

type AuthMode = 'signin' | 'signup';

interface AuthScreenProps {
  initialMode?: AuthMode;
  onBack: () => void;
  onSuccess: () => void;
}

export default function AuthScreen({ initialMode = 'signup', onBack, onSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const { t, language, toggleLanguage } = useApp();
  const prefersReducedMotion = useReducedMotion();
  const firstInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // Focus the first input when mode changes
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [mode]);

  // Animation values for header
  const headerOpacity = useSharedValue(prefersReducedMotion ? 1 : 0);
  const headerY = useSharedValue(prefersReducedMotion ? 0 : -20);
  const languageButtonOpacity = useSharedValue(prefersReducedMotion ? 1 : 0);

  // Initialize header animation
  useEffect(() => {
    if (prefersReducedMotion) {
      headerOpacity.value = 1;
      headerY.value = 0;
      languageButtonOpacity.value = 1;
      return;
    }

    headerOpacity.value = withSpring(1, { damping: 20, stiffness: 300 });
    headerY.value = withSpring(0, { damping: 20, stiffness: 300 });
    languageButtonOpacity.value = withTiming(1, { duration: 400 });

    return () => {
      cancelAnimation(headerOpacity);
      cancelAnimation(headerY);
      cancelAnimation(languageButtonOpacity);
    };
  }, [prefersReducedMotion, headerOpacity, headerY, languageButtonOpacity]);

  // Animated styles
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  })) as AnimatedStyle;

  const languageButtonStyle = useAnimatedStyle(() => ({
    opacity: languageButtonOpacity.value,
  })) as AnimatedStyle;

  // Presence animation for form switching
  const signInPresence = useAnimatePresence({ isVisible: mode === 'signin' });
  const signUpPresence = useAnimatePresence({ isVisible: mode === 'signup' });

  const handleModeSwitch = useCallback((newMode: AuthMode) => {
    haptics.trigger('selection');
    setMode(newMode);
  }, []);

  const handleBack = useCallback(() => {
    haptics.trigger('light');
    onBack();
  }, [onBack]);

  const handleLanguageToggle = useCallback(() => {
    haptics.trigger('selection');
    toggleLanguage();
  }, [toggleLanguage]);

  return (
    <RouteErrorBoundary>
      <div className="fixed inset-0 bg-background-cream overflow-auto" role="main" aria-label={mode === 'signin' ? t.auth?.signInTitle ?? 'Sign In' : t.auth?.signUpTitle ?? 'Sign Up'}>
        <div className="min-h-screen flex flex-col">
          {/* Header with back button and language toggle */}
          <AnimatedView style={headerStyle} className="p-4 sm:p-6 flex items-center justify-between" role="banner">
            <button
              onClick={handleBack}
              className="w-11 h-11 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              aria-label={t.common.back}
              type="button"
              tabIndex={0}
            >
              <ArrowLeft size={20} className="text-gray-700" aria-hidden />
            </button>
            <AnimatedView style={languageButtonStyle}>
              <button
                onClick={handleLanguageToggle}
                className="h-11 px-4 rounded-full bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                aria-pressed={language === 'bg'}
                aria-label={t.common.switchLanguage}
                tabIndex={0}
              >
                <Translate size={18} weight="regular" aria-hidden />
                <span>{language === 'en' ? 'БГ' : 'EN'}</span>
              </button>
            </AnimatedView>
          </AnimatedView>

          <div className="flex-1 flex items-center justify-center px-6 pb-12">
            <div className="w-full max-w-md">
              {signInPresence.shouldRender && mode === 'signin' && (
                <AnimatedView style={signInPresence.animatedStyle}>
                  <SignInForm
                    key="signin"
                    onSuccess={onSuccess}
                    onSwitchToSignUp={() => handleModeSwitch('signup')}
                    firstInputRef={firstInputRef}
                  />
                </AnimatedView>
              )}
              {signUpPresence.shouldRender && mode === 'signup' && (
                <AnimatedView style={signUpPresence.animatedStyle}>
                  <SignUpForm
                    key="signup"
                    onSuccess={onSuccess}
                    onSwitchToSignIn={() => handleModeSwitch('signin')}
                    firstInputRef={firstInputRef}
                  />
                </AnimatedView>
              )}
            </div>
          </div>
        </div>
      </div>
    </RouteErrorBoundary>
  );
}

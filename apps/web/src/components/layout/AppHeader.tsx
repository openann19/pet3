import { MotionView } from "@petspark/motion";
/**
 * AppHeader Component
 *
 * Main application header with logo and action buttons.
 * Extracted from App.tsx to follow mobile screen patterns.
 */

import { Suspense } from 'react';
import { Heart, Translate, ShieldCheck, Sun, Moon, Palette } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import type { UseAppAnimationsReturn } from '@/hooks/use-app-animations';
import { haptics } from '@/lib/haptics';

interface AppHeaderProps {
  title: string;
  language: string;
  theme: string;
  animations: UseAppAnimationsReturn;
  onToggleLanguage: () => void;
  onToggleTheme: () => void;
  onOpenAdminConsole: () => void;
  onOpenThemeSettings: () => void;
  SyncStatusIndicator: React.ComponentType;
  PremiumNotificationBell: React.ComponentType;
}

export function AppHeader({
  title,
  language,
  theme,
  animations,
  onToggleLanguage,
  onToggleTheme,
  onOpenAdminConsole,
  onOpenThemeSettings,
  SyncStatusIndicator,
  PremiumNotificationBell,
}: AppHeaderProps): JSX.Element {
  const {
    headerAnimation,
    logoButtonHover,
    logoAnimation,
    logoGlow,
    headerButtonsContainer,
    headerButton1,
    headerButton2,
    headerButton3,
    headerButton4,
    headerButton5,
    headerButton6,
    languageIconRotation,
  } = animations;

  return (
    <MotionView
      className="backdrop-blur-2xl bg-card/90 border-b border-border/50 sticky top-0 z-40 shadow-2xl shadow-primary/20"
      style={headerAnimation.headerStyle}
    >
      <div className="absolute inset-0 bg-linear-to-r from-primary/8 via-accent/8 to-secondary/8 pointer-events-none" />
      <MotionView
        className="absolute inset-0 bg-linear-to-r from-transparent via-primary/5 to-transparent pointer-events-none"
        style={headerAnimation.shimmerStyle}
      >
        <div />
      </MotionView>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 relative">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <MotionView
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
            style={logoButtonHover.animatedStyle}
            onMouseEnter={logoButtonHover.handleEnter}
            onMouseLeave={logoButtonHover.handleLeave}
          >
            <MotionView className="relative" style={logoAnimation.style}>
              <MotionView
                className="absolute inset-0 bg-linear-to-r from-primary/40 via-accent/40 to-primary/40 rounded-full blur-xl"
                style={logoGlow.style}
              >
                <div />
              </MotionView>
              <Heart
                className="text-primary drop-shadow-2xl relative z-10 group-hover:scale-125 transition-transform duration-300"
                size={24}
                weight="fill"
              />
            </MotionView>
            <h1 className="text-base sm:text-xl font-bold bg-linear-to-r from-primary via-accent to-secondary bg-clip-text text-transparent bg-size-[200%_auto] animate-gradient-x drop-shadow-sm">
              {title}
            </h1>
          </MotionView>
          <MotionView
            className="flex items-center gap-1 sm:gap-2"
            style={headerButtonsContainer.containerStyle}
          >
            <MotionView
              style={headerButton1.buttonStyle}
              onMouseEnter={headerButton1.handleEnter}
              onMouseLeave={headerButton1.handleLeave}
              onClick={headerButton1.handleTap}
            >
              <Suspense fallback={<div className="w-9 h-9" />}>
                <SyncStatusIndicator />
              </Suspense>
            </MotionView>
            <MotionView
              style={headerButton2.buttonStyle}
              onMouseEnter={headerButton2.handleEnter}
              onMouseLeave={headerButton2.handleLeave}
              onClick={headerButton2.handleTap}
            >
              <Suspense fallback={<div className="w-9 h-9" />}>
                <PremiumNotificationBell />
              </Suspense>
            </MotionView>
            <MotionView
              style={headerButton3.buttonStyle}
              onMouseEnter={headerButton3.handleEnter}
              onMouseLeave={headerButton3.handleLeave}
              onClick={headerButton3.handleTap}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  haptics.trigger('selection');
                  onToggleLanguage();
                }}
                className="rounded-full h-9 px-3 hover:bg-primary/15 active:bg-primary/25 transition-all duration-300 shadow-lg hover:shadow-primary/20 flex items-center gap-1.5"
                aria-label={language === 'en' ? 'Switch to Bulgarian' : 'Превключи на English'}
                aria-pressed={language === 'bg'}
                title={language === 'en' ? 'Switch to Bulgarian' : 'Превключи на English'}
              >
                <MotionView style={languageIconRotation.style}>
                  <Translate size={18} weight="bold" className="text-foreground" />
                </MotionView>
                <span className="text-xs font-semibold">{language === 'en' ? 'БГ' : 'EN'}</span>
              </Button>
            </MotionView>
            <MotionView
              style={headerButton4.buttonStyle}
              onMouseEnter={headerButton4.handleEnter}
              onMouseLeave={headerButton4.handleLeave}
              onClick={headerButton4.handleTap}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  haptics.impact('medium');
                  onOpenAdminConsole();
                }}
                className="rounded-full hover:bg-primary/15 active:bg-primary/25 transition-all duration-300 shadow-lg hover:shadow-primary/20"
                aria-label="Admin Console"
                title="Admin Console"
              >
                <ShieldCheck size={20} weight="bold" className="text-foreground" />
              </Button>
            </MotionView>
            <MotionView
              style={headerButton5.buttonStyle}
              onMouseEnter={headerButton5.handleEnter}
              onMouseLeave={headerButton5.handleLeave}
              onClick={headerButton5.handleTap}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  haptics.impact('light');
                  onToggleTheme();
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
              style={headerButton6.buttonStyle}
              onMouseEnter={headerButton6.handleEnter}
              onMouseLeave={headerButton6.handleLeave}
              onClick={headerButton6.handleTap}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  haptics.impact('medium');
                  onOpenThemeSettings();
                }}
                className="rounded-full hover:bg-primary/15 active:bg-primary/25 transition-all duration-300 shadow-lg hover:shadow-primary/20"
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
  );
}


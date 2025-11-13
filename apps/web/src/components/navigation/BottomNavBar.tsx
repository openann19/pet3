'use client';

import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { motion, useMotionValue, animate, useTransform } from 'framer-motion';
import { useNavButtonAnimation } from '@/hooks/use-nav-button-animation';
import { useBounceOnTap } from '@/effects/reanimated';
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import { getAriaNavigationAttributes } from '@/lib/accessibility';
import { isTruthy } from '@petspark/shared';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  badge?: number;
}

const items: NavItem[] = [
  { to: '/discover', label: 'Discover', icon: '🧭' },
  { to: '/chat', label: 'Chat', icon: '💬' },
  { to: '/matches', label: 'Matches', icon: '❤️' },
  { to: '/adopt', label: 'Adopt', icon: '🐾' },
  { to: '/community', label: 'Community', icon: '👥' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

export default function BottomNavBar() {
  const { pathname } = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const barOpacity = useMotionValue(0);
  const barY = useMotionValue(20);

  useEffect(() => {
    if (prefersReducedMotion) {
      barOpacity.set(1);
      barY.set(0);
      return;
    }
    
    setTimeout(() => {
      void animate(barOpacity, 1, {
        duration: motionDurations.smooth,
        ease: [0.2, 0, 0, 1],
      });
      void animate(barY, 0, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
    }, 200);
  }, [barOpacity, barY, prefersReducedMotion]);

  // Holographic shimmer effect
  const shimmerX = useMotionValue(-100);
  useEffect(() => {
    if (prefersReducedMotion) return;
    
    void animate(shimmerX, [300, -100], {
      duration: 4,
      repeat: Infinity,
      ease: 'linear',
    });
  }, [shimmerX, prefersReducedMotion]);

  const holographicGlow = useMotionValue(0.4);
  useEffect(() => {
    if (prefersReducedMotion) return;
    
    void animate(holographicGlow, [0.4, 0.7, 0.4], {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    });
  }, [holographicGlow, prefersReducedMotion]);

  return (
    <motion.div
      style={{
        opacity: barOpacity,
        y: barY,
      }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
    >
      <nav 
        className="border-t border-border/40 bg-card/85 backdrop-blur-3xl shadow-2xl relative overflow-hidden"
        aria-label="Bottom navigation"
      >
        <div className="relative overflow-hidden">
          {/* Holographic gradient layers */}
          <div className="absolute inset-0 bg-linear-to-t from-primary/15 via-accent/10 to-secondary/15 opacity-60 pointer-events-none" />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-accent/5 to-transparent pointer-events-none" />

          {/* Animated shimmer effect */}
          <motion.div
            style={{
              x: shimmerX,
            }}
            className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent w-1/2 h-full pointer-events-none"
          />

          {/* Pulsing glow effect */}
          <motion.div
            style={{
              opacity: holographicGlow,
            }}
            className="absolute inset-0 bg-linear-to-t from-accent/20 via-primary/15 to-accent/20 blur-2xl pointer-events-none"
          />

          {/* Glassmorphism overlay with enhanced blur */}
          <div className="absolute inset-0 bg-linear-to-t from-background/70 to-background/50 backdrop-blur-2xl pointer-events-none" />

          {/* Holographic color shift overlay */}
          <div className="absolute inset-0 bg-linear-to-r from-primary/10 via-accent/10 via-secondary/10 to-primary/10 opacity-40 pointer-events-none mix-blend-overlay" />

          <ul 
            className={cn(
              'grid grid-cols-6 relative z-10',
              getSpacingClassesFromConfig({ gap: 'xs' })
            )}
            role="list"
          >
            {items.map((item) => {
              const isActive = pathname.startsWith(item.to);
              const isHovered = hoveredItem === item.to;

              return (
                <NavItem
                  key={item.to}
                  item={item}
                  isActive={isActive}
                  isHovered={isHovered}
                  onHover={() => { setHoveredItem(item.to); }}
                  onLeave={() => { setHoveredItem(null); }}
                />
              );
            })}
          </ul>
        </div>
      </nav>
    </motion.div>
  );
}

interface NavItemProps {
  item: NavItem;
  isActive: boolean;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

function NavItem({ item, isActive, isHovered, onHover, onLeave }: NavItemProps) {
  const animation = useNavButtonAnimation({
    isActive,
    enablePulse: true,
    enableRotation: false,
    hapticFeedback: true,
  });

  const bounceAnimation = useBounceOnTap({
    scale: 0.85,
    hapticFeedback: false,
  });

  const iconScale = useMotionValue(1);
  const iconY = useMotionValue(0);
  const glowOpacity = useMotionValue(0);

  // Combined icon scale from both animation and local state
  const combinedIconScale = useTransform(
    [iconScale, animation.iconScale],
    ([local, anim]: number[]) => (local ?? 1) * (anim ?? 1)
  );

  useEffect(() => {
    if (isActive) {
      void animate(iconScale, 1.15, {
        type: 'spring',
        damping: springConfigs.bouncy.damping,
        stiffness: springConfigs.bouncy.stiffness,
      });
      void animate(iconY, -2, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
      void animate(glowOpacity, 1, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
    } else {
      void animate(iconScale, 1, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
      void animate(iconY, 0, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
      void animate(glowOpacity, 0, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
    }
  }, [isActive, iconScale, iconY, glowOpacity]);

  useEffect(() => {
    if (isHovered && !isActive) {
      void animate(iconScale, 1.1, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
    } else if (!isActive) {
      void animate(iconScale, 1, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
    }
  }, [isHovered, isActive, iconScale]);

  const handleClick = useCallback(() => {
    bounceAnimation.handlePress();
    if (!isActive) {
      haptics.impact('light');
    }
  }, [bounceAnimation, isActive]);

  const navAriaAttrs = getAriaNavigationAttributes({
    label: item.label,
    current: isActive ? 'page' : undefined,
  });

  return (
    <li className="text-center relative" role="listitem">
      <Link
        to={item.to}
        className={cn(
          'block relative group',
          getSpacingClassesFromConfig({ paddingY: 'md', paddingX: 'xs' })
        )}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        onClick={handleClick}
        {...navAriaAttrs}
      >
        <motion.div
          style={{
            scale: animation.scale,
            y: animation.translateY,
            rotate: animation.rotation,
          }}
          className={cn(
            'relative flex flex-col items-center justify-center',
            getSpacingClassesFromConfig({ gap: 'xs' })
          )}
        >
          {/* Active indicator background */}
          {isActive && (
            <motion.div
              style={{
                opacity: animation.indicatorOpacity,
                width: animation.indicatorWidth,
              }}
              className="absolute inset-0 rounded-2xl bg-(--coral-primary)/20 blur-xl"
            >
              <></>
            </motion.div>
          )}

          {/* Glow effect for active item */}
          {isActive && (
            <motion.div
              style={{
                opacity: useTransform(glowOpacity, (value) => value * 0.6),
              }}
              className="absolute inset-0 rounded-2xl bg-(--coral-primary)/30 blur-2xl -z-10"
            >
              <></>
            </motion.div>
          )}

          {/* Icon container */}
          <motion.div
            style={{
              scale: combinedIconScale,
              y: iconY,
            }}
            className="relative z-10"
            aria-hidden="true"
          >
            <span className="text-2xl leading-none select-none">{item.icon}</span>
          </motion.div>

          {/* Label */}
          <span
            className={cn(
              getTypographyClasses('caption'),
              'transition-all duration-200 relative z-10',
              isActive ? 'text-(--coral-primary) font-bold' : 'text-(--text-secondary) opacity-70'
            )}
          >
            {item.label}
          </span>

          {/* Active indicator dot */}
          {isActive && (
            <motion.div
              style={{
                opacity: animation.indicatorOpacity,
                width: animation.indicatorWidth,
              }}
              className="absolute bottom-0 w-1 h-1 rounded-full bg-(--coral-primary)"
            >
              <></>
            </motion.div>
          )}

          {/* Badge */}
          {item.badge && item.badge > 0 && <Badge count={item.badge} isActive={isActive} />}
        </motion.div>
      </Link>
    </li>
  );
}

interface BadgeProps {
  count: number;
  isActive: boolean;
}

function Badge({ count, isActive }: BadgeProps) {
  const scale = useMotionValue(0);
  const opacity = useMotionValue(0);
  const pulseScale = useMotionValue(1);

  // Combined scale
  const combinedScale = useTransform(
    [scale, pulseScale],
    ([s, p]: number[]) => (s ?? 0) * (p ?? 1)
  );

  useEffect(() => {
    void animate(scale, 1, {
      type: 'spring',
      damping: springConfigs.bouncy.damping,
      stiffness: springConfigs.bouncy.stiffness,
    });
    void animate(opacity, 1, {
      duration: motionDurations.fast,
      ease: [0.2, 0, 0, 1],
    });
  }, [scale, opacity]);

  useEffect(() => {
    if (isTruthy(isActive)) {
      void animate(pulseScale, 1.2, {
        type: 'spring',
        damping: springConfigs.bouncy.damping,
        stiffness: springConfigs.bouncy.stiffness,
      }).then(() => {
        void animate(pulseScale, 1, {
          type: 'spring',
          damping: springConfigs.smooth.damping,
          stiffness: springConfigs.smooth.stiffness,
        });
      });
    }
  }, [isActive, pulseScale]);

  return (
    <motion.div
      style={{
        scale: combinedScale,
        opacity,
      }}
      className={cn(
        'absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-destructive flex items-center justify-center shadow-lg z-20',
        getSpacingClassesFromConfig({ paddingX: 'xs' })
      )}
      aria-label={`${count} ${count === 1 ? 'notification' : 'notifications'}`}
    >
      <span className={cn(
        getTypographyClasses('caption'),
        'font-bold text-destructive-foreground'
      )}>
        {count > 9 ? '9+' : count}
      </span>
    </motion.div>
  );
}

'use client';

import { useState } from 'react';
import { motion, useMotionValue, animate, useTransform, AnimatePresence } from 'framer-motion';
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import React from 'react';
import {
  Plus,
  X,
  PawPrint,
  Heart,
  Calendar,
  BookmarkSimple,
  Sparkle,
  ChartBar,
  MapTrifold,
} from '@phosphor-icons/react';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import type { ReactNode } from 'react';

const logger = createLogger('QuickActionsMenu');

interface QuickActionItemProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  color: string;
  index: number;
}

function QuickActionItem({ icon, label, onClick, color, index }: QuickActionItemProps) {
  const prefersReducedMotion = useReducedMotion();
  const itemOpacity = useMotionValue(0);
  const itemX = useMotionValue(50);
  const itemScale = useMotionValue(0.8);
  const hoverScale = useMotionValue(1);
  const hoverX = useMotionValue(0);

  const translateX = useTransform([itemX, hoverX], ([x, hx]) => x + hx);
  const scale = useTransform([itemScale, hoverScale], ([s, hs]) => s * hs);

  React.useEffect(() => {
    if (prefersReducedMotion) {
      itemOpacity.set(1);
      itemX.set(0);
      itemScale.set(1);
      return;
    }

    const delay = index * 50;
    const timeoutId = setTimeout(() => {
      void animate(itemOpacity, 1, {
        type: 'spring',
        stiffness: 500,
        damping: 30,
      });
      void animate(itemX, 0, {
        type: 'spring',
        stiffness: 500,
        damping: 30,
      });
      void animate(itemScale, 1, {
        type: 'spring',
        stiffness: 500,
        damping: 30,
      });
    }, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [index, itemOpacity, itemX, itemScale, prefersReducedMotion]);

  const handleMouseEnter = React.useCallback(() => {
    if (!prefersReducedMotion) {
      void animate(hoverScale, 1.1, { duration: motionDurations.fast });
      void animate(hoverX, -5, { duration: motionDurations.fast });
    }
  }, [hoverScale, hoverX, prefersReducedMotion]);

  const handleMouseLeave = React.useCallback(() => {
    if (!prefersReducedMotion) {
      void animate(hoverScale, 1, { duration: motionDurations.fast });
      void animate(hoverX, 0, { duration: motionDurations.fast });
    }
  }, [hoverScale, hoverX, prefersReducedMotion]);

  const handleClick = React.useCallback(() => {
    try {
      haptics.selection();
      onClick();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('QuickActionItem onClick error', err);
    }
  }, [onClick]);

  return (
    <motion.button
      style={{
        opacity: itemOpacity,
        x: translateX,
        scale,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className="group flex items-center gap-3 bg-card/95 backdrop-blur-md border border-border rounded-full px-4 py-3 shadow-lg hover:shadow-xl transition-all"
    >
      <div
        className={`w-10 h-10 rounded-full bg-linear-to-br ${color} flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-shadow`}
      >
        {icon}
      </div>
      <span className="font-medium text-sm pr-2">{label}</span>
    </motion.button>
  );
}

interface QuickActionsMenuProps {
  onCreatePet: () => void;
  onViewHealth: () => void;
  onSchedulePlaydate: () => void;
  onSavedSearches: () => void;
  onGenerateProfiles: () => void;
  onViewStats: () => void;
  onViewMap?: () => void;
}

export default function QuickActionsMenu({
  onCreatePet,
  onViewHealth,
  onSchedulePlaydate,
  onSavedSearches,
  onGenerateProfiles,
  onViewStats,
  onViewMap,
}: QuickActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = React.useCallback(() => {
    try {
      haptics.light();
      setIsOpen((prev) => !prev);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('QuickActionsMenu handleToggle error', err);
      // Still toggle state even if haptics fails
      setIsOpen((prev) => !prev);
    }
  }, []);

  const actions = React.useMemo(
    () => [
      {
        icon: <PawPrint size={20} weight="fill" />,
        label: 'Add Pet',
        onClick: () => {
          try {
            onCreatePet();
            setIsOpen(false);
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('QuickActionsMenu onCreatePet error', err);
            setIsOpen(false);
          }
        },
        color: 'from-primary to-accent',
      },
      {
        icon: <Heart size={20} weight="fill" />,
        label: 'Health',
        onClick: () => {
          try {
            onViewHealth();
            setIsOpen(false);
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('QuickActionsMenu onViewHealth error', err);
            setIsOpen(false);
          }
        },
        color: 'from-red-500 to-pink-500',
      },
      {
        icon: <Calendar size={20} weight="fill" />,
        label: 'Schedule',
        onClick: () => {
          try {
            onSchedulePlaydate();
            setIsOpen(false);
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('QuickActionsMenu onSchedulePlaydate error', err);
            setIsOpen(false);
          }
        },
        color: 'from-blue-500 to-cyan-500',
      },
      ...(onViewMap
        ? [
          {
            icon: <MapTrifold size={20} weight="fill" />,
            label: 'Map',
            onClick: () => {
              try {
                onViewMap();
                setIsOpen(false);
              } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                logger.error('QuickActionsMenu onViewMap error', err);
                setIsOpen(false);
              }
            },
            color: 'from-teal-500 to-cyan-500',
          },
        ]
        : []),
      {
        icon: <BookmarkSimple size={20} weight="fill" />,
        label: 'Saved',
        onClick: () => {
          try {
            onSavedSearches();
            setIsOpen(false);
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('QuickActionsMenu onSavedSearches error', err);
            setIsOpen(false);
          }
        },
        color: 'from-yellow-500 to-orange-500',
      },
      {
        icon: <Sparkle size={20} weight="fill" />,
        label: 'Generate',
        onClick: () => {
          try {
            onGenerateProfiles();
            setIsOpen(false);
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('QuickActionsMenu onGenerateProfiles error', err);
            setIsOpen(false);
          }
        },
        color: 'from-purple-500 to-pink-500',
      },
      {
        icon: <ChartBar size={20} weight="fill" />,
        label: 'Stats',
        onClick: () => {
          try {
            onViewStats();
            setIsOpen(false);
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('QuickActionsMenu onViewStats error', err);
            setIsOpen(false);
          }
        },
        color: 'from-green-500 to-emerald-500',
      },
    ],
    [
      onCreatePet,
      onViewHealth,
      onSchedulePlaydate,
      onViewMap,
      onSavedSearches,
      onGenerateProfiles,
      onViewStats,
    ]
  );

  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="fixed bottom-24 right-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={prefersReducedMotion ? { duration: 0.1 } : { type: 'spring', stiffness: 500, damping: 30 }}
            className="flex flex-col gap-3 mb-4"
          >
            {actions.map((action, index) => (
              <QuickActionItem
                key={action.label}
                icon={action.icon}
                label={action.label}
                onClick={action.onClick}
                color={action.color}
                index={index}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleToggle}
        className={`w-14 h-14 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-white shadow-2xl hover:shadow-primary/50 transition-all ${isOpen ? 'rotate-45' : ''}`}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ duration: prefersReducedMotion ? 0.1 : 0.3, ease: 'easeInOut' }}
      >
        <AnimatePresence mode="wait">
          {!isOpen ? (
            <motion.div
              key="open"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
              transition={{ duration: prefersReducedMotion ? 0.1 : 0.2 }}
            >
              <Plus size={24} weight="bold" />
            </motion.div>
          ) : (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: prefersReducedMotion ? 0.1 : 0.2 }}
            >
              <X size={24} weight="bold" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleToggle}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

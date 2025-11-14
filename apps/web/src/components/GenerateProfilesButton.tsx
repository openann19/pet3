import { useState, useEffect, memo } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { useStorage } from '@/hooks/use-storage';
import { Button } from '@/components/ui/button';
import { Sparkle, Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { generateSamplePets } from '@/lib/seedData';
import type { Pet } from '@/lib/types';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import { useHoverLift } from '@/effects/framer-motion/hooks';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';

interface GenerateProfilesButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
}

export default function GenerateProfilesButton({
  variant = 'default',
  size = 'default',
  showLabel = true,
}: GenerateProfilesButtonProps) {
  const [, setAllPets] = useStorage<Pet[]>('all-pets', []);
  const [isGenerating, setIsGenerating] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const buttonHover = useHoverLift({
    scale: prefersReducedMotion ? 1 : 1.02,
    translateY: 0,
  });
  const shimmerX = useMotionValue(-100);
  const iconRotate = useMotionValue(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      shimmerX.set(-100);
      iconRotate.set(0);
      return;
    }

    if (isGenerating) {
      void animate(shimmerX, [200, -100], {
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      });
      void animate(iconRotate, 360, {
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      });
    } else {
      shimmerX.set(-100);
      iconRotate.set(0);
    }
  }, [isGenerating, shimmerX, iconRotate, prefersReducedMotion]);

  const handleGenerateProfiles = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    haptics.trigger('selection');

    try {
      const newPets = await generateSamplePets(15);
      void setAllPets((current) => {
        const currentPets = current ?? [];
        return [...currentPets, ...newPets];
      });

      haptics.trigger('success');
      toast.success('Profiles Generated!', {
        description: `${newPets.length} new pet profiles added to discovery`,
      });
    } catch (error) {
      const logger = createLogger('GenerateProfilesButton');
      logger.error(
        'Failed to generate profiles',
        error instanceof Error ? error : new Error('Failed to generate profiles')
      );
      haptics.trigger('error');
      toast.error('Error', {
        description: 'Failed to generate new profiles. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={showLabel ? 'w-full' : ''}>
      <motion.div
        style={{
          scale: buttonHover.scale,
        }}
        onMouseEnter={buttonHover.handleEnter}
        onMouseLeave={buttonHover.handleLeave}
      >
        <Button
          onClick={() => {
            void handleGenerateProfiles();
          }}
          disabled={isGenerating}
          variant={variant}
          size={size}
          aria-label={showLabel ? undefined : (isGenerating ? 'Generating profiles' : 'Generate more profiles')}
          aria-busy={isGenerating}
          className={
            showLabel
              ? 'w-full h-12 bg-linear-to-r from-primary via-accent to-secondary hover:from-primary/90 hover:via-accent/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all relative overflow-hidden group focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
              : 'relative overflow-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
          }
        >
          {showLabel && (
            <motion.div
              style={{
                x: shimmerX,
              }}
              className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
              aria-hidden="true"
            />
          )}
          <motion.div
            style={{
              rotate: iconRotate,
            }}
            className={showLabel ? 'mr-2' : ''}
            aria-hidden="true"
          >
            {isGenerating ? (
              <Sparkle size={20} weight="fill" aria-hidden="true" />
            ) : (
              <Plus size={20} weight="bold" aria-hidden="true" />
            )}
          </motion.div>
          {showLabel && (
            <span className="relative z-10 font-semibold">
              {isGenerating ? 'Generating Profiles...' : 'Generate More Profiles'}
            </span>
          )}
        </Button>
      </motion.div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export const MemoizedGenerateProfilesButton = memo(GenerateProfilesButton);

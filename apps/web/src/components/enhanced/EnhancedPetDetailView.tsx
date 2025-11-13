'use client';

import { useCallback, useState } from 'react';
import {
  Calendar,
  ChatCircle,
  Heart,
  Lightning,
  MapPin,
  PawPrint,
  ShieldCheck,
  Star,
  TrendUp,
  Users,
  X,
} from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSwipeGesture } from '@/hooks/use-swipe-gesture';
import { motion, AnimatePresence } from 'framer-motion';
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap';
import React from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { haptics } from '@/lib/haptics';
import type { Pet } from '@/lib/types';
import { useUIConfig } from "@/hooks/use-ui-config";
import { 
  getTypographyClasses, 
  getSpacingClassesFromConfig,
  getSpacingClasses,
  getRadiusClasses,
  getShadowClasses,
} from '@/lib/design-token-utils';
import { cn } from '@/lib/utils';
import { dialogVariants, dialogOverlayVariants, springConfigs, motionDurations } from '@/effects/framer-motion/variants';

export interface EnhancedPetDetailViewProps {
  pet: Pet;
  onClose: () => void;
  onLike?: () => void;
  onPass?: () => void;
  onChat?: () => void;
  compatibilityScore?: number;
  matchReasons?: string[];
  showActions?: boolean;
}

export function EnhancedPetDetailView({
  pet,
  onClose,
  onLike,
  onPass,
  onChat,
  compatibilityScore,
  matchReasons,
  showActions = true,
}: EnhancedPetDetailViewProps): React.JSX.Element {
  const _uiConfig = useUIConfig();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const photos = pet.photos && pet.photos.length > 0 ? pet.photos : [pet.photo];

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose]);

  const handleNextPhoto = useCallback((): void => {
    setIsLoading(true);
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    haptics.trigger('light');
  }, [photos.length]);

  const handlePrevPhoto = useCallback((): void => {
    setIsLoading(true);
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    haptics.trigger('light');
  }, [photos.length]);

  const swipeGesture = useSwipeGesture({
    onSwipeLeft: handleNextPhoto,
    onSwipeRight: handlePrevPhoto,
    threshold: 50,
  });

  const handleImageLoad = useCallback((): void => {
    setIsLoading(false);
  }, []);

  const handleImageError = useCallback((): void => {
    setIsLoading(false);
  }, []);

  const handleLike = useCallback(() => {
    haptics.trigger('medium');
    onLike?.();
  }, [onLike]);

  const handlePass = useCallback(() => {
    haptics.trigger('light');
    onPass?.();
  }, [onPass]);

  const handleChat = useCallback(() => {
    haptics.trigger('light');
    onChat?.();
  }, [onChat]);

  const trustScore = pet.trustScore ?? 0;
  const getTrustLevel = useCallback((score: number) => {
    if (score >= 80) return { label: 'Highly Trusted', color: 'text-green-500' };
    if (score >= 60) return { label: 'Trusted', color: 'text-blue-500' };
    if (score >= 40) return { label: 'Established', color: 'text-yellow-500' };
    return { label: 'New', color: 'text-muted-foreground' };
  }, []);

  const trustLevel = getTrustLevel(trustScore);
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            "fixed inset-0 bg-background/95 backdrop-blur-xl z-50 flex items-center justify-center",
            getSpacingClasses('md', 'padding')
          )}
          onClick={handleClose}
          variants={reducedMotion ? undefined : dialogOverlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            className={cn(
              "w-full max-w-4xl max-h-[90vh] bg-card overflow-hidden",
              getRadiusClasses('3xl'),
              getShadowClasses('modal')
            )}
            onClick={(e) => e.stopPropagation()}
            variants={reducedMotion ? undefined : dialogVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className={cn("absolute top-4 right-4 z-10")}>
            <CloseButton onClose={handleClose} />
          </div>

          <ScrollArea className="flex-1">
            {/* Photo Gallery */}
            <div className="relative h-96 bg-muted overflow-hidden" {...swipeGesture.handlers}>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPhotoIndex}
                  className="w-full h-full"
                  initial={reducedMotion ? undefined : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reducedMotion ? undefined : { opacity: 0 }}
                  transition={reducedMotion ? undefined : {
                    ...springConfigs.smooth,
                    duration: motionDurations.smooth,
                  }}
                >
                  <img
                    src={photos[currentPhotoIndex]}
                    alt={pet.name}
                    className="w-full h-full object-cover"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                </motion.div>
              </AnimatePresence>

              {photos.length > 1 && (
                <>
                  <div className={cn(
                    "absolute inset-0 flex items-center justify-between pointer-events-none",
                    getSpacingClasses('md', 'paddingX')
                  )}>
                    <PhotoNavButton onClick={handlePrevPhoto} />
                    <PhotoNavButton onClick={handleNextPhoto} />
                  </div>
                  <div className={cn(
                    "absolute bottom-4 left-1/2 -translate-x-1/2 flex",
                    getSpacingClasses('sm', 'gap')
                  )}>
                    {photos.map((_, idx) => (
                      <PhotoIndicator
                        key={idx}
                        index={idx}
                        isActive={idx === currentPhotoIndex}
                        onClick={() => {
                          setIsLoading(true);
                          setCurrentPhotoIndex(idx);
                        }}
                      />
                    ))}
                  </div>
                </>
              )}

              {compatibilityScore !== undefined && (
                <CompatibilityBadge score={compatibilityScore} />
              )}
            </div>

            {/* Content */}
            <div className={cn(
              getSpacingClasses('lg', 'padding'),
              getSpacingClasses('lg', 'spaceY')
            )}>
              {/* Header Info */}
              <PetHeader pet={pet} trustScore={trustScore} trustLevel={trustLevel} />

              {/* Match Reasons */}
              {matchReasons && matchReasons.length > 0 && (
                <MatchReasonsCard reasons={matchReasons} />
              )}

              {/* Tabs */}
              <PetTabs pet={pet} />
            </div>
          </ScrollArea>

          {/* Actions */}
          {showActions && (
            <ActionButtons
              onLike={onLike ? handleLike : undefined}
              onPass={onPass ? handlePass : undefined}
              onChat={onChat ? handleChat : undefined}
            />
          )}
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface CloseButtonProps {
  onClose: () => void;
}

function CloseButton({ onClose }: CloseButtonProps): React.JSX.Element {
  const bounce = useBounceOnTap({ onPress: onClose });

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={bounce.handlePress}
      className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
      aria-label="Close pet detail view"
    >
      <motion.div
        variants={bounce.variants}
        initial="rest"
        whileTap="tap"
      >
        <X size={24} weight="bold" />
      </motion.div>
    </Button>
  );
}

interface PhotoNavButtonProps {
  onClick: () => void;
}

function PhotoNavButton({ onClick }: PhotoNavButtonProps): React.JSX.Element {
  const bounce = useBounceOnTap({ onPress: onClick });

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={bounce.handlePress}
      className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-background pointer-events-auto"
      aria-label="Navigate to next photo"
    >
      <motion.div
        variants={bounce.variants}
        initial="rest"
        whileTap="tap"
      >
        <PawPrint size={20} weight="fill" />
      </motion.div>
    </Button>
  );
}

interface PhotoIndicatorProps {
  index: number;
  isActive: boolean;
  onClick: () => void;
}

function PhotoIndicator({ index, isActive, onClick }: PhotoIndicatorProps): React.JSX.Element {
  const reducedMotion = useReducedMotion();

  return (
    <button
      onClick={onClick}
      className={`h-2 rounded-full transition-all overflow-hidden ${isActive ? 'w-6 bg-white' : 'w-2 bg-white/50'
        }`}
      aria-label={`Go to photo ${index + 1}`}
    >
      <motion.div
        className="h-full rounded-full bg-white"
        animate={reducedMotion ? undefined : {
          width: isActive ? 24 : 8,
          opacity: isActive ? 1 : 0.5,
        }}
        transition={reducedMotion ? undefined : {
          ...springConfigs.smooth,
          duration: motionDurations.normal,
        }}
      />
    </button>
  );
}

interface CompatibilityBadgeProps {
  score: number;
}

function CompatibilityBadge({ score }: CompatibilityBadgeProps): React.JSX.Element {
  const reducedMotion = useReducedMotion();

  return (
    <div className="absolute top-4 left-4">
      <motion.div
        className={cn(
          "flex items-center rounded-full bg-linear-to-r from-primary to-accent backdrop-blur-sm",
          getSpacingClasses('sm', 'gap'),
          getSpacingClasses('md', 'paddingX'),
          getSpacingClasses('sm', 'paddingY'),
          getRadiusClasses('full')
        )}
        initial={reducedMotion ? false : { opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={reducedMotion ? undefined : {
          ...springConfigs.smooth,
          duration: motionDurations.smooth,
        }}
      >
        <TrendUp size={20} weight="bold" className="text-white" aria-hidden="true" />
        <span className={cn(getTypographyClasses('h3'), 'font-bold text-white')}>{score}% Match</span>
      </motion.div>
    </div>
  );
}

interface PetHeaderProps {
  pet: Pet;
  trustScore: number;
  trustLevel: { label: string; color: string };
}

function PetHeader({ pet, trustScore, trustLevel }: PetHeaderProps): React.JSX.Element {
  return (
    <div>
      <div className={cn("flex items-start justify-between", getSpacingClassesFromConfig({ marginY: 'sm' }))}>
        <div>
          <h1 className={cn(getTypographyClasses('h1'))}>{pet.name}</h1>
          <p className={cn(getTypographyClasses('body'), 'text-muted-foreground')}>
            {pet.breed} • {pet.age} {pet.age === 1 ? 'year' : 'years'}
          </p>
        </div>
        {trustScore > 0 && (
          <div className={cn('flex flex-col items-end', getSpacingClassesFromConfig({ gap: 'xs' }))}>
            <div className={cn('flex items-center', getSpacingClassesFromConfig({ gap: 'sm' }))}>
              <ShieldCheck size={20} className={trustLevel.color} weight="fill" aria-hidden="true" />
              <span className={cn('font-semibold', trustLevel.color)}>{trustLevel.label}</span>
            </div>
            <span className={cn(getTypographyClasses('bodySmall'), 'text-muted-foreground')}>Trust Score: {trustScore}</span>
          </div>
        )}
      </div>

      <div className={cn("flex items-center text-muted-foreground", getSpacingClasses('sm', 'gap'))}>
        <MapPin size={16} weight="fill" />
        <span>{pet.location}</span>
      </div>
    </div>
  );
}

interface MatchReasonsCardProps {
  reasons: string[];
}

function MatchReasonsCard({ reasons }: MatchReasonsCardProps): React.JSX.Element {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardContent className={cn(
        getSpacingClassesFromConfig({ padding: 'lg', spaceY: 'sm' })
      )}>
        <h3 className={cn(
          getTypographyClasses('h3'),
          'flex items-center',
          getSpacingClassesFromConfig({ gap: 'sm' })
        )}>
          <Star size={20} className="text-accent" weight="fill" aria-hidden="true" />
          Why This Match Works
        </h3>
        <ul className={getSpacingClassesFromConfig({ spaceY: 'xs' })}>
          {reasons.map((reason, idx) => (
            <MatchReasonItem key={idx} reason={reason} index={idx} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

interface MatchReasonItemProps {
  reason: string;
  index: number;
}

function MatchReasonItem({ reason, index }: MatchReasonItemProps): React.JSX.Element {
  const reducedMotion = useReducedMotion();

  return (
    <motion.li
      className={cn(
        'flex items-start',
        getTypographyClasses('bodySmall'),
        getSpacingClassesFromConfig({ gap: 'sm' })
      )}
      initial={reducedMotion ? false : { opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={reducedMotion ? undefined : {
        ...springConfigs.smooth,
        duration: motionDurations.smooth,
        delay: index * 0.05,
      }}
    >
      <Heart
        size={14}
        className={cn('text-primary shrink-0', getSpacingClassesFromConfig({ marginY: 'xs' }))}
        weight="fill"
        aria-hidden="true"
      />
      <span>{reason}</span>
    </motion.li>
  );
}

interface PetTabsProps {
  pet: Pet;
}

function PetTabs({ pet }: PetTabsProps): React.JSX.Element {
  return (
    <Tabs defaultValue="about" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="about">About</TabsTrigger>
        <TabsTrigger value="personality">Personality</TabsTrigger>
        <TabsTrigger value="stats">Stats</TabsTrigger>
      </TabsList>

      <TabsContent value="about" className={cn(
        getSpacingClassesFromConfig({ spaceY: 'lg', marginY: 'lg' })
      )}>
        <div>
          <h3 className={cn(
            getTypographyClasses('h3'),
            'font-semibold',
            getSpacingClassesFromConfig({ marginY: 'sm' })
          )}>Bio</h3>
          <p className={cn(getTypographyClasses('body'), 'text-muted-foreground')}>{pet.bio}</p>
        </div>

        {pet.interests && pet.interests.length > 0 && (
          <div>
            <h3 className={cn(
              getTypographyClasses('h3'),
              'font-semibold',
              getSpacingClassesFromConfig({ marginY: 'sm' })
            )}>Interests</h3>
            <div className={cn('flex flex-wrap', getSpacingClassesFromConfig({ gap: 'sm' }))}>
              {pet.interests.map((interest, idx) => (
                <Badge key={idx} variant="secondary">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {pet.lookingFor && pet.lookingFor.length > 0 && (
          <div>
            <h3 className={cn(
              getTypographyClasses('h3'),
              'font-semibold',
              getSpacingClassesFromConfig({ marginY: 'sm' })
            )}>Looking For</h3>
            <div className={cn('flex flex-wrap', getSpacingClassesFromConfig({ gap: 'sm' }))}>
              {pet.lookingFor.map((item, idx) => (
                <Badge key={idx} variant="outline">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="personality" className={cn(
        getSpacingClassesFromConfig({ spaceY: 'lg', marginY: 'lg' })
      )}>
        {pet.personality && pet.personality.length > 0 && (
          <div>
            <h3 className={cn(
              getTypographyClasses('h3'),
              'font-semibold',
              getSpacingClassesFromConfig({ marginY: 'md' })
            )}>Personality Traits</h3>
            <div className={cn('grid grid-cols-2', getSpacingClassesFromConfig({ gap: 'md' }))}>
              {pet.personality.map((trait, idx) => (
                <PersonalityTrait key={idx} trait={trait} index={idx} />
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className={cn(
            getTypographyClasses('h3'),
            'font-semibold',
            getSpacingClassesFromConfig({ marginY: 'sm' })
          )}>Activity Level</h3>
          <div className={getSpacingClassesFromConfig({ spaceY: 'sm' })}>
            <div className={cn('flex justify-between', getTypographyClasses('bodySmall'))}>
              <span>Energy</span>
              <span className="font-medium">{pet.activityLevel ?? 'Moderate'}</span>
            </div>
            <Progress value={75} className="h-2" />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="stats" className={cn(
        getSpacingClassesFromConfig({ spaceY: 'lg', marginY: 'lg' })
      )}>
        <div className={cn('grid grid-cols-2', getSpacingClassesFromConfig({ gap: 'lg' }))}>
          <StatCard
            icon={Users}
            label="Playdates"
            value={String(pet.playdateCount ?? 0)}
            color="primary"
          />
          <StatCard
            icon={Star}
            label="Rating"
            value={pet.overallRating?.toFixed(1) ?? 'N/A'}
            color="accent"
          />
          <StatCard
            icon={Lightning}
            label="Response Rate"
            value={`${Math.round((pet.responseRate ?? 0) * 100)}%`}
            color="secondary"
          />
          <StatCard
            icon={Calendar}
            label="Member Since"
            value={String(new Date(pet.createdAt ?? Date.now()).getFullYear())}
            color="lavender"
          />
        </div>

        {pet.badges && pet.badges.length > 0 && (
          <div>
            <h3 className={cn(
              getTypographyClasses('h3'),
              'font-semibold',
              getSpacingClassesFromConfig({ marginY: 'md' })
            )}>Trust Badges</h3>
            <div className={cn('flex flex-wrap', getSpacingClassesFromConfig({ gap: 'sm' }))}>
              {pet.badges.map((badge, idx) => (
                <TrustBadgeItem key={idx} badge={badge} index={idx} />
              ))}
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

interface PersonalityTraitProps {
  trait: string;
  index: number;
}

function PersonalityTrait({ trait, index }: PersonalityTraitProps): React.JSX.Element {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(
        'rounded-lg bg-muted/50 border border-border text-center',
        getSpacingClassesFromConfig({ padding: 'md' })
      )}
      initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={reducedMotion ? undefined : {
        ...springConfigs.smooth,
        duration: motionDurations.smooth,
        delay: index * 0.05,
      }}
    >
      <PawPrint
        size={24}
        className={cn('text-primary mx-auto', getSpacingClassesFromConfig({ marginY: 'xs' }))}
        weight="fill"
        aria-hidden="true"
      />
      <span className={cn(getTypographyClasses('bodySmall'), 'font-medium')}>{trait}</span>
    </motion.div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<React.ComponentProps<typeof Star>>;
  label: string;
  value: string;
  color: 'primary' | 'accent' | 'secondary' | 'lavender';
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps): React.JSX.Element {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    secondary: 'bg-secondary/10 text-secondary',
    lavender: 'bg-lavender/10 text-lavender',
  };

  return (
    <Card>
      <CardContent className={getSpacingClassesFromConfig({ padding: 'lg' })}>
        <div className={cn('flex items-center', getSpacingClassesFromConfig({ gap: 'md' }))}>
          <div className={cn('rounded-lg', getSpacingClassesFromConfig({ padding: 'sm' }), colorClasses[color])}>
            <Icon size={24} weight="duotone" aria-hidden="true" />
          </div>
          <div>
            <p className={cn(getTypographyClasses('bodySmall'), 'text-muted-foreground')}>{label}</p>
            <p className={cn(getTypographyClasses('h2'), 'font-bold')}>{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TrustBadgeItemProps {
  badge: { label: string };
  index: number;
}

function TrustBadgeItem({ badge, index }: TrustBadgeItemProps): React.JSX.Element {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={reducedMotion ? undefined : {
        ...springConfigs.smooth,
        duration: motionDurations.smooth,
        delay: index * 0.05,
      }}
    >
      <Badge className={getSpacingClassesFromConfig({ paddingX: 'md', paddingY: 'xs' })}>
        <ShieldCheck
          size={14}
          className={getSpacingClassesFromConfig({ marginX: 'xs' })}
          weight="fill"
          aria-hidden="true"
        />
        {badge.label}
      </Badge>
    </motion.div>
  );
}

interface ActionButtonsProps {
  onLike?: (() => void) | undefined;
  onPass?: (() => void) | undefined;
  onChat?: (() => void) | undefined;
}

function ActionButtons({ onLike, onPass, onChat }: ActionButtonsProps): React.JSX.Element {
  return (
    <div className={cn(
      'border-t border-border bg-card/95 backdrop-blur-sm',
      getSpacingClassesFromConfig({ padding: 'lg' })
    )}>
      <div className={cn('flex max-w-md mx-auto', getSpacingClassesFromConfig({ gap: 'md' }))}>
        {onPass && <ActionButton variant="outline" icon={X} label="Pass" onClick={onPass} />}
        {onChat && (
          <ActionButton variant="secondary" icon={ChatCircle} label="Chat" onClick={onChat} />
        )}
        {onLike && (
          <ActionButton
            variant="primary"
            icon={Heart}
            label="Like"
            onClick={onLike}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
          />
        )}
      </div>
    </div>
  );
}

interface ActionButtonProps {
  variant: 'outline' | 'secondary' | 'primary';
  icon: React.ComponentType<React.ComponentProps<typeof Heart>>;
  label: string;
  onClick: () => void;
  className?: string;
}

function ActionButton({
  variant,
  icon: Icon,
  label,
  onClick,
  className,
}: ActionButtonProps): React.JSX.Element {
  const bounce = useBounceOnTap({ onPress: onClick });

  return (
    <Button
      variant={
        variant === 'outline' ? 'outline' : variant === 'secondary' ? 'secondary' : 'default'
      }
      size="lg"
      onClick={bounce.handlePress}
      className={`flex-1 rounded-full ${className ?? ''}`}
    >
      <motion.div
        variants={bounce.variants}
        initial="rest"
        whileTap="tap"
        className="flex items-center"
      >
        <Icon
          size={20}
          weight={variant === 'primary' ? 'fill' : 'bold'}
          className={getSpacingClassesFromConfig({ marginX: 'sm' })}
          aria-hidden="true"
        />
        {label}
      </motion.div>
    </Button>
  );
}

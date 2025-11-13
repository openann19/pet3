import { adoptionApi } from '@/api/adoption-api';
import CompatibilityBreakdown from '@/components/CompatibilityBreakdown';
import DiscoverMapMode from '@/components/DiscoverMapMode';
import SavedSearchesManager from '@/components/discovery/SavedSearchesManager';
import DiscoveryFilters, { type DiscoveryPreferences } from '@/components/DiscoveryFilters';
import React, { Suspense } from 'react';
// Lazy load heavy detail view to reduce initial bundle size
const EnhancedPetDetailView = React.lazy(() =>
  import('@/components/enhanced/EnhancedPetDetailView').then((m) => ({
    default: m.EnhancedPetDetailView,
  }))
);
import MatchCelebration from '@/components/MatchCelebration';
import { PetRatings } from '@/components/PetRatings';
import StoriesBar from '@/components/stories/StoriesBar';
import { TrustBadges } from '@/components/TrustBadges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { VerificationBadge } from '@/components/VerificationBadge';
import { useApp } from '@/contexts/AppContext';
import { useDialog } from '@/hooks/useDialog';
import { useMatching } from '@/hooks/useMatching';
import { usePetDiscovery } from '@/hooks/usePetDiscovery';
import { useStorage } from '@/hooks/use-storage';
import { useStories } from '@/hooks/useStories';
import { useSwipe } from '@/hooks/useSwipe';
import { useViewMode } from '@/hooks/useViewMode';
import type { AdoptionProfile } from '@/lib/adoption-types';
import { formatDistance, getDistanceBetweenLocations, parseLocation } from '@/lib/distance';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import { generateMatchReasoning } from '@/lib/matching';
import type { Story } from '@petspark/shared';
import type { Story as LocalStory } from '@/lib/stories-types';
import type { Match, Pet, SwipeAction } from '@/lib/types';
import type { VerificationRequest } from '@/lib/verification-types';
import {
  BookmarkSimple,
  ChartBar,
  Heart,
  Info,
  MapPin,
  NavigationArrow,
  PawPrint,
  Sparkle,
  SquaresFour,
  X,
} from '@phosphor-icons/react';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import { toast } from 'sonner';
import { safeArrayAccess } from '@/lib/runtime-safety';
import { ScreenErrorBoundary } from '@/components/error/ScreenErrorBoundary';
import { getTypographyClasses, getSpacingClassesFromConfig, getColorClasses, getRadiusClasses, focusRing } from '@/lib/design-token-utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

const logger = createLogger('DiscoverView');

function DiscoverViewContent() {
  const { t } = useApp();
  const [userPets] = useStorage<Pet[]>('user-pets', []);
  const [swipeHistory, setSwipeHistory] = useStorage<SwipeAction[]>('swipe-history', []);
  const [, setMatches] = useStorage<Match[]>('matches', []);
  // Stories are now managed by useStories hook
  const [verificationRequests] = useStorage<Record<string, VerificationRequest>>(
    'verification-requests',
    {}
  );
  const [preferences] = useStorage<DiscoveryPreferences>('discovery-preferences', {
    minAge: 0,
    maxAge: 15,
    sizes: ['small', 'medium', 'large', 'extra-large'],
    maxDistance: 50,
    personalities: [],
    interests: [],
    lookingFor: [],
    minCompatibility: 0,
    mediaFilters: {
      cropSize: 'any',
      photoQuality: 'any',
      hasVideo: false,
      minPhotos: 1,
    },
    advancedFilters: {
      verified: false,
      activeToday: false,
      hasStories: false,
      respondQuickly: false,
      superLikesOnly: false,
    },
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchedPetName, setMatchedPetName] = useState('');
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdoptableOnly, setShowAdoptableOnly] = useState(false);
  const [, setAdoptablePetIds] = useState<Set<string>>(new Set());

  const { viewMode, setMode: setViewMode } = useViewMode({
    initialMode: 'cards',
    availableModes: ['cards', 'map'],
  });

  // Use ref to store latest handleSwipe to avoid circular dependency
  const handleSwipeRef = useRef<((action: 'like' | 'pass') => Promise<void>) | null>(null);

  const swipeHook = useSwipe({
    onSwipe: useCallback((dir: 'left' | 'right') => {
      const action = dir === 'right' ? 'like' : 'pass';
      if (handleSwipeRef.current) {
        void handleSwipeRef.current(action);
      }
    }, []),
  });

  const {
    x: swipeX,
    rotate: swipeRotate,
    opacity: swipeOpacity,
    likeOpacity: swipeLikeOpacity,
    passOpacity: swipePassOpacity,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    reset: resetSwipe,
  } = swipeHook;

  // Transform motion values for use in style props - properly typed for Framer Motion
  const cardStyle = useMemo(() => ({
    x: swipeX,
    rotate: swipeRotate,
    opacity: swipeOpacity,
  }), [swipeX, swipeRotate, swipeOpacity]);

  const likeOverlayStyle = useMemo(() => ({
    opacity: swipeLikeOpacity,
  }), [swipeLikeOpacity]);

  const passOverlayStyle = useMemo(() => ({
    opacity: swipePassOpacity,
  }), [swipePassOpacity]);

  const selectedPetDialog = useDialog({
    initialOpen: false,
  });

  const breakdownDialog = useDialog({
    initialOpen: false,
  });

  const celebrationDialog = useDialog({
    initialOpen: false,
  });

  const savedSearchesDialog = useDialog({
    initialOpen: false,
  });

  const userPet = safeArrayAccess(userPets, 0);

  const { stories, addStory, updateStory } = useStories({
    ...(userPet?.id && { currentPetId: userPet.id }),
  });

  useEffect(() => {
    if (userPets !== undefined) {
      setIsLoading(false);
    }
  }, [userPets]);

  // Load adoptable pets (pets with active adoption listings)
  useEffect(() => {
    const loadAdoptablePets = async () => {
      try {
        const result = await adoptionApi.getAdoptionProfiles({});
        // Only include active listings
        const activeListings = result.profiles.filter(
          (l: AdoptionProfile) => l.status === 'available'
        );
        const petIds = new Set<string>(
          activeListings.map((listing: AdoptionProfile) => listing.petId)
        );
        setAdoptablePetIds(petIds);
      } catch (error) {
        logger.error(
          'Failed to load adoptable pets',
          error instanceof Error ? error : new Error(String(error))
        );
      }
    };
    void loadAdoptablePets();
  }, []);
  const swipedPetIds = new Set(
    Array.isArray(swipeHistory) ? swipeHistory.map((s) => s.targetPetId) : []
  );

  const prefs: DiscoveryPreferences = preferences ?? {
    minAge: 0,
    maxAge: 15,
    sizes: ['small', 'medium', 'large', 'extra-large'],
    maxDistance: 50,
    personalities: [],
    interests: [],
    lookingFor: [],
    minCompatibility: 0,
    mediaFilters: {
      cropSize: 'any',
      photoQuality: 'any',
      hasVideo: false,
      minPhotos: 1,
    },
    advancedFilters: {
      verified: false,
      activeToday: false,
      hasStories: false,
      respondQuickly: false,
      superLikesOnly: false,
    },
  };

  const {
    availablePets: discoveryPets,
    currentPet,
    currentIndex: discoveryIndex,
    nextPet,
    markAsSwiped,
  } = usePetDiscovery({
    ...(userPet && { userPet }),
    preferences: {
      minAge: prefs.minAge,
      maxAge: prefs.maxAge,
      sizes: prefs.sizes,
      personalities: prefs.personalities,
      interests: prefs.interests,
      lookingFor: prefs.lookingFor,
      minCompatibility: prefs.minCompatibility,
      maxDistance: prefs.maxDistance ?? 50,
    },
    showAdoptableOnly,
    swipedPetIds,
  });

  // Memoize distance calculation for available pets
  const availablePets = useMemo(() => {
    return discoveryPets.map((pet: Pet): Pet & { distance?: number; coordinates?: { lat: number; lon: number } } => {
      let distance: number | undefined = undefined;
      let coordinates: { lat: number; lon: number } | undefined = undefined;
      if (userPet?.location && pet.location) {
        const rawDistance = getDistanceBetweenLocations(userPet.location, pet.location);
        distance = typeof rawDistance === 'number' ? rawDistance : undefined;
        // Ensure coordinates are in { lat, lon } format
        if (pet.coordinates && 'lat' in pet.coordinates && 'lon' in pet.coordinates) {
          coordinates = pet.coordinates as { lat: number; lon: number };
        } else {
          const parsed = parseLocation(pet.location);
          if (parsed && 'latitude' in parsed && 'longitude' in parsed) {
            coordinates = { lat: parsed.latitude, lon: parsed.longitude };
          }
        }
      }
      // Ensure coordinates match the expected type
      const finalCoordinates: { lat: number; lon: number } | undefined = coordinates 
        ? { lat: coordinates.lat, lon: coordinates.lon }
        : undefined;

      return {
        ...pet,
        ...(distance !== undefined ? { distance } : {}),
        ...(finalCoordinates ? { coordinates: finalCoordinates } : {}),
      } as Pet & { distance?: number; coordinates?: { lat: number; lon: number } };
    });
  }, [discoveryPets, userPet?.location]);

  // Update current index when discovery index changes
  useEffect(() => {
    setCurrentIndex(discoveryIndex);
  }, [discoveryIndex]);

  const {
    compatibilityScore,
    compatibilityFactors,
    matchReasoning: reasoning,
  } = useMatching({
    ...(userPet && { userPet }),
    ...(currentPet && { otherPet: currentPet }),
    autoCalculate: true,
  });

  // Define handleSwipe after all dependencies are available
  const handleSwipe = useCallback(async (action: 'like' | 'pass') => {
    if (!currentPet || !userPet) return;

    // Capture values before async operations to avoid stale closures
    const petId = typeof currentPet.id === 'string' ? currentPet.id : String(currentPet.id ?? '');
    const petName = typeof currentPet.name === 'string' ? currentPet.name : 'Pet';
    const userId = typeof userPet.id === 'string' ? userPet.id : String(userPet.id ?? '');
    const userName = typeof userPet.name === 'string' ? userPet.name : 'User';
    const score = typeof compatibilityScore === 'number' ? compatibilityScore : 0;

    haptics.trigger(action === 'like' ? 'success' : 'light');
    setShowSwipeHint(false);
    markAsSwiped(petId);

    const matchReasoning =
      reasoning.length > 0 ? reasoning : await generateMatchReasoning(userPet, currentPet);

    setTimeout(() => {
      const newSwipe: SwipeAction = {
        petId: userId,
        targetPetId: petId,
        action,
        timestamp: new Date().toISOString(),
      };

      // Update swipe history
      void setSwipeHistory((prev: SwipeAction[] | undefined): SwipeAction[] => [...(prev ?? []), newSwipe]);

      if (action === 'like') {
        void setMatches((currentMatches) => {
          const matchesArray = currentMatches ?? [];
          const existingMatch = matchesArray.find(
            (m) => m.matchedPetId === petId || m.petId === petId
          );

          if (existingMatch) {
            return matchesArray;
          }

          const newMatch: Match = {
            id: `match-${Date.now()}`,
            petId: userId,
            matchedPetId: petId,
            compatibilityScore: score,
            reasoning: matchReasoning,
            matchedAt: new Date().toISOString(),
            status: 'active',
          };

          // Trigger celebration and notification for new match
          haptics.trigger('success');
          setMatchedPetName(petName);
          celebrationDialog.open();

          toast.success(t.common.itsAMatch, {
            description: `${userName} ${t.common.and} ${petName} ${t.common.areNowConnected}`,
          });

          return [...matchesArray, newMatch];
        });
      }

      // Move to next pet
      nextPet();
      resetSwipe();
    }, 300);
  }, [currentPet, userPet, compatibilityScore, reasoning, markAsSwiped, setSwipeHistory, setMatches, celebrationDialog, t, nextPet, resetSwipe]);

  // Update ref with latest handleSwipe
  useEffect(() => {
    handleSwipeRef.current = handleSwipe;
  }, [handleSwipe]);

  // Unified animation variants for premium polish
  const emptyStateVariants = {
    hidden: { scale: 0.8, rotate: -180, opacity: 0 },
    visible: {
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: {
        ...springConfigs.bouncy,
        duration: motionDurations.smooth,
      },
    },
  };
  const rotateVariants = {
    rotate: {
      rotate: 360,
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };
  const pulseVariants = {
    pulse: {
      scale: [1, 1.5, 1],
      opacity: [0.5, 0, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.2,
        duration: motionDurations.smooth,
        ease: 'easeOut',
      },
    },
  };
  const noMorePulseVariants = {
    pulse: {
      scale: [1, 1.2, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  if (isLoading) {
    return null;
  }

  const prefersReducedMotion = useReducedMotion();

  if (!userPet) {
    return (
      <PageTransitionWrapper key="discover-no-user" direction="up">
        <main aria-label="Discover pets" className={cn(
          'flex flex-col items-center justify-center min-h-[60vh] text-center',
          getSpacingClassesFromConfig({ paddingX: 'xl' })
        )}>
          <section aria-label="No user profile state" role="status" aria-live="polite">
            <motion.div
              variants={emptyStateVariants}
              initial="hidden"
              animate="visible"
              className={cn(
                'w-24 h-24 flex items-center justify-center relative',
                getRadiusClasses('full'),
                getColorClasses('primary', 'bg'),
                getSpacingClassesFromConfig({ marginY: 'xl' })
              )}
              style={{ backgroundColor: 'rgba(var(--primary) / 0.2)' }}
              aria-hidden="true"
            >
              <motion.div variants={rotateVariants} animate={prefersReducedMotion ? false : 'rotate'}>
                <Sparkle size={48} className={getColorClasses('primary', 'text')} aria-hidden="true" />
              </motion.div>
              <motion.div
                variants={pulseVariants}
                animate={prefersReducedMotion ? false : 'pulse'}
                className={cn(
                  'absolute inset-0',
                  getRadiusClasses('full')
                )}
                style={{ backgroundColor: 'rgba(var(--primary) / 0.2)' }}
                aria-hidden="true"
              />
            </motion.div>
            <motion.h2
              variants={textVariants}
              initial="hidden"
              animate="visible"
              className={cn(
                getTypographyClasses('h2'),
                getSpacingClassesFromConfig({ marginY: 'sm' })
              )}
            >
              {t.discover?.createProfile ?? 'Create Your Profile'}
            </motion.h2>
            <motion.p
              variants={textVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: prefersReducedMotion ? 0 : 0.1, duration: motionDurations.smooth }}
              className={cn(
                getTypographyClasses('body'),
                getColorClasses('mutedForeground', 'text'),
                getSpacingClassesFromConfig({ marginY: 'xl' }),
                'max-w-md'
              )}
            >
              {t.discover?.createProfileDesc ?? 'Create a profile to start discovering pets near you'}
            </motion.p>
          </section>
        </main>
      </PageTransitionWrapper>
    );
  }

  if (!Array.isArray(availablePets) || availablePets.length === 0 || discoveryIndex >= availablePets.length) {
    return (
      <PageTransitionWrapper key="discover-empty" direction="up">
        <main aria-label="Discover pets" className={cn(
          'flex flex-col items-center justify-center min-h-[60vh] text-center',
          getSpacingClassesFromConfig({ paddingX: 'xl' })
        )}>
          <section aria-label="No more pets state" role="status" aria-live="polite">
            <motion.div
              variants={emptyStateVariants}
              initial="hidden"
              animate="visible"
              className={cn(
                'w-24 h-24 flex items-center justify-center relative',
                getRadiusClasses('full'),
                getColorClasses('primary', 'bg'),
                getSpacingClassesFromConfig({ marginY: 'xl' })
              )}
              style={{ backgroundColor: 'rgba(var(--primary) / 0.2)' }}
              aria-hidden="true"
            >
              <motion.div variants={noMorePulseVariants} animate={prefersReducedMotion ? false : 'pulse'}>
                <Heart size={48} className={getColorClasses('primary', 'text')} aria-hidden="true" />
              </motion.div>
              <motion.div
                variants={noMorePulseVariants}
                animate={prefersReducedMotion ? false : 'pulse'}
                className={cn(
                  'absolute inset-0',
                  getRadiusClasses('full')
                )}
                style={{ backgroundColor: 'rgba(var(--primary) / 0.2)', scale: 1.2, opacity: 0.5 }}
                aria-hidden="true"
              />
            </motion.div>
            <motion.h2
              variants={textVariants}
              initial="hidden"
              animate="visible"
              className={cn(
                getTypographyClasses('h2'),
                getSpacingClassesFromConfig({ marginY: 'sm' })
              )}
            >
              {t.discover?.noMore ?? 'No More Pets'}
            </motion.h2>
            <motion.p
              variants={textVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: prefersReducedMotion ? 0 : 0.1, duration: motionDurations.smooth }}
              className={cn(
                getTypographyClasses('body'),
                getColorClasses('mutedForeground', 'text'),
                getSpacingClassesFromConfig({ marginY: 'xl' }),
                'max-w-md'
              )}
            >
              {availablePets.length === 0 && currentIndex === 0
                ? (t.discover?.noMoreDescAdjust ?? 'Adjust your filters to see more pets')
                : (t.discover?.noMoreDesc ?? 'You\'ve seen all available pets. Check back later for new matches!')}
            </motion.p>
          </section>
        </main>
      </PageTransitionWrapper>
    );
  }

  const handleStoryCreated = useCallback((story: Story): void => {
    if (story?.id) {
      addStory(story as LocalStory);
    }
  }, [addStory]);

  const handleStoryUpdate = useCallback((updatedStory: Story): void => {
    if (updatedStory?.id) {
      updateStory(updatedStory.id, updatedStory as Partial<LocalStory>);
    }
  }, [updateStory]);

  const userPetName = typeof userPet?.name === 'string' ? userPet.name : 'User';
  const currentPetSafe = currentPet && typeof currentPet === 'object' ? currentPet : null;

  return (
    <PageTransitionWrapper key="discover-view" direction="up">
      <main aria-label="Discover pets" className={cn(
        'max-w-2xl mx-auto',
        getSpacingClassesFromConfig({ paddingX: 'lg', paddingY: '2xl' })
      )}>
        {/* Header Section */}
        <header className={getSpacingClassesFromConfig({ marginY: 'xl' })}>
          <div className={cn(
            'flex items-center justify-between',
            getSpacingClassesFromConfig({ marginY: 'lg' })
          )}>
            <div className="flex-1 min-w-0">
              <h1 className={cn(
                getTypographyClasses('h1'),
                getSpacingClassesFromConfig({ marginY: 'sm' })
              )}>
                {t.discover?.title ?? 'Discover'}
              </h1>
              <p className={cn(
                getTypographyClasses('bodySmall'),
                getColorClasses('mutedForeground', 'text'),
                'hidden sm:block'
              )}>
                {t.discover?.subtitle ?? 'Find your perfect match'} {userPetName}
              </p>
            </div>
          </div>
          {/* View Mode and Filters Section */}
          <section aria-label="View mode and filters" className={cn(
            'flex items-center justify-between',
            getSpacingClassesFromConfig({ gap: 'sm' })
          )}>
            <div className={cn(
              'inline-flex items-center',
              getColorClasses('muted', 'bg'),
              getRadiusClasses('xl'),
              getSpacingClassesFromConfig({ padding: 'xs' }),
              getColorClasses('border', 'border')
            )} role="group" aria-label="View mode selector">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  haptics.trigger('selection');
                  setViewMode('cards');
                }}
                className={cn(
                  focusRing,
                  getRadiusClasses('lg'),
                  getTypographyClasses('bodySmall')
                )}
                aria-label="View as cards"
                aria-pressed={viewMode === 'cards'}
              >
                <SquaresFour size={16} className="sm:mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">{t.map?.cards ?? 'Cards'}</span>
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  haptics.trigger('selection');
                  setViewMode('map');
                }}
                className={cn(
                  focusRing,
                  getRadiusClasses('lg'),
                  getTypographyClasses('bodySmall')
                )}
                aria-label="View as map"
                aria-pressed={viewMode === 'map'}
              >
                <MapPin size={16} className="sm:mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">{t.map?.mapView ?? 'Map'}</span>
              </Button>
            </div>
            <div className={cn('flex items-center', getSpacingClassesFromConfig({ gap: 'sm' }))}>
              <AnimatePresence>
                {typeof prefs.maxDistance === 'number' && prefs.maxDistance < 100 && (
                  <motion.div
                    key="distance-badge"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: prefersReducedMotion ? 0 : motionDurations.fast }}
                  >
                    <Badge
                      variant="outline"
                      className={cn(
                        getTypographyClasses('caption'),
                        getColorClasses('primary', 'text'),
                        getSpacingClassesFromConfig({ paddingX: 'xs', paddingY: 'xs' }),
                        'border-primary/30 bg-primary/5'
                      )}
                      aria-label={`Within ${prefs.maxDistance} miles`}
                    >
                      <NavigationArrow size={14} weight="fill" aria-hidden="true" />
                      Within {prefs.maxDistance} miles
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: prefersReducedMotion ? 0 : motionDurations.fast }}
              >
                <Badge
                  variant={showAdoptableOnly ? 'default' : 'outline'}
                  className={cn(
                    getTypographyClasses('caption'),
                    'cursor-pointer transition-colors',
                    getSpacingClassesFromConfig({ paddingX: 'xs', paddingY: 'xs' }),
                    'hover:bg-primary/10',
                    focusRing
                  )}
                  onClick={() => {
                    haptics.trigger('selection');
                    setShowAdoptableOnly(!showAdoptableOnly);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      haptics.trigger('selection');
                      setShowAdoptableOnly(!showAdoptableOnly);
                    }
                  }}
                  aria-label={showAdoptableOnly ? 'Show all pets' : 'Show only adoptable pets'}
                  aria-pressed={showAdoptableOnly}
                >
                  <PawPrint size={14} weight="fill" aria-hidden="true" />
                  {t.adoption?.adoptable ?? 'Adoptable'}
                </Badge>
              </motion.div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  haptics.trigger('selection');
                  savedSearchesDialog.open();
                }}
                className={cn(
                  focusRing,
                  getRadiusClasses('lg')
                )}
                aria-label="View saved searches"
              >
                <BookmarkSimple size={16} className="sm:mr-2" weight="fill" aria-hidden="true" />
                <span className="hidden sm:inline">Saved</span>
              </Button>
              <DiscoveryFilters />
            </div>
          </section>
        </header>

        {userPet && viewMode === 'cards' && (
          <section aria-label="Stories">
            <StoriesBar
              allStories={stories || []}
              currentUserId={userPet.id}
              currentUserName={userPet.name}
              currentUserPetId={userPet.id}
              currentUserPetName={userPet.name}
              currentUserPetPhoto={userPet.photo}
              onStoryCreated={handleStoryCreated}
              onStoryUpdate={handleStoryUpdate}
            />
          </section>
        )}

        {viewMode === 'map' ? (
          <section aria-label="Map view">
            <DiscoverMapMode
              pets={availablePets.map(p => ({ ...p, distance: p.distance ?? undefined })) as Pet[]}
              userPet={userPet}
              onSwipe={(pet, action) => {
                const tempIndex = currentIndex;
                const foundIndex = availablePets.findIndex((p) => p.id === pet.id);
                if (foundIndex !== -1) {
                  setCurrentIndex(foundIndex);
                }
                setTimeout(() => {
                  void handleSwipe(action);
                  if (tempIndex !== foundIndex) {
                    setCurrentIndex(tempIndex);
                  }
                }, 50);
              }}
            />
          </section>
        ) : (
          <section aria-label="Pet card stack">
          <div className={cn('relative h-[500px] sm:h-[600px] flex items-center justify-center', getSpacingClassesFromConfig({ marginY: 'xl' }))}>
            <AnimatePresence mode="wait">
              {currentPetSafe && (
                <motion.div
                  key={typeof currentPetSafe.id === 'string' ? currentPetSafe.id : String(currentPetSafe.id ?? '')}
                  style={cardStyle}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
                  role="article"
                  aria-label={`Pet card: ${typeof currentPetSafe.name === 'string' ? currentPetSafe.name : 'Pet'}`}
                >
                  <motion.div
                    style={likeOverlayStyle}
                    className={cn(
                      'absolute -top-8 left-1/2 -translate-x-1/2 bg-linear-to-r from-primary to-accent rounded-full text-white font-bold shadow-2xl z-50 border-4 border-white',
                      getTypographyClasses('body'),
                      getSpacingClassesFromConfig({ paddingX: 'xl', paddingY: 'md' })
                    )}
                    role="status"
                    aria-live="polite"
                    aria-label="Like overlay"
                  >
                    <Heart size={24} weight="fill" className="inline mr-2" aria-hidden="true" />
                    LIKE
                  </motion.div>
                  <motion.div
                    style={passOverlayStyle}
                    className={cn(
                      'absolute -top-8 left-1/2 -translate-x-1/2 bg-linear-to-r from-gray-500 to-gray-700 rounded-full text-white font-bold shadow-2xl z-50 border-4 border-white',
                      getTypographyClasses('body'),
                      getSpacingClassesFromConfig({ paddingX: 'xl', paddingY: 'md' })
                    )}
                    role="status"
                    aria-live="polite"
                    aria-label="Pass overlay"
                  >
                    PASS
                    <X size={24} weight="bold" className="inline ml-2" aria-hidden="true" />
                  </motion.div>
                  {showSwipeHint && currentIndex === 0 && (
                    <motion.div
                      className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
                    >
                      <div className={getSpacingClassesFromConfig({ gap: '2xl' })}>
                        <div className={cn(
                          'flex items-center glass-strong rounded-full backdrop-blur-xl border border-white/30',
                          getSpacingClassesFromConfig({ gap: 'sm', paddingX: 'lg', paddingY: 'sm' })
                        )}>
                          <span className="text-2xl" aria-hidden="true">👈</span>
                          <span className="text-white font-semibold drop-shadow-lg">
                            {t.discover.swipeHintPass}
                          </span>
                        </div>
                        <div className={cn(
                          'flex items-center glass-strong rounded-full backdrop-blur-xl border border-white/30',
                          getSpacingClassesFromConfig({ gap: 'sm', paddingX: 'lg', paddingY: 'sm' })
                        )}>
                          <span className="text-white font-semibold drop-shadow-lg">
                            {t.discover.swipeHintLike}
                          </span>
                          <span className="text-2xl" aria-hidden="true">👉</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div className="h-full overflow-hidden rounded-3xl glass-strong premium-shadow backdrop-blur-2xl">
                    <div className="relative h-full flex flex-col bg-linear-to-br from-white/50 to-white/30">
                      <div className="relative h-96 overflow-hidden group">
                        <motion.div
                          className="absolute inset-0 bg-linear-to-br from-primary/25 via-accent/15 to-secondary/20 z-10 pointer-events-none"
                          aria-hidden="true"
                        />
                        {typeof currentPetSafe.photo === 'string' && currentPetSafe.photo.length > 0 && (
                          <img
                            src={currentPetSafe.photo}
                            alt={`${typeof currentPetSafe.name === 'string' ? currentPetSafe.name : 'Pet'} - ${typeof currentPetSafe.breed === 'string' ? currentPetSafe.breed : ''}`}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-110"
                          />
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />
                        <motion.button
                          className={cn('absolute top-4 right-4 glass-strong rounded-full font-bold shadow-2xl backdrop-blur-xl border-2 border-white/40', getTypographyClasses('body'), getSpacingClassesFromConfig({ paddingX: 'lg', paddingY: 'sm' }), focusRing)}
                          whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
                          whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                          onClick={() => {
                            haptics.trigger('selection');
                            breakdownDialog.toggle();
                          }}
                          aria-label={`View compatibility breakdown: ${typeof compatibilityScore === 'number' ? compatibilityScore : 0}% match`}
                          aria-expanded={breakdownDialog.isOpen}
                        >
                          <span className="bg-linear-to-r from-accent via-primary to-secondary bg-clip-text text-transparent animate-gradient">
                            {typeof compatibilityScore === 'number' ? compatibilityScore : 0}% {t.discover?.match ?? 'Match'}
                          </span>
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            animate={prefersReducedMotion ? false : { opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            aria-hidden="true"
                          />
                        </motion.button>
                        <motion.button
                          className={cn('absolute top-4 left-4 w-11 h-11 glass-strong rounded-full flex items-center justify-center shadow-xl border border-white/30 backdrop-blur-xl', focusRing)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            haptics.trigger('selection');
                            selectedPetDialog.open();
                          }}
                          aria-label="View pet details"
                        >
                          <Info size={20} className="text-white drop-shadow-lg" weight="bold" aria-hidden="true" />
                        </motion.button>
                        <motion.button
                          className={cn('absolute bottom-4 right-4 w-11 h-11 glass-strong rounded-full flex items-center justify-center shadow-xl border border-white/30 backdrop-blur-xl', focusRing)}
                          whileHover={{ scale: 1.1, rotate: breakdownDialog.isOpen ? 360 : 0 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            haptics.trigger('selection');
                            breakdownDialog.toggle();
                          }}
                          aria-label="View compatibility breakdown"
                        >
                          <ChartBar
                            size={20}
                            className="text-white drop-shadow-lg"
                            weight={breakdownDialog.isOpen ? 'fill' : 'bold'}
                            aria-hidden="true"
                          />
                        </motion.button>
                      </div>

                      <div className={cn('flex-1 overflow-y-auto', getSpacingClassesFromConfig({ padding: 'xl' }))}>
                        <div className={cn('flex items-start justify-between', getSpacingClassesFromConfig({ marginY: 'lg' }))}>
                          <div className="flex-1 min-w-0">
                            <div className={cn('flex items-center', getSpacingClassesFromConfig({ gap: 'sm' }))}>
                              <h3 className={cn(getTypographyClasses('h3'), 'truncate')}>
                                {typeof currentPetSafe.name === 'string' ? currentPetSafe.name : 'Pet'}
                              </h3>
                              {Boolean(currentPetSafe.verified) && (
                                <VerificationBadge
                                  verified={Boolean(currentPetSafe.verified)}
                                  level={
                                    typeof verificationRequests === 'object' && verificationRequests !== null && typeof currentPetSafe.id === 'string'
                                      ? (verificationRequests[currentPetSafe.id]?.verificationLevel ?? 'basic')
                                      : 'basic'
                                  }
                                  size="sm"
                                />
                              )}
                            </div>
                            <div className={cn('flex items-center flex-wrap', getSpacingClassesFromConfig({ gap: 'sm' }))}>
                              {typeof currentPetSafe.location === 'string' && currentPetSafe.location.length > 0 && (
                                <p className={cn(getColorClasses('mutedForeground', 'text'), 'flex items-center truncate', getSpacingClassesFromConfig({ gap: 'xs' }))}>
                                  <MapPin size={16} weight="fill" aria-hidden="true" />
                                  {currentPetSafe.location}
                                </p>
                              )}
                              {typeof currentPetSafe.distance === 'number' && currentPetSafe.distance >= 0 && (
                                <div>
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      getSpacingClassesFromConfig({ gap: 'xs', paddingX: 'sm', paddingY: 'xs' }),
                                      'bg-linear-to-r from-primary/10 to-accent/10 border border-primary/20 text-foreground font-semibold'
                                    )}
                                    aria-label={`Distance: ${formatDistance(currentPetSafe.distance)}`}
                                  >
                                    <NavigationArrow
                                      size={12}
                                      weight="fill"
                                      className={getColorClasses('primary', 'text')}
                                      aria-hidden="true"
                                    />
                                    {formatDistance(currentPetSafe.distance)}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {currentPetSafe.trustProfile && typeof currentPetSafe.trustProfile === 'object' && (
                          <div className={getSpacingClassesFromConfig({ marginY: 'lg' })}>
                            <PetRatings trustProfile={currentPetSafe.trustProfile} compact />
                          </div>
                        )}

                        {currentPetSafe.trustProfile &&
                          typeof currentPetSafe.trustProfile === 'object' &&
                          Array.isArray(currentPetSafe.trustProfile.badges) &&
                          currentPetSafe.trustProfile.badges.length > 0 && (
                            <div className={getSpacingClassesFromConfig({ marginY: 'lg' })}>
                              <TrustBadges
                                badges={currentPetSafe.trustProfile.badges.slice(0, 4)}
                                compact
                              />
                            </div>
                          )}

                        <div className={getSpacingClassesFromConfig({ spaceY: 'lg' })}>
                          <div>
                            <p className={cn(getTypographyClasses('bodySmall'), 'font-semibold', getColorClasses('mutedForeground', 'text'), getSpacingClassesFromConfig({ marginY: 'sm' }))}>
                              {t.discover?.about ?? 'About'}
                            </p>
                            <p className={getColorClasses('foreground', 'text')}>
                              {typeof currentPetSafe.breed === 'string' ? currentPetSafe.breed : ''}
                              {typeof currentPetSafe.breed === 'string' && typeof currentPetSafe.age === 'number' ? ' • ' : ''}
                              {typeof currentPetSafe.age === 'number' ? `${currentPetSafe.age} ${t.common?.years ?? 'years'}` : ''}
                              {typeof currentPetSafe.age === 'number' && typeof currentPetSafe.gender === 'string' ? ' • ' : ''}
                              {typeof currentPetSafe.gender === 'string' ? currentPetSafe.gender : ''}
                            </p>
                          </div>

                          {Array.isArray(reasoning) && reasoning.length > 0 && (
                            <div>
                              <p className={cn(getTypographyClasses('bodySmall'), 'font-semibold', getColorClasses('mutedForeground', 'text'), getSpacingClassesFromConfig({ marginY: 'sm', gap: 'sm' }), 'flex items-center')}>
                                <Sparkle size={16} weight="fill" className={getColorClasses('accent', 'text')} aria-hidden="true" />
                                {t.discover?.whyMatch ?? 'Why you match'}
                              </p>
                              <ul className={getSpacingClassesFromConfig({ spaceY: 'xs' })} role="list">
                                {reasoning.map((reason, idx) => {
                                  const reasonString = typeof reason === 'string' ? reason : String(reason ?? idx);
                                  return (
                                    <li key={idx} className={cn(getTypographyClasses('bodySmall'), getColorClasses('foreground', 'text'))}>
                                      • {reasonString}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}

                          {Array.isArray(currentPetSafe.personality) && currentPetSafe.personality.length > 0 && (
                            <div>
                              <p className={cn(getTypographyClasses('bodySmall'), 'font-semibold', getColorClasses('mutedForeground', 'text'), getSpacingClassesFromConfig({ marginY: 'sm' }))}>
                                {t.discover?.personality ?? 'Personality'}
                              </p>
                              <ul className={cn('flex flex-wrap', getSpacingClassesFromConfig({ gap: 'sm' }))} role="list">
                                {currentPetSafe.personality.map((trait, idx) => {
                                  const traitString = typeof trait === 'string' ? trait : String(trait ?? idx);
                                  return (
                                    <li key={idx}>
                                      <Badge variant="secondary">{traitString}</Badge>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={cn('glass-effect border-t border-white/20 flex backdrop-blur-xl', getSpacingClassesFromConfig({ padding: 'xl', gap: 'lg' }))} role="group" aria-label="Swipe actions">
                        <Button
                          size="lg"
                          variant="outline"
                          className="flex-1 w-full h-14 border-2 glass-effect hover:glass-strong hover:border-destructive/50 hover:bg-destructive/10 group backdrop-blur-xl"
                          onClick={() => {
                            haptics.trigger('light');
                            void handleSwipe('pass');
                          }}
                          aria-label="Pass on this pet"
                        >
                          <X
                            size={28}
                            weight="bold"
                            className="text-foreground/70 group-hover:text-destructive transition-colors drop-shadow-lg"
                            aria-hidden="true"
                          />
                        </Button>
                        <Button
                          size="lg"
                          className="flex-1 w-full h-14 bg-linear-to-r from-primary via-accent to-secondary hover:from-primary/90 hover:via-accent/90 hover:to-secondary/90 shadow-2xl hover:shadow-accent/50 group relative overflow-hidden neon-glow"
                          onClick={() => {
                            haptics.trigger('success');
                            void handleSwipe('like');
                          }}
                          aria-label="Like this pet"
                        >
                          <div
                            className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent"
                            aria-hidden="true"
                          />
                          <Heart
                            size={28}
                            weight="fill"
                            className="relative z-10 drop-shadow-2xl"
                            aria-hidden="true"
                          />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </section>
        )}

        {/* Compatibility Breakdown */}
        {breakdownDialog.isOpen && compatibilityFactors && Array.isArray(compatibilityFactors) && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: prefersReducedMotion ? 0 : motionDurations.smooth }}
            aria-label="Compatibility breakdown"
          >
            <CompatibilityBreakdown factors={compatibilityFactors} className={getSpacingClassesFromConfig({ marginY: 'xl' })} />
          </motion.section>
        )}

        {/* Pet Detail Dialog */}
        <AnimatePresence>
          {selectedPetDialog.isOpen && currentPetSafe && (
            <Suspense fallback={
              <div role="status" aria-live="polite" aria-label="Loading pet details">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" aria-hidden="true"></div>
              </div>
            }>
              <EnhancedPetDetailView
                key={typeof currentPetSafe.id === 'string' ? currentPetSafe.id : String(currentPetSafe.id ?? '')}
                pet={currentPetSafe}
                onClose={selectedPetDialog.close}
                onLike={() => {
                  void handleSwipe('like');
                  selectedPetDialog.close();
                }}
                onPass={() => {
                  void handleSwipe('pass');
                  selectedPetDialog.close();
                }}
                compatibilityScore={typeof compatibilityScore === 'number' ? compatibilityScore : 0}
                matchReasons={Array.isArray(reasoning) ? reasoning : []}
                showActions={true}
              />
            </Suspense>
          )}
        </AnimatePresence>

        {/* Match Celebration */}
        <MatchCelebration
          show={celebrationDialog.isOpen}
          petName1={userPetName}
          petName2={typeof matchedPetName === 'string' ? matchedPetName : ''}
          onComplete={celebrationDialog.close}
        />

        {/* Saved Searches Dialog */}
        {savedSearchesDialog.isOpen && (
          <Dialog open={savedSearchesDialog.isOpen} onOpenChange={savedSearchesDialog.setOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh]" role="dialog" aria-modal="true" aria-label="Saved searches">
              <SavedSearchesManager
                currentPreferences={prefs}
                onApplySearch={(newPreferences) => {
                  if (typeof window !== 'undefined') {
                    const event = new CustomEvent('updateDiscoveryPreferences', {
                      detail: newPreferences,
                    });
                    window.dispatchEvent(event);
                  }
                }}
                onClose={savedSearchesDialog.close}
              />
            </DialogContent>
          </Dialog>
        )}
      </main>
    </PageTransitionWrapper>
  );
}

export default function DiscoverView() {
  return (
    <ScreenErrorBoundary screenName="Discover" enableNavigation={true} enableReporting={false}>
      <DiscoverViewContent />
    </ScreenErrorBoundary>
  );
}

import { adoptionApi } from '@/api/adoption-api';
import { lostFoundAPI } from '@/api/lost-found-api';
import { AdoptionCard } from '@/components/adoption/AdoptionCard';
import { AdoptionDetailDialog } from '@/components/adoption/AdoptionDetailDialog';
import { PostCard } from '@/components/community/PostCard';
import { PostComposer } from '@/components/community/PostComposer';
import { RankingSkeleton } from '@/components/community/RankingSkeleton';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { ScreenErrorBoundary } from '@/components/error/ScreenErrorBoundary';
import { CreateLostAlertDialog } from '@/components/lost-found/CreateLostAlertDialog';
import LostFoundMap from '@/components/maps/LostFoundMap';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/contexts/AppContext';
import { useStorage } from '@/hooks/use-storage';
import { getTypographyClasses, getSpacingClassesFromConfig, getColorClasses, focusRing } from '@/lib/design-token-utils';
import { cn } from '@/lib/utils';
import type { AdoptionProfile } from '@/lib/adoption-types';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import type { LostAlert } from '@/lib/lost-found-types';
import type { LostPetAlert } from '@/lib/maps/types';
import { safeArrayAccess } from '@/lib/runtime-safety';
import {
  ArrowsClockwise,
  Fire,
  Heart,
  MapPin,
  PawPrint,
  Plus,
  Sparkle,
  TrendUp,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { motionDurations } from '@/effects/framer-motion/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, JSX } from 'react';
import { toast } from 'sonner';
import { useFeedManagement, useInfiniteScroll } from '@/components/community/features/feed';
import { VirtualList, VirtualGrid } from '@/components/virtual';
import { usePullToRefresh } from '@/components/community/features/pull-to-refresh';
import { useTrendingTags } from '@/components/community/features/trending-tags';
import { usePostActions } from '@/components/community/features/post-actions';

const logger = createLogger('CommunityView');

function convertLostAlertToLostPetAlert(alert: LostAlert): LostPetAlert {
  return {
    id: alert.id,
    petId: alert.id,
    petName: alert.petSummary.name ?? 'Unknown',
    petPhoto: safeArrayAccess(alert.photos, 0) ?? '',
    breed: alert.petSummary.breed ?? 'Unknown',
    lastSeen: {
      lat: alert.lastSeen.lat ?? 0,
      lng: alert.lastSeen.lon ?? 0,
    },
    lastSeenTime: new Date(alert.createdAt),
    description: alert.description ?? '',
    contactInfo: alert.contactMask ?? '',
    radius: 10, // Default radius
    status: alert.status === 'active' ? 'active' : alert.status === 'found' ? 'found' : 'expired',
    sightings: [],
    createdBy: alert.ownerId,
    createdAt: new Date(alert.createdAt),
  };
}

function CommunityViewContent(): JSX.Element | null {
  const { t } = useApp();
  const [activeTab, setActiveTab] = useState<'feed' | 'adoption' | 'lost-found'>('feed');
  const [feedTab, setFeedTab] = useState<'for-you' | 'following'>('for-you');
  // TODO: Re-enable when PostComposer accepts props
  // const [showComposer, setShowComposer] = useState(false);

  // Feed management hook
  const feedManagement = useFeedManagement({
    feedTab,
    enabled: activeTab === 'feed',
  });

  // Infinite scroll hook (used internally by VirtualList)
  useInfiniteScroll({
    hasMore: feedManagement.hasMore,
    loading: feedManagement.loading,
    onLoadMore: () => void feedManagement.loadFeed(true),
    enabled: activeTab === 'feed',
  });

  // Trending tags hook
  const trendingTags = useTrendingTags();

  // Pull to refresh hook
  const pullToRefresh = usePullToRefresh({
    onRefresh: async () => {
      await feedManagement.refreshFeed();
      await trendingTags.loadTrendingTags();
    },
    enabled: activeTab === 'feed',
    activeTab,
  });

  // Use MotionValues directly from pull-to-refresh hook
  const pullY = pullToRefresh.pullDistance;
  const pullRotate = pullToRefresh.pullRotation;
  const [showPullIndicator, setShowPullIndicator] = useState(false);

  // Subscribe to pullDistance changes to show/hide indicator
  useEffect((): (() => void) | undefined => {
    const unsubscribe = pullY.on('change', (latest: number): void => {
      setShowPullIndicator(latest > 0);
    });
    return (): void => {
      unsubscribe();
    };
  }, [pullY]);

  // Post actions hook
  const postActions = usePostActions({
    onPostCreated: () => {
      void feedManagement.refreshFeed();
      void trendingTags.loadTrendingTags();
    },
    onRefreshFeed: () => void feedManagement.refreshFeed(),
  });

  const prefersReducedMotion = useReducedMotion();

  const [adoptionProfiles, setAdoptionProfiles] = useState<AdoptionProfile[]>([]);
  const [adoptionLoading, setAdoptionLoading] = useState(true);
  const [adoptionHasMore, setAdoptionHasMore] = useState(true);
  const [_adoptionCursor, setAdoptionCursor] = useState<string | undefined>();
  const [selectedAdoptionProfile, setSelectedAdoptionProfile] = useState<AdoptionProfile | null>(
    null
  );
  const [favoritedProfiles] = useStorage<string[]>(
    'favorited-adoption-profiles',
    []
  );
  const adoptionLoadingRef = useRef(false);
  const adoptionObserverTarget = useRef<HTMLDivElement>(null);

  const [lostFoundAlerts, setLostFoundAlerts] = useState<LostPetAlert[]>([]);
  const [lostFoundLoading, setLostFoundLoading] = useState(false);
  const [showLostAlertDialog, setShowLostAlertDialog] = useState(false);

  const loadLostFoundAlerts = useCallback(async (): Promise<void> => {
    if (activeTab !== 'lost-found' || lostFoundLoading) return;

    setLostFoundLoading(true);
    try {
      const result = await lostFoundAPI.queryAlerts({ status: ['active'] });
      setLostFoundAlerts(result.alerts.map(convertLostAlertToLostPetAlert));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load lost found alerts', err);
    } finally {
      setLostFoundLoading(false);
    }
  }, [activeTab, lostFoundLoading]);

  useEffect(() => {
    void loadLostFoundAlerts();
  }, [loadLostFoundAlerts]);

  const loadAdoptionProfiles = useCallback(async (loadMore = false): Promise<void> => {
    if (adoptionLoadingRef.current) return;

    try {
      adoptionLoadingRef.current = true;
      setAdoptionLoading(true);

      const response = await adoptionApi.getAdoptionProfiles({ limit: 12 });

      if (loadMore) {
        setAdoptionProfiles((currentProfiles: AdoptionProfile[] | undefined): AdoptionProfile[] => [
          ...(Array.isArray(currentProfiles) ? currentProfiles : []),
          ...(Array.isArray(response.profiles)
            ? response.profiles.map(
              (l: AdoptionProfile): AdoptionProfile => ({
                _id: l._id,
                petId: l.petId,
                petName: l.petName,
                petPhoto: l.petPhoto,
                breed: l.breed,
                age: l.age,
                gender: l.gender,
                size: l.size,
                location: l.location,
                shelterId: l.shelterId,
                shelterName: l.shelterName,
                status: l.status,
                description: l.description,
                healthStatus: l.healthStatus,
                vaccinated: l.vaccinated,
                spayedNeutered: l.spayedNeutered,
                goodWithKids: l.goodWithKids,
                goodWithPets: l.goodWithPets,
                energyLevel: l.energyLevel,
                ...(l.specialNeeds && { specialNeeds: l.specialNeeds }),
                adoptionFee: l.adoptionFee,
                postedDate: l.postedDate,
                personality: l.personality,
                photos: l.photos,
                ...(l.videoUrl && { videoUrl: l.videoUrl }),
                contactEmail: l.contactEmail,
                ...(l.contactPhone && { contactPhone: l.contactPhone }),
                ...(l.applicationUrl && { applicationUrl: l.applicationUrl }),
              })
            )
            : []),
        ]);
      } else {
        setAdoptionProfiles(
          Array.isArray(response.profiles)
            ? response.profiles.map(
              (l: AdoptionProfile): AdoptionProfile => ({
                _id: l._id,
                petId: l.petId,
                petName: l.petName,
                petPhoto: l.petPhoto,
                breed: l.breed,
                age: l.age,
                gender: l.gender,
                size: l.size,
                location: l.location,
                shelterId: l.shelterId,
                shelterName: l.shelterName,
                status: l.status,
                description: l.description,
                healthStatus: l.healthStatus,
                vaccinated: l.vaccinated,
                spayedNeutered: l.spayedNeutered,
                goodWithKids: l.goodWithKids,
                goodWithPets: l.goodWithPets,
                energyLevel: l.energyLevel,
                ...(l.specialNeeds && { specialNeeds: l.specialNeeds }),
                adoptionFee: l.adoptionFee,
                postedDate: l.postedDate,
                personality: l.personality,
                photos: l.photos,
                ...(l.videoUrl && { videoUrl: l.videoUrl }),
                contactEmail: l.contactEmail,
                ...(l.contactPhone && { contactPhone: l.contactPhone }),
                ...(l.applicationUrl && { applicationUrl: l.applicationUrl }),
              })
            )
            : []
        );
      }

      setAdoptionHasMore(!!response.nextCursor);
      setAdoptionCursor(response.nextCursor);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load adoption profiles', err, { action: 'loadAdoptionProfiles' });
    } finally {
      setAdoptionLoading(false);
      adoptionLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'feed') {
      void trendingTags.loadTrendingTags();
    }
  }, [activeTab, trendingTags]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = safeArrayAccess(entries, 0);
        if (
          entry?.isIntersecting &&
          adoptionHasMore &&
          !adoptionLoading &&
          !adoptionLoadingRef.current &&
          activeTab === 'adoption'
        ) {
          void loadAdoptionProfiles(true);
        }
      },
      { threshold: 0.1 }
    );

    if (adoptionObserverTarget.current) {
      observer.observe(adoptionObserverTarget.current);
    }

    return () => observer.disconnect();
  }, [adoptionHasMore, adoptionLoading, activeTab, loadAdoptionProfiles]);

  const handleMainTabChange = useCallback((value: string): void => {
    if (value === 'feed' || value === 'adoption' || value === 'lost-found') {
      setActiveTab(value);
      haptics.selection();
    }
  }, []);

  const handleFeedTabChange = useCallback((value: string): void => {
    setFeedTab(value as 'for-you' | 'following');
    feedManagement.resetFeed();
    haptics.selection();
  }, [feedManagement]);

  const handleCreatePost = useCallback((): void => {
    // TODO: Re-enable when PostComposer accepts props
    // setShowComposer(true);
    haptics.impact();
  }, []);

  // Animation variants
  const emptyStateVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const loadingSpinnerVariants = {
    spinning: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };


  // Memoize render callbacks for VirtualList and VirtualGrid
  const renderPostItem = useCallback((post: typeof feedManagement.posts[0]): JSX.Element => (
    <div className="mb-4">
      <ErrorBoundary
        fallback={
          <div className={cn(getSpacingClassesFromConfig({ padding: 'lg' }), getTypographyClasses('bodySmall'), getColorClasses('mutedForeground', 'text'))}>
            Failed to load post. Please refresh.
          </div>
        }
      >
        <PostCard post={post} onAuthorClick={postActions.handleAuthorClick} />
      </ErrorBoundary>
    </div>
  ), [postActions.handleAuthorClick]);

  const handleAdoptionSelect = useCallback((profile: AdoptionProfile): void => {
    setSelectedAdoptionProfile(profile);
  }, []);

  const renderAdoptionCard = useCallback((profile: AdoptionProfile): JSX.Element => (
    <AdoptionCard
      profile={profile}
      onSelect={handleAdoptionSelect}
      onFavorite={postActions.handleToggleFavorite}
      isFavorited={
        Array.isArray(favoritedProfiles) &&
        favoritedProfiles.includes(profile._id)
      }
    />
  ), [favoritedProfiles, postActions.handleToggleFavorite, handleAdoptionSelect]);

  const estimatePostSize = useCallback((): number => 400, []);
  const postKeyExtractor = useCallback((post: typeof feedManagement.posts[0]): string => post.id, []);
  const adoptionKeyExtractor = useCallback((profile: AdoptionProfile): string => profile._id, []);

  const handleFeedEndReached = useCallback((): void => {
    if (feedManagement.hasMore && !feedManagement.loading) {
      void feedManagement.loadFeed(true);
    }
  }, [feedManagement.hasMore, feedManagement.loading, feedManagement.loadFeed]);

  const handleAdoptionEndReached = useCallback((): void => {
    if (adoptionHasMore && !adoptionLoading && activeTab === 'adoption') {
      void loadAdoptionProfiles(true);
    }
  }, [adoptionHasMore, adoptionLoading, activeTab, loadAdoptionProfiles]);

  return (
    <PageTransitionWrapper key="community-view" direction="up">
      <main aria-label="Community" ref={pullToRefresh.containerRef} className={cn('max-w-6xl mx-auto', getSpacingClassesFromConfig({ spaceY: 'xl', paddingX: 'lg', paddingY: '2xl' }), 'relative')}>
        {/* Pull-to-Refresh Indicator */}
        {showPullIndicator && (
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
            style={{
              y: pullY,
            }}
            initial={false}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.2,
            }}
            aria-live="polite"
            aria-label={pullToRefresh.isRefreshing ? 'Refreshing feed' : 'Pull to refresh'}
          >
            <motion.div
              className="bg-card/95 backdrop-blur-xl shadow-xl rounded-full p-3 border border-border/50"
              style={{
                rotate: pullRotate,
                scale: pullToRefresh.pullScale,
                opacity: pullToRefresh.pullOpacity,
              }}
              animate={
                pullToRefresh.isRefreshing && !prefersReducedMotion
                  ? {
                      rotate: 360,
                    }
                  : undefined
              }
              transition={{
                rotate: {
                  duration: pullToRefresh.isRefreshing && !prefersReducedMotion ? 1 : 0.2,
                  repeat: pullToRefresh.isRefreshing && !prefersReducedMotion ? Infinity : 0,
                  ease: 'linear',
                },
              }}
            >
              <ArrowsClockwise
                size={24}
                weight="bold"
                className="text-primary"
                aria-hidden="true"
              />
            </motion.div>
          </motion.div>
        )}

        {/* Header Section */}
        <header className={cn('flex items-center justify-between', getSpacingClassesFromConfig({ marginY: 'xl' }))}>
          <div>
            <h1 className={cn(getTypographyClasses('h1'), 'bg-linear-to-r from-primary via-accent to-secondary bg-clip-text text-transparent')}>
              {t.community?.title ?? 'Community'}
            </h1>
            <p className={cn(getTypographyClasses('bodySmall'), getColorClasses('mutedForeground', 'text'), getSpacingClassesFromConfig({ marginY: 'xs' }))}>
              {activeTab === 'feed'
                ? (t.community?.feed ?? 'Share and discover pet moments')
                : activeTab === 'adoption'
                  ? (t.adoption?.subtitle ?? 'Find your perfect companion')
                  : (t.map?.lostAndFound ?? 'Report and find lost pets')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'feed' && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    haptics.impact();
                    void (async () => {
                      try {
                        await feedManagement.refreshFeed();
                        await trendingTags.loadTrendingTags();
                        haptics.success();
                        toast.success(t.community?.refreshed ?? 'Feed refreshed!');
                      } catch (error) {
                        const err = error instanceof Error ? error : new Error(String(error));
                        logger.error('Failed to refresh feed', err);
                        haptics.error();
                        toast.error(t.community?.refreshError ?? 'Failed to refresh');
                      }
                    })();
                  }}
                  aria-label="Refresh feed"
                  disabled={pullToRefresh.isRefreshing}
                  className="shadow-md"
                >
                  <ArrowsClockwise
                    size={20}
                    weight="bold"
                    className={pullToRefresh.isRefreshing ? 'animate-spin' : ''}
                    aria-hidden="true"
                  />
                </Button>
                <Button 
                  size="lg" 
                  className="gap-2 shadow-lg" 
                  onClick={handleCreatePost}
                  aria-label={t.community?.createPost ?? 'Create Post'}
                >
                  <Plus size={20} weight="bold" aria-hidden="true" />
                  <span className="hidden sm:inline">
                    {t.community?.createPost ?? 'Create Post'}
                  </span>
                  <span className="sm:hidden">{t.community?.post ?? 'Post'}</span>
                </Button>
              </>
            )}
          </div>
        </header>

        {/* Main Tabs - Feed, Adoption, Lost & Found */}
        <section aria-label="Community tabs">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : motionDurations.smooth,
              ease: 'easeOut',
            }}
          >
            <Tabs value={activeTab} onValueChange={handleMainTabChange}>
              <TabsList className="grid w-full grid-cols-3 bg-card shadow-md" role="tablist" aria-label="Community navigation tabs">
                <TabsTrigger value="feed" className="gap-2" aria-label={t.community?.feed ?? 'Feed tab'}>
                  <Fire size={18} weight={activeTab === 'feed' ? 'fill' : 'regular'} aria-hidden="true" />
                  {t.community?.feed ?? 'Feed'}
                </TabsTrigger>
                <TabsTrigger value="adoption" className="gap-2" aria-label={t.adoption?.title ?? 'Adoption tab'}>
                  <Heart size={18} weight={activeTab === 'adoption' ? 'fill' : 'regular'} aria-hidden="true" />
                  {t.adoption?.title ?? 'Adoption'}
                </TabsTrigger>
                <TabsTrigger value="lost-found" className="gap-2" aria-label={t.map?.lostAndFound ?? 'Lost & Found tab'}>
                  <MapPin size={18} weight={activeTab === 'lost-found' ? 'fill' : 'regular'} aria-hidden="true" />
                  {t.map?.lostAndFound ?? 'Lost & Found'}
                </TabsTrigger>
              </TabsList>

            {/* Feed Tab Content */}
            <TabsContent value="feed" className={cn(
              getSpacingClassesFromConfig({ marginY: 'xl', spaceY: 'xl' })
            )} role="tabpanel" aria-labelledby="feed-tab">
              {/* Trending Tags Section */}
              {Array.isArray(trendingTags.trendingTags) && trendingTags.trendingTags.length > 0 && (
                <section aria-label="Trending tags">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : motionDurations.smooth,
                      ease: 'easeOut',
                    }}
                    className={cn(
                      'bg-linear-to-br from-card via-card to-card/50 rounded-xl border border-border/50 shadow-lg',
                      getSpacingClassesFromConfig({ padding: 'lg' })
                    )}
                  >
                    <div className={cn(
                      'flex items-center',
                      getSpacingClassesFromConfig({ gap: 'sm', marginY: 'md' })
                    )}>
                      <TrendUp size={20} className={getColorClasses('accent', 'text')} weight="bold" aria-hidden="true" />
                      <h2 className={cn(getTypographyClasses('h3'), 'font-semibold text-foreground')}>
                        {t.community?.trending ?? 'Trending Today'}
                      </h2>
                      <Fire size={16} className={cn(getColorClasses('destructive', 'text'), 'ml-auto')} weight="fill" aria-hidden="true" />
                    </div>
                    <ul className={cn('flex flex-wrap', getSpacingClassesFromConfig({ gap: 'sm' }))} role="list">
                      {trendingTags.trendingTags.map((tag) => {
                        const tagString = typeof tag === 'string' ? tag : String(tag);
                        return (
                          <li key={tagString}>
                            <Badge
                              variant="secondary"
                              className={cn(
                                'cursor-pointer hover:bg-primary/20 transition-colors motion-reduce:transition-none',
                                focusRing
                              )}
                              onClick={() => haptics.selection()}
                              onKeyDown={(e: KeyboardEvent) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  haptics.selection();
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              aria-label={`Filter by ${tagString} tag`}
                            >
                              #{tagString}
                            </Badge>
                          </li>
                        );
                      })}
                    </ul>
                  </motion.div>
                </section>
              )}

              {/* Feed Sub-Tabs */}
              <section aria-label="Feed content">
                <Tabs value={feedTab} onValueChange={handleFeedTabChange}>
                  <TabsList className="grid w-full grid-cols-2 bg-card shadow-md max-w-md mx-auto" role="tablist" aria-label="Feed type tabs">
                    <TabsTrigger value="for-you" className="gap-2" aria-label={t.community?.forYou ?? 'For You tab'}>
                      <Sparkle size={18} weight={feedTab === 'for-you' ? 'fill' : 'regular'} aria-hidden="true" />
                      {t.community?.forYou ?? 'For You'}
                    </TabsTrigger>
                    <TabsTrigger value="following" className="gap-2" aria-label={t.community?.following ?? 'Following tab'}>
                      <Fire size={18} weight={feedTab === 'following' ? 'fill' : 'regular'} aria-hidden="true" />
                      {t.community?.following ?? 'Following'}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value={feedTab} className={cn(
                    'max-w-3xl mx-auto',
                    getSpacingClassesFromConfig({ marginY: 'xl', spaceY: 'lg' })
                  )} role="tabpanel" aria-labelledby={`${feedTab}-tab`}>
                    {feedManagement.loading && Array.isArray(feedManagement.posts) && feedManagement.posts.length === 0 ? (
                      <RankingSkeleton count={3} variant="post" />
                    ) : !Array.isArray(feedManagement.posts) || feedManagement.posts.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          duration: prefersReducedMotion ? 0 : motionDurations.smooth,
                        }}
                        className={cn(
                          'text-center',
                          getSpacingClassesFromConfig({ paddingY: '2xl' })
                        )}
                        role="status"
                        aria-live="polite"
                      >
                        <motion.div
                          variants={emptyStateVariants}
                          animate={prefersReducedMotion ? false : 'pulse'}
                          className={cn('text-8xl', getSpacingClassesFromConfig({ marginY: 'xl' }))}
                          aria-hidden="true"
                        >
                          🐾
                        </motion.div>
                        <h2 className={cn(
                          getTypographyClasses('h2'),
                          'text-foreground',
                          getSpacingClassesFromConfig({ marginY: 'sm' })
                        )}>
                          {t.community?.noPosts ?? 'No posts yet'}
                        </h2>
                        <p className={cn(
                          getTypographyClasses('body'),
                          'text-muted-foreground max-w-md mx-auto',
                          getSpacingClassesFromConfig({ marginY: '2xl' })
                        )}>
                          {feedTab === 'following'
                            ? (t.community?.noFollowingPosts ??
                              'Follow some pets to see their posts here!')
                            : (t.community?.noPostsDesc ??
                              'Be the first to share something amazing!')}
                        </p>
                        <Button 
                          size="lg" 
                          className="gap-2 shadow-lg" 
                          onClick={handleCreatePost}
                          aria-label={t.community?.createPost ?? 'Create Post'}
                        >
                          <Plus size={20} weight="bold" aria-hidden="true" />
                          {t.community?.createPost ?? 'Create Post'}
                        </Button>
                      </motion.div>
                    ) : (
                      <>
                        <VirtualList
                          items={feedManagement.posts}
                          renderItem={renderPostItem}
                          estimateSize={estimatePostSize}
                          overscan={3}
                          containerClassName={getSpacingClassesFromConfig({ spaceY: 'lg' })}
                          onEndReached={handleFeedEndReached}
                          endReachedThreshold={300}
                          keyExtractor={postKeyExtractor}
                        />

                        {/* Loading indicator */}
                        {feedManagement.loading && Array.isArray(feedManagement.posts) && feedManagement.posts.length > 0 && (
                          <div 
                            className={cn(
                              'flex items-center justify-center text-muted-foreground',
                              getSpacingClassesFromConfig({ gap: 'sm', paddingY: 'lg' })
                            )}
                            role="status"
                            aria-live="polite"
                            aria-label="Loading more posts"
                          >
                            <motion.div
                              variants={loadingSpinnerVariants}
                              animate={prefersReducedMotion ? false : 'spinning'}
                            >
                              <Sparkle size={20} aria-hidden="true" />
                            </motion.div>
                            <span className={getTypographyClasses('bodySmall')}>{t.common?.loading ?? 'Loading...'}</span>
                          </div>
                        )}
                        {!feedManagement.hasMore && Array.isArray(feedManagement.posts) && feedManagement.posts.length > 0 && (
                          <div 
                            className={cn(
                              'text-center text-muted-foreground',
                              getTypographyClasses('bodySmall'),
                              getSpacingClassesFromConfig({ paddingY: '2xl' })
                            )}
                            role="status"
                            aria-live="polite"
                          >
                            {t.community?.endOfFeed ?? "You're all caught up! 🎉"}
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </section>
            </TabsContent>

            {/* Adoption Tab Content */}
            <TabsContent value="adoption" className={cn(
              getSpacingClassesFromConfig({ marginY: 'xl', spaceY: 'xl' })
            )} role="tabpanel" aria-labelledby="adoption-tab">
              <section aria-label="Adoption listings">
                {adoptionLoading && Array.isArray(adoptionProfiles) && adoptionProfiles.length === 0 ? (
                  <ul className={cn('grid sm:grid-cols-2 lg:grid-cols-3', getSpacingClassesFromConfig({ gap: 'xl' }))} role="list" aria-label="Loading adoption profiles">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <li key={i}>
                        <div className="bg-card rounded-xl overflow-hidden border border-border/50 shadow-md">
                          <Skeleton className="h-64 w-full" />
                          <div className={cn(
                            getSpacingClassesFromConfig({ padding: 'lg', spaceY: 'md' })
                          )}>
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-4/5" />
                            <div className={getSpacingClassesFromConfig({ gap: 'sm' })}>
                              <Skeleton className="h-6 w-20" />
                              <Skeleton className="h-6 w-20" />
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : !Array.isArray(adoptionProfiles) || adoptionProfiles.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : motionDurations.smooth,
                    }}
                    className={cn(
                      'text-center',
                      getSpacingClassesFromConfig({ paddingY: '2xl' })
                    )}
                    role="status"
                    aria-live="polite"
                  >
                    <motion.div
                      variants={emptyStateVariants}
                      animate={prefersReducedMotion ? false : 'pulse'}
                      className={cn('text-8xl', getSpacingClassesFromConfig({ marginY: 'xl' }))}
                      aria-hidden="true"
                    >
                      🏠
                    </motion.div>
                    <h2 className={cn(
                      getTypographyClasses('h2'),
                      'font-bold text-foreground',
                      getSpacingClassesFromConfig({ marginY: 'sm' })
                    )}>
                      {t.adoption?.noProfiles ?? 'No pets available for adoption'}
                    </h2>
                    <p className={cn(
                      getTypographyClasses('body'),
                      'text-muted-foreground max-w-md mx-auto',
                      getSpacingClassesFromConfig({ marginY: '2xl' })
                    )}>
                      {t.adoption?.noProfilesDesc ??
                        'Check back soon for pets looking for their forever homes.'}
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <VirtualGrid
                      items={adoptionProfiles}
                      renderItem={renderAdoptionCard}
                      columns={3}
                      itemHeight={400}
                      gap={24}
                      overscan={3}
                      containerClassName={getSpacingClassesFromConfig({ padding: 'lg' })}
                      onEndReached={handleAdoptionEndReached}
                      endReachedThreshold={300}
                      keyExtractor={adoptionKeyExtractor}
                    />

                    {/* Loading indicator */}
                    {adoptionLoading && Array.isArray(adoptionProfiles) && adoptionProfiles.length > 0 && (
                      <div 
                        className={cn(
                          'flex items-center justify-center text-muted-foreground',
                          getSpacingClassesFromConfig({ gap: 'sm', paddingY: 'lg' })
                        )}
                        role="status"
                        aria-live="polite"
                        aria-label="Loading more adoption profiles"
                      >
                        <motion.div
                          variants={loadingSpinnerVariants}
                          animate={prefersReducedMotion ? false : 'spinning'}
                        >
                          <PawPrint size={20} aria-hidden="true" />
                        </motion.div>
                        <span className={getTypographyClasses('bodySmall')}>{t.common?.loading ?? 'Loading...'}</span>
                      </div>
                    )}
                    {!adoptionHasMore && Array.isArray(adoptionProfiles) && adoptionProfiles.length > 0 && (
                      <div 
                        className={cn(
                          'text-center text-muted-foreground',
                          getTypographyClasses('bodySmall'),
                          getSpacingClassesFromConfig({ paddingY: '2xl' })
                        )}
                        role="status"
                        aria-live="polite"
                      >
                        {t.adoption?.endOfList ?? "You've seen all available pets! 🐾"}
                      </div>
                    )}
                  </>
                )}
              </section>
            </TabsContent>

            <TabsContent value="lost-found" className={cn(
              getSpacingClassesFromConfig({ marginY: 'xl', spaceY: 'xl' })
            )} role="tabpanel" aria-labelledby="lost-found-tab">
              <section aria-label="Lost and found map">
                <LostFoundMap
                  alerts={Array.isArray(lostFoundAlerts) ? lostFoundAlerts : []}
                  onReportSighting={(alertId, location) => {
                    void (async () => {
                      try {
                        const { userService } = await import('@/lib/user-service');
                        const currentUser = await userService.user();
                        if (!currentUser) {
                          toast.error('You must be logged in to report sightings');
                          return;
                        }
                        await lostFoundAPI.createSighting({
                          alertId,
                          whenISO: new Date().toISOString(),
                          lat: typeof location.lat === 'number' ? location.lat : 0,
                          lon: typeof location.lng === 'number' ? location.lng : 0,
                          radiusM: 1000,
                          description: '',
                          photos: [],
                          contactMask: '',
                          reporterId: typeof currentUser.id === 'string' ? currentUser.id : '',
                          reporterName:
                            typeof currentUser.name === 'string'
                              ? currentUser.name
                              : 'Anonymous',
                          ...(currentUser.avatarUrl && { reporterAvatar: currentUser.avatarUrl }),
                        });
                        toast.success(t.lostFound?.sightingSubmitted ?? 'Sighting reported');
                      } catch (error) {
                        const err = error instanceof Error ? error : new Error(String(error));
                        logger.error('Failed to report sighting', err);
                        toast.error('Failed to report sighting');
                      }
                    })();
                  }}
                  onReportLost={() => {
                    setShowLostAlertDialog(true);
                    haptics.impact('light');
                  }}
                />
              </section>
            </TabsContent>
          </Tabs>
        </motion.div>
        </section>
        {/* Post Composer */}
        <PostComposer />

        {/* Adoption Detail Dialog */}
        {selectedAdoptionProfile && (
          <AdoptionDetailDialog
            profile={selectedAdoptionProfile}
            open={Boolean(selectedAdoptionProfile)}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedAdoptionProfile(null);
              }
            }}
          />
        )}

        {/* Lost Alert Dialog */}
        <CreateLostAlertDialog
          open={showLostAlertDialog}
          onClose={() => setShowLostAlertDialog(false)}
          onSuccess={() => {
            void loadLostFoundAlerts();
          }}
        />
      </main>
    </PageTransitionWrapper>
  );
}

export default function CommunityView(): JSX.Element | null {
  return (
    <ScreenErrorBoundary screenName="Community" enableNavigation={true} enableReporting={false}>
      <CommunityViewContent />
    </ScreenErrorBoundary>
  );
}

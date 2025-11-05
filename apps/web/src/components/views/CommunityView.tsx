import { adoptionApi } from '@/api/adoption-api'
import { communityAPI } from '@/api/community-api'
import { lostFoundAPI } from '@/api/lost-found-api'
import { AdoptionCard } from '@/components/adoption/AdoptionCard'
import { AdoptionDetailDialog } from '@/components/adoption/AdoptionDetailDialog'
import { PostCard } from '@/components/community/PostCard'
import { PostComposer } from '@/components/community/PostComposer'
import { RankingSkeleton } from '@/components/community/RankingSkeleton'
import { CreateLostAlertDialog } from '@/components/lost-found/CreateLostAlertDialog'
import LostFoundMap from '@/components/maps/LostFoundMap'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApp } from '@/contexts/AppContext'
import { filterPostsByFollows } from '@/core/services/follow-graph'
import { useStorage } from '@/hooks/useStorage'
import type { AdoptionProfile } from '@/lib/adoption-types'
import type { Post } from '@/lib/community-types'
import { haptics } from '@/lib/haptics'
import { createLogger } from '@/lib/logger'
import type { LostAlert } from '@/lib/lost-found-types'
import type { LostPetAlert } from '@/lib/maps/types'
import { ArrowsClockwise, Fire, Heart, MapPin, PawPrint, Plus, Sparkle, TrendUp } from '@phosphor-icons/react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

const logger = createLogger('CommunityView')

function convertLostAlertToLostPetAlert(alert: LostAlert): LostPetAlert {
  return {
    id: alert.id,
    petId: alert.id,
    petName: alert.petSummary.name || 'Unknown',
    petPhoto: alert.photos[0] || '',
    breed: alert.petSummary.breed || 'Unknown',
    lastSeen: {
      lat: alert.lastSeen.lat ?? 0,
      lng: alert.lastSeen.lon ?? 0
    },
    lastSeenTime: new Date(alert.createdAt),
    description: alert.description || '',
    contactInfo: alert.contactMask || '',
    radius: 10, // Default radius
    status: alert.status === 'active' ? 'active' : alert.status === 'found' ? 'found' : 'expired',
    sightings: [],
    createdBy: alert.ownerId,
    createdAt: new Date(alert.createdAt)
  }
}


export default function CommunityView() {
  const { t } = useApp()
  const [activeTab, setActiveTab] = useState<'feed' | 'adoption' | 'lost-found'>('feed')
  const [feedTab, setFeedTab] = useState<'for-you' | 'following'>('for-you')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | undefined>()
  const [showComposer, setShowComposer] = useState(false)
  const [trendingTags, setTrendingTags] = useState<string[]>([])
  const loadingRef = useRef(false)
  const observerTarget = useRef<HTMLDivElement>(null)
  
  const [isRefreshing, setIsRefreshing] = useState(false)
  const pullDistance = useMotionValue(0)
  const pullOpacity = useTransform(pullDistance, [0, 80], [0, 1])
  const pullRotation = useTransform(pullDistance, [0, 80], [0, 360])
  const pullScale = useTransform(pullDistance, [0, 80], [0.5, 1])
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const isPulling = useRef(false)
  
  const [adoptionProfiles, setAdoptionProfiles] = useState<AdoptionProfile[]>([])
  const [adoptionLoading, setAdoptionLoading] = useState(true)
  const [adoptionHasMore, setAdoptionHasMore] = useState(true)
  const [_adoptionCursor, setAdoptionCursor] = useState<string | undefined>()
  const [selectedAdoptionProfile, setSelectedAdoptionProfile] = useState<AdoptionProfile | null>(null)                                                          
  const [favoritedProfiles, setFavoritedProfiles] = useStorage<string[]>('favorited-adoption-profiles', [])
  const adoptionLoadingRef = useRef(false)
  const adoptionObserverTarget = useRef<HTMLDivElement>(null)

  const [lostFoundAlerts, setLostFoundAlerts] = useState<LostPetAlert[]>([])
  const [lostFoundLoading, setLostFoundLoading] = useState(false)
  const [showLostAlertDialog, setShowLostAlertDialog] = useState(false)

  const loadLostFoundAlerts = useCallback(async () => {
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
    loadLostFoundAlerts();
  }, [loadLostFoundAlerts]);

  const handleTouchStart = useCallback((e: globalThis.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0 && activeTab === 'feed' && e.touches?.[0]) {
      startY.current = e.touches[0].clientY
      isPulling.current = true
    }
  }, [activeTab])

  const handleTouchMove = useCallback((e: globalThis.TouchEvent) => {
    if (!isPulling.current || !containerRef.current || !e.touches?.[0]) return

    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current

    if (diff > 0 && diff < 120) {
      pullDistance.set(diff)
    }
  }, [pullDistance])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return
    isPulling.current = false

    const distance = pullDistance.get()
    
    if (distance > 80) {
      setIsRefreshing(true)
      haptics.impact('light')
      
      try {
        await loadFeed()
        await loadTrendingTags()
        haptics.success()
        toast.success(t.community?.refreshed || 'Feed refreshed!')
      } catch {
        haptics.error()
        toast.error(t.community?.refreshError || 'Failed to refresh')
      } finally {
        setIsRefreshing(false)
      }
    }

    animate(pullDistance, 0, {
      type: 'spring',
      stiffness: 300,
      damping: 30
    })
  }, [pullDistance, t])

  useEffect(() => {
    const container = containerRef.current
    if (!container || activeTab !== 'feed') return

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: true })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, activeTab])

  useEffect(() => {
    if (activeTab === 'feed') {
      loadFeed()
      loadTrendingTags()
    } else if (activeTab === 'adoption') {
      loadAdoptionProfiles()
    }
  }, [activeTab, feedTab])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting && hasMore && !loading && !loadingRef.current && activeTab === 'feed') {
          loadFeed(true)
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loading, activeTab])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting && adoptionHasMore && !adoptionLoading && !adoptionLoadingRef.current && activeTab === 'adoption') {
          loadAdoptionProfiles(true)
        }
      },
      { threshold: 0.1 }
    )

    if (adoptionObserverTarget.current) {
      observer.observe(adoptionObserverTarget.current)
    }

    return () => observer.disconnect()
  }, [adoptionHasMore, adoptionLoading, activeTab])

  const loadFeed = async (loadMore = false) => {
    if (loadingRef.current) return
    
    try {
      loadingRef.current = true
      setLoading(true)
      
      const { userService } = await import('@/lib/user-service')
      const user = await userService.user()
      const filters: any = {
        limit: 20,
        cursor: loadMore ? cursor : undefined
      }

      const response = await communityAPI.queryFeed(filters, user?.id)
      
      // Filter posts by follow relationships if "following" tab is selected
      let filteredPosts = response.posts
      if (feedTab === 'following') {
        if (user) {
          filteredPosts = await filterPostsByFollows<Post>(response.posts, user.id)
        }
      }
      
      if (loadMore) {
        setPosts((currentPosts) => [...(Array.isArray(currentPosts) ? currentPosts : []), ...filteredPosts])
      } else {
        setPosts(filteredPosts)
      }
      
      setHasMore(!!response.nextCursor)
      setCursor(response.nextCursor)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to load feed', err, { action: 'loadFeed', feedTab })
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }

  const loadAdoptionProfiles = async (loadMore = false) => {
    if (adoptionLoadingRef.current) return
    
    try {
      adoptionLoadingRef.current = true
      setAdoptionLoading(true)
      
      const response = await adoptionApi.getAdoptionProfiles({ limit: 12 })
      
      if (loadMore) {
        setAdoptionProfiles((currentProfiles) => [...(Array.isArray(currentProfiles) ? currentProfiles : []), ...(Array.isArray(response.profiles) ? response.profiles.map((l: AdoptionProfile) => ({
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
          specialNeeds: l.specialNeeds,
          adoptionFee: l.adoptionFee,
          postedDate: l.postedDate,
          personality: l.personality,
          photos: l.photos,
          videoUrl: l.videoUrl,
          contactEmail: l.contactEmail,
          contactPhone: l.contactPhone,
          applicationUrl: l.applicationUrl
        })) : [])])
      } else {
        setAdoptionProfiles(Array.isArray(response.profiles) ? response.profiles.map((l: AdoptionProfile) => ({
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
          specialNeeds: l.specialNeeds,
          adoptionFee: l.adoptionFee,
          postedDate: l.postedDate,
          personality: l.personality,
          photos: l.photos,
          videoUrl: l.videoUrl,
          contactEmail: l.contactEmail,
          contactPhone: l.contactPhone,
          applicationUrl: l.applicationUrl
        })) : [])
      }
      
      setAdoptionHasMore(!!response.nextCursor)
      setAdoptionCursor(response.nextCursor)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to load adoption profiles', err, { action: 'loadAdoptionProfiles' })
    } finally {
      setAdoptionLoading(false)
      adoptionLoadingRef.current = false
    }
  }

  const loadTrendingTags = async () => {
    try {
      // Extract tags from posts
      const allTags: string[] = []
      posts.forEach(post => {
        if (post.tags && Array.isArray(post.tags)) {
          allTags.push(...post.tags)
        }
      })
      
      // Count tag frequency
      const tagCounts = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      // Sort by frequency and take top 10
      const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag]) => tag)
      
      setTrendingTags(sortedTags)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to load trending tags', err, { action: 'loadTrendingTags' })
      setTrendingTags([])
    }
  }

  const handleAuthorClick = (authorId: string): void => {
    logger.info('View author profile', { action: 'viewAuthorProfile', authorId })
  }

  const handlePostCreated = useCallback(() => {
    loadFeed()
    loadTrendingTags()
  }, [feedTab])

  const handleMainTabChange = (value: string) => {
    setActiveTab(value as 'feed' | 'adoption')
    haptics.selection()
  }

  const handleFeedTabChange = (value: string) => {
    setFeedTab(value as 'for-you' | 'following')
    setPosts([])
    setCursor(undefined)
    setHasMore(true)
    haptics.selection()
  }

  const handleCreatePost = () => {
    setShowComposer(true)
    haptics.impact()
  }

  const handleToggleFavorite = (profileId: string) => {
    setFavoritedProfiles((currentFavorites) => {
      const current = Array.isArray(currentFavorites) ? currentFavorites : []
      const isFavorited = current.includes(profileId)
      if (isFavorited) {
        return current.filter(id => id !== profileId)
      } else {
        return [...current, profileId]
      }
    })
    haptics.trigger('light')
  }

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-6 pb-8 relative">
      {/* Pull-to-Refresh Indicator */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        style={{
          y: pullDistance,
          opacity: pullOpacity
        }}
      >
        <motion.div
          className="bg-card/95 backdrop-blur-xl shadow-xl rounded-full p-3 border border-border/50"
          style={{
            rotate: pullRotation,
            scale: pullScale
          }}
        >
          <ArrowsClockwise 
            size={24} 
            weight="bold" 
            className={`${isRefreshing ? 'animate-spin' : ''} text-primary`}
          />
        </motion.div>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            {t.community?.title || 'Community'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTab === 'feed' 
              ? (t.community?.feed || 'Share and discover pet moments')
              : (t.adoption?.subtitle || 'Find your perfect companion')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'feed' && (
            <>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={async () => {
                    setIsRefreshing(true)
                    haptics.impact()
                    try {
                      await loadFeed()
                      await loadTrendingTags()
                      haptics.success()
                      toast.success(t.community?.refreshed || 'Feed refreshed!')
                    } catch {
                      haptics.error()
                      toast.error(t.community?.refreshError || 'Failed to refresh')
                    } finally {
                      setIsRefreshing(false)
                    }
                  }}
                  disabled={isRefreshing}
                  className="shadow-md"
                >
                  <ArrowsClockwise 
                    size={20} 
                    weight="bold" 
                    className={isRefreshing ? 'animate-spin' : ''}
                  />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="gap-2 shadow-lg" onClick={handleCreatePost}>
                  <Plus size={20} weight="bold" />
                  <span className="hidden sm:inline">{t.community?.createPost || 'Create Post'}</span>
                  <span className="sm:hidden">{t.community?.post || 'Post'}</span>
                </Button>
              </motion.div>
            </>
          )}
        </div>
      </motion.div>

      {/* Main Tabs - Feed & Adoption */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={handleMainTabChange}>
          <TabsList className="grid w-full grid-cols-3 bg-card shadow-md">
            <TabsTrigger value="feed" className="gap-2">
              <Fire size={18} weight={activeTab === 'feed' ? 'fill' : 'regular'} />                                                                             
              {t.community?.feed || 'Feed'}
            </TabsTrigger>
            <TabsTrigger value="adoption" className="gap-2">
              <Heart size={18} weight={activeTab === 'adoption' ? 'fill' : 'regular'} />                                                                        
              {t.adoption?.title || 'Adoption'}
            </TabsTrigger>
            <TabsTrigger value="lost-found" className="gap-2">
              <MapPin size={18} weight={activeTab === 'lost-found' ? 'fill' : 'regular'} />                                                                        
              {t.map?.lostAndFound || 'Lost & Found'}
            </TabsTrigger>
          </TabsList>

          {/* Feed Tab Content */}
          <TabsContent value="feed" className="mt-6 space-y-6">
            {/* Trending Tags */}
            {trendingTags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-card via-card to-card/50 rounded-xl p-4 border border-border/50 shadow-lg"
              >
                <div className="flex items-center gap-2 mb-3">
                  <TrendUp size={20} className="text-accent" weight="bold" />
                  <h3 className="font-semibold text-foreground">
                    {t.community?.trending || 'Trending Today'}
                  </h3>
                  <Fire size={16} className="text-destructive ml-auto" weight="fill" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingTags.map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => haptics.selection()}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Feed Sub-Tabs */}
            <Tabs value={feedTab} onValueChange={handleFeedTabChange}>
              <TabsList className="grid w-full grid-cols-2 bg-card shadow-md max-w-md mx-auto">
                <TabsTrigger value="for-you" className="gap-2">
                  <Sparkle size={18} weight={feedTab === 'for-you' ? 'fill' : 'regular'} />
                  {t.community?.forYou || 'For You'}
                </TabsTrigger>
                <TabsTrigger value="following" className="gap-2">
                  <Fire size={18} weight={feedTab === 'following' ? 'fill' : 'regular'} />
                  {t.community?.following || 'Following'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value={feedTab} className="mt-6 space-y-4 max-w-3xl mx-auto">
            {loading && posts.length === 0 ? (
              <RankingSkeleton count={3} variant="post" />
            ) : posts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-20"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-8xl mb-6"
                >
                  🐾
                </motion.div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {t.community?.noPosts || 'No posts yet'}
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  {feedTab === 'following'
                    ? (t.community?.noFollowingPosts || 'Follow some pets to see their posts here!')
                    : (t.community?.noPostsDesc || 'Be the first to share something amazing!')}
                </p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="gap-2 shadow-lg" onClick={handleCreatePost}>
                    <Plus size={20} weight="bold" />
                    {t.community?.createPost || 'Create Post'}
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <>
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.3) }}
                  >
                    <PostCard
                      post={post}
                      onAuthorClick={handleAuthorClick}
                    />
                  </motion.div>
                ))}

                {/* Infinite scroll trigger */}
                <div ref={observerTarget} className="h-20 flex items-center justify-center">
                  {loading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkle size={20} />
                      </motion.div>
                      <span className="text-sm">{t.common?.loading || 'Loading...'}</span>
                    </div>
                  )}
                  {!hasMore && posts.length > 0 && (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      {t.community?.endOfFeed || "You're all caught up! 🎉"}
                    </div>
                  )}
                </div>
              </>
            )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Adoption Tab Content */}
          <TabsContent value="adoption" className="mt-6 space-y-6">
            {adoptionLoading && adoptionProfiles.length === 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card rounded-xl overflow-hidden border border-border/50 shadow-md"
                  >
                    <Skeleton className="h-64 w-full" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : adoptionProfiles.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-20"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-8xl mb-6"
                >
                  🏠
                </motion.div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {t.adoption?.noProfiles || 'No pets available for adoption'}
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  {t.adoption?.noProfilesDesc || 'Check back soon for pets looking for their forever homes.'}
                </p>
              </motion.div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {adoptionProfiles.map((profile, index) => (
                    <motion.div
                      key={profile._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.05, 0.3) }}
                    >
                      <AdoptionCard
                        profile={profile}
                        onSelect={setSelectedAdoptionProfile}
                        onFavorite={handleToggleFavorite}
                        isFavorited={Array.isArray(favoritedProfiles) && favoritedProfiles.includes(profile._id)}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Infinite scroll trigger for adoption */}
                <div ref={adoptionObserverTarget} className="h-20 flex items-center justify-center">
                  {adoptionLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <PawPrint size={20} />
                      </motion.div>
                      <span className="text-sm">{t.common?.loading || 'Loading...'}</span>
                    </div>
                  )}
                  {!adoptionHasMore && adoptionProfiles.length > 0 && (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      {t.adoption?.endOfList || "You've seen all available pets! 🐾"}
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="lost-found" className="mt-6 space-y-6">
            <LostFoundMap
              alerts={lostFoundAlerts}
              onReportSighting={async (alertId, location) => {
                try {
                  const { userService } = await import('@/lib/user-service')
                  const currentUser = await userService.user()
                  if (!currentUser) {
                    toast.error('You must be logged in to report sightings');
                    return;
                  }
                  await lostFoundAPI.createSighting({
                    alertId,
                    whenISO: new Date().toISOString(),
                    lat: location.lat,
                    lon: location.lng,
                    radiusM: 1000,
                    description: '',
                    photos: [],
                    contactMask: '',
                    reporterId: typeof currentUser.id === 'string' ? currentUser.id : '',
                    reporterName: typeof currentUser.name === 'string' ? currentUser.name : 'Anonymous',
                    reporterAvatar: currentUser.avatarUrl ?? undefined,
                  });
                  toast.success(t.lostFound?.sightingSubmitted || 'Sighting reported');
                } catch (error) {
                  const err = error instanceof Error ? error : new Error(String(error));
                  logger.error('Failed to report sighting', err);
                  toast.error('Failed to report sighting');
                }
              }}
              onReportLost={() => {
                setShowLostAlertDialog(true)
                haptics.impact('light')
              }}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
      <PostComposer
        open={showComposer}
        onOpenChange={setShowComposer}
        onPostCreated={handlePostCreated}
      />

      {/* Adoption Detail Dialog */}
      <AdoptionDetailDialog
        profile={selectedAdoptionProfile}
        open={!!selectedAdoptionProfile}
        onOpenChange={(open) => !open && setSelectedAdoptionProfile(null)}
      />

      {/* Lost Alert Dialog */}
      <CreateLostAlertDialog
        open={showLostAlertDialog}
        onClose={() => setShowLostAlertDialog(false)}
        onSuccess={async () => {
          // Reload lost & found alerts
          await loadLostFoundAlerts()
        }}
      />
    </div>
  )
}

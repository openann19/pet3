import { useState, lazy, Suspense } from 'react';
import type { KeyboardEvent } from 'react';
import { useStorage } from '@/hooks/use-storage'
import { motion } from 'framer-motion'
import { motionDurations, springConfigs } from '@/effects/framer-motion/variants'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Plus, PawPrint, Pencil, Heart } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { Pet, Match, SwipeAction } from '@/lib/types'
import type { VideoQuality } from '@/lib/call-types'
import type { ThemePreset } from '@/lib/theme-presets'
import CreatePetDialog from '@/components/CreatePetDialog'
import StatsCard from '@/components/StatsCard'
import HighlightsBar from '@/components/stories/HighlightsBar'
import VideoQualitySettings from '@/components/call/VideoQualitySettings'
import ThemePresetSelector from '@/components/ThemePresetSelector'
import { SubscriptionStatusCard } from '@/components/payments/SubscriptionStatusCard'
import PetHealthDashboard from '@/components/health/PetHealthDashboard'
import { VerificationButton } from '@/components/verification/VerificationButton'
import { useApp } from '@/contexts/AppContext'
import { ScreenErrorBoundary } from '@/components/error/ScreenErrorBoundary'
import { getTypographyClasses, getSpacingClassesFromConfig, accessibilityClasses } from '@/lib/typography'
import { getColorClasses, getShadowClasses } from '@/lib/design-token-utils'
import { cn } from '@/lib/utils'

// Lazy load heavy components
const VisualAnalysisDemo = lazy(() => import('@/components/VisualAnalysisDemo').then(module => ({ default: module.default })))

function ProfileViewContent() {
  const { t, themePreset, setThemePreset } = useApp()
  const [userPets] = useStorage<Pet[]>('user-pets', [])
  const [matches] = useStorage<Match[]>('matches', [])
  const [swipeHistory] = useStorage<SwipeAction[]>('swipe-history', [])
  const [preferredQuality = '4k', setPreferredQuality] = useStorage<VideoQuality>('video-quality-preference', '4k')
  const [editingPet, setEditingPet] = useState<Pet | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showHealthDashboard, setShowHealthDashboard] = useState(false)
  const [selectedHealthPet, setSelectedHealthPet] = useState<Pet | null>(null)
  
  const prefersReducedMotion = useReducedMotion()
  
  // Defensive data handling
  const safeMatches = Array.isArray(matches) ? matches : []
  const safeSwipeHistory = Array.isArray(swipeHistory) ? swipeHistory : []
  const safeUserPets = Array.isArray(userPets) ? userPets : []
  
  const totalMatches = safeMatches.filter(m => m.status === 'active').length
  const totalSwipes = safeSwipeHistory.length
  const likeCount = safeSwipeHistory.filter(s => s.action === 'like').length
  const successRate = likeCount > 0 ? Math.round((totalMatches / likeCount) * 100) : 0

  // Animation variants with reduced motion support
  const emptyStateIconVariants = {
    initial: { scale: prefersReducedMotion ? 1 : 0, rotate: prefersReducedMotion ? 0 : -180 },
    animate: { scale: 1, rotate: 0 },
    transition: prefersReducedMotion 
      ? { duration: 0 }
      : {
          ...springConfigs.bouncy,
          duration: motionDurations.smooth,
        },
  }

  const emptyStateTextVariants = {
    initial: { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: prefersReducedMotion 
        ? { duration: 0 }
        : {
            duration: motionDurations.smooth,
            ease: 'easeOut',
          },
    },
  }

  const emptyStateButtonVariants = {
    initial: { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: prefersReducedMotion 
        ? { duration: 0 }
        : {
            delay: 0.4,
            duration: motionDurations.smooth,
            ease: 'easeOut',
          },
    },
    hover: prefersReducedMotion ? {} : {
      scale: 1.05,
      transition: {
        duration: motionDurations.fast,
      },
    },
    tap: prefersReducedMotion ? {} : {
      scale: 0.95,
    },
  }

  // Section animation variants
  const sectionVariants = {
    initial: { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: prefersReducedMotion 
        ? { duration: 0 }
        : {
            duration: motionDurations.smooth,
            ease: 'easeOut',
          },
    },
  }

  const cardEntryVariants = {
    initial: { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 30, scale: prefersReducedMotion ? 1 : 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
  }

  const handleEdit = (pet: Pet) => {
    setEditingPet(pet)
    setShowCreateDialog(true)
  }

  const handleCloseDialog = () => {
    setShowCreateDialog(false)
    setEditingPet(null)
  }

  const handleThemePresetChange = (preset: ThemePreset) => {
    setThemePreset(preset)
    toast.success('Theme updated', {
      description: 'Your theme has been updated successfully'
    })
  }

  const handleKeyDown = (e: KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      action()
    }
  }

  if (safeUserPets.length === 0) {
    return (
      <main aria-label="Profile" className={cn('max-w-2xl mx-auto', getSpacingClassesFromConfig({ paddingX: 'lg' }))}>
        <div className={cn('flex flex-col items-center justify-center min-h-[60vh] text-center', getSpacingClassesFromConfig({ paddingX: 'lg' }))}>
          <motion.div
            initial={emptyStateIconVariants.initial}
            animate={emptyStateIconVariants.animate}
            transition={emptyStateIconVariants.transition}
              className={cn(
              'w-24 h-24 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center relative',
              getShadowClasses('glow-primary'),
              getSpacingClassesFromConfig({ marginY: 'xl' })
            )}
          >
            <PawPrint size={48} className="text-primary-foreground" weight="fill" aria-hidden="true" />
            {!prefersReducedMotion && (
              <div className="absolute inset-0 rounded-full bg-linear-to-br from-primary to-accent animate-pulse opacity-50" />
            )}
          </motion.div>
          
          <motion.h1
            initial={emptyStateTextVariants.initial}
            animate={emptyStateTextVariants.animate}
            transition={emptyStateTextVariants.animate.transition}
            className={cn(getTypographyClasses('h1'), getSpacingClassesFromConfig({ marginY: 'sm' }))}
          >
            {t.profile.createProfile}
          </motion.h1>
          
          <motion.p
            initial={emptyStateTextVariants.initial}
            animate={emptyStateTextVariants.animate}
            transition={emptyStateTextVariants.animate.transition}
            className={cn(
              getTypographyClasses('body'),
              'text-muted-foreground max-w-md',
              getSpacingClassesFromConfig({ marginY: 'xl' })
            )}
          >
            {t.profile.noPetsDesc}
          </motion.p>
          
          <motion.div
            initial={emptyStateButtonVariants.initial}
            animate={emptyStateButtonVariants.animate}
            transition={emptyStateButtonVariants.animate.transition}
            variants={emptyStateButtonVariants}
            whileHover={emptyStateButtonVariants.hover}
            whileTap={emptyStateButtonVariants.tap}
          >
            <Button 
              size="lg" 
              onClick={() => { setShowCreateDialog(true); }}
              className={cn(
                getColorClasses('primary', 'bg'),
                'hover:opacity-90',
                getColorClasses('primaryForeground', 'text'),
                getSpacingClassesFromConfig({ paddingX: 'xl', paddingY: 'md' }),
                getShadowClasses('raised'),
                accessibilityClasses.focusVisible
              )}
            >
              <Plus size={20} weight="bold" className={getSpacingClassesFromConfig({ marginX: 'sm' })} aria-hidden="true" />
              {t.profile.createProfileBtn}
            </Button>
          </motion.div>
        </div>

        <CreatePetDialog 
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </main>
    )
  }

  return (
    <main aria-label="Profile" className={cn('max-w-4xl mx-auto', getSpacingClassesFromConfig({ spaceY: 'xl', paddingX: 'md' }))}>
      <motion.section
        initial={sectionVariants.initial}
        animate={sectionVariants.animate}
        transition={sectionVariants.animate.transition}
        className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none"
      >
        <ThemePresetSelector 
          currentPreset={themePreset}
          onPresetChange={handleThemePresetChange}
        />
      </motion.section>

      <motion.section
        initial={sectionVariants.initial}
        animate={sectionVariants.animate}
        transition={sectionVariants.animate.transition}
      >
        <SubscriptionStatusCard />
      </motion.section>

      {totalSwipes > 0 && (
        <StatsCard
          totalMatches={totalMatches}
          totalSwipes={totalSwipes}
          successRate={successRate}
        />
      )}

      <motion.section
        initial={sectionVariants.initial}
        animate={sectionVariants.animate}
        transition={sectionVariants.animate.transition}
        className={cn(
          'glass-strong rounded-3xl border border-border/20',
          getSpacingClassesFromConfig({ padding: 'xl' }),
          getShadowClasses('raised')
        )}
      >
        <h2 className={cn(getTypographyClasses('h2'), getSpacingClassesFromConfig({ marginY: 'lg' }))}>Story Highlights</h2>
        <HighlightsBar onlyOwn={true} />
      </motion.section>

      <motion.section
        initial={sectionVariants.initial}
        animate={sectionVariants.animate}
        transition={sectionVariants.animate.transition}
      >
        <Suspense fallback={
          <div className={cn('flex items-center justify-center', getSpacingClassesFromConfig({ paddingY: '2xl' }))}>
            <div className={cn('animate-spin rounded-full h-8 w-8 border-b-2', getColorClasses('primary', 'border'))} />
          </div>
        }>
          <VisualAnalysisDemo />
        </Suspense>
      </motion.section>
      
      <header className={cn('flex items-center justify-between flex-wrap', getSpacingClassesFromConfig({ gap: 'md' }))}>
        <div className="flex-1 min-w-0">
          <h1 className={cn(getTypographyClasses('h1'), getSpacingClassesFromConfig({ marginY: 'xs' }))}>{t.profile.myPets}</h1>
          <p className={cn(getTypographyClasses('body-sm'), 'text-muted-foreground')}>
            {safeUserPets.length} {safeUserPets.length === 1 ? t.profile.subtitle : t.profile.subtitlePlural}
          </p>
        </div>
        <Button 
          onClick={() => { setShowCreateDialog(true); }} 
          className={cn(
            'shrink-0',
            getColorClasses('primary', 'bg'),
            'hover:opacity-90',
            getColorClasses('primaryForeground', 'text'),
            getSpacingClassesFromConfig({ paddingX: 'xl', paddingY: 'md' }),
            getShadowClasses('raised'),
            accessibilityClasses.focusVisible
          )}
        >
          <Plus size={18} weight="bold" className={getSpacingClassesFromConfig({ marginX: 'sm' })} aria-hidden="true" />
          <span className={getTypographyClasses('body-sm')}>{t.profile.addPet}</span>
        </Button>
      </header>

      <section aria-label="Pet cards">
        {safeUserPets.length > 0 ? (
          <ul className={cn('grid grid-cols-1 md:grid-cols-2 list-none', getSpacingClassesFromConfig({ gap: 'lg' }))}>
            {safeUserPets.map((pet, idx) => {
              const cardTransition = prefersReducedMotion 
                ? { duration: 0 }
                : { delay: idx * 0.08, type: 'spring' as const, stiffness: 300, damping: 30 }
              
              return (
                <li key={pet.id}>
                  <motion.div
                    initial={cardEntryVariants.initial}
                    animate={cardEntryVariants.animate}
                    transition={cardTransition}
                    whileHover={prefersReducedMotion ? {} : { scale: 1.03, y: -12 }}
                    className={cn(
                      'overflow-hidden rounded-3xl glass-strong backdrop-blur-2xl group relative border border-border/20',
                      getShadowClasses('raised'),
                      accessibilityClasses.focusVisible
                    )}
                    role="article"
                    aria-label={`Pet profile: ${pet.name}`}
                  >
                    <div className={cn(
                      'absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 pointer-events-none',
                      prefersReducedMotion ? '' : 'transition-opacity duration-500'
                    )} />
                    <div className="relative h-64 overflow-hidden">
                      <div className={cn(
                        'absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 z-10 pointer-events-none',
                        prefersReducedMotion ? '' : 'transition-opacity duration-500'
                      )} />
                      <motion.img
                        src={pet.photo}
                        alt={`${pet.name} - ${pet.breed}`}
                        className="w-full h-full object-cover"
                        whileHover={prefersReducedMotion ? {} : { scale: 1.12 }}
                        transition={{ duration: prefersReducedMotion ? 0 : motionDurations.smooth }}
                      />
                      <div className={cn(
                        'absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100',
                        prefersReducedMotion ? '' : 'transition-opacity duration-500'
                      )} />
                      <button
                        onClick={() => handleEdit(pet)}
                        onKeyDown={(e) => handleKeyDown(e, () => handleEdit(pet))}
                        className={cn(
                          'absolute top-3 right-3 w-11 h-11 glass-strong rounded-full flex items-center justify-center backdrop-blur-xl',
                          getShadowClasses('overlay'),
                          'border border-border/30',
                          accessibilityClasses.focusVisible,
                          accessibilityClasses.minTouch
                        )}
                        aria-label={`Edit ${pet.name}`}
                      >
                        <Pencil size={20} className="text-foreground" weight="bold" aria-hidden="true" />
                      </button>
                    </div>

                    <div className={cn(
                      'bg-linear-to-br from-white/40 to-white/20 backdrop-blur-md',
                      getSpacingClassesFromConfig({ padding: 'lg' })
                    )}>
                      <h3 className={cn(getTypographyClasses('h3'), getSpacingClassesFromConfig({ marginY: 'sm' }), 'truncate')}>{pet.name}</h3>
                      <p className={cn(getTypographyClasses('body-sm'), 'text-muted-foreground', getSpacingClassesFromConfig({ marginY: 'lg' }))}>
                        {pet.breed} • {pet.age} {t.profile.yearsOld} • {pet.gender}
                      </p>

                      {pet.bio && (
                        <p className={cn(getTypographyClasses('body-sm'), 'text-foreground line-clamp-3', getSpacingClassesFromConfig({ marginY: 'lg' }))}>{pet.bio}</p>
                      )}

                      {pet.personality && Array.isArray(pet.personality) && pet.personality.length > 0 && (
                        <div className={getSpacingClassesFromConfig({ marginY: 'lg' })}>
                          <p className={cn(getTypographyClasses('caption'), 'font-semibold text-muted-foreground', getSpacingClassesFromConfig({ marginY: 'sm' }))}>
                            {t.petProfile.personality.toUpperCase()}
                          </p>
                          <ul className={cn('flex flex-wrap list-none', getSpacingClassesFromConfig({ gap: 'sm' }))}>
                            {pet.personality.slice(0, 5).map((trait: string, traitIdx: number) => (
                              <li key={traitIdx}>
                                <Badge variant="secondary">{trait}</Badge>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {pet.interests && Array.isArray(pet.interests) && pet.interests.length > 0 && (
                        <div className={getSpacingClassesFromConfig({ marginY: 'lg' })}>
                          <p className={cn(getTypographyClasses('caption'), 'font-semibold text-muted-foreground', getSpacingClassesFromConfig({ marginY: 'sm' }))}>
                            {t.petProfile.interests.toUpperCase()}
                          </p>
                          <ul className={cn('flex flex-wrap list-none', getSpacingClassesFromConfig({ gap: 'sm' }))}>
                            {pet.interests.slice(0, 5).map((interest: string, interestIdx: number) => (
                              <li key={interestIdx}>
                                <Badge variant="outline">{interest}</Badge>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className={getSpacingClassesFromConfig({ spaceY: 'sm' })}>
                        <VerificationButton
                          petId={pet.id}
                          userId={pet.ownerId}
                          variant="card"
                          className={getSpacingClassesFromConfig({ marginY: 'sm' })}
                        />

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setSelectedHealthPet(pet)
                            setShowHealthDashboard(true)
                          }}
                        >
                          <Heart size={16} className={getSpacingClassesFromConfig({ marginX: 'sm' })} weight="fill" aria-hidden="true" />
                          Health Dashboard
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </li>
              )
            })}
          </ul>
        ) : null}
      </section>

      <motion.section
        initial={sectionVariants.initial}
        animate={sectionVariants.animate}
        transition={sectionVariants.animate.transition}
      >
        <VideoQualitySettings 
          currentQuality={preferredQuality}
          onQualityChange={(quality) => {
            void setPreferredQuality(quality)
          }}
        />
      </motion.section>

      <CreatePetDialog 
        open={showCreateDialog}
        onOpenChange={handleCloseDialog}
        editingPet={editingPet}
      />

      {showHealthDashboard && selectedHealthPet && (
        <PetHealthDashboard
          pet={selectedHealthPet}
          onClose={() => {
            setShowHealthDashboard(false)
            setSelectedHealthPet(null)
          }}
        />
      )}
    </main>
  )
}

export default function ProfileView() {
  return (
    <ScreenErrorBoundary screenName="Profile" enableNavigation={true} enableReporting={false}>
      <ProfileViewContent />
    </ScreenErrorBoundary>
  )
}

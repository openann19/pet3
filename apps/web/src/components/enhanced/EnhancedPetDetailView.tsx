import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSwipeGesture } from '@/hooks/use-swipe-gesture'
import { haptics } from '@/lib/haptics'
import type { Pet } from '@/lib/types'
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
  X
} from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useState } from 'react'

interface EnhancedPetDetailViewProps {
  pet: Pet
  onClose: () => void
  onLike?: () => void
  onPass?: () => void
  onChat?: () => void
  compatibilityScore?: number
  matchReasons?: string[]
  showActions?: boolean
}

export function EnhancedPetDetailView({
  pet,
  onClose,
  onLike,
  onPass,
  onChat,
  compatibilityScore,
  matchReasons,
  showActions = true
}: EnhancedPetDetailViewProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const photos = pet.photos && pet.photos.length > 0 ? pet.photos : [pet.photo]

  const handleNextPhoto = useCallback((): void => {
    setIsLoading(true)
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
    haptics.impact('light')
  }, [photos.length])

  const handlePrevPhoto = useCallback((): void => {
    setIsLoading(true)
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
    haptics.impact('light')
  }, [photos.length])

  const swipeGesture = useSwipeGesture({
    onSwipeLeft: handleNextPhoto,
    onSwipeRight: handlePrevPhoto,
    threshold: 50
  })

  const handleImageLoad = useCallback((): void => {
    setIsLoading(false)
  }, [])

  const handleImageError = useCallback((): void => {
    setIsLoading(false)
  }, [])

  const handleLike = () => {
    haptics.impact('medium')
    onLike?.()
  }

  const handlePass = () => {
    haptics.impact('light')
    onPass?.()
  }

  const handleChat = () => {
    haptics.impact('light')
    onChat?.()
  }

  const trustScore = pet.trustScore || 0
  const getTrustLevel = (score: number) => {
    if (score >= 80) return { label: 'Highly Trusted', color: 'text-green-500' }
    if (score >= 60) return { label: 'Trusted', color: 'text-blue-500' }
    if (score >= 40) return { label: 'Established', color: 'text-yellow-500' }
    return { label: 'New', color: 'text-muted-foreground' }
  }

  const trustLevel = getTrustLevel(trustScore)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
        className="w-full max-w-4xl max-h-[90vh] bg-card rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
            >
              <X size={24} weight="bold" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            {/* Photo Gallery */}
            <div 
              className="relative h-96 bg-muted"
              {...swipeGesture.handlers}
            >
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentPhotoIndex}
                  src={photos[currentPhotoIndex]}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isLoading ? 0 : 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  style={{
                    transform: swipeGesture.isSwiping 
                      ? `translateX(${swipeGesture.swipeDistance}px)` 
                      : undefined,
                    transition: swipeGesture.isSwiping ? 'none' : 'transform 0.3s ease-out'
                  }}
                />
              </AnimatePresence>

              {photos.length > 1 && (
                <>
                  <div className="absolute inset-0 flex items-center justify-between px-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)}
                      className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                    >
                      <PawPrint size={20} weight="fill" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)}
                      className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                    >
                      <PawPrint size={20} weight="fill" />
                    </Button>
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {photos.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setIsLoading(true)
                          setCurrentPhotoIndex(idx)
                        }}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentPhotoIndex ? 'bg-white w-6' : 'bg-white/50'                                                                            
                        }`}
                        aria-label={`Go to photo ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}

              {compatibilityScore !== undefined && (
                <div className="absolute top-4 left-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary to-accent backdrop-blur-sm"
                  >
                    <TrendUp size={20} weight="bold" className="text-white" />
                    <span className="text-lg font-bold text-white">{compatibilityScore}% Match</span>
                  </motion.div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h1 className="text-3xl font-bold">{pet.name}</h1>
                    <p className="text-lg text-muted-foreground">
                      {pet.breed} • {pet.age} {pet.age === 1 ? 'year' : 'years'}
                    </p>
                  </div>
                  {trustScore > 0 && (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={20} className={trustLevel.color} weight="fill" />
                        <span className={`font-semibold ${trustLevel.color}`}>{trustLevel.label}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">Trust Score: {trustScore}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin size={16} weight="fill" />
                  <span>{pet.location}</span>
                </div>
              </div>

              {/* Match Reasons */}
              {matchReasons && matchReasons.length > 0 && (
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Star size={20} className="text-accent" weight="fill" />
                      Why This Match Works
                    </h3>
                    <ul className="space-y-1.5">
                      {matchReasons.map((reason, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="text-sm flex items-start gap-2"
                        >
                          <Heart size={14} className="text-primary mt-0.5 shrink-0" weight="fill" />
                          <span>{reason}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Tabs */}
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="personality">Personality</TabsTrigger>
                  <TabsTrigger value="stats">Stats</TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="space-y-4 mt-4">
                  <div>
                    <h3 className="font-semibold mb-2">Bio</h3>
                    <p className="text-muted-foreground">{pet.bio}</p>
                  </div>

                  {pet.interests && pet.interests.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Interests</h3>
                      <div className="flex flex-wrap gap-2">
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
                      <h3 className="font-semibold mb-2">Looking For</h3>
                      <div className="flex flex-wrap gap-2">
                        {pet.lookingFor.map((item, idx) => (
                          <Badge key={idx} variant="outline">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="personality" className="space-y-4 mt-4">
                  {pet.personality && pet.personality.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Personality Traits</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {pet.personality.map((trait, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-3 rounded-lg bg-muted/50 border border-border text-center"
                          >
                            <PawPrint size={24} className="text-primary mx-auto mb-1" weight="fill" />
                            <span className="text-sm font-medium">{trait}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold mb-2">Activity Level</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Energy</span>
                        <span className="font-medium">{pet.activityLevel || 'Moderate'}</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="stats" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Users size={24} className="text-primary" weight="duotone" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Playdates</p>
                            <p className="text-2xl font-bold">{pet.playdateCount || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-accent/10">
                            <Star size={24} className="text-accent" weight="duotone" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Rating</p>
                            <p className="text-2xl font-bold">{pet.overallRating?.toFixed(1) || 'N/A'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-secondary/10">
                            <Lightning size={24} className="text-secondary" weight="duotone" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Response Rate</p>
                            <p className="text-2xl font-bold">{Math.round((pet.responseRate || 0) * 100)}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-lavender/10">
                            <Calendar size={24} className="text-lavender" weight="duotone" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Member Since</p>
                            <p className="text-sm font-bold">{new Date(pet.createdAt || Date.now()).getFullYear()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {pet.badges && pet.badges.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Trust Badges</h3>
                      <div className="flex flex-wrap gap-2">
                        {pet.badges.map((badge, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                          >
                            <Badge className="px-3 py-1.5">
                              <ShieldCheck size={14} className="mr-1" weight="fill" />
                              {badge.label}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>

          {/* Actions */}
          {showActions && (
            <div className="border-t border-border p-4 bg-card/95 backdrop-blur-sm">
              <div className="flex gap-3 max-w-md mx-auto">
                {onPass && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handlePass}
                    className="flex-1 rounded-full"
                  >
                    <X size={20} weight="bold" className="mr-2" />
                    Pass
                  </Button>
                )}
                {onChat && (
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleChat}
                    className="flex-1 rounded-full"
                  >
                    <ChatCircle size={20} weight="fill" className="mr-2" />
                    Chat
                  </Button>
                )}
                {onLike && (
                  <Button
                    size="lg"
                    onClick={handleLike}
                    className="flex-1 rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  >
                    <Heart size={20} weight="fill" className="mr-2" />
                    Like
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

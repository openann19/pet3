import { PetRatings } from '@/components/PetRatings';
import { motion, AnimatePresence } from 'framer-motion';
import { TrustBadges } from '@/components/TrustBadges';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { usePhotoCarousel } from '@/hooks/usePhotoCarousel';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import type { Pet } from '@/lib/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const logger = createLogger('PetDetailDialog');
import {
  Calendar,
  CaretLeft,
  CaretRight,
  ChatCircle,
  GenderFemale,
  GenderMale,
  Heart,
  MapPin,
  PawPrint,
  Ruler,
  ShieldCheck,
  Star,
  X,
} from '@phosphor-icons/react';
import { useEffect } from 'react';

interface PetDetailDialogProps {
  pet: Pet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PetDetailDialog({ pet, open, onOpenChange }: PetDetailDialogProps) {
  // All hooks must be called unconditionally at the top level
  const photos = Array.isArray(pet?.photos)
    ? pet.photos.filter((photo): photo is string => typeof photo === 'string' && photo.length > 0)
    : pet?.photo && typeof pet.photo === 'string'
      ? [pet.photo]
      : [];
  const {
    currentIndex,
    currentPhoto,
    hasMultiplePhotos,
    totalPhotos,
    nextPhoto,
    prevPhoto,
    goToPhoto,
  } = usePhotoCarousel({ photos });

  const reducedMotion = useReducedMotion();
  
  // Animation variants
  const dialogVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.95, 
      y: 20,
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2,
      },
    },
  };

  const photoVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.98,
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 250,
      },
    },
  };

  const closeButtonVariants = {
    rest: { scale: 1 },
    hover: { 
      scale: 1.05,
      transition: {
        duration: 0.15,
      },
    },
    tap: { 
      scale: 0.95,
      transition: {
        duration: 0.1,
      },
    },
  };

  const sizeMap: Record<string, string> = {
    small: 'Small (< 20 lbs)',
    medium: 'Medium (20-50 lbs)',
    large: 'Large (50-100 lbs)',
    'extra-large': 'Extra Large (> 100 lbs)',
  };

  // Early return after all hooks have been called
  if (!pet) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 border-0 bg-transparent">
        <DialogTitle className="sr-only">{pet.name} - Pet Details</DialogTitle>
        <DialogDescription className="sr-only">
          {pet.bio ? `Details for ${pet.name}. ${pet.bio}` : `Details for ${pet.name}`}
        </DialogDescription>
        <AnimatePresence>
          {open && (
            <motion.div
              variants={reducedMotion ? {} : dialogVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative bg-card rounded-3xl overflow-hidden shadow-2xl"
            >
              <motion.button
                variants={reducedMotion ? {} : closeButtonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                onClick={() => {
                  try {
                    haptics.trigger('light');
                    onOpenChange(false);
                  } catch (error) {
                    const err = error instanceof Error ? error : new Error(String(error));
                    logger.error('PetDetailDialog close button error', err);
                    // Still close dialog even if haptics fails
                    onOpenChange(false);
                  }
                }}
                className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full glass-strong flex items-center justify-center shadow-2xl border border-white/30 backdrop-blur-xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="Close dialog"
              >
                <X size={20} className="text-white drop-shadow-lg" weight="bold" />
              </motion.button>

              <div className="relative h-100 bg-linear-to-br from-muted/50 to-muted overflow-hidden group">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={currentIndex}
                    variants={reducedMotion ? {} : photoVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="w-full h-full"
                  >
                    <img
                      src={currentPhoto}
                      alt={`${pet.name} photo ${currentIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </AnimatePresence>

              <motion.div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />

              {hasMultiplePhotos && (
                <>
                  <motion.div
                    onClick={() => {
                      try {
                        prevPhoto();
                      } catch (error) {
                        const err = error instanceof Error ? error : new Error(String(error));
                        logger.error('PetDetailDialog prevPhoto error', err);
                      }
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 glass-strong rounded-full flex items-center justify-center shadow-2xl border border-white/30 backdrop-blur-xl z-30"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{
                      duration: 0.15,
                      ease: 'easeInOut',
                    }}
                  >
                    <CaretLeft size={24} weight="bold" className="text-white drop-shadow-lg" />
                  </motion.div>
                  <motion.div
                    onClick={() => {
                      try {
                        nextPhoto();
                      } catch (error) {
                        const err = error instanceof Error ? error : new Error(String(error));
                        logger.error('PetDetailDialog nextPhoto error', err);
                      }
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 glass-strong rounded-full flex items-center justify-center shadow-2xl border border-white/30 backdrop-blur-xl z-30"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{
                      duration: 0.15,
                      ease: 'easeInOut',
                    }}
                  >
                    <CaretRight size={24} weight="bold" className="text-white drop-shadow-lg" />
                  </motion.div>
                  <motion.div className="absolute top-20 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {photos.map((_, idx) => (
                      <motion.div
                        key={idx}
                        onClick={() => {
                          try {
                            if (idx >= 0 && idx < photos.length) {
                              goToPhoto(idx);
                            }
                          } catch (error) {
                            const err = error instanceof Error ? error : new Error(String(error));
                            logger.error('PetDetailDialog goToPhoto error', err, { index: idx });
                          }
                        }}
                        className={`h-2 rounded-full transition-all shadow-lg ${idx === currentIndex
                          ? 'bg-white w-10'
                          : 'bg-white/50 w-2 hover:bg-white/75'
                          }`}
                      />
                    ))}
                  </motion.div>
                </>
              )}

              <motion.div className="absolute bottom-6 left-6 text-white z-20">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-4xl sm:text-5xl font-bold drop-shadow-2xl" aria-hidden="true">{pet.name}</h2>
                  {pet.verified && (
                    <motion.div>
                      <ShieldCheck size={32} weight="fill" className="text-accent drop-shadow-lg" />
                    </motion.div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-white/90">
                  {pet?.gender && (
                    <span className="flex items-center gap-1.5 text-lg">
                      {pet.gender === 'male' ? (
                        <GenderMale size={20} weight="fill" />
                      ) : (
                        <GenderFemale size={20} weight="fill" />
                      )}
                      {pet.age != null && `${pet.age} years`}
                    </span>
                  )}
                  {pet?.gender && pet?.breed && (
                    <span className="w-1 h-1 rounded-full bg-white/60" />
                  )}
                  {pet?.breed && <span className="text-lg">{pet.breed}</span>}
                </div>
                {hasMultiplePhotos && (
                  <motion.div className="text-sm text-white/70 mt-2">
                    Photo {currentIndex + 1} of {totalPhotos}
                  </motion.div>
                )}
              </motion.div>
            </div>

            <div className="max-h-[calc(90vh-400px)] overflow-y-auto">
              <div className="p-6 sm:p-8 space-y-6">
                {pet.trustProfile && (
                  <motion.div>
                    <PetRatings
                      trustProfile={pet.trustProfile}
                      {...(pet.ratings !== undefined ? { ratings: pet.ratings } : {})}
                    />
                  </motion.div>
                )}

                {pet.bio && (
                  <motion.div className="space-y-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <ChatCircle size={16} weight="fill" className="text-primary" />
                      About {pet.name}
                    </h3>
                    <p className="text-foreground leading-relaxed">{pet.bio}</p>
                  </motion.div>
                )}

                <Separator />

                <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <PawPrint size={16} weight="fill" className="text-primary" />
                      Details
                    </h3>
                    <div className="space-y-3">
                      {pet.age != null && (
                        <motion.div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar size={18} weight="fill" className="text-accent" />
                            Age
                          </span>
                          <span className="font-semibold">{pet.age} years old</span>
                        </motion.div>
                      )}
                      {pet.gender && (
                        <motion.div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            {pet.gender === 'male' ? (
                              <GenderMale size={18} weight="fill" className="text-accent" />
                            ) : (
                              <GenderFemale size={18} weight="fill" className="text-accent" />
                            )}
                            Gender
                          </span>
                          <span className="font-semibold capitalize">{pet.gender}</span>
                        </motion.div>
                      )}
                      {pet.size && (
                        <motion.div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Ruler size={18} weight="fill" className="text-accent" />
                            Size
                          </span>
                          <span className="font-semibold">{sizeMap[pet.size] || pet.size}</span>
                        </motion.div>
                      )}
                      {pet.location && (
                        <motion.div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <MapPin size={18} weight="fill" className="text-accent" />
                            Location
                          </span>
                          <span className="font-semibold">{pet.location}</span>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Heart size={16} weight="fill" className="text-primary" />
                      Owner
                    </h3>
                    <motion.div className="p-4 rounded-xl bg-linear-to-br from-primary/5 to-accent/5 border border-border">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="w-14 h-14 ring-2 ring-primary/20">
                          <AvatarImage src={pet?.ownerAvatar} />
                          <AvatarFallback className="bg-linear-to-br from-primary to-accent text-primary-foreground text-lg font-bold">
                            {pet?.ownerName?.[0] ?? '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-bold text-lg">{pet?.ownerName ?? 'Unknown Owner'}</p>
                          {pet?.location && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin size={14} weight="fill" />
                              {pet.location}
                            </p>
                          )}
                        </div>
                      </div>
                      {pet?.trustProfile && (
                        <div className="flex items-center gap-2 justify-between pt-3 border-t border-border">
                          <div className="flex items-center gap-1.5">
                            <Star size={16} weight="fill" className="text-accent" />
                            <span className="text-sm font-semibold">
                              {typeof pet.trustProfile.overallRating === 'number'
                                ? pet.trustProfile.overallRating.toFixed(1)
                                : 'N/A'}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {typeof pet.trustProfile.totalReviews === 'number'
                              ? `${pet.trustProfile.totalReviews} reviews`
                              : 'No reviews'}
                          </span>
                          {typeof pet.trustProfile.responseRate === 'number' &&
                            pet.trustProfile.responseRate > 0 && (
                              <>
                                <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                <span className="text-xs text-muted-foreground">
                                  {pet.trustProfile.responseRate}% response rate
                                </span>
                              </>
                            )}
                        </div>
                      )}
                    </motion.div>
                  </div>
                </motion.div>

                {Array.isArray(pet.personality) && pet.personality.length > 0 && (
                  <>
                    <Separator />
                    <motion.div className="space-y-3">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Personality Traits
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {pet.personality.map((trait, idx) => (
                          <motion.div key={idx}>
                            <Badge
                              variant="secondary"
                              className="px-3 py-1.5 text-sm font-medium hover:bg-secondary/80 transition-colors"
                            >
                              {trait}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}

                {Array.isArray(pet.interests) && pet.interests.length > 0 && (
                  <>
                    <Separator />
                    <motion.div className="space-y-3">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Interests & Activities
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {pet.interests.map((interest, idx) => (
                          <motion.div key={idx}>
                            <Badge
                              variant="outline"
                              className="px-3 py-1.5 text-sm font-medium border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-colors"
                            >
                              {interest}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}

                {Array.isArray(pet.lookingFor) && pet.lookingFor.length > 0 && (
                  <>
                    <Separator />
                    <motion.div className="space-y-3">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Looking For
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {pet.lookingFor.map((item, idx) => (
                          <motion.div key={idx}>
                            <Badge className="px-3 py-1.5 text-sm font-medium bg-linear-to-r from-primary to-accent text-white hover:shadow-lg transition-all">
                              {item}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}

                {pet.trustProfile?.badges &&
                  Array.isArray(pet.trustProfile.badges) &&
                  pet.trustProfile.badges.length > 0 && (
                    <>
                      <Separator />
                      <motion.div className="space-y-4">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <ShieldCheck size={16} weight="fill" className="text-primary" />
                          Trust & Verification
                        </h3>
                        <TrustBadges badges={pet.trustProfile.badges} showLabels />
                      </motion.div>
                    </>
                  )}
              </div>
            </div>
          </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

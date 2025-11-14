import { DEFAULT_PREFERENCES } from '@/components/DiscoveryFilters';
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
import { ProgressiveImage } from '@/components/enhanced/ProgressiveImage';
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
import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, useMotionValue, useAnimation, animate } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import { RouteErrorBoundary } from '@/components/error/RouteErrorBoundary';
import { OfflineIndicator } from '@/components/network/OfflineIndicator';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { toast } from 'sonner';

const logger = createLogger('DiscoverView');

function DiscoverViewContent() {


  const { t } = useApp();
  const [prefs, setPrefs] = useState<DiscoveryPreferences>(DEFAULT_PREFERENCES);
  const { availablePets, currentPet, markAsSwiped } = usePetDiscovery();
  const { viewMode } = useViewMode();
  const [matchedPetName, setMatchedPetName] = useState('');
  const celebrationDialog = useDialog();

  // Main return block with correct structure and conditional rendering
  // No pets available or not loaded
  if (!availablePets || availablePets.length === 0) {
    return (
      <PageTransitionWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-24 h-24 rounded-full bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 relative">
            <Sparkle size={48} className="text-primary" />
          </div>
          <div className="text-2xl font-bold mb-2">{t.discover.createProfile}</div>
          <div className="text-muted-foreground mb-6 max-w-md">{t.discover.createProfileDesc}</div>
        </div>
      </PageTransitionWrapper>
    );
  }

  // Map mode
  if (viewMode === 'map') {
    return (
      <PageTransitionWrapper>
        <DiscoverMapMode
          pets={availablePets as Pet[]}
          userPet={currentPet}
          onSwipe={(pet, action) => {
            markAsSwiped(pet.id);
            if (action === 'like') {
              setMatchedPetName(pet.name);
              celebrationDialog.open();
            }
          }}
        />
      </PageTransitionWrapper>
    );
  }

  // Card mode (main swipe UI)
  return (
    <PageTransitionWrapper>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        {currentPet ? (
          <motion.div
            key={currentPet.id}
            role="region"
            aria-label={currentPet.name}
            className="relative w-full max-w-md bg-background rounded-xl shadow-lg p-6 mb-6"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            tabIndex={0}
          >
            <div className="flex flex-col items-center">
              <ProgressiveImage
                src={currentPet.photo}
                alt={currentPet.name}
                className="w-40 h-40 object-cover rounded-full border-4 border-primary mb-4"
              />
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold">{currentPet.name}</span>
                {currentPet.verified && <VerificationBadge verified={true} size="sm" />}
              </div>
              <div className="text-muted-foreground mb-2">{currentPet.breed} • {currentPet.age} {t.common?.years ?? 'years old'}</div>
              <div className="flex flex-wrap gap-2 justify-center mb-2">
                {currentPet.personality?.map((trait) => (
                  <Badge key={trait} className="bg-accent text-xs">{trait}</Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {currentPet.interests?.slice(0, 3).map((interest) => (
                  <Badge key={interest} className="bg-secondary text-xs">{interest}</Badge>
                ))}
              </div>
              <div className="flex gap-4 justify-center mt-4">
                <Button
                  aria-label={t.discover.pass}
                  variant="outline"
                  className="rounded-full w-12 h-12 flex items-center justify-center"
                  onClick={() => markAsSwiped(currentPet.id)}
                >
                  <X size={28} className="text-destructive" />
                </Button>
                <Button
                  aria-label={t.discover.like}
                  variant="default"
                  className="rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
                  onClick={() => {
                    setMatchedPetName(currentPet.name);
                    celebrationDialog.open();
                    markAsSwiped(currentPet.id);
                  }}
                >
                  <Heart size={32} className="text-primary" />
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <Sparkle size={48} className="text-primary mb-4" />
            <div className="text-xl font-semibold mb-2">{t.discover.noMore}</div>
            <div className="text-muted-foreground mb-4">{t.discover.noMoreDesc}</div>
          </div>
        )}
      </div>
      <MatchCelebration
        show={celebrationDialog.isOpen}
        petName1={currentPet?.name || ''}
        petName2={matchedPetName}
        onComplete={celebrationDialog.close}
      />
    </PageTransitionWrapper>
  );
}

import { adoptionApi } from '@/api/adoption-api';
import { AdoptionListingCard } from '@/components/adoption/AdoptionListingCard';
import { AdoptionListingDetailDialog } from '@/components/adoption/AdoptionListingDetailDialog';
import { CreateAdoptionListingDialog } from '@/components/adoption/CreateAdoptionListingDialog';
import { MyApplicationsView } from '@/components/adoption/MyApplicationsView';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/contexts/AppContext';
import { useStorage } from '@/hooks/use-storage';
import type { AdoptionListing } from '@/lib/adoption-marketplace-types';
import { createLogger } from '@/lib/logger';
import { ClipboardText, Heart, MagnifyingGlass, Plus } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { motionDurations, staggerContainerVariants, getVariantsWithReducedMotion } from '@/effects/framer-motion/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { toast } from 'sonner';
import { VirtualGrid } from '@/components/virtual/VirtualGrid';
import { ScreenErrorBoundary } from '@/components/error/ScreenErrorBoundary';
import { getTypographyClasses, getSpacingClassesFromConfig, getColorClasses } from '@/lib/design-token-utils';
import { cn } from '@/lib/utils';
import { safeArrayAccess } from '@/lib/runtime-safety';

const logger = createLogger('AdoptionView');

type ViewMode = 'browse' | 'my-applications' | 'my-listings';

function AdoptionViewContent() {
  const { t } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [listings, setListings] = useState<AdoptionListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useStorage<string[]>('adoption-favorites', []);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'available' | 'favorites'>('all');
  const [userApplicationsCount, setUserApplicationsCount] = useState(0);
  const [selectedListing, setSelectedListing] = useState<AdoptionListing | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [_cursor, setCursor] = useState<string | undefined>();

  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    void loadListings();
    void loadUserApplicationsCount();
  }, []);

  const loadListings = async (): Promise<void> => {
    try {
      setLoading(true);
      if (typeof window !== 'undefined' && window.spark) {
        await window.spark.user();
      }
      const result = await adoptionApi.getAdoptionProfiles({ limit: 50 });
      const mappedListings = Array.isArray(result.profiles)
        ? result.profiles.map(
            (p) => {
              const locationString = typeof p.location === 'string' ? p.location : '';
              const locationParts = locationString.split(', ');
              return {
                id: typeof p._id === 'string' ? p._id : String(p._id),
                ownerId: typeof p.shelterId === 'string' ? p.shelterId : '',
                ownerName: typeof p.shelterName === 'string' ? p.shelterName : '',
                petId: typeof p.petId === 'string' ? p.petId : '',
                petName: typeof p.petName === 'string' ? p.petName : '',
                petBreed: typeof p.breed === 'string' ? p.breed : '',
                petAge: typeof p.age === 'number' ? p.age : (typeof p.age === 'string' ? parseInt(p.age, 10) || 0 : 0),
                petGender: typeof p.gender === 'string' ? p.gender : '',
                petSize: typeof p.size === 'string' ? p.size : '',
                petSpecies: 'dog' as const,
                petPhotos: Array.isArray(p.photos) ? p.photos : [],
                petDescription: typeof p.description === 'string' ? p.description : '',
                status:
                  p.status === 'available'
                    ? ('active' as const)
                    : p.status === 'pending'
                      ? ('pending_review' as const)
                      : p.status === 'adopted'
                        ? ('adopted' as const)
                        : ('pending_review' as const),
                location: {
                  city: safeArrayAccess(locationParts, 0) ?? '',
                  country: safeArrayAccess(locationParts, 1) ?? '',
                  privacyRadiusM: 1000,
                },
                requirements: [],
                vetDocuments: [],
                vaccinated: Boolean(p.vaccinated),
                spayedNeutered: Boolean(p.spayedNeutered),
                microchipped: false,
                goodWithKids: Boolean(p.goodWithKids),
                goodWithPets: Boolean(p.goodWithPets),
                energyLevel: typeof p.energyLevel === 'string' ? p.energyLevel : '',
                temperament: (typeof p.personality === 'string' && String(p.personality).length > 0) ? [String(p.personality)] : [],
                reasonForAdoption: typeof p.description === 'string' && p.description.length > 0 ? p.description : 'Looking for a loving home',
                createdAt: typeof p.postedDate === 'string' ? p.postedDate : new Date().toISOString(),
                updatedAt: typeof p.postedDate === 'string' ? p.postedDate : new Date().toISOString(),
                viewsCount: 0,
                applicationsCount: 0,
                featured: false,
              } as AdoptionListing;
            }
          )
        : [];
      setListings(mappedListings);
      setCursor(result.nextCursor);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load listings', err, { action: 'loadListings' });
      toast.error('Failed to load adoption listings');
    } finally {
      setLoading(false);
    }
  };

  const loadUserApplicationsCount = async (): Promise<void> => {
    try {
      if (typeof window !== 'undefined' && window.spark) {
        const user = await window.spark.user();
        if (user?.id) {
          const applications = await adoptionApi.getUserApplications(user.id);
          setUserApplicationsCount(Array.isArray(applications) ? applications.length : 0);
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load user applications count', err, {
        action: 'loadUserApplicationsCount',
      });
    }
  };

  const handleToggleFavorite = useCallback((listingId: string): void => {
    void setFavorites((currentFavorites: string[] | undefined): string[] => {
      const current = Array.isArray(currentFavorites) ? currentFavorites : [];
      if (current.includes(listingId)) {
        return current.filter((id) => id !== listingId);
      } else {
        return [...current, listingId];
      }
    });
  }, [setFavorites]);

  const handleSelectListing = useCallback((listing: AdoptionListing): void => {
    setSelectedListing(listing);
    setShowDetailDialog(true);
  }, []);

  // Memoize render item callback for VirtualGrid
  const renderListingCard = useCallback((listing: AdoptionListing) => (
    <AdoptionListingCard
      listing={listing}
      onSelect={handleSelectListing}
      onFavorite={handleToggleFavorite}
      isFavorited={Array.isArray(favorites) && favorites.includes(listing.id)}
    />
  ), [favorites, handleSelectListing, handleToggleFavorite]);

  // Memoize key extractor
  const listingKeyExtractor = useCallback((listing: AdoptionListing) => listing.id, []);

  // Memoize filtered listings to prevent unnecessary recalculations
  const filteredListings = useMemo((): AdoptionListing[] => {
    if (!Array.isArray(listings)) {
      return [];
    }

    let list: AdoptionListing[] = listings.filter((l: AdoptionListing): boolean => l.status === 'active');

    if (activeTab === 'available') {
      list = list.filter((l: AdoptionListing): boolean => l.status === 'active');
    } else if (activeTab === 'favorites') {
      list = list.filter((l: AdoptionListing): boolean => {
        const listingId = typeof l.id === 'string' ? l.id : String(l.id);
        return Array.isArray(favorites) && favorites.includes(listingId);
      });
    }

    if (typeof searchQuery === 'string' && searchQuery.length > 0) {
      const queryLower = searchQuery.toLowerCase();
      list = list.filter(
        (l: AdoptionListing): boolean => {
          const petName = typeof l.petName === 'string' ? l.petName.toLowerCase() : '';
          const petBreed = typeof l.petBreed === 'string' ? l.petBreed.toLowerCase() : '';
          const city = typeof l.location?.city === 'string' ? l.location.city.toLowerCase() : '';
          const country = typeof l.location?.country === 'string' ? l.location.country.toLowerCase() : '';
          return petName.includes(queryLower) || petBreed.includes(queryLower) || city.includes(queryLower) || country.includes(queryLower);
        }
      );
    }

    return list.sort((a: AdoptionListing, b: AdoptionListing): number => {
      const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0;
      const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [listings, activeTab, favorites, searchQuery]);

  if (viewMode === 'my-applications') {
    return <MyApplicationsView onBack={() => setViewMode('browse')} />;
  }

  const availableCount = Array.isArray(listings) ? listings.filter((l: AdoptionListing) => l.status === 'active').length : 0;

  if (loading && (!Array.isArray(listings) || listings.length === 0)) {
    return (
      <PageTransitionWrapper key="adoption-view" direction="up">
        <main aria-label="Pet adoption section">
          <div className={cn('flex items-center justify-center min-h-[60vh]')} role="status" aria-live="polite" aria-label="Loading adoption listings">
            <div className={cn('text-center', getSpacingClassesFromConfig({ spaceY: 'xl' }))}>
              <div className={cn('animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto', getSpacingClassesFromConfig({ marginY: 'lg' }))} aria-hidden="true"></div>
              <p className={cn(getTypographyClasses('body'), getColorClasses('mutedForeground', 'text'))}>{t.common?.loading ?? 'Loading...'}</p>
            </div>
          </div>
        </main>
      </PageTransitionWrapper>
    );
  }

  return (
    <PageTransitionWrapper key="adoption-view" direction="up">
      <main aria-label="Pet adoption section" className={cn('max-w-7xl mx-auto', getSpacingClassesFromConfig({ spaceY: 'xl', paddingX: 'lg', paddingY: '2xl' }))}>
        {/* Header Section */}
        <header className={cn('flex items-center justify-between', getSpacingClassesFromConfig({ gap: 'md', marginY: 'xl' }))}>
          <div>
            <h1 className={cn(getTypographyClasses('h1'), 'flex items-center', getSpacingClassesFromConfig({ gap: 'md' }))}>
              <Heart size={32} weight="fill" className={getColorClasses('primary', 'text')} aria-hidden="true" />
              {t.adoption?.title ?? 'Pet Adoption'}
            </h1>
            <p className={cn(getTypographyClasses('bodySmall'), getColorClasses('mutedForeground', 'text'), getSpacingClassesFromConfig({ marginY: 'xs' }))}>
              {t.adoption?.subtitle ?? 'Find your perfect companion and give them a forever home'}
            </p>
          </div>

          <nav className={cn('flex items-center', getSpacingClassesFromConfig({ gap: 'sm' }))} aria-label="Adoption actions">
            <Button
              onClick={() => setViewMode('my-applications')}
              variant="outline"
              className={getSpacingClassesFromConfig({ gap: 'sm' })}
              aria-label={t.adoption?.myApplications ?? 'My Applications'}
            >
              <ClipboardText size={20} weight="fill" aria-hidden="true" />
              {t.adoption?.myApplications ?? 'My Applications'}
              {typeof userApplicationsCount === 'number' && userApplicationsCount > 0 && (
                <Badge variant="secondary" className="ml-1" aria-label={`${userApplicationsCount} applications`}>
                  {userApplicationsCount}
                </Badge>
              )}
            </Button>
            <Button 
              onClick={() => setShowCreateDialog(true)} 
              className={getSpacingClassesFromConfig({ gap: 'sm' })}
              aria-label={t.adoption?.createListing ?? 'Create Listing'}
            >
              <Plus size={20} weight="fill" aria-hidden="true" />
              {t.adoption?.createListing ?? 'Create Listing'}
            </Button>
          </nav>
        </header>

        {/* Search and Filter Section */}
        <section aria-label="Search and filter adoption listings">
          <div className={cn('flex flex-col sm:flex-row items-start sm:items-center', getSpacingClassesFromConfig({ gap: 'lg', marginY: 'xl' }))}>
            <div className={cn('flex-1 relative w-full')}>
              <label htmlFor="adoption-search" className="sr-only">
                Search adoption listings by pet name, breed, or location
              </label>
              <MagnifyingGlass
                className={cn('absolute left-3 top-1/2 -translate-y-1/2', getColorClasses('mutedForeground', 'text'))}
                size={20}
                aria-hidden="true"
              />
              <Input
                id="adoption-search"
                placeholder={'Search by pet name, breed, location...'}
                value={typeof searchQuery === 'string' ? searchQuery : ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                aria-label="Search adoption listings"
                className="pl-10"
              />
            </div>

            <Tabs value={activeTab} onValueChange={(v: string) => {
              if (v === 'all' || v === 'available' || v === 'favorites') {
                setActiveTab(v);
              }
            }}>
              <TabsList role="tablist" aria-label="Filter adoption listings">
                <TabsTrigger value="all" aria-label="All listings tab">
                  All {Array.isArray(listings) && listings.length > 0 && `(${listings.length})`}
                </TabsTrigger>
                <TabsTrigger value="available" aria-label="Available listings tab">
                  {t.adoption?.available ?? 'Available'} {availableCount > 0 && `(${availableCount})`}
                </TabsTrigger>
                <TabsTrigger value="favorites" aria-label="Favorite listings tab">
                  Favorites{' '}
                  {Array.isArray(favorites) && favorites.length > 0 && `(${favorites.length})`}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </section>

        {/* Listings Section */}
        <section aria-label="Adoption listings">
          <div className="h-[calc(100vh-320px)]">
            <AnimatePresence mode="wait">
              {!loading && (
                <motion.div
                  key="content"
                  variants={getVariantsWithReducedMotion(
                    {
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                      exit: { opacity: 0, y: -10 },
                    },
                    prefersReducedMotion
                  )}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{
                    duration: prefersReducedMotion ? 0 : motionDurations.smooth,
                  }}
                >
                  {!Array.isArray(filteredListings) || filteredListings.length === 0 ? (
                    <motion.div
                      key="empty"
                      variants={getVariantsWithReducedMotion(
                        {
                          hidden: { opacity: 0, y: 20 },
                          visible: { opacity: 1, y: 0 },
                        },
                        prefersReducedMotion
                      )}
                      initial="hidden"
                      animate="visible"
                      transition={{
                        duration: prefersReducedMotion ? 0 : motionDurations.smooth,
                      }}
                      className={cn('flex flex-col items-center justify-center', getSpacingClassesFromConfig({ paddingY: '4xl' }))}
                      role="status"
                      aria-live="polite"
                      aria-label="Empty state: No adoption listings"
                    >
                      <motion.div
                        variants={getVariantsWithReducedMotion(
                          {
                            hidden: { scale: 0.8, opacity: 0 },
                            visible: { scale: 1, opacity: 1 },
                          },
                          prefersReducedMotion
                        )}
                        initial="hidden"
                        animate="visible"
                        transition={{
                          delay: prefersReducedMotion ? 0 : 0.1,
                          duration: prefersReducedMotion ? 0 : motionDurations.smooth,
                        }}
                      >
                        <Heart 
                          size={64} 
                          className={cn(getColorClasses('mutedForeground', 'text'), getSpacingClassesFromConfig({ marginY: 'lg' }))} 
                          weight="thin"
                          aria-hidden="true"
                        />
                      </motion.div>
                      <h2 className={cn(getTypographyClasses('h2'), getSpacingClassesFromConfig({ marginY: 'sm' }))}>
                        {activeTab === 'favorites'
                          ? 'No Favorites Yet'
                          : typeof searchQuery === 'string' && searchQuery.length > 0
                            ? 'No Results Found'
                            : 'No Pets Available'}
                      </h2>
                      <p className={cn(getTypographyClasses('body'), getColorClasses('mutedForeground', 'text'), 'text-center max-w-md')}>
                        {activeTab === 'favorites'
                          ? 'Start adding pets to your favorites to see them here.'
                          : typeof searchQuery === 'string' && searchQuery.length > 0
                            ? 'Try adjusting your search terms or filters.'
                            : 'Check back soon for new pets looking for their forever homes.'}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      variants={getVariantsWithReducedMotion(staggerContainerVariants, prefersReducedMotion)}
                      initial="hidden"
                      animate="visible"
                      className="h-full"
                    >
                      <VirtualGrid
                        items={filteredListings}
                        renderItem={renderListingCard}
                        columns={3}
                        itemHeight={400}
                        gap={24}
                        overscan={5}
                        containerClassName="h-full"
                        keyExtractor={listingKeyExtractor}
                      />
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Dialogs */}
        <CreateAdoptionListingDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={() => {
            void loadListings();
            void loadUserApplicationsCount();
          }}
        />

        {selectedListing && (
          <AdoptionListingDetailDialog
            listing={selectedListing}
            open={showDetailDialog}
            onOpenChange={(open) => {
              setShowDetailDialog(open);
              if (!open) {
                setSelectedListing(null);
              }
              void loadUserApplicationsCount();
            }}
            onApplicationSubmitted={() => {
              void loadUserApplicationsCount();
            }}
          />
        )}
      </main>
    </PageTransitionWrapper>
  );
}

export default function AdoptionView() {
  return (
    <ScreenErrorBoundary screenName="Adoption" enableNavigation={true} enableReporting={false}>
      <AdoptionViewContent />
    </ScreenErrorBoundary>
  );
}

import { AdoptionFiltersSheet } from '@/components/adoption/AdoptionFiltersSheet';
import { AdoptionListingCard } from '@/components/adoption/AdoptionListingCard';
import { AdoptionListingDetailDialog } from '@/components/adoption/AdoptionListingDetailDialog';
import { CreateAdoptionListingDialog } from '@/components/adoption/CreateAdoptionListingDialog';
import { MyAdoptionApplications } from '@/components/adoption/MyAdoptionApplications';
import { MyAdoptionListings } from '@/components/adoption/MyAdoptionListings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AdoptionListing, AdoptionListingFilters } from '@/lib/adoption-marketplace-types';
import { haptics } from '@/lib/haptics';
import { Check, Funnel, Heart, MagnifyingGlass, Plus, X } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { motionDurations, staggerContainerVariants, staggerItemVariants, getVariantsWithReducedMotion } from '@/effects/framer-motion/variants';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { toast } from 'sonner';

type ViewTab = 'browse' | 'my-listings' | 'my-applications';

import { useAdoptionMarketplace } from '@/hooks/adoption/use-adoption-marketplace';
import { ScreenErrorBoundary } from '@/components/error/ScreenErrorBoundary';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { getTypographyClasses, getSpacingClassesFromConfig, getColorClasses, focusRing } from '@/lib/design-token-utils';
import { cn } from '@/lib/utils';

function AdoptionMarketplaceViewContent() {
  const [activeTab, setActiveTab] = useState<ViewTab>('browse');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedListing, setSelectedListing] = useState<AdoptionListing | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const marketplaceHook = useAdoptionMarketplace();
  const {
    listings,
    loading,
    searchQuery,
    setSearchQuery,
    currentUser,
    hasMore,
    loadListings,
    filteredListings,
    activeFilterCount,
  } = marketplaceHook;
  
  // Safely extract filters with type guard
  const filters: AdoptionListingFilters = (marketplaceHook.filters && typeof marketplaceHook.filters === 'object' && !('message' in marketplaceHook.filters))
    ? (marketplaceHook.filters as AdoptionListingFilters)
    : {};
  const setFilters = marketplaceHook.setFilters;

  const handleCreateListing = (): void => {
    haptics.impact('medium');
    setShowCreateDialog(true);
  };

  const handleListingCreated = (): void => {
    setShowCreateDialog(false);
    toast.success('Adoption listing created! It will be reviewed by our team.');
    void loadListings();
  };

  const handleSelectListing = (listing: AdoptionListing): void => {
    haptics.impact('light');
    setSelectedListing(listing);
    setShowDetailDialog(true);
  };

  const handleToggleFilters = (): void => {
    haptics.impact('light');
    setShowFilters(!showFilters);
  };

  const prefersReducedMotion = useReducedMotion();

  return (
    <PageTransitionWrapper key="adoption-marketplace-view" direction="up">
      <main aria-label="Adoption marketplace" className={cn('max-w-7xl mx-auto', getSpacingClassesFromConfig({ spaceY: 'xl', paddingX: 'lg', paddingY: '2xl' }))}>
        {/* Header Section */}
        <header className={cn('flex items-start justify-between', getSpacingClassesFromConfig({ gap: 'md', marginY: 'xl' }))}>
          <div>
            <h1 className={cn(
              getTypographyClasses('h1'),
              'flex items-center',
              getSpacingClassesFromConfig({ gap: 'md' })
            )}>
              <Heart size={32} weight="fill" className={getColorClasses('primary', 'text')} aria-hidden="true" />
              Adoption Marketplace
            </h1>
            <p className={cn(
              getTypographyClasses('bodySmall'),
              getColorClasses('mutedForeground', 'text'),
              getSpacingClassesFromConfig({ marginY: 'xs' })
            )}>
              Find your perfect companion and give them a loving forever home
            </p>
          </div>

          <Button 
            onClick={handleCreateListing} 
            className={getSpacingClassesFromConfig({ gap: 'sm' })} 
            aria-label="Create new adoption listing"
          >
            <Plus size={20} weight="bold" aria-hidden="true" />
            List Pet
          </Button>
        </header>

        {/* Tabs Section */}
        <section aria-label="Adoption marketplace tabs">
          <Tabs value={activeTab} onValueChange={(v: string): void => {
            if (v === 'browse' || v === 'my-listings' || v === 'my-applications') {
              setActiveTab(v);
            }
          }}>
            <TabsList className="w-full sm:w-auto" role="tablist" aria-label="Adoption marketplace navigation tabs">
              <TabsTrigger value="browse" className="flex-1 sm:flex-none" aria-label="Browse adoption listings tab">
                Browse
              </TabsTrigger>
              <TabsTrigger value="my-listings" className="flex-1 sm:flex-none" aria-label="My listings tab">
                My Listings
              </TabsTrigger>
              <TabsTrigger value="my-applications" className="flex-1 sm:flex-none" aria-label="My applications tab">
                Applications
              </TabsTrigger>
            </TabsList>

            {/* Browse Tab */}
            <TabsContent value="browse" className={cn(
              getSpacingClassesFromConfig({ spaceY: 'lg', marginY: 'xl' })
            )} role="tabpanel" aria-labelledby="browse-tab">
              {/* Search and Filters Section */}
              <section aria-label="Search and filter adoption listings">
                <div className={cn('flex flex-col sm:flex-row', getSpacingClassesFromConfig({ gap: 'md', marginY: 'lg' }))}>
                  <div className="flex-1 relative">
                    <label htmlFor="adoption-search" className="sr-only">
                      Search adoption listings by name, breed, or location
                    </label>
                    <MagnifyingGlass
                      className={cn('absolute left-3 top-1/2 -translate-y-1/2', getColorClasses('mutedForeground', 'text'))}
                      size={20}
                      aria-hidden="true"
                    />
                    <Input
                      id="adoption-search"
                      placeholder="Search by name, breed, or location..."
                      value={typeof searchQuery === 'string' ? searchQuery : ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      aria-label="Search adoption listings"
                    />
                  </div>

                  <Button 
                    variant="outline" 
                    onClick={handleToggleFilters} 
                    className={cn(getSpacingClassesFromConfig({ gap: 'sm' }), 'relative')}
                    aria-label={`${typeof activeFilterCount === 'number' && activeFilterCount > 0 ? `${activeFilterCount} active filters. ` : ''}Toggle filters`}
                    aria-expanded={showFilters}
                    aria-controls="adoption-filters-sheet"
                  >
                    <Funnel size={20} aria-hidden="true" />
                    Filters
                    {typeof activeFilterCount === 'number' && activeFilterCount > 0 && (
                      <Badge variant="secondary" className={getSpacingClassesFromConfig({ marginX: 'xs' })} aria-label={`${activeFilterCount} active filters`}>
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </div>
              </section>

              {/* Active Filters Display */}
              {typeof activeFilterCount === 'number' && activeFilterCount > 0 && (
                <section aria-label="Active filters">
                  <ul className={cn('flex flex-wrap', getSpacingClassesFromConfig({ gap: 'sm', marginY: 'lg' }))} role="list">
                    {filters &&
                      typeof filters === 'object' &&
                      'breed' in filters &&
                      Array.isArray(filters.breed) &&
                      filters.breed.length > 0 &&
                      filters.breed.map((breed: string) => {
                        const breedString = typeof breed === 'string' ? breed : String(breed);
                        return (
                          <li key={breedString}>
                            <Badge variant="secondary" className="gap-1">
                              {breedString}
                              <button
                                type="button"
                                onClick={(): void => {
                                  setFilters((prev: AdoptionListingFilters): AdoptionListingFilters => {
                                    const prevFilters = prev ?? {};
                                    const newBreed = Array.isArray(prevFilters.breed) ? prevFilters.breed.filter((b: string): boolean => b !== breedString) : [];
                                    const updated: AdoptionListingFilters = { ...prevFilters };
                                    if (newBreed.length === 0) {
                                      delete updated.breed;
                                    } else {
                                      updated.breed = newBreed;
                                    }
                                    return updated;
                                  });
                                }}
                                className={cn('cursor-pointer hover:text-destructive', focusRing)}
                                aria-label={`Remove ${breedString} filter`}
                              >
                                <X size={14} aria-hidden="true" />
                              </button>
                            </Badge>
                          </li>
                        );
                      })}
                    {filters && typeof filters === 'object' && 'vaccinated' in filters && Boolean(filters.vaccinated) && (
                      <li>
                        <Badge variant="secondary" className={getSpacingClassesFromConfig({ gap: 'xs' })}>
                          <Check size={14} aria-hidden="true" /> Vaccinated
                          <button
                            type="button"
                            onClick={(): void => {
                              setFilters((prev: AdoptionListingFilters): AdoptionListingFilters => {
                                const prevFilters = prev ?? {};
                                const updated: AdoptionListingFilters = { ...prevFilters };
                                delete updated.vaccinated;
                                return updated;
                              });
                            }}
                            className={cn('cursor-pointer hover:text-destructive', focusRing)}
                            aria-label="Remove vaccinated filter"
                          >
                            <X size={14} aria-hidden="true" />
                          </button>
                        </Badge>
                      </li>
                    )}
                    {filters && typeof filters === 'object' && 'spayedNeutered' in filters && Boolean(filters.spayedNeutered) && (
                      <li>
                        <Badge variant="secondary" className={getSpacingClassesFromConfig({ gap: 'xs' })}>
                          <Check size={14} aria-hidden="true" /> Spayed/Neutered
                          <button
                            type="button"
                            onClick={(): void => {
                              setFilters((prev: AdoptionListingFilters): AdoptionListingFilters => {
                                const prevFilters = prev ?? {};
                                const updated: AdoptionListingFilters = { ...prevFilters };
                                delete updated.spayedNeutered;
                                return updated;
                              });
                            }}
                            className={cn('cursor-pointer hover:text-destructive', focusRing)}
                            aria-label="Remove spayed/neutered filter"
                          >
                            <X size={14} aria-hidden="true" />
                          </button>
                        </Badge>
                      </li>
                    )}
                    <li>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilters({})}
                        className={cn(
                          getTypographyClasses('caption'),
                          getSpacingClassesFromConfig({ paddingX: 'sm', paddingY: 'xs' })
                        )}
                        aria-label="Clear all filters"
                      >
                        Clear All
                      </Button>
                    </li>
                  </ul>
                </section>
              )}

              {/* Listings Grid Section */}
              <section aria-label="Adoption listings">
                {loading && (!Array.isArray(listings) || listings.length === 0) ? (
                  <ul className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3', getSpacingClassesFromConfig({ gap: 'xl' }))} role="list" aria-label="Loading adoption listings">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <li key={i}>
                        <div className="h-96 bg-muted animate-pulse rounded-2xl" aria-hidden="true" />
                      </li>
                    ))}
                  </ul>
                ) : (!Array.isArray(filteredListings) || filteredListings.length === 0) ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : motionDurations.smooth,
                      ease: 'easeOut',
                    }}
                    className={cn(
                      'flex flex-col items-center justify-center text-center',
                      getSpacingClassesFromConfig({ paddingY: '2xl' })
                    )}
                    role="status"
                    aria-live="polite"
                    aria-label="Empty state: No adoption listings"
                  >
                    <Heart 
                      size={64} 
                      className={cn(getColorClasses('mutedForeground', 'text'), getSpacingClassesFromConfig({ marginY: 'lg' }))} 
                      weight="thin" 
                      aria-hidden="true" 
                    />
                    <h3 className={cn(
                      getTypographyClasses('h3'),
                      getSpacingClassesFromConfig({ marginY: 'sm' })
                    )}>
                      {typeof searchQuery === 'string' && searchQuery.length > 0 ? 'No results found' : 'No pets available'}
                    </h3>
                    <p className={cn(
                      getTypographyClasses('body'),
                      getColorClasses('mutedForeground', 'text'),
                      'max-w-md'
                    )}>
                      {typeof searchQuery === 'string' && searchQuery.length > 0
                        ? 'Try adjusting your search or filters'
                        : 'Check back soon for new pets looking for their forever homes'}
                    </p>
                  </motion.div>
                ) : (
                  <motion.ul
                    className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3', getSpacingClassesFromConfig({ gap: 'xl' }))}
                    role="list"
                    aria-label="Adoption listings grid"
                    variants={getVariantsWithReducedMotion(staggerContainerVariants, prefersReducedMotion)}
                    initial="hidden"
                    animate="visible"
                  >
                    <AnimatePresence mode="popLayout">
                      {Array.isArray(filteredListings) &&
                        filteredListings.map((listing, index) => {
                          // Type guard for AdoptionListing
                          const isValidListing = (l: unknown): l is AdoptionListing => {
                            return (
                              typeof l === 'object' &&
                              l !== null &&
                              'id' in l &&
                              typeof (l as { id: unknown }).id === 'string'
                            );
                          };
                          if (!isValidListing(listing)) return null;
                          return (
                            <motion.li
                              key={listing.id}
                              variants={getVariantsWithReducedMotion(staggerItemVariants, prefersReducedMotion)}
                              layout
                              transition={{
                                delay: prefersReducedMotion ? 0 : index * 0.05,
                                duration: prefersReducedMotion ? 0 : motionDurations.smooth,
                              }}
                            >
                              <AdoptionListingCard
                                listing={listing}
                                onSelect={() => {
                                  handleSelectListing(listing);
                                }}
                              />
                            </motion.li>
                          );
                        })}
                    </AnimatePresence>
                  </motion.ul>
                )}
              </section>

              {/* Load More */}
              {hasMore && (
                <div className={cn('flex justify-center', getSpacingClassesFromConfig({ paddingY: 'lg' }))}>
                  <Button 
                    variant="outline" 
                    onClick={() => void loadListings(false)} 
                    disabled={loading}
                    aria-label={loading ? 'Loading more listings' : 'Load more adoption listings'}
                    aria-busy={loading}
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* My Listings Tab */}
            <TabsContent value="my-listings" role="tabpanel" aria-labelledby="my-listings-tab">
              {currentUser && typeof currentUser.id === 'string' && (
                <MyAdoptionListings userId={currentUser.id} />
              )}
            </TabsContent>

            {/* My Applications Tab */}
            <TabsContent value="my-applications" role="tabpanel" aria-labelledby="my-applications-tab">
              {currentUser && typeof currentUser.id === 'string' && (
                <MyAdoptionApplications userId={currentUser.id} />
              )}
            </TabsContent>
          </Tabs>
        </section>

        {/* Dialogs */}
        <CreateAdoptionListingDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={handleListingCreated}
        />

        {selectedListing && (
          <AdoptionListingDetailDialog
            listing={selectedListing}
            open={showDetailDialog}
            onOpenChange={(open) => {
              setShowDetailDialog(open);
              if (!open) setSelectedListing(null);
            }}
            onApplicationSubmitted={() => {
              void loadListings();
              toast.success('Application submitted successfully!');
            }}
          />
        )}

        <AdoptionFiltersSheet
          open={showFilters}
          onOpenChange={setShowFilters}
          filters={filters}
          onFiltersChange={(newFilters: AdoptionListingFilters) => {
            setFilters(newFilters);
          }}
        />
      </main>
    </PageTransitionWrapper>
  );
}

export default function AdoptionMarketplaceView() {
  return (
    <ScreenErrorBoundary screenName="Adoption Marketplace" enableNavigation={true} enableReporting={false}>
      <AdoptionMarketplaceViewContent />
    </ScreenErrorBoundary>
  );
}

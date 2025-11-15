'use client';

import { useState } from 'react';
import { AdoptionFiltersSheet } from '@/components/adoption/AdoptionFiltersSheet';
import { AdoptionListingDetailDialog } from '@/components/adoption/AdoptionListingDetailDialog';
import { CreateAdoptionListingDialog } from '@/components/adoption/CreateAdoptionListingDialog';
import { MyAdoptionApplications } from '@/components/adoption/MyAdoptionApplications';
import { MyAdoptionListings } from '@/components/adoption/MyAdoptionListings';
import { AdoptionListingItem } from '@/components/adoption/AdoptionListingItem';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import type { AdoptionListing } from '@/lib/adoption-marketplace-types';
import { haptics } from '@/lib/haptics';
import { Check, Funnel, Heart, MagnifyingGlass, Plus, X } from '@phosphor-icons/react';
import { MotionView } from '@petspark/motion';
import { AnimatePresence } from '@/effects/reanimated/animate-presence';
import { useAdoptionMarketplace } from '@/hooks/adoption/use-adoption-marketplace';
import { toast } from 'sonner';

type ViewTab = 'browse' | 'my-listings' | 'my-applications';

export default function AdoptionMarketplaceView() {
  const [activeTab, setActiveTab] = useState<ViewTab>('browse');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedListing, setSelectedListing] = useState<AdoptionListing | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const {
    listings,
    loading,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    currentUser,
    hasMore,
    loadListings,
    filteredListings,
    activeFilterCount,
  } = useAdoptionMarketplace();

  const handleCreateListing = () => {
    haptics.impact('medium');
    setShowCreateDialog(true);
  };

  const handleListingCreated = () => {
    setShowCreateDialog(false);
    toast.success('Adoption listing created! It will be reviewed by our team.');
    void loadListings();
  };

  const handleSelectListing = (listing: AdoptionListing) => {
    haptics.impact('light');
    setSelectedListing(listing);
    setShowDetailDialog(true);
  };

  const handleToggleFilters = () => {
    haptics.impact('light');
    setShowFilters((prev) => !prev);
  };

  return (
    <PageTransitionWrapper key="adoption-marketplace-view" direction="up">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="flex items-center gap-3 text-xl font-bold sm:text-2xl">
              <Heart size={32} weight="fill" className="text-primary" />
              Adoption Marketplace
            </h2>
            <p className="mt-1 text-muted-foreground">
              Find your perfect companion and give them a loving forever home
            </p>
          </div>

          <Button onClick={handleCreateListing} className="gap-2" type="button">
            <Plus size={20} weight="bold" />
            List Pet
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ViewTab)}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="browse" className="flex-1 sm:flex-none">
              Browse
            </TabsTrigger>
            <TabsTrigger value="my-listings" className="flex-1 sm:flex-none">
              My Listings
            </TabsTrigger>
            <TabsTrigger value="my-applications" className="flex-1 sm:flex-none">
              Applications
            </TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="mt-6 space-y-4">
            {/* Search + Filters */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <MagnifyingGlass
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={20}
                />
                <Input
                  placeholder="Search by name, breed, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Button
                variant="outline"
                onClick={handleToggleFilters}
                className="relative gap-2"
                type="button"
              >
                <Funnel size={20} />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Active Filters */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.breed &&
                  filters.breed.length > 0 &&
                  filters.breed.map((breed) => (
                    <Badge key={breed} variant="secondary" className="gap-1">
                      {breed}
                      <X
                        size={14}
                        className="cursor-pointer hover:text-destructive"
                        onClick={() => {
                          setFilters((prev) => {
                            const next = { ...prev };
                            const newBreed = prev.breed?.filter((b: string) => b !== breed);
                            if (!newBreed || newBreed.length === 0) {
                              delete next.breed;
                            } else {
                              next.breed = newBreed;
                            }
                            return next;
                          });
                        }}
                      />
                    </Badge>
                  ))}

                {filters.vaccinated && (
                  <Badge variant="secondary" className="gap-1">
                    <Check size={14} /> Vaccinated
                    <X
                      size={14}
                      className="cursor-pointer hover:text-destructive"
                      onClick={() =>
                        setFilters((prev) => {
                          const next = { ...prev };
                          delete next.vaccinated;
                          return next;
                        })
                      }
                    />
                  </Badge>
                )}

                {filters.spayedNeutered && (
                  <Badge variant="secondary" className="gap-1">
                    <Check size={14} /> Spayed/Neutered
                    <X
                      size={14}
                      className="cursor-pointer hover:text-destructive"
                      onClick={() =>
                        setFilters((prev) => {
                          const next = { ...prev };
                          delete next.spayedNeutered;
                          return next;
                        })
                      }
                    />
                  </Badge>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setFilters({})}
                  className="h-6 px-2 text-xs"
                >
                  Clear All
                </Button>
              </div>
            )}

            {/* Listings */}
            {loading && listings.length === 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <div key={i} className="h-96 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : filteredListings.length === 0 ? (
              <MotionView
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <Heart size={64} className="mb-4 text-muted-foreground" weight="thin" />
                <h3 className="mb-2 text-xl font-semibold">
                  {searchQuery ? 'No results found' : 'No pets available'}
                </h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  {searchQuery
                    ? 'Try adjusting your search or filters'
                    : 'Check back soon for new pets looking for their forever homes.'}
                </p>
              </MotionView>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {filteredListings.map((listing, index) => (
                    <AdoptionListingItem
                      key={listing.id}
                      listing={listing}
                      index={index}
                      onSelect={() => handleSelectListing(listing)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => loadListings(false)}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* My Listings */}
          <TabsContent value="my-listings">
            {currentUser && <MyAdoptionListings userId={currentUser.id} />}
          </TabsContent>

          {/* My Applications */}
          <TabsContent value="my-applications">
            {currentUser && <MyAdoptionApplications userId={currentUser.id} />}
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <CreateAdoptionListingDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={handleListingCreated}
        />

        <AdoptionListingDetailDialog
          listing={selectedListing}
          open={showDetailDialog}
          onOpenChange={(open) => {
            setShowDetailDialog(open);
            if (!open) setSelectedListing(null);
          }}
          onApplicationSubmitted={() => {
            // fix: no-floating-promises → explicitly mark we ignore the Promise
            void loadListings();
            toast.success('Application submitted successfully!');
          }}
        />

        <AdoptionFiltersSheet
          open={showFilters}
          onOpenChange={setShowFilters}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>
    </PageTransitionWrapper>
  );
}

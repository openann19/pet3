import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import { MagnifyingGlass, Plus, MapPin } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { motionDurations, staggerContainerVariants, staggerItemVariants, getVariantsWithReducedMotion } from '@/effects/framer-motion/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { isTruthy } from '@petspark/shared';
import type { LostAlert } from '@/lib/lost-found-types';
import { LostAlertCard } from '@/components/lost-found/LostAlertCard';
import { CreateLostAlertDialog } from '@/components/lost-found/CreateLostAlertDialog';
import { ReportSightingDialog } from '@/components/lost-found/ReportSightingDialog';
import { lostFoundAPI } from '@/api/lost-found-api';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { createLogger } from '@/lib/logger';
import type { LostAlertFilters } from '@/lib/lost-found-types';
import { ScreenErrorBoundary } from '@/components/error/ScreenErrorBoundary';
import { getTypographyClasses, getSpacingClassesFromConfig, getColorClasses } from '@/lib/design-token-utils';
import { cn } from '@/lib/utils';

const logger = createLogger('LostFoundView');

type ViewMode = 'browse' | 'mine';
type FilterTab = 'all' | 'active' | 'found' | 'favorites';


function LostFoundViewContent() {
  const { t } = useApp();
  const prefersReducedMotion = useReducedMotion();
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [alerts, setAlerts] = useState<LostAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useStorage<string[]>('lost-found-favorites', []);
  const [selectedAlert, setSelectedAlert] = useState<LostAlert | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSightingDialog, setShowSightingDialog] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  const getUserLocation = useCallback((): void => {
    try {
      if (typeof navigator !== 'undefined' && isTruthy(navigator.geolocation)) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            });
          },
          () => {
            // User denied or error getting location
          }
        );
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get user location', err, { action: 'getUserLocation' });
    }
  }, []);

  const loadAlerts = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const filters: LostAlertFilters & { cursor?: string; limit?: number } = {
        limit: 50,
        ...(cursor && { cursor }),
      };

      if (viewMode === 'mine') {
        if (typeof window !== 'undefined' && window.spark) {
          const user = await window.spark.user();
          if (user?.id) {
            const userAlerts = await lostFoundAPI.getUserAlerts(user.id);
            setAlerts(userAlerts);
          }
        }
        setLoading(false);
        return;
      }

      // For browse mode, optionally filter by location
      if (userLocation && activeTab === 'all') {
        filters.location = {
          lat: userLocation.lat,
          lon: userLocation.lon,
          radiusKm: 50, // 50km radius
        };
      }

      if (activeTab === 'active') {
        filters.status = ['active'];
      } else if (activeTab === 'found') {
        filters.status = ['found'];
      }

      const result = await lostFoundAPI.queryAlerts(filters);
      setAlerts(result.alerts);
      setCursor(result.nextCursor);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load alerts', err, { action: 'loadAlerts' });
      toast.error('Failed to load lost & found alerts');
    } finally {
      setLoading(false);
    }
  }, [viewMode, cursor, userLocation, activeTab]);

  useEffect(() => {
    void loadAlerts();
    getUserLocation();
  }, [loadAlerts, getUserLocation]);

  const handleToggleFavorite = useCallback((alertId: string): void => {
    void setFavorites((currentFavorites: string[] | undefined): string[] => {
      const current = Array.isArray(currentFavorites) ? currentFavorites : [];
      if (current.includes(alertId)) {
        return current.filter((id) => id !== alertId);
      }
      return [...current, alertId];
    });
  }, [setFavorites]);

  const handleSelectAlert = useCallback((alert: LostAlert): void => {
    setSelectedAlert(alert);
    // Could open a detail dialog here
  }, []);

  const handleReportSighting = useCallback((alert: LostAlert): void => {
    setSelectedAlert(alert);
    setShowSightingDialog(true);
  }, []);

  const filteredAlerts = useCallback((): LostAlert[] => {
    if (!Array.isArray(alerts)) {
      return [];
    }

    let list: LostAlert[] = alerts;

    if (activeTab === 'favorites') {
      list = list.filter((a: LostAlert): boolean => {
        const alertId = typeof a.id === 'string' ? a.id : String(a.id);
        return Array.isArray(favorites) && favorites.includes(alertId);
      });
    }

    if (typeof searchQuery === 'string' && searchQuery.length > 0) {
      const queryLower = searchQuery.toLowerCase();
      list = list.filter(
        (a: LostAlert): boolean => {
          const petName = typeof a.petSummary?.name === 'string' ? a.petSummary.name.toLowerCase() : '';
          const petBreed = typeof a.petSummary?.breed === 'string' ? a.petSummary.breed.toLowerCase() : '';
          const petSpecies = typeof a.petSummary?.species === 'string' ? a.petSummary.species.toLowerCase() : '';
          const description = typeof a.lastSeen?.description === 'string' ? a.lastSeen.description.toLowerCase() : '';
          return petName.includes(queryLower) || petBreed.includes(queryLower) || petSpecies.includes(queryLower) || description.includes(queryLower);
        }
      );
    }

    return list.sort((a: LostAlert, b: LostAlert): number => {
      const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0;
      const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [alerts, activeTab, favorites, searchQuery]);

  const activeCount = Array.isArray(alerts) ? alerts.filter((a: LostAlert) => a.status === 'active').length : 0;
  const foundCount = Array.isArray(alerts) ? alerts.filter((a: LostAlert) => a.status === 'found').length : 0;
  const filteredAlertsList = filteredAlerts();

  if (loading && (!Array.isArray(alerts) || alerts.length === 0)) {
    return (
      <PageTransitionWrapper key="lost-found-view" direction="up">
        <main aria-label="Lost and found pets">
          <div className={cn('flex items-center justify-center min-h-[60vh]')} role="status" aria-live="polite" aria-label="Loading lost and found alerts">
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
    <PageTransitionWrapper key="lost-found-view" direction="up">
      <main 
        aria-label="Lost and found pets" 
        className={cn('max-w-7xl mx-auto', getSpacingClassesFromConfig({ spaceY: 'xl', paddingX: 'lg', paddingY: '2xl' }))}
      >
        {/* Header Section */}
        <header className={cn('flex items-center justify-between', getSpacingClassesFromConfig({ gap: 'md', marginY: 'xl' }))}>
          <div>
            <h1 className={cn(getTypographyClasses('h1'), 'flex items-center', getSpacingClassesFromConfig({ gap: 'md' }))}>
              <MapPin size={32} weight="fill" className={getColorClasses('primary', 'text')} aria-hidden="true" />
              {t.lostFound?.title ?? 'Lost & Found'}
            </h1>
            <p className={cn(getTypographyClasses('bodySmall'), getColorClasses('mutedForeground', 'text'), getSpacingClassesFromConfig({ marginY: 'xs' }))}>
              {t.lostFound?.subtitle ?? 'Report lost pets and help reunite families'}
            </p>
          </div>

          <div className={cn('flex items-center', getSpacingClassesFromConfig({ gap: 'sm' }))}>
            <Button
              onClick={() => setViewMode(viewMode === 'browse' ? 'mine' : 'browse')}
              variant="outline"
              aria-label={viewMode === 'browse' ? 'Switch to my alerts view' : 'Switch to browse all alerts view'}
              aria-pressed={viewMode === 'mine'}
            >
              {viewMode === 'browse' ? 'My Alerts' : 'Browse All'}
            </Button>
            <Button 
              onClick={() => setShowCreateDialog(true)} 
              className={getSpacingClassesFromConfig({ gap: 'sm' })}
              aria-label={t.lostFound?.reportLost ?? 'Report Lost Pet'}
            >
              <Plus size={20} weight="fill" aria-hidden="true" />
              {t.lostFound?.reportLost ?? 'Report Lost Pet'}
            </Button>
          </div>
        </header>

        {viewMode === 'browse' && (
          <section aria-label="Browse lost and found alerts">
            {/* Search and Filter Section */}
            <section aria-label="Search and filter alerts">
              <div className={cn('flex flex-col sm:flex-row items-start sm:items-center', getSpacingClassesFromConfig({ gap: 'lg', marginY: 'xl' }))}>
                <div className={cn('flex-1 relative w-full')}>
                  <label htmlFor="lost-found-search" className="sr-only">
                    Search lost and found alerts by pet name, breed, or location
                  </label>
                  <MagnifyingGlass
                    className={cn('absolute left-3 top-1/2 -translate-y-1/2', getColorClasses('mutedForeground', 'text'))}
                    size={20}
                    aria-hidden="true"
                  />
                  <Input
                    id="lost-found-search"
                    placeholder={
                      t.lostFound?.searchPlaceholder ?? 'Search by pet name, breed, location...'
                    }
                    value={typeof searchQuery === 'string' ? searchQuery : ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    aria-label="Search lost and found alerts"
                    className="pl-10"
                  />
                </div>

                <Tabs value={activeTab} onValueChange={(v: string) => {
                  if (v === 'all' || v === 'active' || v === 'found' || v === 'favorites') {
                    setActiveTab(v);
                  }
                }}>
                  <TabsList role="tablist" aria-label="Filter lost and found alerts">
                    <TabsTrigger value="all" aria-label="All alerts tab">
                      All {Array.isArray(alerts) && alerts.length > 0 && `(${alerts.length})`}
                    </TabsTrigger>
                    <TabsTrigger value="active" aria-label="Active alerts tab">
                      Active {activeCount > 0 && `(${activeCount})`}
                    </TabsTrigger>
                    <TabsTrigger value="found" aria-label="Found alerts tab">
                      Found {foundCount > 0 && `(${foundCount})`}
                    </TabsTrigger>
                    <TabsTrigger value="favorites" aria-label="Favorite alerts tab">
                      Favorites{' '}
                      {Array.isArray(favorites) && favorites.length > 0 && `(${favorites.length})`}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </section>

            {/* Alerts List Section */}
            <section aria-label="Lost and found alerts list">
              <ScrollArea className="h-[calc(100vh-320px)]">
                <AnimatePresence mode="wait">
                  {!Array.isArray(filteredAlertsList) || filteredAlertsList.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{
                        duration: prefersReducedMotion ? 0 : motionDurations.normal,
                        ease: 'easeOut',
                      }}
                      className={cn('flex flex-col items-center justify-center', getSpacingClassesFromConfig({ paddingY: '4xl' }))}
                      role="status"
                      aria-live="polite"
                      aria-label="Empty state: No alerts found"
                    >
                      <MapPin 
                        size={64} 
                        className={cn(getColorClasses('mutedForeground', 'text'), getSpacingClassesFromConfig({ marginY: 'lg' }))} 
                        weight="thin"
                        aria-hidden="true"
                      />
                      <h2 className={cn(getTypographyClasses('h2'), getSpacingClassesFromConfig({ marginY: 'sm' }))}>
                        {activeTab === 'favorites'
                          ? 'No Favorites Yet'
                          : typeof searchQuery === 'string' && searchQuery.length > 0
                            ? 'No Results Found'
                            : 'No Active Alerts'}
                      </h2>
                      <p className={cn(getTypographyClasses('body'), getColorClasses('mutedForeground', 'text'), 'text-center max-w-md')}>
                        {activeTab === 'favorites'
                          ? 'Start adding alerts to your favorites to see them here.'
                          : typeof searchQuery === 'string' && searchQuery.length > 0
                            ? 'Try adjusting your search terms.'
                            : 'Check back soon for lost pet alerts in your area.'}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.ul
                      key="grid"
                      className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3', getSpacingClassesFromConfig({ gap: 'xl', paddingY: 'xl' }))}
                      role="list"
                      aria-label="Lost and found alerts grid"
                      variants={getVariantsWithReducedMotion(staggerContainerVariants, prefersReducedMotion)}
                      initial="hidden"
                      animate="visible"
                    >
                      <AnimatePresence mode="popLayout">
                        {filteredAlertsList.map((alert, index) => {
                          const alertId = typeof alert.id === 'string' ? alert.id : String(alert.id);
                          return (
                            <motion.li
                              key={alertId}
                              variants={getVariantsWithReducedMotion(staggerItemVariants, prefersReducedMotion)}
                              layout
                              transition={{
                                delay: prefersReducedMotion ? 0 : index * 0.05,
                                duration: prefersReducedMotion ? 0 : motionDurations.smooth,
                              }}
                            >
                              <LostAlertCard
                                alert={alert}
                                onSelect={handleSelectAlert}
                                onReportSighting={handleReportSighting}
                                isFavorited={Array.isArray(favorites) && favorites.includes(alertId)}
                                onToggleFavorite={handleToggleFavorite}
                              />
                            </motion.li>
                          );
                        })}
                      </AnimatePresence>
                    </motion.ul>
                  )}
                </AnimatePresence>
              </ScrollArea>
            </section>
          </section>
        )}

        {viewMode === 'mine' && (
          <section aria-label="My lost and found alerts">
            <ScrollArea className="h-[calc(100vh-320px)]">
              {!Array.isArray(alerts) || alerts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : motionDurations.normal,
                    ease: 'easeOut',
                  }}
                  className={cn('flex flex-col items-center justify-center', getSpacingClassesFromConfig({ paddingY: '4xl' }))}
                  role="status"
                  aria-live="polite"
                  aria-label="Empty state: No alerts"
                >
                  <MapPin 
                    size={64} 
                    className={cn(getColorClasses('mutedForeground', 'text'), getSpacingClassesFromConfig({ marginY: 'lg' }))} 
                    weight="thin"
                    aria-hidden="true"
                  />
                  <h2 className={cn(getTypographyClasses('h2'), getSpacingClassesFromConfig({ marginY: 'sm' }))}>
                    No Alerts Yet
                  </h2>
                  <p className={cn(getTypographyClasses('body'), getColorClasses('mutedForeground', 'text'), 'text-center max-w-md')}>
                    Create your first lost pet alert to get started.
                  </p>
                </motion.div>
              ) : (
                <motion.ul
                  className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3', getSpacingClassesFromConfig({ gap: 'xl', paddingY: 'xl' }))}
                  role="list"
                  aria-label="My lost and found alerts grid"
                  variants={getVariantsWithReducedMotion(staggerContainerVariants, prefersReducedMotion)}
                  initial="hidden"
                  animate="visible"
                >
                  {alerts.map((alert, index) => {
                    const alertId = typeof alert.id === 'string' ? alert.id : String(alert.id);
                    return (
                      <motion.li
                        key={alertId}
                        variants={getVariantsWithReducedMotion(staggerItemVariants, prefersReducedMotion)}
                        transition={{
                          delay: prefersReducedMotion ? 0 : index * 0.05,
                          duration: prefersReducedMotion ? 0 : motionDurations.smooth,
                        }}
                      >
                        <LostAlertCard
                          alert={alert}
                          onSelect={handleSelectAlert}
                          onReportSighting={handleReportSighting}
                          isFavorited={Array.isArray(favorites) && favorites.includes(alertId)}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      </motion.li>
                    );
                  })}
                </motion.ul>
              )}
            </ScrollArea>
          </section>
        )}

        <CreateLostAlertDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            void loadAlerts();
            toast.success('Lost pet alert created successfully!');
          }}
        />

        {selectedAlert && (
          <ReportSightingDialog
            open={showSightingDialog}
            alert={selectedAlert}
            onClose={() => {
              setShowSightingDialog(false);
              setSelectedAlert(null);
            }}
            onSuccess={() => {
              void loadAlerts();
            }}
          />
        )}
      </main>
    </PageTransitionWrapper>
  );
}

export default function LostFoundView() {
  return (
    <ScreenErrorBoundary screenName="Lost & Found" enableNavigation={true} enableReporting={false}>
      <LostFoundViewContent />
    </ScreenErrorBoundary>
  );
}

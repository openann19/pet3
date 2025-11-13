import { useState, useEffect, useRef, useMemo } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  MagnifyingGlass,
  NavigationArrow,
  Heart,
  Crosshair,
  List,
  X,
  Warning,
  CheckCircle,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { haptics } from '@/lib/haptics';
import { DEFAULT_LOCATION } from '@/lib/maps/config';
import {
  calculateDistance,
  formatDistance,
  snapToGrid,
  getCurrentLocation,
} from '@/lib/maps/utils';
import type { Location, Place, MapMarker } from '@/lib/maps/types';
import { useStorage } from '@/hooks/use-storage';
import { toast } from 'sonner';
import { useMapConfig } from '@/lib/maps/useMapConfig';
import { logger } from '@/lib/logger';
import { isTruthy } from '@petspark/shared';
import { ScreenErrorBoundary } from '@/components/error/ScreenErrorBoundary';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { motionDurations, staggerContainerVariants, staggerItemVariants, getVariantsWithReducedMotion } from '@/effects/framer-motion/variants';
import { getTypographyClasses, getSpacingClassesFromConfig, getColorClasses, focusRing } from '@/lib/design-token-utils';
import { cn } from '@/lib/utils';

type MapViewMode = 'discover' | 'places' | 'playdate' | 'lost-pet' | 'matches';


function MapViewContent() {
  const { t } = useApp();
  const { mapSettings, PLACE_CATEGORIES } = useMapConfig();
  const prefersReducedMotion = useReducedMotion();

  const [_mode, _setMode] = useState<MapViewMode>('discover');
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [coarseLocation, setCoarseLocation] = useState<Location | null>(null);
  const [preciseSharingEnabled, setPreciseSharingEnabled] = useStorage<boolean>(
    'map-precise-sharing',
    false
  );
  const [preciseSharingUntil, setPreciseSharingUntil] = useStorage<number | null>(
    'map-precise-until',
    null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [radiusKm, _setRadiusKm] = useState(mapSettings.DEFAULT_RADIUS_KM);
  const [showList, setShowList] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>(
    'prompt'
  );
  const [isLocating, setIsLocating] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [savedPlaces, setSavedPlaces] = useStorage<string[]>('saved-places', []);

  const mapRef = useRef<HTMLDivElement>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    void requestLocation();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (preciseSharingEnabled && preciseSharingUntil) {
      const now = Date.now();
      if (now > preciseSharingUntil) {
        void setPreciseSharingEnabled(false);
        void setPreciseSharingUntil(null);
        toast.info(t.map?.precisionExpired ?? 'Precise location sharing ended');
      }
    }
  }, [preciseSharingEnabled, preciseSharingUntil, setPreciseSharingEnabled, setPreciseSharingUntil]);

  useEffect(() => {
    if (isTruthy(userLocation)) {
      generateDemoPlaces(userLocation);
    }
  }, [userLocation, radiusKm]);

  const requestLocation = async () => {
    setIsLocating(true);
    try {
      const location = await getCurrentLocation();
      setUserLocation(location);
      const coarse = snapToGrid(location, mapSettings.PRIVACY_GRID_METERS);
      setCoarseLocation(coarse);
      setLocationPermission('granted');
      toast.success(t.map?.locationEnabled || 'Location enabled');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Location error', err, { action: 'getUserLocation' });
      setLocationPermission('denied');
      setUserLocation(DEFAULT_LOCATION);
      setCoarseLocation(DEFAULT_LOCATION);
      toast.error(t.map?.locationDenied || 'Location access denied. Using default location.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleEnablePreciseSharing = () => {
    haptics.trigger('medium');
    const until = Date.now() + 60 * 60 * 1000;
    void setPreciseSharingEnabled(true);
    void setPreciseSharingUntil(until);
    toast.success(t.map?.precisionEnabled ?? 'Precise location enabled for 60 minutes');
  };

  const handleDisablePreciseSharing = () => {
    haptics.trigger('light');
    void setPreciseSharingEnabled(false);
    void setPreciseSharingUntil(null);
    toast.info(t.map?.precisionDisabled ?? 'Precise location disabled');
  };

  const generateDemoPlaces = (center: Location) => {
    const places: Place[] = [];
    const categories = PLACE_CATEGORIES;

    for (let i = 0; i < 20; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      if (!category) continue;
      const angle = (Math.PI * 2 * i) / 20;
      const dist = Math.random() * radiusKm;
      const deltaLat = (dist / 111) * Math.cos(angle);
      const deltaLng = (dist / (111 * Math.cos((center.lat * Math.PI) / 180))) * Math.sin(angle);

      const location: Location = {
        lat: center.lat + deltaLat,
        lng: center.lng + deltaLng,
      };

      places.push({
        id: `place-${String(i)}`,
        name: `${category?.name ?? ''} ${String(i + 1)}`,
        description: `Great ${category?.name?.toLowerCase() ?? ''} in your area`,
        category: category?.id ?? '',
        location,
        address: `${String(Math.floor(Math.random() * 999))} Main St, City`,
        phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        hours: '9:00 AM - 6:00 PM',
        photos: [`https://images.unsplash.com/photo-${String(1560807700000 + i * 1000000)}?w=400&q=80`],
        verified: Math.random() > 0.3,
        petFriendly: true,
        rating: 3.5 + Math.random() * 1.5,
        reviewCount: Math.floor(Math.random() * 200),
        amenities: ['Water Bowl', 'Outdoor Space', 'Pet-Friendly Staff'],
        distance: calculateDistance(center, location),
        isOpen: Math.random() > 0.2,
        moderationStatus: 'approved',
      });
    }

    setNearbyPlaces(places.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0)));
  };

  const handleCategoryFilter = (categoryId: string) => {
    haptics.trigger('selection');
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const handleSavePlace = (placeId: string) => {
    haptics.trigger('medium');
    void setSavedPlaces((current) => {
      const currentPlaces = current ?? [];
      if (currentPlaces.includes(placeId)) {
        toast.info(t.map?.placeRemoved ?? 'Place removed from saved');
        return currentPlaces.filter((id) => id !== placeId);
      } else {
        toast.success(t.map?.placeSaved ?? 'Place saved');
        return [...currentPlaces, placeId];
      }
    });
  };

  const filteredPlaces = useMemo((): Place[] => {
    if (!Array.isArray(nearbyPlaces)) {
      return [];
    }

    let filtered: Place[] = nearbyPlaces;

    if (typeof selectedCategory === 'string' && selectedCategory.length > 0) {
      filtered = filtered.filter((place: Place): boolean => {
        const placeCategory = typeof place.category === 'string' ? place.category : '';
        return placeCategory === selectedCategory;
      });
    }

    if (typeof searchQuery === 'string' && searchQuery.length > 0) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (place: Place): boolean => {
          const placeName = typeof place.name === 'string' ? place.name.toLowerCase() : '';
          const placeDescription = typeof place.description === 'string' ? place.description.toLowerCase() : '';
          const placeCategory = typeof place.category === 'string' ? place.category.toLowerCase() : '';
          return placeName.includes(query) || placeDescription.includes(query) || placeCategory.includes(query);
        }
      );
    }

    return filtered;
  }, [nearbyPlaces, selectedCategory, searchQuery]);

  const displayLocation = preciseSharingEnabled && userLocation ? userLocation : coarseLocation;

  return (
    <PageTransitionWrapper key="map-view" direction="up">
      <main aria-label="Map view" className={cn('relative h-[calc(100vh-12rem)] max-h-200 bg-background rounded-2xl overflow-hidden border border-border shadow-xl', getSpacingClassesFromConfig({ padding: 'lg' }))}>
        {/* Map Container Section */}
        <section aria-label="Interactive map" className="relative h-full">
          <div
            ref={mapRef}
            className="absolute inset-0 bg-linear-to-br from-muted/50 via-background to-muted/30"
            aria-label="Map visualization area"
          >
            {/* Placeholder Map Visual */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={cn('text-center', getSpacingClassesFromConfig({ spaceY: 'lg', padding: '2xl' }))}>
                <MapPin size={64} className={cn('mx-auto', getColorClasses('primary', 'text'), 'opacity-30')} weight="duotone" aria-hidden="true" />
                <div className={getSpacingClassesFromConfig({ spaceY: 'sm' })}>
                  <h1 className={cn(getTypographyClasses('h3'), getColorClasses('foreground', 'text'), 'opacity-70')}>
                    {t.map?.interactiveMap ?? 'Interactive Map'}
                  </h1>
                  <p className={cn(getTypographyClasses('bodySmall'), getColorClasses('mutedForeground', 'text'), 'max-w-md')}>
                    {t.map?.mapDescription ??
                      'Discover pet-friendly places, plan playdates, and find matches near you with our privacy-first location features.'}
                  </p>
                  {displayLocation && typeof displayLocation.lat === 'number' && typeof displayLocation.lng === 'number' && (
                    <Badge variant="secondary" className="mt-2" aria-label={`Location: ${preciseSharingEnabled ? 'Precise' : 'Approximate'} coordinates`}>
                      {preciseSharingEnabled ? '📍 Precise' : '📌 Approximate'} •{' '}
                      {displayLocation.lat.toFixed(4)}, {displayLocation.lng.toFixed(4)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Markers Visualization */}
            {displayLocation &&
              Array.isArray(filteredPlaces) &&
              filteredPlaces.slice(0, 15).map((place, idx) => {
                const placeId = typeof place?.id === 'string' ? place.id : String(place?.id ?? idx);
                if (!place?.id) return null;
                const category = Array.isArray(PLACE_CATEGORIES)
                  ? PLACE_CATEGORIES.find((c) => c && typeof c === 'object' && c !== null && c.id === place.category)
                  : undefined;
                const placeName = typeof place.name === 'string' ? place.name : 'Place';
                return (
                  <motion.div
                    key={placeId}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : {
                            delay: idx * 0.05,
                            duration: 0.3,
                            type: 'spring',
                            stiffness: 300,
                            damping: 25,
                          }
                    }
                    className="absolute"
                    style={{
                      left: `${20 + (idx % 5) * 16}%`,
                      top: `${20 + Math.floor(idx / 5) * 25}%`,
                    }}
                  >
                    <motion.button
                      onClick={() => {
                        haptics.trigger('light');
                        setSelectedMarker({
                          id: placeId,
                          type: 'place',
                          location: typeof place.location === 'object' && place.location !== null ? place.location : { lat: 0, lng: 0 },
                          data: place,
                        });
                        setShowList(false);
                      }}
                      className={cn('relative group cursor-pointer', focusRing)}
                      whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                      transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                      aria-label={`View details for ${placeName}`}
                    >
                      <div
                        className="w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-xl backdrop-blur-sm border-2 border-white"
                        style={{ backgroundColor: typeof category?.color === 'string' ? category.color : '#ec4899' }}
                        aria-hidden="true"
                      >
                        {typeof category?.icon === 'string' ? category.icon : '📍'}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" aria-hidden="true"></div>
                    </motion.button>
                  </motion.div>
                );
              })}
          </div>
        </section>

        {/* Top Controls Section */}
        <section aria-label="Map controls" className="absolute top-4 left-4 right-4 z-10 space-y-3">
          {/* Search Bar */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            className="backdrop-blur-xl bg-background/80 rounded-2xl shadow-2xl border border-border/50 p-3"
          >
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <label htmlFor="map-search" className="sr-only">
                  Search places on map
                </label>
                <MagnifyingGlass
                  size={20}
                  className={cn('absolute left-3 top-1/2 transform -translate-y-1/2', getColorClasses('mutedForeground', 'text'))}
                  aria-hidden="true"
                />
                <Input
                  id="map-search"
                  value={typeof searchQuery === 'string' ? searchQuery : ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  placeholder={t.map?.searchPlaceholder ?? 'Search places...'}
                  aria-label="Search places on map"
                  className="pl-10 h-11 bg-background/50 border-border"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  haptics.trigger('selection');
                  setShowList(!showList);
                }}
                className="h-11 w-11 rounded-xl hover:bg-primary/10"
                aria-label={showList ? 'Hide places list' : 'Show places list'}
                aria-expanded={showList}
                aria-controls="places-list-sidebar"
              >
                {showList ? <X size={20} aria-hidden="true" /> : <List size={20} aria-hidden="true" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  void requestLocation();
                }}
                disabled={isLocating}
                className="h-11 w-11 rounded-xl hover:bg-primary/10"
                aria-label={isLocating ? 'Locating your position' : 'Use current location'}
                aria-busy={isLocating}
              >
                <Crosshair size={20} className={isLocating ? 'animate-spin' : ''} aria-hidden="true" />
              </Button>
            </div>

            {/* Category Pills */}
            <ul className="flex gap-2 overflow-x-auto mt-3 pb-1 scrollbar-hide" role="list">
              {Array.isArray(PLACE_CATEGORIES) &&
                PLACE_CATEGORIES.map((category) => {
                  if (!category?.id) return null;
                  return (
                    <li key={category.id}>
                      <button
                        onClick={() => handleCategoryFilter(category.id)}
                        className={cn(
                          'flex items-center whitespace-nowrap transition-all motion-reduce:transition-none',
                          getSpacingClassesFromConfig({ gap: 'sm', paddingX: 'lg', paddingY: 'sm' }),
                          getTypographyClasses('bodySmall'),
                          focusRing,
                          selectedCategory === category.id
                            ? cn(getColorClasses('primary', 'bg'), getColorClasses('primaryForeground', 'text'), 'shadow-md scale-105')
                            : cn('bg-background/50 opacity-70 hover:bg-muted', getColorClasses('foreground', 'text'))
                        )}
                        aria-label={`Filter by ${category.name}`}
                        aria-pressed={selectedCategory === category.id}
                      >
                        <span aria-hidden="true">{category.icon}</span>
                        <span>{category.name}</span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </motion.div>

          {/* Privacy Banner */}
          {locationPermission === 'granted' && !preciseSharingEnabled && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, delay: prefersReducedMotion ? 0 : 0.1 }}
              className="backdrop-blur-xl bg-primary/10 rounded-xl border border-primary/20 p-3"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start gap-3">
                <Warning size={20} className="text-primary shrink-0 mt-0.5" weight="fill" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className={cn(getTypographyClasses('bodySmall'), 'font-medium', getColorClasses('foreground', 'text'))}>
                    {t.map?.approximateLocation ?? 'Using approximate location'}
                  </p>
                  <p className={cn(getTypographyClasses('caption'), getColorClasses('mutedForeground', 'text'), getSpacingClassesFromConfig({ marginY: 'xs' }))}>
                    {t.map?.enablePrecisePrompt ??
                      'Enable precise location for live meet-ups and exact navigation'}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleEnablePreciseSharing}
                  className="shrink-0 h-8 text-xs"
                  aria-label={t.map?.enable ?? 'Enable precise location'}
                >
                  {t.map?.enable ?? 'Enable'}
                </Button>
              </div>
            </motion.div>
          )}

          {preciseSharingEnabled && typeof preciseSharingUntil === 'number' && preciseSharingUntil > 0 && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
              className="backdrop-blur-xl bg-green-500/10 rounded-xl border border-green-500/20 p-3"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-3">
                <CheckCircle size={20} className="text-green-500 shrink-0" weight="fill" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className={cn(getTypographyClasses('bodySmall'), 'font-medium', getColorClasses('foreground', 'text'))}>
                    {t.map?.preciseEnabled ?? 'Precise location active'}
                  </p>
                  <p className={cn(getTypographyClasses('caption'), getColorClasses('mutedForeground', 'text'))}>
                    {t.map?.preciseExpires ??
                      `Expires in ${Math.ceil((preciseSharingUntil - Date.now()) / 60000)} minutes`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDisablePreciseSharing}
                  className="shrink-0 h-8 text-xs"
                  aria-label={t.map?.disable ?? 'Disable precise location'}
                >
                  {t.map?.disable ?? 'Disable'}
                </Button>
              </div>
            </motion.div>
          )}
        </section>

        {/* Places List Sidebar */}
        <AnimatePresence>
          {showList && (
            <motion.aside
              id="places-list-sidebar"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { type: 'spring', damping: 30, stiffness: 300 }
              }
              className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl overflow-y-auto"
              role="complementary"
              aria-label="Places list"
            >
              <div className={cn('p-4', getSpacingClassesFromConfig({ spaceY: 'md' }))}>
                <div className={cn('flex items-center justify-between', getSpacingClassesFromConfig({ marginY: 'lg' }))}>
                  <h2 className={cn(getTypographyClasses('h3'), 'font-semibold')}>
                    {t.map?.nearbyPlaces ?? 'Nearby Places'} ({Array.isArray(filteredPlaces) ? filteredPlaces.length : 0})
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowList(false)}
                    aria-label="Close places list"
                  >
                    <X size={20} aria-hidden="true" />
                  </Button>
                </div>

                {Array.isArray(filteredPlaces) && filteredPlaces.length > 0 ? (
                  <motion.ul
                    className={getSpacingClassesFromConfig({ spaceY: 'md' })}
                    role="list"
                    aria-label="List of nearby places"
                    variants={getVariantsWithReducedMotion(staggerContainerVariants, prefersReducedMotion)}
                    initial="hidden"
                    animate="visible"
                  >
                    {filteredPlaces.map((place, index) => {
                      const placeId = typeof place?.id === 'string' ? place.id : String(place?.id ?? '');
                      if (!placeId) return null;
                      const category = Array.isArray(PLACE_CATEGORIES)
                        ? PLACE_CATEGORIES.find((c) => c && typeof c === 'object' && c !== null && c.id === place.category)
                        : undefined;
                      const isSaved = Array.isArray(savedPlaces) && savedPlaces.includes(placeId);
                      const placeName = typeof place.name === 'string' ? place.name : 'Place';

                      return (
                        <motion.li
                          key={placeId}
                          variants={getVariantsWithReducedMotion(staggerItemVariants, prefersReducedMotion)}
                          transition={{
                            delay: prefersReducedMotion ? 0 : index * 0.05,
                            duration: prefersReducedMotion ? 0 : motionDurations.smooth,
                          }}
                        >
                          <Card
                            clickable
                            className={cn('p-4 hover:shadow-lg transition-all motion-reduce:transition-none', focusRing)}
                            onClick={() => {
                              haptics.trigger('light');
                              setSelectedMarker({
                                id: placeId,
                                type: 'place',
                                location: typeof place.location === 'object' && place.location !== null ? place.location : { lat: 0, lng: 0 },
                                data: place,
                              });
                              setShowList(false);
                            }}
                            aria-label={`View details for ${placeName}`}
                          >
                      <div className="flex gap-3">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                              style={{ backgroundColor: typeof category?.color === 'string' ? `${category.color}20` : '#ec489920' }}
                              aria-hidden="true"
                            >
                              {typeof category?.icon === 'string' ? category.icon : '📍'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className={cn(getTypographyClasses('bodySmall'), 'font-semibold truncate')}>{placeName}</h3>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0"
                                  onClick={(e: MouseEvent) => {
                                    e.stopPropagation();
                                    handleSavePlace(placeId);
                                  }}
                                  aria-label={isSaved ? 'Remove from saved places' : 'Save place'}
                                  aria-pressed={isSaved}
                                >
                                  <Heart
                                    size={16}
                                    weight={isSaved ? 'fill' : 'regular'}
                                    className={isSaved ? 'text-red-500' : ''}
                                    aria-hidden="true"
                                  />
                                </Button>
                              </div>
                              {typeof place.description === 'string' && place.description.length > 0 && (
                                <p className={cn(getTypographyClasses('caption'), getColorClasses('mutedForeground', 'text'), 'line-clamp-2', getSpacingClassesFromConfig({ marginY: 'xs' }))}>
                                  {place.description}
                                </p>
                              )}
                              <div className={cn('flex items-center', getSpacingClassesFromConfig({ gap: 'md', marginY: 'sm' }))}>
                                <Badge variant="secondary" className={getTypographyClasses('caption')} aria-label={`Distance: ${formatDistance(typeof place.distance === 'number' ? place.distance : 0)}`}>
                                  {formatDistance(typeof place.distance === 'number' ? place.distance : 0)}
                                </Badge>
                                {Boolean(place.verified) && (
                                  <Badge variant="outline" className={getTypographyClasses('caption')} aria-label="Verified place">
                                    ✓ Verified
                                  </Badge>
                                )}
                                <span className={cn(getTypographyClasses('caption'), getColorClasses('mutedForeground', 'text'))} aria-label={`Rating: ${typeof place.rating === 'number' ? place.rating.toFixed(1) : '0'} stars, ${typeof place.reviewCount === 'number' ? place.reviewCount : 0} reviews`}>
                                  ⭐ {typeof place.rating === 'number' ? place.rating.toFixed(1) : '0.0'} ({typeof place.reviewCount === 'number' ? place.reviewCount : 0})
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.li>
                    );
                  })}
                  </motion.ul>
                ) : (
                  <div className={cn('text-center', getSpacingClassesFromConfig({ paddingY: '2xl' }))} role="status" aria-live="polite">
                    <p className={cn(getTypographyClasses('body'), getColorClasses('mutedForeground', 'text'))}>
                      {typeof searchQuery === 'string' && searchQuery.length > 0
                        ? 'No places found matching your search'
                        : 'No places found in this area'}
                    </p>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Selected Place Detail Sheet */}
        <AnimatePresence>
          {selectedMarker?.type === 'place' && selectedMarker.data && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { type: 'spring', damping: 30, stiffness: 300 }
              }
              className="absolute bottom-0 left-0 right-0 max-h-[60%] bg-background rounded-t-3xl shadow-2xl border-t border-border overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-label="Place details"
            >
              {(() => {
                const place = selectedMarker.data as Place;
                const placeId = typeof place?.id === 'string' ? place.id : String(place?.id ?? '');
                if (!placeId) return null;
                const category = Array.isArray(PLACE_CATEGORIES)
                  ? PLACE_CATEGORIES.find((c) => c && typeof c === 'object' && c !== null && c.id === place.category)
                  : undefined;
                const isSaved = Array.isArray(savedPlaces) && savedPlaces.includes(placeId);
                const placeName = typeof place.name === 'string' ? place.name : 'Place';
                const placeAddress = typeof place.address === 'string' ? place.address : '';
                const placeDescription = typeof place.description === 'string' ? place.description : '';

                return (
                  <div className={cn('p-6', getSpacingClassesFromConfig({ spaceY: 'lg' }))}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                          style={{ backgroundColor: typeof category?.color === 'string' ? `${category.color}20` : '#ec489920' }}
                          aria-hidden="true"
                        >
                          {typeof category?.icon === 'string' ? category.icon : '📍'}
                        </div>
                        <div>
                          <h2 className={cn(getTypographyClasses('h3'), 'font-bold')}>{placeName}</h2>
                          {placeAddress.length > 0 && (
                            <p className={cn(getTypographyClasses('bodySmall'), getColorClasses('mutedForeground', 'text'))}>{placeAddress}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedMarker(null)}
                        aria-label="Close place details"
                      >
                        <X size={20} aria-hidden="true" />
                      </Button>
                    </div>

                    {placeDescription.length > 0 && (
                      <p className={cn(getTypographyClasses('body'), getColorClasses('foreground', 'text'), 'opacity-80')}>{placeDescription}</p>
                    )}

                    <div className={cn('flex gap-2 flex-wrap', getSpacingClassesFromConfig({ marginY: 'md' }))}>
                      <Badge variant="secondary" aria-label={`Distance: ${formatDistance(typeof place.distance === 'number' ? place.distance : 0)}`}>
                        📏 {formatDistance(typeof place.distance === 'number' ? place.distance : 0)}
                      </Badge>
                      <Badge variant="secondary" aria-label={`Rating: ${typeof place.rating === 'number' ? place.rating.toFixed(1) : '0'} stars, ${typeof place.reviewCount === 'number' ? place.reviewCount : 0} reviews`}>
                        ⭐ {typeof place.rating === 'number' ? place.rating.toFixed(1) : '0.0'} ({typeof place.reviewCount === 'number' ? place.reviewCount : 0})
                      </Badge>
                      {Boolean(place.verified) && (
                        <Badge variant="outline" className="text-green-600 border-green-600" aria-label="Verified place">
                          ✓ Verified
                        </Badge>
                      )}
                      {Boolean(place.isOpen) && (
                        <Badge variant="outline" className="text-green-600 border-green-600" aria-label="Currently open">
                          🕐 Open Now
                        </Badge>
                      )}
                    </div>

                    {Array.isArray(place.amenities) && place.amenities.length > 0 && (
                      <section aria-label="Place amenities">
                        <h3 className={cn(getTypographyClasses('bodySmall'), 'font-semibold', getSpacingClassesFromConfig({ marginY: 'sm' }))}>Amenities</h3>
                        <ul className={cn('flex gap-2 flex-wrap', getSpacingClassesFromConfig({ marginY: 'sm' }))} role="list">
                          {place.amenities.map((amenity, idx) => {
                            const amenityString = typeof amenity === 'string' ? amenity : String(amenity ?? idx);
                            return (
                              <li key={amenityString || idx}>
                                <Badge variant="outline">{amenityString}</Badge>
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    )}

                    <div className={cn('flex gap-2', getSpacingClassesFromConfig({ paddingY: 'md' }))}>
                      <Button
                        className="flex-1"
                        onClick={() => {
                          haptics.trigger('medium');
                          handleSavePlace(placeId);
                        }}
                        variant={isSaved ? 'secondary' : 'outline'}
                        aria-label={isSaved ? 'Remove from saved places' : 'Save place'}
                        aria-pressed={isSaved}
                      >
                        <Heart size={18} weight={isSaved ? 'fill' : 'regular'} className="mr-2" aria-hidden="true" />
                        {isSaved ? t.map?.saved ?? 'Saved' : t.map?.save ?? 'Save'}
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => {
                          haptics.trigger('medium');
                          const placeLocation = typeof place.location === 'object' && place.location !== null ? place.location : { lat: 0, lng: 0 };
                          if (typeof placeLocation.lat === 'number' && typeof placeLocation.lng === 'number') {
                            const url = `https://www.google.com/maps/dir/?api=1&destination=${placeLocation.lat},${placeLocation.lng}`;
                            if (typeof window !== 'undefined') {
                              window.open(url, '_blank', 'noopener,noreferrer');
                            }
                          }
                        }}
                        aria-label={`Navigate to ${placeName}`}
                      >
                        <NavigationArrow size={18} className="mr-2" aria-hidden="true" />
                        {t.map?.navigate ?? 'Navigate'}
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Footer */}
        <motion.footer
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.2, duration: prefersReducedMotion ? 0 : 0.3 }}
          className="absolute bottom-4 left-4 right-4 z-10"
          aria-label="Map statistics"
        >
          <div className="backdrop-blur-xl bg-background/80 rounded-2xl shadow-xl border border-border p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className={cn(getTypographyClasses('h2'), 'font-bold', getColorClasses('primary', 'text'))} aria-label={`${Array.isArray(filteredPlaces) ? filteredPlaces.length : 0} places nearby`}>
                  {Array.isArray(filteredPlaces) ? filteredPlaces.length : 0}
                </p>
                <p className={cn(getTypographyClasses('caption'), getColorClasses('mutedForeground', 'text'))}>{t.map?.placesNearby ?? 'Places'}</p>
              </div>
              <div>
                <p className={cn(getTypographyClasses('h2'), 'font-bold', getColorClasses('primary', 'text'))} aria-label={`${Array.isArray(savedPlaces) ? savedPlaces.length : 0} saved places`}>
                  {Array.isArray(savedPlaces) ? savedPlaces.length : 0}
                </p>
                <p className={cn(getTypographyClasses('caption'), getColorClasses('mutedForeground', 'text'))}>{t.map?.saved ?? 'Saved'}</p>
              </div>
              <div>
                <p className={cn(getTypographyClasses('h2'), 'font-bold', getColorClasses('primary', 'text'))} aria-label={`${typeof radiusKm === 'number' ? radiusKm : 0} kilometer radius`}>
                  {typeof radiusKm === 'number' ? radiusKm : 0}
                </p>
                <p className={cn(getTypographyClasses('caption'), getColorClasses('mutedForeground', 'text'))}>{t.map?.radiusKm ?? 'km radius'}</p>
              </div>
            </div>
          </div>
        </motion.footer>
      </main>
    </PageTransitionWrapper>
  );
}

export default function MapView() {
  return (
    <ScreenErrorBoundary screenName="Map" enableNavigation={true} enableReporting={false}>
      <MapViewContent />
    </ScreenErrorBoundary>
  );
}

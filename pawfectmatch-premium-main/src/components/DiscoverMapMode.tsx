import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Heart, Info } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { haptics } from '@/lib/haptics';
import type { Pet } from '@/lib/types';
import { calculateDistance, snapToGrid, getCurrentLocation } from '@/lib/maps/utils';
import type { Location } from '@/lib/maps/types';
import PetDetailDialog from '@/components/PetDetailDialog';
import { calculateCompatibility } from '@/lib/matching';
import { useMapConfig } from '@/lib/maps/useMapConfig';

interface DiscoverMapModeProps {
  pets: Pet[];
  userPet: Pet | undefined;
  onSwipe: (pet: Pet, action: 'like' | 'pass') => void;
}

export default function DiscoverMapMode({ pets, userPet, onSwipe }: DiscoverMapModeProps) {
  const { t } = useApp();
  const { mapSettings } = useMapConfig();
  
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    getCurrentLocation()
      .then(location => {
        const coarse = snapToGrid(location, mapSettings.PRIVACY_GRID_METERS);
        setUserLocation(coarse);
      })
      .catch(() => {
        setUserLocation({ lat: 40.7128, lng: -74.006 });
      });
  }, [mapSettings.PRIVACY_GRID_METERS]);

  const petsWithLocations = useMemo(() => {
    if (!userLocation) return [];
    
    return pets.map(pet => {
      const petLoc = {
        lat: userLocation.lat + (Math.random() - 0.5) * 0.1,
        lng: userLocation.lng + (Math.random() - 0.5) * 0.1,
      };
      
      return {
        ...pet,
        locationData: petLoc,
        distance: calculateDistance(userLocation, petLoc),
      };
    }).sort((a, b) => a.distance - b.distance);
  }, [pets, userLocation]);

  const handleMarkerClick = (pet: Pet) => {
    haptics.trigger('light');
    setSelectedPet(pet);
  };

  const handleLike = () => {
    if (!selectedPet) return;
    haptics.trigger('success');
    onSwipe(selectedPet, 'like');
    setSelectedPet(null);
  };

  const handlePass = () => {
    if (!selectedPet) return;
    haptics.trigger('light');
    onSwipe(selectedPet, 'pass');
    setSelectedPet(null);
  };

  const compatibilityScore = selectedPet && userPet
    ? calculateCompatibility(userPet, selectedPet)
    : 0;

  return (
    <div className="relative h-[calc(100vh-14rem)] max-h-[700px] bg-background rounded-2xl overflow-hidden border border-border shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-background to-muted/30">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <MapPin size={64} className="mx-auto text-primary/30" weight="duotone" />
            <div className="space-y-2">
              <p className="text-lg font-semibold text-foreground/70">
                {t.map.interactiveMap}
              </p>
              <p className="text-sm text-muted-foreground max-w-md">
                {t.discover.noMore}
              </p>
              {userLocation && (
                <Badge variant="secondary" className="mt-2">
                  📌 {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {userLocation && petsWithLocations.slice(0, 15).map((pet, idx) => (
          <motion.div
            key={pet.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            className="absolute cursor-pointer"
            style={{
              left: `${15 + (idx % 6) * 14}%`,
              top: `${15 + Math.floor(idx / 6) * 22}%`,
            }}
            onClick={() => handleMarkerClick(pet)}
          >
            <div className="relative group">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-14 h-14 rounded-full overflow-hidden border-4 border-white shadow-lg relative"
              >
                <img
                  src={pet.photos?.[0] || '/placeholder-pet.png'}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </motion.div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-md" />
              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
                {Math.round(pet.distance)}km
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedPet && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 max-h-[70%] bg-background rounded-t-3xl shadow-2xl border-t border-border overflow-y-auto"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedPet.photos?.[0] || '/placeholder-pet.png'}
                      alt={selectedPet.name}
                      className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                    />
                    <div>
                      <h3 className="text-2xl font-bold">{selectedPet.name}</h3>
                      <p className="text-muted-foreground">
                        {selectedPet.breed} • {selectedPet.age} {t.common.years}
                      </p>
                      <p className="text-sm text-primary font-medium">
                        📍 {Math.round(petsWithLocations.find(p => p.id === selectedPet.id)?.distance || 0)} {t.common.km} {t.petProfile.distance}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedPet(null)}
                  className="flex-shrink-0"
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="flex gap-2">
                <Badge variant="secondary" className="text-sm">
                  {compatibilityScore}% {t.discover.compatibility}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {selectedPet.size}
                </Badge>
              </div>

              <p className="text-foreground/80">{selectedPet.bio}</p>

              <div>
                <p className="text-sm font-semibold mb-2">{t.petProfile.personality}</p>
                <div className="flex gap-2 flex-wrap">
                  {selectedPet.personality.map((trait) => (
                    <Badge key={trait} variant="outline">
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 h-14 text-lg"
                  onClick={handlePass}
                >
                  <X size={24} className="mr-2" />
                  {t.discover.pass}
                </Button>
                <Button
                  size="lg"
                  className="flex-1 h-14 text-lg bg-gradient-to-r from-primary to-accent"
                  onClick={handleLike}
                >
                  <Heart size={24} className="mr-2" weight="fill" />
                  {t.discover.like}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14"
                  onClick={() => setShowDetail(true)}
                >
                  <Info size={24} />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedPet && (
        <PetDetailDialog
          pet={selectedPet}
          open={showDetail}
          onOpenChange={setShowDetail}
        />
      )}

      <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
        <div className="backdrop-blur-xl bg-background/80 rounded-2xl shadow-xl border border-border p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{petsWithLocations.length}</p>
              <p className="text-xs text-muted-foreground">{t.map.placesNearby}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">
                {petsWithLocations[0] ? Math.round(petsWithLocations[0].distance) : 0}
              </p>
              <p className="text-xs text-muted-foreground">Closest (km)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

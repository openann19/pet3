import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Check, CurrencyDollar, PawPrint } from '@phosphor-icons/react';
import type { AdoptionListing } from '@/lib/adoption-marketplace-types';
import { useApp } from '@/contexts/AppContext';
import { haptics } from '@/lib/haptics';
import { getTypographyClasses } from '@/lib/typography';
import { MotionView } from '@petspark/motion';

interface AdoptionListingCardProps {
  listing: AdoptionListing;
  onSelect: (listing: AdoptionListing) => void;
  onFavorite?: (listingId: string) => void;
  isFavorited?: boolean;
}

function AdoptionListingCardComponent({
  listing,
  onSelect,
  onFavorite,
  isFavorited,
}: AdoptionListingCardProps): JSX.Element {
  const { t } = useApp();
  const {
    petName,
    petBreed,
    petAge,
    petGender,
    petSize,
    petPhotos,
    location,
    fee,
    vaccinated,
    spayedNeutered,
    status,
  } = listing;

  const formatFee = (): string => {
    if (!fee || fee.amount === 0) return 'Free';
    return `${fee.currency} ${fee.amount.toLocaleString()}`;
  };

  return (
    <MotionView
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="group"
    >
      <Card className="overflow-hidden rounded-2xl border-border/50 bg-background/80 backdrop-blur-sm shadow-lg group-hover:shadow-2xl transition-all duration-300">
        <div
          className="relative aspect-4/3 overflow-hidden bg-muted cursor-pointer"
          onClick={() => {
            haptics.trigger('selection');
            onSelect(listing);
          }}
        >
          <img
            src={petPhotos[0] ?? '/placeholder-pet.jpg'}
            alt={petName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />

          {/* Overlay gradient for better text readability */}
          <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-black/10" />

          {/* Status Badge */}
          {status === 'pending_review' && (
            <Badge className="absolute top-3 right-3 bg-yellow-500/90 text-white backdrop-blur-sm border-0 shadow-lg">
              {t.adoption?.pendingReview || 'Pending Review'}
            </Badge>
          )}

          {/* Favorite Button */}
          {onFavorite && (
            <MotionView
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-3 left-3"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  haptics.trigger('light');
                  onFavorite(listing.id);
                }}
                className="w-10 h-10 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
              >
                <Heart
                  size={20}
                  weight={isFavorited ? 'fill' : 'regular'}
                  className={isFavorited ? 'text-destructive' : 'text-foreground'}
                />
              </button>
            </MotionView>
          )}

          {/* Fee Badge */}
          <div className="absolute bottom-3 left-3">
            {fee && fee.amount > 0 ? (
              <Badge className="bg-primary/90 text-white backdrop-blur-sm border-0 shadow-lg gap-1">
                <CurrencyDollar size={16} weight="bold" />
                {formatFee()}
              </Badge>
            ) : (
              <Badge className="bg-green-500/90 text-white backdrop-blur-sm border-0 shadow-lg">
                {t.adoption?.noFee || 'Free'}
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-6 space-y-4">
          {/* Pet Name and Age */}
          <div
            onClick={() => {
              haptics.trigger('selection');
              onSelect(listing);
            }}
            className="cursor-pointer"
          >
            <h3 className={getTypographyClasses('h3')}>{petName}</h3>
            <p className={`${getTypographyClasses('body-sm')} text-muted-foreground mt-1`}>
              {petBreed} • {petAge}{' '}
              {petAge === 1 ? t.common?.year_singular || 'year' : t.common?.years || 'years'}
            </p>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin size={16} weight="fill" />
            <span className={getTypographyClasses('body-sm')}>
              {location.city}, {location.country}
            </span>
          </div>

          {/* Health & Info Badges */}
          <div className="flex flex-wrap gap-2">
            {vaccinated && (
              <Badge variant="secondary" className="text-xs gap-1 px-2 py-1">
                <Check size={12} weight="bold" />
                Vaccinated
              </Badge>
            )}
            {spayedNeutered && (
              <Badge variant="secondary" className="text-xs gap-1 px-2 py-1">
                <Check size={12} weight="bold" />
                Fixed
              </Badge>
            )}
            <Badge variant="outline" className="text-xs px-2 py-1">
              {petGender === 'male' ? 'Male' : 'Female'}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize px-2 py-1">
              {petSize}
            </Badge>
          </div>

          {/* Temperament Traits */}
          {listing.temperament && listing.temperament.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {listing.temperament.slice(0, 2).map((trait) => (
                <Badge key={trait} variant="outline" className="text-xs px-2 py-1 bg-muted/50">
                  {trait}
                </Badge>
              ))}
              {listing.temperament.length > 2 && (
                <Badge variant="outline" className="text-xs text-muted-foreground px-2 py-1">
                  +{listing.temperament.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Description Preview */}
          {listing.petDescription && (
            <p className={`${getTypographyClasses('body-sm')} text-muted-foreground line-clamp-2`}>
              {listing.petDescription}
            </p>
          )}

          {/* View Details Button */}
          <Button
            size="sm"
            className="w-full gap-2 mt-4 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
            onClick={(e) => {
              e.stopPropagation();
              haptics.trigger('success');
              onSelect(listing);
            }}
          >
            <PawPrint size={16} weight="fill" />
            {t.adoption?.viewDetails || 'View Details'}
          </Button>
        </CardContent>
      </Card>
    </MotionView>
  );
}

// Memoize AdoptionListingCard to prevent unnecessary re-renders
export const AdoptionListingCard = memo(AdoptionListingCardComponent, (prev, next) => {
  return (
    prev.listing.id === next.listing.id &&
    prev.listing.status === next.listing.status &&
    prev.isFavorited === next.isFavorited
  );
});

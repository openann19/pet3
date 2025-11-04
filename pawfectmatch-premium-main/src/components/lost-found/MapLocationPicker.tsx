import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, MapPin, Check, Crosshair } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { createLogger } from '@/lib/logger'

interface MapLocationPickerProps {
  onSelect: (lat: number, lon: number) => void
  onClose: () => void
  initialLocation?: { lat: number; lon: number }
}

export function MapLocationPicker({ onSelect, onClose, initialLocation }: MapLocationPickerProps) {
  const logger = createLogger('MapLocationPicker')
  const [selectedLat, setSelectedLat] = useState(initialLocation?.lat || 37.7749)
  const [selectedLon, setSelectedLon] = useState(initialLocation?.lon || -122.4194)
  const [address, setAddress] = useState<string>('Loading address...')

  useEffect(() => {
    if (navigator.geolocation && !initialLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSelectedLat(position.coords.latitude)
          setSelectedLon(position.coords.longitude)
        },
        (error) => {
          logger.error('Geolocation error', error instanceof Error ? error : new Error(String(error)))
        }
      )
    }
  }, [initialLocation])

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedLat}&lon=${selectedLon}`
        )
        const data = await response.json()
        setAddress(data.display_name || 'Address not found')
      } catch (error) {
        logger.error('Failed to fetch address', error instanceof Error ? error : new Error(String(error)))
        setAddress('Unable to fetch address')
      }
    }

    fetchAddress()
  }, [selectedLat, selectedLon])

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSelectedLat(position.coords.latitude)
          setSelectedLon(position.coords.longitude)
        },
        (error) => {
          logger.error('Geolocation error', error instanceof Error ? error : new Error(String(error)))
        }
      )
    }
  }

  const handleConfirm = () => {
    onSelect(selectedLat, selectedLon)
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg">
      <div className="container max-w-6xl mx-auto p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Pick Location on Map</h2>
            <p className="text-sm text-muted-foreground">
              Drag the map or use current location
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={24} />
          </Button>
        </div>

        <Card className="flex-1 relative overflow-hidden mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 flex items-center justify-center">
            <div className="text-center space-y-4">
              <MapPin size={64} className="mx-auto text-primary" weight="duotone" />
              <div>
                <p className="text-lg font-semibold">Interactive Map</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
                  In production, this would show an interactive map (OpenStreetMap, Google Maps, or Mapbox)
                  where users can drag to select a location.
                </p>
              </div>
              <div className="bg-card/80 backdrop-blur-sm p-4 rounded-lg max-w-md mx-auto">
                <p className="text-xs text-muted-foreground mb-2">Selected Location:</p>
                <p className="font-mono text-sm">
                  Lat: {selectedLat.toFixed(6)}, Lon: {selectedLon.toFixed(6)}
                </p>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{address}</p>
              </div>
            </div>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <MapPin size={48} className="text-primary drop-shadow-lg" weight="fill" />
            </motion.div>
          </div>
        </Card>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleUseCurrentLocation}
            className="flex-1"
          >
            <Crosshair size={16} className="mr-2" />
            Use Current Location
          </Button>
          <Button
            variant="default"
            onClick={handleConfirm}
            className="flex-1"
          >
            <Check size={16} className="mr-2" />
            Confirm Location
          </Button>
        </div>
      </div>
    </div>
  )
}

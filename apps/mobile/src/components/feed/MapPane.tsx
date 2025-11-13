/**
 * MapPane Component
 * Displays a map view with optional react-native-maps integration
 * Location: apps/mobile/src/components/feed/MapPane.tsx
 */

import React, { memo, useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { Platform, StyleSheet, Text, View } from 'react-native'
import { useSharedValue } from 'react-native-reanimated'
import type { MapViewProps, MapViewModule } from '@mobile/types/map-view'
import { isMapViewComponent } from '@mobile/types/map-view'
import { colors } from '@mobile/theme/colors'
import { typography, spacing, radius } from '@mobile/theme/tokens'

interface MapRegion {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

export const MapPane = memo((): React.ReactElement => {
  // Initialize all hooks BEFORE any conditional returns (React rules)
  const initialRegion: MapRegion = {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }

  // Throttled region state using useSharedValue
  const regionSV = useSharedValue({
    latitude: initialRegion.latitude,
    longitude: initialRegion.longitude,
    latitudeDelta: initialRegion.latitudeDelta,
    longitudeDelta: initialRegion.longitudeDelta,
  })

  // Throttled onRegionChange handler (120ms delay, trailing: true)
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingRegionRef = useRef<MapRegion | null>(null)

  // Optional dynamic MapView (no hard dep). If the package is missing, we fall back gracefully.
  const [MapView, setMapView] = useState<React.ComponentType<MapViewProps> | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadMapView(): Promise<void> {
      try {
        // Dynamic import for optional dependency react-native-maps
        // Use optional chaining for safer access
        const mapsModule = (await import('react-native-maps').catch(() => null)) as MapViewModule | null
        if (!mounted) return

        const MapComponent = mapsModule?.default
        // Validate that the imported component is a valid React component
        if (MapComponent !== null && MapComponent !== undefined && isMapViewComponent(MapComponent)) {
          setMapView(() => MapComponent)
        } else {
          setMapView(null)
        }
      } catch {
        if (mounted) {
          setMapView(null)
        }
      }
    }

    void loadMapView()

    return () => {
      mounted = false
    }
  }, [])

  const onRegionChange = useCallback(
    (region: MapRegion) => {
      // Store pending region
      pendingRegionRef.current = region

      // Clear existing timeout
      if (throttleTimeoutRef.current !== null) {
        clearTimeout(throttleTimeoutRef.current)
      }

      // Set new timeout with trailing behavior
      throttleTimeoutRef.current = setTimeout(() => {
        if (pendingRegionRef.current !== null) {
          regionSV.value = {
            latitude: pendingRegionRef.current.latitude,
            longitude: pendingRegionRef.current.longitude,
            latitudeDelta: pendingRegionRef.current.latitudeDelta,
            longitudeDelta: pendingRegionRef.current.longitudeDelta,
          }
          pendingRegionRef.current = null
        }
        throttleTimeoutRef.current = null
      }, 120)
    },
    [regionSV]
  )

  useEffect(() => {
    return () => {
      const timeout = throttleTimeoutRef.current
      if (timeout !== null) {
        clearTimeout(timeout)
      }
    }
  }, [])

  const fallbackView = useMemo(() => {
    return (
      <View
        style={styles.mapFallback}
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel="Map module not installed"
        accessibilityHint="The map view requires react-native-maps package to be installed"
      >
        <Text
          style={styles.mapFallbackTitle}
          accessible={true}
          accessibilityRole="header"
          accessibilityLabel="Map module not installed"
        >
          Map module not installed
        </Text>
        <Text
          style={styles.mapFallbackText}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel="Install react-native-maps to enable the live map view"
        >
          Install <Text style={styles.code} accessible={false}>react-native-maps</Text> to enable the live map view.
        </Text>
      </View>
    )
  }, [])

  if (MapView === null) {
    return fallbackView
  }

  return (
    <View
      style={styles.mapWrap}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel="Interactive map showing pet locations"
      accessibilityHint="Pan and zoom to explore different areas"
    >
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        onRegionChange={onRegionChange}
      >
        {/* You can drop markers from your real data once coords are available */}
      </MapView>
    </View>
  )
})

MapPane.displayName = 'MapPane'

const styles = StyleSheet.create({
  mapWrap: {
    flex: 1,
    minHeight: spacing['4xl'] * 7, // Map view minimum height (approximately 280px)
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  mapFallback: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  mapFallbackTitle: {
    color: colors.textPrimary,
    fontWeight: typography.h2.fontWeight,
    fontSize: typography.h3.fontSize,
    lineHeight: typography.h3.lineHeight,
    marginBottom: spacing.sm,
  },
  mapFallbackText: {
    color: colors.textSecondary,
    fontSize: typography.bodySm.fontSize,
    lineHeight: typography.bodySm.lineHeight,
  },
  code: {
    color: colors.textPrimary,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: typography.bodySm.fontSize,
  },
})

/**
 * MapView Type Definitions
 * 
 * Type definitions for optional react-native-maps integration.
 * Location: apps/mobile/src/types/map-view.ts
 */

import type React from 'react'

/**
 * Region type for map views
 */
export interface MapRegion {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

/**
 * Props for MapView component
 * Matches react-native-maps MapView interface
 */
export interface MapViewProps {
  style?: unknown
  initialRegion?: MapRegion
  onRegionChange?: (region: MapRegion) => void
  children?: React.ReactNode
}

/**
 * Type guard to check if a value is a valid MapView component
 */
export function isMapViewComponent(
  component: unknown
): component is React.ComponentType<MapViewProps> {
  return (
    typeof component === 'function' ||
    (typeof component === 'object' && component !== null && 'render' in component)
  )
}

/**
 * Optional MapView module type
 * Used for dynamic imports of react-native-maps
 */
export interface MapViewModule {
  default: React.ComponentType<MapViewProps> | unknown
}


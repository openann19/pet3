import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Location } from '@/lib/maps/types';
import { getMapStyleUrl } from './provider-config';

export interface MapMarker {
  id: string;
  location: Location;
  data: unknown;
  icon?: string;
  color?: string;
}

interface UseMapLibreMapProps {
  container: HTMLDivElement | null;
  center: Location;
  zoom?: number;
  markers?: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  onMapClick?: (location: Location) => void;
  clusterMarkers?: boolean;
}

export function useMapLibreMap({
  container,
  center,
  zoom = 13,
  markers = [],
  onMarkerClick,
  onMapClick,
  clusterMarkers = true,
}: UseMapLibreMapProps): {
  map: maplibregl.Map | null;
  isLoading: boolean;
  error: Error | null;
} {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!container) return;

    try {
      const map = new maplibregl.Map({
        container,
        style: getMapStyleUrl(),
        center: [center.lng, center.lat],
        zoom,
        maxZoom: 18,
        minZoom: 3,
      });

      map.on('load', () => {
        setIsLoading(false);
        setError(null);
      });

      map.on('error', (e) => {
        const err = e.error instanceof Error ? e.error : new Error(String(e.error));
        setError(err);
        setIsLoading(false);
      });

      mapRef.current = map;

      return () => {
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];
        map.remove();
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsLoading(false);
      return undefined;
    }
  }, [container, center.lat, center.lng, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) return;

    map.setCenter([center.lng, center.lat]);
    if (zoom !== undefined) {
      map.setZoom(zoom);
    }
  }, [center.lat, center.lng, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded() || !markers.length) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (clusterMarkers && markers.length > 10) {
      const clusters = clusterMarkersByZoom(markers);
      clusters.forEach((cluster) => {
        const el = document.createElement('div');
        el.className = 'cluster-marker';
        el.innerHTML = cluster.count > 1 ? `<div>${cluster.count}</div>` : '';
        el.style.width = cluster.count > 1 ? '40px' : '30px';
        el.style.height = cluster.count > 1 ? '40px' : '30px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = cluster.count > 1 ? 'hsl(var(--primary))' : 'hsl(var(--accent))';
        el.style.color = 'white';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontWeight = 'bold';
        el.style.fontSize = '12px';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';

        const marker = new maplibregl.Marker(el)
          .setLngLat([cluster.location.lng, cluster.location.lat])
          .addTo(map);

        el.addEventListener('click', () => {
          if (cluster.count === 1 && cluster.markers[0]) {
            onMarkerClick?.(cluster.markers[0]);
          } else {
            map.flyTo({
              center: [cluster.location.lng, cluster.location.lat],
              zoom: Math.min(map.getZoom() + 2, 18),
            });
          }
        });

        markersRef.current.push(marker);
      });
    } else {
      markers.forEach((markerData) => {
        const el = document.createElement('div');
        el.className = 'single-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = markerData.color || 'hsl(var(--primary))';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';

        const marker = new maplibregl.Marker(el)
          .setLngLat([markerData.location.lng, markerData.location.lat])
          .addTo(map);

        el.addEventListener('click', () => {
          onMarkerClick?.(markerData);
        });

        markersRef.current.push(marker);
      });
    }
  }, [mapRef.current, markers, clusterMarkers, onMarkerClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded() || !onMapClick) return;

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      onMapClick({
        lat: e.lngLat.lat,
        lng: e.lngLat.lng,
      });
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [onMapClick]);

  // Throttled region change handler with requestIdleCallback fallback
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) return;

    let pendingRegion: { lat: number; lng: number; zoom: number } | null = null
    let idleCallbackId: number | NodeJS.Timeout | null = null

    const handleMoveEnd = (): void => {
      const center = map.getCenter()
      const zoom = map.getZoom()
      
      pendingRegion = {
        lat: center.lat,
        lng: center.lng,
        zoom,
      }

      // Cancel existing callback
      if (idleCallbackId !== null) {
        if (typeof idleCallbackId === 'number') {
          cancelIdleCallback(idleCallbackId)
        } else {
          clearTimeout(idleCallbackId)
        }
      }

      // Use requestIdleCallback if available, fallback to setTimeout
      const scheduleUpdate = (callback: () => void): void => {
        if (typeof requestIdleCallback !== 'undefined') {
          idleCallbackId = requestIdleCallback(callback, { timeout: 120 })
        } else {
          idleCallbackId = setTimeout(callback, 120)
        }
      }

      scheduleUpdate(() => {
        if (pendingRegion) {
          // Update center prop will trigger re-render if needed
          // This throttles rapid region changes
          pendingRegion = null
        }
        idleCallbackId = null
      })
    }

    map.on('moveend', handleMoveEnd)
    
    return () => {
      map.off('moveend', handleMoveEnd)
      if (idleCallbackId !== null) {
        if (typeof idleCallbackId === 'number') {
          cancelIdleCallback(idleCallbackId)
        } else {
          clearTimeout(idleCallbackId)
        }
      }
    }
  }, [mapRef.current])

  return {
    map: mapRef.current,
    isLoading,
    error,
  };
}

function clusterMarkersByZoom(markers: MapMarker[]): Array<{
  location: Location;
  count: number;
  markers: MapMarker[];
}> {
  const clusters: Array<{
    location: Location;
    count: number;
    markers: MapMarker[];
  }> = [];
  const processed = new Set<string>();
  const clusterRadius = 0.01;

  markers.forEach((marker) => {
    if (processed.has(marker.id)) return;

    const nearby = markers.filter((m) => {
      if (processed.has(m.id)) return false;
      const latDiff = Math.abs(m.location.lat - marker.location.lat);
      const lngDiff = Math.abs(m.location.lng - marker.location.lng);
      return latDiff < clusterRadius && lngDiff < clusterRadius;
    });

    if (nearby.length > 1) {
      const clusterCenter: Location = {
        lat: nearby.reduce((sum, m) => sum + m.location.lat, 0) / nearby.length,
        lng: nearby.reduce((sum, m) => sum + m.location.lng, 0) / nearby.length,
      };

      clusters.push({
        location: clusterCenter,
        count: nearby.length,
        markers: nearby,
      });

      nearby.forEach((m) => processed.add(m.id));
    } else {
      clusters.push({
        location: marker.location,
        count: 1,
        markers: [marker],
      });
      processed.add(marker.id);
    }
  });

  return clusters;
}


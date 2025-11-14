import { AnimatePresence } from '@/effects/reanimated/animate-presence';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useUIConfig } from "@/hooks/use-ui-config";
import { supportsAVIF, supportsWebP } from '@/lib/image-loader';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  placeholderSrc?: string;
  className?: string;
  containerClassName?: string;
  blurAmount?: number;
  aspectRatio?: string;
  priority?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onClick?: () => void;
  'aria-label'?: string;
  draggable?: boolean;
}

export function ProgressiveImage({
  src,
  alt,
  placeholderSrc,
  className,
  containerClassName,
  blurAmount = 20,
  aspectRatio,
  priority = false,
  sizes,
  width,
  height,
  quality = 85,
  format = 'auto',
  onLoad,
  onError,
  onClick,
  'aria-label': ariaLabel,
  draggable = false,
}: ProgressiveImageProps) {
  const _uiConfig = useUIConfig();
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc || src);
  const [error, setError] = useState(false);
  const [bestFormat, setBestFormat] = useState<'webp' | 'avif' | 'original'>('original');
  const imgRef = useRef<HTMLImageElement>(null);

  // Detect best format support
  useEffect(() => {
    if (format === 'auto') {
      let isMounted = true;
      supportsAVIF()
        .then((avifSupported) => {
          if (!isMounted) return;
          if (avifSupported) {
            setBestFormat('avif');
          } else if (supportsWebP()) {
            setBestFormat('webp');
          } else {
            setBestFormat('original');
          }
        })
        .catch(() => {
          if (!isMounted) return;
          setBestFormat('original');
        });
      return () => {
        isMounted = false;
      };
    } else {
      setBestFormat(format);
      return () => { }; // Return cleanup function for else branch
    }
  }, [format]);

  const getOptimizedSrc = useCallback(
    (originalSrc: string): string => {
      if (bestFormat === 'original') return originalSrc;

      try {
        const url = new URL(originalSrc, window.location.origin);
        const params = new URLSearchParams(url.search);

        if (width) params.set('w', width.toString());
        if (height) params.set('h', height.toString());
        if (quality) params.set('q', quality.toString());
        params.set('fm', bestFormat);

        return `${url.pathname}?${params.toString()}`;
      } catch {
        return originalSrc;
      }
    },
    [bestFormat, width, height, quality]
  );

  const loadImage = useCallback(() => {
    const img = new Image();
    const optimizedSrc = getOptimizedSrc(src);

    img.onload = () => {
      setCurrentSrc(optimizedSrc);
      setIsLoaded(true);
      onLoad?.();
    };

    img.onerror = () => {
      // Fallback to original if optimized fails
      if (optimizedSrc !== src) {
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          setCurrentSrc(src);
          setIsLoaded(true);
          onLoad?.();
        };
        fallbackImg.onerror = () => {
          const err = new Error(`Failed to load image: ${src}`);
          setError(true);
          onError?.(err);
        };
        fallbackImg.src = src;
      } else {
        const err = new Error(`Failed to load image: ${src}`);
        setError(true);
        onError?.(err);
      }
    };

    img.src = optimizedSrc;
  }, [src, getOptimizedSrc, onLoad, onError]);

  useEffect(() => {
    if (priority) {
      loadImage();
      return () => { }; // Return cleanup function
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [src, priority, loadImage]);

  const placeholderOpacity = useSharedValue(1);
  const imageOpacity = useSharedValue(0);

  useEffect(() => {
    if (isLoaded) {
      placeholderOpacity.value = withTiming(0, { duration: 300 });
      imageOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [isLoaded, placeholderOpacity, imageOpacity]);

  const placeholderStyle = useAnimatedStyle(() => ({
    opacity: placeholderOpacity.value,
  }));

  const imageStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));

  const containerProps = onClick
    ? {
      onClick,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      },
      role: 'button',
      tabIndex: 0,
      className: cn('relative overflow-hidden cursor-pointer', containerClassName),
    }
    : {
      className: cn('relative overflow-hidden', containerClassName),
    };

  return (
    <div {...containerProps} style={{ aspectRatio }}>
      <AnimatePresence>
        {!isLoaded && placeholderSrc && (
          <AnimatedView
            key="placeholder"
            style={placeholderStyle}
            className={cn('absolute inset-0 w-full h-full', className)}
          >
            <img
              ref={imgRef}
              src={placeholderSrc}
              alt={alt}
              className={cn('w-full h-full object-cover', className)}
              style={{ filter: `blur(${blurAmount}px)` }}
              aria-label={ariaLabel}
            />
          </AnimatedView>
        )}
      </AnimatePresence>

      <AnimatedView style={imageStyle} className={cn('w-full h-full', className)}>
        <img
          src={currentSrc}
          alt={alt}
          className={cn('w-full h-full object-cover', className)}
          sizes={sizes}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          aria-label={ariaLabel}
          draggable={draggable}
        />
      </AnimatedView>

      {!isLoaded && !placeholderSrc && <div className="absolute inset-0 bg-muted animate-pulse" />}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm">
          Failed to load image
        </div>
      )}
    </div>
  );
}

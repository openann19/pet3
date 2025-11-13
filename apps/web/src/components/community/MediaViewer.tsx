'use client';
import { motion, useMotionValue, animate, useTransform } from 'framer-motion';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useApp } from '@/contexts/AppContext';
import type { PostMedia, PostVideo } from '@/lib/community-types';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import {
  CaretLeft,
  CaretRight,
  DotsThree,
  DownloadSimple,
  Pause,
  Play,
  Share,
  SpeakerHigh,
  SpeakerSlash,
  X,
} from '@phosphor-icons/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { useHoverTap } from '@/effects/reanimated';
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';

const logger = createLogger('MediaViewer');

export type MediaItem = PostMedia | (PostVideo & { type: 'video' });

interface MediaViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: MediaItem[];
  initialIndex?: number;
  authorName?: string;
}

interface SlideTransitionProps {
  children: React.ReactNode;
  direction: number;
  isVisible: boolean;
}

function SlideTransition({
  children,
  direction,
  isVisible,
}: SlideTransitionProps): JSX.Element | null {
  const prefersReducedMotion = usePrefersReducedMotion();
  const translateX = useMotionValue(direction > 0 ? 1000 : -1000);
  const opacity = useMotionValue(0);
  const scale = useMotionValue(0.9);

  useEffect(() => {
    if (prefersReducedMotion) {
      if (isVisible) {
        translateX.set(0);
        opacity.set(1);
        scale.set(1);
      } else {
        translateX.set(direction > 0 ? -1000 : 1000);
        opacity.set(0);
        scale.set(0.9);
      }
      return;
    }

    if (isVisible) {
      void animate(translateX, 0, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
      void animate(opacity, 1, {
        duration: motionDurations.fast / 1000,
        ease: [0.2, 0, 0, 1],
      });
      void animate(scale, 1, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
    } else {
      void animate(translateX, direction > 0 ? -1000 : 1000, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
      void animate(opacity, 0, {
        duration: motionDurations.fast / 1000,
        ease: [0.2, 0, 0, 1],
      });
      void animate(scale, 0.9, {
        duration: motionDurations.fast / 1000,
        ease: [0.2, 0, 0, 1],
      });
    }
  }, [isVisible, direction, translateX, opacity, scale, prefersReducedMotion]);

  if (!isVisible) return null;

  return (
    <motion.div
      style={{
        x: translateX,
        scale,
        opacity,
      }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {children}
    </motion.div>
  );
}

export function MediaViewer({
  open,
  onOpenChange,
  media,
  initialIndex = 0,
  authorName,
}: MediaViewerProps): JSX.Element | null {
  const { t } = useApp();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [direction, setDirection] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragX = useMotionValue(0);
  const dragStartX = useRef<number>(0);

  // Get current media early for use in callbacks
  const currentMedia = media[currentIndex];

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showVideoControls, setShowVideoControls] = useState(true);
  const controlsTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, open]);

  useEffect(() => {
    if (!open) {
      setIsZoomed(false);
      setDirection(0);
      setIsPlaying(false);
      dragX.set(0);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  }, [open, dragX]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentIndex, media]);

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowVideoControls(true);
    if (typeof window !== 'undefined') {
      controlsTimeoutRef.current = window.setTimeout(() => {
        if (isPlaying) {
          setShowVideoControls(false);
        }
      }, 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
      setIsZoomed(false);
      if (videoRef.current) {
        videoRef.current.pause();
      }
      haptics.selection();
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < media.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
      setIsZoomed(false);
      if (videoRef.current) {
        videoRef.current.pause();
      }
      haptics.selection();
    }
  }, [currentIndex, media.length]);

  const handleDragStart = useCallback(
    (clientX: number) => {
      if (isZoomed || currentMedia?.type === 'video') return;
      setIsDragging(true);
      dragStartX.current = clientX;
    },
    [isZoomed]
  );

  const handleDragMove = useCallback(
    (clientX: number) => {
      if (!isDragging || isZoomed || currentMedia?.type === 'video') return;
      const delta = clientX - dragStartX.current;
      dragX.set(delta);
    },
    [isDragging, isZoomed, dragX, currentMedia?.type]
  );

  const handleDragEnd = useCallback(
    (clientX: number) => {
      if (!isDragging || isZoomed || currentMedia?.type === 'video') {
        setIsDragging(false);
        if (prefersReducedMotion) {
          dragX.set(0);
        } else {
          void animate(dragX, 0, {
            type: 'spring',
            damping: springConfigs.smooth.damping,
            stiffness: springConfigs.smooth.stiffness,
          });
        }
        return;
      }

      const delta = clientX - dragStartX.current;
      const swipeThreshold = 50;

      if (Math.abs(delta) > swipeThreshold) {
        if (delta > 0 && currentIndex > 0) {
          handlePrevious();
        } else if (delta < 0 && currentIndex < media.length - 1) {
          handleNext();
        }
      }

      setIsDragging(false);
      if (prefersReducedMotion) {
        dragX.set(0);
      } else {
        void animate(dragX, 0, {
          type: 'spring',
          damping: springConfigs.smooth.damping,
          stiffness: springConfigs.smooth.stiffness,
        });
      }
    },
    [isDragging, isZoomed, currentIndex, media.length, handlePrevious, handleNext, dragX, prefersReducedMotion]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handleDragStart(e.clientX);
    },
    [handleDragStart]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        handleDragMove(e.clientX);
      } else if (currentMedia?.type === 'video') {
        resetControlsTimeout();
      }
    },
    [isDragging, handleDragMove, currentMedia?.type, resetControlsTimeout]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      handleDragEnd(e.clientX);
    },
    [handleDragEnd]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches[0]) {
        handleDragStart(e.touches[0].clientX);
      }
    },
    [handleDragStart]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches[0] && isDragging) {
        handleDragMove(e.touches[0].clientX);
      }
    },
    [isDragging, handleDragMove]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (e.changedTouches[0]) {
        handleDragEnd(e.changedTouches[0].clientX);
      }
    },
    [handleDragEnd]
  );

  const handleImageClick = useCallback(() => {
    setIsZoomed(!isZoomed);
    haptics.selection();
  }, [isZoomed]);

  const handleVideoClick = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      void videoRef.current.play().catch(() => {
        // Play failed - silently fail
      });
    }
    resetControlsTimeout();
    haptics.impact();
  }, [isPlaying, resetControlsTimeout]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
    haptics.selection();
  }, [isMuted]);

  const handleSeek = useCallback(
    (value: number) => {
      if (!videoRef.current) return;
      videoRef.current.currentTime = value;
      setCurrentTime(value);
      resetControlsTimeout();
    },
    [resetControlsTimeout]
  );

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleDownload = useCallback(async () => {
    haptics.impact();
    try {
      const currentMedia = media[currentIndex];
      if (!currentMedia) {
        toast.error(t.community?.mediaNotAvailable || 'Media not available');
        return;
      }
      const isVideo = currentMedia.type === 'video';
      const url = isVideo ? (currentMedia as PostVideo).url : currentMedia.url;

      const response = await fetch(url);
      const blob = await response.blob();
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        throw new Error('Browser APIs not available');
      }
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `pawfectmatch-${currentMedia.id}.${isVideo ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success(t.community?.downloaded || `${isVideo ? 'Video' : 'Image'} downloaded`);
    } catch (error) {
      logger.error('Failed to download', error instanceof Error ? error : new Error('Failed to download media'));
      toast.error(t.community?.downloadError || 'Failed to download');
    }
  }, [currentIndex, media, t, logger]);

  const handleShare = useCallback(async () => {
    haptics.selection();
    const currentMedia = media[currentIndex];
    if (!currentMedia) {
      toast.error(t.community?.mediaNotAvailable || 'Media not available');
      return;
    }
    const isVideo = currentMedia.type === 'video';
    const url = isVideo ? (currentMedia as PostVideo).url : currentMedia.url;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${isVideo ? 'Video' : 'Photo'} by ${authorName}`,
          url,
        });
      } catch {
        // Share was cancelled by user - no need to log
      }
    } else {
      void navigator.clipboard
        .writeText(url)
        .then(() => {
          toast.success(t.community?.linkCopied || 'Link copied to clipboard');
        })
        .catch(() => {
          // Clipboard write failed - silently fail
        });
    }
  }, [currentIndex, media, authorName, t]);

  if (!currentMedia) {
    return null;
  }

  const isVideo = currentMedia.type === 'video';

  const dragOpacity = useTransform(dragX, [-200, 0, 200], [0.5, 1, 0.5], {
    clamp: true,
  });

  const headerOpacity = useMotionValue(showVideoControls || !isVideo ? 1 : 0);
  const headerTranslateY = useMotionValue(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      if (showVideoControls || !isVideo) {
        headerOpacity.set(1);
        headerTranslateY.set(0);
      } else {
        headerOpacity.set(0);
        headerTranslateY.set(-20);
      }
      return;
    }

    if (showVideoControls || !isVideo) {
      void animate(headerOpacity, 1, {
        duration: motionDurations.fast / 1000,
        ease: [0.2, 0, 0, 1],
      });
      void animate(headerTranslateY, 0, {
        duration: motionDurations.fast / 1000,
        ease: [0.2, 0, 0, 1],
      });
    } else {
      void animate(headerOpacity, 0, {
        duration: motionDurations.fast / 1000,
        ease: [0.2, 0, 0, 1],
      });
      void animate(headerTranslateY, -20, {
        duration: motionDurations.fast / 1000,
        ease: [0.2, 0, 0, 1],
      });
    }
  }, [showVideoControls, isVideo, headerOpacity, headerTranslateY, prefersReducedMotion]);

  const imageScale = useMotionValue(isZoomed ? 2 : 1);

  useEffect(() => {
    if (prefersReducedMotion) {
      imageScale.set(isZoomed ? 2 : 1);
    } else {
      void animate(imageScale, isZoomed ? 2 : 1, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
    }
  }, [isZoomed, imageScale, prefersReducedMotion]);

  const videoControlsOpacity = useMotionValue(showVideoControls ? 1 : 0);
  const videoControlsTranslateY = useMotionValue(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      if (showVideoControls) {
        videoControlsOpacity.set(1);
        videoControlsTranslateY.set(0);
      } else {
        videoControlsOpacity.set(0);
        videoControlsTranslateY.set(20);
      }
      return;
    }

    if (showVideoControls) {
      void animate(videoControlsOpacity, 1, {
        duration: motionDurations.fast / 1000,
        ease: [0.2, 0, 0, 1],
      });
      void animate(videoControlsTranslateY, 0, {
        duration: motionDurations.fast / 1000,
        ease: [0.2, 0, 0, 1],
      });
    } else {
      void animate(videoControlsOpacity, 0, {
        duration: motionDurations.fast / 1000,
        ease: [0.2, 0, 0, 1],
      });
      void animate(videoControlsTranslateY, 20, {
        duration: motionDurations.fast / 1000,
        ease: [0.2, 0, 0, 1],
      });
    }
  }, [showVideoControls, videoControlsOpacity, videoControlsTranslateY, prefersReducedMotion]);

  const playButtonHover = useHoverTap({
    hoverScale: 1.1,
    tapScale: 0.95,
  });

  const navButtonLeftOpacity = useMotionValue(currentIndex > 0 && showVideoControls ? 1 : 0);
  const navButtonLeftTranslateX = useMotionValue(-20);

  useEffect(() => {
    if (prefersReducedMotion) {
      if (currentIndex > 0 && showVideoControls) {
        navButtonLeftOpacity.set(1);
        navButtonLeftTranslateX.set(0);
      } else {
        navButtonLeftOpacity.set(0);
        navButtonLeftTranslateX.set(-20);
      }
      return;
    }

    if (currentIndex > 0 && showVideoControls) {
      void animate(navButtonLeftOpacity, 1, {
        duration: motionDurations.fast / 1000,
        ease: [0.2, 0, 0, 1],
      });
      void animate(navButtonLeftTranslateX, 0, {
        duration: motionDurations.fast / 1000,
        ease: [0.2, 0, 0, 1],
      });
    } else {
      void animate(navButtonLeftOpacity, 0, {
        duration: motionDurations.fast / 1000,
        ease: [0.2, 0, 0, 1],
      });
      void animate(navButtonLeftTranslateX, -20, {
        duration: motionDurations.fast / 1000,
        ease: [0.2, 0, 0, 1],
      });
    }
  }, [currentIndex, showVideoControls, navButtonLeftOpacity, navButtonLeftTranslateX, prefersReducedMotion]);

  const navButtonRightOpacity = useMotionValue(
    currentIndex < media.length - 1 && showVideoControls ? 1 : 0
  );
  const navButtonRightTranslateX = useMotionValue(20);

  useEffect(() => {
    if (prefersReducedMotion) {
      if (currentIndex < media.length - 1 && showVideoControls) {
        navButtonRightOpacity.set(1);
        navButtonRightTranslateX.set(0);
      } else {
        navButtonRightOpacity.set(0);
        navButtonRightTranslateX.set(20);
      }
      return;
    }

    if (currentIndex < media.length - 1 && showVideoControls) {
      void animate(navButtonRightOpacity, 1, {
        duration: motionDurations.fast / 1000,
        ease: [0.2, 0, 0, 1],
      });
      void animate(navButtonRightTranslateX, 0, {
        duration: motionDurations.fast / 1000,
        ease: [0.2, 0, 0, 1],
      });
    } else {
      void animate(navButtonRightOpacity, 0, {
        duration: motionDurations.fast / 1000,
        ease: [0.2, 0, 0, 1],
      });
      void animate(navButtonRightTranslateX, 20, {
        duration: motionDurations.fast / 1000,
        ease: [0.2, 0, 0, 1],
      });
    }
  }, [
    currentIndex,
    media.length,
    showVideoControls,
    navButtonRightOpacity,
    navButtonRightTranslateX,
    prefersReducedMotion,
  ]);

  const hintOpacity = useMotionValue(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      if (!isVideo) {
        hintOpacity.set(1);
      } else {
        hintOpacity.set(0);
      }
      return;
    }

    if (!isVideo) {
      setTimeout(() => {
        void animate(hintOpacity, 1, {
          duration: motionDurations.smooth / 1000,
          ease: [0.2, 0, 0, 1],
        });
      }, 500);
    } else {
      hintOpacity.set(0);
    }
  }, [isVideo, hintOpacity, prefersReducedMotion]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center"
          onPointerDownOutside={(e) => { e.preventDefault(); }}
        >
          <div
            className="relative w-full h-full flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {(showVideoControls || !isVideo) && (
              <motion.div
                style={{
                  opacity: headerOpacity,
                  y: headerTranslateY,
                }}
                className="absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/80 to-transparent"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { onOpenChange(false); }}
                      className="rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm"
                    >
                      <X size={24} />
                    </Button>
                    {authorName && (
                      <div className="text-white">
                        <p className="text-sm font-medium">{authorName}</p>
                        <p className="text-xs text-white/60">
                          {currentIndex + 1} / {media.length}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        void handleDownload();
                      }}
                      className="rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm"
                    >
                      <DownloadSimple size={22} weight="bold" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        void handleShare();
                      }}
                      className="rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm"
                    >
                      <Share size={22} weight="bold" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm"
                    >
                      <DotsThree size={22} weight="bold" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <SlideTransition direction={direction} isVisible={true}>
                <motion.div
                  style={{
                    x: dragX,
                    opacity: isVideo ? 1 : dragOpacity,
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {isVideo ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <video
                        ref={videoRef}
                        src={(currentMedia as PostVideo).url}
                        poster={(currentMedia as PostVideo).thumbnail}
                        className="max-w-full max-h-full object-contain"
                        playsInline
                        onClick={handleVideoClick}
                      />

                      {showVideoControls && (
                        <motion.div
                          style={{
                            opacity: videoControlsOpacity,
                            y: videoControlsTranslateY,
                          }}
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                          <motion.div
                            style={playButtonHover.animatedStyle as React.CSSProperties}
                            onMouseEnter={playButtonHover.handleMouseEnter}
                            onMouseLeave={playButtonHover.handleMouseLeave}
                            onClick={handleVideoClick}
                            className="pointer-events-auto w-20 h-20 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors cursor-pointer"
                          >
                            {isPlaying ? (
                              <Pause size={40} weight="fill" />
                            ) : (
                              <Play size={40} weight="fill" />
                            )}
                          </motion.div>
                        </motion.div>
                      )}

                      {showVideoControls && duration > 0 && !isNaN(duration) && (
                        <motion.div
                          style={{
                            opacity: videoControlsOpacity,
                            y: videoControlsTranslateY,
                          }}
                          className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent"
                        >
                          <div className="flex items-center gap-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleVideoClick}
                              className="h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm shrink-0"
                            >
                              {isPlaying ? (
                                <Pause size={20} weight="fill" />
                              ) : (
                                <Play size={20} weight="fill" />
                              )}
                            </Button>

                            <span className="text-white text-sm font-medium min-w-11">
                              {formatTime(currentTime)}
                            </span>

                            <Slider
                              value={currentTime}
                              max={duration || 0}
                              step={0.1}
                              onValueChange={handleSeek}
                              className="flex-1"
                              aria-label="Video timeline"
                            />

                            <span className="text-white/60 text-sm min-w-11 text-right">
                              {formatTime(duration || 0)}
                            </span>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={toggleMute}
                              className="h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm shrink-0"
                            >
                              {isMuted ? (
                                <SpeakerSlash size={20} weight="fill" />
                              ) : (
                                <SpeakerHigh size={20} weight="fill" />
                              )}
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <motion.div
                      style={{
                        scale: imageScale,
                      }}
                      onClick={handleImageClick}
                      className="max-w-full max-h-full cursor-zoom-in select-none"
                    >
                      <img
                        src={currentMedia.url}
                        alt={`Post media ${currentIndex + 1}`}
                        className="max-w-full max-h-full object-contain select-none"
                        draggable={false}
                      />
                    </motion.div>
                  )}
                </motion.div>
              </SlideTransition>
            </div>

            {media.length > 1 && (
              <>
                {currentIndex > 0 && (
                  <motion.div
                    style={{
                      opacity: navButtonLeftOpacity,
                      x: navButtonLeftTranslateX,
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-50"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handlePrevious}
                      className="h-12 w-12 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm"
                    >
                      <CaretLeft size={32} weight="bold" />
                    </Button>
                  </motion.div>
                )}

                {currentIndex < media.length - 1 && (
                  <motion.div
                    style={{
                      opacity: navButtonRightOpacity,
                      x: navButtonRightTranslateX,
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-50"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleNext}
                      className="h-12 w-12 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm"
                    >
                      <CaretRight size={32} weight="bold" />
                    </Button>
                  </motion.div>
                )}
              </>
            )}

            {media.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
                {media.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setDirection(index > currentIndex ? 1 : -1);
                      setCurrentIndex(index);
                      if (videoRef.current) {
                        videoRef.current.pause();
                      }
                      haptics.selection();
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`View ${media[index]?.type === 'video' ? 'video' : 'photo'} ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {!isVideo && (
              <motion.div
                style={{
                  opacity: hintOpacity,
                }}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/60 text-xs bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm"
              >
                {isZoomed
                  ? t.community?.tapToZoomOut || 'Tap to zoom out'
                  : t.community?.tapToZoom || 'Tap to zoom in'}
              </motion.div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

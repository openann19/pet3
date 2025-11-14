'use client';

import { getVideoThumbnails } from '@/core/services/media/video/thumbnails';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { ProgressiveImage } from '@/components/enhanced/ProgressiveImage';

export interface VideoTrimmerProps {
  uri: string;
  durationSec?: number;
  onChange: (startSec: number, endSec: number) => void;
}

export function VideoTrimmer({
  uri,
  durationSec = 0,
  onChange,
}: VideoTrimmerProps): React.ReactElement {
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [width, setWidth] = useState(0);
  const [startPos, setStartPos] = useState(0);
  const [endPos, setEndPos] = useState(0);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleW = 16;

  useEffect(() => {
    let cancelled = false;

    getVideoThumbnails(uri, 8).then((thumbnails) => {
      if (!cancelled) {
        setThumbs(thumbnails);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [uri]);

  useEffect(() => {
    if (width > 0 && endPos === 0) {
      setEndPos(width);
    }
  }, [width, endPos]);

  const pxToSec = useMemo(() => {
    return (px: number): number => {
      if (!width || durationSec === 0) {
        return 0;
      }
      return Math.max(0, Math.min(durationSec, (px / width) * durationSec));
    };
  }, [width, durationSec]);

  const update = useCallback(() => {
    const startSec = pxToSec(startPos);
    const endSec = pxToSec(endPos);
    onChange(Math.min(startSec, endSec), Math.max(startSec, endSec));
  }, [pxToSec, onChange, startPos, endPos]);

  useEffect(() => {
    update();
  }, [update]);

  const onLayout = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const w = e.currentTarget.offsetWidth;
    setWidth(w);
    if (endPos === 0) {
      setEndPos(w);
    }
  }, [endPos]);

  const getXFromEvent = useCallback((e: MouseEvent | React.MouseEvent): number => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    return e.clientX - rect.left;
  }, []);

  const handleMouseDownStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingStart(true);
  }, []);

  const handleMouseDownEnd = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingEnd(true);
  }, []);

  useEffect(() => {
    if (!isDraggingStart && !isDraggingEnd) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = getXFromEvent(e);
      if (isDraggingStart) {
        const newValue = Math.max(0, Math.min(x, endPos - handleW));
        setStartPos(newValue);
      } else if (isDraggingEnd) {
        const newValue = Math.min(width, Math.max(x, startPos + handleW));
        setEndPos(newValue);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingStart(false);
      setIsDraggingEnd(false);
      update();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingStart, isDraggingEnd, getXFromEvent, endPos, startPos, width, update]);

  const maskWidth = Math.max(handleW, endPos - startPos);
  const maskLeft = startPos;

  return (
    <div className="mb-4">
      <div className="text-sm font-bold text-foreground mb-2">Trim</div>
      <div
        ref={containerRef}
        className="relative h-18 rounded-lg overflow-hidden border border-border bg-muted"
        onMouseDown={onLayout}
      >
        <div className="flex w-full h-full">
          {thumbs.length > 0 ? (
            thumbs.map((thumb, i) => (
              <ProgressiveImage
                key={i}
                src={thumb}
                alt={`Thumbnail ${i + 1}`}
                className="flex-1 h-full object-cover"
                aria-label={`Video thumbnail ${i + 1}`}
              />
            ))
          ) : (
            <div className="flex-1 h-full bg-muted-foreground/20" />
          )}
        </div>

        <div
          className="absolute top-0 bottom-0 bg-black/40 pointer-events-none"
          style={{
            left: `${maskLeft}px`,
            width: `${maskWidth}px`,
          }}
        />

        <div
          className={cn(
            'absolute top-0 w-4 h-full bg-background/80 border-x border-border cursor-ew-resize z-10',
            'hover:bg-background/90 transition-colors'
          )}
          style={{
            left: `${startPos}px`,
          }}
          onMouseDown={handleMouseDownStart}
          role="slider"
          tabIndex={0}
          aria-label="Start trim handle"
          aria-valuemin={0}
          aria-valuemax={durationSec}
          aria-valuenow={pxToSec(startPos)}
        />

        <div
          className={cn(
            'absolute top-0 w-4 h-full bg-background/80 border-x border-border cursor-ew-resize z-10',
            'hover:bg-background/90 transition-colors'
          )}
          style={{
            left: `${endPos - handleW}px`,
          }}
          onMouseDown={handleMouseDownEnd}
          role="slider"
          tabIndex={0}
          aria-label="End trim handle"
          aria-valuemin={0}
          aria-valuemax={durationSec}
          aria-valuenow={pxToSec(endPos)}
        />
      </div>
    </div>
  );
}

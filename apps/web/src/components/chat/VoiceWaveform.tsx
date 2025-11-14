/**
 * Voice Waveform Component
 *
 * Renders animated voice message waveform using Framer Motion
 *
 * Location: apps/web/src/components/chat/VoiceWaveform.tsx
 */

'use client';
import { motion, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { useVoiceWaveform } from '@/effects/chat/media/use-voice-waveform';
import { useUIConfig } from "@/hooks/use-ui-config";
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface VoiceWaveformProps {
  waveform?: number[];
  duration?: number;
  currentTime?: number;
  isPlaying?: boolean;
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function VoiceWaveform({
  waveform = [],
  duration = 0,
  currentTime = 0,
  isPlaying = false,
  width = 200,
  height = 40,
  color = 'var(--color-accent-secondary-9)',
  className,
}: VoiceWaveformProps) {
  const _uiConfig = useUIConfig();
  const prefersReducedMotion = useReducedMotion();
  
  const { playheadProgress, waveformOpacity, animatedStyle, canvasRef, drawWaveform } = useVoiceWaveform({
    enabled: true,
    waveform,
    duration,
    currentTime,
    isPlaying,
    width,
    height,
    color,
  });

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  // Transform progress to percentage for left position
  const playheadLeft = useTransform(
    playheadProgress,
    (progress) => `${progress * 100}%`
  );

  return (
    <motion.div 
      style={{ opacity: waveformOpacity }}
      className={`relative ${className ?? ''}`}
      aria-label="Voice message waveform"
    >
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        className="w-full h-full"
        aria-hidden="true"
      />
      {isPlaying && (
        <motion.div
          style={{
            position: 'absolute',
            left: playheadLeft,
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: color,
            opacity: 0.8,
          }}
          transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 30 }}
          aria-hidden="true"
        />
      )}
    </motion.div>
  );
}

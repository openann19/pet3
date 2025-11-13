'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { motion, useMotionValue, animate, useTransform } from 'framer-motion';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { Microphone, X, Check } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createLogger } from '@/lib/logger';

const logger = createLogger('VoiceRecorder');

interface VoiceRecorderProps {
  onRecorded: (audioBlob: Blob, duration: number, waveform: number[]) => void;
  onCancel: () => void;
  maxDuration?: number;
}

export default function VoiceRecorder({
  onRecorded,
  onCancel,
  maxDuration = 120,
}: VoiceRecorderProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [duration, setDuration] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const audioContextRef = useRef<AudioContext | undefined>(undefined);
  const analyserRef = useRef<AnalyserNode | undefined>(undefined);
  const timerRef = useRef<number | undefined>(undefined);

  // Animation values
  const containerOpacity = useMotionValue(0);
  const containerScale = useMotionValue(0.9);
  const micScale = useMotionValue(1);

  useEffect(() => {
    void startRecording();

    if (reducedMotion) {
      containerOpacity.set(1);
      containerScale.set(1);
      micScale.set(1);
      return;
    }

    // Animate container in
    void animate(containerOpacity, 1, { duration: 0.3 });
    void animate(containerScale, 1, { duration: 0.3 });

    // Animate microphone icon
    void animate(micScale, [1.2, 1], {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    });

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, [containerOpacity, containerScale, micScale, prefersReducedMotion]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      mediaRecorder.addEventListener('dataavailable', (event) => {
        audioChunksRef.current.push(event.data);
      });

      mediaRecorder.start();
      visualize();

      if (typeof window !== 'undefined') {
        timerRef.current = window.setInterval(() => {
          setDuration((prev) => {
            if (prev >= maxDuration) {
              handleStopAndSend();
              return prev;
            }
            return prev + 1;
          });
        }, 1000);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to start recording');
      logger.error('Failed to start recording', err);
      toast.error('Unable to access microphone');
      onCancel();
    }
  };

  const visualize = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateWaveform = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      const normalized = Math.min(average / 128, 1);

      setWaveform((prev) => {
        const newWaveform = [...prev, normalized];
        return newWaveform.slice(-50);
      });

      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    };

    updateWaveform();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleStopAndSend = () => {
    stopRecording();

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.addEventListener(
        'stop',
        () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          onRecorded(audioBlob, duration, waveform);
        },
        { once: true }
      );
    }
  };

  const handleCancel = () => {
    stopRecording();
    onCancel();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      style={{
        opacity: containerOpacity,
        scale: containerScale,
      }}
      className="flex-1 flex items-center gap-3 glass-effect rounded-2xl p-3"
    >
      <motion.div
        style={{ scale: micScale }}
        className="shrink-0"
      >
        <Microphone size={24} weight="fill" className="text-red-500" />
      </motion.div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">Recording</span>
          <span className="text-xs text-muted-foreground">{formatDuration(duration)}</span>
          {maxDuration && (
            <span className="text-[10px] text-muted-foreground ml-auto">
              {formatDuration(maxDuration - duration)} left
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5 h-6">
          {waveform.map((value, idx) => (
            <WaveformBar key={idx} value={value} />
          ))}
        </div>
      </div>

      <Button
        size="icon"
        variant="ghost"
        onClick={handleCancel}
        className="shrink-0"
        aria-label="Cancel recording"
      >
        <X size={20} />
      </Button>

      <Button
        size="icon"
        onClick={handleStopAndSend}
        className="shrink-0 bg-linear-to-br from-primary to-accent"
        aria-label="Stop and send recording"
      >
        <Check size={20} weight="bold" />
      </Button>
    </motion.div>
  );
}

function WaveformBar({ value }: { value: number }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const height = useMotionValue(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      height.set(value * 100);
      return;
    }
    void animate(height, value * 100, { duration: 0.1 });
  }, [value, height, prefersReducedMotion]);

  return (
    <motion.div
      style={{ height: useTransform(height, (h) => `${h}%`) }}
      className="flex-1 bg-primary rounded-full"
    />
  );
}

// Memoize to prevent unnecessary re-renders
export const MemoizedVoiceRecorder = memo(VoiceRecorder);

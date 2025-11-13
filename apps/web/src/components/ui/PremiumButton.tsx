/**
 * Premium Button - KRASIVO Edition (Web)
 *
 * Showcases the complete motion system: press bounce, hover lift, magnetic
 * Feels more expensive than any competitor app
 */

'use client';

import { motion, useMotionValue, animate } from 'framer-motion';
import { useCallback, useState } from 'react';
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface PremiumButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  magnetic?: boolean;
  disabled?: boolean;
  className?: string;
  onPress: () => void;
}

export function PremiumButton({
  label,
  variant = 'primary',
  size = 'md',
  magnetic = false,
  disabled = false,
  className = '',
  onPress,
}: PremiumButtonProps) {
  const reducedMotion = useReducedMotion();
  
  // Motion values for animations
  const scale = useMotionValue(1);
  const translateY = useMotionValue(0);
  const magneticX = useMotionValue(0);
  const magneticY = useMotionValue(0);
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Press bounce handler
  const handlePressIn = useCallback(() => {
    if (disabled || reducedMotion) return;
    setIsPressed(true);
    void animate(scale, 0.94, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
  }, [disabled, reducedMotion, scale]);

  const handlePressOut = useCallback(() => {
    if (disabled || reducedMotion) return;
    setIsPressed(false);
    void animate(scale, 1, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    }).then(() => {
      onPress();
    });
  }, [disabled, reducedMotion, scale, onPress]);

  // Hover lift handler
  const handleMouseEnter = useCallback(() => {
    if (disabled || reducedMotion) return;
    setIsHovered(true);
    const liftAmount = size === 'lg' ? 8 : size === 'md' ? 6 : 4;
    void animate(translateY, -liftAmount, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
  }, [disabled, reducedMotion, translateY, size]);

  const handleMouseLeave = useCallback(() => {
    if (disabled || reducedMotion) return;
    setIsHovered(false);
    void animate(translateY, 0, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
  }, [disabled, reducedMotion, translateY]);

  // Magnetic effect handler
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!magnetic || disabled || reducedMotion) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = 80;
    
    const deltaX = (e.clientX - centerX) / distance;
    const deltaY = (e.clientY - centerY) / distance;
    
    void animate(magneticX, deltaX * 4, {
      type: 'spring',
      damping: 20,
      stiffness: 300,
    });
    void animate(magneticY, deltaY * 4, {
      type: 'spring',
      damping: 20,
      stiffness: 300,
    });
  }, [magnetic, disabled, reducedMotion, magneticX, magneticY]);

  // Base classes for styling
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };

  const variantClasses = {
    primary: 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 border-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    outline: 'bg-transparent border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  const allClasses = `${String(baseClasses ?? '')} ${String(sizeClasses[size] ?? '')} ${String(variantClasses[variant] ?? '')} ${String(disabledClasses ?? '')} ${String(className ?? '')}`;

  return (
    <motion.button
      className={allClasses}
      style={{
        scale,
        x: magnetic ? magneticX : 0,
        y: magnetic ? magneticY : translateY,
      }}
      onMouseDown={handlePressIn}
      onMouseUp={handlePressOut}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={magnetic ? handleMouseMove : undefined}
      disabled={disabled}
      type="button"
      whileHover={reducedMotion ? undefined : { scale: isPressed ? 0.94 : 1 }}
      whileTap={reducedMotion ? undefined : { scale: 0.94 }}
    >
      {label}
    </motion.button>
  );
}

PremiumButton.displayName = 'PremiumButton';

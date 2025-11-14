/**
 * StatsModal Component
 *
 * Modal for displaying user statistics.
 * Extracted from App.tsx to follow mobile screen patterns.
 */

import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import LoadingState from '@/components/LoadingState';
import StatsCard from '@/components/StatsCard';
import type { UseAppAnimationsReturn } from '@/hooks/use-app-animations';

interface StatsModalProps {
    isVisible: boolean;
    totalMatches: number;
    totalSwipes: number;
    successRate: number;
    animations: UseAppAnimationsReturn;
    onClose: () => void;
}

export function StatsModal({
    isVisible,
    totalMatches,
    totalSwipes,
    successRate,
    animations,
    onClose,
}: StatsModalProps): JSX.Element | null {
    if (!isVisible || totalSwipes <= 0) return null;

    const { statsModal, statsContent, closeButtonBounce } = animations;

    return (
        <AnimatedView
            style={statsModal.style}
            className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <AnimatedView
                style={statsContent.style}
                onClick={(e?: React.MouseEvent<Element>) => e?.stopPropagation()}
                className="max-w-2xl w-full"
            >
                <Suspense fallback={<LoadingState />}>
                    <StatsCard totalMatches={totalMatches} totalSwipes={totalSwipes} successRate={successRate} />
                </Suspense>
                <AnimatedView style={closeButtonBounce.animatedStyle}>
                    <Button variant="outline" className="w-full mt-4" onClick={onClose}>
                        Close
                    </Button>
                </AnimatedView>
            </AnimatedView>
        </AnimatedView>
    );
}

/**
 * AdminModal Component
 *
 * Modal for admin console.
 * Extracted from App.tsx to follow mobile screen patterns.
 */

import { Suspense } from 'react';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import LoadingState from '@/components/LoadingState';
import AdminConsole from '@/components/AdminConsole';
import type { UseAppAnimationsReturn } from '@/hooks/use-app-animations';

interface AdminModalProps {
  isVisible: boolean;
  animations: UseAppAnimationsReturn;
  onClose: () => void;
}

export function AdminModal({
  isVisible,
  animations,
  onClose,
}: AdminModalProps): JSX.Element | null {
  if (!isVisible) return null;

  const { adminModal, adminContent } = animations;

  return (
    <AnimatedView style={adminModal.style} className="fixed inset-0 z-50 bg-background">
      <AnimatedView style={adminContent.style} className="h-full w-full">
        <Suspense fallback={<LoadingState />}>
          <AdminConsole onClose={onClose} />
        </Suspense>
      </AnimatedView>
    </AnimatedView>
  );
}


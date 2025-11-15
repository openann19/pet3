// apps/web/src/components/calls/CallParticipantsGrid.tsx
'use client';

import type { CallSession } from '@petspark/core/calls/call-types';
import { CallParticipantTile } from './CallParticipantTile';

export interface CallParticipantsGridProps {
  readonly session: CallSession;
  readonly localStream: MediaStream | null;
  readonly remoteStream: MediaStream | null;
}

export function CallParticipantsGrid({
  session,
  localStream,
  remoteStream,
}: CallParticipantsGridProps): React.JSX.Element {
  const remote = session.remoteParticipant;
  const local = session.localParticipant;

  const remoteMuted = remote.microphone === 'muted';
  const remoteCameraOff = remote.camera === 'off';
  const localMuted = local.microphone === 'muted';
  const localCameraOff = local.camera === 'off';

  return (
    <div className="relative flex h-full w-full items-stretch justify-stretch">
      {/* Remote */}
      <div className="relative h-full w-full">
        <CallParticipantTile
          stream={remoteStream}
          displayName={remote.displayName}
          avatarUrl={remote.avatarUrl}
          isLocal={false}
          isMuted={remoteMuted}
          isCameraOff={remoteCameraOff}
          emphasis="primary"
          className="h-full w-full"
        />
      </div>

      {/* Local PIP */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-end px-4">
        <div className="pointer-events-auto w-36 max-w-[40%]">
          <CallParticipantTile
            stream={localStream}
            displayName={local.displayName}
            avatarUrl={local.avatarUrl}
            isLocal
            isMuted={localMuted}
            isCameraOff={localCameraOff}
            emphasis="secondary"
            className="h-24 w-full border-white/30"
          />
        </div>
      </div>
    </div>
  );
}

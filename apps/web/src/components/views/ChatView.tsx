'use client';

import { useEffect, useState, useCallback } from 'react';
import ChatRoomsList from '@/components/ChatRoomsList';
import ChatWindow from '@/components/ChatWindowNew';
import { ChatErrorBoundary } from '@/components/chat/window/ChatErrorBoundary';
import { useApp } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useStorage } from '@/hooks/use-storage';
import { getRoomMessages } from '@/lib/chat-service';
import type { ChatRoom } from '@/lib/chat-types';
import { createChatRoom } from '@/lib/chat-utils';
import { createLogger } from '@/lib/logger';
import type { Match, Pet } from '@/lib/types';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import { safeArrayAccess } from '@/lib/runtime-safety';
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import { cn } from '@/lib/utils';

const logger = createLogger('ChatView');

export default function ChatView() {
  const { t } = useApp();
  const [matches] = useStorage<Match[]>('matches', []);
  const [allPets] = useStorage<Pet[]>('all-pets', []);
  const [userPets] = useStorage<Pet[]>('user-pets', []);
  const [chatRooms, setChatRooms] = useStorage<ChatRoom[]>('chat-rooms', []);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  const userPet = safeArrayAccess(userPets, 0);

  useEffect(() => {
    if (userPets !== undefined && chatRooms !== undefined) {
      setIsLoading(false);
    }
  }, [userPets, chatRooms]);

  useEffect(() => {
    if (!userPet || !Array.isArray(matches)) {
      return;
    }

    const activeMatches = matches.filter((m) => m.status === 'active');
    const existingRoomIds = new Set(
      Array.isArray(chatRooms) ? chatRooms.map((r) => r.matchId) : []
    );

    const newRooms: ChatRoom[] = [];

    activeMatches.forEach((match) => {
      if (!existingRoomIds.has(match.id)) {
        const matchedPet = Array.isArray(allPets)
          ? allPets.find((p) => p.id === match.matchedPetId)
          : undefined;
        if (matchedPet && userPet) {
          newRooms.push(
            createChatRoom(
              match.id,
              match.petId,
              match.matchedPetId,
              userPet.name,
              matchedPet.name,
              userPet.photo,
              matchedPet.photo
            )
          );
        }
      }
    });

    if (newRooms.length > 0) {
      void setChatRooms((current) => (Array.isArray(current) ? [...current, ...newRooms] : newRooms));
    }
  }, [matches, userPet, allPets, chatRooms, setChatRooms]);

  useEffect(() => {
    const updateRoomsWithLastMessages = async () => {
      if (!Array.isArray(chatRooms)) {
        return;
      }

      const updatedRooms = await Promise.all(
        chatRooms.map(async (room) => {
          try {
            const result = await getRoomMessages(room.id);
            const messages = result.messages;
            if (Array.isArray(messages) && messages.length > 0) {
              const lastMessage = messages[messages.length - 1];
              const unreadCount = messages.filter(
                (m) => m.status !== 'read' && m.senderId !== userPet?.id
              ).length;

              return {
                ...room,
                ...(lastMessage && { lastMessage }),
                ...(unreadCount !== undefined && { unreadCount }),
                updatedAt: lastMessage?.timestamp ?? room.updatedAt,
              };
            }
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('Error loading messages', err);
          }
          return room;
        })
      );

      void setChatRooms(() => {
        const sorted = updatedRooms.sort((a, b) => {
          const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return bTime - aTime;
        });
        return sorted;
      });
    };

    void updateRoomsWithLastMessages();
  }, [selectedRoom, chatRooms, userPet, setChatRooms]);

  const handleSelectRoom = useCallback((room: ChatRoom) => {
    setSelectedRoom(room);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedRoom(null);
  }, []);

  if (isLoading) {
    return null;
  }

  if (!userPet) {
    return (
      <main aria-label="Chat view" className={cn('flex flex-col items-center justify-center min-h-[60vh] text-center', getSpacingClassesFromConfig({ paddingX: 'lg' }))}>
        <div className={cn('glass-strong rounded-3xl max-w-md', getSpacingClassesFromConfig({ padding: '2xl' }))}>
          <h1 className={cn(getTypographyClasses('h2'), getSpacingClassesFromConfig({ marginY: 'sm' }))}>{t.chat.createProfile}</h1>
          <p className={cn(getTypographyClasses('body'), 'text-muted-foreground')}>{t.chat.createProfileDesc}</p>
        </div>
      </main>
    );
  }

  const showChatWindow = selectedRoom && (!isMobile || selectedRoom);
  const showRoomsList = !isMobile || !selectedRoom;

  return (
    <PageTransitionWrapper key="chat-view" direction="up">
      <main aria-label="Chat view" className="h-[calc(100vh-8rem)]">
        <header className={getSpacingClassesFromConfig({ marginY: 'xl' })}>
          <h1 className={cn(getTypographyClasses('h2'), getSpacingClassesFromConfig({ marginY: 'sm' }))}>{t.chat.title}</h1>
          <p className={cn(getTypographyClasses('body'), 'text-muted-foreground')}>
            {(chatRooms || []).length}{' '}
            {(chatRooms || []).length === 1 ? t.chat.subtitle : t.chat.subtitlePlural}
          </p>
        </header>

        <div className={cn('grid grid-cols-1 md:grid-cols-12 h-[calc(100%-5rem)]', getSpacingClassesFromConfig({ gap: 'xl' }))}>
          {showRoomsList && (
            <section aria-label="Chat rooms" className="md:col-span-4 glass-strong rounded-3xl p-4 shadow-xl backdrop-blur-2xl border border-white/20 overflow-hidden">
              <ChatRoomsList
                rooms={chatRooms || []}
                onSelectRoom={handleSelectRoom}
                {...(selectedRoom?.id && { selectedRoomId: selectedRoom.id })}
              />
            </section>
          )}

          {showChatWindow && selectedRoom && (
            <section aria-label="Chat window" className={`${isMobile ? 'col-span-1' : 'md:col-span-8'
                } glass-strong rounded-3xl shadow-xl backdrop-blur-2xl border border-white/20 overflow-hidden flex flex-col`}>
              <ChatErrorBoundary>
                <ChatWindow
                  room={selectedRoom}
                  currentUserId={userPet.id}
                  currentUserName={userPet.name}
                  currentUserAvatar={userPet.photo}
                  {...(isMobile && { onBack: handleBack })}
                />
              </ChatErrorBoundary>
            </section>
          )}

          {!selectedRoom && !isMobile && (
            <section
              aria-label="Empty chat state"
              className="md:col-span-8 glass-effect rounded-3xl flex items-center justify-center border border-white/20"
              role="status"
              aria-live="polite"
            >
              <div className={cn('text-center', getSpacingClassesFromConfig({ paddingX: 'lg' }))}>
                <div className={cn('text-6xl', getSpacingClassesFromConfig({ marginY: 'lg' }))} aria-hidden="true">
                  💬
                </div>
                <h2 className={cn(getTypographyClasses('h3'), getSpacingClassesFromConfig({ marginY: 'sm' }))}>{t.chat.selectConversation}</h2>
                <p className={cn(getTypographyClasses('body'), 'text-muted-foreground')}>{t.chat.selectConversationDesc}</p>
              </div>
            </section>
          )}
        </div>
      </main>
    </PageTransitionWrapper>
  );
}

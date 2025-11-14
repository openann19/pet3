'use client';

import React, { Suspense, useState } from 'react';
import CallInterface from '@/components/call/CallInterface';
import CompatibilityBreakdown from '@/components/CompatibilityBreakdown';
import { DetailedPetAnalytics } from '@/components/enhanced/DetailedPetAnalytics';
import { EnhancedPetDetailView } from '@/components/enhanced/EnhancedPetDetailView';
import { PlaydateScheduler } from '@/components/lazy-exports';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/contexts/AppContext';
import { useCall } from '@/hooks/useCall';
import { useMatches } from '@/hooks/useMatches';
import { haptics } from '@/lib/haptics';
import { calculateCompatibility, getCompatibilityFactors } from '@/lib/matching';
import type { Match, Pet } from '@/lib/types';
import {
  Calendar,
  ChartBar,
  ChatCircle,
  Heart,
  Phone,
  VideoCamera,
} from 'phosphor-react';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useAnimatePresence } from '@/effects/reanimated/use-animate-presence';
import { useHoverLift } from '@/effects/reanimated/use-hover-lift';
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap';
import { cn } from '@/lib/utils';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';

interface MatchesViewProps {
  readonly onNavigateToChat?: (matchId: string) => void;
}

export default function MatchesView({ onNavigateToChat }: MatchesViewProps) {
  const { t } = useApp();
  const {
    matchedPets,
    userPet,
    selectedPet,
    selectedMatch,
    matchReasoning,
    isLoading,
    selectPet,
    clearSelection,
  } = useMatches();

  const { activeCall, initiateCall, endCall } = useCall();

  const [playdatePet, setPlaydatePet] = useState<(Pet & { match: Match }) | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const presence = useAnimatePresence({ isVisible: !isLoading });

  const handleStartChat = (pet: Pet & { match: Match }) => {
    if (onNavigateToChat) {
      onNavigateToChat(pet.match.id);
    }
  };

  const handleSchedulePlaydate = (pet: Pet & { match: Match }) => {
    setPlaydatePet(pet);
  };

  const handleVideoCall = (pet: Pet & { match: Match }) => {
    const petId = typeof pet.id === 'string' ? pet.id : String(pet.id ?? '');
    const petName = typeof pet.name === 'string' ? pet.name : 'Pet';
    const petPhoto = typeof pet.photo === 'string' ? pet.photo : undefined;
    void initiateCall(petId, petName, petPhoto, 'video');
  };

  const handleVoiceCall = (pet: Pet & { match: Match }) => {
    const petId = typeof pet.id === 'string' ? pet.id : String(pet.id ?? '');
    const petName = typeof pet.name === 'string' ? pet.name : 'Pet';
    const petPhoto = typeof pet.photo === 'string' ? pet.photo : undefined;
    void initiateCall(petId, petName, petPhoto, 'voice');
  };

  if (isLoading) {
    return (
      <PageTransitionWrapper>
        <div className="flex items-center justify-center h-full">
          <p>Loading matches...</p>
        </div>
      </PageTransitionWrapper>
    );
  }

  return (
    <PageTransitionWrapper>
      <AnimatedView style={presence.animatedStyle} className="h-full">
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">{t.matches?.title ?? 'Matches'}</h1>

          {matchedPets.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">{t.matches?.empty ?? 'No matches yet'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchedPets.map((pet) => (
                <div
                  key={pet.id}
                  className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => selectPet(pet.id)}
                >
                  <div className="aspect-square relative mb-4">
                    {pet.photo && (
                      <img
                        src={pet.photo}
                        alt={pet.name}
                        className="w-full h-full object-cover rounded-md"
                      />
                    )}
                  </div>
                  <h3 className="font-semibold text-lg">{pet.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {pet.breed} • {pet.age} years
                  </p>
                  {pet.match && (
                    <div className="mt-2 flex items-center gap-2">
                      <Heart weight="fill" className="text-red-500" size={16} />
                      <span className="text-sm">
                        {pet.match.compatibilityScore}% match
                      </span>
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartChat(pet);
                      }}
                    >
                      <ChatCircle size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVideoCall(pet);
                      }}
                    >
                      <VideoCamera size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVoiceCall(pet);
                      }}
                    >
                      <Phone size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSchedulePlaydate(pet);
                      }}
                    >
                      <Calendar size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pet Detail Dialog */}
        {selectedPet && selectedMatch && userPet && (
          <Dialog open={!!selectedPet} onOpenChange={() => clearSelection()}>
            <DialogContent className="max-w-4xl">
              <Tabs defaultValue="details">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="compatibility">Compatibility</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                  <EnhancedPetDetailView pet={selectedPet} onClose={() => setSelectedPet(null)} />
                </TabsContent>
                <TabsContent value="compatibility">
                  <CompatibilityBreakdown
                    userPet={userPet}
                    otherPet={selectedPet}
                    factors={getCompatibilityFactors(userPet, selectedPet)}
                    score={calculateCompatibility(userPet, selectedPet)}
                  />
                </TabsContent>
                <TabsContent value="analytics">
                  <DetailedPetAnalytics pet={selectedPet} />
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}

        {/* Playdate Scheduler Dialog */}
        {playdatePet && userPet && (
          <Dialog open={!!playdatePet} onOpenChange={() => setPlaydatePet(null)}>
            <DialogContent>
              <Suspense fallback={<div>Loading...</div>}>
                <PlaydateScheduler
                  match={playdatePet.match}
                  userPet={userPet}
                  onClose={() => setPlaydatePet(null)}
                  onStartVideoCall={() => {
                    const petId = typeof playdatePet.id === 'string' ? playdatePet.id : String(playdatePet.id ?? '');
                    const petName = typeof playdatePet.name === 'string' ? playdatePet.name : 'Pet';
                    const petPhoto = typeof playdatePet.photo === 'string' ? playdatePet.photo : undefined;
                    void initiateCall(petId, petName, petPhoto, 'video');
                    setPlaydatePet(null);
                  }}
                  onStartVoiceCall={() => {
                    const petId = typeof playdatePet.id === 'string' ? playdatePet.id : String(playdatePet.id ?? '');
                    const petName = typeof playdatePet.name === 'string' ? playdatePet.name : 'Pet';
                    const petPhoto = typeof playdatePet.photo === 'string' ? playdatePet.photo : undefined;
                    void initiateCall(petId, petName, petPhoto, 'voice');
                    setPlaydatePet(null);
                  }}
                />
              </Suspense>
            </DialogContent>
          </Dialog>
        )}

        {/* Active Call Interface */}
        {activeCall && <CallInterface call={activeCall} onEndCall={endCall} />}
      </AnimatedView>
    </PageTransitionWrapper>
  );
}

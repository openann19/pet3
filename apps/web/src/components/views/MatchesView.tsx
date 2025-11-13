import React from 'react';
import CallInterface from '@/components/call/CallInterface';
import CompatibilityBreakdown from '@/components/CompatibilityBreakdown';
import { DetailedPetAnalytics } from '@/components/enhanced/DetailedPetAnalytics';
import { EnhancedPetDetailView } from '@/components/enhanced/EnhancedPetDetailView';
import { Suspense } from 'react';
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
          }>
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

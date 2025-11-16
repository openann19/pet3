'use client';

import { MotionView } from "@petspark/motion";
import { useState, useCallback } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ChartBar,
  Flag,
  Users,
  ShieldCheck,
  Gear,
  SignOut,
  ListBullets,
  Eye,
  ChatCircle,
  Image,
  ChartLine,
  MapTrifold,
  MapPin,
  IdentificationCard,
  Key,
  CreditCard,
  X,
  Heart,
  UsersThree,
  ClipboardText,
  ArrowLeft,
  Headset,
} from '@phosphor-icons/react';
import { useSidebarAnimation } from '@/effects/reanimated/use-sidebar-animation';
import { useAnimatedStyleValue } from '@/effects/reanimated/animated-view';
import { cn } from '@/lib/utils';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AdminLayout');

type AdminView =
  | 'dashboard'
  | 'reports'
  | 'users'
  | 'content'
  | 'verification'
  | 'settings'
  | 'map-settings'
  | 'audit'
  | 'performance'
  | 'system-map'
  | 'moderation'
  | 'content-moderation'
  | 'kyc'
  | 'api-config'
  | 'subscriptions'
  | 'community'
  | 'adoption'
  | 'adoption-applications'
  | 'adoption-listings'
  | 'lost-found'
  | 'live-streams'
  | 'business-config'
  | 'chat-moderation'
  | 'support-chat';

interface AdminUser {
  name: string;
  role?: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  currentView: AdminView;
  onViewChange: (view: AdminView) => void;
  onExit?: () => void;
}

const MENU_ITEMS = [
  { id: 'dashboard' as AdminView, label: 'Dashboard', icon: ChartBar },
  { id: 'subscriptions' as AdminView, label: 'Subscriptions', icon: CreditCard },
  { id: 'business-config' as AdminView, label: 'Business Config', icon: Gear },
  { id: 'reports' as AdminView, label: 'Reports', icon: Flag },
  { id: 'users' as AdminView, label: 'Users', icon: Users },
  { id: 'community' as AdminView, label: 'Community Posts', icon: UsersThree },
  { id: 'adoption' as AdminView, label: 'Adoption Profiles', icon: Heart },
  {
    id: 'adoption-applications' as AdminView,
    label: 'Adoption Applications',
    icon: ClipboardText,
  },
  { id: 'content' as AdminView, label: 'Content', icon: Image },
  { id: 'moderation' as AdminView, label: 'Photo Moderation', icon: Eye },
  { id: 'content-moderation' as AdminView, label: 'Content Moderation', icon: ShieldCheck },
  { id: 'chat-moderation' as AdminView, label: 'Chat Moderation', icon: ChatCircle },
  { id: 'support-chat' as AdminView, label: 'Support Tickets', icon: Headset },
  { id: 'kyc' as AdminView, label: 'KYC Verification', icon: IdentificationCard },
  { id: 'verification' as AdminView, label: 'Verification', icon: ShieldCheck },
  { id: 'performance' as AdminView, label: 'Performance', icon: ChartLine },
  { id: 'system-map' as AdminView, label: 'System Map', icon: MapTrifold },
  { id: 'map-settings' as AdminView, label: 'Map Configuration', icon: MapPin },
  { id: 'api-config' as AdminView, label: 'API Configuration', icon: Key },
  { id: 'audit' as AdminView, label: 'Audit Log', icon: ListBullets },
  { id: 'settings' as AdminView, label: 'Settings', icon: Gear },
];

interface SidebarHeaderProps {
  sidebarOpen: boolean;
  opacityStyle: React.CSSProperties;
  onExit?: () => void;
  onNavigateHome: () => void;
}

function SidebarHeader({ sidebarOpen, opacityStyle, onExit, onNavigateHome }: SidebarHeaderProps) {
  return (
    <div className="p-4 sm:p-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary via-accent to-secondary flex items-center justify-center shrink-0">
          <ShieldCheck className="text-white" size={20} weight="fill" />
        </div>
        {sidebarOpen && (
          <MotionView style={opacityStyle} className="min-w-0">
            <h2 className="font-bold text-lg truncate">Admin Console</h2>
            <p className="text-xs text-muted-foreground truncate">Moderation & Management</p>
          </MotionView>
        )}
      </div>
      {onExit
        ? sidebarOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onExit}
              className="rounded-full hover:bg-destructive/10 shrink-0 w-10 h-10 p-0"
              aria-label="Exit Admin Console"
            >
              <X size={20} className="text-muted-foreground hover:text-destructive" />
            </Button>
          )
        : sidebarOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onNavigateHome}
              className="rounded-full hover:bg-primary/10 shrink-0 w-10 h-10 p-0"
              aria-label="Go to Main App"
              title="Go to Main App"
            >
              <ArrowLeft size={20} className="text-muted-foreground hover:text-primary" />
            </Button>
          )}
    </div>
  );
}

interface SidebarNavigationProps {
  menuItems: typeof MENU_ITEMS;
  currentView: AdminView;
  sidebarOpen: boolean;
  onViewChange: (view: AdminView) => void;
}

function SidebarNavigation({ menuItems, currentView, sidebarOpen, onViewChange }: SidebarNavigationProps) {
  return (
    <ScrollArea className="flex-1 px-3 py-4">
      <nav className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <Button
              key={item.id}
              variant={isActive ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start gap-3 h-11',
                !sidebarOpen && 'justify-center px-2'
              )}
              onClick={() => { onViewChange(item.id); }}
              title={!sidebarOpen ? item.label : undefined}
            >
              <Icon size={20} weight={isActive ? 'fill' : 'regular'} className="shrink-0" />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </Button>
          );
        })}
      </nav>
    </ScrollArea>
  );
}

interface SidebarFooterProps {
  currentUser: AdminUser | null;
  sidebarOpen: boolean;
  onExit?: () => void;
  onNavigateHome: () => void;
  onSidebarToggle: () => void;
}

function SidebarFooter({ currentUser, sidebarOpen, onExit, onNavigateHome, onSidebarToggle }: SidebarFooterProps) {
  return (
    <div className="p-3 space-y-2 shrink-0">
      {currentUser && sidebarOpen && (
        <div className="px-3 py-2 text-sm">
          <p className="font-semibold truncate">{currentUser.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {currentUser.role ?? 'Admin'}
          </p>
        </div>
      )}

      {!onExit && (
        <Button
          variant="ghost"
          className={cn('w-full justify-start gap-3', !sidebarOpen && 'justify-center')}
          onClick={onNavigateHome}
          title={!sidebarOpen ? 'Go to Main App' : undefined}
        >
          <ArrowLeft size={20} className="shrink-0" />
          {sidebarOpen && <span>Main App</span>}
        </Button>
      )}

      <Button
        variant="ghost"
        className={cn('w-full justify-start gap-3', !sidebarOpen && 'justify-center')}
        onClick={() => {
          logger.info('Sign out clicked - handler not implemented');
        }}
        title={!sidebarOpen ? 'Sign Out' : undefined}
      >
        <SignOut size={20} className="shrink-0" />
        {sidebarOpen && <span>Sign Out</span>}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="w-full"
        onClick={onSidebarToggle}
        title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {sidebarOpen ? '←' : '→'}
      </Button>
    </div>
  );
}

function safeExecute<T>(fn: () => T, errorMessage: string, context?: Record<string, unknown>): T | void {
  try {
    return fn();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(errorMessage, err, context);
  }
}

function useAdminHandlers(onViewChange: (view: AdminView) => void, onExit?: () => void) {
  const handleViewChange = useCallback(
    (view: AdminView) => {
      safeExecute(() => onViewChange(view), 'Failed to change view', { view });
    },
    [onViewChange]
  );

  const handleExit = useCallback(() => {
    safeExecute(() => onExit?.(), 'Failed to exit admin console');
  }, [onExit]);

  const handleNavigateHome = useCallback(() => {
    safeExecute(() => { window.location.href = '/'; }, 'Failed to navigate to main app');
  }, []);

  return { handleViewChange, handleExit, handleNavigateHome };
}

function useAdminLayoutHandlers(
  onViewChange: (view: AdminView) => void,
  onExit?: () => void
) {
  const [currentUser] = useStorage<AdminUser | null>('current-user', null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sidebarAnimation = useSidebarAnimation({
    isOpen: sidebarOpen,
    openWidth: 280,
    closedWidth: 80,
    enableOpacity: true,
  });

  const handlers = useAdminHandlers(onViewChange, onExit);
  const handleSidebarToggle = useCallback(() => {
    safeExecute(() => setSidebarOpen((prev) => !prev), 'Failed to toggle sidebar');
  }, []);

  const widthStyle = useAnimatedStyleValue(sidebarAnimation.widthStyle);
  const opacityStyle = useAnimatedStyleValue(sidebarAnimation.opacityStyle);

  return {
    currentUser,
    sidebarOpen,
    widthStyle,
    opacityStyle,
    ...handlers,
    handleSidebarToggle,
  };
}

export default function AdminLayout({
  children,
  currentView,
  onViewChange,
  onExit,
}: AdminLayoutProps) {
  const {
    currentUser,
    sidebarOpen,
    widthStyle,
    opacityStyle,
    handleSidebarToggle,
    handleViewChange,
    handleExit,
    handleNavigateHome,
  } = useAdminLayoutHandlers(onViewChange, onExit);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <MotionView
        style={widthStyle}
        className="border-r border-border bg-card flex flex-col shrink-0"
      >
        <SidebarHeader
          sidebarOpen={sidebarOpen}
          opacityStyle={opacityStyle}
          onExit={onExit ? handleExit : undefined}
          onNavigateHome={handleNavigateHome}
        />

        <Separator />

        <SidebarNavigation
          menuItems={MENU_ITEMS}
          currentView={currentView}
          sidebarOpen={sidebarOpen}
          onViewChange={handleViewChange}
        />

        <Separator />

        <SidebarFooter
          currentUser={currentUser}
          sidebarOpen={sidebarOpen}
          onExit={onExit}
          onNavigateHome={handleNavigateHome}
          onSidebarToggle={handleSidebarToggle}
        />
      </MotionView>
      <main className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8 min-h-full">{children}</div>
      </main>
    </div>
  );
}

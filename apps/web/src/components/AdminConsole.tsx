import { useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import AdminLayout from '@/components/admin/AdminLayout'
import DashboardView from '@/components/admin/DashboardView'
import ReportsView from '@/components/admin/ReportsView'
import UsersView from '@/components/admin/UsersView'
import ContentView from '@/components/admin/ContentView'
import AuditLogView from '@/components/admin/AuditLogView'
import SettingsView from '@/components/admin/SettingsView'
import MapSettingsView from '@/components/admin/MapSettingsView'
import PerformanceMonitoring from '@/components/admin/PerformanceMonitoring'
import SystemMap from '@/components/admin/SystemMap'
import { ModerationQueue } from '@/components/admin/ModerationQueue'
import { KYCManagement } from '@/components/admin/KYCManagement'
import { VerificationReviewDashboard } from '@/components/admin/VerificationReviewDashboard'
import APIConfigView from '@/components/admin/APIConfigView'
import { SubscriptionAdminPanel } from '@/components/payments/SubscriptionAdminPanel'
import CommunityManagement from '@/components/admin/CommunityManagement'
import AdoptionManagement from '@/components/admin/AdoptionManagement'
import AdoptionApplicationReview from '@/components/admin/AdoptionApplicationReview'
import { AdoptionListingReview } from '@/components/admin/AdoptionListingReview'
import { LostFoundManagement } from '@/components/admin/LostFoundManagement'
import { LiveStreamManagement } from '@/components/admin/LiveStreamManagement'
import BusinessConfigPanel from '@/components/admin/BusinessConfigPanel'
import ChatModerationPanel from '@/components/admin/ChatModerationPanel'
import { ContentModerationQueue } from '@/components/admin/ContentModerationQueue'

type AdminView = 'dashboard' | 'reports' | 'users' | 'content' | 'verification' | 'settings' | 'map-settings' | 'audit' | 'performance' | 'system-map' | 'moderation' | 'content-moderation' | 'kyc' | 'api-config' | 'subscriptions' | 'community' | 'adoption' | 'adoption-applications' | 'adoption-listings' | 'lost-found' | 'live-streams' | 'business-config' | 'chat-moderation'

interface AdminConsoleProps {
  onClose?: () => void
}

export default function AdminConsole({ onClose }: AdminConsoleProps) {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard')

  return (
    <>
      <AdminLayout currentView={currentView} onViewChange={setCurrentView} onExit={onClose}>
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'subscriptions' && <SubscriptionAdminPanel />}
        {currentView === 'business-config' && <BusinessConfigPanel />}
        {currentView === 'reports' && <ReportsView />}
        {currentView === 'users' && <UsersView />}
        {currentView === 'community' && <CommunityManagement />}
        {currentView === 'adoption' && <AdoptionManagement />}
        {currentView === 'adoption-applications' && <AdoptionApplicationReview />}
        {currentView === 'adoption-listings' && <AdoptionListingReview />}
        {currentView === 'lost-found' && <LostFoundManagement />}
        {currentView === 'live-streams' && <LiveStreamManagement />}
        {currentView === 'content' && <ContentView />}
        {currentView === 'moderation' && <ModerationQueue />}
        {currentView === 'content-moderation' && <ContentModerationQueue />}
        {currentView === 'chat-moderation' && <ChatModerationPanel />}
        {currentView === 'kyc' && <KYCManagement />}
        {currentView === 'audit' && <AuditLogView />}
        {currentView === 'settings' && <SettingsView />}
        {currentView === 'api-config' && <APIConfigView />}
        {currentView === 'map-settings' && <MapSettingsView />}
        {currentView === 'performance' && <PerformanceMonitoring />}
        {currentView === 'system-map' && <SystemMap />}
        {currentView === 'verification' && <VerificationReviewDashboard />}
      </AdminLayout>
      <Toaster />
    </>
  )
}

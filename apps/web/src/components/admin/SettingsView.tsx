import { useStorage } from '@/hooks/useStorage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'

interface FeatureFlags {
  enableChat: boolean
  enableVisualAnalysis: boolean
  enableMatching: boolean
  enableReporting: boolean
  enableVerification: boolean
}

interface SystemSettings {
  maxReportsPerUser: number
  autoModeration: boolean
  requireVerification: boolean
  matchDistanceRadius: number
  messagingEnabled: boolean
}

export default function SettingsView() {
  const [featureFlags, setFeatureFlags] = useStorage<FeatureFlags>('admin-feature-flags', {
    enableChat: true,
    enableVisualAnalysis: true,
    enableMatching: true,
    enableReporting: true,
    enableVerification: true
  })

  const [systemSettings, setSystemSettings] = useStorage<SystemSettings>('admin-system-settings', {
    maxReportsPerUser: 10,
    autoModeration: false,
    requireVerification: false,
    matchDistanceRadius: 50,
    messagingEnabled: true
  })

  const handleFeatureFlagChange = (key: keyof FeatureFlags, value: boolean) => {
    setFeatureFlags((current: FeatureFlags) => ({ ...current, [key]: value }))
    toast.success(`Feature ${value ? 'enabled' : 'disabled'}`)
  }

  const handleSystemSettingChange = (key: keyof SystemSettings, value: any) => {
    setSystemSettings((current: SystemSettings) => ({ ...current, [key]: value }))
    toast.success('Setting updated')
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-border p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure system settings and feature flags
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>
                Enable or disable platform features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FeatureFlagItem
                label="Chat System"
                description="Allow users to send messages to matched pets"
                checked={featureFlags?.enableChat ?? true}
                onCheckedChange={(checked: boolean) => handleFeatureFlagChange('enableChat', checked)}
              />

              <Separator />

              <FeatureFlagItem
                label="AI Visual Analysis"
                description="Enable AI-powered pet photo analysis and attribute extraction"
                checked={featureFlags?.enableVisualAnalysis ?? true}
                onCheckedChange={(checked: boolean) => handleFeatureFlagChange('enableVisualAnalysis', checked)}
              />

              <Separator />

              <FeatureFlagItem
                label="Matching System"
                description="Allow users to swipe and match with compatible pets"
                checked={featureFlags?.enableMatching ?? true}
                onCheckedChange={(checked: boolean) => handleFeatureFlagChange('enableMatching', checked)}
              />

              <Separator />

              <FeatureFlagItem
                label="Reporting System"
                description="Allow users to report inappropriate content or behavior"
                checked={featureFlags?.enableReporting ?? true}
                onCheckedChange={(checked: boolean) => handleFeatureFlagChange('enableReporting', checked)}
              />

              <Separator />

              <FeatureFlagItem
                label="Verification System"
                description="Require users to verify their identity and pet ownership"
                checked={featureFlags?.enableVerification ?? true}
                onCheckedChange={(checked: boolean) => handleFeatureFlagChange('enableVerification', checked)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure platform behavior and limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Max Reports Per User (Daily)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[systemSettings?.maxReportsPerUser ?? 10]}
                    onValueChange={([value]) => handleSystemSettingChange('maxReportsPerUser', value)}
                    min={1}
                    max={50}
                    step={1}
                    className="flex-1"
                  />
                  <span className="w-12 text-right font-medium">
                    {systemSettings?.maxReportsPerUser ?? 10}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Maximum number of reports a user can submit per day
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Match Distance Radius (km)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[systemSettings?.matchDistanceRadius ?? 50]}
                    onValueChange={([value]) => handleSystemSettingChange('matchDistanceRadius', value)}
                    min={1}
                    max={200}
                    step={5}
                    className="flex-1"
                  />
                  <span className="w-12 text-right font-medium">
                    {systemSettings?.matchDistanceRadius ?? 50}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Maximum distance for pet matching suggestions
                </p>
              </div>

              <Separator />

              <FeatureFlagItem
                label="Auto Moderation"
                description="Automatically flag and hide potentially inappropriate content using AI"
                checked={systemSettings?.autoModeration ?? false}
                onCheckedChange={(checked: boolean) => handleSystemSettingChange('autoModeration', checked)}
              />

              <Separator />

              <FeatureFlagItem
                label="Require Verification"
                description="Require all users to verify their identity before accessing features"
                checked={systemSettings?.requireVerification ?? false}
                onCheckedChange={(checked: boolean) => handleSystemSettingChange('requireVerification', checked)}
              />

              <Separator />

              <FeatureFlagItem
                label="Messaging Enabled"
                description="Allow users to send and receive messages (global toggle)"
                checked={systemSettings?.messagingEnabled ?? true}
                onCheckedChange={(checked: boolean) => handleSystemSettingChange('messagingEnabled', checked)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>
                Platform version and environment details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Version" value="1.0.0" />
              <Separator />
              <InfoRow label="Environment" value="Development" />
              <Separator />
              <InfoRow label="API Endpoint" value="/api/v1" />
              <Separator />
              <InfoRow label="Build" value={new Date().toISOString().split('T')[0] ?? new Date().toISOString()} />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}

interface FeatureFlagItemProps {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

function FeatureFlagItem({ label, description, checked, onCheckedChange }: FeatureFlagItemProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1 flex-1">
        <Label className="text-base">{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm text-muted-foreground">{value}</span>
    </div>
  )
}

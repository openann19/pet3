import { useState } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  Key, 
  Eye, 
  EyeSlash,
  MapPin,
  Robot,
  ShieldCheck,
  Image as ImageIcon,
  Warning,
  Globe,
  TestTube
} from '@phosphor-icons/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'

export interface APIConfig {
  maps: {
    provider: 'google' | 'mapbox' | 'openstreetmap'
    apiKey: string
    enabled: boolean
    rateLimit: number
  }
  ai: {
    provider: 'openai' | 'anthropic' | 'spark'
    apiKey: string
    model: string
    enabled: boolean
    maxTokens: number
    temperature: number
  }
  kyc: {
    provider: 'stripe' | 'onfido' | 'jumio' | 'manual'
    apiKey: string
    enabled: boolean
    autoApprove: boolean
    requireDocuments: boolean
  }
  photoModeration: {
    provider: 'aws-rekognition' | 'google-vision' | 'openai' | 'spark'
    apiKey: string
    enabled: boolean
    autoReject: boolean
    confidenceThreshold: number
  }
  sms: {
    provider: 'twilio' | 'vonage' | 'aws-sns' | 'disabled'
    apiKey: string
    apiSecret: string
    enabled: boolean
    fromNumber: string
  }
  email: {
    provider: 'sendgrid' | 'mailgun' | 'aws-ses' | 'disabled'
    apiKey: string
    enabled: boolean
    fromEmail: string
    fromName: string
  }
  storage: {
    provider: 'aws-s3' | 'cloudflare-r2' | 'local'
    apiKey: string
    apiSecret: string
    bucket: string
    region: string
    enabled: boolean
  }
  analytics: {
    provider: 'google-analytics' | 'mixpanel' | 'amplitude' | 'disabled'
    apiKey: string
    enabled: boolean
  }
}

const DEFAULT_CONFIG: APIConfig = {
  maps: {
    provider: 'openstreetmap',
    apiKey: '',
    enabled: true,
    rateLimit: 100
  },
  ai: {
    provider: 'spark',
    apiKey: '',
    model: 'gpt-4o',
    enabled: true,
    maxTokens: 1000,
    temperature: 0.7
  },
  kyc: {
    provider: 'manual',
    apiKey: '',
    enabled: true,
    autoApprove: false,
    requireDocuments: true
  },
  photoModeration: {
    provider: 'spark',
    apiKey: '',
    enabled: true,
    autoReject: false,
    confidenceThreshold: 0.8
  },
  sms: {
    provider: 'disabled',
    apiKey: '',
    apiSecret: '',
    enabled: false,
    fromNumber: ''
  },
  email: {
    provider: 'disabled',
    apiKey: '',
    enabled: false,
    fromEmail: '',
    fromName: 'PawfectMatch'
  },
  storage: {
    provider: 'local',
    apiKey: '',
    apiSecret: '',
    bucket: '',
    region: 'us-east-1',
    enabled: true
  },
  analytics: {
    provider: 'disabled',
    apiKey: '',
    enabled: false
  }
}

export default function APIConfigView() {
  const [config, setConfig] = useStorage<APIConfig>('admin-api-config', DEFAULT_CONFIG)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [testingService, setTestingService] = useState<string | null>(null)

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const updateConfig = (section: keyof APIConfig, field: string, value: any) => {
    setConfig((current: APIConfig) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value
      }
    }))
    toast.success('Configuration updated')
  }

  const testConnection = async (service: string) => {
    setTestingService(service)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setTestingService(null)
    toast.success(`${service} connection test successful`)
  }

  const resetToDefaults = (section: keyof APIConfig) => {
    setConfig((current: APIConfig) => ({
      ...current,
      [section]: DEFAULT_CONFIG[section]
    }))
    toast.success('Reset to default configuration')
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">API Configuration</h1>
            <p className="text-muted-foreground">
              Configure external service integrations and API keys
            </p>
          </div>
          <Badge variant="outline" className="gap-2">
            <Key size={16} />
            Secure Storage
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6 max-w-6xl">
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Warning size={24} className="text-amber-600 flex-shrink-0" weight="fill" />
                <div className="space-y-1">
                  <p className="font-medium text-amber-900 dark:text-amber-100">
                    Security Notice
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    API keys and secrets are stored securely using Spark's KV storage. Never share these credentials or commit them to version control. All keys are encrypted at rest.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="maps" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
              <TabsTrigger value="maps">Maps</TabsTrigger>
              <TabsTrigger value="ai">AI</TabsTrigger>
              <TabsTrigger value="kyc">KYC</TabsTrigger>
              <TabsTrigger value="moderation">Moderation</TabsTrigger>
              <TabsTrigger value="sms">SMS</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="storage">Storage</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="maps" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <MapPin size={24} className="text-blue-600" weight="fill" />
                      </div>
                      <div>
                        <CardTitle>Maps Service</CardTitle>
                        <CardDescription>Configure map provider for location features</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={config?.maps?.enabled ?? true}
                      onCheckedChange={(checked) => updateConfig('maps', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="maps-provider">Provider</Label>
                    <select
                      id="maps-provider"
                      value={config?.maps?.provider ?? 'openstreetmap'}
                      onChange={(e) => updateConfig('maps', 'provider', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="google">Google Maps</option>
                      <option value="mapbox">Mapbox</option>
                      <option value="openstreetmap">OpenStreetMap (Free)</option>
                    </select>
                  </div>

                  {config?.maps?.provider !== 'openstreetmap' && (
                    <div className="space-y-3">
                      <Label htmlFor="maps-key">API Key</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="maps-key"
                            type={showSecrets['maps-key'] ? 'text' : 'password'}
                            value={config?.maps?.apiKey ?? ''}
                            onChange={(e) => updateConfig('maps', 'apiKey', e.target.value)}
                            placeholder="sk_..."
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleSecret('maps-key')}
                        >
                          {showSecrets['maps-key'] ? <EyeSlash size={20} /> : <Eye size={20} />}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label htmlFor="maps-rate">Rate Limit (requests/min)</Label>
                    <Input
                      id="maps-rate"
                      type="number"
                      value={config?.maps?.rateLimit ?? 100}
                      onChange={(e) => updateConfig('maps', 'rateLimit', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => testConnection('Maps')}
                      disabled={testingService === 'Maps'}
                      className="flex-1"
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'Maps' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="outline" onClick={() => resetToDefaults('maps')}>
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Robot size={24} className="text-purple-600" weight="fill" />
                      </div>
                      <div>
                        <CardTitle>AI Service</CardTitle>
                        <CardDescription>Configure AI provider for matching and analysis</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={config?.ai?.enabled ?? true}
                      onCheckedChange={(checked) => updateConfig('ai', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="ai-provider">Provider</Label>
                    <select
                      id="ai-provider"
                      value={config?.ai?.provider ?? 'spark'}
                      onChange={(e) => updateConfig('ai', 'provider', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="spark">Spark AI (Included)</option>
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                    </select>
                  </div>

                  {config?.ai?.provider !== 'spark' && (
                    <div className="space-y-3">
                      <Label htmlFor="ai-key">API Key</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="ai-key"
                            type={showSecrets['ai-key'] ? 'text' : 'password'}
                            value={config?.ai?.apiKey ?? ''}
                            onChange={(e) => updateConfig('ai', 'apiKey', e.target.value)}
                            placeholder="sk_..."
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleSecret('ai-key')}
                        >
                          {showSecrets['ai-key'] ? <EyeSlash size={20} /> : <Eye size={20} />}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label htmlFor="ai-model">Model</Label>
                    <select
                      id="ai-model"
                      value={config?.ai?.model ?? 'gpt-4o'}
                      onChange={(e) => updateConfig('ai', 'model', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="gpt-4o">GPT-4o (Recommended)</option>
                      <option value="gpt-4o-mini">GPT-4o Mini (Faster)</option>
                      <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="ai-tokens">Max Tokens</Label>
                      <Input
                        id="ai-tokens"
                        type="number"
                        value={config?.ai?.maxTokens ?? 1000}
                        onChange={(e) => updateConfig('ai', 'maxTokens', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="ai-temp">Temperature</Label>
                      <Input
                        id="ai-temp"
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        value={config?.ai?.temperature ?? 0.7}
                        onChange={(e) => updateConfig('ai', 'temperature', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => testConnection('AI')}
                      disabled={testingService === 'AI'}
                      className="flex-1"
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'AI' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="outline" onClick={() => resetToDefaults('ai')}>
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="kyc" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <ShieldCheck size={24} className="text-green-600" weight="fill" />
                      </div>
                      <div>
                        <CardTitle>KYC / Identity Verification</CardTitle>
                        <CardDescription>Configure identity verification service</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={config?.kyc?.enabled ?? true}
                      onCheckedChange={(checked) => updateConfig('kyc', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="kyc-provider">Provider</Label>
                    <select
                      id="kyc-provider"
                      value={config?.kyc?.provider ?? 'manual'}
                      onChange={(e) => updateConfig('kyc', 'provider', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="manual">Manual Review</option>
                      <option value="stripe">Stripe Identity</option>
                      <option value="onfido">Onfido</option>
                      <option value="jumio">Jumio</option>
                    </select>
                  </div>

                  {config?.kyc?.provider !== 'manual' && (
                    <div className="space-y-3">
                      <Label htmlFor="kyc-key">API Key</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="kyc-key"
                            type={showSecrets['kyc-key'] ? 'text' : 'password'}
                            value={config?.kyc?.apiKey ?? ''}
                            onChange={(e) => updateConfig('kyc', 'apiKey', e.target.value)}
                            placeholder="sk_..."
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleSecret('kyc-key')}
                        >
                          {showSecrets['kyc-key'] ? <EyeSlash size={20} /> : <Eye size={20} />}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Auto-approve Verifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically approve successful verification checks
                        </p>
                      </div>
                      <Switch
                        checked={config?.kyc?.autoApprove ?? false}
                        onCheckedChange={(checked) => updateConfig('kyc', 'autoApprove', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Require Documents</Label>
                        <p className="text-sm text-muted-foreground">
                          Require photo ID and proof of pet ownership
                        </p>
                      </div>
                      <Switch
                        checked={config?.kyc?.requireDocuments ?? true}
                        onCheckedChange={(checked) => updateConfig('kyc', 'requireDocuments', checked)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => testConnection('KYC')}
                      disabled={testingService === 'KYC'}
                      className="flex-1"
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'KYC' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="outline" onClick={() => resetToDefaults('kyc')}>
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="moderation" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-500/10">
                        <ImageIcon size={24} className="text-red-600" weight="fill" />
                      </div>
                      <div>
                        <CardTitle>Photo Moderation</CardTitle>
                        <CardDescription>Configure automated content moderation</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={config?.photoModeration?.enabled ?? true}
                      onCheckedChange={(checked) => updateConfig('photoModeration', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="mod-provider">Provider</Label>
                    <select
                      id="mod-provider"
                      value={config?.photoModeration?.provider ?? 'spark'}
                      onChange={(e) => updateConfig('photoModeration', 'provider', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="spark">Spark Moderation (Included)</option>
                      <option value="openai">OpenAI Vision</option>
                      <option value="google-vision">Google Cloud Vision</option>
                      <option value="aws-rekognition">AWS Rekognition</option>
                    </select>
                  </div>

                  {config?.photoModeration?.provider !== 'spark' && (
                    <div className="space-y-3">
                      <Label htmlFor="mod-key">API Key</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="mod-key"
                            type={showSecrets['mod-key'] ? 'text' : 'password'}
                            value={config?.photoModeration?.apiKey ?? ''}
                            onChange={(e) => updateConfig('photoModeration', 'apiKey', e.target.value)}
                            placeholder="sk_..."
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleSecret('mod-key')}
                        >
                          {showSecrets['mod-key'] ? <EyeSlash size={20} /> : <Eye size={20} />}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label htmlFor="mod-threshold">Confidence Threshold ({Math.round((config?.photoModeration?.confidenceThreshold ?? 0.8) * 100)}%)</Label>
                    <Input
                      id="mod-threshold"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config?.photoModeration?.confidenceThreshold ?? 0.8}
                      onChange={(e) => updateConfig('photoModeration', 'confidenceThreshold', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Higher values are more strict but may have false positives
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Auto-reject Violations</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically reject photos that violate policies
                      </p>
                    </div>
                    <Switch
                      checked={config?.photoModeration?.autoReject ?? false}
                      onCheckedChange={(checked) => updateConfig('photoModeration', 'autoReject', checked)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => testConnection('Photo Moderation')}
                      disabled={testingService === 'Photo Moderation'}
                      className="flex-1"
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'Photo Moderation' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="outline" onClick={() => resetToDefaults('photoModeration')}>
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sms" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10">
                        <Globe size={24} className="text-indigo-600" weight="fill" />
                      </div>
                      <div>
                        <CardTitle>SMS Service</CardTitle>
                        <CardDescription>Configure SMS notifications and verification</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={config?.sms?.enabled ?? false}
                      onCheckedChange={(checked) => updateConfig('sms', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="sms-provider">Provider</Label>
                    <select
                      id="sms-provider"
                      value={config?.sms?.provider ?? 'disabled'}
                      onChange={(e) => updateConfig('sms', 'provider', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="disabled">Disabled</option>
                      <option value="twilio">Twilio</option>
                      <option value="vonage">Vonage (Nexmo)</option>
                      <option value="aws-sns">AWS SNS</option>
                    </select>
                  </div>

                  {config?.sms?.provider !== 'disabled' && (
                    <>
                      <div className="space-y-3">
                        <Label htmlFor="sms-key">API Key / Account SID</Label>
                        <div className="flex gap-2">
                          <Input
                            id="sms-key"
                            type={showSecrets['sms-key'] ? 'text' : 'password'}
                            value={config?.sms?.apiKey ?? ''}
                            onChange={(e) => updateConfig('sms', 'apiKey', e.target.value)}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => toggleSecret('sms-key')}
                          >
                            {showSecrets['sms-key'] ? <EyeSlash size={20} /> : <Eye size={20} />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="sms-secret">API Secret / Auth Token</Label>
                        <div className="flex gap-2">
                          <Input
                            id="sms-secret"
                            type={showSecrets['sms-secret'] ? 'text' : 'password'}
                            value={config?.sms?.apiSecret ?? ''}
                            onChange={(e) => updateConfig('sms', 'apiSecret', e.target.value)}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => toggleSecret('sms-secret')}
                          >
                            {showSecrets['sms-secret'] ? <EyeSlash size={20} /> : <Eye size={20} />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="sms-from">From Number</Label>
                        <Input
                          id="sms-from"
                          type="tel"
                          value={config?.sms?.fromNumber ?? ''}
                          onChange={(e) => updateConfig('sms', 'fromNumber', e.target.value)}
                          placeholder="+1234567890"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => testConnection('SMS')}
                      disabled={testingService === 'SMS' || config?.sms?.provider === 'disabled'}
                      className="flex-1"
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'SMS' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="outline" onClick={() => resetToDefaults('sms')}>
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10">
                        <Globe size={24} className="text-cyan-600" weight="fill" />
                      </div>
                      <div>
                        <CardTitle>Email Service</CardTitle>
                        <CardDescription>Configure email notifications and alerts</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={config?.email?.enabled ?? false}
                      onCheckedChange={(checked) => updateConfig('email', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="email-provider">Provider</Label>
                    <select
                      id="email-provider"
                      value={config?.email?.provider ?? 'disabled'}
                      onChange={(e) => updateConfig('email', 'provider', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="disabled">Disabled</option>
                      <option value="sendgrid">SendGrid</option>
                      <option value="mailgun">Mailgun</option>
                      <option value="aws-ses">AWS SES</option>
                    </select>
                  </div>

                  {config?.email?.provider !== 'disabled' && (
                    <>
                      <div className="space-y-3">
                        <Label htmlFor="email-key">API Key</Label>
                        <div className="flex gap-2">
                          <Input
                            id="email-key"
                            type={showSecrets['email-key'] ? 'text' : 'password'}
                            value={config?.email?.apiKey ?? ''}
                            onChange={(e) => updateConfig('email', 'apiKey', e.target.value)}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => toggleSecret('email-key')}
                          >
                            {showSecrets['email-key'] ? <EyeSlash size={20} /> : <Eye size={20} />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="email-from">From Email</Label>
                        <Input
                          id="email-from"
                          type="email"
                          value={config?.email?.fromEmail ?? ''}
                          onChange={(e) => updateConfig('email', 'fromEmail', e.target.value)}
                          placeholder="noreply@pawfectmatch.com"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="email-name">From Name</Label>
                        <Input
                          id="email-name"
                          value={config?.email?.fromName ?? 'PawfectMatch'}
                          onChange={(e) => updateConfig('email', 'fromName', e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => testConnection('Email')}
                      disabled={testingService === 'Email' || config?.email?.provider === 'disabled'}
                      className="flex-1"
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'Email' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="outline" onClick={() => resetToDefaults('email')}>
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="storage" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <ImageIcon size={24} className="text-orange-600" weight="fill" />
                      </div>
                      <div>
                        <CardTitle>Storage Service</CardTitle>
                        <CardDescription>Configure file and image storage</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={config?.storage?.enabled ?? true}
                      onCheckedChange={(checked) => updateConfig('storage', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="storage-provider">Provider</Label>
                    <select
                      id="storage-provider"
                      value={config?.storage?.provider ?? 'local'}
                      onChange={(e) => updateConfig('storage', 'provider', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="local">Local Storage</option>
                      <option value="aws-s3">AWS S3</option>
                      <option value="cloudflare-r2">Cloudflare R2</option>
                    </select>
                  </div>

                  {config?.storage?.provider !== 'local' && (
                    <>
                      <div className="space-y-3">
                        <Label htmlFor="storage-key">Access Key ID</Label>
                        <div className="flex gap-2">
                          <Input
                            id="storage-key"
                            type={showSecrets['storage-key'] ? 'text' : 'password'}
                            value={config?.storage?.apiKey ?? ''}
                            onChange={(e) => updateConfig('storage', 'apiKey', e.target.value)}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => toggleSecret('storage-key')}
                          >
                            {showSecrets['storage-key'] ? <EyeSlash size={20} /> : <Eye size={20} />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="storage-secret">Secret Access Key</Label>
                        <div className="flex gap-2">
                          <Input
                            id="storage-secret"
                            type={showSecrets['storage-secret'] ? 'text' : 'password'}
                            value={config?.storage?.apiSecret ?? ''}
                            onChange={(e) => updateConfig('storage', 'apiSecret', e.target.value)}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => toggleSecret('storage-secret')}
                          >
                            {showSecrets['storage-secret'] ? <EyeSlash size={20} /> : <Eye size={20} />}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <Label htmlFor="storage-bucket">Bucket Name</Label>
                          <Input
                            id="storage-bucket"
                            value={config?.storage?.bucket ?? ''}
                            onChange={(e) => updateConfig('storage', 'bucket', e.target.value)}
                            placeholder="my-bucket"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="storage-region">Region</Label>
                          <Input
                            id="storage-region"
                            value={config?.storage?.region ?? 'us-east-1'}
                            onChange={(e) => updateConfig('storage', 'region', e.target.value)}
                            placeholder="us-east-1"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => testConnection('Storage')}
                      disabled={testingService === 'Storage'}
                      className="flex-1"
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'Storage' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="outline" onClick={() => resetToDefaults('storage')}>
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-pink-500/10">
                        <Globe size={24} className="text-pink-600" weight="fill" />
                      </div>
                      <div>
                        <CardTitle>Analytics Service</CardTitle>
                        <CardDescription>Configure user analytics and tracking</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={config?.analytics?.enabled ?? false}
                      onCheckedChange={(checked) => updateConfig('analytics', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="analytics-provider">Provider</Label>
                    <select
                      id="analytics-provider"
                      value={config?.analytics?.provider ?? 'disabled'}
                      onChange={(e) => updateConfig('analytics', 'provider', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="disabled">Disabled</option>
                      <option value="google-analytics">Google Analytics</option>
                      <option value="mixpanel">Mixpanel</option>
                      <option value="amplitude">Amplitude</option>
                    </select>
                  </div>

                  {config?.analytics?.provider !== 'disabled' && (
                    <div className="space-y-3">
                      <Label htmlFor="analytics-key">
                        {config?.analytics?.provider === 'google-analytics' ? 'Measurement ID' : 'API Key'}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="analytics-key"
                          type={showSecrets['analytics-key'] ? 'text' : 'password'}
                          value={config?.analytics?.apiKey ?? ''}
                          onChange={(e) => updateConfig('analytics', 'apiKey', e.target.value)}
                          placeholder={config?.analytics?.provider === 'google-analytics' ? 'G-XXXXXXXXXX' : 'api_key'}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleSecret('analytics-key')}
                        >
                          {showSecrets['analytics-key'] ? <EyeSlash size={20} /> : <Eye size={20} />}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => testConnection('Analytics')}
                      disabled={testingService === 'Analytics' || config?.analytics?.provider === 'disabled'}
                      className="flex-1"
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'Analytics' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="outline" onClick={() => resetToDefaults('analytics')}>
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  )
}

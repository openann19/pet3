import { motion } from 'framer-motion'
import { MonitorPlay, Check } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { VideoQuality } from '@/lib/call-types'
import { haptics } from '@/lib/haptics'

interface VideoQualitySettingsProps {
  currentQuality: VideoQuality
  onQualityChange: (quality: VideoQuality) => void
}

const qualityOptions: {
  value: VideoQuality
  label: string
  resolution: string
  description: string
  badge?: string
}[] = [
  {
    value: '4k',
    label: '4K Ultra HD',
    resolution: '3840 × 2160',
    description: 'Highest quality, requires high-speed connection',
    badge: 'Premium'
  },
  {
    value: '1080p',
    label: 'Full HD',
    resolution: '1920 × 1080',
    description: 'Excellent quality, recommended for most users',
    badge: 'Recommended'
  },
  {
    value: '720p',
    label: 'HD',
    resolution: '1280 × 720',
    description: 'Good quality, suitable for moderate connections'
  },
  {
    value: '480p',
    label: 'SD',
    resolution: '854 × 480',
    description: 'Basic quality, best for slow connections'
  }
]

export default function VideoQualitySettings({
  currentQuality,
  onQualityChange
}: VideoQualitySettingsProps) {
  const handleQualitySelect = (quality: VideoQuality) => {
    haptics.trigger('selection')
    onQualityChange(quality)
  }

  return (
    <Card className="glass-effect border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MonitorPlay size={24} weight="fill" className="text-primary" />
          <CardTitle>Video Quality</CardTitle>
        </div>
        <CardDescription>
          Choose your preferred video call quality. Higher quality requires more bandwidth.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {qualityOptions.map((option) => (
          <motion.div
            key={option.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant={currentQuality === option.value ? 'default' : 'outline'}
              className={`w-full h-auto py-4 px-4 justify-between ${
                currentQuality === option.value
                  ? 'bg-gradient-to-r from-primary to-accent border-primary/50'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => handleQualitySelect(option.value)}
            >
              <div className="flex flex-col items-start gap-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base">{option.label}</span>
                  {option.badge && (
                    <Badge
                      variant={currentQuality === option.value ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {option.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-sm font-mono opacity-80">{option.resolution}</span>
                <span className="text-xs opacity-70 text-left">{option.description}</span>
              </div>
              {currentQuality === option.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <Check size={24} weight="bold" />
                </motion.div>
              )}
            </Button>
          </motion.div>
        ))}

        <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> The actual quality may vary based on your device capabilities and network conditions. 
            The system will automatically adjust to the best available quality.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

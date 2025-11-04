import { motion } from 'framer-motion'
import { TrendUp, Heart, Users, Clock, Star, Lightning } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import type { Pet, PetTrustProfile } from '@/lib/types'

interface DetailedPetAnalyticsProps {
  pet: Pet
  trustProfile?: PetTrustProfile
  compatibilityScore?: number
  matchReasons?: string[]
}

export function DetailedPetAnalytics({ 
  pet, 
  trustProfile, 
  compatibilityScore,
  matchReasons 
}: DetailedPetAnalyticsProps) {
  const stats = [
    {
      icon: Heart,
      label: 'Overall Rating',
      value: trustProfile?.overallRating?.toFixed(1) || 'N/A',
      max: '5.0',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      icon: Users,
      label: 'Playdates',
      value: trustProfile?.playdateCount || 0,
      suffix: ' completed',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    {
      icon: Lightning,
      label: 'Response Rate',
      value: `${Math.round((trustProfile?.responseRate || 0) * 100)}%`,
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    {
      icon: Clock,
      label: 'Avg Response',
      value: trustProfile?.responseTime || 'N/A',
      color: 'text-lavender',
      bgColor: 'bg-lavender/10'
    }
  ]

  const personalityTraits = pet.personality || []
  const interests = pet.interests || []

  return (
    <div className="space-y-6">
      {compatibilityScore !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendUp size={24} className="text-primary" weight="duotone" />
                Compatibility Score
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {compatibilityScore}%
                </span>
                <Badge 
                  variant={compatibilityScore >= 85 ? 'default' : compatibilityScore >= 70 ? 'secondary' : 'outline'}
                  className="text-sm px-3 py-1"
                >
                  {compatibilityScore >= 85 ? 'Perfect Match' : 
                   compatibilityScore >= 70 ? 'Great Fit' : 
                   compatibilityScore >= 55 ? 'Good Potential' : 'Worth Exploring'}
                </Badge>
              </div>
              <Progress value={compatibilityScore} className="h-3" />
              
              {matchReasons && matchReasons.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-sm font-semibold text-muted-foreground">Why this match works:</p>
                  <ul className="space-y-1.5">
                    {matchReasons.map((reason, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Star size={16} className="text-accent mt-0.5 flex-shrink-0" weight="fill" />
                        <span>{reason}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Social Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex items-center gap-3 p-4 rounded-xl ${stat.bgColor} border border-${stat.color}/20`}
                >
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon size={24} className={stat.color} weight="duotone" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                    <p className={`text-lg font-bold ${stat.color} truncate`}>
                      {stat.value}
                      {stat.suffix && <span className="text-xs font-normal">{stat.suffix}</span>}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {trustProfile && trustProfile.totalReviews > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = trustProfile.ratingBreakdown?.[rating as keyof typeof trustProfile.ratingBreakdown] || 0
                const percentage = trustProfile.totalReviews > 0 
                  ? (count / trustProfile.totalReviews) * 100 
                  : 0

                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm font-medium">{rating}</span>
                      <Star size={14} className="text-accent" weight="fill" />
                    </div>
                    <div className="flex-1">
                      <Progress 
                        value={percentage} 
                        className="h-2"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {count}
                    </span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Personality & Interests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {personalityTraits.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Personality</p>
                <div className="flex flex-wrap gap-2">
                  {personalityTraits.map((trait, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Badge variant="secondary" className="text-sm">
                        {trait}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {interests.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Badge variant="outline" className="text-sm">
                        {interest}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

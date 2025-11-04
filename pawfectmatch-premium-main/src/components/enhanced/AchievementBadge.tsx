import { motion } from 'framer-motion'

export function AchievementBadge() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="w-8 h-8 bg-primary rounded-full"
    />
  )
}

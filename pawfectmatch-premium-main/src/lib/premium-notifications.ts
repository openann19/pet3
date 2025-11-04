import { generateULID } from './utils'
import type { PremiumNotification } from '@/components/notifications/PremiumNotificationCenter'

export async function createPremiumNotification(notification: Omit<PremiumNotification, 'id' | 'timestamp' | 'read' | 'archived'>) {
  const { kv } = window.spark
  
  const newNotification: PremiumNotification = {
    id: generateULID(),
    timestamp: Date.now(),
    read: false,
    archived: false,
    ...notification
  }

  const existing = await kv.get<PremiumNotification[]>('premium-notifications') || []
  await kv.set('premium-notifications', [newNotification, ...existing])

  return newNotification
}

export async function createMatchNotification(
  yourPetName: string,
  matchedPetName: string,
  matchId: string,
  compatibilityScore?: number,
  avatarUrl?: string
) {
  return createPremiumNotification({
    type: 'match',
    title: `New Match! 🎉`,
    message: `${yourPetName} matched with ${matchedPetName}!`,
    priority: 'high',
    actionLabel: 'View Match',
    actionUrl: `/matches/${matchId}`,
    avatarUrl,
    metadata: {
      petName: matchedPetName,
      matchId,
      compatibilityScore
    }
  })
}

export async function createMessageNotification(
  senderName: string,
  messagePreview: string,
  roomId: string,
  avatarUrl?: string
) {
  return createPremiumNotification({
    type: 'message',
    title: senderName,
    message: messagePreview,
    priority: 'normal',
    actionLabel: 'Reply',
    actionUrl: `/chat/${roomId}`,
    avatarUrl,
    metadata: {
      userName: senderName,
      messageId: roomId
    }
  })
}

export async function createLikeNotification(
  petName: string,
  count: number = 1,
  avatarUrl?: string
) {
  return createPremiumNotification({
    type: 'like',
    title: count === 1 ? `${petName} liked your pet!` : `${count} new likes!`,
    message: count === 1 
      ? `${petName} is interested in your pet` 
      : `${petName} and ${count - 1} others liked your pet`,
    priority: 'normal',
    actionLabel: 'View Profile',
    avatarUrl,
    metadata: {
      petName,
      count
    }
  })
}

export async function createVerificationNotification(
  status: 'approved' | 'rejected' | 'pending',
  petName: string
) {
  const messages = {
    approved: {
      title: 'Pet Verified! ✅',
      message: `${petName} has been verified and is now live`,
      priority: 'high' as const
    },
    rejected: {
      title: 'Verification Issue',
      message: `${petName}'s verification needs attention`,
      priority: 'urgent' as const
    },
    pending: {
      title: 'Verification Pending',
      message: `${petName} is being reviewed`,
      priority: 'normal' as const
    }
  }

  const config = messages[status]

  return createPremiumNotification({
    type: 'verification',
    title: config.title,
    message: config.message,
    priority: config.priority,
    actionLabel: 'View Details',
    metadata: {
      petName
    }
  })
}

export async function createStoryNotification(
  userName: string,
  count: number = 1,
  avatarUrl?: string,
  imageUrl?: string
) {
  return createPremiumNotification({
    type: 'story',
    title: count === 1 ? `${userName} posted a story` : `${count} new stories`,
    message: count === 1
      ? 'View their latest update'
      : `${userName} and others shared new stories`,
    priority: 'low',
    actionLabel: 'Watch',
    avatarUrl,
    imageUrl,
    metadata: {
      userName,
      count
    }
  })
}

export async function createModerationNotification(
  title: string,
  message: string,
  priority: PremiumNotification['priority'] = 'urgent'
) {
  return createPremiumNotification({
    type: 'moderation',
    title,
    message,
    priority,
    actionLabel: 'Learn More'
  })
}

export async function createAchievementNotification(
  achievementName: string,
  description: string,
  badge?: string,
  imageUrl?: string
) {
  return createPremiumNotification({
    type: 'achievement',
    title: `Achievement Unlocked! 🏆`,
    message: `You earned "${achievementName}" - ${description}`,
    priority: 'high',
    actionLabel: 'View Achievements',
    imageUrl,
    metadata: {
      achievementBadge: badge || achievementName
    }
  })
}

export async function createSocialNotification(
  title: string,
  message: string,
  userName?: string,
  avatarUrl?: string
) {
  return createPremiumNotification({
    type: 'social',
    title,
    message,
    priority: 'normal',
    avatarUrl,
    metadata: {
      userName
    }
  })
}

export async function createEventNotification(
  eventName: string,
  eventDetails: string,
  location?: string,
  imageUrl?: string
) {
  return createPremiumNotification({
    type: 'event',
    title: eventName,
    message: eventDetails,
    priority: 'normal',
    actionLabel: 'View Event',
    imageUrl,
    metadata: {
      location,
      eventType: eventName
    }
  })
}

export async function createSystemNotification(
  title: string,
  message: string,
  priority: PremiumNotification['priority'] = 'normal'
) {
  return createPremiumNotification({
    type: 'system',
    title,
    message,
    priority
  })
}

export async function markNotificationAsRead(id: string) {
  const { kv } = window.spark
  const notifications = await kv.get<PremiumNotification[]>('premium-notifications') || []
  
  const updated = notifications.map(n => 
    n.id === id ? { ...n, read: true } : n
  )
  
  await kv.set('premium-notifications', updated)
}

export async function archiveNotification(id: string) {
  const { kv } = window.spark
  const notifications = await kv.get<PremiumNotification[]>('premium-notifications') || []
  
  const updated = notifications.map(n => 
    n.id === id ? { ...n, archived: true, read: true } : n
  )
  
  await kv.set('premium-notifications', updated)
}

export async function deleteNotification(id: string) {
  const { kv } = window.spark
  const notifications = await kv.get<PremiumNotification[]>('premium-notifications') || []
  
  const updated = notifications.filter(n => n.id !== id)
  
  await kv.set('premium-notifications', updated)
}

export async function clearAllNotifications() {
  const { kv } = window.spark
  await kv.set('premium-notifications', [])
}

export async function getUnreadCount() {
  const { kv } = window.spark
  const notifications = await kv.get<PremiumNotification[]>('premium-notifications') || []
  return notifications.filter(n => !n.read && !n.archived).length
}

export async function getUrgentNotifications() {
  const { kv } = window.spark
  const notifications = await kv.get<PremiumNotification[]>('premium-notifications') || []
  return notifications.filter(n => 
    !n.read && 
    !n.archived && 
    (n.priority === 'urgent' || n.priority === 'critical')
  )
}

export async function createGroupedNotifications(
  type: PremiumNotification['type'],
  items: Array<{ name: string; avatarUrl?: string }>,
  baseMessage: string
) {
  const groupId = generateULID()
  const { kv } = window.spark
  
  const notifications = items.map((item, index) => ({
    id: generateULID(),
    type,
    title: `${item.name} ${baseMessage}`,
    message: `Check out what ${item.name} shared`,
    timestamp: Date.now() - (items.length - index) * 1000,
    read: false,
    archived: false,
    priority: 'normal' as const,
    avatarUrl: item.avatarUrl,
    groupId,
    metadata: {
      userName: item.name
    }
  }))

  const existing = await kv.get<PremiumNotification[]>('premium-notifications') || []
  await kv.set('premium-notifications', [...notifications, ...existing])

  return notifications
}

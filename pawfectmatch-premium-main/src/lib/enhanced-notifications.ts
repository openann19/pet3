import { generateULID } from './utils'
import type { AppNotification } from '@/components/notifications/NotificationCenter'

declare const spark: {
  kv: {
    get: <T>(key: string) => Promise<T | undefined>
    set: <T>(key: string, value: T) => Promise<void>
  }
}

export async function addNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) {
  const allNotifications = await spark.kv.get<AppNotification[]>('app-notifications') || []
  
  const newNotification: AppNotification = {
    ...notification,
    id: generateULID(),
    timestamp: Date.now(),
    read: false
  }
  
  await spark.kv.set('app-notifications', [newNotification, ...allNotifications])
  
  return newNotification
}

export async function createMatchNotification(petName: string, yourPetName: string, matchId: string) {
  return addNotification({
    type: 'match',
    title: "It's a Match! 🎉",
    message: `${yourPetName} and ${petName} are perfect companions!`,
    priority: 'high',
    actionUrl: `/matches/${matchId}`,
    actionLabel: 'View Match',
    metadata: {
      petName,
      matchId
    }
  })
}

export async function createMessageNotification(senderName: string, message: string, roomId: string) {
  return addNotification({
    type: 'message',
    title: `New message from ${senderName}`,
    message: message.length > 80 ? message.substring(0, 80) + '...' : message,
    priority: 'normal',
    actionUrl: `/chat/${roomId}`,
    actionLabel: 'Reply',
    metadata: {
      userName: senderName,
      messageId: roomId
    }
  })
}

export async function createLikeNotification(petName: string, count: number = 1) {
  return addNotification({
    type: 'like',
    title: count > 1 ? 'New Likes!' : 'Someone liked your pet!',
    message: count > 1 
      ? `${petName} and ${count - 1} others liked your pet!` 
      : `${petName} liked your pet!`,
    priority: 'normal',
    actionUrl: '/matches',
    actionLabel: 'View',
    metadata: {
      petName,
      count
    }
  })
}

export async function createVerificationNotification(status: 'approved' | 'rejected', petName: string) {
  return addNotification({
    type: 'verification',
    title: status === 'approved' ? 'Pet Verified! ✅' : 'Verification Update',
    message: status === 'approved'
      ? `${petName} has been verified and is now visible to other users!`
      : `${petName}'s verification needs more information. Please check your profile.`,
    priority: status === 'approved' ? 'high' : 'normal',
    actionUrl: '/profile',
    actionLabel: 'View Profile'
  })
}

export async function createStoryNotification(userName: string, count: number = 1) {
  return addNotification({
    type: 'story',
    title: count > 1 ? 'New Stories' : 'New Story',
    message: count > 1
      ? `${userName} and ${count - 1} others posted new stories`
      : `${userName} posted a new story`,
    priority: 'low',
    actionUrl: '/stories',
    metadata: {
      userName,
      count
    }
  })
}

export async function createModerationNotification(action: string, reason: string) {
  return addNotification({
    type: 'moderation',
    title: 'Moderation Notice',
    message: `${action}: ${reason}`,
    priority: 'urgent',
    actionUrl: '/profile',
    actionLabel: 'Learn More'
  })
}

export async function createSystemNotification(title: string, message: string, priority: AppNotification['priority'] = 'normal') {
  return addNotification({
    type: 'system',
    title,
    message,
    priority
  })
}

export async function clearAllNotifications() {
  await spark.kv.set('app-notifications', [])
}

export async function markNotificationAsRead(id: string) {
  const notifications = await spark.kv.get<AppNotification[]>('app-notifications') || []
  const updated = notifications.map(n => 
    n.id === id ? { ...n, read: true } : n
  )
  await spark.kv.set('app-notifications', updated)
}

export async function deleteNotification(id: string) {
  const notifications = await spark.kv.get<AppNotification[]>('app-notifications') || []
  const filtered = notifications.filter(n => n.id !== id)
  await spark.kv.set('app-notifications', filtered)
}

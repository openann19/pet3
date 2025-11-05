export const ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email'
  },

  // User Management
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    UPLOAD_AVATAR: '/users/avatar',
    PREFERENCES: '/users/preferences',
    NOTIFICATIONS: '/users/notifications',
    SETTINGS: '/users/settings'
  },

  // Adoption
  ADOPTION: {
    LISTINGS: '/adoption/listings',
    CREATE_LISTING: '/adoption/listings',
    GET_LISTING: (id: string) => `/adoption/listings/${id}`,
    UPDATE_LISTING: (id: string) => `/adoption/listings/${id}`,
    DELETE_LISTING: (id: string) => `/adoption/listings/${id}`,
    APPLY: '/adoption/applications',
    APPLICATIONS: '/adoption/applications',
    UPDATE_APPLICATION: (id: string) => `/adoption/applications/${id}`
  },

  // Matching
  MATCHING: {
    PREFERENCES: '/matching/preferences',
    DISCOVER: '/matching/discover',
    SWIPE: '/matching/swipe',
    MATCHES: '/matching/matches',
    SCORE: '/matching/score'
  },

  // Payments
  PAYMENTS: {
    PRODUCTS: '/payments/products',
    CREATE_INTENT: '/payments/create-intent',
    CONFIRM_PAYMENT: '/payments/confirm',
    SUBSCRIPTIONS: '/payments/subscriptions',
    CANCEL_SUBSCRIPTION: (id: string) => `/payments/subscriptions/${id}`
  },

  // File Uploads
  UPLOADS: {
    SIGN_URL: '/uploads/sign-url',
    COMPLETE: '/uploads/complete',
    DELETE: (key: string) => `/uploads/${key}`
  },

  // Chat & Messaging
  CHAT: {
    CONVERSATIONS: '/chat/conversations',
    CONVERSATION: (id: string) => `/chat/conversations/${id}`,
    MESSAGES: (conversationId: string) => `/chat/conversations/${conversationId}/messages`,
    SEND_MESSAGE: (conversationId: string) => `/chat/conversations/${conversationId}/messages`,
    MARK_READ: (conversationId: string) => `/chat/conversations/${conversationId}/read`
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    SETTINGS: '/notifications/settings'
  },

  // Community
  COMMUNITY: {
    POSTS: '/community/posts',
    POST: (id: string) => `/community/posts/${id}`,
    CREATE_POST: '/community/posts',
    LIKE_POST: (id: string) => `/community/posts/${id}/like`,
    COMMENT: (postId: string) => `/community/posts/${postId}/comments`,
    LIKE_COMMENT: (postId: string, commentId: string) => `/community/posts/${postId}/comments/${commentId}/like`
  },

  // Admin
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    USER: (id: string) => `/admin/users/${id}`,
    MODERATION_QUEUE: '/admin/moderation',
    ANALYTICS: '/admin/analytics',
    SETTINGS: '/admin/settings'
  },

  // KYC
  KYC: {
    STATUS: '/kyc/status',
    START_VERIFICATION: '/kyc/start',
    SUBMIT_DOCUMENTS: '/kyc/documents',
    GET_VERIFICATION: (id: string) => `/kyc/verifications/${id}`
  }
} as const

export function buildUrl(
  endpoint: string,
  params?: Record<string, unknown>
): string {
  if (!params) return endpoint

  const url = new URL(endpoint, 'http://dummy-base')
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(key, String(v)))
      } else if (typeof value === 'object') {
        // For complex objects, stringify them
        url.searchParams.append(key, JSON.stringify(value))
      } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        // For primitives, convert to string safely
        url.searchParams.append(key, String(value))
      }
      // Skip other types (functions, symbols, etc.)
    }
  })

  return `${url.pathname}${url.search}`
}

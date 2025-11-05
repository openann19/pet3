# Production Readiness - Final 10% Implementation Guide

**Status:** Architecture Complete | Implementation In Progress
**Last Updated:** ${new Date().toISOString()}

---

## ✅ Phase 1: UI Foundations (COMPLETED)

### Implemented
- ✅ Fluid typography system (`src/lib/fluid-typography.ts`)
- ✅ Line clamp utilities for text overflow
- ✅ Button sizing utilities with auto-expand
- ✅ Dismissible overlay component with:
  - Tap-outside to close
  - ESC key support
  - Android back button handling
  - Focus trap
  - Keyboard navigation
- ✅ i18n audit script (`audit-i18n.ts`)

###Usage Examples
```typescript
// Fluid Typography
import { getFluidTypographyClasses, getLineClampClass } from '@/lib/fluid-typography'

<h1 className={getFluidTypographyClasses('h1')}>Title</h1>
<p className={`${getFluidTypographyClasses('body')} ${getLineClampClass(3)}`}>
  Long text that will be clamped to 3 lines...
</p>

// Dismissible Overlay
import { DismissibleOverlay } from '@/components/DismissibleOverlay'

<DismissibleOverlay
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="My Dialog"
  closeOnEscape
  closeOnOutsideClick
  closeOnAndroidBack
  trapFocus
>
  <div className="p-6">Content here</div>
</DismissibleOverlay>

// Run i18n audit
$ npx tsx audit-i18n.ts
```

### Theme Contrast Status
All components use theme variables. WCAG AA compliance verified for:
- Light theme: All text > 4.5:1 contrast ratio
- Dark theme: All text > 4.5:1 contrast ratio
- Ghost/outline buttons visible in both themes

---

## ✅ Phase 2: Real Swipe Engine (COMPLETED)

### Implemented
- ✅ SwipeEngine class with physics (`src/lib/swipe-engine.ts`)
- ✅ Configurable thresholds (15px engage, 80px intent, 150px commit)
- ✅ Velocity-based escape (>500px/s)
- ✅ Spring snap-back with configurable stiffness/damping
- ✅ Overscroll clamping (1.5x max)
- ✅ Integrated haptics (selection, light, heavy, medium)
- ✅ State machine (idle → engaged → intent → committing → committed)
- ✅ Performance optimized with requestAnimationFrame

### Usage
```typescript
import { createSwipeEngine } from '@/lib/swipe-engine'

const swipeEngine = createSwipeEngine({
  engageThreshold: 15,
  intentThreshold: 80,
  commitThreshold: 150,
  velocityEscape: 500
})

swipeEngine.setCallbacks({
  onStateChange: (state, metrics) => {
    console.log('Swipe state:', state, metrics)
    // Update UI based on state
  },
  onCommit: (result) => {
    console.log('Swipe committed:', result.direction)
    // Handle like/pass action
  }
})

// Touch handlers
const handleTouchStart = (e: TouchEvent) => {
  const touch = e.touches[0]
  swipeEngine.start(touch.clientX, touch.clientY)
}

const handleTouchMove = (e: TouchEvent) => {
  const touch = e.touches[0]
  swipeEngine.move(touch.clientX, touch.clientY)
  
  const offset = swipeEngine.getClampedOffset()
  // Apply transform to card
  cardRef.current.style.transform = 
    `translate(${offset.x}px, ${offset.y}px) rotate(${offset.rotation}deg) scale(${offset.scale})`
}

const handleTouchEnd = () => {
  const result = swipeEngine.end()
  if (result) {
    // Animate out and handle action
  } else {
    // Snap back
  }
}
```

### Integration Points
- TODO: Replace swipe logic in DiscoverView
- TODO: Add visual indicators (LIKE/PASS labels)
- TODO: Implement optimistic UI updates
- TODO: Add undo functionality

---

## 📋 Phase 3: Maps Integration (ARCHITECTURE COMPLETE)

### Required Implementation

#### Map Provider Setup
```typescript
// src/lib/maps/provider.ts
export const MAP_CONFIG = {
  provider: 'mapbox', // or 'google-maps'
  accessToken: import.meta.env.VITE_MAPBOX_TOKEN,
  defaultCenter: { lat: 42.6977, lng: 23.3219 }, // Sofia, BG
  defaultZoom: 12
}

// Required env vars
VITE_MAPBOX_TOKEN=pk.xxx
VITE_GOOGLE_MAPS_KEY=AIza-xxx (if using Google)
```

#### Geocoding Service
```typescript
// src/lib/maps/geocoding.ts
export async function geocode(address: string): Promise<Coordinates> {
  // Implement with chosen provider
  // Returns { lat, lng }
}

export async function reverseGeocode(lat: number, lng: number): Promise<Address> {
  // Returns { city, country, formatted }
}

export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  // Haversine formula
  // Returns distance in km
}
```

#### Permission Flow
```typescript
// src/lib/maps/permissions.ts
export type LocationPermission = 'granted' | 'denied' | 'prompt'

export async function requestLocationPermission(): Promise<LocationPermission> {
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' })
    return result.state
  } catch {
    return 'prompt'
  }
}

export async function getCurrentLocation(): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      () => resolve(null),
      { timeout: 10000, maximumAge: 300000 }
    )
  })
}
```

#### Privacy-First Location Storage
```typescript
// NEVER store raw coordinates in logs
// Always use fuzzy/approximate locations for display
// Precise location only when user explicitly enables for meetups

export function approximateLocation(coord: Coordinates, radius: number = 2): Coordinates {
  // Add noise/rounding to obscure precise location
  const lat = Math.round(coord.lat * 100) / 100
  const lng = Math.round(coord.lng * 100) / 100
  return { lat, lng }
}

// Cache last known approximate location only
const [lastLocation] = useKV<Coordinates | null>('last-approx-location', null)
```

#### Map Components
```typescript
// src/components/maps/MapView.tsx
export function MapView({
  center,
  markers,
  onMarkerClick
}: MapViewProps) {
  // Render map with markers
  // Support clustering for many markers
  // Custom marker icons for pets/places
}

// src/components/maps/PlaceCard.tsx
export function PlaceCard({ place }: { place: Place }) {
  // Show place details
  // Distance badge
  // Navigate button
}

// src/components/maps/LocationPicker.tsx
export function LocationPicker({ onSelect }: { onSelect: (loc: Coordinates) => void }) {
  // Manual location entry fallback
  // Search by address
  // Drag marker to adjust
}
```

#### Distance Filtering
```typescript
// Integrate into discovery filters
// src/components/DiscoveryFilters.tsx
const [maxDistance, setMaxDistance] = useKV('max-distance-km', 50)
const [userLocation] = useKV<Coordinates | null>('user-location', null)

// Filter pets by distance
const filteredPets = pets.filter(pet => {
  if (!userLocation || !pet.location) return true
  const distance = calculateDistance(userLocation, pet.location)
  return distance <= maxDistance
})
```

### Testing Checklist
- [ ] Location permission prompt works
- [ ] Manual entry fallback when permission denied
- [ ] Distance calculation accurate
- [ ] Map renders on all devices
- [ ] No raw coordinates in client logs
- [ ] Approximate location cached
- [ ] Distance filter works in discovery

---

## 📋 Phase 4: Backend Wiring (ARCHITECTURE COMPLETE)

### API Endpoints v1

```typescript
// Backend API Structure
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

GET    /api/v1/pets
POST   /api/v1/pets
GET    /api/v1/pets/:id
PATCH  /api/v1/pets/:id
DELETE /api/v1/pets/:id

GET    /api/v1/discovery
POST   /api/v1/discovery/filters
GET    /api/v1/discovery/:petId

POST   /api/v1/swipes
GET    /api/v1/swipes/history

GET    /api/v1/matches
GET    /api/v1/matches/:id

GET    /api/v1/chat/conversations
GET    /api/v1/chat/conversations/:id/messages
POST   /api/v1/chat/conversations/:id/messages

POST   /api/v1/media/upload-url
POST   /api/v1/media/confirm

GET    /api/v1/notifications
PATCH  /api/v1/notifications/:id/read
POST   /api/v1/notifications/register-device

GET    /api/v1/health
GET    /api/v1/openapi.json
```

### Auth Implementation
```typescript
// JWT + Refresh Token Flow
interface AuthTokens {
  accessToken: string  // 15min expiry
  refreshToken: string // 30 day expiry
}

// Store in httpOnly cookies (web) or secure storage (mobile)
// CSRF token for web requests
// Device ID for push notification routing
```

### Rate Limiting
```typescript
// Rate limit configuration
const RATE_LIMITS = {
  'POST /api/v1/auth/login': { window: '15m', max: 5 },
  'POST /api/v1/posts': { window: '1h', max: 10 },
  'POST /api/v1/comments': { window: '1h', max: 50 },
  'POST /api/v1/media/*': { window: '1h', max: 20 },
  'GET /api/v1/*': { window: '1m', max: 100 },
  'POST /api/v1/*': { window: '1m', max: 30 }
}

// Response on rate limit
{
  error: 'rate_limit_exceeded',
  message: 'Too many requests, please try again later',
  retryAfter: 300 // seconds
}
```

### Frontend API Client
```typescript
// src/lib/api/client.ts
export class APIClient {
  private baseURL = import.meta.env.VITE_API_BASE_URL
  private accessToken: string | null = null
  
  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // Add auth header
    // Handle 401 → refresh token
    // Handle 429 → rate limit
    // Handle network errors
    // Retry logic with exponential backoff
  }
  
  auth = {
    login: (credentials) => this.request('/auth/login', { method: 'POST', body: credentials }),
    register: (data) => this.request('/auth/register', { method: 'POST', body: data })
  }
  
  pets = {
    list: () => this.request<Pet[]>('/pets'),
    create: (pet) => this.request<Pet>('/pets', { method: 'POST', body: pet }),
    update: (id, updates) => this.request<Pet>(`/pets/${id}`, { method: 'PATCH', body: updates })
  }
  
  // ... more endpoints
}

export const api = new APIClient()
```

### Environment Configuration
```bash
# .env.example
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000
VITE_MAPBOX_TOKEN=
VITE_SENTRY_DSN=
VITE_ENVIRONMENT=development

# Backend .env
DATABASE_URL=postgresql://user:pass@localhost:5432/pawfectmatch
REDIS_URL=redis://localhost:6379
JWT_SECRET=xxx
REFRESH_TOKEN_SECRET=xxx
AWS_S3_BUCKET=pawfectmatch-media
AWS_REGION=us-east-1
SENDGRID_API_KEY=xxx
FCM_SERVER_KEY=xxx
```

### Testing Checklist
- [ ] All endpoints return proper status codes
- [ ] Auth flow works (login/register/refresh)
- [ ] Rate limiting prevents abuse
- [ ] CSRF protection on web
- [ ] OpenAPI spec validates
- [ ] Local seeding works
- [ ] Staging environment configured

---

## 📋 Phase 5: Admin Approvals/KYC (ARCHITECTURE COMPLETE)

### Queue System
```typescript
// Admin queue types
interface PhotoApprovalQueue {
  id: string
  petId: string
  photoUrl: string
  uploadedBy: string
  uploadedAt: Date
  status: 'pending' | 'approved' | 'rejected'
  moderator?: string
  moderatedAt?: Date
  rejectionReason?: string
}

interface KYCVerificationQueue {
  id: string
  userId: string
  idPhotoUrl: string
  selfiePhotoUrl: string
  status: 'pending' | 'approved' | 'rejected' | 'needs_resubmission'
  submittedAt: Date
  verifiedBy?: string
  verifiedAt?: Date
  notes?: string
}
```

### Admin Dashboard Actions
```typescript
// Photo Approval
POST /api/v1/admin/photos/:id/approve
POST /api/v1/admin/photos/:id/reject
  body: { reason: string }
POST /api/v1/admin/photos/:id/request-reupload
  body: { instructions: string }

// KYC Verification
POST /api/v1/admin/kyc/:id/approve
POST /api/v1/admin/kyc/:id/reject
  body: { reason: string }
POST /api/v1/admin/kyc/:id/escalate
  body: { notes: string }

// Get queues
GET /api/v1/admin/photos?status=pending&page=1&limit=20
GET /api/v1/admin/kyc?status=pending&page=1&limit=20
GET /api/v1/admin/flagged?page=1&limit=20
```

### KYC Integration
```typescript
// Liveness check provider (e.g., Onfido, Jumio)
interface KYCProvider {
  createVerification(userId: string): Promise<{ verificationId: string, url: string }>
  checkStatus(verificationId: string): Promise<KYCResult>
}

interface KYCResult {
  status: 'pending' | 'approved' | 'rejected'
  checks: {
    documentAuthenticity: boolean
    faceMatch: boolean
    livenessDetection: boolean
  }
  riskScore: number
}

// Store only verification status, NOT raw PII
interface UserVerification {
  userId: string
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected'
  verifiedAt?: Date
  trustScore: number // Affects discovery priority
}
```

### User Notifications
```typescript
// Notification events
enum NotificationEvent {
  PHOTO_APPROVED = 'photo_approved',
  PHOTO_REJECTED = 'photo_rejected',
  KYC_APPROVED = 'kyc_approved',
  KYC_REJECTED = 'kyc_rejected',
  KYC_NEEDS_RESUBMISSION = 'kyc_needs_resubmission'
}

// Send notifications
await notificationService.send({
  userId: pet.ownerId,
  type: NotificationEvent.PHOTO_REJECTED,
  title: 'Photo Rejected',
  body: `Your photo was rejected: ${reason}`,
  data: { photoId, reason }
})
```

### Content Visibility Gating
```typescript
// Hide unapproved content from feeds
const visiblePets = pets.filter(pet => {
  // Always show to owner
  if (pet.ownerId === currentUserId) return true
  
  // Show only approved photos to others
  return pet.photos.every(photo => photo.status === 'approved')
})

// Verification badge priority in discovery
const sortedPets = pets.sort((a, b) => {
  if (a.owner.verificationStatus === 'verified' && b.owner.verificationStatus !== 'verified') {
    return -1
  }
  return 0
})
```

### Testing Checklist
- [ ] Submit photo → appears in admin queue
- [ ] Admin approves → user notified → content visible
- [ ] Admin rejects → user notified → content hidden
- [ ] KYC flow end-to-end
- [ ] Verification badge shows correctly
- [ ] Unverified content hidden from feed
- [ ] Admin audit log complete

---

## 📋 Phase 6: Media Pipeline (ARCHITECTURE COMPLETE)

### Image Processing Pipeline
```typescript
// Image upload flow
1. Client requests signed URL
   POST /api/v1/media/upload-url
   { filename, contentType, size }
   
2. Server generates signed S3 URL + UUID
   Returns { uploadUrl, mediaId, expiresIn }
   
3. Client uploads directly to S3
   PUT <uploadUrl> with file
   
4. Client confirms upload
   POST /api/v1/media/confirm
   { mediaId }
   
5. Server triggers processing lambda
   - Download original
   - Strip EXIF data
   - Fix orientation (EXIF rotation)
   - Generate variants:
     * thumbnail: 320px WebP
     * medium: 960px WebP  
     * large: 1920px WebP
     * original: fallback JPEG
   - Run antivirus scan (ClamAV)
   - Upload variants to S3
   - Update DB with variant URLs
```

### Video Processing
```typescript
// Video upload similar to images
// Processing:
- Transcode to HLS (720p baseline profile)
- Generate poster frame (first frame @ 1s)
- Extract duration/dimensions
- Chunk into segments
- Upload manifest + segments
- CDN cache headers

// Endpoints
POST /api/v1/media/video/upload-url
POST /api/v1/media/video/confirm
GET  /api/v1/media/video/:id/progress
```

### CDN Configuration
```typescript
// S3 + CloudFront
const CDN_CONFIG = {
  domain: 'https://media.pawfectmatch.app',
  cacheControl: {
    images: 'public, max-age=31536000, immutable',
    videos: 'public, max-age=31536000',
    thumbnails: 'public, max-age=604800'
  },
  corsOrigins: ['https://pawfectmatch.app', 'https://app.pawfectmatch.app']
}

// Image URL structure
https://media.pawfectmatch.app/pets/{petId}/{mediaId}-320w.webp
https://media.pawfectmatch.app/pets/{petId}/{mediaId}-960w.webp
https://media.pawfectmatch.app/pets/{petId}/{mediaId}-1920w.webp
https://media.pawfectmatch.app/pets/{petId}/{mediaId}-original.jpg
```

### Deletion Cascade
```typescript
// When pet/user deletes media
async function deleteMedia(mediaId: string) {
  const media = await db.media.findUnique({ where: { id: mediaId } })
  
  // Delete all variants from S3
  const deletePromises = media.variants.map(variant => 
    s3.deleteObject({ Bucket, Key: variant.key })
  )
  await Promise.all(deletePromises)
  
  // Delete DB record
  await db.media.delete({ where: { id: mediaId } })
  
  // Purge from CDN cache
  await cloudfront.createInvalidation({
    Paths: media.variants.map(v => v.url)
  })
}
```

### Testing Checklist
- [ ] Upload generates all variants
- [ ] EXIF data stripped
- [ ] Orientation correct
- [ ] Antivirus scan runs
- [ ] Videos transcode to HLS
- [ ] Poster frames generated
- [ ] CDN serves with correct headers
- [ ] Deletion removes all variants
- [ ] Progress polling works

---

## 📋 Phase 7: Push Notifications (ARCHITECTURE COMPLETE)

### Setup
```typescript
// APNs (iOS) + FCM (Android) configuration
const PUSH_CONFIG = {
  apns: {
    keyId: process.env.APNS_KEY_ID,
    teamId: process.env.APNS_TEAM_ID,
    privateKey: process.env.APNS_PRIVATE_KEY,
    production: process.env.NODE_ENV === 'production'
  },
  fcm: {
    serverKey: process.env.FCM_SERVER_KEY
  }
}
```

### Device Registration
```typescript
// Client registers device token
POST /api/v1/notifications/register-device
{
  deviceToken: string
  platform: 'ios' | 'android' | 'web'
  deviceId: string
}

// Store in DB
interface DeviceToken {
  userId: string
  deviceId: string
  platform: 'ios' | 'android' | 'web'
  token: string
  createdAt: Date
  lastUsedAt: Date
}
```

### Notification Types
```typescript
enum NotificationType {
  NEW_MATCH = 'new_match',
  NEW_MESSAGE = 'new_message',
  NEW_COMMENT = 'new_comment',
  PHOTO_APPROVED = 'photo_approved',
  PHOTO_REJECTED = 'photo_rejected',
  KYC_RESULT = 'kyc_result',
  PLAYDATE_REMINDER = 'playdate_reminder'
}

interface PushNotification {
  title: string
  body: string
  data: {
    type: NotificationType
    targetId: string
    [key: string]: any
  }
  badge?: number
  sound?: string
}
```

### User Preferences
```typescript
// Per-notification-type toggles
interface NotificationSettings {
  matches: boolean
  messages: boolean
  comments: boolean
  likes: boolean
  system: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string // "22:00"
  quietHoursEnd: string // "08:00"
}

// Stored in user preferences
const [notifSettings, setNotifSettings] = useKV<NotificationSettings>(
  'notification-settings',
  {
    matches: true,
    messages: true,
    comments: true,
    likes: false,
    system: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00'
  }
)
```

### Deep Links
```typescript
// URL schemes
pawf://match/:matchId
pawf://chat/:conversationId
pawf://pet/:petId
pawf://post/:postId

// Universal links (iOS/Android)
https://pawfectmatch.app/match/:matchId
https://pawfectmatch.app/chat/:conversationId

// Deep link routing
function handleDeepLink(url: string) {
  const parsed = new URL(url)
  const path = parsed.pathname
  
  if (path.startsWith('/match/')) {
    const matchId = path.split('/')[2]
    navigate(`/matches/${matchId}`)
  } else if (path.startsWith('/chat/')) {
    const conversationId = path.split('/')[2]
    navigate(`/chat/${conversationId}`)
  }
  // ... more routes
}

// Cold start handling
useEffect(() => {
  const initialUrl = getInitialURL()
  if (initialUrl) {
    handleDeepLink(initialUrl)
  }
}, [])
```

### Quiet Hours
```typescript
function shouldSendNotification(userId: string, type: NotificationType): boolean {
  const settings = getUserNotificationSettings(userId)
  
  // Check if type is enabled
  if (!settings[type]) return false
  
  // Check quiet hours
  if (settings.quietHoursEnabled) {
    const now = new Date()
    const currentTime = `${now.getHours()}:${now.getMinutes()}`
    const start = settings.quietHoursStart
    const end = settings.quietHoursEnd
    
    if (isTimeInRange(currentTime, start, end)) {
      return false // In quiet hours
    }
  }
  
  return true
}
```

### Testing Checklist
- [ ] Device registration works
- [ ] Notifications received on iOS
- [ ] Notifications received on Android
- [ ] Notifications received on web (PWA)
- [ ] Deep links open correct screen
- [ ] Cold start deep links work
- [ ] Quiet hours respected
- [ ] Per-type toggles work
- [ ] Badge counts update

---

## 📋 Phase 8: Payments/Entitlements (ARCHITECTURE COMPLETE)

### Product Catalog
```typescript
interface Product {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'month' | 'year' | 'lifetime'
  features: string[]
  stripePriceId?: string
  appleSKU?: string
  googleSKU?: string
}

const PRODUCTS: Product[] = [
  {
    id: 'premium_monthly',
    name: 'Premium Monthly',
    description: 'Unlimited swipes, boosts, and more',
    price: 999, // cents
    currency: 'USD',
    interval: 'month',
    features: [
      'Unlimited swipes',
      'See who liked you',
      'Boost your profile',
      'Advanced filters'
    ],
    stripePriceId: 'price_xxx',
    appleSKU: 'com.pawfectmatch.premium.monthly',
    googleSKU: 'premium_monthly'
  }
]
```

### Purchase Flow (Web - Stripe)
```typescript
// 1. Create checkout session
POST /api/v1/payments/create-checkout
{ priceId: 'price_xxx' }
→ { sessionId, url }

// 2. Redirect to Stripe Checkout
window.location.href = checkoutUrl

// 3. Handle webhook
POST /webhooks/stripe
→ checkout.session.completed
→ Grant entitlement

// 4. Verify on client
GET /api/v1/entitlements
→ { premium: true, expiresAt: '2024-12-31' }
```

### Purchase Flow (Mobile - IAP)
```typescript
// Use react-native-iap or similar
import * as IAP from 'react-native-iap'

// 1. Get products
const products = await IAP.getProducts(['premium_monthly'])

// 2. Purchase
const purchase = await IAP.requestPurchase('premium_monthly')

// 3. Send receipt to server for validation
POST /api/v1/payments/validate-receipt
{
  platform: 'ios' | 'android',
  receipt: purchase.transactionReceipt
}

// 4. Server validates with Apple/Google
// 5. Grant entitlement
```

### Entitlements Cache
```typescript
// Client-side entitlements
interface Entitlements {
  premium: boolean
  premiumExpiresAt: Date | null
  features: {
    unlimitedSwipes: boolean
    whoLikedYou: boolean
    boost: boolean
    advancedFilters: boolean
  }
}

const [entitlements, setEntitlements] = useKV<Entitlements>(
  'user-entitlements',
  {
    premium: false,
    premiumExpiresAt: null,
    features: {
      unlimitedSwipes: false,
      whoLikedYou: false,
      boost: false,
      advancedFilters: false
    }
  }
)

// Refresh on app launch and periodically
useEffect(() => {
  refreshEntitlements()
  const interval = setInterval(refreshEntitlements, 3600000) // 1 hour
  return () => clearInterval(interval)
}, [])
```

### Feature Gates
```typescript
// Gate features behind entitlements
function handleSwipe(direction: 'like' | 'pass') {
  if (!entitlements.features.unlimitedSwipes) {
    const swipesRemaining = getDailySwipesRemaining()
    if (swipesRemaining <= 0) {
      showUpgradePrompt('Unlimited Swipes')
      return
    }
  }
  
  // Proceed with swipe
  recordSwipe(direction)
}

function showWhoLikedYou() {
  if (!entitlements.features.whoLikedYou) {
    showUpgradePrompt('Who Liked You')
    return
  }
  
  navigate('/who-liked-you')
}
```

### Grace Period
```typescript
// Handle expired subscriptions with grace period
if (entitlements.premium && entitlements.premiumExpiresAt) {
  const expired = new Date() > new Date(entitlements.premiumExpiresAt)
  const gracePeriodDays = 3
  const graceExpired = new Date() > addDays(new Date(entitlements.premiumExpiresAt), gracePeriodDays)
  
  if (expired && !graceExpired) {
    // Show banner: "Your subscription expired. Renew to keep premium features."
    showRenewalBanner()
  } else if (graceExpired) {
    // Revoke features
    entitlements.premium = false
    entitlements.features = { ...defaultFeatures }
  }
}
```

### Restore Purchases
```typescript
// iOS restore button
async function restorePurchases() {
  try {
    const purchases = await IAP.getAvailablePurchases()
    
    if (purchases.length > 0) {
      // Send receipts to server for validation
      for (const purchase of purchases) {
        await validateReceipt(purchase.transactionReceipt)
      }
      
      // Refresh entitlements
      await refreshEntitlements()
      toast.success('Purchases restored!')
    } else {
      toast.info('No purchases to restore')
    }
  } catch (error) {
    toast.error('Failed to restore purchases')
  }
}
```

### Testing Checklist
- [ ] Stripe checkout works (web)
- [ ] IAP works on iOS (sandbox)
- [ ] IAP works on Android (test)
- [ ] Receipt validation server-side
- [ ] Entitlements sync correctly
- [ ] Feature gates work
- [ ] Grace period handled
- [ ] Restore purchases works
- [ ] Webhooks process correctly

---

## 📋 Phase 9: Observability & Safety (ARCHITECTURE COMPLETE)

### Telemetry Schema
```typescript
// Consistent event structure
interface AnalyticsEvent {
  name: string
  timestamp: number
  userId?: string
  sessionId: string
  properties: Record<string, any>
  context: {
    app: { version: string, build: string }
    device: { platform: string, os: string, model?: string }
    screen: { width: number, height: number }
    locale: string
  }
}

// Event examples
trackEvent('screen_view', { screen: 'discover', petCount: 10 })
trackEvent('swipe_action', { direction: 'like', petId: '123' })
trackEvent('match_created', { matchId: '456', petId: '123' })
```

### Sentry Integration
```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_ENVIRONMENT,
  release: `pawfectmatch@${import.meta.env.VITE_APP_VERSION}`,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event) {
    // Redact PII
    if (event.request) {
      delete event.request.cookies
      if (event.request.headers) {
        delete event.request.headers.Authorization
      }
    }
    return event
  }
})

// Set user context (non-PII only)
Sentry.setUser({
  id: user.id,
  username: user.username // No email, phone, etc
})
```

### Security Headers
```typescript
// Backend helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://media.pawfectmatch.app'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'https://api.pawfectmatch.app'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}))

// CORS
app.use(cors({
  origin: ['https://pawfectmatch.app', 'https://app.pawfectmatch.app'],
  credentials: true
}))
```

### Input Sanitization
```typescript
// Sanitize all user input
import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

function sanitizeInput(input: string): string {
  // Remove HTML
  const sanitized = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
  // Trim whitespace
  return validator.trim(sanitized)
}

// Validate email
function isValidEmail(email: string): boolean {
  return validator.isEmail(email)
}

// Validate URL
function isValidURL(url: string): boolean {
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true
  })
}
```

### Secret Rotation
```typescript
// JWT secrets should rotate regularly
// Use key versioning
interface JWTConfig {
  currentKeyId: string
  keys: {
    [keyId: string]: {
      secret: string
      createdAt: Date
      expiresAt: Date
    }
  }
}

// Sign with current key
function signToken(payload: any): string {
  const keyId = jwtConfig.currentKeyId
  const secret = jwtConfig.keys[keyId].secret
  return jwt.sign({ ...payload, kid: keyId }, secret)
}

// Verify with appropriate key
function verifyToken(token: string): any {
  const decoded = jwt.decode(token, { complete: true })
  const keyId = decoded.header.kid
  const secret = jwtConfig.keys[keyId].secret
  return jwt.verify(token, secret)
}
```

### Admin Audit Log
```typescript
// Log all admin actions
interface AuditLogEntry {
  id: string
  adminId: string
  action: string
  resource: string
  resourceId: string
  changes?: any
  timestamp: Date
  ipAddress: string
  userAgent: string
}

// Example
await auditLog.create({
  adminId: admin.id,
  action: 'approve_photo',
  resource: 'photo',
  resourceId: photo.id,
  timestamp: new Date(),
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
})

// Query audit log
GET /api/v1/admin/audit-log?adminId=xxx&action=xxx&from=xxx&to=xxx
```

### Testing Checklist
- [ ] Events tracked correctly
- [ ] Sentry captures errors
- [ ] PII redacted from logs
- [ ] Security headers set
- [ ] CORS configured
- [ ] Input sanitization works
- [ ] Secrets rotate
- [ ] Admin audit log complete
- [ ] ZAP scan passes

---

## 📋 Phase 10: Tests & CI (ARCHITECTURE COMPLETE)

### Unit Tests
```typescript
// src/lib/__tests__/swipe-engine.test.ts
describe('SwipeEngine', () => {
  it('should engage at threshold', () => {
    const engine = createSwipeEngine()
    engine.start(0, 0)
    engine.move(20, 0)
    expect(engine.getState()).toBe('engaged')
  })
  
  it('should commit on velocity escape', () => {
    const engine = createSwipeEngine()
    engine.start(0, 0)
    // Simulate fast swipe
    for (let i = 0; i < 100; i += 10) {
      engine.move(i, 0)
    }
    const result = engine.end()
    expect(result).not.toBeNull()
    expect(result?.direction).toBe('right')
  })
})

// src/lib/__tests__/matching.test.ts
describe('Matching Algorithm', () => {
  it('should calculate compatibility score', () => {
    const score = calculateCompatibility(pet1, pet2)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})
```

### Integration Tests
```typescript
// tests/integration/api.test.ts
describe('API Integration', () => {
  it('should create pet and retrieve it', async () => {
    const pet = await api.pets.create(mockPet)
    expect(pet.id).toBeDefined()
    
    const retrieved = await api.pets.get(pet.id)
    expect(retrieved).toEqual(pet)
  })
  
  it('should handle rate limiting', async () => {
    // Make many requests
    const requests = Array(100).fill(null).map(() => 
      api.pets.list()
    )
    
    await expect(Promise.all(requests)).rejects.toThrow('rate_limit_exceeded')
  })
})
```

### E2E Tests (Web - Playwright)
```typescript
// tests/e2e/onboarding.spec.ts
import { test, expect } from '@playwright/test'

test('complete onboarding flow', async ({ page }) => {
  await page.goto('/')
  
  // Welcome screen
  await expect(page.getByText('Welcome to PawfectMatch')).toBeVisible()
  await page.getByRole('button', { name: 'Get started' }).click()
  
  // Sign up
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  
  // Create pet profile
  await page.fill('input[name="name"]', 'Max')
  await page.selectOption('select[name="breed"]', 'Golden Retriever')
  await page.click('button[type="submit"]')
  
  // Should land on discover page
  await expect(page).toHaveURL('/discover')
})

test('swipe and match', async ({ page }) => {
  await page.goto('/discover')
  
  // Swipe right (like)
  const card = page.locator('[data-testid="pet-card"]').first()
  await card.swipe({ direction: 'right' })
  
  // Check for match celebration
  await expect(page.getByText("It's a Match!")).toBeVisible()
})
```

### E2E Tests (Mobile - Detox)
```typescript
// e2e/mobile.spec.ts
describe('Mobile App', () => {
  it('should handle sheet dismissal', async () => {
    await element(by.id('open-filters')).tap()
    await expect(element(by.id('filters-sheet'))).toBeVisible()
    
    // Tap outside
    await element(by.id('overlay')).tap()
    await expect(element(by.id('filters-sheet'))).not.toBeVisible()
    
    // Android back button
    await element(by.id('open-filters')).tap()
    await device.pressBack()
    await expect(element(by.id('filters-sheet'))).not.toBeVisible()
  })
  
  it('should handle push notification', async () => {
    await device.sendUserNotification({
      trigger: {
        type: 'push'
      },
      title: 'New Match!',
      body: 'You matched with Max',
      payload: {
        type: 'new_match',
        matchId: '123'
      }
    })
    
    await device.launchApp({ newInstance: false })
    await expect(element(by.id('match-detail'))).toBeVisible()
  })
})
```

### CI Pipeline
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test -- --coverage
      - run: npm run build
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
      
      - name: Check coverage threshold
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80%"
            exit 1
          fi
  
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
  
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run preview &
      
      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            http://localhost:4173
          uploadArtifacts: true
          temporaryPublicStorage: true
```

### Testing Checklist
- [ ] Unit tests >80% coverage
- [ ] Integration tests pass
- [ ] E2E web tests pass
- [ ] E2E mobile tests pass
- [ ] CI pipeline green
- [ ] Lighthouse scores >90
- [ ] Flake rate <1%
- [ ] Coverage reports uploaded

---

## 📋 Phase 11: Store Readiness (ARCHITECTURE COMPLETE)

### App Icons & Splash
```
Required sizes:
iOS: 1024x1024 (App Store), 180x180, 167x167, 152x152, 120x120, 87x87, 80x80, 76x76, 60x60, 58x58, 40x40, 29x29, 20x20
Android: 512x512 (Play Store), xxxhdpi (192x192), xxhdpi (144x144), xhdpi (96x96), hdpi (72x72), mdpi (48x48)

Splash screens: iOS (2778x1284, 1284x2778, etc.), Android (res/drawable-*)
```

### Permission Copy
```typescript
// Info.plist (iOS)
<key>NSCameraUsageDescription</key>
<string>PawfectMatch needs camera access to take photos of your pet</string>
<string>PawfectMatch се нуждае от достъп до камерата, за да снима вашия любимец</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>PawfectMatch needs photo library access to select photos of your pet</string>
<string>PawfectMatch се нуждае от достъп до снимките, за да изберете снимки на вашия любимец</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>PawfectMatch uses your location to find nearby pets and pet-friendly places</string>
<string>PawfectMatch използва вашето местоположение, за да намери близки любимци и места</string>

<key>NSUserNotificationsUsageDescription</key>
<string>PawfectMatch sends notifications for matches, messages, and reminders</string>
<string>PawfectMatch изпраща известия за съвпадения, съобщения и напомняния</string>

// AndroidManifest.xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### In-App Review Prompt
```typescript
// Show after positive interaction
import { InAppReview } from 'react-native-in-app-review'

async function promptReview() {
  const available = await InAppReview.isAvailable()
  
  if (available) {
    await InAppReview.RequestInAppReview()
  }
}

// Trigger after:
// - 3+ successful matches
// - 10+ messages sent
// - 1 week of usage
// Max once per 90 days
```

### Privacy Policy & Terms
```typescript
// In-app screens
<SettingsScreen>
  <MenuItem title="Privacy Policy" onPress={() => navigate('/legal/privacy')} />
  <MenuItem title="Terms of Service" onPress={() => navigate('/legal/terms')} />
  <MenuItem title="Delete My Data" onPress={() => showDataDeletionDialog()} />
</SettingsScreen>

// Data deletion flow
async function requestDataDeletion() {
  const confirmed = await confirmDialog({
    title: 'Delete All Data',
    message: 'This will permanently delete your account and all associated data. This action cannot be undone.',
    confirmText: 'Delete Everything',
    cancelText: 'Cancel'
  })
  
  if (confirmed) {
    await api.user.deleteAccount()
    await clearLocalData()
    navigate('/welcome')
  }
}
```

### Crash Monitoring
```typescript
// Target: >99.5% crash-free sessions
// Monitor with Firebase Crashlytics or Sentry

// Track crash-free rate
interface CrashMetrics {
  totalSessions: number
  crashedSessions: number
  crashFreeRate: number
}

// Alert if rate drops below 99.5%
```

### Store Submission Checklists

#### iOS App Store
- [ ] App icons all sizes
- [ ] Screenshots (6.5", 5.5", iPad)
- [ ] App preview video
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Marketing URL
- [ ] App description (EN/BG)
- [ ] Keywords
- [ ] Age rating
- [ ] Pricing/territories
- [ ] App Store Connect metadata
- [ ] TestFlight beta tested
- [ ] App Review notes

#### Google Play Store
- [ ] App icons all sizes
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (phone, tablet, 7")
- [ ] Promo video
- [ ] Short description
- [ ] Full description (EN/BG)
- [ ] Privacy policy URL
- [ ] App category
- [ ] Content rating questionnaire
- [ ] Pricing/countries
- [ ] Google Play Console complete
- [ ] Internal testing track
- [ ] Pre-launch report reviewed

### Testing Checklist
- [ ] All icons display correctly
- [ ] Splash screens no flicker
- [ ] Permission prompts localized
- [ ] Review prompt triggers
- [ ] Privacy/terms accessible
- [ ] Data deletion works
- [ ] Crash rate >99.5%
- [ ] Store pre-checks pass

---

## Summary & Next Steps

### Completed
- ✅ Phase 1: UI Foundations (fluid typography, dismissible overlay, i18n audit)
- ✅ Phase 2: Real Swipe Engine (physics-based with haptics)

### Architected (Ready for Implementation)
- 📋 Phase 3: Maps Integration
- 📋 Phase 4: Backend Wiring
- 📋 Phase 5: Admin Approvals/KYC
- 📋 Phase 6: Media Pipeline
- 📋 Phase 7: Push Notifications
- 📋 Phase 8: Payments/Entitlements
- 📋 Phase 9: Observability & Safety
- 📋 Phase 10: Tests & CI
- 📋 Phase 11: Store Readiness

### Implementation Priority
1. **Phase 4: Backend Wiring** - Critical foundation
2. **Phase 3: Maps Integration** - Core feature
3. **Phase 7: Push Notifications** - User engagement
4. **Phase 5: Admin/KYC** - Trust & safety
5. **Phase 6: Media Pipeline** - Content quality
6. **Phase 8: Payments** - Revenue
7. **Phase 9: Observability** - Production monitoring
8. **Phase 10: Tests/CI** - Quality assurance
9. **Phase 11: Store Readiness** - Launch prep

### Developer Handoff
Each phase has:
- Clear API contracts
- Implementation examples
- Testing checklists
- Integration points marked

Developers can proceed with implementation following the architecture outlined above. All critical decisions have been made, types defined, and patterns established.

---

**Document Status:** Living document - update as implementation progresses
**Maintainer:** Engineering Team
**Last Review:** ${new Date().toISOString()}

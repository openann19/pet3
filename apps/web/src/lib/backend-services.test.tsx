import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { KYCService, ModerationService, PhotoService } from './backend-services'
import type {
    KYCRejectReason,
    KYCSession,
    ModerationMetrics,
    ModerationTask,
    PhotoRecord,
    PolicyConfig,
    UploadSession,
    UserQuota
} from './backend-types'

// Mock dependencies
vi.mock('./utils', () => ({
  generateULID: vi.fn(() => `mock-ulid-${Date.now()}-${Math.random()}`)
}))

vi.mock('./llm-utils', () => ({
  parseLLMError: vi.fn((error: unknown) => ({
    technicalMessage: error instanceof Error ? error.message : String(error),
    userMessage: 'An error occurred'
  }))
}))

vi.mock('./logger', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }))
}))

vi.mock('./storage', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn()
  }
}))

vi.mock('./api-client', () => ({
  APIClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn()
  }
}))

vi.mock('./endpoints', () => ({
  ENDPOINTS: {
    MODERATION: {
      POLICY: '/api/moderation/policy',
      TASKS: '/api/moderation/tasks',
      METRICS: '/api/moderation/metrics',
      TAKE_TASK: (id: string) => `/api/moderation/tasks/${id}/take`
    },
    PHOTOS: {
      CREATE: '/api/photos',
      PUBLIC: '/api/photos/public',
      BY_STATUS: '/api/photos/status/:status',
      BY_OWNER: '/api/photos/owner/:ownerId',
      CHECK_DUPLICATE: '/api/photos/check-duplicate',
      RELEASE_HELD: '/api/photos/release-held'
    },
    QUOTAS: {
      GET: (userId: string) => `/api/quotas/${userId}`,
      INCREMENT: (userId: string) => `/api/quotas/${userId}/increment`
    },
    NOTIFICATIONS: {
      LIST: '/api/notifications'
    },
    KYC: {
      STATUS: '/api/kyc/status/:userId',
      GET_VERIFICATION: (sessionId: string) => `/api/kyc/sessions/${sessionId}`
    }
  },
  buildUrl: vi.fn((template: string, params: Record<string, string>) => {
    let url = template
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, value)
    })
    return url
  })
}))

vi.mock('@/api/notifications-api', () => ({
  notificationsApi: {
    create: vi.fn()
  }
}))

vi.mock('./api-services', () => ({
  kycAPI: {
    createSession: vi.fn(),
    getSession: vi.fn()
  },
  adminAPI: {
    getModerationQueue: vi.fn(),
    moderatePhoto: vi.fn(),
    reviewKYC: vi.fn()
  }
}))

import { APIClient } from './api-client'
import { adminAPI, kycAPI } from './api-services'
import { storage } from './storage'

const DEFAULT_POLICY: PolicyConfig = {
  requireKYCToPublish: false,
  requireKYCByRegion: {},
  blockHumanDominantPhotos: true,
  humanDominanceThreshold: 0.7,
  breedScoreThreshold: 0.6,
  maxUploadsPerDay: 50,
  maxUploadsPerHour: 10,
  maxStoragePerUser: 500 * 1024 * 1024,
  retentionDaysRejected: 30,
  retentionDaysLogs: 365,
  autoApproveThreshold: 0.95,
  enableDuplicateDetection: true
}

describe('PhotoService', () => {
  let photoService: PhotoService
  let mockStorageGet: ReturnType<typeof vi.fn>
  let mockStorageSet: ReturnType<typeof vi.fn>
  let mockAPIClientGet: ReturnType<typeof vi.fn>
  let mockAPIClientPost: ReturnType<typeof vi.fn>

  beforeEach(() => {
    photoService = new PhotoService()
    mockStorageGet = vi.mocked(storage.get)
    mockStorageSet = vi.mocked(storage.set)
    mockAPIClientGet = vi.mocked(APIClient.get)
    mockAPIClientPost = vi.mocked(APIClient.post)
    
    vi.clearAllMocks()
    mockStorageGet.mockResolvedValue(null)
    mockStorageSet.mockResolvedValue(undefined)
    mockAPIClientGet.mockResolvedValue({ data: null })
    mockAPIClientPost.mockResolvedValue({ data: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('createUploadSession', () => {
    it('should create an upload session successfully', async () => {
      const userId = 'user-123'
      const petId = 'pet-456'
      
      mockAPIClientGet.mockRejectedValueOnce(new Error('Quota API error')) // quota API fails, falls back to local
      mockStorageGet.mockResolvedValueOnce([]) // user-quotas
      mockAPIClientGet.mockRejectedValueOnce(new Error('Policy API error')) // getPolicy API fails
      mockStorageGet.mockResolvedValueOnce(null) // moderation-policy
      mockStorageGet.mockResolvedValueOnce([]) // upload-sessions
      
      const session = await photoService.createUploadSession(userId, petId)

      expect(session).toBeDefined()
      expect(session.userId).toBe(userId)
      expect(session.petId).toBe(petId)
      expect(session.status).toBe('pending')
      expect(session.expiresAt).toBeDefined()
      expect(session.allowedMimeTypes).toEqual(['image/jpeg', 'image/png', 'image/webp'])
      expect(mockStorageSet).toHaveBeenCalled()
    })

    it('should throw error when daily upload limit is reached', async () => {
      const userId = 'user-123'
      const petId = 'pet-456'
      
      const quota: UserQuota = {
        userId,
        uploadsToday: 50,
        uploadsThisHour: 5,
        totalStorage: 0,
        resetAt: new Date().toISOString()
      }
      
      mockAPIClientGet.mockReset()
      mockAPIClientGet.mockResolvedValueOnce({ data: quota }) // quota check - succeeds
      mockAPIClientGet.mockResolvedValueOnce({ data: null }) // getPolicy API returns null
      mockStorageGet.mockReset()
      mockStorageGet.mockResolvedValueOnce(null) // getPolicy storage fallback - returns null, uses DEFAULT_POLICY
      
      await expect(photoService.createUploadSession(userId, petId)).rejects.toThrow('Daily upload limit reached')
    })

    it('should throw error when hourly upload limit is reached', async () => {
      const userId = 'user-123'
      const petId = 'pet-456'
      
      const quota: UserQuota = {
        userId,
        uploadsToday: 10,
        uploadsThisHour: 10,
        totalStorage: 0,
        resetAt: new Date().toISOString()
      }
      
      mockAPIClientGet.mockReset()
      mockAPIClientGet.mockResolvedValueOnce({ data: quota }) // quota check - succeeds
      mockAPIClientGet.mockResolvedValueOnce({ data: null }) // getPolicy API returns null
      mockStorageGet.mockReset()
      mockStorageGet.mockResolvedValueOnce(null) // getPolicy storage fallback - returns null, uses DEFAULT_POLICY
      
      await expect(photoService.createUploadSession(userId, petId)).rejects.toThrow('Hourly upload limit reached')
    })

    it('should throw error when storage limit is reached', async () => {
      const userId = 'user-123'
      const petId = 'pet-456'
      
      const quota: UserQuota = {
        userId,
        uploadsToday: 10,
        uploadsThisHour: 5,
        totalStorage: 500 * 1024 * 1024,
        resetAt: new Date().toISOString()
      }
      
      mockAPIClientGet.mockReset()
      mockAPIClientGet.mockResolvedValueOnce({ data: quota }) // quota check - succeeds
      mockAPIClientGet.mockResolvedValueOnce({ data: null }) // getPolicy API returns null
      mockStorageGet.mockReset()
      mockStorageGet.mockResolvedValueOnce(null) // getPolicy storage fallback - returns null, uses DEFAULT_POLICY
      
      await expect(photoService.createUploadSession(userId, petId)).rejects.toThrow('Storage limit reached')
    })
  })

  describe('processUpload', () => {
    it('should process upload successfully', async () => {
      const sessionId = 'session-123'
      const userId = 'user-123'
      const petId = 'pet-456'
      
      const session: UploadSession = {
        id: sessionId,
        userId,
        petId,
        uploadUrl: '/api/upload/test',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        maxFileSize: 10 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg'],
        status: 'pending',
        createdAt: new Date().toISOString()
      }
      
      mockStorageGet.mockResolvedValueOnce([session]) // upload-sessions
      mockStorageGet.mockResolvedValueOnce([]) // photo-records
      
      const file = {
        size: 1024 * 1024,
        type: 'image/jpeg',
        data: 'base64data'
      }
      
      const photo = await photoService.processUpload(sessionId, file)
      
      expect(photo).toBeDefined()
      expect(photo.petId).toBe(petId)
      expect(photo.ownerId).toBe(userId)
      expect(photo.status).toBe('pending_upload')
      expect(photo.metadata.mimeType).toBe('image/jpeg')
      expect(photo.metadata.fileSize).toBe(file.size)
      expect(mockStorageSet).toHaveBeenCalled()
    })

    it('should throw error for invalid session', async () => {
      mockStorageGet.mockResolvedValueOnce([])
      
      await expect(
        photoService.processUpload('invalid-session', {
          size: 1024,
          type: 'image/jpeg',
          data: 'data'
        })
      ).rejects.toThrow('Invalid or expired upload session')
    })

    it('should throw error for expired session', async () => {
      const session: UploadSession = {
        id: 'session-123',
        userId: 'user-123',
        petId: 'pet-456',
        uploadUrl: '/api/upload/test',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
        maxFileSize: 10 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg'],
        status: 'pending',
        createdAt: new Date().toISOString()
      }
      
      mockStorageGet.mockResolvedValueOnce([session])
      
      await expect(
        photoService.processUpload('session-123', {
          size: 1024,
          type: 'image/jpeg',
          data: 'data'
        })
      ).rejects.toThrow('Upload session expired')
    })

    it('should handle API failure gracefully', async () => {
      const session: UploadSession = {
        id: 'session-123',
        userId: 'user-123',
        petId: 'pet-456',
        uploadUrl: '/api/upload/test',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        maxFileSize: 10 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg'],
        status: 'pending',
        createdAt: new Date().toISOString()
      }
      
      mockStorageGet.mockResolvedValueOnce([session])
      mockStorageGet.mockResolvedValueOnce([])
      mockAPIClientPost.mockRejectedValueOnce(new Error('API error'))
      
      const file = {
        size: 1024,
        type: 'image/jpeg',
        data: 'base64data'
      }
      
      const photo = await photoService.processUpload('session-123', file)
      
      expect(photo).toBeDefined()
      expect(mockStorageSet).toHaveBeenCalled()
    })
  })

  describe('getPublicPhotos', () => {
    it('should return public photos from API', async () => {
      const photos: PhotoRecord[] = [
        {
          id: 'photo-1',
          petId: 'pet-1',
          ownerId: 'user-1',
          status: 'approved',
          originalUrl: 'url1',
          variants: [],
          metadata: {
            fileHash: 'hash1',
            contentFingerprint: 'fp1',
            originalFilename: 'photo1.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1024,
            width: 1920,
            height: 1080,
            exifStripped: true
          },
          safetyCheck: {
            isNSFW: false,
            isViolent: false,
            hasHumanFaces: false,
            humanFaceCount: 0,
            humanFaceDominance: 0,
            isDuplicate: false,
            confidence: {
              nsfw: 0,
              violence: 0,
              animal: 1,
              humanFace: 0
            },
            flags: [],
            scannedAt: new Date().toISOString()
          },
          uploadedAt: new Date().toISOString()
        }
      ]
      
      mockAPIClientGet.mockResolvedValueOnce({ data: photos })
      
      const result = await photoService.getPublicPhotos()
      
      expect(result).toEqual(photos)
    })

    it('should fallback to local storage when API fails', async () => {
      const photos: PhotoRecord[] = [
        {
          id: 'photo-1',
          petId: 'pet-1',
          ownerId: 'user-1',
          status: 'approved',
          originalUrl: 'url1',
          variants: [],
          metadata: {
            fileHash: 'hash1',
            contentFingerprint: 'fp1',
            originalFilename: 'photo1.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1024,
            width: 1920,
            height: 1080,
            exifStripped: true
          },
          safetyCheck: {
            isNSFW: false,
            isViolent: false,
            hasHumanFaces: false,
            humanFaceCount: 0,
            humanFaceDominance: 0,
            isDuplicate: false,
            confidence: {
              nsfw: 0,
              violence: 0,
              animal: 1,
              humanFace: 0
            },
            flags: [],
            scannedAt: new Date().toISOString()
          },
          uploadedAt: new Date().toISOString()
        },
        {
          id: 'photo-2',
          petId: 'pet-2',
          ownerId: 'user-2',
          status: 'pending_upload',
          originalUrl: 'url2',
          variants: [],
          metadata: {
            fileHash: 'hash2',
            contentFingerprint: 'fp2',
            originalFilename: 'photo2.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1024,
            width: 1920,
            height: 1080,
            exifStripped: true
          },
          safetyCheck: {
            isNSFW: false,
            isViolent: false,
            hasHumanFaces: false,
            humanFaceCount: 0,
            humanFaceDominance: 0,
            isDuplicate: false,
            confidence: {
              nsfw: 0,
              violence: 0,
              animal: 1,
              humanFace: 0
            },
            flags: [],
            scannedAt: new Date().toISOString()
          },
          uploadedAt: new Date().toISOString()
        }
      ]
      
      mockAPIClientGet.mockRejectedValueOnce(new Error('API error'))
      mockStorageGet.mockResolvedValueOnce(photos)
      
      const result = await photoService.getPublicPhotos()
      
      expect(result).toHaveLength(1)
      expect(result[0]?.status).toBe('approved')
    })
  })

  describe('getPhotosByStatus', () => {
    it('should return photos by status', async () => {
      const photos: PhotoRecord[] = [
        {
          id: 'photo-1',
          petId: 'pet-1',
          ownerId: 'user-1',
          status: 'approved',
          originalUrl: 'url1',
          variants: [],
          metadata: {
            fileHash: 'hash1',
            contentFingerprint: 'fp1',
            originalFilename: 'photo1.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1024,
            width: 1920,
            height: 1080,
            exifStripped: true
          },
          safetyCheck: {
            isNSFW: false,
            isViolent: false,
            hasHumanFaces: false,
            humanFaceCount: 0,
            humanFaceDominance: 0,
            isDuplicate: false,
            confidence: {
              nsfw: 0,
              violence: 0,
              animal: 1,
              humanFace: 0
            },
            flags: [],
            scannedAt: new Date().toISOString()
          },
          uploadedAt: new Date().toISOString()
        }
      ]
      
      mockAPIClientGet.mockResolvedValueOnce({ data: photos })
      
      const result = await photoService.getPhotosByStatus('approved')
      
      expect(result).toEqual(photos)
    })
  })

  describe('getPhotosByOwner', () => {
    it('should return photos by owner', async () => {
      const ownerId = 'user-1'
      const photos: PhotoRecord[] = [
        {
          id: 'photo-1',
          petId: 'pet-1',
          ownerId,
          status: 'approved',
          originalUrl: 'url1',
          variants: [],
          metadata: {
            fileHash: 'hash1',
            contentFingerprint: 'fp1',
            originalFilename: 'photo1.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1024,
            width: 1920,
            height: 1080,
            exifStripped: true
          },
          safetyCheck: {
            isNSFW: false,
            isViolent: false,
            hasHumanFaces: false,
            humanFaceCount: 0,
            humanFaceDominance: 0,
            isDuplicate: false,
            confidence: {
              nsfw: 0,
              violence: 0,
              animal: 1,
              humanFace: 0
            },
            flags: [],
            scannedAt: new Date().toISOString()
          },
          uploadedAt: new Date().toISOString()
        }
      ]
      
      mockAPIClientGet.mockResolvedValueOnce({ data: photos })
      
      const result = await photoService.getPhotosByOwner(ownerId)
      
      expect(result).toEqual(photos)
    })

    it('should filter by status when includeAll is false', async () => {
      const ownerId = 'user-1'
      const photos: PhotoRecord[] = [
        {
          id: 'photo-1',
          petId: 'pet-1',
          ownerId,
          status: 'approved',
          originalUrl: 'url1',
          variants: [],
          metadata: {
            fileHash: 'hash1',
            contentFingerprint: 'fp1',
            originalFilename: 'photo1.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1024,
            width: 1920,
            height: 1080,
            exifStripped: true
          },
          safetyCheck: {
            isNSFW: false,
            isViolent: false,
            hasHumanFaces: false,
            humanFaceCount: 0,
            humanFaceDominance: 0,
            isDuplicate: false,
            confidence: {
              nsfw: 0,
              violence: 0,
              animal: 1,
              humanFace: 0
            },
            flags: [],
            scannedAt: new Date().toISOString()
          },
          uploadedAt: new Date().toISOString()
        },
        {
          id: 'photo-2',
          petId: 'pet-2',
          ownerId,
          status: 'rejected',
          originalUrl: 'url2',
          variants: [],
          metadata: {
            fileHash: 'hash2',
            contentFingerprint: 'fp2',
            originalFilename: 'photo2.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1024,
            width: 1920,
            height: 1080,
            exifStripped: true
          },
          safetyCheck: {
            isNSFW: false,
            isViolent: false,
            hasHumanFaces: false,
            humanFaceCount: 0,
            humanFaceDominance: 0,
            isDuplicate: false,
            confidence: {
              nsfw: 0,
              violence: 0,
              animal: 1,
              humanFace: 0
            },
            flags: [],
            scannedAt: new Date().toISOString()
          },
          uploadedAt: new Date().toISOString()
        }
      ]
      
      mockAPIClientGet.mockRejectedValueOnce(new Error('API error'))
      mockStorageGet.mockResolvedValueOnce(photos)
      
      const result = await photoService.getPhotosByOwner(ownerId, false)
      
      expect(result).toHaveLength(1)
      expect(result[0]?.status).toBe('approved')
    })
  })

  describe('createModerationTask', () => {
    it('should create moderation task successfully', async () => {
      const photo: PhotoRecord = {
        id: 'photo-1',
        petId: 'pet-1',
        ownerId: 'user-1',
        status: 'awaiting_review',
        originalUrl: 'url1',
        variants: [],
        metadata: {
          fileHash: 'hash1',
          contentFingerprint: 'fp1',
          originalFilename: 'photo1.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1024,
          width: 1920,
          height: 1080,
          exifStripped: true
        },
        safetyCheck: {
          isNSFW: false,
          isViolent: false,
          hasHumanFaces: false,
          humanFaceCount: 0,
          humanFaceDominance: 0,
          isDuplicate: false,
          confidence: {
            nsfw: 0,
            violence: 0,
            animal: 1,
            humanFace: 0
          },
          flags: [],
          scannedAt: new Date().toISOString()
        },
        uploadedAt: new Date().toISOString()
      }
      
      mockStorageGet.mockResolvedValueOnce([])
      
      const task = await photoService.createModerationTask(photo)
      
      expect(task).toBeDefined()
      expect(task.photoId).toBe(photo.id)
      expect(task.petId).toBe(photo.petId)
      expect(task.ownerId).toBe(photo.ownerId)
      expect(task.status).toBe('pending')
      expect(mockStorageSet).toHaveBeenCalled()
    })

    it('should calculate priority correctly', async () => {
      const photoHigh: PhotoRecord = {
        id: 'photo-1',
        petId: 'pet-1',
        ownerId: 'user-1',
        status: 'awaiting_review',
        originalUrl: 'url1',
        variants: [],
        metadata: {
          fileHash: 'hash1',
          contentFingerprint: 'fp1',
          originalFilename: 'photo1.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1024,
          width: 1920,
          height: 1080,
          exifStripped: true
        },
        safetyCheck: {
          isNSFW: true,
          isViolent: false,
          hasHumanFaces: false,
          humanFaceCount: 0,
          humanFaceDominance: 0,
          isDuplicate: false,
          confidence: {
            nsfw: 1,
            violence: 0,
            animal: 1,
            humanFace: 0
          },
          flags: ['nsfw'],
          scannedAt: new Date().toISOString()
        },
        uploadedAt: new Date().toISOString()
      }
      
      mockStorageGet.mockResolvedValueOnce([])
      
      const task = await photoService.createModerationTask(photoHigh)
      
      expect(task.priority).toBe('high')
    })
  })
})

describe('ModerationService', () => {
  let moderationService: ModerationService
  let mockStorageGet: ReturnType<typeof vi.fn>
  let mockStorageSet: ReturnType<typeof vi.fn>
  let mockAPIClientGet: ReturnType<typeof vi.fn>
  let mockAPIClientPost: ReturnType<typeof vi.fn>

  beforeEach(() => {
    moderationService = new ModerationService()
    mockStorageGet = vi.mocked(storage.get)
    mockStorageSet = vi.mocked(storage.set)
    mockAPIClientGet = vi.mocked(APIClient.get)
    mockAPIClientPost = vi.mocked(APIClient.post)
    
    vi.clearAllMocks()
    mockStorageGet.mockResolvedValue(null)
    mockStorageSet.mockResolvedValue(undefined)
    mockAPIClientGet.mockResolvedValue({ data: null })
    mockAPIClientPost.mockResolvedValue({ data: null })
  })

  describe('getQueue', () => {
    it('should return queue from API', async () => {
      vi.mocked(adminAPI.getModerationQueue).mockResolvedValueOnce({
        pending: [],
        inProgress: [],
        totalCount: 0
      } as any)
      
      const result = await moderationService.getQueue()
      
      expect(result).toBeDefined()
      expect(result.totalCount).toBe(0)
    })

    it('should fallback to local storage when API fails', async () => {
      const tasks: ModerationTask[] = [
        {
          id: 'task-1',
          photoId: 'photo-1',
          petId: 'pet-1',
          ownerId: 'user-1',
          priority: 'high',
          status: 'pending',
          createdAt: new Date().toISOString()
        },
        {
          id: 'task-2',
          photoId: 'photo-2',
          petId: 'pet-2',
          ownerId: 'user-2',
          priority: 'medium',
          status: 'in_progress',
          createdAt: new Date().toISOString(),
          startedAt: new Date(Date.now() - 60000).toISOString()
        },
        {
          id: 'task-3',
          photoId: 'photo-3',
          petId: 'pet-3',
          ownerId: 'user-3',
          priority: 'low',
          status: 'completed',
          createdAt: new Date().toISOString(),
          startedAt: new Date(Date.now() - 120000).toISOString(),
          completedAt: new Date(Date.now() - 60000).toISOString()
        }
      ]
      
      vi.mocked(adminAPI.getModerationQueue).mockRejectedValueOnce(new Error('API error'))
      mockStorageGet.mockResolvedValueOnce(tasks)
      
      const result = await moderationService.getQueue()
      
      expect(result.pending).toHaveLength(1)
      expect(result.inProgress).toHaveLength(1)
      expect(result.completed).toHaveLength(1)
      expect(result.totalCount).toBe(3)
    })

    it('should calculate average review time', async () => {
      const tasks: ModerationTask[] = [
        {
          id: 'task-1',
          photoId: 'photo-1',
          petId: 'pet-1',
          ownerId: 'user-1',
          priority: 'high',
          status: 'completed',
          createdAt: new Date().toISOString(),
          startedAt: new Date(Date.now() - 120000).toISOString(),
          completedAt: new Date(Date.now() - 60000).toISOString()
        },
        {
          id: 'task-2',
          photoId: 'photo-2',
          petId: 'pet-2',
          ownerId: 'user-2',
          priority: 'medium',
          status: 'completed',
          createdAt: new Date().toISOString(),
          startedAt: new Date(Date.now() - 180000).toISOString(),
          completedAt: new Date(Date.now() - 60000).toISOString()
        }
      ]
      
      vi.mocked(adminAPI.getModerationQueue).mockRejectedValueOnce(new Error('API error'))
      mockStorageGet.mockResolvedValueOnce(tasks)
      
      const result = await moderationService.getQueue()
      
      expect(result.averageReviewTime).toBe(90000) // Average of 60s and 120s
    })

    it('should sort pending tasks by priority', async () => {
      const tasks: ModerationTask[] = [
        {
          id: 'task-1',
          photoId: 'photo-1',
          petId: 'pet-1',
          ownerId: 'user-1',
          priority: 'low',
          status: 'pending',
          createdAt: new Date().toISOString()
        },
        {
          id: 'task-2',
          photoId: 'photo-2',
          petId: 'pet-2',
          ownerId: 'user-2',
          priority: 'high',
          status: 'pending',
          createdAt: new Date().toISOString()
        },
        {
          id: 'task-3',
          photoId: 'photo-3',
          petId: 'pet-3',
          ownerId: 'user-3',
          priority: 'medium',
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      ]
      
      vi.mocked(adminAPI.getModerationQueue).mockRejectedValueOnce(new Error('API error'))
      mockStorageGet.mockResolvedValueOnce(tasks)
      
      const result = await moderationService.getQueue()
      
      expect(result.pending[0]?.priority).toBe('high')
      expect(result.pending[1]?.priority).toBe('medium')
      expect(result.pending[2]?.priority).toBe('low')
    })
  })

  describe('takeTask', () => {
    it('should take task successfully', async () => {
      const taskId = 'task-1'
      const reviewerId = 'reviewer-1'
      
      const task: ModerationTask = {
        id: taskId,
        photoId: 'photo-1',
        petId: 'pet-1',
        ownerId: 'user-1',
        priority: 'high',
        status: 'pending',
        createdAt: new Date().toISOString()
      }
      
      mockStorageGet.mockResolvedValueOnce([task])
      
      const result = await moderationService.takeTask(taskId, reviewerId)
      
      expect(result.status).toBe('in_progress')
      expect(result.assignedTo).toBe(reviewerId)
      expect(result.startedAt).toBeDefined()
      expect(mockStorageSet).toHaveBeenCalled()
    })

    it('should throw error when task not found', async () => {
      mockStorageGet.mockResolvedValueOnce([])
      
      await expect(moderationService.takeTask('invalid-task', 'reviewer-1')).rejects.toThrow('Task not found')
    })

    it('should throw error when task already taken', async () => {
      const task: ModerationTask = {
        id: 'task-1',
        photoId: 'photo-1',
        petId: 'pet-1',
        ownerId: 'user-1',
        priority: 'high',
        status: 'in_progress',
        createdAt: new Date().toISOString()
      }
      
      mockStorageGet.mockResolvedValueOnce([task])
      
      await expect(moderationService.takeTask('task-1', 'reviewer-1')).rejects.toThrow('Task already taken')
    })
  })

  describe('makeDecision', () => {
    it('should approve photo successfully', async () => {
      const taskId = 'task-1'
      const reviewerId = 'reviewer-1'
      const reviewerName = 'Reviewer One'
      
      const task: ModerationTask = {
        id: taskId,
        photoId: 'photo-1',
        petId: 'pet-1',
        ownerId: 'user-1',
        priority: 'high',
        status: 'in_progress',
        createdAt: new Date().toISOString()
      }
      
      const photo: PhotoRecord = {
        id: 'photo-1',
        petId: 'pet-1',
        ownerId: 'user-1',
        status: 'awaiting_review',
        originalUrl: 'url1',
        variants: [],
        metadata: {
          fileHash: 'hash1',
          contentFingerprint: 'fp1',
          originalFilename: 'photo1.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1024,
          width: 1920,
          height: 1080,
          exifStripped: true
        },
        safetyCheck: {
          isNSFW: false,
          isViolent: false,
          hasHumanFaces: false,
          humanFaceCount: 0,
          humanFaceDominance: 0,
          isDuplicate: false,
          confidence: {
            nsfw: 0,
            violence: 0,
            animal: 1,
            humanFace: 0
          },
          flags: [],
          scannedAt: new Date().toISOString()
        },
        uploadedAt: new Date().toISOString()
      }
      
      vi.mocked(adminAPI.moderatePhoto).mockRejectedValueOnce(new Error('API error'))
      mockStorageGet.mockResolvedValueOnce([task])
      mockStorageGet.mockResolvedValueOnce([photo])
      mockStorageGet.mockResolvedValueOnce(DEFAULT_POLICY)
      mockStorageGet.mockResolvedValueOnce([]) // audit logs
      mockStorageGet.mockResolvedValueOnce([]) // events
      
      await moderationService.makeDecision(
        taskId,
        'approve',
        undefined,
        undefined,
        reviewerId,
        reviewerName
      )
      
      expect(mockStorageSet).toHaveBeenCalled()
    })

    it('should reject photo successfully', async () => {
      const taskId = 'task-1'
      const reviewerId = 'reviewer-1'
      const reviewerName = 'Reviewer One'
      
      const task: ModerationTask = {
        id: taskId,
        photoId: 'photo-1',
        petId: 'pet-1',
        ownerId: 'user-1',
        priority: 'high',
        status: 'in_progress',
        createdAt: new Date().toISOString()
      }
      
      const photo: PhotoRecord = {
        id: 'photo-1',
        petId: 'pet-1',
        ownerId: 'user-1',
        status: 'awaiting_review',
        originalUrl: 'url1',
        variants: [],
        metadata: {
          fileHash: 'hash1',
          contentFingerprint: 'fp1',
          originalFilename: 'photo1.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1024,
          width: 1920,
          height: 1080,
          exifStripped: true
        },
        safetyCheck: {
          isNSFW: false,
          isViolent: false,
          hasHumanFaces: false,
          humanFaceCount: 0,
          humanFaceDominance: 0,
          isDuplicate: false,
          confidence: {
            nsfw: 0,
            violence: 0,
            animal: 1,
            humanFace: 0
          },
          flags: [],
          scannedAt: new Date().toISOString()
        },
        uploadedAt: new Date().toISOString()
      }
      
      vi.mocked(adminAPI.moderatePhoto).mockRejectedValueOnce(new Error('API error'))
      mockStorageGet.mockResolvedValueOnce([task])
      mockStorageGet.mockResolvedValueOnce([photo])
      mockStorageGet.mockResolvedValueOnce(DEFAULT_POLICY)
      mockStorageGet.mockResolvedValueOnce([]) // audit logs
      mockStorageGet.mockResolvedValueOnce([]) // events
      
      await moderationService.makeDecision(
        taskId,
        'reject',
        'inappropriate_content',
        'Content violates policy',
        reviewerId,
        reviewerName
      )
      
      expect(mockStorageSet).toHaveBeenCalled()
    })

    it('should hold photo for KYC when required', async () => {
      const taskId = 'task-1'
      const reviewerId = 'reviewer-1'
      const reviewerName = 'Reviewer One'
      
      const policy: PolicyConfig = {
        ...DEFAULT_POLICY,
        requireKYCToPublish: true
      }
      
      const task: ModerationTask = {
        id: taskId,
        photoId: 'photo-1',
        petId: 'pet-1',
        ownerId: 'user-1',
        priority: 'high',
        status: 'in_progress',
        createdAt: new Date().toISOString()
      }
      
      const photo: PhotoRecord = {
        id: 'photo-1',
        petId: 'pet-1',
        ownerId: 'user-1',
        status: 'awaiting_review',
        originalUrl: 'url1',
        variants: [],
        metadata: {
          fileHash: 'hash1',
          contentFingerprint: 'fp1',
          originalFilename: 'photo1.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1024,
          width: 1920,
          height: 1080,
          exifStripped: true
        },
        safetyCheck: {
          isNSFW: false,
          isViolent: false,
          hasHumanFaces: false,
          humanFaceCount: 0,
          humanFaceDominance: 0,
          isDuplicate: false,
          confidence: {
            nsfw: 0,
            violence: 0,
            animal: 1,
            humanFace: 0
          },
          flags: [],
          scannedAt: new Date().toISOString()
        },
        uploadedAt: new Date().toISOString()
      }
      
      vi.mocked(adminAPI.moderatePhoto).mockRejectedValueOnce(new Error('API error'))
      mockStorageGet.mockResolvedValueOnce([task])
      mockStorageGet.mockResolvedValueOnce([photo])
      mockStorageGet.mockResolvedValueOnce(policy)
      mockAPIClientGet.mockResolvedValueOnce({ data: { status: 'unverified' } })
      mockStorageGet.mockResolvedValueOnce([]) // audit logs
      mockStorageGet.mockResolvedValueOnce([]) // events
      
      await moderationService.makeDecision(
        taskId,
        'approve',
        undefined,
        undefined,
        reviewerId,
        reviewerName
      )
      
      expect(mockStorageSet).toHaveBeenCalled()
    })

    it('should throw error when task not found', async () => {
      vi.mocked(adminAPI.moderatePhoto).mockRejectedValueOnce(new Error('API error'))
      mockStorageGet.mockResolvedValueOnce([]) // tasks
      
      await expect(
        moderationService.makeDecision(
          'invalid-task',
          'approve',
          undefined,
          undefined,
          'reviewer-1',
          'Reviewer'
        )
      ).rejects.toThrow('Task not found')
    })

    it('should throw error when photo not found', async () => {
      const task: ModerationTask = {
        id: 'task-1',
        photoId: 'photo-1',
        petId: 'pet-1',
        ownerId: 'user-1',
        priority: 'high',
        status: 'in_progress',
        createdAt: new Date().toISOString()
      }
      
      vi.mocked(adminAPI.moderatePhoto).mockRejectedValueOnce(new Error('API error'))
      mockStorageGet.mockResolvedValueOnce([task]) // tasks
      mockStorageGet.mockResolvedValueOnce([]) // photos
      
      await expect(
        moderationService.makeDecision(
          'task-1',
          'approve',
          undefined,
          undefined,
          'reviewer-1',
          'Reviewer'
        )
      ).rejects.toThrow('Photo not found')
    })
  })

  describe('getMetrics', () => {
    it('should return metrics from API', async () => {
      const metrics: ModerationMetrics = {
        totalReviews: 10,
        approvalRate: 0.8,
        rejectionRate: 0.2,
        averageReviewTime: 5000,
        queueBacklog: 5,
        topRejectReasons: [],
        reviewsByReviewer: [],
        kycPassRate: 0.9,
        duplicateRate: 0.1
      }
      
      mockAPIClientGet.mockResolvedValueOnce({ data: metrics })
      
      const result = await moderationService.getMetrics()
      
      expect(result).toEqual(metrics)
    })

    it('should calculate metrics from local storage', async () => {
      const tasks: ModerationTask[] = [
        {
          id: 'task-1',
          photoId: 'photo-1',
          petId: 'pet-1',
          ownerId: 'user-1',
          priority: 'high',
          status: 'completed',
          createdAt: new Date().toISOString(),
          startedAt: new Date(Date.now() - 120000).toISOString(),
          completedAt: new Date(Date.now() - 60000).toISOString(),
          assignedTo: 'reviewer-1',
          decision: {
            action: 'approve',
            reason: undefined,
            reasonText: undefined,
            reviewerId: 'reviewer-1',
            reviewerName: 'Reviewer',
            reviewedAt: new Date().toISOString(),
            requiresKYC: false
          }
        },
        {
          id: 'task-2',
          photoId: 'photo-2',
          petId: 'pet-2',
          ownerId: 'user-2',
          priority: 'medium',
          status: 'completed',
          createdAt: new Date().toISOString(),
          startedAt: new Date(Date.now() - 180000).toISOString(),
          completedAt: new Date(Date.now() - 60000).toISOString(),
          assignedTo: 'reviewer-1',
          decision: {
            action: 'reject',
            reason: 'inappropriate_content',
            reasonText: 'Inappropriate',
            reviewerId: 'reviewer-1',
            reviewerName: 'Reviewer',
            reviewedAt: new Date().toISOString(),
            requiresKYC: false
          }
        },
        {
          id: 'task-3',
          photoId: 'photo-3',
          petId: 'pet-3',
          ownerId: 'user-3',
          priority: 'low',
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      ]
      
      const photos: PhotoRecord[] = [
        {
          id: 'photo-1',
          petId: 'pet-1',
          ownerId: 'user-1',
          status: 'approved',
          originalUrl: 'url1',
          variants: [],
          metadata: {
            fileHash: 'hash1',
            contentFingerprint: 'fp1',
            originalFilename: 'photo1.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1024,
            width: 1920,
            height: 1080,
            exifStripped: true
          },
          safetyCheck: {
            isNSFW: false,
            isViolent: false,
            hasHumanFaces: false,
            humanFaceCount: 0,
            humanFaceDominance: 0,
            isDuplicate: false,
            confidence: {
              nsfw: 0,
              violence: 0,
              animal: 1,
              humanFace: 0
            },
            flags: [],
            scannedAt: new Date().toISOString()
          },
          uploadedAt: new Date().toISOString()
        },
        {
          id: 'photo-2',
          petId: 'pet-2',
          ownerId: 'user-2',
          status: 'rejected',
          originalUrl: 'url2',
          variants: [],
          metadata: {
            fileHash: 'hash2',
            contentFingerprint: 'fp2',
            originalFilename: 'photo2.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1024,
            width: 1920,
            height: 1080,
            exifStripped: true
          },
          safetyCheck: {
            isNSFW: false,
            isViolent: false,
            hasHumanFaces: false,
            humanFaceCount: 0,
            humanFaceDominance: 0,
            isDuplicate: true,
            confidence: {
              nsfw: 0,
              violence: 0,
              animal: 1,
              humanFace: 0
            },
            flags: [],
            scannedAt: new Date().toISOString()
          },
          uploadedAt: new Date().toISOString()
        }
      ]
      
      const kycSessions: KYCSession[] = [
        {
          id: 'session-1',
          userId: 'user-1',
          status: 'verified',
          provider: 'manual',
          documents: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          retryCount: 0
        },
        {
          id: 'session-2',
          userId: 'user-2',
          status: 'rejected',
          provider: 'manual',
          documents: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          retryCount: 0
        }
      ]
      
      mockAPIClientGet.mockRejectedValueOnce(new Error('API error'))
      mockStorageGet.mockReset()
      mockStorageGet.mockResolvedValueOnce(tasks)
      mockStorageGet.mockResolvedValueOnce(kycSessions)
      mockStorageGet.mockResolvedValueOnce(photos)
      
      const result = await moderationService.getMetrics()
      
      expect(result.totalReviews).toBe(2)
      expect(result.approvalRate).toBe(0.5)
      expect(result.rejectionRate).toBe(0.5)
      expect(result.averageReviewTime).toBe(90000)
      expect(result.queueBacklog).toBe(1)
      expect(result.kycPassRate).toBe(0.5)
      expect(result.duplicateRate).toBe(0.5)
      expect(result.topRejectReasons).toHaveLength(1)
      expect(result.reviewsByReviewer).toHaveLength(1)
    })
  })
})

describe('KYCService', () => {
  let kycService: KYCService
  let mockStorageGet: ReturnType<typeof vi.fn>
  let mockStorageSet: ReturnType<typeof vi.fn>
  let mockAPIClientGet: ReturnType<typeof vi.fn>
  let mockAPIClientPost: ReturnType<typeof vi.fn>
  let mockAPIClientPatch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    kycService = new KYCService()
    mockStorageGet = vi.mocked(storage.get)
    mockStorageSet = vi.mocked(storage.set)
    mockAPIClientGet = vi.mocked(APIClient.get)
    mockAPIClientPost = vi.mocked(APIClient.post)
    mockAPIClientPatch = vi.mocked(APIClient.patch)
    
    vi.clearAllMocks()
    mockStorageGet.mockResolvedValue(null)
    mockStorageSet.mockResolvedValue(undefined)
    mockAPIClientGet.mockResolvedValue({ data: null })
    mockAPIClientPost.mockResolvedValue({ data: null })
    mockAPIClientPatch.mockResolvedValue({ data: null })
  })

  describe('createSession', () => {
    it('should create KYC session successfully', async () => {
      const userId = 'user-123'
      
      vi.mocked(kycAPI.createSession).mockRejectedValueOnce(new Error('API error'))
      mockStorageGet.mockResolvedValueOnce([])
      
      const session = await kycService.createSession(userId)
      
      expect(session).toBeDefined()
      expect(session.userId).toBe(userId)
      expect(session.status).toBe('pending')
      expect(session.provider).toBe('manual')
      expect(mockStorageSet).toHaveBeenCalled()
    })

    it('should handle API failure gracefully', async () => {
      const userId = 'user-123'
      
      vi.mocked(kycAPI.createSession).mockRejectedValueOnce(new Error('API error'))
      mockStorageGet.mockResolvedValueOnce([])
      
      const session = await kycService.createSession(userId)
      
      expect(session).toBeDefined()
      expect(session.userId).toBe(userId)
    })
  })

  describe('getUserSession', () => {
    it('should return user session from API', async () => {
      const userId = 'user-123'
      const session: KYCSession = {
        id: 'session-1',
        userId,
        status: 'verified',
        provider: 'manual',
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        retryCount: 0
      }
      
      vi.mocked(kycAPI.getSession).mockResolvedValueOnce(session as unknown as KYCSession)
      
      const result = await kycService.getUserSession(userId)
      
      expect(result).toEqual(session)
    })

    it('should return latest session from local storage', async () => {
      const userId = 'user-123'
      const sessions: KYCSession[] = [
        {
          id: 'session-1',
          userId,
          status: 'pending',
          provider: 'manual',
          documents: [],
          createdAt: new Date(Date.now() - 10000).toISOString(),
          updatedAt: new Date(Date.now() - 10000).toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          retryCount: 0
        },
        {
          id: 'session-2',
          userId,
          status: 'verified',
          provider: 'manual',
          documents: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          retryCount: 0
        }
      ]
      
      vi.mocked(kycAPI.getSession).mockRejectedValueOnce(new Error('API error'))
      mockStorageGet.mockReset()
      mockStorageGet.mockResolvedValueOnce(sessions)
      
      const result = await kycService.getUserSession(userId)
      
      expect(result).toBeDefined()
      expect(result?.id).toBe('session-2')
      expect(result?.status).toBe('verified')
    })

    it('should return null when no session exists', async () => {
      const userId = 'user-123'
      
      vi.mocked(kycAPI.getSession).mockRejectedValueOnce(new Error('API error'))
      mockStorageGet.mockResolvedValueOnce([])
      
      const result = await kycService.getUserSession(userId)
      
      expect(result).toBeNull()
    })
  })

  describe('updateSession', () => {
    it('should update session successfully', async () => {
      const sessionId = 'session-1'
      const session: KYCSession = {
        id: sessionId,
        userId: 'user-123',
        status: 'pending',
        provider: 'manual',
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        retryCount: 0
      }
      
      const sessions: KYCSession[] = [session]
      mockAPIClientPatch.mockRejectedValueOnce(new Error('API error'))
      mockStorageGet.mockReset()
      mockStorageGet.mockResolvedValueOnce(sessions)
      
      await kycService.updateSession(sessionId, { status: 'verified' })
      
      expect(mockStorageSet).toHaveBeenCalled()
    })

    it('should throw error when session not found', async () => {
      mockAPIClientPatch.mockRejectedValueOnce(new Error('API error'))
      mockStorageGet.mockReset()
      mockStorageGet.mockResolvedValueOnce([])
      
      await expect(kycService.updateSession('invalid-session', { status: 'verified' })).rejects.toThrow('Session not found')
    })
  })

  describe('verifySession', () => {
    it('should verify session successfully', async () => {
      const sessionId = 'session-1'
      const reviewerId = 'reviewer-1'
      
      const session: KYCSession = {
        id: sessionId,
        userId: 'user-123',
        status: 'pending',
        provider: 'manual',
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        retryCount: 0
      }
      
      const photos: PhotoRecord[] = [
        {
          id: 'photo-1',
          petId: 'pet-1',
          ownerId: 'user-123',
          status: 'held_for_kyc',
          originalUrl: 'url1',
          variants: [],
          metadata: {
            fileHash: 'hash1',
            contentFingerprint: 'fp1',
            originalFilename: 'photo1.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1024,
            width: 1920,
            height: 1080,
            exifStripped: true
          },
          safetyCheck: {
            isNSFW: false,
            isViolent: false,
            hasHumanFaces: false,
            humanFaceCount: 0,
            humanFaceDominance: 0,
            isDuplicate: false,
            confidence: {
              nsfw: 0,
              violence: 0,
              animal: 1,
              humanFace: 0
            },
            flags: [],
            scannedAt: new Date().toISOString()
          },
          uploadedAt: new Date().toISOString()
        }
      ]
      
      vi.mocked(adminAPI.reviewKYC).mockRejectedValueOnce(new Error('API error'))
      mockStorageGet.mockResolvedValueOnce([session])
      mockStorageGet.mockResolvedValueOnce([]) // audit logs
      mockStorageGet.mockResolvedValueOnce(photos)
      mockStorageGet.mockResolvedValueOnce([]) // events
      
      await kycService.verifySession(sessionId, reviewerId)
      
      expect(mockStorageSet).toHaveBeenCalled()
    })

    it('should throw error when session not found', async () => {
      vi.mocked(adminAPI.reviewKYC).mockRejectedValueOnce(new Error('API error'))
      mockStorageGet.mockResolvedValueOnce([])
      
      await expect(kycService.verifySession('invalid-session', 'reviewer-1')).rejects.toThrow('Session not found')
    })
  })

  describe('rejectSession', () => {
    it('should reject session successfully', async () => {
      const sessionId = 'session-1'
      const reviewerId = 'reviewer-1'
      const reason: KYCRejectReason = 'blurry_document'
      const reasonText = 'Document is blurry'
      
      const session: KYCSession = {
        id: sessionId,
        userId: 'user-123',
        status: 'pending',
        provider: 'manual',
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        retryCount: 0
      }
      
      vi.mocked(adminAPI.reviewKYC).mockRejectedValueOnce(new Error('API error'))
      mockStorageGet.mockResolvedValueOnce([session])
      mockStorageGet.mockResolvedValueOnce([]) // audit logs
      
      await kycService.rejectSession(sessionId, reason, reasonText, reviewerId)
      
      expect(mockStorageSet).toHaveBeenCalled()
    })

    it('should increment retry count on rejection', async () => {
      const sessionId = 'session-1'
      const reviewerId = 'reviewer-1'
      const reason: KYCRejectReason = 'blurry_document'
      const reasonText = 'Document is blurry'
      
      const session: KYCSession = {
        id: sessionId,
        userId: 'user-123',
        status: 'pending',
        provider: 'manual',
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        retryCount: 0
      }
      
      const sessions: KYCSession[] = [session]
      vi.mocked(adminAPI.reviewKYC).mockRejectedValueOnce(new Error('API error'))
      mockStorageGet.mockReset()
      mockStorageGet.mockResolvedValueOnce(sessions)
      mockStorageGet.mockResolvedValueOnce([]) // audit logs
      
      await kycService.rejectSession(sessionId, reason, reasonText, reviewerId)
      
      const callArgs = mockStorageSet.mock.calls[0]
      const updatedSessions = callArgs?.[1] as KYCSession[]
      const updatedSession = updatedSessions?.[0]
      
      expect(updatedSession?.retryCount).toBe(1)
    })

    it('should throw error when session not found', async () => {
      vi.mocked(adminAPI.reviewKYC).mockRejectedValueOnce(new Error('API error'))
      mockStorageGet.mockResolvedValueOnce([])
      
      await expect(
        kycService.rejectSession('invalid-session', 'blurry_document', 'Reason', 'reviewer-1')
      ).rejects.toThrow('Session not found')
    })
  })
})


import { generateULID } from './utils'
import { parseLLMError } from './llm-utils'
import { createLogger } from './logger'

const logger = createLogger('BackendServices')
import type {
  PhotoRecord,
  PhotoStatus,
  ModerationTask,
  ModerationDecision,
  ModerationAction,
  ModerationReason,
  KYCSession,
  KYCStatus,
  KYCRejectReason,
  UploadSession,
  PolicyConfig,
  AuditLog,
  UserQuota,
  NotificationPayload,
  EventPayload,
  ModerationMetrics,
  ModerationQueue
} from './backend-types'

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

export class PhotoService {
  private async getPolicy(): Promise<PolicyConfig> {
    const stored = await window.spark.kv.get<PolicyConfig>('moderation-policy')
    return stored || DEFAULT_POLICY
  }

  async createUploadSession(userId: string, petId: string): Promise<UploadSession> {
    await this.checkUserQuota(userId)

    const session: UploadSession = {
      id: generateULID(),
      userId,
      petId,
      uploadUrl: `/api/upload/${generateULID()}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      maxFileSize: 10 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    const sessions = await window.spark.kv.get<UploadSession[]>('upload-sessions') || []
    sessions.push(session)
    await window.spark.kv.set('upload-sessions', sessions)

    return session
  }

  async processUpload(sessionId: string, file: { size: number; type: string; data: string }): Promise<PhotoRecord> {
    const sessions = await window.spark.kv.get<UploadSession[]>('upload-sessions') || []
    const session = sessions.find(s => s.id === sessionId)

    if (!session || session.status !== 'pending') {
      throw new Error('Invalid or expired upload session')
    }

    if (new Date(session.expiresAt) < new Date()) {
      session.status = 'expired'
      await window.spark.kv.set('upload-sessions', sessions)
      throw new Error('Upload session expired')
    }

    const photo: PhotoRecord = {
      id: generateULID(),
      petId: session.petId,
      ownerId: session.userId,
      status: 'pending_upload',
      originalUrl: file.data,
      variants: [],
      metadata: {
        fileHash: await this.hashFile(file.data),
        contentFingerprint: generateULID(),
        originalFilename: `photo_${Date.now()}.jpg`,
        mimeType: file.type,
        fileSize: file.size,
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
          animal: 0,
          humanFace: 0
        },
        flags: [],
        scannedAt: new Date().toISOString()
      },
      uploadedAt: new Date().toISOString()
    }

    const photos = await window.spark.kv.get<PhotoRecord[]>('photo-records') || []
    photos.push(photo)
    await window.spark.kv.set('photo-records', photos)

    session.status = 'completed'
    session.photoId = photo.id
    session.completedAt = new Date().toISOString()
    await window.spark.kv.set('upload-sessions', sessions)

    await this.updateQuota(session.userId, file.size)
    
    this.processPhotoAsync(photo.id)

    return photo
  }

  private async processPhotoAsync(photoId: string) {
    setTimeout(async () => {
      const photos = await window.spark.kv.get<PhotoRecord[]>('photo-records') || []
      const photo = photos.find(p => p.id === photoId)
      if (!photo) return

      photo.status = 'processing'
      await window.spark.kv.set('photo-records', photos)

      await this.runSafetyChecks(photo)

      const policy = await this.getPolicy()
      
      if (this.shouldAutoApprove(photo, policy)) {
        photo.status = 'approved'
        photo.approvedAt = new Date().toISOString()
        await this.emitEvent('photo.processing.completed', { photoId, status: 'approved', auto: true })
      } else {
        photo.status = 'awaiting_review'
        const task = await this.createModerationTask(photo)
        photo.moderationTask = task
        await this.emitEvent('photo.processing.completed', { photoId, status: 'awaiting_review' })
        await this.emitEvent('moderation.task.created', { taskId: task.id, photoId })
      }

      photo.processedAt = new Date().toISOString()
      await window.spark.kv.set('photo-records', photos)

      await this.notifyUser(photo.ownerId, {
        userId: photo.ownerId,
        type: 'photo_processing',
        title: 'Photo uploaded',
        message: photo.status === 'approved' ? 'Your photo has been approved!' : 'Your photo is under review',
        timestamp: new Date().toISOString()
      })
    }, 2000)
  }

  private async runSafetyChecks(photo: PhotoRecord): Promise<void> {
    const prompt = window.spark.llmPrompt`Analyze this pet photo and determine:
1. Is there any NSFW or inappropriate content? (yes/no)
2. Is there violent content? (yes/no)
3. Are there human faces visible? (yes/no)
4. If yes, how many human faces? (number)
5. What percentage of the image is dominated by human faces vs the pet? (0-100)
6. Is this primarily a photo of an animal/pet? (yes/no)
7. If animal, what breed do you think it is?
8. Confidence scores for: NSFW (0-1), Violence (0-1), Animal (0-1), Human Face (0-1)

Return as JSON: {
  isNSFW: boolean,
  isViolent: boolean,
  hasHumanFaces: boolean,
  humanFaceCount: number,
  humanFaceDominance: number (0-1),
  isAnimal: boolean,
  breed: string,
  breedConfidence: number (0-1),
  confidence: { nsfw: number, violence: number, animal: number, humanFace: number },
  flags: string[]
}`

    try {
      const result = await window.spark.llm(prompt, 'gpt-4o-mini', true)
      const analysis = JSON.parse(result)

      photo.safetyCheck = {
        isNSFW: analysis.isNSFW,
        isViolent: analysis.isViolent,
        hasHumanFaces: analysis.hasHumanFaces,
        humanFaceCount: analysis.humanFaceCount,
        humanFaceDominance: analysis.humanFaceDominance,
        isDuplicate: await this.checkDuplicate(photo.metadata.fileHash),
        confidence: analysis.confidence,
        breedInference: analysis.isAnimal ? {
          breed: analysis.breed,
          confidence: analysis.breedConfidence
        } : undefined,
        flags: analysis.flags || [],
        scannedAt: new Date().toISOString()
      }

      if (analysis.isNSFW) photo.safetyCheck.flags.push('nsfw')
      if (analysis.isViolent) photo.safetyCheck.flags.push('violent')
      if (analysis.humanFaceDominance > 0.7) photo.safetyCheck.flags.push('human_dominant')
      if (!analysis.isAnimal) photo.safetyCheck.flags.push('not_animal')

    } catch (error) {
      const errorInfo = parseLLMError(error)
      logger.error('Photo safety check failed', new Error(errorInfo.technicalMessage))
      photo.safetyCheck.flags.push('scan_failed')
    }
  }

  private shouldAutoApprove(photo: PhotoRecord, policy: PolicyConfig): boolean {
    const safety = photo.safetyCheck

    if (safety.isNSFW || safety.isViolent) return false
    if (safety.flags.includes('not_animal')) return false
    if (policy.blockHumanDominantPhotos && safety.humanFaceDominance > policy.humanDominanceThreshold) return false
    if (safety.isDuplicate) return false

    const animalConfidence = safety.confidence.animal
    const nsfwConfidence = safety.confidence.nsfw
    const violenceConfidence = safety.confidence.violence

    const score = animalConfidence * (1 - nsfwConfidence) * (1 - violenceConfidence)
    
    return score >= policy.autoApproveThreshold
  }

  private async checkDuplicate(fileHash: string): Promise<boolean> {
    const photos = await window.spark.kv.get<PhotoRecord[]>('photo-records') || []
    return photos.some(p => p.metadata.fileHash === fileHash && p.status === 'approved')
  }

  private async hashFile(data: string): Promise<string> {
    return `hash_${data.substring(0, 32)}_${Date.now()}`
  }

  private async checkUserQuota(userId: string): Promise<void> {
    const quotas = await window.spark.kv.get<UserQuota[]>('user-quotas') || []
    let quota = quotas.find(q => q.userId === userId)

    const now = new Date()
    const today = now.toISOString().split('T')[0]

    if (!quota || quota.resetAt.split('T')[0] !== today) {
      quota = {
        userId,
        uploadsToday: 0,
        uploadsThisHour: 0,
        totalStorage: 0,
        resetAt: new Date().toISOString()
      }
    }

    const policy = await this.getPolicy()

    if (quota.uploadsToday >= policy.maxUploadsPerDay) {
      throw new Error('Daily upload limit reached')
    }

    if (quota.uploadsThisHour >= policy.maxUploadsPerHour) {
      throw new Error('Hourly upload limit reached')
    }

    if (quota.totalStorage >= policy.maxStoragePerUser) {
      throw new Error('Storage limit reached')
    }
  }

  private async updateQuota(userId: string, fileSize: number): Promise<void> {
    const quotas = await window.spark.kv.get<UserQuota[]>('user-quotas') || []
    let quota = quotas.find(q => q.userId === userId)

    if (!quota) {
      quota = {
        userId,
        uploadsToday: 0,
        uploadsThisHour: 0,
        totalStorage: 0,
        resetAt: new Date().toISOString()
      }
      quotas.push(quota)
    }

    quota.uploadsToday++
    quota.uploadsThisHour++
    quota.totalStorage += fileSize
    quota.lastUploadAt = new Date().toISOString()

    await window.spark.kv.set('user-quotas', quotas)
  }

  async createModerationTask(photo: PhotoRecord): Promise<ModerationTask> {
    const task: ModerationTask = {
      id: generateULID(),
      photoId: photo.id,
      petId: photo.petId,
      ownerId: photo.ownerId,
      priority: this.calculatePriority(photo),
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    const tasks = await window.spark.kv.get<ModerationTask[]>('moderation-tasks') || []
    tasks.push(task)
    await window.spark.kv.set('moderation-tasks', tasks)

    return task
  }

  private calculatePriority(photo: PhotoRecord): 'low' | 'medium' | 'high' {
    const flags = photo.safetyCheck.flags
    
    if (flags.includes('nsfw') || flags.includes('violent')) return 'high'
    if (flags.includes('human_dominant') || flags.includes('not_animal')) return 'medium'
    
    return 'low'
  }

  async getPhotosByStatus(status: PhotoStatus): Promise<PhotoRecord[]> {
    const photos = await window.spark.kv.get<PhotoRecord[]>('photo-records') || []
    return photos.filter(p => p.status === status)
  }

  async getPhotosByOwner(ownerId: string, includeAll: boolean = false): Promise<PhotoRecord[]> {
    const photos = await window.spark.kv.get<PhotoRecord[]>('photo-records') || []
    const userPhotos = photos.filter(p => p.ownerId === ownerId)
    
    if (includeAll) return userPhotos
    
    return userPhotos.filter(p => ['approved', 'pending_upload', 'processing', 'awaiting_review'].includes(p.status))
  }

  async getPublicPhotos(): Promise<PhotoRecord[]> {
    const photos = await window.spark.kv.get<PhotoRecord[]>('photo-records') || []
    return photos.filter(p => p.status === 'approved')
  }

  private async notifyUser(_userId: string, payload: NotificationPayload): Promise<void> {
    const notifications = await window.spark.kv.get<NotificationPayload[]>('user-notifications') || []
    notifications.push(payload)
    await window.spark.kv.set('user-notifications', notifications)
  }

  private async emitEvent(event: string, data: Record<string, unknown>): Promise<void> {
    const eventPayload: EventPayload = {
      event,
      data,
      correlationId: generateULID(),
      timestamp: new Date().toISOString()
    }

    const events = await window.spark.kv.get<EventPayload[]>('system-events') || []
    events.push(eventPayload)
    await window.spark.kv.set('system-events', events)
  }
}

export class ModerationService {

  async getQueue(): Promise<ModerationQueue> {
    const tasks = await window.spark.kv.get<ModerationTask[]>('moderation-tasks') || []
    
    const pending = tasks.filter(t => t.status === 'pending').sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
    
    const inProgress = tasks.filter(t => t.status === 'in_progress')
    const completed = tasks.filter(t => t.status === 'completed')

    const completedWithTimes = completed.filter(t => t.startedAt && t.completedAt)
    const totalReviewTime = completedWithTimes.reduce((sum, t) => {
      const start = new Date(t.startedAt!).getTime()
      const end = new Date(t.completedAt!).getTime()
      return sum + (end - start)
    }, 0)

    return {
      pending,
      inProgress,
      completed,
      totalCount: tasks.length,
      averageReviewTime: completedWithTimes.length > 0 ? totalReviewTime / completedWithTimes.length : 0
    }
  }

  async takeTask(taskId: string, reviewerId: string): Promise<ModerationTask> {
    const tasks = await window.spark.kv.get<ModerationTask[]>('moderation-tasks') || []
    const task = tasks.find(t => t.id === taskId)

    if (!task) throw new Error('Task not found')
    if (task.status !== 'pending') throw new Error('Task already taken')

    task.status = 'in_progress'
    task.assignedTo = reviewerId
    task.startedAt = new Date().toISOString()

    await window.spark.kv.set('moderation-tasks', tasks)

    return task
  }

  async makeDecision(
    taskId: string,
    action: ModerationAction,
    reason: ModerationReason | undefined,
    reasonText: string | undefined,
    reviewerId: string,
    reviewerName: string
  ): Promise<void> {
    const tasks = await window.spark.kv.get<ModerationTask[]>('moderation-tasks') || []
    const task = tasks.find(t => t.id === taskId)

    if (!task) throw new Error('Task not found')

    const photos = await window.spark.kv.get<PhotoRecord[]>('photo-records') || []
    const photo = photos.find(p => p.id === task.photoId)

    if (!photo) throw new Error('Photo not found')

    const policy = await window.spark.kv.get<PolicyConfig>('moderation-policy') || DEFAULT_POLICY

    const decision: ModerationDecision = {
      action,
      reason,
      reasonText,
      reviewerId,
      reviewerName,
      reviewedAt: new Date().toISOString(),
      requiresKYC: false
    }

    task.decision = decision
    task.status = 'completed'
    task.completedAt = new Date().toISOString()

    const oldStatus = photo.status

    switch (action) {
      case 'approve':
        if (policy.requireKYCToPublish) {
          const kycStatus = await this.checkUserKYC(photo.ownerId)
          if (kycStatus !== 'verified') {
            photo.status = 'held_for_kyc'
            decision.requiresKYC = true
            decision.kycReason = 'Policy requires KYC verification before publishing'
            await this.notifyUserKYCRequired(photo.ownerId, photo.id)
          } else {
            photo.status = 'approved'
            photo.approvedAt = new Date().toISOString()
          }
        } else {
          photo.status = 'approved'
          photo.approvedAt = new Date().toISOString()
        }
        break

      case 'reject':
        photo.status = 'rejected'
        photo.rejectedAt = new Date().toISOString()
        break

      case 'hold_for_kyc':
        photo.status = 'held_for_kyc'
        decision.requiresKYC = true
        await this.notifyUserKYCRequired(photo.ownerId, photo.id)
        break

      case 'request_retake':
        photo.status = 'rejected'
        photo.rejectedAt = new Date().toISOString()
        break
    }

    photo.reviewedAt = new Date().toISOString()

    await window.spark.kv.set('moderation-tasks', tasks)
    await window.spark.kv.set('photo-records', photos)

    await this.logAudit({
      id: generateULID(),
      action: `moderation.${action}`,
      resource: 'photo',
      resourceId: photo.id,
      userId: reviewerId,
      userRole: 'moderator',
      userName: reviewerName,
      before: { status: oldStatus },
      after: { status: photo.status },
      reason: reasonText || reason,
      timestamp: new Date().toISOString()
    })

    await this.notifyUserDecision(photo.ownerId, photo, decision)

    const eventName = action === 'approve' ? 'photo.approved' : 
                      action === 'reject' ? 'photo.rejected' :
                      action === 'hold_for_kyc' ? 'photo.held_for_kyc' : 'photo.retake_requested'
    
    await this.emitEvent(eventName, {
      photoId: photo.id,
      petId: photo.petId,
      ownerId: photo.ownerId,
      decision: action,
      reason: reasonText || reason
    })
  }

  private async checkUserKYC(userId: string): Promise<KYCStatus> {
    const sessions = await window.spark.kv.get<KYCSession[]>('kyc-sessions') || []
    const userSessions = sessions.filter(s => s.userId === userId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    if (userSessions.length === 0) return 'unverified'

    const latest = userSessions[0]
    if (!latest) {
      return 'unverified'
    }

    if (latest.expiresAt && new Date(latest.expiresAt) < new Date()) {
      return 'expired'
    }

    return latest.status
  }

  private async notifyUserKYCRequired(userId: string, photoId: string): Promise<void> {
    const notification: NotificationPayload = {
      userId,
      type: 'kyc_required',
      title: 'Verification Required',
      message: 'Please complete identity verification to publish your photo',
      actionUrl: `/profile/kyc`,
      data: { photoId },
      timestamp: new Date().toISOString()
    }

    const notifications = await window.spark.kv.get<NotificationPayload[]>('user-notifications') || []
    notifications.push(notification)
    await window.spark.kv.set('user-notifications', notifications)
  }

  private async notifyUserDecision(userId: string, photo: PhotoRecord, decision: ModerationDecision): Promise<void> {
    const isApproved = decision.action === 'approve' && photo.status === 'approved'

    const notification: NotificationPayload = {
      userId,
      type: isApproved ? 'photo_approved' : 'photo_rejected',
      title: isApproved ? 'Photo Approved!' : 'Photo Review Update',
      message: isApproved 
        ? 'Your photo is now visible to the community'
        : `Your photo was not approved. Reason: ${decision.reasonText || decision.reason}`,
      actionUrl: `/pets/${photo.petId}`,
      data: { photoId: photo.id, decision: decision.action },
      timestamp: new Date().toISOString()
    }

    const notifications = await window.spark.kv.get<NotificationPayload[]>('user-notifications') || []
    notifications.push(notification)
    await window.spark.kv.set('user-notifications', notifications)
  }

  async getMetrics(): Promise<ModerationMetrics> {
    const tasks = await window.spark.kv.get<ModerationTask[]>('moderation-tasks') || []
    const completed = tasks.filter(t => t.status === 'completed')
    
    const approved = completed.filter(t => t.decision?.action === 'approve').length
    const rejected = completed.filter(t => t.decision?.action === 'reject').length
    
    const completedWithTimes = completed.filter(t => t.startedAt && t.completedAt)
    const totalReviewTime = completedWithTimes.reduce((sum, t) => {
      const start = new Date(t.startedAt!).getTime()
      const end = new Date(t.completedAt!).getTime()
      return sum + (end - start)
    }, 0)

    const reasonCounts = new Map<string, number>()
    completed.forEach(t => {
      if (t.decision?.reason) {
        reasonCounts.set(t.decision.reason, (reasonCounts.get(t.decision.reason) || 0) + 1)
      }
    })

    const reviewerCounts = new Map<string, number>()
    completed.forEach(t => {
      if (t.assignedTo) {
        reviewerCounts.set(t.assignedTo, (reviewerCounts.get(t.assignedTo) || 0) + 1)
      }
    })

    const kycSessions = await window.spark.kv.get<KYCSession[]>('kyc-sessions') || []
    const verifiedKYC = kycSessions.filter(s => s.status === 'verified').length
    const kycPassRate = kycSessions.length > 0 ? verifiedKYC / kycSessions.length : 0

    const photos = await window.spark.kv.get<PhotoRecord[]>('photo-records') || []
    const duplicates = photos.filter(p => p.safetyCheck.isDuplicate).length
    const duplicateRate = photos.length > 0 ? duplicates / photos.length : 0

    return {
      totalReviews: completed.length,
      approvalRate: completed.length > 0 ? approved / completed.length : 0,
      rejectionRate: completed.length > 0 ? rejected / completed.length : 0,
      averageReviewTime: completedWithTimes.length > 0 ? totalReviewTime / completedWithTimes.length : 0,
      queueBacklog: tasks.filter(t => t.status === 'pending').length,
      topRejectReasons: Array.from(reasonCounts.entries())
        .map(([reason, count]) => ({ reason: reason as ModerationReason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      reviewsByReviewer: Array.from(reviewerCounts.entries())
        .map(([reviewerId, count]) => ({ reviewerId, count }))
        .sort((a, b) => b.count - a.count),
      kycPassRate,
      duplicateRate
    }
  }

  private async logAudit(log: AuditLog): Promise<void> {
    const logs = await window.spark.kv.get<AuditLog[]>('audit-logs') || []
    logs.push(log)
    await window.spark.kv.set('audit-logs', logs)
  }

  private async emitEvent(event: string, data: Record<string, unknown>): Promise<void> {
    const eventPayload: EventPayload = {
      event,
      data,
      correlationId: generateULID(),
      timestamp: new Date().toISOString()
    }

    const events = await window.spark.kv.get<EventPayload[]>('system-events') || []
    events.push(eventPayload)
    await window.spark.kv.set('system-events', events)
  }
}

export class KYCService {

  async createSession(userId: string): Promise<KYCSession> {
    const session: KYCSession = {
      id: generateULID(),
      userId,
      status: 'pending',
      provider: 'manual',
      documents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      retryCount: 0
    }

    const sessions = await window.spark.kv.get<KYCSession[]>('kyc-sessions') || []
    sessions.push(session)
    await window.spark.kv.set('kyc-sessions', sessions)

    return session
  }

  async getUserSession(userId: string): Promise<KYCSession | null> {
    const sessions = await window.spark.kv.get<KYCSession[]>('kyc-sessions') || []
    const userSessions = sessions.filter(s => s.userId === userId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return userSessions[0] || null
  }

  async updateSession(sessionId: string, updates: Partial<KYCSession>): Promise<void> {
    const sessions = await window.spark.kv.get<KYCSession[]>('kyc-sessions') || []
    const session = sessions.find(s => s.id === sessionId)

    if (!session) throw new Error('Session not found')

    Object.assign(session, updates)
    session.updatedAt = new Date().toISOString()

    await window.spark.kv.set('kyc-sessions', sessions)
  }

  async verifySession(sessionId: string, reviewerId: string): Promise<void> {
    const sessions = await window.spark.kv.get<KYCSession[]>('kyc-sessions') || []
    const session = sessions.find(s => s.id === sessionId)

    if (!session) throw new Error('Session not found')

    const oldStatus = session.status
    session.status = 'verified'
    session.verifiedAt = new Date().toISOString()
    session.updatedAt = new Date().toISOString()

    await window.spark.kv.set('kyc-sessions', sessions)

    await this.logAudit({
      id: generateULID(),
      action: 'kyc.verified',
      resource: 'kyc_session',
      resourceId: sessionId,
      userId: reviewerId,
      userRole: 'admin',
      userName: 'Admin',
      before: { status: oldStatus },
      after: { status: 'verified' },
      timestamp: new Date().toISOString()
    })

    await this.releaseHeldPhotos(session.userId)

    const notification: NotificationPayload = {
      userId: session.userId,
      type: 'kyc_approved',
      title: 'Verification Complete',
      message: 'Your identity has been verified. Your photos are now published!',
      timestamp: new Date().toISOString()
    }

    const notifications = await window.spark.kv.get<NotificationPayload[]>('user-notifications') || []
    notifications.push(notification)
    await window.spark.kv.set('user-notifications', notifications)
  }

  async rejectSession(sessionId: string, reason: KYCRejectReason, reasonText: string, reviewerId: string): Promise<void> {
    const sessions = await window.spark.kv.get<KYCSession[]>('kyc-sessions') || []
    const session = sessions.find(s => s.id === sessionId)

    if (!session) throw new Error('Session not found')

    const oldStatus = session.status
    session.status = 'rejected'
    session.rejectedAt = new Date().toISOString()
    session.rejectReason = reason
    session.rejectReasonText = reasonText
    session.retryCount++
    session.updatedAt = new Date().toISOString()

    await window.spark.kv.set('kyc-sessions', sessions)

    await this.logAudit({
      id: generateULID(),
      action: 'kyc.rejected',
      resource: 'kyc_session',
      resourceId: sessionId,
      userId: reviewerId,
      userRole: 'admin',
      userName: 'Admin',
      before: { status: oldStatus },
      after: { status: 'rejected', reason, reasonText },
      timestamp: new Date().toISOString()
    })

    const notification: NotificationPayload = {
      userId: session.userId,
      type: 'kyc_rejected',
      title: 'Verification Incomplete',
      message: `Verification failed: ${reasonText}. Please try again.`,
      actionUrl: '/profile/kyc',
      timestamp: new Date().toISOString()
    }

    const notifications = await window.spark.kv.get<NotificationPayload[]>('user-notifications') || []
    notifications.push(notification)
    await window.spark.kv.set('user-notifications', notifications)
  }

  private async releaseHeldPhotos(userId: string): Promise<void> {
    const photos = await window.spark.kv.get<PhotoRecord[]>('photo-records') || []
    const heldPhotos = photos.filter(p => p.ownerId === userId && p.status === 'held_for_kyc')

    for (const photo of heldPhotos) {
      photo.status = 'approved'
      photo.approvedAt = new Date().toISOString()

      await this.emitEvent('photo.approved', {
        photoId: photo.id,
        petId: photo.petId,
        ownerId: photo.ownerId,
        releasedFromKYC: true
      })
    }

    await window.spark.kv.set('photo-records', photos)
  }

  private async logAudit(log: AuditLog): Promise<void> {
    const logs = await window.spark.kv.get<AuditLog[]>('audit-logs') || []
    logs.push(log)
    await window.spark.kv.set('audit-logs', logs)
  }

  private async emitEvent(event: string, data: Record<string, unknown>): Promise<void> {
    const eventPayload: EventPayload = {
      event,
      data,
      correlationId: generateULID(),
      timestamp: new Date().toISOString()
    }

    const events = await window.spark.kv.get<EventPayload[]>('system-events') || []
    events.push(eventPayload)
    await window.spark.kv.set('system-events', events)
  }
}

export const photoService = new PhotoService()
export const moderationService = new ModerationService()
export const kycService = new KYCService()

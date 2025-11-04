import type {
  Post,
  Comment,
  Reaction,
  PostFilters,
  CreatePostData,
  CreateCommentData,
  ReportData,
  PostStatus,
  ReactionEmoji
} from '../community-types'
import type { Report } from '../contracts'
import { generateULID } from '../utils'

/**
 * Community Feed API Service
 * Implements REST API endpoints as specified:
 * POST /community/posts
 * GET  /community/feed?cursor=...
 * POST /community/posts/:id/react
 * POST /community/posts/:id/comments
 * POST /community/posts/:id/report
 */
export class CommunityAPI {
  private async getPosts(): Promise<Post[]> {
    return await spark.kv.get<Post[]>('community-posts') || []
  }

  private async setPosts(posts: Post[]): Promise<void> {
    await spark.kv.set('community-posts', posts)
  }

  private async getComments(): Promise<Comment[]> {
    return await spark.kv.get<Comment[]>('community-comments') || []
  }

  private async setComments(comments: Comment[]): Promise<void> {
    await spark.kv.set('community-comments', comments)
  }

  private async getReactions(): Promise<Reaction[]> {
    return await spark.kv.get<Reaction[]>('community-reactions') || []
  }

  private async setReactions(reactions: Reaction[]): Promise<void> {
    await spark.kv.set('community-reactions', reactions)
  }

  private async getReports(): Promise<Report[]> {
    return await spark.kv.get<Report[]>('community-reports') || []
  }

  private async setReports(reports: Report[]): Promise<void> {
    await spark.kv.set('community-reports', reports)
  }

  /**
   * POST /community/posts
   * Create a new post (pre-upload NSFW filter, profanity check)
   * Content moderation must be performed before calling this method
   */
  async createPost(
    data: CreatePostData & {
      authorId: string
      authorName: string
      authorAvatar?: string
      nsfwScore?: number
      contentFingerprint?: string
      requiresReview?: boolean
    }
  ): Promise<Post> {
    const posts = await this.getPosts()
    
    // Check for duplicate content using fingerprint
    if (data.contentFingerprint) {
      const existingFingerprints = new Set(
        posts
          .filter(p => p.contentFingerprint)
          .map(p => p.contentFingerprint!)
      )
      
      if (existingFingerprints.has(data.contentFingerprint)) {
        throw new Error('Duplicate content detected. This post appears to be identical to an existing post.')
      }
    }
    
    // Determine status based on moderation results
    // If content requires review or has high NSFW score, set to pending_review
    const status: Post['status'] = 
      data.requiresReview || (data.nsfwScore !== undefined && data.nsfwScore > 0.7)
        ? 'pending_review'
        : 'active'
    
    const post: Post = {
      id: generateULID(),
      authorId: data.authorId,
      authorName: data.authorName,
      authorAvatar: data.authorAvatar,
      kind: data.kind,
      text: data.text,
      media: data.media, // Should be stripped of EXIF before storage
      tags: data.tags,
      location: data.location,
      visibility: data.visibility,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      viewsCount: 0,
      reactionsCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      featured: false,
      nsfwScore: data.nsfwScore,
      contentFingerprint: data.contentFingerprint
    }

    posts.push(post)
    await this.setPosts(posts)
    
    // Log content creation with moderation results
    const logger = await import('../logger').then(m => m.createLogger('CommunityAPI'))
    logger.info('Post created', {
      postId: post.id,
      authorId: post.authorId,
      status: post.status,
      nsfwScore: post.nsfwScore,
      requiresReview: post.status === 'pending_review',
      contentFingerprint: post.contentFingerprint
    })
    
    return post
  }

  /**
   * Get all content fingerprints for duplicate detection
   */
  async getContentFingerprints(): Promise<Set<string>> {
    const posts = await this.getPosts()
    return new Set(
      posts
        .filter(p => p.contentFingerprint)
        .map(p => p.contentFingerprint!)
    )
  }

  /**
   * Get all posts (for moderation queue)
   * Public method to access posts
   */
  async getAllPosts(): Promise<Post[]> {
    return await this.getPosts()
  }

  /**
   * GET /community/feed?cursor=...
   * Query posts with filters and pagination
   */
  async queryFeed(
    filters?: PostFilters,
    userId?: string
  ): Promise<{ posts: Post[]; nextCursor?: string; total: number }> {
    let posts = await this.getPosts()
    
    // Filter by status - only show active posts
    posts = posts.filter(p => p.status === 'active')

    if (filters) {
      if (filters.kind && filters.kind.length > 0) {
        posts = posts.filter(p => filters.kind!.includes(p.kind))
      }

      if (filters.authorId) {
        posts = posts.filter(p => p.authorId === filters.authorId)
      }

      if (filters.tags && filters.tags.length > 0) {
        posts = posts.filter(p =>
          p.tags && filters.tags!.some(tag => p.tags!.includes(tag))
        )
      }

      if (filters.location) {
        posts = posts.filter(p => {
          if (!p.location?.lat || !p.location?.lon) return false
          const distance = this.calculateDistance(
            filters.location!.lat,
            filters.location!.lon,
            p.location.lat,
            p.location.lon
          )
          return distance <= filters.location!.radiusKm
        })
      }

      if (filters.visibility && filters.visibility.length > 0) {
        posts = posts.filter(p => filters.visibility!.includes(p.visibility))
      } else {
        // Default: show public and matches if user logged in
        if (userId) {
          posts = posts.filter(p => p.visibility === 'public' || p.visibility === 'matches')
        } else {
          posts = posts.filter(p => p.visibility === 'public')
        }
      }

      if (filters.featured) {
        posts = posts.filter(p => p.featured)
      }

      // Sort
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'recent':
            posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            break
          case 'popular':
            posts.sort((a, b) => {
              const scoreA = ((a.reactionsCount ?? 0) * 2) + (a.commentsCount ?? 0) + ((a.sharesCount ?? 0) * 3)
              const scoreB = ((b.reactionsCount ?? 0) * 2) + (b.commentsCount ?? 0) + ((b.sharesCount ?? 0) * 3)
              return scoreB - scoreA
            })
            break
          case 'trending':
            // Combine recency with engagement
            const now = Date.now()
            posts.sort((a, b) => {
              const ageA = now - new Date(a.createdAt).getTime()
              const ageB = now - new Date(b.createdAt).getTime()
              const scoreA = (((a.reactionsCount ?? 0) * 2) + (a.commentsCount ?? 0) + ((a.sharesCount ?? 0) * 3)) / (ageA / 3600000) // Per hour
              const scoreB = (((b.reactionsCount ?? 0) * 2) + (b.commentsCount ?? 0) + ((b.sharesCount ?? 0) * 3)) / (ageB / 3600000)
              return scoreB - scoreA
            })
            break
        }
      } else {
        // Default: featured first, then recent
        posts.sort((a, b) => {
          if (a.featured && !b.featured) return -1
          if (!a.featured && b.featured) return 1
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
      }
    } else {
      // Default sort: featured first, then recent
      posts.sort((a, b) => {
        if (a.featured && !b.featured) return -1
        if (!a.featured && b.featured) return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    }

    const total = posts.length
    const limit = filters?.limit || 20
    const startIndex = filters?.cursor ? parseInt(filters.cursor, 10) : 0
    const endIndex = startIndex + limit
    const paginated = posts.slice(startIndex, endIndex)
    const nextCursor = endIndex < total ? endIndex.toString() : undefined

    return {
      posts: paginated,
      nextCursor,
      total
    }
  }

  /**
   * GET /community/posts/:id
   */
  async getPostById(id: string): Promise<Post | null> {
    const posts = await this.getPosts()
    const post = posts.find(p => p.id === id)
    
    if (post && post.status === 'active') {
      // Increment view count
      await this.incrementViewCount(id)
    }
    
    return post || null
  }

  /**
   * POST /community/posts/:id/react
   * Add or remove reaction
   */
  async toggleReaction(
    postId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    emoji: ReactionEmoji
  ): Promise<{ added: boolean; reactionsCount: number }> {
    const reactions = await this.getReactions()
    const posts = await this.getPosts()
    
    const existingIndex = reactions.findIndex(
      r => r.postId === postId && r.userId === userId && r.emoji === emoji
    )

    const postIndex = posts.findIndex(p => p.id === postId)
    if (postIndex === -1) {
      throw new Error('Post not found')
    }

    const post = posts[postIndex]
    if (!post) {
      throw new Error('Post not found')
    }

    if (existingIndex >= 0) {
      // Remove reaction
      reactions.splice(existingIndex, 1)
      post.reactionsCount = Math.max(0, (post.reactionsCount ?? 0) - 1)
      await this.setReactions(reactions)
      await this.setPosts(posts)
      return { added: false, reactionsCount: post.reactionsCount ?? 0 }
    } else {
      // Add reaction
      const reaction: Reaction = {
        id: generateULID(),
        postId,
        userId,
        userName,
        userAvatar,
        emoji,
        createdAt: new Date().toISOString()
      }
      reactions.push(reaction)
      post.reactionsCount = (post.reactionsCount ?? 0) + 1
      await this.setReactions(reactions)
      await this.setPosts(posts)
      return { added: true, reactionsCount: post.reactionsCount ?? 0 }
    }
  }

  /**
   * POST /community/posts/:id/comments
   * Create a comment
   */
  async createComment(
    data: CreateCommentData & {
      authorId: string
      authorName: string
      authorAvatar?: string
    }
  ): Promise<Comment> {
    const comments = await this.getComments()
    const posts = await this.getPosts()
    
    // Verify post exists and is active
    const post = posts.find(p => p.id === data.postId)
    if (!post) {
      throw new Error('Post not found')
    }
    if (post.status !== 'active') {
      throw new Error('Cannot comment on inactive post')
    }

    // NOTE: Rate limiting should be implemented server-side (max 50 comments per hour)
    
    const comment: Comment = {
      id: generateULID(),
      postId: data.postId,
      authorId: data.authorId,
      authorName: data.authorName,
      authorAvatar: data.authorAvatar,
      text: data.text,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentCommentId: data.parentCommentId,
      reactionsCount: 0
    }

    comments.push(comment)
    await this.setComments(comments)

    // Increment post comments count
    const postIndex = posts.findIndex(p => p.id === data.postId)
    if (postIndex !== -1) {
      const postToUpdate = posts[postIndex]
      if (postToUpdate) {
        postToUpdate.commentsCount = (postToUpdate.commentsCount ?? 0) + 1
        await this.setPosts(posts)
      }
    }

    return comment
  }

  /**
   * GET /community/posts/:id/comments
   */
  async getPostComments(postId: string): Promise<Comment[]> {
    const comments = await this.getComments()
    return comments
      .filter(c => c.postId === postId && c.status === 'active')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }

  /**
   * POST /community/posts/:id/report
   * Report a post or comment
   */
  async reportContent(
    data: ReportData & { reporterId: string }
  ): Promise<void> {
    const reports = await this.getReports()
    
    // Map ReportData to Report from contracts.ts
    const report: Report = {
      id: generateULID(),
      reporterId: data.reporterId,
      reportedEntityType: data.resourceType === 'user' ? 'user' : data.resourceType === 'post' ? 'pet' : 'message',
      reportedEntityId: data.resourceId,
      reason: (data.reason as 'spam' | 'inappropriate' | 'fake' | 'harassment' | 'other') || 'other',
      details: data.details || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    reports.push(report)
    await this.setReports(reports)
    
    // Report is now available in moderation queue via getReportsForModeration()
  }
  
  /**
   * Get reports for moderation queue
   */
  async getReportsForModeration(
    filters?: {
      status?: Report['status'][]
      entityType?: Report['reportedEntityType'][]
      limit?: number
    }
  ): Promise<Report[]> {
    const reports = await this.getReports()
    
    let filtered = reports
    
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        filtered = filtered.filter(r => filters.status!.includes(r.status))
      }
      
      if (filters.entityType && filters.entityType.length > 0) {
        filtered = filtered.filter(r => filters.entityType!.includes(r.reportedEntityType))
      }
    }
    
    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit)
    }
    
    return filtered
  }

  /**
   * Admin: Get pending posts
   */
  async getPendingPosts(): Promise<Post[]> {
    const posts = await this.getPosts()
    return posts
      .filter(p => p.status === 'pending_review')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }

  /**
   * Admin: Update post status
   */
  async updatePostStatus(
    postId: string,
    status: PostStatus,
    adminId: string,
    reason?: string
  ): Promise<Post> {
    const posts = await this.getPosts()
    const index = posts.findIndex(p => p.id === postId)
    
    if (index === -1) {
      throw new Error('Post not found')
    }

    const post = posts[index]
    if (!post) {
      throw new Error('Post not found')
    }

    post.status = status
    post.updatedAt = new Date().toISOString()

    if (status === 'active') {
      post.approvedAt = new Date().toISOString()
      post.approvedBy = adminId
      post.rejectedAt = undefined
      post.rejectionReason = undefined
    } else if (status === 'rejected') {
      post.rejectedAt = new Date().toISOString()
      post.rejectionReason = reason
    }

    await this.setPosts(posts)
    
    // Log moderation action
    const logger = await import('../logger').then(m => m.createLogger('CommunityAPI'))
    logger.info('Post status updated', {
      postId,
      oldStatus: post.status,
      newStatus: status,
      adminId,
      reason
    })
    
    return post
  }

  // Helper methods

  private async incrementViewCount(postId: string): Promise<void> {
    const posts = await this.getPosts()
    const index = posts.findIndex(p => p.id === postId)
    
    if (index !== -1) {
      const post = posts[index]
      if (post) {
        post.viewsCount = (post.viewsCount ?? 0) + 1
        await this.setPosts(posts)
      }
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth radius in km
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}

export const communityAPI = new CommunityAPI()


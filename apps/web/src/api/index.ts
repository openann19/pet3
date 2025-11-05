/**
 * API Services Index
 * Centralized exports for all API services
 */

export { adoptionAPI } from './adoption-api'
export { lostFoundAPI } from './lost-found-api'
export { communityAPI } from './community-api'
export { liveStreamingAPI } from './live-streaming-api'
export { matchingAPI } from './matching-api'

// Re-export types
export type {
  AdoptionListing,
  AdoptionApplication,
  AdoptionListingFilters,
  CreateAdoptionListingData,
  AdoptionListingStatus,
  AdoptionApplicationStatus
} from '@/lib/adoption-marketplace-types'

export type {
  LostAlert,
  Sighting,
  LostAlertFilters,
  CreateLostAlertData,
  CreateSightingData,
} from '@/lib/lost-found-types'
export type { LostAlertStatus } from '@/core/domain/lost-found'

export type {
  Post,
  Comment,
  Reaction,
  CommentReaction,
  PostFilters,
  CreatePostData,
  CreateCommentData,
  ReportData,
  PostKind,
  PostVisibility,
  ReactionEmoji
} from '@/lib/community-types'
export type { PostStatus, CommentStatus } from '@/core/domain/community'

export type {
  LiveStream,
  LiveStreamViewer,
  LiveStreamReaction,
  LiveStreamChatMessage,
  CreateLiveStreamData,
  LiveStreamFilters,
  LiveStreamStatus,
  LiveStreamCategory
} from '@/lib/live-streaming-types'

